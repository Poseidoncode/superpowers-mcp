#!/usr/bin/env pwsh
# Shared assertions and fixtures for the superpowers PowerShell script tests.
# Dot-source this file from each test-*.ps1 (not named test-*.ps1 itself so
# the runner does not execute it directly); call Test-Summary at the end.

$script:PS1_TEST_PASSES = 0
$script:PS1_TEST_FAILURES = 0

function Pass {
    param([string]$Name)
    $script:PS1_TEST_PASSES++
    Write-Host "  [PASS] $Name"
}

function Fail {
    param([string]$Name)
    $script:PS1_TEST_FAILURES++
    Write-Host "  [FAIL] $Name"
}

function Assert-True {
    param([bool]$Condition, [string]$Name)
    if ($Condition) { Pass $Name } else { Fail $Name }
}

function Assert-False {
    param([bool]$Condition, [string]$Name)
    if (-not $Condition) { Pass $Name } else { Fail $Name }
}

function Assert-ExitCode {
    param([int]$Actual, [int]$Expected, [string]$Name)
    if ($Actual -eq $Expected) { Pass $Name } else { Fail "$Name (expected exit $Expected, got $Actual)" }
}

function New-TestRoot {
    # One scratch directory per test file; removed by Remove-TestRoot.
    $root = Join-Path ([System.IO.Path]::GetTempPath()) ("superpowers-ps1-test-" + [guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Path $root | Out-Null
    return $root
}

function Remove-TestRoot {
    param([string]$Root)
    if ($Root -and (Test-Path -LiteralPath $Root)) {
        Remove-Item -LiteralPath $Root -Recurse -Force -ErrorAction SilentlyContinue
    }
}

function New-TestRepo {
    # A throwaway git repository so SDD scripts resolve a real toplevel
    # without touching the superpowers repo itself.
    param([string]$Root)
    $repo = Join-Path $Root "repo"
    New-Item -ItemType Directory -Path $repo | Out-Null
    & git -C $repo init -q | Out-Null
    & git -C $repo config user.email "tests@example.com" | Out-Null
    & git -C $repo config user.name "Superpowers Tests" | Out-Null
    return $repo
}

function Add-Commit {
    param([string]$Repo, [string]$RelativePath, [string]$Content, [string]$Message)
    $file = Join-Path $Repo $RelativePath
    New-Item -ItemType Directory -Path (Split-Path -Parent $file) -Force | Out-Null
    Set-Content -Path $file -Value $Content -NoNewline
    & git -C $Repo add -A | Out-Null
    & git -C $Repo commit -q -m $Message | Out-Null
}

function Test-Summary {
    param([string]$Suite)
    Write-Host ""
    Write-Host "${Suite}: $script:PS1_TEST_PASSES passed, $script:PS1_TEST_FAILURES failed"
    if ($script:PS1_TEST_FAILURES -gt 0) { exit 1 }
    exit 0
}
