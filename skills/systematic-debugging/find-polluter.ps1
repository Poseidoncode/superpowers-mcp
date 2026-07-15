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

$testFiles = @(Get-ChildItem -Path $testPattern -File -Recurse -ErrorAction SilentlyContinue | Sort-Object FullName)
if ($testFiles.Count -eq 0) {
    $testFiles = @(Get-ChildItem -Path . -File -Recurse | Where-Object { $_.FullName -like (Join-Path (Get-Location) $testPattern) } | Sort-Object FullName)
}

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
