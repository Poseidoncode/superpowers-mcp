#!/usr/bin/env bash
# ==============================================================================
# Superpowers MCP - One-Click Global Installer (macOS & Linux)
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/Poseidoncode/superpowers-mcp/main/scripts/install.sh | bash -s -- --target <client>
#   ./scripts/install.sh --target <antigravity|pi-desktop|cursor|copilot|copilot-insiders|hermes|kimi|claude|devin|qwenpaw|cline|kilo|qoder|kiro|trae>
# ==============================================================================

set -euo pipefail

echo ""
echo "========================================================"
echo "⚡ Superpowers MCP - One-Click Global Setup (macOS / Linux)"
echo "========================================================"
echo ""

# Find Node / Bun runtime
RUNNER=""
if command -v bunx >/dev/null 2>&1; then
    RUNNER="bunx"
elif command -v npx >/dev/null 2>&1; then
    RUNNER="npx"
fi

# Check if running from local repository clone safely
SCRIPT_DIR=""
if [ -n "${BASH_SOURCE[0]:-}" ]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd || echo "")"
fi

if [ -n "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/setup.js" ] && command -v node >/dev/null 2>&1; then
    echo "📦 Using local setup engine..."
    exec node "$SCRIPT_DIR/setup.js" "$@"
fi

if [ -n "$RUNNER" ]; then
    echo "🚀 Running global setup via $RUNNER..."
    $RUNNER -y superpowers-mcp setup "$@"
    exit $?
fi

echo "❌ Error: Node.js (npx) or Bun (bunx) is required to run Superpowers MCP."
echo "Please install Node.js from https://nodejs.org or Bun from https://bun.sh and try again."
exit 1
