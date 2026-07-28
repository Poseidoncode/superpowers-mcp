#!/usr/bin/env pwsh
# Bisection script to find which test creates unwanted files/state.
# Usage: ./find-polluter.ps1 <file_or_dir_to_check> <test_pattern>

$ErrorActionPreference = "Stop"

if ($args.Count -ne 2) {
    Write-Output "Usage: ./find-polluter.ps1 <file_to_check> <test_pattern>"
    Write-Output "Example: ./find-polluter.ps1 '.git' 'src/**/*.test.ts'"
    exit 1
}

$pollutionCheck = $args[0]
$testPattern = $args[1]

Write-Output "Searching for test that creates: $pollutionCheck"
Write-Output "Test pattern: $testPattern"
Write-Output ""

# Accept the pattern written with or without a leading ./ (or .\)
$testPattern = $testPattern -replace '^\.[/\\]', ''

# '**/' can't match zero directory levels in a -like comparison, so a
# pattern like src/**/*.test.ts would skip src/top.test.ts; also try the
# pattern with '**/' collapsed to cover files directly under the base
# directory.
$patterns = @($testPattern)
$collapsed = $testPattern -replace '\*\*[/\\]', ''
if ($collapsed -ne $testPattern) { $patterns += $collapsed }

$root = (Get-Location).Path.Replace('\', '/')
$testFiles = @(Get-ChildItem -Path . -File -Recurse -ErrorAction SilentlyContinue | Where-Object {
    $full = $_.FullName.Replace('\', '/')
    $hit = $false
    foreach ($p in $patterns) {
        if ($full -like "$root/$p") { $hit = $true; break }
    }
    $hit
} | Sort-Object FullName -Unique)

$total = $testFiles.Count
Write-Output "Found $total test files"
Write-Output ""

$count = 0
foreach ($testFile in $testFiles) {
    $count++

    if (Test-Path -LiteralPath $pollutionCheck) {
        Write-Output "Pollution already exists before test $count/$total"
        Write-Output "   Skipping: $($testFile.FullName)"
        continue
    }

    Write-Output "[$count/$total] Testing: $($testFile.FullName)"
    & npm test $testFile.FullName *> $null

    if (Test-Path -LiteralPath $pollutionCheck) {
        Write-Output ""
        Write-Output "FOUND POLLUTER"
        Write-Output "   Test: $($testFile.FullName)"
        Write-Output "   Created: $pollutionCheck"
        Write-Output ""
        Write-Output "Pollution details:"
        Get-ChildItem -Force -LiteralPath $pollutionCheck | Format-List
        Write-Output ""
        Write-Output "To investigate:"
        Write-Output "  npm test $($testFile.FullName)"
        Write-Output "  Get-Content $($testFile.FullName)"
        exit 1
    }
}

Write-Output ""
Write-Output "No polluter found - all tests clean."
exit 0
