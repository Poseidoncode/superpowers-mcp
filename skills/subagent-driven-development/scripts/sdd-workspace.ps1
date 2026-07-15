#!/usr/bin/env pwsh
# Resolve and ensure the working-tree directory SDD uses for short-lived artifacts.
# Usage: ./sdd-workspace.ps1

$ErrorActionPreference = "Stop"

$root = (& git rev-parse --show-toplevel).Trim()
$dir = Join-Path $root ".superpowers/sdd"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
Set-Content -Path (Join-Path $dir ".gitignore") -Value "*" -NoNewline -Encoding ascii
(Resolve-Path $dir).Path
