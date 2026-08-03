#!/usr/bin/env pwsh
# Tests for skills/systematic-debugging/find-polluter.ps1
$ErrorActionPreference = "Stop"
. "$PSScriptRoot/common.ps1"

$scriptPath = Resolve-Path (Join-Path $PSScriptRoot "../../skills/systematic-debugging/find-polluter.ps1")
$root = New-TestRoot
try {
    $project = Join-Path $root "project"
    New-Item -ItemType Directory -Path (Join-Path $project "src/feature"), (Join-Path $project "bin") -Force | Out-Null
    Set-Content -Path (Join-Path $project "src/top.test.ts") -Value "test('top')" -NoNewline
    Set-Content -Path (Join-Path $project "src/feature/nested.test.ts") -Value "test('nested')" -NoNewline

    # Stub npm: running any test creates the pollution marker, so the first
    # test file executed is always identified as the polluter.
    $npmStub = Join-Path $project "bin/npm"
    Set-Content -Path $npmStub -Value "#!/usr/bin/env bash`ntouch pollution.marker`n" -NoNewline
    & chmod +x $npmStub

    # 1. usage error
    & $scriptPath > $null 2>&1
    Assert-ExitCode $LASTEXITCODE 1 "usage error exits 1"

    $oldPath = $env:PATH
    $env:PATH = "$project/bin:$oldPath"
    Push-Location $project
    try {
        # 2. no matching test files: clean run
        $out = & $scriptPath "pollution.marker" "nomatch/**/*.ts" 2>&1
        Assert-ExitCode $LASTEXITCODE 0 "clean run exits 0"
        Assert-True ((($out | Out-String) -match "No polluter found")) "clean run reports no polluter"

        # 3. polluter found: stub npm creates the marker on the first test
        $out = & $scriptPath "pollution.marker" "src/**/*.test.ts" 2>&1
        Assert-ExitCode $LASTEXITCODE 1 "polluter run exits 1"
        $outText = ($out | Out-String)
        Assert-True ($outText -match "FOUND POLLUTER") "reports FOUND POLLUTER"
        Assert-True ($outText -match "feature[\\/]nested\.test\.ts") "identifies the first test as polluter"

        # 4. pattern with a leading ./ must behave identically
        Remove-Item -LiteralPath (Join-Path $project "pollution.marker") -Force
        $out = & $scriptPath "pollution.marker" "./src/**/*.test.ts" 2>&1
        Assert-ExitCode $LASTEXITCODE 1 "leading ./ pattern exits 1"
        Assert-True ((($out | Out-String) -match "FOUND POLLUTER")) "leading ./ pattern still finds polluter"

        # 5. pollution already present: every test is skipped, exits 0
        $out = & $scriptPath "pollution.marker" "src/**/*.test.ts" 2>&1
        Assert-ExitCode $LASTEXITCODE 0 "pre-existing pollution exits 0"
        Assert-True ((($out | Out-String) -match "Pollution already exists")) "skips tests when pollution already present"
    }
    finally {
        Pop-Location
        $env:PATH = $oldPath
    }
}
finally {
    Remove-TestRoot -Root $root
}
Test-Summary -Suite "find-polluter.ps1"
