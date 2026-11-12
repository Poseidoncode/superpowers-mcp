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

        # Alphanumeric and dotted IDs are matched whole; a deeper extension
        # remains part of its parent task's brief.
        $idsPlan = Join-Path $repo "task-ids.md"
        @'
## Task 6: Six
Six body.

## Task 6b: Six B
Six B body.

## Task A1: Alpha
Alpha body.

### Task A1a: Alpha child
Alpha child body.

## Task A2: Alpha two
Alpha two body.

## Task 2.1: Dotted
Dotted body.
'@ | Set-Content -LiteralPath $idsPlan -Encoding utf8
        $idOut = Join-Path $root "task-id-brief.md"
        & $scriptPath $idsPlan 6 $idOut > $null
        Assert-ExitCode $LASTEXITCODE 0 "Task 6 brief exits 0"
        $sixBrief = Get-Content -LiteralPath $idOut -Raw
        Assert-True ($sixBrief -match "Six body" -and $sixBrief -notmatch "Six B body") "Task 6 does not prefix-match Task 6b"
        & $scriptPath $idsPlan A1 $idOut > $null
        Assert-ExitCode $LASTEXITCODE 0 "Task A1 brief exits 0"
        $a1Brief = Get-Content -LiteralPath $idOut -Raw
        Assert-True ($a1Brief -match "Alpha child body" -and $a1Brief -notmatch "Alpha two body") "Task A1 includes A1a but stops before A2"
        & $scriptPath $idsPlan 2.1 $idOut > $null
        Assert-ExitCode $LASTEXITCODE 0 "dotted Task 2.1 brief exits 0"
        Assert-True ((Get-Content -LiteralPath $idOut -Raw) -match "Dotted body") "dotted task ID is extracted"

        $openFence = Join-Path $repo "open-fence.md"
        @'
## Task 1: Incomplete
This task is cut off by an unclosed fence.
```markdown
## Task 2: Hidden
'@ | Set-Content -LiteralPath $openFence -Encoding utf8
        $openOutput = Join-Path $root "open-fence-brief.md"
        & $scriptPath $openFence 1 $openOutput *> $null
        Assert-ExitCode $LASTEXITCODE 4 "unclosed fence exits 4"
        Assert-True (-not (Test-Path -LiteralPath $openOutput)) "unclosed-fence brief is not written"

        $hiddenPlan = Join-Path $repo "hidden-task.md"
        @'
# Hidden task plan
```markdown
## Task 1: Hidden
'@ | Set-Content -LiteralPath $hiddenPlan -Encoding utf8
        $hiddenOutput = Join-Path $root "hidden-task-brief.md"
        $hiddenErr = (& pwsh -NoProfile -File "$scriptPath" $hiddenPlan 1 $hiddenOutput 2>&1 | Out-String)
        Assert-ExitCode $LASTEXITCODE 4 "unclosed fence hiding the requested task exits 4"
        Assert-True ($hiddenErr -match "never closes" -and -not (Test-Path -LiteralPath $hiddenOutput)) "hidden task is reported and no incomplete brief is written"

        $translatedPlan = Join-Path $repo "translated-plan.md"
        Set-Content -LiteralPath $translatedPlan -Value "## Tarea 1: Trabajo`nTexto.`n" -NoNewline
        $translatedOutput = Join-Path $root "translated-brief.md"
        $translatedErr = (& pwsh -NoProfile -File "$scriptPath" $translatedPlan 1 $translatedOutput 2>&1 | Out-String)
        Assert-ExitCode $LASTEXITCODE 3 "translated task heading exits 3"
        Assert-True ($translatedErr -match "English word.*Task") "explains that headings use the English word Task"

        Push-Location $root
        try {
            $global:LASTEXITCODE = 0  # the script ends without an explicit exit, so a stale code from the previous child process would leak through
            & $scriptPath -C $repo "plan.md" 1 $custom > $null
            Assert-ExitCode $LASTEXITCODE 0 "-C selects the repository for a relative plan path"
            Assert-True (Test-Path -LiteralPath $custom) "-C writes the task brief"
        }
        finally {
            Pop-Location
        }
    }
    finally {
        Pop-Location
    }
}
finally {
    Remove-TestRoot -Root $root
}
Test-Summary -Suite "task-brief.ps1"
