#!/usr/bin/env pwsh
# Extract one task's full text from an implementation plan.
# Usage: ./task-brief.ps1 [-C DIR] PLAN_FILE TASK_ID [OUTFILE]
# Default OUTFILE: <repo-root>/.superpowers/sdd/<plan-basename>/task-<ID>-brief.md

$ErrorActionPreference = "Stop"
$scriptArgs = @($args)
$workingDir = (Get-Location).Path
if ($scriptArgs.Count -gt 0 -and $scriptArgs[0] -eq "-C") {
    if ($scriptArgs.Count -lt 2 -or -not (Test-Path -LiteralPath $scriptArgs[1] -PathType Container)) {
        [Console]::Error.WriteLine("bad -C directory: $($scriptArgs[1])")
        exit 2
    }
    $workingDir = (Resolve-Path -LiteralPath $scriptArgs[1]).Path
    if ($scriptArgs.Count -gt 2) { $scriptArgs = @($scriptArgs[2..($scriptArgs.Count - 1)]) } else { $scriptArgs = @() }
}

if ($scriptArgs.Count -lt 2 -or $scriptArgs.Count -gt 3) {
    [Console]::Error.WriteLine("usage: task-brief.ps1 [-C DIR] PLAN_FILE TASK_ID [OUTFILE]")
    exit 2
}

$planArg = $scriptArgs[0]
$taskNumber = [string]$scriptArgs[1]
if ($taskNumber -notmatch '^(?=.*[0-9])[A-Za-z0-9]+(\.[A-Za-z0-9]+)*$') {
    [Console]::Error.WriteLine("usage: task-brief.ps1 [-C DIR] PLAN_FILE TASK_ID [OUTFILE]")
    exit 2
}
$plan = if ([System.IO.Path]::IsPathRooted($planArg)) { $planArg } else { Join-Path $workingDir $planArg }
if (-not (Test-Path -LiteralPath $plan -PathType Leaf)) {
    [Console]::Error.WriteLine("no such plan file: $planArg")
    exit 2
}

if ($scriptArgs.Count -eq 3) {
    $outArg = [string]$scriptArgs[2]
    $out = if ([System.IO.Path]::IsPathRooted($outArg)) { $outArg } else { Join-Path $workingDir $outArg }
} else {
    $scriptDir = Split-Path -Parent $PSCommandPath
    $workspaceScript = Join-Path $scriptDir "sdd-workspace.ps1"
    $workspaceOutput = @(& $workspaceScript -C $workingDir $plan)
    if ($LASTEXITCODE -ne 0 -or $workspaceOutput.Count -eq 0) { exit 2 }
    $dir = ([string]$workspaceOutput[0]).Trim()
    $out = Join-Path $dir "task-$taskNumber-brief.md"
}

$inFence = $false
$inTask = $false
$found = $false
$taskCount = 0
$hiddenTaskHeading = $false
$fenceLine = 0
$level = 0
$selected = New-Object System.Collections.Generic.List[string]
$shapedHeadings = New-Object System.Collections.Generic.List[string]
$lineNumber = 0

foreach ($line in [System.IO.File]::ReadLines((Resolve-Path -LiteralPath $plan).Path)) {
    $lineNumber++
    if ($line -match '^```') {
        $inFence = -not $inFence
        if ($inFence) {
            $fenceLine = $lineNumber
            $hiddenTaskHeading = $false
        }
    }

    if ($inFence -and $line -match '^#+[ \t]+Task[ \t]') {
        $hiddenTaskHeading = $true
    }

    if (-not $inFence -and $line -match '^#+[ \t]+Task[ \t]') {
        $idText = $line -replace '^#+[ \t]+Task[ \t]+', ''
        $idMatch = [regex]::Match($idText, '^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*')
        if ($idMatch.Success -and $idMatch.Value -match '[0-9]') {
            $taskCount++
            $id = $idMatch.Value
            $headingLevel = ([regex]::Match($line, '^#+')).Length
            $isSubtask = $inTask -and $headingLevel -gt $level -and
                $id.StartsWith($taskNumber, [System.StringComparison]::Ordinal) -and
                $id.Length -gt $taskNumber.Length -and
                $id.Substring($taskNumber.Length, 1) -match '[A-Za-z.]'
            if (-not $isSubtask) {
                $inTask = $id -ceq $taskNumber
                $level = $headingLevel
            }
        }
    }

    if (-not $inFence -and $shapedHeadings.Count -lt 5 -and
        $line -match '^#+[ \t]+[^ \t]+[ \t]+[A-Za-z0-9.]*[0-9]') {
        $shapedHeadings.Add($line)
    }

    if ($inTask) {
        $selected.Add($line)
        $found = $true
    }
}

if ($inFence -and $hiddenTaskHeading -and ($inTask -or -not $found)) {
    [Console]::Error.WriteLine("task-brief: the code fence opened at line $fenceLine of $plan never closes, so no Task heading after it can be seen; close that fence in the plan and rerun")
    exit 4
} elseif ($inFence -and $inTask) {
    [Console]::Error.WriteLine("task-brief: warning: the code fence opened at line $fenceLine of $plan never closes; it hides no Task heading, so this brief is complete")
}

if ($taskCount -eq 0 -and $shapedHeadings.Count -gt 0 -and -not ($inFence -and $hiddenTaskHeading)) {
    [Console]::Error.WriteLine('task-brief: no task headings found. Task headings must use the English word "Task" ("### Task 1: ..."), even when the rest of the plan is in another language. Headings shaped like tasks:')
    foreach ($heading in $shapedHeadings) { [Console]::Error.WriteLine("  $heading") }
}

if ($selected.Count -eq 0) {
    [Console]::Error.WriteLine("task $taskNumber not found in $plan (no heading matching 'Task $taskNumber')")
    exit 3
}

$parent = Split-Path -Parent $out
if (-not [string]::IsNullOrEmpty($parent) -and -not (Test-Path -LiteralPath $parent -PathType Container)) {
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
}
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllLines($out, $selected, $utf8NoBom)
Write-Output "wrote ${out}: $($selected.Count) lines"
