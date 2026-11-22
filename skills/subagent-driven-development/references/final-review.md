# Final whole-branch review

Read when all tasks are complete.

The final whole-branch review gets a package too: run
`bash scripts/review-package PLAN_FILE MERGE_BASE HEAD` (or
`scripts/review-package.ps1 PLAN_FILE MERGE_BASE HEAD` on Windows PowerShell)
by its absolute path, from the working tree you're executing in; MERGE_BASE is
 the commit the branch started from, e.g. `git merge-base main HEAD`. Include the
printed path in the final review dispatch, so the final reviewer reads
one file instead of re-deriving the branch diff with git commands. Dispatch
on the most capable available model (see Model Selection), using
superpowers:requesting-code-review's
[code-reviewer.md](../requesting-code-review/code-reviewer.md). Point it at
the ledger's deferred-minor and parked lines so it can triage which must be
fixed before merge. Rule on its "Declined to judge" list before the fix
dispatch: every line there is a ruling you make and ledger —
`Final: Ruling: <behavior the reviewer set aside> — <what a reasonable
person using this software gets, and why that stands or why it is now a
finding> — <cost if wrong>`. Nothing the reviewer set aside is dropped
silently.

If the final whole-branch review returns findings, dispatch ONE fix subagent
with the complete findings list — not one fixer per finding.
Per-finding fixers each rebuild context and re-run suites; a real
session's final-review fix wave cost more than all its tasks combined.
Then run exactly one scoped re-review of the fix wave
(`bash scripts/review-package PLAN_FILE FIX_BASE HEAD`, or
`scripts/review-package.ps1 PLAN_FILE FIX_BASE HEAD` on Windows PowerShell)
by its absolute path, from the working tree you're executing in, over the fix
range, [re-review-prompt.md](re-review-prompt.md).
Adjudicate any residual findings as in the task loop's breaker: park with
rulings, or rule on the load-bearing ones and ledger what you decided. Only
the four classes above stop you here. There is no second fix wave —
residual load-bearing findings surface to your human partner when
finishing-a-development-branch presents the options.
