#!/usr/bin/env bash
# Tests for skills/executing-plans/scripts/task-start.
# Mirrors tests/powershell/test-task-start.ps1 (sh/ps1 symmetry).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TASK_START="$REPO_ROOT/skills/executing-plans/scripts/task-start"

TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/task-start-test-XXXXXX")"
TEST_ROOT="$(cd "$TEST_ROOT" && pwd -P)"
trap 'rm -rf "$TEST_ROOT"' EXIT

FAILURES=0

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }

REPO="$TEST_ROOT/repo"
mkdir -p "$REPO"
git -C "$REPO" init -q
git -C "$REPO" config user.email "tests@example.com"
git -C "$REPO" config user.name "Superpowers Tests"
echo "test repo" > "$REPO/README.md"
git -C "$REPO" add -A
git -C "$REPO" commit -qm "initial commit"
cat > "$REPO/plan.md" <<'EOF'
# Implementation Plan

## Task 1

Do task one.

- [ ] write the test
- [ ] implement

## Task 2

Do task two.
EOF

cd "$REPO"
PLAN="$REPO/plan.md"

# 1. usage error: too few arguments
set +e
"$TASK_START" "$PLAN" >/dev/null 2>&1
rc=$?
set -e
if [[ $rc -eq 2 ]]; then pass "single arg exits 2"; else fail "single arg exits 2 (got $rc)"; fi

# 2. missing plan file propagates task-brief's exit 2
set +e
"$TASK_START" "$REPO/nope.md" 1 >/dev/null 2>&1
rc=$?
set -e
if [[ $rc -eq 2 ]]; then pass "missing plan exits 2"; else fail "missing plan exits 2 (got $rc)"; fi

# 3. task not found propagates task-brief's exit 3
set +e
"$TASK_START" "$PLAN" 9 >/dev/null 2>&1
rc=$?
set -e
if [[ $rc -eq 3 ]]; then pass "missing task exits 3"; else fail "missing task exits 3 (got $rc)"; fi

# 4. happy path: prints the brief path and the full HEAD SHA
set +e
out=$("$TASK_START" "$PLAN" 1 2>&1)
rc=$?
set -e
expected="$REPO/.superpowers/sdd/plan/task-1-brief.md"
head=$(git rev-parse HEAD)
if [[ $rc -eq 0 ]]; then pass "task 1 exits 0"; else fail "task 1 exits 0 (got $rc)"; fi
if printf '%s\n' "$out" | grep -qxF "brief: $expected"; then pass "prints brief path line"; else fail "prints brief path line (got: $out)"; fi
if printf '%s\n' "$out" | grep -qxF "base: $head"; then pass "prints base SHA line"; else fail "prints base SHA line (got: $out)"; fi
if [[ -f "$expected" ]]; then pass "brief file written to plan-scoped workspace"; else fail "brief file written to plan-scoped workspace"; fi

echo ""
echo "task-start: $FAILURES failure(s)"
exit "$FAILURES"
