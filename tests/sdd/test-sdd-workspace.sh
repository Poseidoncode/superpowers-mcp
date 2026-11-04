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

# Task IDs may be alphanumeric/dotted, but are matched as whole IDs. Nested
# letter/dot extensions remain part of their parent's brief.
cat > "$repo/task-ids.md" <<'PLAN'
## Task 6: Six
Six body.

## Task 6b: Six B
Six B body.

## Task A1: Alpha
Alpha body.

### Task A1a: Alpha child
Alpha child body.

## Task A2: Alpha two
Alpha two body.

## Task 2.1: Dotted
Dotted body.

## Task M3a: Mixed
Mixed body.
PLAN
id_brief="$repo/task-id-brief.md"
( cd "$repo" && "$SDD_SCRIPTS/task-brief" task-ids.md 6 "$id_brief" >/dev/null )
if grep -q "Six body." "$id_brief" && ! grep -q "Six B body." "$id_brief"; then
    pass "Task 6 does not prefix-match Task 6b"
else
    fail "Task 6 does not prefix-match Task 6b"
fi
( cd "$repo" && "$SDD_SCRIPTS/task-brief" task-ids.md A1 "$id_brief" >/dev/null )
if grep -q "Alpha child body." "$id_brief" && ! grep -q "Alpha two body." "$id_brief"; then
    pass "Task A1 includes nested Task A1a but not Task A2"
else
    fail "Task A1 includes nested Task A1a but not Task A2"
fi
( cd "$repo" && "$SDD_SCRIPTS/task-brief" task-ids.md 2.1 "$id_brief" >/dev/null )
if grep -q "Dotted body." "$id_brief"; then
    pass "dotted task IDs are extracted"
else
    fail "dotted task IDs are extracted"
fi
( cd "$repo" && "$SDD_SCRIPTS/task-brief" task-ids.md M3a "$id_brief" >/dev/null )
if grep -q "Mixed body." "$id_brief"; then
    pass "mixed alphanumeric task IDs are extracted"
else
    fail "mixed alphanumeric task IDs are extracted"
fi

cat > "$repo/open-fence.md" <<'PLAN'
## Task 1: Incomplete
This task is cut off by an unclosed fence.
```markdown
## Task 2: Hidden
PLAN
set +e
fence_err="$(cd "$repo" && "$SDD_SCRIPTS/task-brief" open-fence.md 1 "$repo/open-fence-brief.md" 2>&1 >/dev/null)"
fence_rc=$?
set -e
if [[ $fence_rc -eq 4 && "$fence_err" == *"never closes"* && ! -e "$repo/open-fence-brief.md" ]]; then
    pass "task-brief refuses a brief truncated by an unclosed fence"
else
    fail "task-brief refuses an unclosed fence (rc=$fence_rc, stderr=$fence_err)"
fi

cat > "$repo/hidden-task.md" <<'PLAN'
# Hidden task plan
```markdown
## Task 1: Hidden
PLAN
set +e
hidden_err="$(cd "$repo" && "$SDD_SCRIPTS/task-brief" hidden-task.md 1 "$repo/hidden-task-brief.md" 2>&1 >/dev/null)"
hidden_rc=$?
set -e
if [[ $hidden_rc -eq 4 && "$hidden_err" == *"never closes"* && ! -e "$repo/hidden-task-brief.md" ]]; then
    pass "task-brief reports an unclosed fence that hides the requested task"
else
    fail "task-brief reports a hidden task (rc=$hidden_rc, stderr=$hidden_err)"
fi

cat > "$repo/spanish-plan.md" <<'PLAN'
## Tarea 1: Trabajo
Texto.
PLAN
set +e
spanish_err="$(cd "$repo" && "$SDD_SCRIPTS/task-brief" spanish-plan.md 1 "$repo/spanish-brief.md" 2>&1 >/dev/null)"
spanish_rc=$?
set -e
if [[ $spanish_rc -eq 3 && "$spanish_err" == *"English word"* ]]; then
    pass "task-brief explains the English Task heading requirement"
else
    fail "task-brief explains translated task headings (rc=$spanish_rc, stderr=$spanish_err)"
fi

# `-C DIR` must select the target worktree even when invoked elsewhere.
brief_cwd="$TEST_ROOT/cwd-brief.md"
out_cwd="$(cd "$TEST_ROOT" && "$SDD_SCRIPTS/task-brief" -C "$repo" docs/alpha/plan.md 1 "$brief_cwd")"
if [[ "$out_cwd" == *"wrote $brief_cwd:"* && -s "$brief_cwd" ]]; then
    pass "task-brief -C resolves plans and output in the selected worktree"
else
    fail "task-brief -C resolves plans and output in the selected worktree"
fi
workspace_cwd="$(cd "$TEST_ROOT" && "$SDD_SCRIPTS/sdd-workspace" -C "$repo" docs/alpha/plan.md)"
if [[ "$workspace_cwd" == "$dir_alpha" ]]; then
    pass "sdd-workspace -C resolves the selected plan workspace"
else
    fail "sdd-workspace -C resolves the selected plan workspace (got $workspace_cwd)"
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

review_cwd="$repo/review-from-cwd.diff"
(cd "$TEST_ROOT" && "$SDD_SCRIPTS/review-package" -C "$repo" docs/alpha/plan.md "$base_sha" "$head_sha" "$review_cwd" >/dev/null)
if [[ -s "$review_cwd" ]]; then
    pass "review-package -C generates a review from the selected worktree"
else
    fail "review-package -C generates a review from the selected worktree"
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

# Test 7: fail closed outside a repo instead of writing into a plugin cache.
# A new project can use workspace/task-brief helpers after `git init`, but
# task-start needs an initial commit because it records HEAD as BASE.
gf="$TEST_ROOT/greenfield"
mkdir -p "$gf"
cat > "$gf/plan-a.md" <<'PLAN'
# Plan A

## Task 1: Scaffold the repo

Create the repo.
PLAN

if git -C "$gf" rev-parse --git-dir >/dev/null 2>&1; then
    fail "greenfield test needs a directory outside any repository"
else
    set +e
    gf_err="$(cd "$gf" && "$SDD_SCRIPTS/sdd-workspace" plan-a.md 2>&1 >/dev/null)"
    sw_rc=$?
    ( cd "$gf" && "$SDD_SCRIPTS/task-brief" plan-a.md 1 >/dev/null 2>&1 )
    tb_rc=$?
    ( cd "$gf" && "$REPO_ROOT/skills/executing-plans/scripts/task-start" plan-a.md 1 >/dev/null 2>&1 )
    ts_rc=$?
    ( cd "$gf" && "$REPO_ROOT/skills/executing-plans/scripts/task-done" plan-a.md 1 deadbeef -- true >/dev/null 2>&1 )
    td_rc=$?
    ( cd "$gf" && "$SDD_SCRIPTS/review-package" plan-a.md HEAD~1 HEAD >/dev/null 2>&1 )
    rp_rc=$?
    set -e

    if [[ $sw_rc -eq 2 && "$gf_err" == *"must run from inside the git working tree"* && "$gf_err" == *"git said:"* ]]; then
        pass "sdd-workspace outside a repo fails with an actionable git diagnostic"
    else
        fail "sdd-workspace outside a repo fails actionably (rc=$sw_rc, stderr=$gf_err)"
    fi
    if [[ $tb_rc -eq 2 && $ts_rc -eq 2 && $td_rc -eq 2 && $rp_rc -eq 2 && ! -e "$gf/.superpowers" ]]; then
        pass "all default-output helpers fail closed outside a repo without writing state"
    else
        fail "all helpers fail closed outside a repo (task-brief=$tb_rc task-start=$ts_rc task-done=$td_rc review=$rp_rc)"
    fi

    git init -q -b main "$gf"
    gf_phys="$(cd "$gf" && pwd -P)"
    gf_dir="$(cd "$gf" && "$SDD_SCRIPTS/sdd-workspace" plan-a.md)"
    if [[ "$gf_dir" == "$gf_phys/.superpowers/sdd/plan-a" ]]; then
        pass "sdd-workspace works after git init, before the first commit"
    else
        fail "sdd-workspace after git init (got $gf_dir)"
    fi
    set +e
    ( cd "$gf" && "$REPO_ROOT/skills/executing-plans/scripts/task-start" plan-a.md 1 >/dev/null 2>&1 )
    ts_no_commit_rc=$?
    set -e
    if [[ $ts_no_commit_rc -eq 2 ]]; then
        pass "task-start requires an initial commit before recording BASE"
    else
        fail "task-start without a commit exits 2 (got $ts_no_commit_rc)"
    fi
    git -C "$gf" config user.name "Tester"
    git -C "$gf" config user.email "test@example.com"
    git -C "$gf" commit -q --allow-empty -m "initial"
    ( cd "$gf" && "$REPO_ROOT/skills/executing-plans/scripts/task-start" plan-a.md 1 >/dev/null )
    if [[ -s "$gf/.superpowers/sdd/plan-a/task-1-brief.md" ]]; then
        pass "task-start succeeds after the initial commit"
    else
        fail "task-start succeeds after the initial commit"
    fi
fi

echo ""
if [[ $FAILURES -eq 0 ]]; then
    echo "All SDD bash tests passed."
    exit 0
else
    echo "$FAILURES test(s) failed."
    exit 1
fi
