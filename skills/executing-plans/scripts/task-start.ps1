#!/usr/bin/env pwsh
# Begin one task of an inline plan execution in a single call: extract the
# task's brief (via subagent-driven-development's task-brief, so both skills
# share one workspace) and record BASE, the commit the task's review range is
# cut from. One tool call instead of two, because every call in an inline
# session is a turn that re-reads the whole context.
#
# Usage: ./task-start.ps1 PLAN_FILE TASK_NUMBER
# Prints:
#   brief: <path to the task's brief file>
#   base:  <full SHA of HEAD>

$ErrorActionPreference = "Stop"

if ($args.Count -ne 2) {
    [Console]::Error.WriteLine("usage: task-start.ps1 PLAN_FILE TASK_NUMBER")
    exit 2
}

$plan = $args[0]
$n = $args[1]
$sdd = Join-Path $PSScriptRoot "../../subagent-driven-development/scripts"

$out = @(& (Join-Path $sdd "task-brief.ps1") $plan $n)
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
$brief = $null
foreach ($line in $out) {
    if ($line -match '^wrote (.*): [0-9][0-9]* lines$') { $brief = $Matches[1] }
}
if ([string]::IsNullOrEmpty($brief)) {
    [Console]::Error.WriteLine("task-brief did not report a path: $($out -join [Environment]::NewLine)")
    exit 1
}

Write-Output "brief: $brief"
Write-Output "base: $((& git rev-parse HEAD).Trim())"
