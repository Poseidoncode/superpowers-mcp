# Completing a task: Discoveries and plan ticks

Read when writing a task's completion bookkeeping.

**Discoveries are a delta from the plan:** only what a later task needs and the
plan could not know — corrections to the plan, negative results, resolved
unknowns, interfaces discovered in the code. If it does not change what a
later task does, it does not go in.

**Ticking the plan:** a plan left at 0 while its tasks are done and deployed reads as
"nothing happened", and nothing downstream will catch it: the task reviewer
sees a diff, the re-review sees findings, the final review sees the ledger.
None of them ever opens the plan.

Leave a step unticked only when its deliverable does not exist yet — a step
that waits on someone else, or on an event that has not happened. Never tick
a step you skipped.
