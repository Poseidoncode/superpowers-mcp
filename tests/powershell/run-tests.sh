#!/usr/bin/env bash
# Run the PowerShell script tests (tests/powershell/test-*.ps1) with pwsh.
# Skips with exit 0 when pwsh is unavailable so CI on non-Windows machines
# without PowerShell still passes.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if ! command -v pwsh >/dev/null 2>&1; then
  echo "pwsh not found - skipping PowerShell script tests."
  echo "Install with: brew install --cask powershell"
  exit 0
fi

FAILURES=0
for test in "$SCRIPT_DIR"/test-*.ps1; do
  echo "=== $(basename "$test") ==="
  if ! pwsh -NoProfile -File "$test"; then
    FAILURES=$((FAILURES + 1))
  fi
done

if [ "$FAILURES" -ne 0 ]; then
  echo ""
  echo "$FAILURES PowerShell test file(s) failed"
  exit 1
fi
echo ""
echo "All PowerShell script tests passed."
