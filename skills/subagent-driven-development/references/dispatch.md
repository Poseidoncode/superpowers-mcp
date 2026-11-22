# Dispatch rules: prompt contents, no-subagents contract, concurrent waves

Read before composing each implementer dispatch.

- A dispatch prompt describes one task, not the session's history. Do not
  paste accumulated prior-task summaries ("state after Tasks 1-3") into
  later dispatches — a real session's dispatch hit 42k chars of which 99%
  was pasted history. A fresh subagent needs its task, the interfaces it
  touches, and the global constraints. Nothing else. A curated slice copied
  from the Discoveries section is not pasted history — it is clause (3)
  above, kept small enough to read in full because each entry is a delta
  from the plan.
- The dispatch carries the no-subagents contract (it is in the
  implementer template): the implementer never dispatches subagents —
  not helpers, and never a reviewer. Review arrives from you, after the
  report. In real sessions, every reviewer a worker spawned duplicated
  the task review the controller dispatched anyway — a full extra
  review seat per task.
- If an earlier task parked a finding in the area this task touches, carry
  a pointer to that ledger entry in the dispatch.
- Record the implementer's agent identity from the dispatch result —
  fix-loop rounds 1-3 resume this agent.
- Never dispatch multiple implementation subagents in parallel (conflicts).
  The one exception is a skeleton-first plan whose dispatch plan shows two
  or more pending tasks mutually file-disjoint with none consuming an
  interface still under construction. Dispatch those implementers
  concurrently, each in its own worktree:
  - Record the integration base commit in the ledger before the first
    concurrent dispatch.
  - Create one worktree per concurrent task off that base
    (`git worktree add <repo-root>/.worktrees/task-<N> -b task-<N>
    <base>`); each dispatch's `Work from:` is its own worktree, and its
    BASE is that worktree's HEAD.
  - Review each task's diff as usual when it reports. Integrate reviewed
    branches in plan order: merge each into the integration branch
    (`git merge --no-ff task-<N>`), and run that task's verification
    commands after each merge.
  - A merge conflict or post-merge verification failure is that task's
    fix-loop round 1: rebase the task branch onto the current
    integration head in its worktree, then resume its implementer
    there. Never resolve conflicts yourself.
  - Remove each worktree (`git worktree remove`) once its branch is
    integrated, and record the integrated range in the ledger as usual.

**When the brief is a contract** (goal, success criteria, interfaces) rather than
written-out code, item (3) of the dispatch also carries the elaboration the contract
leaves to dispatch time: the interfaces as actually built by completed tasks,
environment facts and discoveries from earlier reports, and any amendment rulings.
There the success criteria name the cases the tests must cover, and the implementer
designs its own code and tests within the contract.
