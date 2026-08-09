#!/usr/bin/env pwsh
# Tests for skills/brainstorming/scripts/start-server.ps1 and stop-server.ps1
$ErrorActionPreference = "Stop"
. "$PSScriptRoot/common.ps1"

$startScript = Resolve-Path (Join-Path $PSScriptRoot "../../skills/brainstorming/scripts/start-server.ps1")
$stopScript = Resolve-Path (Join-Path $PSScriptRoot "../../skills/brainstorming/scripts/stop-server.ps1")
$root = New-TestRoot
try {
    $projectDir = Join-Path $root "project"
    New-Item -ItemType Directory -Path $projectDir | Out-Null

    # 1. start in background: reports server info, writes session state
    $out = & $startScript --project-dir $projectDir
    Assert-ExitCode $LASTEXITCODE 0 "start-server exits 0"
    $infoLine = ($out | Select-Object -First 1)
    Assert-True ($infoLine -match "url") "server-info line reports a url"

    $brainstormRoot = Join-Path $projectDir ".superpowers/brainstorm"
    $sessionDir = Get-ChildItem -LiteralPath $brainstormRoot -Directory | Select-Object -First 1
    Assert-True ($null -ne $sessionDir) "session dir created under .superpowers/brainstorm"
    $stateDir = Join-Path $sessionDir.FullName "state"
    $pidFile = Join-Path $stateDir "server.pid"
    Assert-True (Test-Path -LiteralPath $pidFile) "server.pid written"
    Assert-True (Test-Path -LiteralPath (Join-Path $stateDir "server-info")) "server-info written"

    # 2. server is actually listening: unauthenticated requests get 403,
    #    and the session key from owner-only server-info redirects to the page.
    $portFile = Join-Path $brainstormRoot ".last-port"
    Assert-True (Test-Path -LiteralPath $portFile) ".last-port written"
    $port = (Get-Content -LiteralPath $portFile -Raw).Trim()
    $rejected = $false
    try {
        Invoke-WebRequest -Uri "http://127.0.0.1:$port/" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop | Out-Null
    }
    catch {
        $rejected = $true
        $status = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { -1 }
        Assert-True ($status -eq 403) "unauthenticated request rejected (403, got $status)"
    }
    Assert-True $rejected "unauthenticated request is rejected"
    $info = Get-Content -LiteralPath (Join-Path $stateDir "server-info") -Raw | ConvertFrom-Json
    $token = ([string]$info.url -split "key=", 2)[1]
    $redirectStatus = 0
    try {
        Invoke-WebRequest -Uri "http://127.0.0.1:$port/?key=$token" -UseBasicParsing -TimeoutSec 5 -MaximumRedirection 0 -ErrorAction Stop | Out-Null
    }
    catch {
        $redirectStatus = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { -1 }
    }
    Assert-True ($redirectStatus -eq 303) "server redirects keyed bootstrap without exposing token to page scripts"
    $tokenFile = Join-Path $brainstormRoot ".last-token"
    Assert-True (Test-Path -LiteralPath $tokenFile) "session key persisted to .last-token"
    Assert-True (((Get-Content -LiteralPath $tokenFile -Raw).Trim()) -eq $token) ".last-token holds the served session key"

    # 3. stop: reports stopped, removes pid file and session dir
    $out = & $stopScript $sessionDir.FullName
    Assert-ExitCode $LASTEXITCODE 0 "stop-server exits 0"
    Assert-True ((($out | Out-String) -match "stopped")) "stop reports status stopped"
    Assert-True (-not (Test-Path -LiteralPath $pidFile)) "pid file removed after stop"
    Assert-True (-not (Test-Path -LiteralPath $sessionDir.FullName)) "session dir cleaned up after stop"

    # 4. stop on a missing session: exits 0, reports not_running
    $out = & $stopScript (Join-Path $root "no-such-session")
    Assert-ExitCode $LASTEXITCODE 0 "stop on missing session exits 0"
    Assert-True ((($out | Out-String) -match "not_running")) "stop on missing session reports not_running"
}
finally {
    Remove-TestRoot -Root $root
}
Test-Summary -Suite "brainstorming server"
