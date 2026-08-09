#!/usr/bin/env pwsh
# Start the brainstorm server and output connection info.
# Usage: ./start-server.ps1 [--project-dir <path>] [--host <loopback-host>] [--url-host <loopback-host>] [--foreground] [--background]

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
    $isWindowsPlatform = [System.Environment]::OSVersion.Platform -eq [System.PlatformID]::Win32NT
    try {
        $item = Get-Item -LiteralPath $Path -ErrorAction Stop
        if (-not $isWindowsPlatform) {
            $mode = if ($item.PSIsContainer) { "700" } else { "600" }
            & chmod $mode $item.FullName
            if ($LASTEXITCODE -ne 0) { throw "chmod failed" }
            return
        }
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

function Test-LoopbackHost {
    param([string]$HostValue)
    $normalized = $HostValue.Trim().TrimStart('[').TrimEnd(']').ToLowerInvariant()
    if ($normalized -eq "localhost" -or $normalized -eq "::1" -or $normalized.StartsWith("127.")) {
        return $true
    }
    $address = $null
    if ([System.Net.IPAddress]::TryParse($normalized, [ref]$address)) {
        return [System.Net.IPAddress]::IsLoopback($address)
    }
    return $false
}

if (-not (Test-LoopbackHost $bindHost)) {
    Write-JsonError "Refusing insecure non-loopback HTTP bind; use a TLS reverse proxy or tunnel to 127.0.0.1"
    exit 1
}
if (-not (Test-LoopbackHost $urlHost)) {
    Write-JsonError "--url-host must be a loopback hostname or address"
    exit 1
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
    # Reuse the last bound port and session key so a restart keeps an
    # already-open browser tab connected to the same URL with a valid cookie.
    $env:BRAINSTORM_PORT_FILE = Join-Path $brainstormRoot ".last-port"
    $env:BRAINSTORM_TOKEN_FILE = Join-Path $brainstormRoot ".last-token"
} else {
    $sessionDir = Join-Path ([System.IO.Path]::GetTempPath()) "brainstorm-$sessionId"
    # $env: assignments persist in the invoking pwsh session; a stale project
    # token/port file from an earlier --project-dir run must not leak into an
    # ephemeral session (it would defeat key rotation and could overwrite the
    # project's .last-token).
    Remove-Item Env:BRAINSTORM_TOKEN_FILE, Env:BRAINSTORM_PORT_FILE -ErrorAction SilentlyContinue
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

function Read-ExpectedServerId {
    if (-not (Test-Path -LiteralPath $serverIdFile)) { return $null }
    $id = (Get-Content -LiteralPath $serverIdFile -Raw -ErrorAction SilentlyContinue).Trim()
    if ($id -match '^[A-Za-z0-9_-]{32,64}$') { return $id }
    return $null
}

function Test-BrainstormServer {
    param([int]$ProcessId)
    $expected = Read-ExpectedServerId
    if (-not $expected) { return $false }
    # $IsWindows is undefined on Windows PowerShell 5.1; fall back to the
    # OSVersion check so the Windows branch is taken there too.
    $isWinPlatform = ($IsWindows -or [System.Environment]::OSVersion.Platform -eq [System.PlatformID]::Win32NT)
    if ($isWinPlatform) {
        $process = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue
        if (-not $process) { return $false }
        return ($process.CommandLine -like "*--brainstorm-server-id=$expected*")
    }
    # Unix: ps -p prints the full command line; the id is validated
    # hex above, so no regex escaping is needed.
    $cmd = (& ps -p $ProcessId -o command= 2>$null)
    if (-not $cmd) { return $false }
    return ($cmd -match "--brainstorm-server-id=$expected")
}

function Get-ProcessStartToken {
    param([int]$ProcessId)
    $isWinPlatform = ($IsWindows -or [System.Environment]::OSVersion.Platform -eq [System.PlatformID]::Win32NT)
    if ($isWinPlatform) {
        $process = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue
        if (-not $process) { return $null }
        return [string]$process.CreationDate
    }
    $start = (& ps -p $ProcessId -o lstart= 2>$null)
    if (-not $start) { return $null }
    return (($start | Out-String).Trim())
}

# Kill any existing server — only after proving the PID and its process start
# identity are ours. The final identity re-check narrows the PID-reuse window.
# Must run BEFORE the new server-instance-id below overwrites serverIdFile.
if (Test-Path -LiteralPath $pidFile) {
    $oldPidText = (Get-Content -LiteralPath $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
    $oldPid = 0
    $oldStartToken = $null
    if ([int]::TryParse($oldPidText, [ref]$oldPid) -and (Test-BrainstormServer -ProcessId $oldPid)) {
        $oldStartToken = Get-ProcessStartToken -ProcessId $oldPid
    }
    if ($oldStartToken -and (Test-BrainstormServer -ProcessId $oldPid) -and
        ((Get-ProcessStartToken -ProcessId $oldPid) -eq $oldStartToken)) {
        Stop-Process -Id $oldPid -ErrorAction SilentlyContinue
    } else {
        Write-Warning "stale server.pid ignored: PID is not a running brainstorm server"
    }
    Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
}

# WriteAllText: UTF-8 without BOM on every PowerShell version (PS 5.1's
# Set-Content -Encoding utf8 emits a BOM, which breaks the bash-side
# read_expected_server_id regex when a session dir is shared across shells).
[System.IO.File]::WriteAllText($serverIdFile, $serverId)
Protect-PathForCurrentUser -Path $serverIdFile

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
New-Item -ItemType File -Force -Path $logFile, $errFile | Out-Null
Protect-PathForCurrentUser -Path $logFile
Protect-PathForCurrentUser -Path $errFile
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
