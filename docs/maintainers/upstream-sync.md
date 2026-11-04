# Upstream Synchronization

This guide is for maintainers who review and import skill content from [`obra/superpowers`](https://github.com/obra/superpowers).

The upstream blob SHAs captured at the last sync are stored in [`tests/upstream-sync-baseline.json`](../../tests/upstream-sync-baseline.json).

## Commands

```bash
npm run drift                    # compare the baseline against upstream and list what moved
npm run drift:record             # refresh the baseline after a reviewed sync
node scripts/upstream-drift.js   # offline: baseline integrity + local coverage
```

The drift report separates:

- files changed upstream;
- upstream additions and removals;
- tracked files missing from this fork; and
- fork-only additions.

An upstream skill that this fork deliberately does not adopt is reported as a decision rather than drift. Record that decision after review with:

```bash
npm run drift:record -- --ignore <skill>
```

## Synchronization Workflow

1. Run `npm run drift` to identify upstream changes.
2. Review the changes and import only the content appropriate for this fork.
3. Run the test suite with `npm test`.
4. After the reviewed sync is complete, run `npm run drift:record` to update the baseline.
5. Commit the imported changes and updated baseline together.

Do not refresh the baseline before reviewing and importing the changes. Doing so would mark unseen upstream changes as handled.

## Fork-Specific Additions

Prefer changes the fork can own outright: new MCP/server integrations, helper scripts, references, maintainer docs, and regression tests. Avoid editing upstream-tracked `SKILL.md` bodies just to mirror upstream or to carry generic advice. When a local packaging/runtime constraint requires changing an upstream-tracked file, keep the patch narrow, explain why it is fork-specific, preserve fork-only files (including PowerShell twins), and pin the behavior with tests. Do not remove upstream files or re-record their baseline merely to make the drift report green; record explicit adoption or non-adoption decisions after review.

## Safety Checks

`npm test` fails when an imported upstream file is deleted or when a shipped skill loses its upstream lineage.

Report mode marks a truncated GitHub tree as partial and suppresses `--fail-on-drift`. Record mode refuses a truncated response entirely so an incomplete listing cannot overwrite the last complete baseline.
