#!/usr/bin/env pwsh
# Extract one task's full text from an implementation plan.
# Usage: ./task-brief.ps1 PLAN_FILE TASK_NUMBER [OUTFILE]
# Default OUTFILE: <repo-root>/.superpowers/sdd/<plan-basename>/task-<N>-brief.md

$ErrorActionPreference = "Stop"

if ($args.Count -lt 2 -or $args.Count -gt 3) {
    Write-Error "usage: task-brief.ps1 PLAN_FILE TASK_NUMBER [OUTFILE]"
    exit 2
}

$plan = $args[0]
$taskNumber = $args[1]
if (-not (Test-Path -LiteralPath $plan -PathType Leaf)) {
    Write-Error "no such plan file: $plan"
    exit 2
}

if ($args.Count -eq 3) {
    $out = $args[2]
} else {
    $scriptDir = Split-Path -Parent $PSCommandPath
    $dir = (& (Join-Path $scriptDir "sdd-workspace.ps1") $plan).Trim()
    $out = Join-Path $dir "task-$taskNumber-brief.md"
}

$inFence = $false
$inTask = $false
$pattern = "^#+[ \t]+Task[ \t]+$([regex]::Escape($taskNumber))([^0-9]|$)"
$selected = New-Object System.Collections.Generic.List[string]

foreach ($line in [System.IO.File]::ReadLines((Resolve-Path -LiteralPath $plan).Path)) {
    if ($line -match '^```') {
        $inFence = -not $inFence
    }
    if (-not $inFence -and $line -match '^#+[ \t]+Task[ \t]+[0-9]+') {
        $inTask = ($line -match $pattern)
    }
    if ($inTask) {
        $selected.Add($line)
    }
}

Set-Content -Path $out -Value $selected -Encoding utf8
if ((-not (Test-Path -LiteralPath $out)) -or ((Get-Item -LiteralPath $out).Length -eq 0)) {
    Write-Error "task $taskNumber not found in $plan (no heading matching 'Task $taskNumber')"
    exit 3
}

$lineCount = ($selected | Measure-Object).Count
Write-Output "wrote ${out}: $lineCount lines"
