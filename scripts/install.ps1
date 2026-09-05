# ==============================================================================
# Superpowers MCP - One-Click Global Installer (Windows PowerShell)
# Usage:
#   irm https://raw.githubusercontent.com/Poseidoncode/superpowers-mcp/main/scripts/install.ps1 | iex
#   & ([scriptblock]::Create((irm https://raw.githubusercontent.com/Poseidoncode/superpowers-mcp/main/scripts/install.ps1))) -Target cursor
#   .\scripts\install.ps1 -Target cursor
# ==============================================================================

[CmdletBinding()]
param (
    [string]$Target = "",
    [switch]$Bun,
    [switch]$Remove,
    [switch]$Backup,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "⚡ Superpowers MCP - One-Click Global Setup (Windows)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$argsList = @()
if ($Target) { $argsList += "--target", $Target }
if ($Bun) { $argsList += "--bun" }
if ($Remove) { $argsList += "--remove" }
if ($Backup) { $argsList += "--backup" }
if ($DryRun) { $argsList += "--dry-run" }

# Check for local setup.js
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path -ErrorAction SilentlyContinue
$localSetup = if ($scriptDir) { Join-Path $scriptDir "setup.js" } else { "" }

if ($localSetup -and (Test-Path $localSetup) -and (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Using local setup engine..." -ForegroundColor Green
    & node $localSetup @argsList
    exit $LASTEXITCODE
}

# Check for bunx or npx
$runner = $null
if (Get-Command bunx -ErrorAction SilentlyContinue) {
    $runner = "bunx"
} elseif (Get-Command npx -ErrorAction SilentlyContinue) {
    $runner = "npx"
}

if ($runner) {
    Write-Host "🚀 Running global setup via $runner..." -ForegroundColor Green
    & $runner -y superpowers-mcp setup @argsList
    exit $LASTEXITCODE
}

Write-Host "❌ Error: Node.js (npx) or Bun (bunx) is required to run Superpowers MCP." -ForegroundColor Red
Write-Host "Please install Node.js from https://nodejs.org or Bun from https://bun.sh and try again." -ForegroundColor Yellow
exit 1
