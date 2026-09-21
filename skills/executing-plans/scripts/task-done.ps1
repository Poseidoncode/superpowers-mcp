#!/usr/bin/env pwsh
# Close one task of an inline plan execution in a single call: run the task's
# test command, keep its full output in the workspace, print the tail, and —
# only if the command succeeded — append the completion line to the ledger.
# A failing command records nothing: the task is not complete.
#
# Usage: ./task-done.ps1 PLAN_FILE TASK_NUMBER BASE -- TEST_COMMAND [ARGS...]
#   BASE is the SHA task-start printed; the completion line records BASE..HEAD.
# Exit: the test command's exit status.

$ErrorActionPreference = "Stop"

if ($args.Count -lt 4) {
    [Console]::Error.WriteLine("usage: task-done.ps1 PLAN_FILE TASK_NUMBER BASE -- TEST_COMMAND [ARGS...]")
    exit 2
}

$plan = $args[0]
$n = $args[1]
$base = $args[2]
# PowerShell consumes an unquoted `--` as its own end-of-parameters marker,
# so the documented `... BASE -- CMD` arrives here WITHOUT the separator; a
# quoted "--" survives and is skipped below. Unlike the sh twin, this port
# therefore cannot reject a call that genuinely omits the separator.
$cmdArgs = @($args[3..($args.Count - 1)])
if ($cmdArgs[0] -eq "--") {
    if ($cmdArgs.Count -lt 2) {
        [Console]::Error.WriteLine("usage: task-done.ps1 PLAN_FILE TASK_NUMBER BASE -- TEST_COMMAND [ARGS...]")
        exit 2
    }
    $cmdArgs = @($cmdArgs[1..($cmdArgs.Count - 1)])
}
$sdd = Join-Path $PSScriptRoot "../../subagent-driven-development/scripts"

& git rev-parse --verify --quiet $base >$null 2>&1
if ($LASTEXITCODE -ne 0) {
    [Console]::Error.WriteLine("bad BASE: $base")
    exit 2
}

$dir = (& (Join-Path $sdd "sdd-workspace.ps1") $plan | Select-Object -First 1).Trim()
$log = Join-Path $dir "task-$n-tests.log"
$ledger = Join-Path $dir "progress.md"

# Render the command the way a person would type it, for the ledger line.
$parts = foreach ($a in [string[]]$cmdArgs) {
    if ($a -match '[\s";|&]') { "'$a'" } else { $a }
}
$cmd = $parts -join ' '

$rc = 0
try {
    $exe = $cmdArgs[0]
    $rest = @()
    if ($cmdArgs.Count -gt 1) { $rest = $cmdArgs[1..($cmdArgs.Count - 1)] }
    & $exe @rest > $log 2>&1
    $rc = $LASTEXITCODE
} catch {
    $rc = 127
    if (-not (Test-Path -LiteralPath $log -PathType Leaf)) {
        [System.IO.File]::WriteAllText($log, ($_.Exception.Message + [Environment]::NewLine), [System.Text.UTF8Encoding]::new($false))
    }
}

if (Test-Path -LiteralPath $log -PathType Leaf) {
    Get-Content -LiteralPath $log -Tail 5
}
if ($rc -ne 0) {
    [Console]::Error.WriteLine("task-done: test command exited $rc; Task $n NOT recorded (full output: $log)")
    exit $rc
}

$last = Get-Content -LiteralPath $log | Where-Object { $_ -match '\S' } | Select-Object -Last 1
if ([string]::IsNullOrWhiteSpace($last)) { $last = "(no output)" }
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
if (-not (Test-Path -LiteralPath $ledger -PathType Leaf)) {
    [System.IO.File]::WriteAllText($ledger, "# SDD ledger — plan: $plan" + [Environment]::NewLine, $utf8NoBom)
}
$base7 = (& git rev-parse --short=7 $base).Trim()
$head7 = (& git rev-parse --short=7 HEAD).Trim()
$line = "Task ${n}: complete (commits $base7..$head7, tests: $cmd → $last)"
[System.IO.File]::AppendAllText($ledger, $line + [Environment]::NewLine, $utf8NoBom)
Write-Output "ledger: $line"
