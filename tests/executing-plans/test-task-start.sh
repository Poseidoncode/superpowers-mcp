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

# Git for Windows reports mixed-style paths (C:/Users/...) while bash uses
# MSYS paths (/c/Users/...); compare them in one canonical spelling.
norm() { if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else printf '%s' "$1"; fi; }

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

## Task A1

Do task A1.
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
if printf '%s\n' "$out" | grep -qxF "brief: $(norm "$expected")"; then pass "prints brief path line"; else fail "prints brief path line (got: $out)"; fi
if printf '%s\n' "$out" | grep -qxF "base: $head"; then pass "prints base SHA line"; else fail "prints base SHA line (got: $out)"; fi
if [[ -f "$expected" ]]; then pass "brief file written to plan-scoped workspace"; else fail "brief file written to plan-scoped workspace"; fi

# 5. Alphanumeric task identifiers flow through task-start to task-brief.
set +e
out_a1=$("$TASK_START" "$PLAN" A1 2>&1)
rc_a1=$?
set -e
expected_a1="$REPO/.superpowers/sdd/plan/task-A1-brief.md"
if [[ $rc_a1 -eq 0 && -s "$expected_a1" && "$out_a1" == *"brief: $(norm "$expected_a1")"* ]]; then
    pass "alphanumeric Task A1 produces a brief and BASE"
else
    fail "alphanumeric Task A1 produces a brief and BASE (rc=$rc_a1, output=$out_a1)"
fi

echo ""
echo "task-start: $FAILURES failure(s)"
exit "$FAILURES"
