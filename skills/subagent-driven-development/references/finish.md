# Finish: rulings roll-up, deferred-findings export, workspace deletion

Read when the final review is done and before invoking finishing-a-development-branch.

Before you delete anything, collect every ledger line containing `Ruling:` —
preflight rulings, parked findings, breaker adjudications, all of them — into
your final message under "Rulings I made", in the order you made them, each
with what it costs if wrong. The list is exhaustive: if the ledger holds a
ruling, the list holds it. That list is the only place the decisions you
took on your human partner's behalf reach them — they read it and rework
whatever you got wrong. A ruling that dies with the workspace was a decision
made in secret.

Rulings are not the only content that dies with the workspace. Findings you
chose not to fix are the record of what was *not* done — git history cannot
carry them, because git records what was done. So export them before
anything is deleted: grep the progress ledger for its three finding tags

```bash
grep -E 'Ruling:|^(Task [0-9]+: |Final: )?(minor \(deferred\)|parked)' <workspace>/progress.md
```

and carry every matching line, verbatim, into a durable, human-reachable
artifact. The chat roll-up does not satisfy this — scrollback, compaction,
and session end all eat it. Where the artifact lives depends on how
finishing-a-development-branch resolves (it carries the same obligation from
its side):

- **Option 2 (push and create PR):** append the lines to the PR description
  under a "Deferred items" checklist. That is where your human partner
  reviews, and checkboxes survive the merge.
- **Option 1 (merge locally):** write them to
  `docs/superpowers/follow-ups/<plan-basename>.md` — append under a dated
  heading if a re-run under the same basename already created the file — and
  commit the file to the branch before the merge so it survives the branch
  deletion.
- **Option 3 (keep as-is):** the workspace stays, so there is nothing to
  export.
- **Explicit discard:** your human partner asked to throw the work away, so
  no export is required.

Use superpowers:finishing-a-development-branch.

When the finish path has resolved and its export exists — the checklist in
the PR description, or the committed follow-ups file — delete this plan's
workspace (`rm -rf <workspace>`), provided the final whole-branch review was
clean and its fixes are merged. The export, not git history, is the record
of the deferred findings. Sibling directories belong to other plans; leave
them alone. On an explicit discard there is no export, but the workspace is
deleted together with the branch — a ledger describing thrown-away work is
a false record.
