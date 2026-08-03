#!/usr/bin/env pwsh
# Tests for skills/subagent-driven-development/scripts/sdd-workspace.ps1
$ErrorActionPreference = "Stop"
. "$PSScriptRoot/common.ps1"

$scriptPath = Resolve-Path (Join-Path $PSScriptRoot "../../skills/subagent-driven-development/scripts/sdd-workspace.ps1")
$root = New-TestRoot
try {
    $repo = New-TestRepo -Root $root
    $plan = Join-Path $repo "plan.md"
    Set-Content -Path $plan -Value "# Plan`n`n## Task 1`n`nDo it.`n" -NoNewline

    Push-Location $repo
    try {

    # 1. usage error: no arguments
    & $scriptPath > $null 2>&1
    Assert-ExitCode $LASTEXITCODE 2 "no args exits 2"

    # 2. missing plan file
    & $scriptPath (Join-Path $repo "nope.md") > $null 2>&1
    Assert-ExitCode $LASTEXITCODE 2 "missing plan exits 2"

    # 3. happy path: plan.md derives the slug 'plan'
    $out = & $scriptPath $plan
    Assert-ExitCode $LASTEXITCODE 0 "happy path exits 0"
    $workspace = ($out | Select-Object -First 1).Trim()
    # The script resolves the repo root via git, which expands the macOS
    # /var -> /private/var symlink; resolve the expected path the same way.
    $realRepo = (& git -C $repo rev-parse --show-toplevel).Trim()
    $expected = Join-Path $realRepo ".superpowers/sdd/plan"
    Assert-True ($workspace -eq $expected) "prints .superpowers/sdd/plan absolute path"
    Assert-True (Test-Path -LiteralPath (Join-Path $repo ".superpowers/sdd/plan")) "workspace dir exists"
    Assert-True (Test-Path -LiteralPath (Join-Path $repo ".superpowers/sdd/.gitignore")) ".gitignore written"

    # 4. slug derivation strips only a trailing .md (regression for the
    #    GetFileNameWithoutExtension bug: plan.txt must keep its extension)
    $planTxt = Join-Path $repo "plan.txt"
    Set-Content -Path $planTxt -Value "# Plan`n" -NoNewline
    $out2 = & $scriptPath $planTxt
    Assert-ExitCode $LASTEXITCODE 0 "plan.txt exits 0"
    $workspace2 = ($out2 | Select-Object -First 1).Trim()
    $expected2 = Join-Path $realRepo ".superpowers/sdd/plan.txt"
    Assert-True ($workspace2 -eq $expected2) "slug keeps non-.md extension"
    Assert-True (Test-Path -LiteralPath (Join-Path $repo ".superpowers/sdd/plan.txt")) "plan.txt workspace dir exists"
    }
    finally {
        Pop-Location
    }
}
finally {
    Remove-TestRoot -Root $root
}
Test-Summary -Suite "sdd-workspace.ps1"
