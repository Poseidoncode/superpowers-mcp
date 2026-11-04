#!/usr/bin/env pwsh
# Resolve and ensure the working-tree directory SDD uses for one plan's
# short-lived artifacts: task briefs, implementer reports, review packages,
# and the progress ledger. Print the plan directory's absolute path.
#
# One directory per plan (.superpowers/sdd/<plan-basename>/) so a follow-up
# plan in the same working tree can never read or overwrite another plan's
# artifacts.
#
# Basename slugs collide when two plans share a filename (docs/alpha/plan.md
# vs docs/beta/plan.md), so each workspace records its owning plan's path in
# a plan-path marker (repo-relative in-repo, absolute outside). A workspace
# owned by a different plan is skipped and the slug disambiguated with the
# plan's parent-directory name, then a counter. A workspace with no marker
# predates the marker scheme and is adopted for the current plan so in-flight
# workspaces keep resolving — which means the first collision on such a
# legacy workspace adopts instead of detecting; acceptable, marker-less
# workspaces age out as plans finish.
#
# The repository is the current directory's (see sdd-repo.ps1). -C DIR runs
# as if started there, allowing another checkout to be selected without a
# compound `cd DIR ; ...` command.
# Usage: ./sdd-workspace.ps1 [-C DIR] PLAN_FILE

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

if ($scriptArgs.Count -ne 1) {
    [Console]::Error.WriteLine("usage: sdd-workspace.ps1 [-C DIR] PLAN_FILE")
    exit 2
}

$planArg = $scriptArgs[0]
$plan = if ([System.IO.Path]::IsPathRooted($planArg)) { $planArg } else { Join-Path $workingDir $planArg }
if (-not (Test-Path -LiteralPath $plan -PathType Leaf)) {
    [Console]::Error.WriteLine("no such plan file: $planArg")
    exit 2
}

$slug = [System.IO.Path]::GetFileName($plan) -creplace '\.md$', ''
if ([string]::IsNullOrEmpty($slug) -or $slug -eq "." -or $slug -eq "..") {
    [Console]::Error.WriteLine("cannot derive a workspace name from: $plan")
    exit 2
}

$scriptDir = Split-Path -Parent $PSCommandPath
$repoHelper = Join-Path $scriptDir "sdd-repo.ps1"
$rootOutput = @(& $repoHelper -C $workingDir)
$repoStatus = $LASTEXITCODE
if ($repoStatus -ne 0 -or $rootOutput.Count -eq 0) { exit 2 }
$root = ([string]$rootOutput[0]).Trim()

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
if ([string]::IsNullOrEmpty($planParent)) { $planParent = $workingDir }

$planDir = Get-PhysicalDirectoryPath $planParent
$rootPhys = Get-PhysicalDirectoryPath $root
# Build $base from the physical root so the greenfield fallback (cwd, which
# may be a symlinked path such as macOS /var) prints the same location as
# the later git-resolved call.
$base = Join-Path $rootPhys ".superpowers/sdd"

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
        [System.IO.File]::WriteAllText(
            $markerPath,
            $id + [Environment]::NewLine,
            [System.Text.UTF8Encoding]::new($false)
        )
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

# Create-only: a repo may commit its own .gitignore here (e.g. to version
# progress.md ledgers); overwriting it would revert that on every run.
if (-not (Test-Path -LiteralPath (Join-Path $base ".gitignore"))) {
    Set-Content -LiteralPath (Join-Path $base ".gitignore") -Value "*" -NoNewline -Encoding ascii
}
$printedPath = (Resolve-Path -LiteralPath $dir).Path
$cygpath = Get-Command cygpath -ErrorAction SilentlyContinue
if ($cygpath) {
    $nativePath = & $cygpath.Source -m $printedPath
    if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($nativePath)) { $printedPath = ([string]$nativePath).Trim() }
}
Write-Output $printedPath
