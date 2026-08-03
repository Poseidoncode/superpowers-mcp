#!/usr/bin/env pwsh
# Tests for skills/subagent-driven-development/scripts/task-brief.ps1
$ErrorActionPreference = "Stop"
. "$PSScriptRoot/common.ps1"

$scriptPath = Resolve-Path (Join-Path $PSScriptRoot "../../skills/subagent-driven-development/scripts/task-brief.ps1")
$root = New-TestRoot
try {
    $repo = New-TestRepo -Root $root
    $plan = Join-Path $repo "plan.md"
    @'
# Implementation Plan

## Task 1

```js
const one = 1;
```

Do task one.

## Task 2

Do task two.
'@ | Set-Content -Path $plan -Encoding utf8

    # The SDD scripts derive the workspace from the git toplevel of the
    # current directory, so every invocation must run inside the test repo.
    Push-Location $repo
    try {
        # 1. usage error: too few arguments
        & $scriptPath $plan > $null 2>&1
        Assert-ExitCode $LASTEXITCODE 2 "single arg exits 2"

        # 2. missing plan file
        & $scriptPath (Join-Path $repo "nope.md") 1 > $null 2>&1
        Assert-ExitCode $LASTEXITCODE 2 "missing plan exits 2"

        # 3. task not found exits 3
        & $scriptPath $plan 9 > $null 2>&1
        Assert-ExitCode $LASTEXITCODE 3 "missing task exits 3"

        # 4. happy path: default outfile lands in the plan-scoped workspace
        $out = & $scriptPath $plan 1
        Assert-ExitCode $LASTEXITCODE 0 "task 1 exits 0"
        $expected = Join-Path $repo ".superpowers/sdd/plan/task-1-brief.md"
        Assert-True ((($out | Out-String) -match [regex]::Escape($expected))) "prints default outfile path"
        Assert-True (Test-Path -LiteralPath $expected) "brief file written to plan-scoped workspace"
        $brief = Get-Content -LiteralPath $expected -Raw
        Assert-True ($brief -match "## Task 1") "brief contains Task 1 heading"
        Assert-True ($brief -match "const one = 1") "brief keeps code fence content"
        Assert-True ($brief -notmatch "Do task two") "brief stops at Task 2"

        # 5. explicit outfile
        $custom = Join-Path $root "custom-brief.md"
        & $scriptPath $plan 2 $custom > $null
        Assert-ExitCode $LASTEXITCODE 0 "explicit outfile exits 0"
        Assert-True (Test-Path -LiteralPath $custom) "explicit outfile written"
        $brief2 = Get-Content -LiteralPath $custom -Raw
        Assert-True ($brief2 -match "Do task two") "explicit outfile has task 2 content"
        Assert-True ($brief2 -notmatch "Do task one") "explicit outfile stops at Task 1"
    }
    finally {
        Pop-Location
    }
}
finally {
    Remove-TestRoot -Root $root
}
Test-Summary -Suite "task-brief.ps1"
