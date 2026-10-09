# Security Policy

## Supported Versions

The following versions of Superpowers MCP are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 6.4.x   | :white_check_mark: |
| 6.3.x   | :white_check_mark: |
| 6.2.x   | :white_check_mark: |
| 6.0.x   | :white_check_mark: |
| 5.1.x   | :white_check_mark: |
| 5.0.x   | :x:                |
| 4.3.x   | :x:                |
| < 4.3   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in Superpowers MCP, please report it responsibly:

1. **Email**: Send details to [posidomhu@gmail.com](mailto:posidomhu@gmail.com)
2. **Subject**: Use "[Security] Superpowers MCP - Brief Description"
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Fix Released**: Within 30 days (depending on severity)

## v6.4.7 (2026-10-09) Full Project Security Scan Notes

> Scope: the v6.4.7 release tree. The audit ran against the working tree that became this release, so the changes it examined (`src/server.ts`, `src/skills-manager.ts`, `src/setup-runner.ts`, the three SDD prompt templates, five test suites, and the new `scripts/run-tests.js`) are the changes shipped here. The v6.4.2–v6.4.6 controls below all remain in force.

### Method

Five-role parallel audit (attack-surface mapping, auth/data-trust, runtime & supply-chain) followed by an independent falsification pass: **every candidate finding was re-executed or explicitly downgraded before being written down.** Claims that did not survive are listed under *Rejected / Downgraded Candidates* rather than being dropped silently.

### New findings (all reproduced by execution against the current tree)

| # | Finding | CWE | Status |
| - | ------- | --- | ------ |
| 1 | **`--remove` reports success while a live MCP entry survives.** TOML: two `[[mcp_servers.superpowers]]` array tables → only the last is removed (`arrayHeaderIndex` is a single index overwritten in the loop, `src/setup-runner.ts:1022`); `[[mcp_servers.superpowers.env]]` is orphaned, leaving `TOKEN = "…"` in place (`TOML_SUPERPOWERS_SUBTABLE` cannot match a double bracket). JSON: only the first root key holding a `superpowers` entry is cleared (`updateJsonConfig`, `rootKey = JSON_SERVER_ROOT_KEYS.find(…)`, deletion applied to that key alone). YAML: removal is a **complete no-op** on a populated flow map `superpowers: {command: …}` — the new `managedEntryPattern` matches only the *empty* flow map. | CWE-459 | New guard narrows, does not close |
| 2 | **YAML `--remove` deletes a `superpowers:` entry owned by a different parent.** The uncommitted change guards the empty-map rewrite with `if (mcpIndent === 0)` (`:685`) but the entry deletion (`:700-706`) still keys off the *root* declaration's first-child indent, so a nested `mcp_servers:` under another top-level key has its `superpowers` subtree deleted — including user keys such as `env`. | CWE-459 | Pre-existing; comment at `:683-684` describes it as handled |
| 3 | **`SKILLS_PATH` containment is a blocklist plus an existence check, not an allowlist.** Verified: `~/.ssh`, `~/.config/gh` and `/Users/Shared` are **accepted**; `~/.aws` is rejected only because it does not exist (`realpathSync` throws → `canonicalized = false`). Separately, the temp-root allowance documented in the source comment (`:51-54`, which names `SKILLS_PATH=$(mktemp -d)` as a supported flow) resolves on macOS to a per-user `0700` directory but on **Linux to `/tmp` (mode `1777`, world-writable + sticky)** — a local unprivileged user on a shared Linux host can pre-create `<dir>/<skill>/SKILL.md` and have it served as trusted skill instructions. | CWE-22 / CWE-668 | Pre-existing |
| 4 | **`[MODEL]` was silently dropped for `sdd-task-reviewer` and `sdd-re-review`.** Both templates wrote `model: [MODEL — REQUIRED: choose per SKILL.md Model Selection; …]`, which does **not** contain the literal token `[MODEL]`; the only literal occurrence was the `**Placeholders:**` appendix bullet, which the new appendix guard (`isAppendixEntry`, `:353`) skips. Executed proof: with `model = "sonnet"`, the value appeared **0 times** in the rendered prompt. The new stderr diagnostic could not see it because it tests the *unfiltered* template (`template.includes("[MODEL]")` is true via the appendix). The same anti-pattern had already been fixed in `implementer-prompt.md` (`:8` is now `model: [MODEL]` plus `#` comment lines). **Fixed in this release**: both reviewer templates now use the same `model: [MODEL]` + `#` comment form, pinned by two new assertions in `tests/prompts_compositions_test.js` that require the supplied value to reach the dispatchable `model:` line and forbid a surviving `[MODEL` in the prompt body (verified fail-without / pass-with). | CWE-20 | **Fixed** in v6.4.7 |
| 5 | **YAML install can emit duplicate keys.** On a populated flow map it appends a second `superpowers:` beside the existing one (duplicate-key YAML resolves last-wins in permissive parsers, so the stale entry wins and the install silently no-ops; strict parsers reject the file). When the entry's child indent differs from the root's first-child indent, `directChildIndent = spIndent + indent.length` (`:800`) emits a second `command:` / `args:` pair. | CWE-407 | Flow-map case pre-existing |
| 6 | **Prompt arguments are interpolated into agent instructions unescaped.** The only sanitisation is `.trim()` plus a 32 KiB cap (`:619-637`); newlines survive, and `renderFeaturePipeline` splices the raw value into the prompt body. The diff hardened `feature_name` (collapses CR/LF) and `requirements` (strips CR only) — roughly 13 other free-text arguments are unchanged. The confused-deputy path is documented by the templates themselves: `[GLOBAL_CONSTRAINTS]` is "copied verbatim from the plan's Global Constraints section" and `[FINDINGS]` "copied verbatim, one per bullet". | CWE-1427 | Same-principal data trust, by design |
| 7 | **`npm pack` does not rebuild.** `prepublishOnly` runs only on `npm publish`, and `out/` is gitignored and untracked — so its contents are invisible to code review. Any `npm pack`-based release path ships whatever `out/*.js` is on disk with no rebuild and no verification. The build belongs in `prepack`. | CWE-494 | Missing control |
| 8 | **`files: ["scripts"]` ships the installer with no review surface.** `scripts/install.sh` prefers a co-located `setup.js` and `exec`s it; the `files` allowlist is path-based, so the untracked `scripts/run-tests.js` also ships. Nothing in the shipped runtime needs `scripts/` — both `bin` entries point at `out/`. | CWE-829 | Hygiene |
| 9 | **Installer quickstart is pinned to a mutable ref.** `README.md:83,88` fetch `install.sh` / `install.ps1` from `.../main/scripts/…` — `curl … | bash` with no tag, SHA-256, or signature, then `npx -y superpowers-mcp setup` resolves from the registry at execution time. | CWE-494 | Accepted, documented |
| 10 | **`overrides.fast-uri: ^4.2.1` is a cross-major override** of `ajv@8.18.0`'s declared `^3.0.1`. **Verified not a live breakage**: `uri` / `uri-reference` / `email` / `hostname` formats and relative, absolute and sibling `$ref` resolution all pass; `ajv` is never `require`d at runtime by the stdio bundle. It is a latent supply-chain hazard — `npm audit` reports 0 for both majors, so nothing structurally watches this boundary. | CWE-1327 | Hygiene, latent |
| 11 | **`\bbug\b` narrows the pipeline classifier.** `"there are bugs in the parser"`, `"bugs"`, `"buggy"` and `"bugfix"` no longer select Pipeline 2 (`lower.includes("bug")` did); `"reNEWal"` / `"newest"` are correctly no longer Pipeline 1. Also `/\b(refactor\w*|migrat\w*|upgrad\w*)/` omits the trailing `\b` the other branches use. ReDoS: all four patterns measured at ≤0.3 ms on 32 768-char adversarial inputs, and the 32 KiB argument cap bounds them regardless. | CWE-20 | Correctness, not a vulnerability |

### Rejected / downgraded candidates

Recorded so a later pass does not re-raise them:

- **`ajv-formats` `TypeError: uri is not a function`** — **falsified**; it was the auditing harness's own bad `addFormats` interop call. See finding 10 for the surviving (hygiene) version.
- **`overrides` absent from `package-lock.json`** — structurally true (`packages[""].overrides` is `undefined`), but **no security consequence**: the lock's `packages` map already pins `proxy-addr 2.0.8`, `qs 6.16.0`, `hono 4.13.7`, `fast-uri 4.2.1`, `@hono/node-server 2.1.1`, and an isolated `npm ci --dry-run` installs exactly those. Worth recording for self-documentation; editing an `overrides` entry does hard-fail `npm ci` rather than re-resolving.
- **Dangling `[BASE_SHA]`** after its removal from the `sdd-re-review` map — clean. `re-review-prompt.md` contains no bare `[BASE_SHA]`, and `[BASE_SHA]` is not a substring of `[FIX_BASE_SHA]`.
- **Appendix-guard bypass** — the guard is sound as written: it runs on template lines only and substitution is a single non-recursive pass, so no caller value can flip the discriminator. Its only damage is finding 4.
- **`isUnsafeSkillName` bypasses** — ten bypass classes evaluated (`%2F`, `%252e%252e%252f`, `C:\foo`, `C:foo`, fullwidth solidus, Windows trailing dot/space, `\0`, case, prefix trick, empty/`.`/`..`). All either blocked or inert: the only consumer is `SkillsManager.findSkill`, a `Map.get` over `readdir`-minted keys, and **no caller-supplied string is ever joined onto a filesystem path**.
- **SSRF in `upstream-drift.js --fetch`** — host is pinned to `https://api.github.com/${endpoint}`; `--repo` / `--ref` are operator CLI args, percent-encoded per segment. `encodeURIComponent` does not encode `.`, so `--repo ../../foo` yields a same-host path-normalization trick against `api.github.com`, not a host escape.
- **stdout / JSON-RPC corruption** — zero `process.stdout` writes in `src/`; the setup CLI path `return`s before `new StdioServerTransport()`.
- **`copy-skills.js` manifest-driven `unlinkSync`** — the manifest entries come from the source walk and the script is referenced by no `package.json` script, so it is dead code in the published package.
- **`esbuild@0.28.1` `postinstall`** network fetch — real but build-CI-only; `esbuild` is a devDependency and consumers run prebuilt `out/*.js`.
- **Dependency advisories** — `npm audit` reports **0** for both production and development trees. No CVE is re-reported here.

### Re-verified clean (independent of the above)

`npm run build` ok · `npx tsc --noEmit` clean · `npm test` **10/10 suites** · PowerShell suite **128/128** · `npm audit` 0 · `npm run drift` 0 drift (12 fork-only files) · `git diff --check` clean · 0 `eval` / `new Function` / `innerHTML` / `document.write` / `shell: true` in shipped source · `child_process` argv-only apart from the fixed literal `execSync("node esbuild.js")` · no `pre`/`install`/`postinstall`/`prepare`/`prepack` lifecycle hook · runtime `dependencies` empty · 0 secrets and 0 world-writable tracked files · `.omo/`, `.devin/`, `.gemini`, `.pi-subagents/`, `.codegraph` all ignored · the shipped `out/` bundle contains no `express` / `proxy-addr` / `hono` and requires no undeclared runtime dependency · the brainstorming companion server is loopback-gated at module load with token auth, nonce CSP and `O_NOFOLLOW` content reads.

### Regression floor

Assertion census re-measured on this tree: **Node.js 236 + Bash 32 + PowerShell 128 = 396**, all passing — `setup_test.js` 94, `upstream_sync_test.js` 30, `brainstorm_server_test.js` 35, `mcp_coverage_test.js` 25, `prompts_compositions_test.js` 20, `edge_cases_test.js` 14, `drift_test.js` 11, `run_test.js` 7; Bash `test-task-done.sh` 25 + `test-task-start.sh` 7; PowerShell 128. v6.4.6 documented **409** (Node.js 214 + Bash 67 + PowerShell 128); the Node.js and PowerShell tiers grew, while the Bash tier's earlier figure is not reproducible from the current two Bash suites and is recorded here as measured rather than restated.

### Residual risk / not covered

- `skills/diagnosing-superpowers/` (19 files) — reads on-disk agent transcripts and drafts GitHub issues — was **not** analysed in this pass.
- The PowerShell suite is **not** part of `npm test`; it runs separately via `tests/powershell/run-tests.sh` (skips cleanly when `pwsh` is absent).
- Duplicate-key YAML semantics (finding 5) are reasoned analytically — no YAML parser was available to confirm permissive last-wins versus strict rejection empirically.
- Bundle freshness was established by mtime, by literal-string greps for the new code, and by a fresh esbuild comparison — all four targets match.

## v6.4.6 (2026-10-06) Full Project Security Scan & Dependency Remediation Notes

- **Scope**: full-project security scan covering `src/*.ts`, `skills/brainstorming/scripts/server.cjs`, `scripts/`, `esbuild.js`, dependency advisories (`npm audit`), secret/permission hygiene, and every automated suite. Two post-v6.4.5 source fixes are documented here for the first time; all v6.4.2–v6.4.5 controls below remain in force.
- **Transitive advisories remediated (`npm audit` 2 → 0)**: the scan found two new advisories against the v6.4.5 lockfile — GHSA-6qxp-vccf-f47h (high, `@modelcontextprotocol/sdk` 1.12.0–1.30.1: OAuth client could send credentials to an MCP-server-chosen authorization server) and GHSA-jqcg-44mw-7w3h (critical, `proxy-addr` 1.1.0–2.0.7 via `sdk → express`: IP spoofing through IPv4-mapped IPv6 trust subnets). Neither is reachable in the shipped bundle: `src/server.ts` imports only `Server`, `StdioServerTransport`, and `types` (no OAuth client, no StreamableHTTP/express listener — `proxy-addr`/`express` strings are absent from `out/server.js`), and both packages are build-time-only `devDependencies`. Remediation: `devDependencies.@modelcontextprotocol/sdk` raised `^1.5.0` → `^1.32.1` (lockfile 1.26.0 → 1.32.1, past the fixed 1.31.0 floor) and a new `overrides.proxy-addr ^2.0.8` floor pins the fixed release (lockfile 2.0.7 → 2.0.8). `npm audit` reports **0 vulnerabilities**.
- **Post-v6.4.5 source fixes now on record** (landed as `d82c8b9` / `b9a3ea6`, each with fail-without / pass-with regression tests):
  - *Brainstorming frame injection preserves literal `$` tokens* (`skills/brainstorming/scripts/server.cjs`): `wrapInFrame()` and the `</body>` helper injection used string-pattern `String.replace`, which expands `$&` / `$\`` / `$'` / `$$` / `$n` sequences in agent-authored HTML — re-injecting the frame template into the page and truncating the screen. Both sites now use function replacers (`() => content`, `() => injection + '\n</body>'`), inserting the text verbatim. Pinned by integration test 11b (renders a screen containing all five token forms) plus static test 11c asserting both call shapes.
  - *Single-flight skill scans + YAML quoting + prompt append guards* (`src/skills-manager.ts`, `src/server.ts`, `src/setup-runner.ts`): the cold path (fingerprint + scan) is now one shared promise created with no intervening `await`, so a burst of k concurrent cold callers performs one scan (700-skill dir: 1/5/20 callers issue identical 700 lstat / 701 stat / 700 open); scan results publish only when `scanEpoch` still matches, so a concurrent `clearCache()` cannot be repopulated by a stale scan (edge-cases Test 12); YAML root/child keys match with or without quotes (a quoted `"mcp_servers":` previously produced a duplicate-key block on add and a silent no-op on remove), removal of the last entry emits an explicit `{}` instead of a null-valued bare header, and every return path preserves the file's CRLF/LF convention; three reviewer/implementer prompt guards now test the placeholder key instead of the substituted value (the old value-comparison was a permanent no-op that could duplicate legacy sections).
- **Scan results — no new findings**: `eval` / `new Function` / `innerHTML` / `document.write` / `shell: true` = 0 in shipped source; `child_process` appears only as `execFile` with argv (no shell) in `server.cjs` and one fixed-string `execSync("node esbuild.js")` in `scripts/setup.js`; temp files use `crypto.randomBytes(8)` nonces with `wx` exclusive creation + atomic rename; no hardcoded API keys/tokens/private keys in tracked files; zero world-writable files (excluding `.git` / `node_modules`); all dynamic RegExp patterns remain anchored with no nested quantifiers (ReDoS discipline); `SKILLS_PATH` confinement, skill-name traversal rejection, TOCTOU inode re-verification, `allowedRoots` containment, and `0o700`/`0o600` least-privilege modes all verified in force.
- **Verification (2026-10-06)**: `npm run build` ok; `npx tsc --noEmit` clean; `npm test` green — regression floor now **409 assertions** (Node.js 214 + Bash 67 + PowerShell 128): setup suite 78/78 (+9), edge-cases 12/12 (+1 Test 12), brainstorming companion 35/35 (+2 token tests), prompts/compositions 18/18 (+1); `npm audit` **0 vulnerabilities**; `git diff --check` clean.

- **Scope**: three open CodeQL code-scanning alerts in `src/setup-runner.ts` reported against v6.4.3 (`js/polynomial-redos` #5, `js/prototype-polluting-assignment` #6/#7). All 7 repository alerts now read **fixed**; the v6.4.2/v6.4.3 controls below remain in force.
- **TOML polynomial-ReDoS eliminated (Alert #5)**: the quoted-table detector `/^\s*\[.*["']mcp_servers["'].*["']superpowers["'].*\]\s*(?:#.*)?$/` stacked three overlapping `.*` repetitions and evaluated polynomially on attacker-controlled config lines starting with `["mcp_servers"`. Replaced with single-pass linear scanners — `isQuotedManagedTableHeader()` / `isTomlTableHeader()` (`lastIndexOf("]")` + `includes`, no backtracking) — plus a linear `parseTomlManagedAssignment()` for `command`/`args` lines. A 15 KB adversarial header now processes in ~6 ms per 100 runs; quoted-variant fail-closed behavior is preserved and covered by `tests/setup_test.js`.
- **Prototype-pollution guard on nested JSON paths (Alerts #6/#7)**: `updateJsonConfig(..., serverPath)` performed computed assignments (`container[segment] = {}`, `container = container[segment]`) on library-input path segments, so a `"__proto__"` segment turned `container` into `Object.prototype` and the later `container["superpowers"]` write mutated the global prototype. Now fails closed up front on `__proto__` / `constructor` / `prototype` (literal comparisons CodeQL recognizes as sanitizers, re-asserted at the use site) and restricts segments to `^[A-Za-z0-9_-]+$`.
- **Verification (2026-09-28)**: `npm test` green — regression floor **389/389** intact (setup suite 69/69); `npx tsc --noEmit` clean; `npm audit` (0 vulnerabilities) clean; CodeQL code-scanning **0 open / 7 fixed**.


## v6.4.3 (2026-09-28) Codex / OpenClaw / Goose Target Notes

- **Scope**: new `codex` (TOML), `openclaw` (nested JSON), and `goose` (YAML profile) setup targets in `src/setup-runner.ts`, new setup-test assertions, README table rows (7 languages), `scripts/install.sh` target enumeration. v6.4.2 audit findings below remain in force.
- **TOML updater is surgical text, not a parser**: only `[mcp_servers.superpowers]` (exact bare header) plus its `[mcp_servers.superpowers.…]` sub-tables are touched; everything else is preserved byte-for-byte, including user keys (`enabled`, `env`, `cwd`, timeouts) and comments. No TOML library added — runtime dependencies stay empty.
- **Fail-closed shapes**: duplicate managed tables and quoted table-name variants (`["mcp_servers"."superpowers"]`) throw instead of writing; remove mode deletes the parent table together with its sub-tables and never touches other servers.
- **ReDoS discipline kept**: all patterns are anchored with no nested quantifiers (same rule as the YAML updater that closed CodeQL Alert #4); quote-aware comment scanning is a single linear pass.
- **Write path unchanged**: all three formats go through the same `safeWriteConfig` atomic temp-file + rename gate with `0o700` directory creation, allowed-root confinement, optional `--backup` (pruned to 10 newest), and `--dry-run` preview.
- **YAML profile keeps ReDoS discipline**: the goose profile reuses anchored-only dynamic patterns built from internal constants; quote-aware comment scanning stays a single linear pass.
- **Nested JSON stays fail-closed**: non-object containers on the `mcp.servers` path throw instead of writing; removal with a missing path returns the file untouched.
- **Verification (2026-09-28)**: `npm test` green — **389/389** assertions (Node.js 194, Bash 67, PowerShell 128); `npm run build` and `npm audit` (0 vulnerabilities) clean.


## v6.4.2 (2026-09-24) Code Review & Audit Remediation Notes

> Security notes for the **v6.4.2** patch release (hardening that landed after v6.4.1). Audit findings archive: `.audit/` (server/pipelines, setup/skills, esbuild/scripts, tests).

- **Scope**: line-by-line code review of `src/server.ts`, `src/pipelines.ts`, `src/skills-manager.ts`, `src/setup-runner.ts`, `scripts/setup.js`, `scripts/copy-skills.js`, `scripts/upstream-drift.js`, `esbuild.js`, and the full test harness.
- **Input-validation order fixed (URI / skill-name traversal)**: percent-decoding now happens **before** the `skill` allowlist regex runs; the decoded name is bounded to `[A-Za-z0-9._-]` with a length cap, so double-encoded traversal (`..%2f`, `%2e%2e%2f`), encoded NUL, and oversized names are rejected with `InvalidParams`. Unknown `call_tool` / `get_prompt` names now throw `InvalidParams` instead of `MethodNotFound`.
- **TOCTOU / canonical-path re-verification**: the symlink walk re-checks the canonical path after resolution and before use (directory-swap window closed); streamed skill imports re-stat after the read and roll back when `size` / `mtimeMs` changed mid-read.
- **Manifest-gated destructive cleanup**: `copy-skills.js` records every file it copies; only manifest-listed upstream skills are eligible for cache cleanup (fork-specific skills can never be deleted), missing upstream sources exit `0` instead of creating false drift, and mtime/size staleness is re-checked so stale in-memory builds are never trusted.
- **Atomic, race-safe persistence**: drift baselines and coverage records write through a temp file + `rename`; `setup.js` serializes builds with an exclusive (`wx`) lock and re-reads `mtimeMs`/`size` after its own rebuild, so concurrent installs can no longer ship a half-written `out/setup.js`.
- **Fail-soft sync & graceful teardown**: truncated or failed upstream trees no longer emit "removed skill" drift; MCP shutdown reuses the process exit code instead of masking failures with `process.exit(0)`.
- **Build / test integrity**: `esbuild.js` applies `chmod 0755` in watch mode too; the coverage watchdog is ref'd and cleared on the success path, server `exit`/`close` handlers fail the run instead of hanging to a silent exit 0, drift tests run under a network guard (`tests/block_network.cjs`), and privilege-limited skips can no longer inflate pass counts.
- **Verification (2026-09-25)**: `npm test` green — Node.js 170 + Bash 67 assertions re-run on macOS; regression floor unchanged at **365/365** (PowerShell suite untouched). `npm run build`, `npm run drift`, and `npm audit` (0 vulnerabilities) all clean.

## v6.4.1 Native Plan Execution, Session Forensics & Deferred-Export Integrity Notes

- **Zero-dependency, zero-advisory floor retained**: `npm audit` reports **0 vulnerabilities**. Runtime dependencies remain empty; the verified overrides (`hono` ^4.13.7, `@hono/node-server` ^2.1.1, `fast-uri` ^4.1.3, `qs` ^6.16.0) are unchanged. No `eval` / `new Function` / `innerHTML` / `document.write` / `shell: true` in shipped source.
- **Inline plan helpers execute test commands as argv, not a shell** (`skills/executing-plans/scripts/task-done`, `task-done.ps1`):
  - Bash runs `"$@"` after a required `--` separator; PowerShell runs `& $exe @rest` with `-LiteralPath` I/O and UTF-8-without-BOM ledger writes.
  - The command line recorded in the ledger is a display rendering only. The executed argv is never re-parsed through `bash -c`, `Invoke-Expression`, or `shell: true`.
  - PowerShell consumes an unquoted `--` as its own end-of-parameters marker; the `.ps1` port documents that limitation and still rejects a quoted `"--"` with no command. This is a host parsing constraint, not command injection.
  - `task-start` / `task-done` invoke `sdd-workspace` via `"${BASH:-bash}"` (and the `.ps1` twin) so marketplace extractors that strip `+x` cannot silently skip workspace isolation (upstream #2040).
  - Workspace resolution inherits `sdd-workspace`'s `CDPATH=''` sanitization, plan-scoped directory isolation, and canonical path markers.
- **Session forensics skill is local-read, export-gated** (`skills/diagnosing-superpowers/`):
  - Analysts read on-disk transcripts at verified absolute paths (`references/session-discovery.md`); they do not diagnose superpowers and do not open a network listener.
  - Bundles are never built unprompted. GitHub issues are created only after partner approval. `references/redaction-policy.md` requires placeholders for emails, people, org ids, secrets, hosts, home paths, private repos, and proprietary terms.
  - Scrubbing is best-effort: the skill tells the partner to review every file before sharing. That residual disclosure risk is accepted and documented, not claimed as a cryptographic guarantee.
- **Deferred-findings export grep no longer drops inline minors**: both `executing-plans` and `subagent-driven-development` now grep
  `Ruling:|^(Task [0-9]+: |Final: )?(minor \(deferred\)|parked)`
  so `Final: minor (deferred): …` is exported, while completion lines such as `Task 5: complete (…, 2 parked)` stay excluded. Locked by `tests/upstream_sync_test.js` check `12b`.
- **Remote-safety boundary retained in the rewritten executing-plans flow**: no agent-initiated push/pull/fetch or `git push --force*` to shared branches; shared-branch tracking is a stop-and-fix.
- **Local Devin config is gitignored**: `.devin/` (including `config.local.json`, mode `0600` when present) is untracked. The 2026-09-21 scan found a local permissions-only file and closed the accidental-add path.
- **Localized README floor**: `README.md`, `README.zh-TW.md`, `README.ja.md`, and `README.ko.md` badge **v6.4.2** and document the 365-assertion audit (argv `task-done`, export-gated diagnosing, deferred-findings grep, `.devin/` gitignore), plus the v6.4.2 (2026-09-24) audit-remediation entry above v6.4.1.

## v6.3.10 Security Hardening, Key Conflict Resolution & Cache Stat Integrity Notes

- **Universal Global Setup Concurrency, Inode Defense & Symlink Escape Neutralization (`src/setup-runner.ts`)**:
  - **Allowed Roots Boundary Containment (`safeWriteConfig`)**: Enforces explicit allowed destination root boundaries (`allowedRoots: [homeDir, appData, localAppData]`). Checks `path.relative` against canonical realpaths to guarantee that configuration files cannot be redirected outside authorized roots through malicious parent-directory symlinks.
  - **Protected System Targets Filtering**: Blocks writes to `/etc`, `/bin`, `/sbin`, `/usr`, `/root`, `/sys`, `/proc`, `/dev`, `/private/etc`, `/var`, `/private/var`, and `C:\Windows` unless located safely within `os.tmpdir()`.
  - **Optimistic Concurrency & Race Conflict Defense**: Verifies disk content against `expectedContent` immediately prior to atomic `fs.renameSync`, throwing an actionable error if configuration changed concurrently to prevent stale overwrites.
  - **Directory Inode & Device TOCTOU Verification**: Re-checks parent directory canonical path, device ID (`dev`), and inode (`ino`) before and after temporary file creation, blocking directory swap attacks during configuration commits.
  - **Multi-Root Key Conflict Resolution (`updateJsonConfig`)**: Defensively inspects all recognized server root keys (`servers`, `mcp`, `mcpServers`) before insertion, preventing duplicate or conflicting declarations across AI client implementations.
  - **User-Managed Fields Lossless Preservation**: Re-running setup safely merges and preserves user-authored configuration fields (`env`, `cwd`, `disabled`, `alwaysAllow`, `args`), avoiding silent configuration loss across tool upgrades.
  - **Contradictory Flag Elimination**: Prevents simultaneous presence of opposing flags (such as `disabled: true` and `enabled: true`), maintaining unambiguous client execution states.
  - **Strict Position Argument & Malformed CLI Guard (`runSetupCli`)**: Fails closed with exit code 1 when extra unexpected arguments or invalid option flags are provided.
  - **Non-Truncating Process Termination (`process.exitCode = 1`)**: Replaced abrupt `process.exit()` calls with `process.exitCode` assignment, ensuring standard I/O streams flush completely over Unix pipelines and package runners.
  - **Fail-Closed Configuration Validation**: `updateJsonConfig` strictly validates that the root and `mcpServers`/`servers`/`mcp` fields are objects, failing closed on invalid shapes; `updateYamlConfig` rejects duplicate keys and non-root blocks.
  - **YAML Polynomial ReDoS Mitigation & Linear Scanning (`updateYamlConfig`, `extractInlineComment`)**: Replaced unanchored backtracking patterns `\s*(.*?)\s*$` and unanchored comment regexes with unambiguous key matching and single-pass linear string scans. Mitigated CodeQL `js/polynomial-redos`, guaranteeing linear processing time (<1ms) even on YAML padded with 60,000+ whitespace characters.
  - **YAML Comment Preservation & Round-Trip Resilience**: Preserves user-authored inline comments (`extractInlineComment`) and block comments across installation, command update, and removal lifecycles.
  - **Desktop App Configuration Safe Export (`--print-config`)**: Generates importable `mcpServers` JSON without touching or modifying filesystem paths; strictly rejects file-mutating flags (`--target`, `--remove`, `--backup`, `--dry-run`) when `--print-config` is used.
  - **Expanded Multi-Harness Ecosystem (17 AI Agent Environments)**: Adds support for LM Studio (`~/.lmstudio/mcp.json`) and Roo Code (`mcp_settings.json` across macOS, Windows, Linux) with idempotent lifecycle merging, backup, and removal safety.
- **Skills Core Engine Collision Defense, Stat Cache Integrity & Prompt Robustness (`src/skills-manager.ts`, `src/server.ts`)**:
  - **Single-Stat Invalidation Verification (`tryReadFromContentCache`)**: Replaces full directory rescans on individual skill reads with a fast-path `fs.stat` verification against cached filesystem snapshots (checking device ID `dev`, inode `ino`, file size `size`, and modification time `mtimeMs`). Guarantees that symlink redirection or underlying file swapping immediately invalidates stale cache without performance penalty.
  - **Epoch Single-Flight Scanning & Clear Invalidation (`clearCache`)**: `clearCache()` monotonically increments `scanEpoch` and resets `loadingEpoch`, preventing concurrent in-flight reload operations from committing stale entries after cache invalidation.
  - **Strict Open File Descriptor Inode Verification**: `readFileNoFollow` performs canonical path checks and binds validation directly to the opened descriptor (`fd.stat()`), defending against TOCTOU races between path check and descriptor open.
  - **Empty Template Rejection & Structured Diagnostics (`readPromptFileSafe`)**: Detects and halts execution on empty prompt template files, outputting structured diagnostics to `stderr` and returning `McpError(ErrorCode.InternalError)` rather than serving silent blanks.
  - **Applied Interpolation Tracking**: Tracks applied template replacements, eliminating redundant or spurious legacy argument appends when caller arguments match template placeholders.
  - **Deterministic Sorting & Name Collision Defense**: Catalogs directories in deterministic alphabetical order and detects alias/name collisions in `newSkillMap`, emitting diagnostic warnings and skipping duplicates rather than arbitrarily overwriting memory caches.
  - **Automatic Cache Revalidation (`CACHE_REVALIDATE_MS = 1000`)**: Transparently re-reads disk state when cache age exceeds 1 second, allowing on-disk edits to reflect immediately without requiring MCP server restarts.
  - **Platform Case-Folding & Canonical `SKILLS_PATH` Defense (`src/server.ts`)**: Applies platform case-folding (`darwin`, `win32`) and validates paths via `fs.realpathSync` (`canonicalized`) before checking against unsafe prefixes, ensuring symlinks to system roots cannot bypass blacklist checks.
- **RFC 6455 WebSocket Protocol & Resilient Stream Hardening (`skills/brainstorming/scripts/server.cjs`, `helper.js`)**:
  - **Fragmented Message Reassembly**: Added support for `CONTINUATION` (opcode `0x00`) frames with payload size aggregation (`fragmentedBytes`), enforcing `MAX_FRAME_PAYLOAD_BYTES` limits across fragmented chunks.
  - **RFC 6455 Compliance**: Strictly validates that control frames (`opcode >= 0x8`) must not be fragmented (`fin === true`) and carry ≤125 bytes. Rejects frames with non-zero RSV bits (`rsv !== 0`) and unsupported opcodes.
  - **Resilient Tail Event Compaction (`appendEvent`)**: When `events.jsonl` exceeds `MAX_EVENTS_FILE_BYTES`, retains recent newline-delimited records rather than clearing the entire history, preserving recent context while preventing file bloat.
  - **Secure Append Mode**: Opens event files with `O_RDWR | O_APPEND | O_CREAT | O_NOFOLLOW` ensuring atomic file truncation and read operations.
- **Shell & PowerShell Script Command Injection Defense & Unicode Resiliency**:
  - **Test Runner Command Injection Defense (`find-polluter.sh`, `find-polluter.ps1`)**: Supports caller-supplied test commands through safe array expansion (`"${TEST_COMMAND[@]}"` and `& $testCommand @testCommandArgs`), while using `while IFS= read -r` loops to safely parse test paths containing spaces.
  - **CDPATH Redirection Sanitization (`sdd-workspace`)**: Sanitizes `CDPATH=''` before all `cd` operations, neutralizing directory redirection attacks in environments with configured `CDPATH`.
  - **Lossless Unicode Plan Marker Persistence (`sdd-workspace.ps1`)**: Writes plan marker files with `[System.Text.UTF8Encoding]::new($false)` (UTF-8 without BOM), ensuring lossless Unicode path round-tripping across PowerShell executions.

## v6.3.7 Upstream Sync, Git-Safety & Regression Guard Notes

- **Content-only synchronization**: Batches 1–4 import reviewed upstream `obra/superpowers` skill text and modify the SDD helper scripts (`sdd-workspace`, `review-package` and their `.ps1` twins) — trigger phrases, no-test-command evidence law, brainstorming intent gates, planning-handoff review, saved-plan review gate, plan-checkbox bookkeeping, remote-safety boundary, Discoveries ledger, deferred-findings export, greenfield scripts, TDD characterization guard, moved-content link re-resolution, and the SDD review-file contract (reviewers write the full report to a review file and answer in under 15 lines). Beyond the version constant, the release changes three surfaces outside that imported text: the `review_file` argument on `sdd-task-reviewer` / `sdd-re-review`, which is derived from the report or brief file when omitted and replaced by that derived sibling when the requested path normalises to either (so a reviewer is never pointed at the implementer's report); the previously silent `[FIX_BASE_SHA]` placeholder, now fed by the `fix_base_sha` alias (alongside the pre-existing `base_sha` argument) on `sdd-re-review`; and the skill-script host defaults in `skills/brainstorming/scripts/start-server.sh` / `.ps1`, whose non-loopback values are refused before launch on the PowerShell path and by the companion server on the bash path. The v6.3.6 attack surface, input validation, and permission model remain in force.
- **Remote-safety boundary**: the adopted guidance forbids agent-initiated push/pull/fetch and force-pushes from inside a task, requires shared-branch tracking to be dropped before the first commit (`--no-track` / `--unset-upstream`), and routes any mid-task push demand to the controller as BLOCKED — a behavioral control against accidentally publishing or rewriting shared branches.
- **MCP description fidelity**: upstream's escaped-quote YAML descriptions were converted to unquoted plain scalars, so the `SkillsManager` frontmatter parser cannot emit literal backslashes or truncated descriptions to MCP clients.
- **Zero-dependency delta**: no new runtime or development dependencies; the verified overrides (`hono`, `@hono/node-server`, `fast-uri`, `qs`) and the `npm audit` zero-vulnerability status are unchanged. `package.json` now declares `engines.node >= 18`, the floor the drift tool's `fetch` fallback needs.
- **Regression guard for future syncs**: [`tests/upstream_sync_test.js`](tests/upstream_sync_test.js) carries 22 labeled checks wired into `npm test`, the greenfield script behavior is covered in both the bash SDD suite and the PowerShell suite (90 assertions across 5 files), and the new MCP surface coverage suite asserts that every shipped skill is an exposed resource serving its own content and that the prompt inventory matches all four READMEs exactly, so a later sync cannot silently drop or misroute the adopted behavior.
- **Upstream drift baseline**: [`tests/upstream-sync-baseline.json`](tests/upstream-sync-baseline.json) holds only public upstream blob SHAs, the repo/ref/date, skill names and the deliberately-unadopted list — no tokens, credentials, absolute paths or environment data. [`scripts/upstream-drift.js`](scripts/upstream-drift.js) is read-only except `--record`, which writes that single file and never touches git state; network reads use `gh api` with a public API fallback and a 20s timeout. A truncated listing suppresses `--fail-on-drift` in report mode and is refused entirely by `--record`, preserving the last complete baseline.

## v6.3.6 Security, Architecture & Performance Hardening Notes

- **Skills Core Engine Partial-Read Defense & TOCTOU Elimination (`src/skills-manager.ts`)**:
  - **Looping Partial-Read Guarantee (`readFileNoFollow`)**: Fixed a subtle boundary condition where single `fd.read` calls could return partial buffer contents under high disk concurrency, virtualized filesystems, or slow storage devices. Implemented an accumulator loop `while (totalRead < fileSize)` with byte-level boundary verification, eliminating silent markdown truncation risks.
  - **Canonical Path Cache Normalization & Alias Drift Defense**: Standardized all in-memory skill content caching on physical canonical paths (`realFilePath`) and linked external aliases through `canonicalPathMap`. Invalidation (`forceReload`) atomically purges both primary entries and aliased pointers, eliminating symlink cache drift where modified underlying files remained stale under alternate paths.
  - **Scan Epoch Concurrency Shield (`listSkills`)**: Introduced a monotonically increasing `scanEpoch` counter for asynchronous catalog scans. Late-finishing or aborted concurrent reload operations cannot clobber newer cache states, preventing race conditions during rapid directory rescans.
  - **ReDoS Mitigation in Frontmatter Parsing (`parseFrontmatter`)**: Refactored frontmatter extraction to operate on bounded prefix slices (first 64 KB) with non-backtracking regular expressions, eliminating quadratic ReDoS hazards on excessively large files.
  - **Enhanced System Directory Filtering (`getSafeSkillsPath`)**: Expanded the path blacklist to intercept macOS-specific system trees (`/private/etc`, `/private/var`), preventing attackers from pointing `SKILLS_PATH` to sensitive internal operating system stores.
- **Universal Global Setup Engine Symlink Traversal Protection (`src/setup-runner.ts`)**:
  - **Symlink Breakout Defense (`safeWriteConfig`)**: Enhanced configuration writing to inspect target paths with `fs.lstat` and canonical realpath resolution before modification, blocking write attempts when target config files are symlinks pointing outside permitted boundaries to sensitive root directories (while safely retaining support for legitimate `os.tmpdir()` sandboxes).
  - **JSON Parsing Fast-Path Optimization (`stripJsonComments`)**: Replaced redundant regex processing with a fast-path direct `JSON.parse` trial, reducing comment stripping overhead to sub-microsecond latency (0.55 µs) while strictly maintaining rejection of invalid structures.
- **Strict Code Quality & Rule 7 Compliance**:
  - Eliminated dead code (`exists` method in `SkillsManager`), achieving clean compilation under strict `--noUnusedLocals --noUnusedParameters`.
  - Replaced all untyped or empty catch blocks with strictly typed exception bindings (`unknown`/`Error`), eliminating unhandled suppression and diagnostic blind spots.
- **Parallel Multi-Target Bundling Security (`esbuild.js`)**:
  - Upgraded build script to `Promise.all` across all 4 independent output artifacts (`server.js`, `setup.js`, `setup-runner.js`, `skills-manager.js`), ensuring clean non-interfering compilation scopes with zero global variable leakage.

## v6.3.4 Security & Hardening Notes

- **Targeted Global Setup & Anti-Virus Design (`src/setup-runner.ts`, `scripts/setup.js`, `scripts/install.sh`, `scripts/install.ps1`)**:
  - **Explicit Consent Mandate**: Completely eliminated unprompted bulk scanning or blind filesystem crawling (`--all` removed). Configuration now strictly requires `--target <client>` specification. Executing without a target outputs interactive guidance and cleanly exits without touching, reading, or writing any files on the host system.
  - **Multi-Harness Co-existence & Copilot Insiders Isolation**: Provides fully isolated configuration paths for GitHub Copilot (VS Code Insiders) (`Code - Insiders/User/mcp.json`) distinct from standard VS Code (`Code/User/mcp.json`) across macOS, Linux, and Windows. Guarantees zero cross-contamination: configuring or removing superpowers in either environment operates independently without collision. Aliases (`copilot-insiders`, `vscode-insiders`, `code-insiders`, `insiders`, `insider`, `copilot-insider`) inherit strict JSON schema validation, prototype pollution guards, and atomic write isolation.
  - **Atomic File Operations & Race Defense (`safeWriteConfig`)**: Employs non-destructive atomic write pattern utilizing temporary files scoped to the target directory with process ID and a cryptographically secure 8-byte hexadecimal nonce (`crypto.randomBytes(8)`). Writes enforce `flag: "wx"` (exclusive creation, preventing symlink pre-creation hijacking) followed by atomic commit via `fs.renameSync`. Transient write errors trigger best-effort temporary file cleanup.
  - **Symlink Boundary Preservation**: Resolves target paths via `fs.realpathSync` to preserve symbolic link destinations while guarding containment boundaries, handling dangling symlinks safely.
  - **Strict Least-Privilege Permissions**: Automatically creates parent configuration directories with restricted mode `0o700` (`rwx------`). Configuration files are written with `0o600` (`rw-------`) or retain existing target permissions. Pre-write backup files (`.bak`) strictly inherit source permissions.
  - **Injection-Free Serialization**: All executable commands and argument arrays injected into YAML and JSON configurations are defensively serialized and escaped with `JSON.stringify`, neutralizing parameter breakout and YAML structural injection vectors.
  - **JSONC Compatibility & Prototype Pollution Defense**: `updateJsonConfig` first performs native `JSON.parse` to preserve raw string literals containing comments (`//`). On parse failure, falls back to comment/trailing comma stripping with strict `isPlainObject` validation, blocking Prototype Pollution and root Array corruption.
  - **CLI Stdio Isolation**: `src/server.ts` routes `setup` arguments directly in `main()` before initializing any MCP server transports, preventing standard I/O pollution or JSON-RPC protocol corruption.
  - **Shell Script Hardening**: `scripts/install.sh` enables `set -euo pipefail` and strictly quotes variable expansions (`"$@"`). `scripts/install.ps1` sets `$ErrorActionPreference = "Stop"` and passes arguments via array parameters (`@argsList`).
- **Prompt Injection & Cascading Template Defense (`src/server.ts`)**:
  - **Single-Pass Regex Interpolation (`interpolateTemplate`)**: Refactored template substitution engine into a single unified regex with sorted, escaped keys, performing single-pass replacement. This completely eliminates cascading / multi-pass template expansion vulnerabilities where user-injected strings mimic template placeholders (e.g., `<task_description>` inside an argument expanding secondary variables).
  - **Prompt Argument Clamping & ReDoS Defense (`getStringArg`)**: Implemented safe argument extraction with explicit `hasOwnProperty` validation to neutralize prototype pollution, and strictly clamps string arguments to 32 KB (`MAX_PROMPT_ARG_LENGTH = 32 * 1024`), defending against memory exhaustion and ReDoS attacks.
  - **Argument Normalization**: Defensive `.trim()` and string coercion preventing type confusion and injection. Unknown prompts are rejected with standard `McpError(ErrorCode.InvalidRequest)`.
- **Supply Chain & Dependency Hardening**:
  - `npm audit` reports **0 vulnerabilities**. Exact overrides configured for `hono` (^4.13.7), `@hono/node-server` (^2.1.1), `fast-uri` (^4.1.3), and `qs` (^6.16.0) protect against upstream CVEs.

## v6.3.2 Security & Hardening Notes

- **MCP Standard Prompts Security & Injection Defense (`src/server.ts`)**:
  - `ListPromptsRequestSchema` and `GetPromptRequestSchema` are backed by `readPromptFileSafe`, which proxies all template reads through `SkillsManager.readSkillContent`.
  - All prompt template reads inherit double physical path containment verification (`fs.realpath`), relative path checks, and POSIX `O_NOFOLLOW` / inode identity matching (`readFileNoFollow`), eliminating arbitrary file read and symlink escape vectors.
  - Optional prompt arguments (`task_description`, `plan_file`, `previous_findings`, etc.) are defensively coerced and sanitized, preventing `undefined` leakage, template corruption, or shell injection. Unknown prompt requests are rejected with standard `McpError(ErrorCode.InvalidRequest)`.
- **Graphviz Binary Execution Hardening (`render-graphs.js`)**: Replaced shell-interpreted `execSync` invocations with direct binary execution via `execFileSync('dot', ...)`. This eliminates shell injection / command interpolation risks, enforces strict buffer bounding (`maxBuffer: 10 * 1024 * 1024`), provides robust `try...catch` error handling with `stderr` capture, and ensures Windows CRLF (`\r?\n`) compatibility and `winget` installation guidance.
- **Wave Dispatch & Parallel Worktree Isolation**: SDD now supports `Plan shape: skeleton-first` concurrent execution using dedicated Git Worktrees (`.worktrees/task-<N>`). Pre-flight conflict scanning strictly enforces file-disjoint conditions, while integration merges follow plan order sequentially. Any post-merge conflict or test regression triggers an automatic rebase-and-fix loop inside the worker's own worktree, preventing concurrent working tree pollution and race conditions.
- **Tier-Driven Model Selection & Strict Contract Defense**: Task contracts in `skeleton-first-plans.md` enforce explicit interface boundaries (`Consumes`/`Produces`) and concrete observable success criteria ("No Vague Contracts" gate). The SDD dispatcher and `implementer-prompt.md` map `Tier: mechanical` to cost-effective models and `Tier: judgment` to standard models, maintaining high precision without human re-litigation.
- **In-Flight Task Convergence & Amendment Propagation**: Step 5 enforces post-completion `Plan holds` or `Amendment:` ledger checks. In-flight parallel tasks in a wave are safely isolated and allowed to complete, while contract drifts are resolved naturally through integration merge rebasing and downstream prompt injection.
- **Zero Vulnerabilities Maintained**: `npm audit` reports **0 vulnerabilities**. All regression suites continue passing 100% (MCP protocol, Prompts dynamic injection, Security Edge Cases, SDD Bash/PowerShell, and Graphviz).

## v6.3.1 Security & Hardening Notes

- **SDD Ownership Markers & Path Normalization**: `sdd-workspace` (Bash) and `sdd-workspace.ps1` (PowerShell) now manage plan-scoped workspaces using `plan-path` markers with canonical physical path normalization (`pwd -P` and dynamic `pwd` detection). Same-basename plans (e.g. `docs/alpha/plan.md` vs `docs/beta/plan.md`) safely disambiguate into distinct `.superpowers/sdd/` workspaces, preventing artifact and ledger overwrites.
- **SDD Review Package Range Guards**: `review-package` and `review-package.ps1` enforce mechanical range integrity (`git merge-base --is-ancestor BASE HEAD` and `git rev-list --count BASE..HEAD > 0`, exiting with code 3) to prevent false-pass approvals on invalid or empty commit ranges.
- **PowerShell Wildcard Injection Defense**: `sdd-workspace.ps1`, `review-package.ps1`, and `task-brief.ps1` now strictly use `-LiteralPath` for all `Set-Content` and `Resolve-Path` calls, preventing wildcard interpretation errors when directory or plan names contain brackets (e.g. `[v1]`).
- **Execution Resilience on Stripped Permissions**: `task-brief` and `review-package` invoke `sdd-workspace` via explicit `"${BASH:-bash}"`, surviving environments where execution bits (`+x`) are stripped during archive extraction.
- **TDD Verification Floor & Code Review Anchoring**: TDD mandates project-wide suite execution before marking tasks complete; code review anchors multi-commit `BASE_SHA` to `git merge-base origin/main HEAD` to prevent phantom deletions.
- **Zero Vulnerabilities Retained**: Full regression tests pass across MCP protocol, Security, PowerShell suite (70 assertions), SDD bash suite (11 assertions), and Graphviz rendering.

## v6.3.0 Security & Hardening Notes

- **No server code changed — hardening fully retained**: this release synchronizes upstream skill documentation (obra/superpowers v6.3.0) only; the brainstorm companion server (`server.cjs`, `helper.js`, launchers) is byte-for-byte the hardened v6.2.4 implementation. All v6.2.2–v6.2.4 controls remain in force: loopback-only HTTP binds (non-loopback `BRAINSTORM_HOST`/`BRAINSTORM_URL_HOST` refused at startup), per-invocation key rotation with `--project-dir` persistence to an owner-only `.last-token` (`O_NOFOLLOW` fd reads, symlink/multi-link rejection, 0600 via fd), nonce CSP + `nosniff` headers, local inline brand SVG (no third-party requests from the companion page), RFC 6455 WebSocket validation with control-frame/`MAX_FRAME_PAYLOAD_BYTES` caps, bounded reads/logs, and the canonical temp-deletion guard.
- **Deliberately NOT adopted from upstream v6.3.0**: upstream's companion server simplification removed several of the above controls (loopback bind enforcement, `O_NOFOLLOW`/fd-identity token-file reads, nonce CSP, local brand SVG in favor of a remote image URL, WS control-frame caps, `BRAINSTORM_TOKEN`/`BRAINSTORM_PORT` validation). This package keeps its hardened server and its visual-companion documentation; adopting upstream's version would have reintroduced the XSS surface (remote image load), removed the symlink-swap defense on `.last-token`, and allowed non-loopback plain-HTTP binds.
- **Documentation consistency**: `visual-companion.md` still documents the fork's actual behavior (HttpOnly/SameSite cookie auth, `.last-token` persistence + rotation remediation, loopback-only binding with SSH-tunnel guidance, local brand SVG). Adopted skill docs contain no instructions for upstream-only features (`0.0.0.0` binds, sessionStorage key handoff, remote brand image) — verified by dual-agent code review.
- **Data-loss risk fixed (finishing-a-development-branch)**: in the merged path, the removal-refused menu's "Commit them to <branch>" option could leave the new commit outside the base branch, causing `git branch -d` to refuse and tempting agents to force-delete (`-D`) — destroying the files the user just chose to preserve. The procedure now instructs re-merging (or cherry-picking) into the base branch before cleanup.
- **Cross-platform consistency (sdd-workspace.ps1)**: slug derivation uses case-sensitive `-creplace` so `PLAN.MD` yields the same workspace name as POSIX `basename` — a plan file resolves to one directory on every platform.
- **render-graphs.js**: probes `dot -V` instead of `which dot` (not a command on Windows). No behavioral change on POSIX; exit-code behavior covered by the new 8-assertion test suite.
- **Regression coverage**: all suites pass — MCP flow (`tests/run_test.js`), render-graphs (8 assertions), and the PowerShell suite (64 assertions across 5 files, including the brainstorm server lifecycle).

## v6.2.4 Security & Hardening Notes

- **Session-key persistence with hardening** (`--project-dir` mode): the brainstorm session key is now persisted to `.superpowers/brainstorm/.last-token` (0o600, `umask 077` parent, gitignored) alongside `.last-port` and reused across restarts, so an already-open tab's HttpOnly cookie keeps validating. Ephemeral `/tmp` sessions still rotate the key per invocation, and an explicit `BRAINSTORM_TOKEN` env var always wins and is never persisted. Delete `.last-token` with the server stopped to force a fresh key.
- **Token-file read path hardened** (`readPrivateFile`): the read path now enforces the same invariants as the hardened write path — `lstat` rejects symlinks, non-regular files, and multi-link (`nlink !== 1`) files; the fd is opened with `O_NOFOLLOW`, its identity re-checked via `fstat`, and permissions tightened to 0600 through the fd (`fchmodSync`) rather than a path-based chmod that could follow a symlink to an attacker-chosen target. A symlinked `.last-token` is rejected instead of being adopted as the session key.
- **Failure diagnosability**: a failed token-file write logs `Failed to write private token file:` instead of silently degrading to per-start rotation.
- **`BRAINSTORM_TOKEN_FILE` input validation**: the value must be an absolute path; relative values are ignored, so a misconfigured env cannot point writes (O_TRUNC) at an arbitrary relative file.
- **Launcher env hygiene** (`start-server.ps1`): the ephemeral branch clears stale `BRAINSTORM_TOKEN_FILE`/`BRAINSTORM_PORT_FILE` from the invoking pwsh session, so a prior `--project-dir` run cannot leak a project key into a `/tmp` session (bash exports die with the child shell; pwsh `$env:` assignments persist).
- **Regression coverage**: companion suite now 31 assertions including symlinked-token-file rejection (skips on platforms without symlink privilege); PowerShell suite asserts `.last-token` matches the served key.

## v6.2.3 Security & Hardening Notes

- **Crash-Proof Request Handling**: the brainstorm companion server no longer crashes when the content directory is deleted at runtime or a screen file vanishes between readdir and read — screen serving and `/files/*` degrade to the waiting page / 404. Files are read *before* response headers are sent, eliminating the `ERR_HTTP_HEADERS_SENT` double-`writeHead` crash in the old catch path.
- **O_NOFOLLOW + fd-based reads**: screen and `/files/*` reads open with `O_NOFOLLOW` (POSIX) and `fstat` the open descriptor, closing the check-then-read TOCTOU; `SkillsManager.readSkillContent` applies the same defense for skill files.
- **WebSocket Hardening**: handshakes are validated against RFC 6455 (`Upgrade`/`Connection`/`Sec-WebSocket-Version: 13`/well-formed `Sec-WebSocket-Key`), the upgrade path is restricted to `/`, control-frame payloads are capped at 125 bytes (RFC 6455 §5.5), the frame payload cap is 10 MB, concurrent clients are capped at 16, idle and partial-frame timeouts prevent slot starvation, and sockets are paused and destroyed after CLOSE so scripted peers cannot linger or keep dispatching events (RFC 6455 §5.5.1).
- **Watcher Self-Healing**: the content-dir watcher re-arms itself after the directory is deleted and recreated (Linux inotify reports deletion as a `rename` event with the dir's own basename; handled via basename detection + inode comparison, guarded so late events from an old watcher cannot kill a freshly re-armed one).
- **Input Validation**: `BRAINSTORM_TOKEN` must match `^[0-9a-f]{32,}$` (weak operator-supplied tokens are rejected and regenerated); `BRAINSTORM_PORT` must be an integer in 1024–65535; `BRAINSTORM_HOST` and `BRAINSTORM_URL_HOST` must be loopback values.
- **Resource Bounds**: screens larger than 20 MB are skipped and read through a bounded fd loop, skill files larger than 10 MB are rejected, the per-session events log is capped at 1 MB, user-event log lines are capped at 4096 UTF-8 bytes, and WebSocket connections have idle and partial-frame timeouts.
- **Security Headers**: `X-Content-Type-Options: nosniff` and a per-response nonce CSP are applied; screen HTML cannot execute unnonce'd scripts and the auth key is never placed in page-readable storage.
- **Process-Lifecycle Safety**: `start-server.sh/.ps1` verify a PID is a live brainstorm server of this session (server-instance-id + cmdline identity proof before signalling in v6.2.3), with process-start revalidation to narrow PID-reuse races; `stop-server.sh` canonicalizes paths before deleting temp sessions so `/tmp/../` tricks cannot escape the temp root. The companion refuses non-loopback plain HTTP binds. In `--project-dir` mode the session key is persisted to an owner-only `.last-token` and reused across restarts (v6.2.4); ephemeral sessions rotate the key per invocation.
- **SkillsManager Cache & Lookup**: a failed rescan returns the last-good cache instead of poisoning it with an empty list; bounded reads and canonical containment allow safe in-root symlinks; skill names containing consecutive dots (e.g. `a..b`) are map-only lookups.
- **Dependency**: `hono` is overridden to the verified exact version 4.13.0, with exact overrides for `@hono/node-server` 2.0.11 and `fast-uri` 4.1.2. `npm audit` reports **0 vulnerabilities**.
- **Regression Coverage**: `npm test` (builds first) runs the JavaScript edge-case, MCP flow, and companion-server suites. The 63-assertion PowerShell suite is run separately with `tests/powershell/run-tests.sh` and skips when `pwsh` is unavailable.

## v6.2.2 Security & Quality Hardening Notes

- **Symlink Traversal Protection**: `fs.realpath` in `readSkillContent` before relative boundary checks neutralizes symlink-based arbitrary file reads targeting system files outside `SKILLS_PATH`.
- **UTF-8 BOM Compatibility**: `\uFEFF` detection and stripping in `parseFrontmatter` and `readSkillContent` prevents frontmatter parsing failures on files saved with a BOM.
- **System Directory Prefix Filtering**: `getSafeSkillsPath` blocks `SKILLS_PATH` pointing at system subdirectories (e.g. `/etc/ssh` or `C:\Windows\System32`).
- **RFC 3986 Resource URI Compliance**: `encodeURIComponent`/`decodeURIComponent` for resource URIs with spaces or special characters.
- **Concurrency Lock Safety**: instance-reference-checked `loadingPromise` release; `forceReload` clears the content cache.

## v6.4.5 (2026-09-30) Upstream Sync, Dependency Advisory & Drift-Scan Notes

**Scope**: adopt upstream `obra/superpowers@8ca22dba9a94` (upstream v6.4.2, PR #2384 "leaner plans"), remediate a newly disclosed transitive-dependency advisory, and harden the drift scanner's file intake.

### 1. Upstream Writing-Plans Rewrite Adopted (`skills/writing-plans/SKILL.md`)

- **Adopted as upstream-fast-forward with a three-way merge** (`git merge-file`, base `5bf4e78` → upstream `8ca22db`): new spec-first plan header with explicit `Spec:` path, `## What a Step Contains` step template, `## Bite-Sized Task Granularity` renamed `## Step Granularity`, and the seven-check `## Self-Review`. **Fork-only content preserved**: `## Two Plan Shapes`, the execution-handoff options block, the TDD skill pointer, and `skills/writing-plans/skeleton-first-plans.md` (cross-reference retargeted from upstream's deleted `No Placeholders` to `What a Step Contains`).
- **Upstream deletion not followed for `plan-document-reviewer-prompt.md`**: it ships as a fork-only file because `src/server.ts` (`promptName === "plan-reviewer"`) renders it as an MCP prompt via `readPromptFileSafe(...)` — upstream's "nothing referenced it" only holds upstream-side.
- **Baseline re-recorded** at `obra/superpowers@main 8ca22dba9a94` (2026-09-30; 74/74 upstream skill files tracked); `npm run drift` reports **0 drift** (12 fork-only files, no untracked upstream changes).
- **Verification (2026-09-30)**: `npm test` green — regression floor **396/396** (Node.js 201, Bash 67, PowerShell 128); `npx tsc --noEmit` clean; CodeQL code-scanning **0 open / 7 fixed** re-checked via API.

### 2. Transitive Advisory Remediation: `fast-uri` (moderate severity)

- **Advisories**: [GHSA-hrr3-gc8f-f4qj](https://github.com/advisories/GHSA-hrr3-gc8f-f4qj) (inconsistent host case normalization via percent-encoded octets) and [GHSA-jvvf-x445-j334](https://github.com/advisories/GHSA-jvvf-x445-j334) (`mailto:` header injection) affect `fast-uri` 4.0.0 – 4.1.4.
- **Reachability**: transitive only — `@modelcontextprotocol/sdk` → `ajv` → `fast-uri`; the MCP server never parses URIs through `fast-uri`, so no exploit path exists in-process.
- **Remediation**: `npm audit fix` moved the lockfile from the vulnerable `4.1.4` to `4.2.1`, and the `overrides.fast-uri` floor in `package.json` was raised from `^4.1.3` to `^4.2.1` so the vulnerable range cannot re-enter the tree (the old floor still admitted 4.1.4).
- **Verification (2026-09-30)**: `npm audit` reports **0 vulnerabilities**; `npm test` green (396/396) and `npx tsc --noEmit` clean.

### 3. Drift-Scanner File Intake Hygiene (`scripts/upstream-drift.js`)

- `localSkillPaths()` now skips OS junk (`.DS_Store`, `._*`, `Thumbs.db`, `desktop.ini`) via the new `isOsJunk` filter, so local Finder artifacts are never classified as fork-only skills (previously `skills/.DS_Store` appeared in the drift report).
- `.DS_Store` was **never git-tracked** (root `.gitignore` line 20 already covers it); the stray on-disk copies were deleted. New `tests/drift_test.js` check 11 pins both the filter and the cleanup so the fork-only list stays truthful.

## Current Security Status (v6.4.7 - Verified: 2026-10-09)

| Check | Status |
| ----- | ------ |
| Uninstall Integrity (`--remove` completeness) | :warning: Open — a removal can report success while a live `mcp_servers.superpowers` entry survives: TOML keeps all but the last `[[mcp_servers.superpowers]]` array table and orphans `[[mcp_servers.superpowers.env]]`; JSON clears only the first root key holding the entry; YAML removal is a no-op on a populated flow map. CWE-459 (v6.4.7 finding 1) |
| YAML Cross-Parent Deletion on `--remove` | :warning: Open — the root-level guard covers the empty-map rewrite (`:685`) but not the entry deletion (`:700-706`), so a nested `mcp_servers:` under another top-level key loses its `superpowers` subtree. CWE-459 (v6.4.7 finding 2) |
| `SKILLS_PATH` Containment | :warning: Blocklist, not allowlist — `~/.ssh`, `~/.config/gh`, `/Users/Shared` accepted because they exist; `~/.aws` rejected only for non-existence. The documented `SKILLS_PATH=$(mktemp -d)` flow resolves to per-user `0700` on macOS but to world-writable `/tmp` (mode `1777`) on Linux. CWE-22 / CWE-668 (v6.4.7 finding 3) |
| Prompt Placeholder Interpolation | :white_check_mark: Fixed — all five templated prompts now carry a literal token for every key the server supplies. The `[MODEL]` slot in `task-reviewer-prompt.md` and `re-review-prompt.md` was silently dropped (both wrote `model: [MODEL — REQUIRED: …]`, so the only real token sat in an appendix bullet the guard skips); both now use `model: [MODEL]` + a `#` comment, pinned by fail-without / pass-with assertions. CWE-20 (v6.4.7 finding 4) |
| YAML Duplicate-Key Emission | :warning: Install can emit a second `superpowers:` (populated flow map) or a second `command:` / `args:` pair (child indent ≠ root indent). Last-wins parsers silently keep the stale entry. CWE-407 (v6.4.7 finding 5) |
| Prompt Argument Escaping | :white_check_mark: By design, same-principal — `.trim()` + 32 KiB cap (`:619-637`); newlines preserved. `feature_name` and `requirements` hardened in this change; ~13 other free-text args unchanged. CWE-1427 accepted as a data-trust property, not a server-side vulnerability (v6.4.7 finding 6) |
| Build Reproducibility (`npm pack`) | :warning: `prepublishOnly` is publish-only and `out/` is gitignored/untracked, so a `npm pack` release path ships on-disk `out/*.js` unrebuilt and unreviewable. Build belongs in `prepack`. CWE-494 (v6.4.7 finding 7) |
| Package `files` Allowlist | :warning: `files: ["scripts"]` ships `install.sh` / `install.ps1` (which prefer a co-located `setup.js`) plus untracked files; nothing in the shipped runtime needs `scripts/`. CWE-829 (v6.4.7 finding 8) |
| Installer Fetch Integrity | :warning: Accepted — `README.md:83,88` pipe `install.sh` / `install.ps1` from the mutable `main` ref with no tag, SHA-256, or signature. CWE-494 (v6.4.7 finding 9) |
| Dependency Override Hygiene | :warning: `overrides.fast-uri ^4.2.1` crosses a major boundary over `ajv@8.18.0`'s declared `^3.0.1`; verified **not** a live breakage (all ajv format and `$ref` paths pass; ajv is never loaded at runtime by the stdio bundle). CWE-1327, latent (v6.4.7 finding 10) |
| CodeQL code-scanning alerts | :white_check_mark: 0 open / 7 fixed — `js/polynomial-redos` #3/#4/#5 and `js/prototype-polluting-assignment` #6/#7 closed with linear scanners and path-segment guards; `js/reflected-xss` #2 and `js/xss-through-dom` #1 fixed earlier |
| TOML Polynomial ReDoS Defense | :white_check_mark: Secured — CodeQL `js/polynomial-redos` Alert #5 closed via single-pass linear scanners (`isQuotedManagedTableHeader`, `isTomlTableHeader`, `parseTomlManagedAssignment`); 15 KB adversarial header processes in ~6 ms per 100 runs |
| Nested-JSON Prototype Pollution Defense | :white_check_mark: Secured — CodeQL `js/prototype-polluting-assignment` Alerts #6/#7 closed by failing closed on `__proto__` / `constructor` / `prototype` `serverPath` segments plus `^[A-Za-z0-9_-]+$` allowlist before any computed property access |
| npm audit vulnerabilities | :zero: Zero — `sdk` OAuth advisory (GHSA-6qxp-vccf-f47h, high) fixed at `@modelcontextprotocol/sdk` 1.32.1 and `proxy-addr` IP-spoofing advisory (GHSA-jqcg-44mw-7w3h, critical) fixed at 2.0.8 in v6.4.6; exact verified overrides for `hono` (^4.13.7), `@hono/node-server` (^2.1.1), `fast-uri` (^4.2.1), `proxy-addr` (^2.0.8), `qs` (^6.16.0) |
| Local → Upstream Drift Tracker | :white_check_mark: Clean — `npm run drift` reports **0 drift** (12 fork-only files, baseline `8ca22dba9a94` captured 2026-09-30); OS junk (`.DS_Store`, `._*`, `Thumbs.db`, `desktop.ini`) filtered from `localSkillPaths()` since v6.4.5 |
| `innerHTML` usage | :zero: Zero — entire codebase uses safe DOM APIs |
| `eval` / `new Function` / `document.write` | :zero: Zero occurrences |
| Partial-Read Buffer Truncation Defense | :white_check_mark: Secured — looping `while (totalRead < fileSize)` in `readFileNoFollow` guarantees complete byte-level reads under high disk concurrency |
| Canonical Path Caching & Alias Drift Defense | :white_check_mark: Secured — in-memory skill content keyed strictly by physical `realFilePath` with aliased lookup map, eliminating symlink cache divergence |
| Single-Stat Invalidation & Symlink Swap Defense | :white_check_mark: Secured — `tryReadFromContentCache` verifies device (`dev`), inode (`ino`), size, and mtime on requested path; invalidates cache immediately if symlink redirects |
| Monotonic Invalidation Epoch & Stale Scan Defense | :white_check_mark: Secured — `clearCache` increments `scanEpoch` and clears `loadingEpoch`, preventing pending async directory scans from repopulating flushed caches |
| Concurrent Rescan Race Protection | :white_check_mark: Secured — monotonic `scanEpoch` ensures only the latest asynchronous scan can commit to the active skill catalog |
| Automatic Cache Revalidation | :white_check_mark: Secured — `CACHE_REVALIDATE_MS = 1000` re-reads disk state within 1 second on disk modification without server restart |
| Deterministic Directory Ordering & Collision Defense | :white_check_mark: Secured — alphabetical directory processing and collision skipping prevents erratic map overwrites |
| Platform Case-Folding & Canonical Path Blacklisting | :white_check_mark: Secured — `src/server.ts` uses platform case folding and `fs.realpathSync` to block `/private/etc`, `/private/var`, `C:\Windows` |
| Destination Allowed Roots Boundary Containment | :white_check_mark: Secured — `safeWriteConfig` requires `allowedRoots` check on canonical destination, blocking symlink breakouts |
| Optimistic Concurrency Conflict Defense | :white_check_mark: Secured — `safeWriteConfig` verifies disk content against `expectedContent` immediately before atomic rename |
| Directory Swap TOCTOU Defense | :white_check_mark: Secured — `safeWriteConfig` re-verifies directory canonical path, device `dev` and inode `ino` before commit |
| Config Multi-Root Discovery & Key Conflict Defense | :white_check_mark: Secured — `updateJsonConfig` inspects all recognized server keys (`servers`, `mcp`, `mcpServers`), preventing duplicate conflicting configuration declarations |
| User Configuration Preservation & Invariant Defense | :white_check_mark: Secured — merges existing declarations preserving user fields (`env`, `cwd`, `disabled`, `alwaysAllow`), eliminates contradictory `disabled` and `enabled` flags |
| CLI Argument Boundary & Non-Truncating Exit Defense | :white_check_mark: Secured — rejects unexpected positional arguments; sets `process.exitCode = 1` preventing async stdout/stderr truncation in Unix pipes |
| YAML Polynomial ReDoS Defense | :white_check_mark: Secured — CodeQL `js/polynomial-redos` mitigated via linear scan and slice (`updateYamlConfig`, `extractInlineComment`), linear execution time on 60,000+ whitespace runs |
| Desktop App Safe Configuration Export | :white_check_mark: Secured — `--print-config` generates clean JSON for desktop client import without disk or file modification |
| Expanded Multi-Harness Ecosystem | :white_check_mark: Secured — 17 AI agent harnesses supported (including LM Studio & Roo Code), physical file isolation and idempotent lifecycle |
| Command Injection (`execFileSync` in `render-graphs.js` & `server.cjs`) | :white_check_mark: Secured — direct binary execution, shell interpreters eliminated |
| Test Runner Parameter Injection Defense | :white_check_mark: Secured — `find-polluter.sh` & `find-polluter.ps1` use array-based parameter expansion and handle spaced filenames |
| CDPATH Redirection Sanitization | :white_check_mark: Secured — `sdd-workspace` sets `CDPATH=''` before cd operations |
| Lossless Unicode Marker Persistence | :white_check_mark: Secured — `sdd-workspace.ps1` writes plan marker using UTF-8 without BOM |
| Targeted Global Setup & Explicit Consent | :white_check_mark: Secured — anti-virus design; requires explicit `--target <client>`, no blind scanning, safe exit without target |
| Multi-Harness Co-existence & Path Isolation | :white_check_mark: Secured — physical separation between Copilot Stable (`Code/User/mcp.json`) and Copilot Insiders (`Code - Insiders/User/mcp.json`), zero collision or cross-contamination |
| Atomic Config Writes & Race Defense | :white_check_mark: Secured — temporary file write with cryptographically secure random nonce (`crypto.randomBytes(8)`), exclusive creation (`wx`), and atomic `renameSync` |
| Least-Privilege Directory & File Modes | :white_check_mark: Secured — created configuration dirs restricted to `0o700`, files written with `0o600` or existing mode, backup files preserve source mode |
| JSONC & Serialization Injection Defense | :white_check_mark: Secured — comment stripping with trailing comma tolerance, `isPlainObject` prototype pollution defense, `JSON.stringify` variable escaping in YAML/JSON |
| CLI Transport Stdio Isolation | :white_check_mark: Secured — setup CLI intercepted in `main()` before MCP Stdio transport initialization, eliminating protocol pollution |
| MCP Prompts Cascading Injection Defense | :white_check_mark: Secured — single-pass regex replacement (`interpolateTemplate`) eliminates multi-pass expansion; 32 KB length clamp & `hasOwnProperty` check neutralize prototype pollution and ReDoS |
| Prompt Template Non-Empty & Structured Stderr Defense | :white_check_mark: Secured — `readPromptFileSafe` strictly halts on empty template, outputs structured diagnostic, and raises `McpError(ErrorCode.InternalError)` |
| Applied Interpolation Tracking & Clean Prompt Output | :white_check_mark: Secured — template substitutions tracked via `appliedInterpolations`, preventing redundant argument appending |
| Hardcoded secrets in tracked files | :zero: Zero — `.gitignore` covers `.env*`, `*.pem`, `*.key`, `*.token`, `credentials*`, `task.md`, `.devin/` |
| World-writable files | :zero: Zero |
| MCP Tools/Prompts Path Traversal | :white_check_mark: Secured — dynamic prompt templating inherits `SkillsManager` double physical containment, `O_NOFOLLOW` / fd identity match, and safe argument sanitization |
| Symlink / Path Traversal Defense | :white_check_mark: Secured — bounded `O_NOFOLLOW`/fd reads, `realpath` containment, private state files, canonical temp-deletion guard in v6.2.3, and hardened token-file read (`readPrivateFile`) rejecting symlinked/multi-link `.last-token` in v6.2.4; **unchanged in v6.3.0** (upstream's removal of these controls was deliberately not adopted) |
| RFC 6455 Fragmented WebSocket Protocol Validation | :white_check_mark: Secured — RFC 6455 handshake check, `CONTINUATION` frame reassembly, fragmented control frame rejection, RSV bit checks, 125-byte control-frame cap, 10 MB frame cap, 16-client cap, idle timeout, and partial-frame deadline |
| Resilient Tail Event Compaction | :white_check_mark: Secured — `server.cjs` preserves recent complete newline-delimited event records rather than discarding all state on rotation |
| Filesystem Race / Crash Resilience | :white_check_mark: Secured — read-before-headers, try/catch fs paths, watcher self-heal in v6.2.3 |
| Process Lifecycle (stale PID) | :white_check_mark: Secured — server-instance-id + cmdline identity proof before signalling in v6.2.3 |
| Environment Input Validation (`SKILLS_PATH`, `BRAINSTORM_TOKEN`, `BRAINSTORM_PORT`) | :white_check_mark: Secured — system-dir prefix check + token format + port range in v6.2.3; `BRAINSTORM_TOKEN_FILE` must be an absolute path in v6.2.4 |
| Concurrency & Cache Safety | :white_check_mark: Secured — instance-checked promise lock, last-good cache on transient failure in v6.2.3 |
| XSS vectors (brainstorming Visual Companion & server) | :white_check_mark: Patched — DOM XSS fixed in v5.1.1, remaining `innerHTML` eliminated in v6.0.0, reflected server-side XSS fixed in v6.0.1, nonce CSP + `nosniff` + HttpOnly-only auth in v6.2.3; remote brand image from upstream v6.3.0 **not adopted** (keeps the local inline SVG, no third-party request) |
| Shell Command Injection (`BRAINSTORM_OPEN_CMD`) | :white_check_mark: Patched — `cp.execFile` with argv array in v6.0.3 |
| Shell Script Security (`install.sh`, `install.ps1`) | :white_check_mark: Secured — `set -euo pipefail` and quoted expansions in Bash; `$ErrorActionPreference = "Stop"` and array argument splatting in PowerShell |
| CORS / Lambda / Set-Cookie (`hono`) | :white_check_mark: Patched — exact `hono` override (GHSA-8j4g-w8fx-2239) |
| Inline plan `task-done` command execution | :white_check_mark: Secured — argv-array execution (`"$@"` / `& $exe @rest`); ledger rendering is display-only; bash requires `--`; PowerShell `-LiteralPath` + UTF-8-without-BOM |
| Diagnosing-superpowers transcript export | :white_check_mark: Gated — local reads only; no unprompted bundle; redaction policy; partner review required before sharing |
| Deferred-findings export grep | :white_check_mark: Secured — `Final: minor (deferred):` exported; completion-line `parked` counts excluded (`tests/upstream_sync_test.js` 12b) |
| Full Security Audit & Secret Hygiene | :white_check_mark: Verified (2026-10-09) — 0 vulnerabilities (`sdk` GHSA-6qxp-vccf-f47h remediated at 1.32.1, `proxy-addr` GHSA-jqcg-44mw-7w3h remediated at 2.0.8), 0 hardcoded secrets, 0 world-writable files, 396/396 automated test assertions passed (Node.js 236 + Bash 32 + PowerShell 128) |

## Comprehensive Security Audit & Verification Report (Last Audited: 2026-10-06)

A full repository security audit was conducted covering dependencies, core MCP server, Universal Global Setup Engine, Brainstorm Companion server, native plan-execution helpers, session-forensics skill, secret hygiene, and automated regression testing. The v6.4.7 pass (2026-10-09) audited this release tree with a five-role parallel team and an independent falsification pass: eleven findings survived reproduction — led by `--remove` reporting success while a live MCP entry survives across the TOML, JSON and YAML writers (CWE-459), a YAML `--remove` that deletes another parent's `superpowers` subtree, a blocklist-only `SKILLS_PATH` containment that accepts `~/.ssh` and resolves to world-writable `/tmp` on Linux, and a **regression** in which the new prompt appendix guard silently dropped the `[MODEL]` argument for `sdd-task-reviewer` and `sdd-re-review` — found by the scan and fixed in this same release. Four further candidates were falsified or downgraded (notably an `ajv-formats` crash that proved to be the auditing harness's own bug, and the missing lockfile `overrides` key, which has no security consequence because the lock already pins the overridden versions). All v6.4.2–v6.4.6 controls were re-verified in force: full suite green (396/396 — Node.js 236, Bash 32, PowerShell 128), `npx tsc --noEmit` clean, `npm run build` ok, `npm audit` 0 vulnerabilities, `npm run drift` 0, world-writable and secret-hygiene scans clean. The v6.4.2 controls and remediations remain in force; the v6.4.3 pass re-verified all surfaces and expanded the multi-language MCP coverage testing across all 7 localized README editions. The v6.4.4 pass closed the three remaining CodeQL code-scanning alerts (TOML ReDoS, nested-JSON prototype pollution) with linear scanners and fail-closed path guards — code-scanning now reads 0 open / 7 fixed. The v6.4.5 pass (2026-09-30) adopted upstream `obra/superpowers@8ca22dba9a94`, remediated the newly disclosed `fast-uri` advisories (GHSA-hrr3-gc8f-f4qj / GHSA-jvvf-x445-j334) by moving the lockfile to 4.2.1 and raising the override floor to ^4.2.1, added the `isOsJunk` filter to the drift scanner, and re-verified: full suite green (396/396), `npx tsc --noEmit` clean, `npm audit` 0 vulnerabilities, CodeQL 0 open / 7 fixed (API re-check), world-writable and secret-hygiene scans clean, `npm run drift` clean. The v6.4.6 pass (2026-10-06) ran a full-project scan: remediated the newly disclosed `sdk` OAuth-credential advisory (GHSA-6qxp-vccf-f47h, high — `devDependencies` raised to ^1.32.1, past the fixed 1.31.0 floor) and the `proxy-addr` IP-spoofing advisory (GHSA-jqcg-44mw-7w3h, critical — new `overrides.proxy-addr ^2.0.8` floor; both build-time-only, unreachable from the stdio-only shipped bundle), put the two post-v6.4.5 source fixes on record (brainstorming `$`-token function replacers; single-flight scans, YAML quoting, prompt append guards), and re-verified: full suite green (409/409 — Node.js 214, Bash 67, PowerShell 128), `npx tsc --noEmit` clean, `npm audit` 0 vulnerabilities, world-writable and secret-hygiene scans clean.

### 1. Dependencies & Supply Chain
- **Vulnerability Audit**: `npm audit` returned **0 vulnerabilities**.
- **Dependency Overrides**: Verified exact overrides for `hono` (^4.13.7), `@hono/node-server` (^2.1.1), `fast-uri` (^4.2.1), `proxy-addr` (^2.0.8), and `qs` (^6.16.0) protect against upstream CVEs (including GHSA-8j4g-w8fx-2239; the `fast-uri` floor was raised from ^4.1.3 to ^4.2.1 in v6.4.5 so the GHSA-hrr3-gc8f-f4qj / GHSA-jvvf-x445-j334 vulnerable range 4.0.0–4.1.4 cannot re-enter the tree; the `proxy-addr` floor was added in v6.4.6 so the GHSA-jqcg-44mw-7w3h vulnerable range 1.1.0–2.0.7 cannot re-enter via `sdk → express`).

### 2. MCP Server, Prompts & Skills Core Engine (`src/server.ts`, `src/skills-manager.ts`)
- **Partial-Read Buffer Truncation Defense & Looping I/O**:
  - `readFileNoFollow()` implements a guaranteed multi-pass read loop (`while (totalRead < fileSize)`), ensuring buffers are populated to exact file sizes regardless of operating system buffer starvation or asynchronous scheduling latency.
- **Fast-Path Stat Snapshot Cache Verification & Epoch Shielding**:
  - `tryReadFromContentCache` implements single-stat snapshot validation comparing device ID (`dev`), inode (`ino`), file size (`size`), and modification timestamp (`mtimeMs`). Avoids expensive full directory rescans on individual skill accesses while ensuring immediate cache invalidation if the underlying file or symlink destination is altered.
  - `clearCache()` monotonically advances `scanEpoch` and resets `loadingEpoch`, ensuring that in-flight asynchronous directory scans cannot commit stale entries after a cache flush.
- **Canonical Path Caching & Multi-Alias Drift Neutralization**:
  - Content caching in `SkillsManager` stores skills exclusively by resolved physical paths (`fs.realpath`), maintaining a separate alias map for symlinks. On invalidation, both representations are purged in a single atomic cycle.
- **Automatic Cache Revalidation & Freshness**:
  - `CACHE_REVALIDATE_MS = 1000` re-reads disk state when cache age exceeds 1 second, allowing on-disk edits to reflect immediately without requiring MCP server restarts.
- **Deterministic Directory Ordering & Collision Defense**:
  - Catalogs directories in deterministic alphabetical order and detects alias/name collisions in `newSkillMap`, emitting diagnostic warnings and skipping duplicates rather than arbitrarily overwriting memory caches.
- **Concurrency Epoch Versioning**:
  - `listSkills` assigns a monotonically increasing `scanEpoch` to each discovery cycle, discarding outdated scan results before mutating active state.
- **Prompt Template Integrity & Non-Empty Validation**:
  - `readPromptFileSafe` rigorously validates that prompt template files contain readable non-empty text; detects missing or truncated prompt files, emits structured diagnostics to `stderr`, and raises an actionable `McpError(ErrorCode.InternalError)`.
- **Prompts Injection & Cascading Expansion Defense**:
  - `ListPromptsRequestSchema` and `GetPromptRequestSchema` are guarded against prompt injection; all template files are read through hardened `SkillsManager` APIs.
  - `interpolateTemplate` utilizes a single-pass regular expression replacement engine with sorted, escaped keys, eliminating cascading or secondary placeholder expansion attacks.
  - `getStringArg` enforces explicit `hasOwnProperty` validation to prevent prototype pollution and strictly clamps argument strings to 32 KB (`MAX_PROMPT_ARG_LENGTH = 32 * 1024`) to eliminate ReDoS and memory exhaustion hazards.
  - `appliedInterpolations` tracks successfully substituted template placeholders, preventing unnecessary or duplicate append blocks.
  - Arguments are evaluated safely with `.trim()`, type coercion, and boundary guards, preventing `undefined` concatenation.
- **Path Traversal & Symlink Defense**:
  - `getSafeSkillsPath()` blocks hazardous system directory prefixes (`/etc`, `/var`, `/usr`, `/private/etc`, `/private/var`, `C:\Windows`, etc.) and performs case-folding and `fs.realpathSync` validation.
  - `findSkill()` strictly strips path separators (`/`, `\`, `\0`, `..`), using in-memory Map key lookups so user inputs never enter filesystem read APIs directly.
  - `readFileNoFollow()` verifies file descriptors, inodes, and device IDs across checks and opens using POSIX `O_NOFOLLOW` and `fs.realpath` containment to eliminate TOCTOU race conditions.
- **Resource Bounds & ReDoS**:
  - Skill file reading enforced with a 10 MB limit (`MAX_SKILL_FILE_BYTES`).
  - YAML frontmatter parser uses safe line-by-line scanning and handles UTF-8 BOM (`\uFEFF`) transparently.
- **Error Handling & Information Disclosure**:
  - Standardized `McpError` responses prevent exposing internal stack traces or filesystem layouts.

### 3. Brainstorm Companion Server (`skills/brainstorming/scripts/server.cjs`)
- **Network Interface**:
  - Strict loopback binding (`127.0.0.1`, `::1`); non-loopback bindings are rejected at startup.
- **Authentication & Token Storage**:
  - 256-bit entropy token passed via `HttpOnly` / `SameSite=Strict` cookie and verified in constant time.
  - Token file persistence is hardened with `0600` permissions (`fchmodSync`) and rejects symlinks or multi-link targets.
- **Web Security & XSS Mitigation**:
  - Nonce-based Content Security Policy (`CSP`), `X-Content-Type-Options: nosniff`, and `frame-ancestors 'none'`.
  - Local inline SVG assets are used exclusively (no external CDN / third-party requests).
- **RFC 6455 WebSocket Protocol & Resilient Stream Hardening**:
  - Strict RFC 6455 handshake validation, support for fragmented text messages (`CONTINUATION` opcode `0x00`) with payload size tracking, control frame payload cap (≤125 bytes), non-fragmented control frame enforcement (`opcode >= 0x8 && !fin`), 10 MB frame cap, 16 concurrent client limit, and idle/partial-frame socket teardowns.
  - Resilient tail log compaction: `appendEvent` preserves recent newline-delimited records when approaching the 1 MB file limit rather than dropping all historical events.
  - Hardened private file descriptors opened with `O_RDWR | O_APPEND | O_CREAT | O_NOFOLLOW`.

### 4. Universal Global Setup Engine & Installation Scripts (`src/setup-runner.ts`, `scripts/`)
- **Explicit Consent & Anti-Virus Design**:
  - Abolished all unprompted bulk scanning or blind directory crawling (`--all` removed). Setup strictly requires `--target <client>`. Running without arguments outputs interactive guidance and cleanly exits with exit code 1 without touching or reading the host filesystem.
- **Desktop App Configuration Safe Export (`--print-config`)**:
  - `runSetupCli` supports `--print-config` (with optional `--bun`) to emit cleanly formatted `mcpServers` JSON for GUI desktop applications that require JSON import, without creating, modifying, or reading any host client configuration files.
  - Strictly validates flag compatibility: fails closed with exit code 1 if combined with file-altering flags (`--target`, `--remove`, `--backup`, `--dry-run`).
- **Multi-Root Key Discovery & Configuration Conflict Defense**:
  - `updateJsonConfig` inspects all recognized client root keys (`servers`, `mcp`, `mcpServers`) to locate existing installations before applying additions or updates, preventing multiple conflicting blocks from being created in user configurations.
- **User Configuration Preservation & Invariant Defense**:
  - Merges existing server declarations in JSON and YAML, preserving user-authored options (`env`, `cwd`, `disabled`, `alwaysAllow`, `args`). Resolves contradictions between opposing flags (`disabled` vs `enabled`).
- **Strict CLI Argument Boundary & Non-Truncating Exit Defense**:
  - `runSetupCli` rejects unknown option flags and unexpected positional arguments with explicit error logging and exit code 1.
  - Assigns `process.exitCode = 1` rather than calling `process.exit()`, ensuring asynchronous stdout and stderr streams flush cleanly over Unix pipelines and package wrappers.
- **Expanded Multi-Harness Ecosystem (17 AI Agent Environments)**:
  - Broadened coverage across 17 AI agent harnesses: Antigravity, Pi Desktop, Cursor, Copilot, Copilot Insiders, Hermes, Kimi, Claude, Devin (Windsurf), QwenPaw (CoPaw), Cline, Kilo Code, Qoder, Kiro, Trae, LM Studio (`~/.lmstudio/mcp.json`), and Roo Code (`mcp_settings.json`).
  - Standardized path resolution and isolated backup/commit lifecycles across macOS, Linux, and Windows.
- **TOML Polynomial ReDoS Mitigation & Comment Preservation (CodeQL Alert #5 closed in v6.4.4)**:
  - `isQuotedManagedTableHeader()` / `isTomlTableHeader()` replace the stacked-`.*` table detectors with single-pass linear scans (`lastIndexOf("]")` + `includes`, no backtracking); `parseTomlManagedAssignment()` replaces the `([\s\S]*?)` value capture with a linear key/value split. Quoted-variant fail-closed behavior is preserved.
- **Nested-JSON Prototype Pollution Guard (CodeQL Alerts #6/#7 closed in v6.4.4)**:
  - `updateJsonConfig(..., serverPath)` fails closed on `__proto__` / `constructor` / `prototype` segments (literal comparisons CodeQL recognizes as sanitizers, asserted both up front and at the use site) and restricts segments to `^[A-Za-z0-9_-]+$`, so a library-input path can never turn the working container into `Object.prototype`.
- **YAML Polynomial ReDoS Mitigation & Comment Preservation**:
  - `updateYamlConfig` replaces unanchored regexes `\s*(.*?)\s*$` with exact key matching and linear string slicing (`line.slice(match[0].length).trim()`), eliminating polynomial backtracking (CodeQL `js/polynomial-redos`).
  - `extractInlineComment` executes a single-pass linear character scan, safely extracting inline comments while avoiding exponential backtracking on whitespace-padded lines.
  - Preserves existing YAML inline comments on the server declaration and sibling comments across add, update, and remove operations.
- **Multi-Harness Co-existence & Copilot Insiders Isolation**:
  - Distinct physical configuration separation between standard VS Code (`Code/User/mcp.json`) and VS Code Insiders (`Code - Insiders/User/mcp.json`) across macOS, Linux, and Windows. Prevents cross-contamination and guarantees independent updates, additions, and uninstalls.
- **Atomic Operations, Concurrency & Inode Defense**:
  - `safeWriteConfig` utilizes temporary files scoped to the target directory containing process ID and cryptographically random 8-byte nonces (`crypto.randomBytes(8)`). Writes enforce `flag: "wx"` (exclusive creation, avoiding symlink hijacking) and commit via atomic `fs.renameSync`.
  - Optimistic concurrency verification (`expectedContent`): detects concurrent modifications before `renameSync` and refuses to overwrite newer configurations.
  - Inode and device identity checks (`dev`, `ino`): validates parent directory identity before and after temporary file writes to defend against directory swap TOCTOU attacks.
- **Allowed Roots Boundary Containment & Symlink Safety**:
  - `safeWriteConfig` requires explicit `allowedRoots` boundaries (`homeDir`, `appData`, `localAppData`), verifying that configuration paths cannot be redirected outside authorized user roots through malicious parent-directory symlinks.
  - Target paths are resolved through `fs.realpathSync` to preserve symbolic link destinations while checking directory containment and safely handling dangling symlinks.
  - Inspects existing files with `fs.lstat` before writes, aborting if symlink pointers target restricted system root hierarchies (`/etc`, `/bin`, `/sbin`, `/usr`, `/root`, `/sys`, `/proc`, `/dev`, `/private/etc`, `/var`, `/private/var`, `C:\Windows`) outside permitted project and user configurations.
- **Least-Privilege Directory & File Permissions**:
  - Configuration directories are created with restricted mode `0o700`. Configuration files default to `0o600` or preserve existing modes. Pre-write backup files (`.bak`) inherit source permissions.
- **Injection-Free Config Serialization & Parsing Hardening**:
  - Variables and arguments in YAML/JSON are safely escaped with `JSON.stringify`. JSON parser tolerates JSONC comments/trailing commas while verifying `isPlainObject` against prototype pollution and array root corruption.
  - `updateJsonConfig` fails closed when root or server fields are not plain objects; `updateYamlConfig` rejects duplicate keys and non-root declarations.
- **CLI Transport Stdio Isolation**:
  - `src/server.ts` routes `setup` arguments in `main()` prior to initializing any MCP Stdio transport, preventing protocol deadlock or stdout pollution.
- **Shell & PowerShell Script Hardening**:
  - `scripts/install.sh` enables `set -euo pipefail` and strictly quotes variable expansions (`"$@"`). `scripts/install.ps1` sets `$ErrorActionPreference = "Stop"` and uses typed array parameter splatting.
  - `find-polluter.sh` & `find-polluter.ps1`: caller-supplied test command with array splatting (`"${TEST_COMMAND[@]}"`, `& $testCommand @testCommandArgs`), safe while loop reading spaced filenames, preventing shell command injection.
  - `sdd-workspace`: sanitized `CDPATH=''` to prevent cd redirection attacks.
  - `sdd-workspace.ps1`: UTF-8 without BOM encoding (`[System.Text.UTF8Encoding]::new($false)`) for plan marker paths, ensuring lossless Unicode path round-tripping.
  - `task-done` / `task-done.ps1`: operator-supplied test commands execute as argv (`"$@"` / `& $exe @rest`); failing runs write the log and do not append a ledger line; empty/blank stdout is recorded as `(no output)`.

### 4b. Native Plan Execution & Session Forensics (v6.4.1)
- **`task-start` / `task-done`**: share the SDD workspace so an inline executor and an SDD controller can resume from the same ledger. Helpers are invoked through `bash` / `pwsh` rather than relying on execute bits.
- **Trust model**: these scripts run commands the operator (or the in-session agent acting for them) already chose as the task's verification command — the same model as `find-polluter`. They do not introduce a remote execution surface.
- **`diagnosing-superpowers`**: reads local transcripts; export and GitHub-issue steps are partner-gated; `references/redaction-policy.md` is mandatory before a bundle leaves the machine.

### 5. Secrets & Git Hygiene
- **Secret Scanning**: No hardcoded API keys, private keys, or tokens detected in tracked files. Pattern scan covered `SKILLS_PATH` sources, scripts, tests, and skill docs (189 files): `eval` / `new Function` / `innerHTML` / `document.write` / `shell: true` = 0 in shipped code.
- **Git Ignore**: Comprehensive rules in `.gitignore` cover `.env*`, `*.pem`, `*.key`, `*.token`, `credentials*`, `task.md`, `.devin/`, and ephemeral worktrees. A local `.devin/config.local.json` (mode `0600`, permissions-only, untracked) was present during the 2026-09-21 scan; `.devin/` is now ignored so it cannot be added accidentally.
- **Working Tree & File Modes**: Zero world-writable files in the repository tree (excluding `.git` / `node_modules`).

### 6. Automated Security & Edge-Case Verification
- **Edge Cases & Security Suite** (`tests/edge_cases_test.js`): Passed **12/12 tests** (BOM handling, traversal blocking, concurrency locks, dot-named skills, transient failure cache preservation, automatic cache revalidation, duplicate skill-name collision handling, single-stat cache validation, epoch invalidation, and stale-scan suppression after `clearCache()`).
- **MCP Protocol & Prompts Suite** (`tests/run_test.js`): Passed **7/7 tests** (Initialization, `list_skills`, `read_skill`, malformed URI handling, `prompts/list`, `prompts/get` dynamic injection).
- **Companion Server Suite** (`tests/brainstorm_server_test.js`): Passed **35/35 tests** (Authentication, token persistence, WS caps, CSP, traversal protection, PID lifecycle, fragmented text assembly, resilient tail event compaction, and literal `$`-token preservation in frame wrapping).
- **Compositions & Prompts Injection Suite** (`tests/prompts_compositions_test.js`): Passed **18/18 checks** (Workflow prompts coverage, multi-stage integrity, dynamic scenario focus, cascading injection defense, unknown prompt rejection, declared SDD review-file arguments, an explicitly named review file, normalised-path substitution, brief-file substitution, `superpowers:` prefix normalization, and placeholder-key append-suppression guards).
- **Global Setup Engine Suite** (`tests/setup_test.js`): Passed **78/78 tests** (Full coverage across 17 AI agent harnesses: Antigravity, Pi Desktop, Cursor, Copilot, Copilot Insiders, Hermes, Kimi, Claude, Devin, QwenPaw, Cline, Kilo Code, Qoder, Kiro, Trae, LM Studio, Roo Code; JSONC comment tolerance, YAML comment preservation, YAML linear ReDoS guard with 60,000 whitespace padding, `--print-config` clean JSON emission, `json-mcp` local format, YAML injection defense, plain object validation, anti-bulk target consent, cross-platform path resolution, atomic write sandbox & symlink preservation, idempotent removal, double invocation defense, parent-directory symlink breakout defense, concurrent config change detection, fail-closed shape parsing, user-managed JSON fields preservation, multi-root keys reuse, disabled flag consistency, non-identifier YAML indentation, quoted YAML root-key handling, empty-map emission on removal, CRLF preservation, and malformed CLI invocation exit codes).
- **SDD Workspace Bash Suite** (`tests/sdd/test-sdd-workspace.sh`): Passed **16/16 tests** (Workspace isolation, path normalization, collision counters, commit range validation, permission-stripped execution).
- **Writing Skills Render Graphs Suite** (`tests/writing-skills/test-render-graphs.sh`): Passed **8/8 tests** (Direct binary execution, SVG rendering, output verification, error capture).
- **PowerShell Script Hardening Suite** (`tests/powershell/`): Passed **128/128 assertions** across 7 test scripts (`test-brainstorming-server.ps1`: 29, `test-find-polluter.ps1`: 12, `test-review-package.ps1`: 20, `test-sdd-workspace.ps1`: 20, `test-task-brief.ps1`: 13, `test-task-start.ps1`: 8, `test-task-done.ps1`: 26).
- **Upstream Sync Regression Suite** (`tests/upstream_sync_test.js`): Passed **30/30 checks** pinning the imported upstream content (Batches 1-4, v6.4.1 native execution, diagnosing-superpowers, interpreter invocation, export-grep `12b` for `Final: minor (deferred):`, and v6.4.2 leaner writing-plans `Test 19`).
- **MCP Surface Coverage Suite** (`tests/mcp_coverage_test.js`): Passed **23/23 checks** (one resource per skill on disk, each resource serves that skill's own content, prompt inventory and skill URI counts match all seven localized READMEs (`README.md`, `README.zh-TW.md`, `README.ja.md`, `README.ko.md`, `README.es.md`, `README.pt-BR.md`, `README.hi.md`) exactly, composition guides included in npm package, and unsafe SKILLS_PATH rejection).
- **Upstream Drift Suite** (`tests/drift_test.js`): Passed **11/11 checks** (the offline CLI run is one of them; check 11 filters OS junk such as `.DS_Store` out of `localSkillPaths()` since v6.4.5); the committed baseline (`tests/upstream-sync-baseline.json`) records the upstream blob SHAs of every adopted skill file, so a deleted import, a lost upstream lineage or a stale ignore entry fails here. Network mode (`npm run drift`) compares the baseline against upstream without writing anything.
- **Brainstorm Host Defaults Bash Suite** (`tests/brainstorming/test-start-server-env-hosts.sh`): Passed **11/11 tests** (env-supplied bind/url hosts, flag precedence, empty values, and the non-loopback refusal).
- **Executing-Plans Helper Suites** (`tests/executing-plans/`, wired into `npm test`): Passed **32/32 tests** (`test-task-start.sh`: 7, `test-task-done.sh`: 25) covering argv quoting, empty/blank output as `(no output)`, failing runs writing no ledger, and Task 4 blank-output isolation.
- **Total Automated Regression Floor**: **409 automated test assertions across Node.js (214), Bash (67), and PowerShell (128), 100% pass rate, 0 regressions**.



---

## Security Best Practices

When using Superpowers MCP:

- Keep the package updated to the latest version (`npm update -g superpowers-mcp` or `npx superpowers-mcp@latest`)
- Review skill files before execution in sensitive environments
- Report any suspicious behavior immediately
- The brainstorming Visual Companion starts a local HTTP+WebSocket server bound to `127.0.0.1` on an ephemeral port. Access is gated by a 256-bit key (transmitted only in the initial URL, then held in an `HttpOnly`/`SameSite=Strict` cookie and compared in constant time) plus a WebSocket Origin check. With `--project-dir` the key is persisted to an owner-only `.last-token` and reused across restarts (delete the file with the server stopped to rotate); ephemeral sessions get a fresh key per invocation. Do not set `BRAINSTORM_HOST` or `BRAINSTORM_URL_HOST` to a non-loopback value; use an authenticated SSH tunnel or TLS reverse proxy for remote browser access, and never share the companion URL with others.
- Server-generated files (`server-info`, session state, and launcher logs) are written with owner-only permissions (`0o600` / `umask 077` / ACL-restricted on Windows)
- `task-done` / `find-polluter` run the verification command you (or the in-session agent) already chose, as argv, in the local workspace. Do not point them at untrusted binaries.
- A `diagnosing-superpowers` bundle is a scrubbed copy of local transcripts. Review every file before sharing; redaction can miss things.
