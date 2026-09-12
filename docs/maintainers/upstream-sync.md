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

## Safety Checks

`npm test` fails when an imported upstream file is deleted or when a shipped skill loses its upstream lineage.

Report mode marks a truncated GitHub tree as partial and suppresses `--fail-on-drift`. Record mode refuses a truncated response entirely so an incomplete listing cannot overwrite the last complete baseline.
