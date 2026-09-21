#!/usr/bin/env bash
# Tests for skills/executing-plans/scripts/task-done.
# Mirrors tests/powershell/test-task-done.ps1 (sh/ps1 symmetry).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TASK_DONE="$REPO_ROOT/skills/executing-plans/scripts/task-done"

TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/task-done-test-XXXXXX")"
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

## Task 2

Do task two.
EOF

cd "$REPO"
PLAN="$REPO/plan.md"
WS="$REPO/.superpowers/sdd/plan"
BASE=$(git rev-parse HEAD)

# 1. usage errors
set +e
"$TASK_DONE" "$PLAN" 1 "$BASE" >/dev/null 2>&1
rc1=$?
# NB: the sh twin rejects a genuinely missing `--`; the ps1 twin cannot
# (PowerShell consumes an unquoted `--` before the script sees $args).
"$TASK_DONE" "$PLAN" 1 "$BASE" git status >/dev/null 2>&1
rc2=$?
set -e
if [[ $rc1 -eq 2 ]]; then pass "missing -- and command exits 2"; else fail "missing -- and command exits 2 (got $rc1)"; fi
if [[ $rc2 -eq 2 ]]; then pass "missing -- separator exits 2"; else fail "missing -- separator exits 2 (got $rc2)"; fi

# 2. bad BASE exits 2 without running anything
set +e
"$TASK_DONE" "$PLAN" 1 "not-a-sha" -- git status >/dev/null 2>&1
rc=$?
set -e
if [[ $rc -eq 2 ]]; then pass "bad BASE exits 2"; else fail "bad BASE exits 2 (got $rc)"; fi
if [[ ! -f "$WS/task-1-tests.log" ]]; then pass "bad BASE writes no log"; else fail "bad BASE writes no log"; fi

# 3. failing test command: exit status propagates, nothing recorded
set +e
fail_out=$("$TASK_DONE" "$PLAN" 1 "$BASE" -- git show no-such-commit-xyz 2>&1)
rc=$?
set -e
if [[ $rc -eq 128 ]]; then pass "failing command propagates exit 128"; else fail "failing command propagates exit 128 (got $rc)"; fi
if [[ -f "$WS/task-1-tests.log" ]]; then pass "failing run keeps full output in workspace"; else fail "failing run keeps full output in workspace"; fi
if grep -q "fatal" "$WS/task-1-tests.log"; then pass "log holds the failure output"; else fail "log holds the failure output"; fi
if printf '%s\n' "$fail_out" | grep -q "fatal"; then pass "tail of the failure is printed"; else fail "tail of the failure is printed"; fi
if [[ ! -f "$WS/progress.md" ]]; then pass "failing run writes no ledger"; else fail "failing run writes no ledger"; fi

# 4. happy path: log, printed tail, ledger header + completion line
set +e
out=$("$TASK_DONE" "$PLAN" 1 "$BASE" -- git rev-parse HEAD 2>&1)
rc=$?
set -e
if [[ $rc -eq 0 ]]; then pass "passing command exits 0"; else fail "passing command exits 0 (got $rc)"; fi
if printf '%s\n' "$out" | grep -qF "$BASE"; then pass "tail of the passing output is printed"; else fail "tail of the passing output is printed"; fi
base7=$(git rev-parse --short=7 "$BASE")
if grep -qxF "# SDD ledger — plan: $PLAN" "$WS/progress.md"; then pass "ledger created with identity header"; else fail "ledger created with identity header"; fi
if grep -qF "Task 1: complete (commits $base7..$base7, tests: git rev-parse HEAD → $BASE)" "$WS/progress.md"; then pass "completion line records range and result"; else fail "completion line records range and result"; fi
if printf '%s\n' "$out" | grep -qF "ledger: Task 1: complete"; then pass "completion line echoed to stdout"; else fail "completion line echoed to stdout"; fi

# 5. second task appends; the header is written once
set +e
"$TASK_DONE" "$PLAN" 2 "$BASE" -- git rev-parse HEAD >/dev/null 2>&1
rc=$?
set -e
if [[ $rc -eq 0 ]]; then pass "task 2 exits 0"; else fail "task 2 exits 0 (got $rc)"; fi
if [[ $(grep -c '^# SDD ledger' "$WS/progress.md") -eq 1 ]]; then pass "header written once"; else fail "header written once"; fi
if grep -q "Task 2: complete" "$WS/progress.md"; then pass "second completion line appended"; else fail "second completion line appended"; fi

# 6. arguments with spaces render single-quoted in the ledger line
set +e
"$TASK_DONE" "$PLAN" 1 "$BASE" -- git log "--pretty=format:%H %s" -1 >/dev/null 2>&1
rc=$?
set -e
if [[ $rc -eq 0 ]]; then pass "quoting run exits 0"; else fail "quoting run exits 0 (got $rc)"; fi
if grep -qF "'--pretty=format:%H %s'" "$WS/progress.md"; then pass "spaced arg single-quoted in ledger"; else fail "spaced arg single-quoted in ledger"; fi

# 7. empty-output passing command: exit 0, placeholder in the ledger line
set +e
"$TASK_DONE" "$PLAN" 3 "$BASE" -- true >/dev/null 2>&1
rc=$?
set -e
if [[ $rc -eq 0 ]]; then pass "empty-output command exits 0"; else fail "empty-output command exits 0 (got $rc)"; fi
if grep -qF "Task 3: complete" "$WS/progress.md"; then pass "empty-output run recorded"; else fail "empty-output run recorded"; fi
if grep -qF 'tests: true → (no output)' "$WS/progress.md"; then pass "empty output recorded as (no output)"; else fail "empty output recorded as (no output)"; fi

# 8. blank-lines-only output is also empty after filtering
set +e
"$TASK_DONE" "$PLAN" 4 "$BASE" -- printf '\n\n' >/dev/null 2>&1
rc=$?
set -e
if [[ $rc -eq 0 ]]; then pass "blank-output command exits 0"; else fail "blank-output command exits 0 (got $rc)"; fi
if grep -qF '→ (no output)' "$WS/progress.md"; then pass "blank output recorded as (no output)"; else fail "blank output recorded as (no output)"; fi

echo ""
echo "task-done: $FAILURES failure(s)"
exit "$FAILURES"
