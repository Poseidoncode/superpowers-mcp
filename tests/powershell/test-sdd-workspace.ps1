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

    # 5. Ownership markers: two plans with the same basename
    $alphaDir = Join-Path $repo "docs/alpha"
    $betaDir = Join-Path $repo "docs/beta"
    New-Item -ItemType Directory -Force -Path $alphaDir | Out-Null
    New-Item -ItemType Directory -Force -Path $betaDir | Out-Null
    $planAlpha = Join-Path $alphaDir "plan.md"
    $planBeta = Join-Path $betaDir "plan.md"
    Set-Content -Path $planAlpha -Value "# Alpha Plan`n`n## Task 1`n`nAlpha text.`n" -NoNewline
    Set-Content -Path $planBeta -Value "# Beta Plan`n`n## Task 1`n`nBeta text.`n" -NoNewline

    $dirAlpha = (& $scriptPath $planAlpha | Select-Object -First 1).Trim()
    $dirBeta = (& $scriptPath $planBeta | Select-Object -First 1).Trim()
    Assert-True ($dirAlpha -ne $dirBeta) "same-basename plans resolve to distinct workspaces"

    # 6. Legacy adoption: pre-existing workspace without a marker
    $fooPlan = Join-Path $repo "foo.md"
    Set-Content -Path $fooPlan -Value "# Foo`n" -NoNewline
    $fooDir = Join-Path $repo ".superpowers/sdd/foo"
    New-Item -ItemType Directory -Force -Path $fooDir | Out-Null
    Set-Content -Path (Join-Path $fooDir "progress.md") -Value "ledger" -NoNewline
    $dirFoo = (& $scriptPath $fooPlan | Select-Object -First 1).Trim()
    $expectedFoo = Join-Path $realRepo ".superpowers/sdd/foo"
    Assert-True ($dirFoo -eq $expectedFoo) "legacy markerless workspace is adopted in place"
    $markerFoo = Join-Path $expectedFoo "plan-path"
    $markerFooContent = if (Test-Path -LiteralPath $markerFoo) { (Get-Content -LiteralPath $markerFoo -Raw).Trim() } else { "<missing>" }
    Assert-True ($markerFooContent -eq "foo.md") "legacy workspace is marked (got '$markerFooContent')"

    # 7. Counter fallback on double collision
    $bazPlan = Join-Path $repo "baz.md"
    Set-Content -Path $bazPlan -Value "# Baz`n" -NoNewline
    $bazDir = Join-Path $repo ".superpowers/sdd/baz"
    $repoName = (Get-Item -LiteralPath $repo).Name
    $bazSuffixed = Join-Path $repo ".superpowers/sdd/baz-$repoName"
    New-Item -ItemType Directory -Force -Path $bazDir | Out-Null
    New-Item -ItemType Directory -Force -Path $bazSuffixed | Out-Null
    Set-Content -Path (Join-Path $bazDir "plan-path") -Value "other/baz.md" -NoNewline
    Set-Content -Path (Join-Path $bazSuffixed "plan-path") -Value "other2/baz.md" -NoNewline
    $dirBaz = (& $scriptPath $bazPlan | Select-Object -First 1).Trim()
    $expectedBaz = Join-Path $realRepo ".superpowers/sdd/baz-$repoName-2"
    Assert-True ($dirBaz -eq $expectedBaz) "double conflict falls back to a counter suffix"
    }
    finally {
        Pop-Location
    }
}
finally {
    Remove-TestRoot -Root $root
}
Test-Summary -Suite "sdd-workspace.ps1"
