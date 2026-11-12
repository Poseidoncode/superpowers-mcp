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

    # -C selects the target checkout while preserving this process's cwd.
    Push-Location $root
    try {
        $fromCwd = & $scriptPath -C $repo "plan.md"
        Assert-ExitCode $LASTEXITCODE 0 "-C selects another repository"
        Assert-True ((($fromCwd | Select-Object -First 1).Trim()) -eq $workspace) "-C resolves to the same plan workspace"
    }
    finally {
        Pop-Location
    }

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

    # Unicode marker content must round-trip so repeat calls resolve to the
    # same workspace instead of allocating suffixes indefinitely.
    $unicodeDir = Join-Path $repo "docs/規格"
    New-Item -ItemType Directory -Force -Path $unicodeDir | Out-Null
    $unicodePlan = Join-Path $unicodeDir "計畫.md"
    Set-Content -LiteralPath $unicodePlan -Value "# Unicode plan`n" -Encoding utf8
    $unicodeFirst = (& $scriptPath $unicodePlan | Select-Object -First 1).Trim()
    $unicodeSecond = (& $scriptPath $unicodePlan | Select-Object -First 1).Trim()
    Assert-True ($unicodeFirst -eq $unicodeSecond) "Unicode plan paths reuse the same workspace"
    $unicodeMarker = (Get-Content -LiteralPath (Join-Path $unicodeFirst "plan-path") -Raw).Trim()
    Assert-True ($unicodeMarker -match "規格/計畫\.md$") "Unicode ownership marker round-trips without ASCII loss"

    # 8. Fail closed outside a repository instead of writing into a plugin cache.
    # A newly initialized repository may create workspaces before its first commit,
    # but task-start needs the initial commit to record HEAD as BASE.
    $gf = Join-Path $root "greenfield"
    New-Item -ItemType Directory -Force -Path $gf | Out-Null
    $gfPlan = Join-Path $gf "plan-a.md"
    Set-Content -Path $gfPlan -Value "# Plan A`n`n## Task 1: Scaffold`n`nCreate the repo.`n" -NoNewline

    & git -C $gf rev-parse --git-dir *> $null
    if ($LASTEXITCODE -eq 0) {
        Fail "fail-closed test needs a directory outside any repository"
    } else {
        Push-Location $gf
        try {
            $gfErr = (& pwsh -NoProfile -File "$scriptPath" $gfPlan 2>&1 | Out-String)
            Assert-ExitCode $LASTEXITCODE 2 "sdd-workspace outside a repo exits 2"
            Assert-True ($gfErr -match "must run from inside the git working tree" -and $gfErr -match "git said:") "explains the repository requirement"
            Assert-True (-not (Test-Path -LiteralPath (Join-Path $gf ".superpowers"))) "does not write a workspace outside a repo"

            $taskBrief = Join-Path $PSScriptRoot "../../skills/subagent-driven-development/scripts/task-brief.ps1"
            & $taskBrief $gfPlan 1 *> $null
            Assert-ExitCode $LASTEXITCODE 2 "task-brief outside a repo exits 2"
            $taskStart = Join-Path $PSScriptRoot "../../skills/executing-plans/scripts/task-start.ps1"
            & $taskStart $gfPlan 1 *> $null
            Assert-ExitCode $LASTEXITCODE 2 "task-start outside a repo exits 2"
            $taskDone = Join-Path $PSScriptRoot "../../skills/executing-plans/scripts/task-done.ps1"
            & $taskDone $gfPlan 1 deadbeef "true" *> $null
            Assert-ExitCode $LASTEXITCODE 2 "task-done outside a repo exits 2"

            & git init -q | Out-Null
            $gfWorkspaceOutput = & $scriptPath $gfPlan
            Assert-ExitCode $LASTEXITCODE 0 "sdd-workspace after git init exits 0"
            $gfWorkspace = ($gfWorkspaceOutput | Select-Object -First 1).Trim()
            Assert-True (Test-Path -LiteralPath (Join-Path $gfWorkspace "plan-path")) "workspace created inside the initialized repo"

            $briefOutput = & $taskBrief $gfPlan 1
            Assert-ExitCode $LASTEXITCODE 0 "task-brief works before the first commit"
            Assert-True (($briefOutput | Out-String) -match "task-1-brief.md") "task-brief writes to the plan workspace"
            & $taskStart $gfPlan 1 *> $null
            Assert-ExitCode $LASTEXITCODE 2 "task-start requires an initial commit"
        }
        finally {
            Pop-Location
        }
    }
    }
    finally {
        Pop-Location
    }
}
finally {
    Remove-TestRoot -Root $root
}
Test-Summary -Suite "sdd-workspace.ps1"
