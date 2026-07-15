#!/usr/bin/env pwsh
# Start the brainstorm server and output connection info.
# Usage: ./start-server.ps1 [--project-dir <path>] [--host <bind-host>] [--url-host <display-host>] [--foreground] [--background]

$ErrorActionPreference = "Stop"

function Write-JsonError {
    param([string]$Message)
    [pscustomobject]@{ error = $Message } | ConvertTo-Json -Compress
}

function New-ServerId {
    $bytes = New-Object byte[] 24
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $rng.GetBytes($bytes)
    } finally {
        $rng.Dispose()
    }
    -join ($bytes | ForEach-Object { $_.ToString("x2") })
}

function Set-ProcessEnvironment {
    param([hashtable]$Values)
    foreach ($key in $Values.Keys) {
        Set-Item -Path "Env:$key" -Value ([string]$Values[$key])
    }
}

function Protect-PathForCurrentUser {
    param([string]$Path)
    if ([System.Environment]::OSVersion.Platform -ne [System.PlatformID]::Win32NT) {
        return
    }
    try {
        $item = Get-Item -LiteralPath $Path -ErrorAction Stop
        $acl = Get-Acl -LiteralPath $item.FullName
        $acl.SetAccessRuleProtection($true, $false)
        $identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
        $rights = [System.Security.AccessControl.FileSystemRights]::FullControl
        if ($item.PSIsContainer) {
            $inheritance = [System.Security.AccessControl.InheritanceFlags]"ContainerInherit,ObjectInherit"
        } else {
            $inheritance = [System.Security.AccessControl.InheritanceFlags]::None
        }
        $propagation = [System.Security.AccessControl.PropagationFlags]::None
        $rule = [System.Security.AccessControl.FileSystemAccessRule]::new(
            $identity,
            $rights,
            $inheritance,
            $propagation,
            [System.Security.AccessControl.AccessControlType]::Allow
        )
        $acl.SetAccessRule($rule)
        Set-Acl -LiteralPath $item.FullName -AclObject $acl
    } catch {
        # Best-effort parity with the Unix helper's umask 077.
    }
}

$scriptDir = Split-Path -Parent $PSCommandPath
$projectDir = ""
$foreground = $false
$forceBackground = $false
$bindHost = "127.0.0.1"
$urlHost = ""
$idleTimeoutMinutes = ""

for ($i = 0; $i -lt $args.Count; $i++) {
    switch ($args[$i]) {
        "--project-dir" {
            $i++
            if ($i -ge $args.Count) { Write-JsonError "Missing value for --project-dir"; exit 1 }
            $projectDir = $args[$i]
        }
        "--host" {
            $i++
            if ($i -ge $args.Count) { Write-JsonError "Missing value for --host"; exit 1 }
            $bindHost = $args[$i]
        }
        "--url-host" {
            $i++
            if ($i -ge $args.Count) { Write-JsonError "Missing value for --url-host"; exit 1 }
            $urlHost = $args[$i]
        }
        "--idle-timeout-minutes" {
            $i++
            if ($i -ge $args.Count) { Write-JsonError "Missing value for --idle-timeout-minutes"; exit 1 }
            $idleTimeoutMinutes = $args[$i]
        }
        "--open" {
            $env:BRAINSTORM_OPEN = "1"
        }
        { $_ -eq "--foreground" -or $_ -eq "--no-daemon" } {
            $foreground = $true
        }
        { $_ -eq "--background" -or $_ -eq "--daemon" } {
            $forceBackground = $true
        }
        default {
            Write-JsonError "Unknown argument: $($args[$i])"
            exit 1
        }
    }
}

if ($urlHost -eq "") {
    if ($bindHost -eq "127.0.0.1" -or $bindHost -eq "localhost") {
        $urlHost = "localhost"
    } else {
        $urlHost = $bindHost
    }
}

if ($idleTimeoutMinutes -ne "") {
    $parsedIdle = 0
    if ((-not [int]::TryParse($idleTimeoutMinutes, [ref]$parsedIdle)) -or $parsedIdle -lt 1) {
        Write-JsonError "--idle-timeout-minutes must be a positive integer"
        exit 1
    }
    $env:BRAINSTORM_IDLE_TIMEOUT_MS = [string]($parsedIdle * 60 * 1000)
}

if ($env:CODEX_CI -and -not $foreground -and -not $forceBackground) {
    $foreground = $true
}

$sessionId = "$PID-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
$brainstormRoot = ""
if ($projectDir -ne "") {
    $brainstormRoot = Join-Path $projectDir ".superpowers/brainstorm"
    $sessionDir = Join-Path $brainstormRoot $sessionId
    $env:BRAINSTORM_PORT_FILE = Join-Path $brainstormRoot ".last-port"
    $env:BRAINSTORM_TOKEN_FILE = Join-Path $brainstormRoot ".last-token"
} else {
    $sessionDir = Join-Path ([System.IO.Path]::GetTempPath()) "brainstorm-$sessionId"
}

$stateDir = Join-Path $sessionDir "state"
$contentDir = Join-Path $sessionDir "content"
$pidFile = Join-Path $stateDir "server.pid"
$logFile = Join-Path $stateDir "server.log"
$serverIdFile = Join-Path $stateDir "server-instance-id"

New-Item -ItemType Directory -Force -Path $contentDir, $stateDir | Out-Null
if ($brainstormRoot -ne "") {
    Protect-PathForCurrentUser -Path $brainstormRoot
}
Protect-PathForCurrentUser -Path $sessionDir
Protect-PathForCurrentUser -Path $contentDir
Protect-PathForCurrentUser -Path $stateDir

$serverId = New-ServerId
Set-Content -Path $serverIdFile -Value $serverId -NoNewline -Encoding utf8
Protect-PathForCurrentUser -Path $serverIdFile

if (Test-Path -LiteralPath $pidFile) {
    $oldPid = (Get-Content -LiteralPath $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
    if ($oldPid) {
        Stop-Process -Id ([int]$oldPid) -ErrorAction SilentlyContinue
    }
    Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
}

$envValues = @{
    BRAINSTORM_DIR = $sessionDir
    BRAINSTORM_HOST = $bindHost
    BRAINSTORM_URL_HOST = $urlHost
    BRAINSTORM_OWNER_PID = ""
    BRAINSTORM_PORT_FILE = $env:BRAINSTORM_PORT_FILE
    BRAINSTORM_TOKEN_FILE = $env:BRAINSTORM_TOKEN_FILE
    BRAINSTORM_IDLE_TIMEOUT_MS = $env:BRAINSTORM_IDLE_TIMEOUT_MS
    BRAINSTORM_OPEN = $env:BRAINSTORM_OPEN
}

if ($foreground) {
    foreach ($key in $envValues.Keys) {
        Set-Item -Path "Env:$key" -Value ([string]$envValues[$key])
    }
    $psi = [System.Diagnostics.ProcessStartInfo]::new()
    $psi.FileName = "node"
    $psi.WorkingDirectory = $scriptDir
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $false
    $psi.RedirectStandardError = $false
    $psi.Arguments = "server.cjs --brainstorm-server-id=$serverId"
    $process = [System.Diagnostics.Process]::new()
    $process.StartInfo = $psi
    $null = $process.Start()
    Set-Content -Path $pidFile -Value ([string]$process.Id) -NoNewline -Encoding ascii
    Protect-PathForCurrentUser -Path $pidFile
    try {
        $process.WaitForExit()
        exit $process.ExitCode
    } finally {
        Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
    }
}

Set-ProcessEnvironment -Values $envValues
$errFile = Join-Path $stateDir "server.err"
$process = Start-Process `
    -FilePath "node" `
    -ArgumentList @("server.cjs", "--brainstorm-server-id=$serverId") `
    -WorkingDirectory $scriptDir `
    -RedirectStandardOutput $logFile `
    -RedirectStandardError $errFile `
    -PassThru
Set-Content -Path $pidFile -Value ([string]$process.Id) -NoNewline -Encoding ascii
Protect-PathForCurrentUser -Path $pidFile

$deadline = (Get-Date).AddSeconds(5)
$reported = $false
while ((Get-Date) -lt $deadline) {
    if ($process.HasExited) {
        Write-JsonError "Server exited before startup"
        exit 1
    }

    Start-Sleep -Milliseconds 100
    $infoFile = Join-Path $stateDir "server-info"
    if (Test-Path -LiteralPath $infoFile) {
        Get-Content -LiteralPath $infoFile | Select-Object -First 1
        $reported = $true
        break
    }
}

if (-not $reported) {
    Write-JsonError "Server failed to start within 5 seconds"
    exit 1
}
