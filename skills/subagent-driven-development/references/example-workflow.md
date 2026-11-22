# Example workflow

An illustrative end-to-end run; read only if the loop above is unclear.

```
You: I'm using Subagent-Driven Development to execute this plan.

[Setup: worktree verified]
[Read plan file once: docs/superpowers/plans/feature-plan.md]
[Resolve workspace: bash scripts/sdd-workspace docs/superpowers/plans/feature-plan.md — no ledger inside, fresh start]
[Create todos for all tasks]

Task 1: Hook installation script

[bash scripts/task-brief PLAN_FILE 1; dispatch implementer with brief + report paths + context]

Implementer: "Before I begin - should the hook be installed at user or system level?"

You: "User level (~/.config/superpowers/hooks/)"

Implementer: [Later]
  - Implemented install-hook command
  - Added tests, 5/5 passing
  - Self-review: Found I missed --force flag, added it
  - Committed

[bash scripts/review-package PLAN_FILE BASE HEAD; dispatch task reviewer with the printed path + review file]
Task reviewer: Spec ✅. Quality: Approved. Minor: 0.
  Full report: task-1-review.md

[Ledger: Task 1: complete (commits a1b2c3d..d4e5f6a, review clean)]
[Ledger: Discoveries — Task 1: hooks dir must be created before install; none other]

Task 2: Recovery modes

[bash scripts/task-brief PLAN_FILE 2; dispatch implementer with brief + report paths + context]

Implementer: [No questions]
  - Added verify/repair modes
  - 8/8 tests passing
  - Committed

[bash scripts/review-package PLAN_FILE BASE HEAD; dispatch task reviewer with the printed path + review file]
Task reviewer: Spec ❌:
  - Missing: Progress reporting (spec says "report every 100 items")
  Important: Magic number (100). Minor: 0. Full report: task-2-review.md

[Fix round 1: resume the implementer with the review file path]
Implementer: Added progress reporting, extracted PROGRESS_INTERVAL constant.
  Re-ran test/recovery.test.js — 10/10 passing. Fix report appended.

[bash scripts/review-package PLAN_FILE FIX_BASE HEAD; dispatch scoped re-review with the review file to append to]
Re-reviewer: Missing progress reporting — ADDRESSED (src/recovery.js:41).
  Magic number — ADDRESSED (src/recovery.js:7). New breakage: none.
  Verdict: all findings addressed.

[Ledger: Task 2: fix round 1/5 (2 addressed, 0 open; commits d4e5f6a..b7c8d9e)]
[Ledger: Task 2: complete (commits d4e5f6a..b7c8d9e, review clean)]
[Ledger: Discoveries — Task 2: None]

...

[After all tasks]
[bash scripts/review-package PLAN_FILE MERGE_BASE HEAD; dispatch final code-reviewer, most capable model]
Final reviewer: All requirements met. Deferred minors triaged: none block merge.

[Use superpowers:finishing-a-development-branch — Option 2: push and create PR]
[Export deferred findings (minor (deferred), parked, Ruling: lines) to the PR description as a "Deferred items" checklist]
[Delete this plan's workspace — the export, not git, is the deferred findings' record]

Done!
```
