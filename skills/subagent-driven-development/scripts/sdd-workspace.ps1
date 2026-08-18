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

function Get-PhysicalDirectoryPath($path) {
    if (-not (Test-Path -LiteralPath $path)) { return $path }
    if ($IsWindows) {
        return (Resolve-Path -LiteralPath $path).Path
    }
    $orig = Get-Location
    try {
        Set-Location -LiteralPath $path
        $pwdCmd = (Get-Command -Type Application pwd -ErrorAction SilentlyContinue).Source
        if ($pwdCmd) {
            return (& $pwdCmd -P).Trim()
        } else {
            return (Resolve-Path -LiteralPath $path).Path
        }
    } finally {
        Set-Location $orig
    }
}

# Normalize the plan path (physical directory, so relative/absolute/../
# spellings of one plan compare equal) and express it as the marker value:
# repo-relative when the plan lives under the repo root, absolute otherwise.
$planLeaf = Split-Path -Leaf $plan
$planParent = Split-Path -Parent $plan
if ([string]::IsNullOrEmpty($planParent)) { $planParent = "." }

$planDir = Get-PhysicalDirectoryPath $planParent
$rootPhys = Get-PhysicalDirectoryPath $root

$planAbs = (Join-Path $planDir $planLeaf) -replace '\\', '/'
$rootNorm = $rootPhys -replace '\\', '/'

if ($planAbs.StartsWith($rootNorm + "/", [System.StringComparison]::OrdinalIgnoreCase)) {
    $planId = $planAbs.Substring($rootNorm.Length + 1)
} else {
    $planId = $planAbs
}

function Test-And-Claim-Workspace($targetDir, $id) {
    $markerPath = Join-Path $targetDir "plan-path"
    if (Test-Path -LiteralPath $markerPath -PathType Leaf) {
        $existingId = (Get-Content -LiteralPath $markerPath -Raw).Trim()
        return ($existingId -eq $id)
    } else {
        New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
        Set-Content -LiteralPath $markerPath -Value $id -Encoding ascii
        return $true
    }
}

$dir = Join-Path $base $slug
if (-not (Test-And-Claim-Workspace $dir $planId)) {
    $parent = Split-Path -Leaf $planDir
    $dir = Join-Path $base "$slug-$parent"
    if (-not (Test-And-Claim-Workspace $dir $planId)) {
        $n = 2
        while (-not (Test-And-Claim-Workspace (Join-Path $base "$slug-$parent-$n") $planId)) {
            $n++
        }
        $dir = Join-Path $base "$slug-$parent-$n"
    }
}

Set-Content -LiteralPath (Join-Path $base ".gitignore") -Value "*" -NoNewline -Encoding ascii
(Resolve-Path -LiteralPath $dir).Path
