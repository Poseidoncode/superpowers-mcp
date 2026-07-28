#!/usr/bin/env pwsh
# Generate a review package: commit list, stat summary, and net diff.
# Usage: ./review-package.ps1 PLAN_FILE BASE HEAD [OUTFILE]
# Default OUTFILE: <repo-root>/.superpowers/sdd/<plan-basename>/review-<base7>..<head7>.diff

$ErrorActionPreference = "Stop"

if ($args.Count -lt 3 -or $args.Count -gt 4) {
    Write-Error "usage: review-package.ps1 PLAN_FILE BASE HEAD [OUTFILE]"
    exit 2
}

$plan = $args[0]
$base = $args[1]
$head = $args[2]

if (-not (Test-Path -LiteralPath $plan -PathType Leaf)) {
    Write-Error "no such plan file: $plan"
    exit 2
}

& git rev-parse --verify --quiet $base *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Error "bad BASE: $base"
    exit 2
}

& git rev-parse --verify --quiet $head *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Error "bad HEAD: $head"
    exit 2
}

if ($args.Count -eq 4) {
    $out = $args[3]
} else {
    $scriptDir = Split-Path -Parent $PSCommandPath
    $dir = (& (Join-Path $scriptDir "sdd-workspace.ps1") $plan).Trim()
    $baseShort = (& git rev-parse --short $base).Trim()
    $headShort = (& git rev-parse --short $head).Trim()
    $out = Join-Path $dir "review-$baseShort..$headShort.diff"
}

$content = New-Object System.Collections.Generic.List[string]
$content.Add("# Review package: ${base}..${head}")
$content.Add("")
$content.Add("## Commits")
(& git log --oneline "${base}..${head}") | ForEach-Object { $content.Add($_) }
$content.Add("")
$content.Add("## Files changed")
(& git diff --stat "${base}..${head}") | ForEach-Object { $content.Add($_) }
$content.Add("")
$content.Add("## Diff")
(& git diff -U10 "${base}..${head}") | ForEach-Object { $content.Add($_) }

Set-Content -Path $out -Value $content -Encoding utf8
$commits = (& git rev-list --count "${base}..${head}").Trim()
$bytes = (Get-Item -LiteralPath $out).Length
Write-Output "wrote ${out}: $commits commit(s), $bytes bytes"
