#!/usr/bin/env pwsh
# Stop the brainstorm server and clean up.
# Usage: ./stop-server.ps1 <session_dir>

$ErrorActionPreference = "Stop"

if ($args.Count -ne 1) {
    [pscustomobject]@{ error = "Usage: stop-server.ps1 <session_dir>" } | ConvertTo-Json -Compress
    exit 1
}

$sessionDir = $args[0]
$stateDir = Join-Path $sessionDir "state"
$pidFile = Join-Path $stateDir "server.pid"
$serverIdFile = Join-Path $stateDir "server-instance-id"

function Mark-Stopped {
    param([string]$Reason)
    Remove-Item -LiteralPath (Join-Path $stateDir "server-info") -Force -ErrorAction SilentlyContinue
    [pscustomobject]@{
        reason = $Reason
        timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    } | ConvertTo-Json -Compress | Set-Content -Path (Join-Path $stateDir "server-stopped") -Encoding utf8
}

function Read-ExpectedServerId {
    if (-not (Test-Path -LiteralPath $serverIdFile)) { return $null }
    $id = (Get-Content -LiteralPath $serverIdFile -Raw).Trim()
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
    # Unix: ps -p prints the full command line, e.g.
    # node ... server.cjs --brainstorm-server-id=<id>; the id is validated
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

if (Test-Path -LiteralPath $pidFile) {
    $pidText = (Get-Content -LiteralPath $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
    $serverPid = 0
    $startToken = $null
    if ([int]::TryParse($pidText, [ref]$serverPid) -and (Test-BrainstormServer -ProcessId $serverPid)) {
        $startToken = Get-ProcessStartToken -ProcessId $serverPid
    }
    if (-not $startToken -or -not (Test-BrainstormServer -ProcessId $serverPid) -or
        ((Get-ProcessStartToken -ProcessId $serverPid) -ne $startToken)) {
        Remove-Item -LiteralPath $pidFile, $serverIdFile -Force -ErrorAction SilentlyContinue
        Mark-Stopped "stale_pid"
        [pscustomobject]@{ status = "stale_pid" } | ConvertTo-Json -Compress
        exit 0
    }

    # Re-check identity immediately before signalling to narrow the PID-reuse
    # window as much as shell-level process management permits.
    if (-not (Test-BrainstormServer -ProcessId $serverPid) -or
        ((Get-ProcessStartToken -ProcessId $serverPid) -ne $startToken)) {
        Remove-Item -LiteralPath $pidFile, $serverIdFile -Force -ErrorAction SilentlyContinue
        Mark-Stopped "stale_pid"
        [pscustomobject]@{ status = "stale_pid" } | ConvertTo-Json -Compress
        exit 0
    }

    Stop-Process -Id $serverPid -ErrorAction SilentlyContinue
    $deadline = (Get-Date).AddSeconds(2)
    while ((Get-Date) -lt $deadline -and (Get-Process -Id $serverPid -ErrorAction SilentlyContinue)) {
        Start-Sleep -Milliseconds 100
    }
    if (Get-Process -Id $serverPid -ErrorAction SilentlyContinue) {
        Stop-Process -Id $serverPid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 100
    }
    if (Get-Process -Id $serverPid -ErrorAction SilentlyContinue) {
        [pscustomobject]@{ status = "failed"; error = "process still running" } | ConvertTo-Json -Compress
        exit 1
    }

    Remove-Item -LiteralPath $pidFile, $serverIdFile, (Join-Path $stateDir "server.log") -Force -ErrorAction SilentlyContinue
    Mark-Stopped "stop-server.ps1"

    $tempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
    if (-not $tempRoot.EndsWith([string][System.IO.Path]::DirectorySeparatorChar)) {
        $tempRoot += [System.IO.Path]::DirectorySeparatorChar
    }
    $resolvedSession = (Resolve-Path -LiteralPath $sessionDir -ErrorAction SilentlyContinue).Path
    if ($resolvedSession) {
        $resolvedSession = [System.IO.Path]::GetFullPath($resolvedSession)
    }
    if ($resolvedSession -and $resolvedSession.StartsWith($tempRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        Remove-Item -LiteralPath $sessionDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    [pscustomobject]@{ status = "stopped" } | ConvertTo-Json -Compress
} else {
    [pscustomobject]@{ status = "not_running" } | ConvertTo-Json -Compress
}
