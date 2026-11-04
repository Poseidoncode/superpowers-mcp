#!/usr/bin/env pwsh
# Generate a review package: commit list, stat summary, and net diff.
# Usage: ./review-package.ps1 [-C DIR] PLAN_FILE BASE HEAD [OUTFILE]
# Default OUTFILE: <repo-root>/.superpowers/sdd/<plan-basename>/review-<base7>..<head7>.diff

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

if ($scriptArgs.Count -lt 3 -or $scriptArgs.Count -gt 4) {
    [Console]::Error.WriteLine("usage: review-package.ps1 [-C DIR] PLAN_FILE BASE HEAD [OUTFILE]")
    exit 2
}

$planArg = $scriptArgs[0]
$plan = if ([System.IO.Path]::IsPathRooted($planArg)) { $planArg } else { Join-Path $workingDir $planArg }
$base = $scriptArgs[1]
$head = $scriptArgs[2]

if (-not (Test-Path -LiteralPath $plan -PathType Leaf)) {
    [Console]::Error.WriteLine("no such plan file: $plan")
    exit 2
}

$scriptDir = Split-Path -Parent $PSCommandPath
$repoHelper = Join-Path $scriptDir "sdd-repo.ps1"
$repoOutput = @(& $repoHelper -C $workingDir "--with-commit")
if ($LASTEXITCODE -ne 0 -or $repoOutput.Count -eq 0) { exit 2 }
$repo = ([string]$repoOutput[0]).Trim()

& git -C $repo rev-parse --verify --quiet "$base" *> $null
if ($LASTEXITCODE -ne 0) {
    [Console]::Error.WriteLine("bad BASE: $base")
    exit 2
}

& git -C $repo rev-parse --verify --quiet "$head" *> $null
if ($LASTEXITCODE -ne 0) {
    [Console]::Error.WriteLine("bad HEAD: $head")
    exit 2
}

# Range guards (exit 3): a wrong-branch HEAD yields a range that is empty or
# not rooted at BASE; either would silently produce a bogus review package.
& git -C $repo merge-base --is-ancestor "$base" "$head" *> $null
if ($LASTEXITCODE -ne 0) {
    [Console]::Error.WriteLine("HEAD ($head) is not a descendant of BASE ($base)")
    exit 3
}

$commitCount = (& git -C $repo rev-list --count "${base}..${head}").Trim()
if ([int]$commitCount -eq 0) {
    [Console]::Error.WriteLine("empty commit range: ${base}..${head}")
    exit 3
}

if ($scriptArgs.Count -eq 4) {
    $outArg = [string]$scriptArgs[3]
    $out = if ([System.IO.Path]::IsPathRooted($outArg)) { $outArg } else { Join-Path $workingDir $outArg }
} else {
    $workspaceScript = Join-Path $scriptDir "sdd-workspace.ps1"
    $workspaceOutput = @(& $workspaceScript -C $workingDir $plan)
    if ($LASTEXITCODE -ne 0 -or $workspaceOutput.Count -eq 0) { exit 2 }
    $dir = ([string]$workspaceOutput[0]).Trim()
    $baseShort = (& git -C $repo rev-parse --short "$base").Trim()
    $headShort = (& git -C $repo rev-parse --short "$head").Trim()
    $out = Join-Path $dir "review-$baseShort..$headShort.diff"
}

$content = New-Object System.Collections.Generic.List[string]
$content.Add("# Review package: ${base}..${head}")
$content.Add("")
$content.Add("## Commits")
(& git -C $repo log --oneline "${base}..${head}") | ForEach-Object { $content.Add($_) }
$content.Add("")
$content.Add("## Files changed")
(& git -C $repo diff --stat "${base}..${head}") | ForEach-Object { $content.Add($_) }
$content.Add("")
$content.Add("## Diff")
(& git -C $repo diff -U10 "${base}..${head}") | ForEach-Object { $content.Add($_) }

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllLines($out, $content, $utf8NoBom)
$commits = (& git -C $repo rev-list --count "${base}..${head}").Trim()
$bytes = (Get-Item -LiteralPath $out).Length
Write-Output "wrote ${out}: $commits commit(s), $bytes bytes"
