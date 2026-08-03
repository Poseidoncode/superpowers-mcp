#!/usr/bin/env pwsh
# Tests for skills/subagent-driven-development/scripts/review-package.ps1
$ErrorActionPreference = "Stop"
. "$PSScriptRoot/common.ps1"

$scriptPath = Resolve-Path (Join-Path $PSScriptRoot "../../skills/subagent-driven-development/scripts/review-package.ps1")
$root = New-TestRoot
try {
    $repo = New-TestRepo -Root $root
    $plan = Join-Path $repo "plan.md"
    Set-Content -Path $plan -Value "# Plan`n" -NoNewline

    Add-Commit -Repo $repo -RelativePath "a.txt" -Content "one" -Message "add a"
    $base = (& git -C $repo rev-parse HEAD).Trim()
    Add-Commit -Repo $repo -RelativePath "b.txt" -Content "two" -Message "add b"
    $head = (& git -C $repo rev-parse HEAD).Trim()

    Push-Location $repo
    try {

    # 1. usage error: too few arguments
    & $scriptPath $plan $base > $null 2>&1
    Assert-ExitCode $LASTEXITCODE 2 "two args exits 2"

    # 2. missing plan file
    & $scriptPath (Join-Path $repo "nope.md") $base $head > $null 2>&1
    Assert-ExitCode $LASTEXITCODE 2 "missing plan exits 2"

    # 3. bad BASE exits 2
    & $scriptPath $plan "deadbeef" $head > $null 2>&1
    Assert-ExitCode $LASTEXITCODE 2 "bad BASE exits 2"

    # 4. bad HEAD exits 2
    & $scriptPath $plan $base "deadbeef" > $null 2>&1
    Assert-ExitCode $LASTEXITCODE 2 "bad HEAD exits 2"

    # 5. happy path: default outfile lands in the plan-scoped workspace
    $out = & $scriptPath $plan $base $head
    Assert-ExitCode $LASTEXITCODE 0 "happy path exits 0"
    $expected = Join-Path $repo ".superpowers/sdd/plan/review-$($base.Substring(0, 7))..$($head.Substring(0, 7)).diff"
    $outText = ($out | Out-String)
    Assert-True ($outText -match [regex]::Escape($expected)) "prints default outfile path"
    Assert-True ($outText -match "1 commit") "reports 1 commit"
    Assert-True (Test-Path -LiteralPath $expected) "review package written to plan-scoped workspace"
    $pkg = Get-Content -LiteralPath $expected -Raw
    Assert-True ($pkg -match "## Commits") "package has Commits section"
    Assert-True ($pkg -match "add b") "package lists the commit"
    Assert-True ($pkg -match "## Files changed") "package has Files changed section"
    Assert-True ($pkg -match "## Diff") "package has Diff section"
    Assert-True ($pkg -match "\+two") "package contains the diff hunk"

    # 6. explicit outfile
    $custom = Join-Path $root "review.diff"
    & $scriptPath $plan $base $head $custom > $null
    Assert-ExitCode $LASTEXITCODE 0 "explicit outfile exits 0"
    Assert-True (Test-Path -LiteralPath $custom) "explicit outfile written"
    }
    finally {
        Pop-Location
    }
}
finally {
    Remove-TestRoot -Root $root
}
Test-Summary -Suite "review-package.ps1"
