#!/usr/bin/env bash
# Ensure every skill instruction that names an SDD/executing-plans helper
# tells the agent to invoke it by its absolute path from the working tree.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

invocation='`(bash )?(\.\./[a-z-]+/)?scripts/(sdd-workspace|task-brief|review-package|task-start|task-done)'
phrase='by its absolute path'
failed=0
checked=0
while IFS=: read -r file line _; do
  checked=$((checked + 1))
  window=$(sed -n "${line},$((line + 2))p" "$file" | tr -s '[:space:]' ' ')
  after=$(printf '%s\n' "$window" | grep -oE "$invocation.*" | head -n 1)
  if [[ "${after:0:300}" != *"$phrase"* ]]; then
    echo "FAIL: ${file#"$REPO_ROOT"/}:$line names an SDD helper without requiring its absolute path from the working tree" >&2
    failed=1
  fi
done < <(grep -rnE --include='*.md' "$invocation" "$REPO_ROOT/skills" || true)

if ((checked == 0)); then
  echo "FAIL: no SDD helper references were found; the scan pattern may be stale" >&2
  exit 1
fi
if ((failed)); then
  echo "Say to run the script by its absolute path, from the working tree you're executing in." >&2
  exit 1
fi
echo "PASS: all $checked SDD helper references use absolute paths from the working tree"
