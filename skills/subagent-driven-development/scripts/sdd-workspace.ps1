#!/usr/bin/env pwsh
# Resolve and ensure the working-tree directory SDD uses for one plan's
# short-lived artifacts: task briefs, implementer reports, review packages,
# and the progress ledger. Print the plan directory's absolute path.
#
# One directory per plan (.superpowers/sdd/<plan-basename>/) so a follow-up
# plan in the same working tree can never read or overwrite another plan's
# artifacts.
#
# Usage: ./sdd-workspace.ps1 PLAN_FILE

$ErrorActionPreference = "Stop"

if ($args.Count -ne 1) {
    [Console]::Error.WriteLine("usage: sdd-workspace.ps1 PLAN_FILE")
    exit 2
}

$plan = $args[0]
if (-not (Test-Path -LiteralPath $plan -PathType Leaf)) {
    [Console]::Error.WriteLine("no such plan file: $plan")
    exit 2
}

$slug = [System.IO.Path]::GetFileName($plan) -creplace '\.md$', ''
if ([string]::IsNullOrEmpty($slug) -or $slug -eq "." -or $slug -eq "..") {
    [Console]::Error.WriteLine("cannot derive a workspace name from: $plan")
    exit 2
}

$root = (& git rev-parse --show-toplevel).Trim()
$base = Join-Path $root ".superpowers/sdd"
$dir = Join-Path $base $slug
New-Item -ItemType Directory -Force -Path $dir | Out-Null
Set-Content -Path (Join-Path $base ".gitignore") -Value "*" -NoNewline -Encoding ascii
(Resolve-Path $dir).Path
