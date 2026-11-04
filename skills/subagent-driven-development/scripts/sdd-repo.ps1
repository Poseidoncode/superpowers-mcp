#!/usr/bin/env pwsh
# Print the top-level directory of the git working tree used by the SDD
# scripts. The current directory chooses the repository, just as it does for
# git; callers may select another checkout with -C DIR.
# --with-commit also requires HEAD to resolve for commands that need a BASE.

$ErrorActionPreference = "Stop"
$scriptArgs = @($args)
$withCommit = $false
$workingDir = (Get-Location).Path
for ($i = 0; $i -lt $scriptArgs.Count; $i++) {
    switch ($scriptArgs[$i]) {
        "--with-commit" { $withCommit = $true }
        "-C" {
            $i++
            if ($i -ge $scriptArgs.Count) {
                [Console]::Error.WriteLine("usage: sdd-repo.ps1 [-C DIR] [--with-commit]")
                exit 2
            }
            $candidate = $scriptArgs[$i]
            if (-not (Test-Path -LiteralPath $candidate -PathType Container)) {
                [Console]::Error.WriteLine("bad -C directory: $candidate")
                exit 2
            }
            $workingDir = (Resolve-Path -LiteralPath $candidate).Path
        }
        default {
            [Console]::Error.WriteLine("usage: sdd-repo.ps1 [-C DIR] [--with-commit]")
            exit 2
        }
    }
}

$root = $null
$said = ""
try {
    $output = @(& git -C $workingDir rev-parse --show-toplevel 2>&1)
    $gitStatus = $LASTEXITCODE
    if ($gitStatus -eq 0 -and $output.Count -gt 0) {
        $candidateRoot = ([string]$output[0]).Trim()
        if (-not [string]::IsNullOrWhiteSpace($candidateRoot)) { $root = $candidateRoot }
    } else {
        $said = if ($output.Count -gt 0) { ([string]$output[0]).Trim() } else { "git rev-parse --show-toplevel failed" }
    }
} catch {
    $said = $_.ToString()
}

if (-not [string]::IsNullOrWhiteSpace($root)) {
    if (-not $withCommit) {
        Write-Output $root
        exit 0
    }
    try {
        $headOutput = @(& git -C $root rev-parse --verify HEAD 2>&1)
        $gitStatus = $LASTEXITCODE
        if ($gitStatus -eq 0) {
            Write-Output $root
            exit 0
        }
        $said = if ($headOutput.Count -gt 0) { ([string]$headOutput[0]).Trim() } else { "git rev-parse --verify HEAD failed" }
    } catch {
        $said = $_.ToString()
    }
}

if ([string]::IsNullOrWhiteSpace($said)) { $said = "git could not resolve the current working tree" }
if ($withCommit) {
    [Console]::Error.WriteLine("SDD scripts that record BASE or review commits need a git working tree with at least one commit (current directory: $workingDir). If this is a new project, run 'git init', make a first commit, then rerun.")
} else {
    [Console]::Error.WriteLine("SDD scripts must run from inside the git working tree you're executing in (current directory: $workingDir). If this is a new project, run 'git init' first, then rerun.")
}
[Console]::Error.WriteLine("git said: $said")
exit 2
