#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SDD_SCRIPTS="$REPO_ROOT/skills/subagent-driven-development/scripts"

TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/sdd-test-XXXXXX")"
trap 'rm -rf "$TEST_ROOT"' EXIT

FAILURES=0

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }

# Test 1: Usage and argument validation
set +e
"$SDD_SCRIPTS/sdd-workspace" >/dev/null 2>&1
rc_noargs=$?
"$SDD_SCRIPTS/sdd-workspace" "$TEST_ROOT/nonexistent.md" >/dev/null 2>&1
rc_missing=$?
set -e

if [[ $rc_noargs -eq 2 ]]; then
    pass "sdd-workspace with no args exits 2"
else
    fail "sdd-workspace with no args exits 2 (got $rc_noargs)"
fi

if [[ $rc_missing -eq 2 ]]; then
    pass "sdd-workspace with missing plan exits 2"
else
    fail "sdd-workspace with missing plan exits 2 (got $rc_missing)"
fi

# Setup test repo
repo_dir="$TEST_ROOT/repo"
mkdir -p "$repo_dir"
repo="$(cd "$repo_dir" && pwd -P)"
git -C "$repo" init -q -b main
git -C "$repo" config user.name "Tester"
git -C "$repo" config user.email "test@example.com"
git -C "$repo" commit -q --allow-empty -m "initial"

# Test 2: Bash sdd-workspace ownership & path normalization
mkdir -p "$repo/docs/alpha" "$repo/docs/beta"
cat > "$repo/docs/alpha/plan.md" <<'PLAN'
# Alpha Plan

## Task 1: Alpha work

Alpha text.
PLAN

cat > "$repo/docs/beta/plan.md" <<'PLAN'
# Beta Plan

## Task 1: Beta work

Beta text.
PLAN

dir_alpha="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" docs/alpha/plan.md)"
dir_beta="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" docs/beta/plan.md)"

if [[ "$dir_alpha" != "$dir_beta" ]]; then
    pass "same-basename plans resolve to distinct workspaces"
else
    fail "same-basename plans resolve to distinct workspaces"
fi

( cd "$repo" && "$SDD_SCRIPTS/task-brief" docs/alpha/plan.md 1 >/dev/null )
( cd "$repo" && "$SDD_SCRIPTS/task-brief" docs/beta/plan.md 1 >/dev/null )

if grep -q "Alpha text." "$dir_alpha/task-1-brief.md" && grep -q "Beta text." "$dir_beta/task-1-brief.md"; then
    pass "same-basename plans keep both task briefs intact"
else
    fail "same-basename plans keep both task briefs intact"
fi

# Test 3: Legacy adoption & counter fallback
cat > "$repo/foo.md" <<'PLAN'
# Foo Plan
## Task 1: Foo
Foo.
PLAN
mkdir -p "$repo/.superpowers/sdd/foo"
echo "legacy ledger" > "$repo/.superpowers/sdd/foo/progress.md"

dir_foo="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" foo.md)"
if [[ "$dir_foo" == "$repo/.superpowers/sdd/foo" && "$(cat "$repo/.superpowers/sdd/foo/plan-path" 2>/dev/null)" == "foo.md" ]]; then
    pass "legacy markerless workspace is adopted in place and marked"
else
    fail "legacy markerless workspace is adopted in place"
fi

# Counter suffix test
cat > "$repo/baz.md" <<'PLAN'
# Baz Plan
## Task 1: Baz
Baz.
PLAN
repo_name="$(basename "$repo")"
mkdir -p "$repo/.superpowers/sdd/baz" "$repo/.superpowers/sdd/baz-$repo_name"
echo "other/baz.md" > "$repo/.superpowers/sdd/baz/plan-path"
echo "other2/baz.md" > "$repo/.superpowers/sdd/baz-$repo_name/plan-path"

dir_baz="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" baz.md)"
if [[ "$dir_baz" == "$repo/.superpowers/sdd/baz-$repo_name-2" ]]; then
    pass "double conflict falls back to counter suffix (-2)"
else
    fail "double conflict falls back to counter suffix (-2) (got $dir_baz)"
fi

# Test 4: task-brief error handling & code fence isolation
cat > "$repo/fence.md" <<'PLAN'
# Fence Plan

## Task 1: Code test
```markdown
## Task 2: This is code inside fence, not real task
```
Task 1 real body.

## Task 2: Real task 2
Real task 2 body.
PLAN

( cd "$repo" && "$SDD_SCRIPTS/task-brief" fence.md 1 >/dev/null )
fence_brief="$repo/.superpowers/sdd/fence/task-1-brief.md"
if grep -q "This is code inside fence" "$fence_brief" && ! grep -q "Real task 2 body." "$fence_brief"; then
    pass "task-brief correctly ignores headings inside code fences"
else
    fail "task-brief code fence isolation"
fi

set +e
( cd "$repo" && "$SDD_SCRIPTS/task-brief" fence.md 99 >/dev/null 2>&1 )
rc_notask=$?
set -e

if [[ $rc_notask -eq 3 ]]; then
    pass "task-brief exits 3 on missing task number"
else
    fail "task-brief exits 3 on missing task number (got $rc_notask)"
fi

# Test 5: review-package range guards
echo "a" > "$repo/a.txt"
git -C "$repo" add a.txt
git -C "$repo" commit -q -m "add a"
base_sha="$(git -C "$repo" rev-parse HEAD)"

echo "b" > "$repo/b.txt"
git -C "$repo" add b.txt
git -C "$repo" commit -q -m "add b"
head_sha="$(git -C "$repo" rev-parse HEAD)"

set +e
( cd "$repo" && "$SDD_SCRIPTS/review-package" docs/alpha/plan.md "$head_sha" "$head_sha" >/dev/null 2>&1 )
rc_empty=$?
( cd "$repo" && "$SDD_SCRIPTS/review-package" docs/alpha/plan.md "$head_sha" "$base_sha" >/dev/null 2>&1 )
rc_nondesc=$?
set -e

if [[ $rc_empty -eq 3 ]]; then
    pass "empty commit range exits 3"
else
    fail "empty commit range exits 3 (got $rc_empty)"
fi

if [[ $rc_nondesc -eq 3 ]]; then
    pass "non-descendant HEAD exits 3"
else
    fail "non-descendant HEAD exits 3 (got $rc_nondesc)"
fi

# Test 6: helper execution when executable bit stripped
cp_dir="$TEST_ROOT/no-exec-helpers"
mkdir -p "$cp_dir"
cp "$SDD_SCRIPTS"/* "$cp_dir/"
chmod -x "$cp_dir"/*

set +e
out_noexec="$(cd "$repo" && bash "$cp_dir/task-brief" docs/alpha/plan.md 1)"
rc_noexec=$?
set -e

if [[ $rc_noexec -eq 0 ]]; then
    pass "helpers work even when chmod -x stripped"
else
    fail "helpers work even when chmod -x stripped (got $rc_noexec)"
fi

echo ""
if [[ $FAILURES -eq 0 ]]; then
    echo "All SDD bash tests passed."
    exit 0
else
    echo "$FAILURES test(s) failed."
    exit 1
fi
