#!/usr/bin/env bash
# Keep scenario prompts and creation logs out of installed skill folders.
# Agents may discover files alongside SKILL.md and mistake pressure-test
# material for instructions meant for a live task.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

found=$(find "$REPO_ROOT/skills" -type f \( -name 'CREATION-LOG.md' -o -name 'test-*.md' \) | sort)
if [[ -n "$found" ]]; then
  while IFS= read -r file; do
    echo "FAIL: ${file#"$REPO_ROOT"/} is skill-development material inside an installed skill" >&2
  done <<<"$found"
  echo "Move pressure scenarios and creation logs under tests/<skill>/." >&2
  exit 1
fi
echo "PASS: no skill ships pressure scenarios or creation logs"
