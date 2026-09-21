#!/usr/bin/env pwsh
# Tests for skills/executing-plans/scripts/task-start.ps1
# Mirrors tests/executing-plans/test-task-start.sh (sh/ps1 symmetry).
$ErrorActionPreference = "Stop"
. "$PSScriptRoot/common.ps1"

$scriptPath = Resolve-Path (Join-Path $PSScriptRoot "../../skills/executing-plans/scripts/task-start.ps1")
$root = New-TestRoot
try {
    $repo = New-TestRepo -Root $root
    Add-Commit -Repo $repo -RelativePath "README.md" -Content "test repo" -Message "initial commit"
    $plan = Join-Path $repo "plan.md"
    @'
# Implementation Plan

## Task 1

Do task one.

- [ ] write the test
- [ ] implement

## Task 2

Do task two.
'@ | Set-Content -Path $plan -Encoding utf8

    Push-Location $repo
    try {
        # 1. usage error: too few arguments
        & $scriptPath $plan > $null 2>&1
        Assert-ExitCode $LASTEXITCODE 2 "single arg exits 2"

        # 2. missing plan file propagates task-brief's exit 2
        & $scriptPath (Join-Path $repo "nope.md") 1 > $null 2>&1
        Assert-ExitCode $LASTEXITCODE 2 "missing plan exits 2"

        # 3. task not found propagates task-brief's exit 3
        & $scriptPath $plan 9 > $null 2>&1
        Assert-ExitCode $LASTEXITCODE 3 "missing task exits 3"

        # 4. happy path: prints the brief path and the full HEAD SHA
        $out = @(& $scriptPath $plan 1)
        Assert-ExitCode $LASTEXITCODE 0 "task 1 exits 0"
        $text = $out -join "`n"
        # The workspace resolves the physical path (macOS /tmp is a symlink),
        # so verify the shape and read the reported path back instead of
        # comparing against the un-resolved temp root.
        Assert-True ($text -match '(?m)^brief: (.*)$') "prints brief path line"
        $briefPath = $Matches[1]
        $head = (& git rev-parse HEAD).Trim()
        Assert-True ($text -match "(?m)^base: $([regex]::Escape($head))$") "prints base SHA line"
        Assert-True (($briefPath -replace '\\', '/') -match '\.superpowers/sdd/plan/task-1-brief\.md$') "brief lands in plan-scoped workspace"
        Assert-True (Test-Path -LiteralPath $briefPath) "brief file written to plan-scoped workspace"
    }
    finally {
        Pop-Location
    }
}
finally {
    Remove-TestRoot -Root $root
}
Test-Summary -Suite "task-start.ps1"
