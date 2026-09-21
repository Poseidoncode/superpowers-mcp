#!/usr/bin/env pwsh
# Tests for skills/executing-plans/scripts/task-done.ps1
# Mirrors tests/executing-plans/test-task-done.sh (sh/ps1 symmetry).
$ErrorActionPreference = "Stop"
. "$PSScriptRoot/common.ps1"

$scriptPath = Resolve-Path (Join-Path $PSScriptRoot "../../skills/executing-plans/scripts/task-done.ps1")
$root = New-TestRoot
try {
    $repo = New-TestRepo -Root $root
    Add-Commit -Repo $repo -RelativePath "README.md" -Content "test repo" -Message "initial commit"
    $plan = Join-Path $repo "plan.md"
    @'
# Implementation Plan

## Task 1

Do task one.

## Task 2

Do task two.
'@ | Set-Content -Path $plan -Encoding utf8
    $ws = Join-Path $repo ".superpowers/sdd/plan"

    Push-Location $repo
    try {
        $base = (& git rev-parse HEAD).Trim()

        # 1. usage errors. (PowerShell eats an unquoted `--`, so unlike the sh
        # twin this port accepts the separator-less form agents actually type;
        # a quoted "--" survives and is skipped.)
        & $scriptPath $plan 1 $base > $null 2>&1
        Assert-ExitCode $LASTEXITCODE 2 "missing command exits 2"
        & $scriptPath $plan 1 $base "--" > $null 2>&1
        Assert-ExitCode $LASTEXITCODE 2 "quoted separator without command exits 2"

        # 2. bad BASE exits 2 without running anything
        & $scriptPath $plan 1 "not-a-sha" -- git status > $null 2>&1
        Assert-ExitCode $LASTEXITCODE 2 "bad BASE exits 2"
        Assert-False (Test-Path -LiteralPath (Join-Path $ws "task-1-tests.log")) "bad BASE writes no log"

        # 3. failing test command: exit status propagates, nothing recorded
        $failOut = @(& $scriptPath $plan 1 $base -- git show no-such-commit-xyz 2>&1)
        Assert-ExitCode $LASTEXITCODE 128 "failing command propagates exit 128"
        $failLog = Join-Path $ws "task-1-tests.log"
        Assert-True (Test-Path -LiteralPath $failLog) "failing run keeps full output in workspace"
        Assert-True (((Get-Content -LiteralPath $failLog -Raw) -match "fatal")) "log holds the failure output"
        Assert-True ((($failOut -join "`n") -match "fatal")) "tail of the failure is printed"
        Assert-False (Test-Path -LiteralPath (Join-Path $ws "progress.md")) "failing run writes no ledger"

        # 3b. a quoted "--" survives PowerShell parsing and is skipped
        & $scriptPath $plan 1 $base "--" git rev-parse HEAD > $null 2>&1
        Assert-ExitCode $LASTEXITCODE 0 "quoted separator form exits 0"

        # 4. happy path: log, printed tail, ledger header + completion line
        $out = @(& $scriptPath $plan 1 $base -- git rev-parse HEAD)
        Assert-ExitCode $LASTEXITCODE 0 "passing command exits 0"
        $text = $out -join "`n"
        Assert-True ($text -match [regex]::Escape($base)) "tail of the passing output is printed"
        $ledger = Join-Path $ws "progress.md"
        $ledgerText = Get-Content -LiteralPath $ledger -Raw
        Assert-True ($ledgerText -match "(?m)^# SDD ledger — plan: ") "ledger created with identity header"
        $base7 = (& git rev-parse --short=7 $base).Trim()
        Assert-True ($ledgerText -match [regex]::Escape("Task 1: complete (commits $base7..$base7, tests: git rev-parse HEAD → $base)")) "completion line records range and result"
        Assert-True ($text -match [regex]::Escape("ledger: Task 1: complete")) "completion line echoed to stdout"

        # 5. second task appends; the header is written once
        & $scriptPath $plan 2 $base -- git rev-parse HEAD > $null
        Assert-ExitCode $LASTEXITCODE 0 "task 2 exits 0"
        $ledgerText2 = Get-Content -LiteralPath $ledger -Raw
        Assert-True ((($ledgerText2 -split "`n" | Where-Object { $_ -match '^# SDD ledger' }).Count) -eq 1) "header written once"
        Assert-True ($ledgerText2 -match "Task 2: complete") "second completion line appended"

        # 6. arguments with spaces render single-quoted in the ledger line
        & $scriptPath $plan 1 $base -- git log "--pretty=format:%H %s" -1 > $null
        Assert-ExitCode $LASTEXITCODE 0 "quoting run exits 0"
        $ledgerText3 = Get-Content -LiteralPath $ledger -Raw
        Assert-True ($ledgerText3 -match [regex]::Escape("'--pretty=format:%H %s'")) "spaced arg single-quoted in ledger"

        # 7. empty-output passing command: exit 0, placeholder in the ledger line
        $pwshBin = (Get-Process -Id $PID).Path
        & $scriptPath $plan 3 $base -- $pwshBin -NoProfile -Command "exit 0" > $null
        Assert-ExitCode $LASTEXITCODE 0 "empty-output command exits 0"
        $ledgerText4 = Get-Content -LiteralPath $ledger -Raw
        Assert-True ($ledgerText4 -match "Task 3: complete") "empty-output run recorded"
        Assert-True ($ledgerText4 -match "→ \(no output\)") "empty output recorded as (no output)"
    }
    finally {
        Pop-Location
    }
}
finally {
    Remove-TestRoot -Root $root
}
Test-Summary -Suite "task-done.ps1"
