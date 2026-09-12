# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [6.3.7] - 2026-09-12

### Upstream Sync — Batches 1–4 (obra/superpowers PRs #1966, #2196, #2228, #2229, #2237, #2255, #2258, #2259, #2262, #2263, #2265, #2270, #2271, #2274, #2276; dev 3b4f2ca, 069edf3)

Adopted the newest post-v6.3.0 upstream skill, script and git-safety refinements while preserving all fork-specific security hardening and PowerShell support:

**Batch 1 — skill routing & bookkeeping**

- **Automatic Skill Routing (PR #2229)**: `systematic-debugging` and `test-driven-development` descriptions now name their typed trigger phrases (`"systematic debug"`, `"tdd"`, `"write the test first"`, …) and cross-route to the sibling skill when the request is actually the other one — improving skill selection inside MCP hosting clients.
- **Evidence Without a Test Command (PR #2270)**: `verification-before-completion` gains the "When There Is No Test Command" section: for reports, research, audits, and correspondence, re-open the artifact in the same message, prove what can be proven from the checklist, and account for every part of the request — while claiming *complete*, never *right*.
- **Open Questions Stay Open (PR #2263)**: `brainstorming` now states that a request for context (trade-offs, implications, examples) is not an answer; the same question is re-asked until the human decides.
- **Contextual Execution Handoff (PR #2265)**: `writing-plans` requires a plan-specific recommendation (subagent-driven vs inline) with a one-line rationale instead of a hardcoded default.
- **Plan Checkbox Bookkeeping (PR #2237)**: `executing-plans` and `subagent-driven-development` now tick the plan file's steps (`- [ ]` → `- [x]`) in the same message as the completion bookkeeping, preventing the human-readable plan from drifting from the controller ledger.

**Batch 2 — intent gates & handoff review**

- **Brainstorming Intent Gates (upstream dev `3b4f2ca`, PR #2258)**: `brainstorming` gains an "Establish Shared Understanding" stage (discover the intended outcome, write it back for correction, carry it into the chosen artifact) and a rewritten `<HARD-GATE>` that enumerates each path's prerequisites — conversational approval only permits writing the spec, spec approval only permits invoking `writing-plans` — and forbids treating one approval as permission to skip later stages.
- **Planning-Handoff Review (PR #2271)**: the old "Spec Self-Review" checklist becomes a scored planning-handoff review: simulate the next planning stage, rate readiness 0.0–9.9, build a weighted burden ledger (minor/major), run exactly one bounded improvement pass, then reassess both drafts read-only and restore the original when the revision does not strictly lower total burden. The review never grants permission to begin planning.
- **Saved-Plan Review Gate (upstream dev `069edf3`, reconciled with PR #2265)**: `writing-plans` now asks the human to review the saved plan before execution; when an execution method was already supplied it preserves that method, and when none was supplied the handoff prompt carries a plan-specific recommendation with a one-line rationale.

**Batch 3 — git-safety, SDD durability and TDD characterization**

- **Remote-Safety Boundary (PR #2228)**: `using-git-worktrees` requires `--no-track` when branching from a shared ref plus a `git branch -vv` check that must show no shared upstream (`--unset-upstream` before the first commit); `executing-plans` keeps commits local (no push/pull/fetch) and forbids rewriting shared branches (`git revert` only); `implementer-prompt.md` adds a "Your Git Work Stays Local" contract that routes any mid-task push demand to the controller as BLOCKED.
- **Discoveries Ledger (PR #2274)**: the SDD progress ledger gains a `## Discoveries` section — implementers report "Discoveries for later tasks", the controller copies them into the ledger, and a controller resuming after compaction composes dispatch clause (3) from that section instead of recollection.
- **Deferred Findings Export (PR #2255)**: before a plan workspace is deleted, grep the ledger for its `Ruling:`, `minor (deferred)` and `parked` lines and carry them verbatim into a durable artifact — a "Deferred items" checklist in the PR description (Option 2) or a committed `docs/superpowers/follow-ups/<plan-basename>.md` (Option 1); `finishing-a-development-branch` carries the same obligation from its side, and the process graph now routes through the export before deletion.
- **Greenfield SDD Scripts (PR #2276)**: `sdd-workspace` falls back to the current directory when no repository exists yet (a greenfield plan's Task 1 often creates it), so pre-repo briefs are not orphaned, while `review-package` refuses with an actionable exit-2 message instead of git's bare "not a git repository". The `.ps1` twins carry the same behavior, including a fix that canonicalizes the fallback root and reads `$LASTEXITCODE` without an early-terminating pipeline.
- **TDD Characterization Guard (PR #2196)**: `test-driven-development` gains a five-step procedure for behavior-preserving refactors (name the behavior and mutation, observe the pass, empty-diff precondition, mutation plus VCS restore with `git diff --exit-code`, refactor while staying green), and `writing-good-tests.md` points at it from the boundary and mutation-check sections.

**Batch 4 — upstream content sync & upstream drift reporting**

- **Brainstorm Host Defaults (PR #2262)**: `start-server.sh` takes its bind and URL host defaults from `BRAINSTORM_HOST` / `BRAINSTORM_URL_HOST`, so containers and tunnels stop repeating `--host`/`--url-host`; an explicit flag still wins because the env defaults are applied before argument parsing. The fork's `.ps1` twin carries the same contract (fork-authored — upstream's PR touches the bash script only) and keeps the loopback guard, so a non-loopback value is refused before launch on the PowerShell path and by the companion server on the bash path. The PS1 session id also stopped being `$PID`-based alone: a second start in the same second from one pwsh host used to resolve to the same session directory and die on the live launch's redirected log handle.
- **Moving Content Into a Skill (PR #2259)**: `writing-skills` gains the mechanical re-resolution procedure for moved content — assert every relative target exists from the new depth, then re-read `above`/`below`/`earlier`/`later` references, because a dangling link fails silently — plus a matching quality-checklist item.
- **SDD Review-File Contract (PR #1966)**: SDD task reviewers write their full report to a review file (brief `…/task-N-brief.md` → review `…/task-N-review.md`) and return under 15 lines: verdicts, ⚠️ items, one line per Critical/Important finding, a Minor count, and the path. Fix subagents receive the review file path for the full detail, and scoped re-reviews append to the same file. The contract is exposed over MCP as a new `review_file` argument on `sdd-task-reviewer` and `sdd-re-review` (derived from the report or brief file's `-review.md` sibling when omitted, and replaced by that sibling when the requested path normalises to the report or brief file, so a reviewer is never pointed at the implementer's report); the comparison happens on resolved paths, so `./` segments, duplicated separators and `..` links cannot slip past it. The same release declares the `fix_base_sha` alias on `sdd-re-review` and substitutes it into `[FIX_BASE_SHA]`, a placeholder the prompt had been dropping silently.
- **Upstream Drift Report (fork-only)**: [`scripts/upstream-drift.js`](scripts/upstream-drift.js) with [`tests/upstream-sync-baseline.json`](tests/upstream-sync-baseline.json) records the upstream blob SHAs of every adopted skill file (obra/superpowers@dev `3a8bdc11`, 51 files, 14 skills). `npm run drift` reports adopted files that changed, appeared or disappeared upstream, tracked files missing from this fork, upstream skills the fork does not adopt, and fork-only additions; `npm run drift:record [-- --ignore <skill>]` refreshes the baseline and prints what moved since the previous one. Offline by default; reads the upstream tree through `gh api` with a public GitHub API fallback, and writes nothing but the baseline file. A truncated tree remains reportable as partial in fetch mode but is rejected before `--record` can replace the last complete baseline.
- **MCP Surface Coverage Test (fork-only)**: [`tests/mcp_coverage_test.js`](tests/mcp_coverage_test.js) asserts one MCP resource per `skills/*/SKILL.md` whose served content is that skill's own body, that the prompt inventory matches all four READMEs exactly (counts and names, per language), and that the composition guide references only real surfaces.
- **Skipped (PR #2257)**: `docs/porting-to-a-new-harness.md` is harness porting material this fork deliberately does not carry.

### Notes
- Upstream's escaped-quote description format (`description: "... \"tdd\" ..."`) was adapted to unquoted YAML plain scalars so the fork's `SkillsManager` frontmatter parser emits clean descriptions over MCP without literal backslashes.
- Fork-local refinement: the Planning-Handoff Review now requires committing the selected draft (and any later user-requested changes) before the User Review Gate, so the gate never points at an uncommitted revision; re-apply if upstream fixes this in PR #2271.
- The Anti-Pattern paragraph's "required design" wording for the spike path was kept verbatim for upstream sync parity (upstream dev `3b4f2ca` owns that wording).
- Upstream's eval record (`docs/superpowers/specs/2026-08-22-tdd-refactor-characterization-eval-results.md`) and its Claude-Code test harness (`tests/claude-code/test-sdd-workspace.sh`) were intentionally not imported: the fork has no evals tree, and the greenfield behavior is covered instead by `tests/sdd/test-sdd-workspace.sh` (5 assertions) and `tests/powershell/test-sdd-workspace.ps1` / `test-review-package.ps1` (4 assertions).
- The PowerShell `sdd-workspace.ps1` change also fixes two latent bugs in the fork's own script: `$base` was built from the unresolved cwd (macOS `/var` vs `/private/var`), and `$LASTEXITCODE` could be stale after a piped `Select-Object -First`.
- The reviewer's under-15-line final message is a deliberate trade: the controller is told not to read the review file during the loop, so when it ledgers a task's deferred minors it copies those one-liners from the review file's Minor section — the source the deferred-findings export depends on.
- The drift baseline records only files this fork actually ships. Upstream material inside skills the fork does not adopt is reported as a decision (`--record --ignore <skill>`) rather than as drift, so `--fail-on-drift` stays meaningful.
- `package.json` now declares `engines.node >= 18`, the floor the drift tool's `fetch` fallback and the existing tooling already assume, so an older runtime fails npm's engine check instead of breaking later.
- Batch 4 was audited by two independent fresh-context reviewers (correctness + regression/scope) before release. Their findings are part of this release: the PowerShell session-id collision, the unverified `review_file` argument, the fence-blind documentation scan, the drift bucket semantics and the SDD Minor-findings contradiction were all found and fixed, and each new guard is mutation-verified. A second, independent audit of the release notes themselves then corrected the regression floor, the undisclosed `fix_base_sha` change, the `review_file` wording, a stale test banner and the render-graphs count, and produced the path-normalisation guard with its two new checks.

### Release-Readiness Hardening
- The Bash host-default suite and PowerShell brainstorm suite now pass `--background` explicitly. This isolates them from `CODEX_CI`'s intentional foreground default and prevents the test runners from waiting for the companion server's four-hour idle timeout.
- `drift:record` now fails closed on a truncated GitHub tree before calculating or writing a replacement baseline; the existing drift test covers both complete and truncated responses without increasing the labeled suite count.
- Corrected the security regression total to **264 assertions**: Node.js 139 + Bash 35 + PowerShell 90. The temporary 270/145 figure had no matching test output and was removed from every current release claim.
- Synchronized `package-lock.json` root metadata to v6.3.7 and Node `>=18`. Normalized the npm repository URL and both CLI `bin` paths so `npm publish --dry-run` completes without manifest-correction warnings; a packed-install smoke test confirms both command links are executable.

### Testing
- [`tests/upstream_sync_test.js`](tests/upstream_sync_test.js) (registered in `npm test`): 22 labeled checks covering Batches 1–4 — typed trigger phrases, the no-test-command evidence section, the open-question rule, contextual handoff, plan-checkbox bookkeeping, brainstorming intent gates, the planning-handoff review, the saved-plan review gate, remote-safety, the Discoveries ledger, deferred-findings export, greenfield SDD scripts, the TDD characterization guard, brainstorm host defaults on both shells, moved-content link re-resolution, the SDD review-file contract, and the `SkillsManager` description pipeline (no escaped quotes).
- Full suite green under `CODEX_CI=1`: **264 assertions total** — 8 npm suites with 139 assertion checkmarks (including `tests/mcp_coverage_test.js`, `tests/drift_test.js`, and the review-file identity checks in `tests/prompts_compositions_test.js`); [`tests/sdd/test-sdd-workspace.sh`](tests/sdd/test-sdd-workspace.sh) 16 assertions; [`tests/brainstorming/test-start-server-env-hosts.sh`](tests/brainstorming/test-start-server-env-hosts.sh) 11 assertions; [`tests/writing-skills/test-render-graphs.sh`](tests/writing-skills/test-render-graphs.sh) 8 assertions; PowerShell suite 90 assertions across 5 files.
- Release checks also pass: `tsc --noEmit`, `npm audit --omit=dev` (0 vulnerabilities), live `--fetch --fail-on-drift` (0 adopted-file drift, complete tree), `npm ci --dry-run`, `npm publish --dry-run`, packed CLI installation, and `git diff --check`.

### Documentation
- All four READMEs (`README.md`, `README.zh-TW.md`, `README.ja.md`, `README.ko.md`) gained the v6.3.7 release section and version badge; release sections were pruned back to the documented latest-two policy. [`SECURITY.md`](SECURITY.md) gains the v6.3.7 upstream-sync notes and refreshed current-status heading.
- [`docs/skill-compositions.*`](docs/skill-compositions.md) now declares the English document the source of truth (all four languages carry the note), documents the Remote-Safety Boundary as a fifth architectural principle, and reflects the Batch 1–3 behavior changes (planning-handoff review, no-test-command evidence, deferred-findings export, TDD characterization guard), lists the new `review_file` argument for both SDD prompts, and drops a duplicated section heading in the ja/ko copies.
- All four READMEs gained a "Keeping Up with Upstream" section documenting the drift commands, offline mode, `--ignore` flow, and truncated-tree write protection. Their v6.3.7 release notes also record the `CODEX_CI` test isolation and package metadata fixes. [`SECURITY.md`](SECURITY.md) section 6 reflects the reproducible 264-assertion regression floor (was 174).

## [6.3.6] - 2026-09-06

### Performance
- **Extreme Performance Optimization (2x~8.1x Speedup)**:
  - **Parallel Skill Discovery**: Upgraded `SkillsManager.listSkills` to concurrent asynchronous directory traversal (`Promise.all`) combined with pre-resolved root path caching, cutting cold-start skill indexing latency from 4.79ms to 2.35ms (**2.04x speedup**).
  - **High-Velocity In-Memory Canonical Caching**: Introduced canonical realpath-keyed caching with aliasing for `readSkillContent`, dropping repeated skill reads from 0.013ms to 1.6µs (**8.1x speedup**).
  - **Frontmatter Slicing & ReDoS Defense**: Replaced full-document regular expression scans in `parseFrontmatter` with targeted 64 KB prefix buffer slices, eliminating GC pauses and quadratic ReDoS risks on large skill files.
  - **JSON Parsing Fast-Path**: Implemented native JSON trial in `stripJsonComments` (`src/setup-runner.ts`), accelerating non-commented JSON configuration reads to 0.55µs (**5.1x speedup**).
  - **Parallel Multi-Target Bundler**: Replaced sequential builds in `esbuild.js` with `Promise.all` across 4 build targets, reducing build time to ~50ms (**~42% speedup**).

### Security & Architecture (FIX ALL)
- **Dual-Subagent Code Review & Robustness Hardening**:
  - **Partial-Read Buffer Truncation Defense**: Implemented an accumulator loop (`while (totalRead < fileSize)`) in `SkillsManager.readFileNoFollow`, ensuring full buffer delivery under high disk concurrency and slow storage systems.
  - **Scan Epoch Concurrency Shield**: Added a monotonic `scanEpoch` counter in `listSkills` to prevent out-of-order asynchronous reloads from clobbering updated skill catalogs.
  - **Canonical Path Cache Invalidation**: Unified cache indexing on physical canonical paths (`realFilePath`) and linked aliases in `canonicalPathMap`, completely eliminating symlink cache drift during force reloads.
  - **System Blacklist Expansion**: Added macOS `/private/etc` and `/private/var` into `getSafeSkillsPath`, guarding against privilege directory pointer attacks.
  - **Symlink Target Defense in Configuration Writes**: `safeWriteConfig` verifies `fs.lstat` and realpaths before writes, blocking symlinks pointing to sensitive system locations.
  - **Strict TypeScript & Rule 7 Zero-Defect Compliance**: Cleaned up unused dead code (`exists`), enforced clean compilation under `--noUnusedLocals --noUnusedParameters`, and eliminated all unhandled or untyped empty catch blocks.

### Testing & Verification
- **Full Regression Test Suite**:
  - 85 core unit and end-to-end integration tests with 174 regression assertions passing at 100% across all test suites (`edge_cases_test.js`, `run_test.js`, `brainstorm_server_test.js`, `prompts_compositions_test.js`, and `setup_test.js` with 33 passed tests).
  - Updated [`SECURITY.md`](SECURITY.md), [`tests/code_review_report.md`](tests/code_review_report.md), and [`tests/performance_optimization_report.md`](tests/performance_optimization_report.md).

## [6.3.5] - 2026-09-05

### Added
- **7 New AI Agent & Editor Harnesses Support (`src/setup-runner.ts`, `scripts/install.sh`)**:
  - Expanded universal one-click setup engine to support 7 additional AI developer platforms, bringing total coverage to 15 major AI environments:
    - **GitHub Copilot (VS Code Insiders)** (`Code - Insiders/User/mcp.json`, strictly isolated physical configuration path preventing collisions with Stable VS Code, aliases: `copilot-insiders`, `vscode-insiders`, `code-insiders`, `insiders`, `insider`, `vscode-insider`, `code-insider`, `copilot-insider`)
    - **QwenPaw (Personal Agent Workstation)** (`~/.qwenpaw/config.json`, backward-compatible with `copaw`, aliases: `qwenpaw`, `qwen-paw`, `copaw`)
    - **Cline (VS Code / CLI)** (`.../saoudrizwan.claude-dev/settings/cline_mcp_settings.json`, aliases: `cline`, `claude-dev`)
    - **Kilo Code** (`~/.config/kilo/kilo.jsonc` with adaptive `"mcp"` root and array-based command schema, aliases: `kilo`, `kilocode`, `kilo-code`)
    - **Qoder** (`~/.qoder/settings.json`, alias: `qoder`)
    - **Kiro** (`~/.kiro/settings/mcp.json`, aliases: `kiro`, `kiro-code`)
    - **Trae** (`.../Trae/User/mcp.json`, cross-platform support for macOS, Windows, Linux, and Trae CN)
  - Added `"json-mcp"` schema format type to dynamically handle Kilo Code's unique dictionary structure.
  - Enforced Single Source of Truth (SSOT) by wiring `harness.defaultConfig(cmd, args)` directly through `runSetup` into `updateJsonConfig`.

### Security & Auditing
- **Dual-Subagent Architectural & Code Quality Review**:
  - Dispatched specialized Architectural & Security Reviewer and Quality & Edge-Case Reviewer subagents.
  - Verified atomic writes (`crypto.randomBytes(8)` + `flag: "wx"`), symlink containment, least-privilege permissions (`0o700`/`0o600`), and zero-pollution disk defaults across all 15 harnesses.
  - Verified physical configuration isolation between VS Code Stable and VS Code Insiders, ensuring independent additions, updates, and removals.
  - Completed comprehensive project-wide security review and refreshed [`SECURITY.md`](SECURITY.md) with 173 automated regression test assertions.

### Testing & Documentation
- **Automated Test Suite Expansion (`tests/setup_test.js`)**:
  - Expanded setup regression tests from 21 to 32 tests (100% pass rate), adding end-to-end sandbox creation, aliases, co-existence, and update assertions for Copilot Insiders, Claude Desktop, Kimi Work, and Hermes Desktop.
- **Multilingual Documentation Alignment**:
  - Synchronized supported harness directories and one-click commands across all 4 localized READMEs ([`README.md`](README.md), [`README.zh-TW.md`](README.zh-TW.md), [`README.ja.md`](README.ja.md), [`README.ko.md`](README.ko.md)).
  - Cleaned up obsolete metric residues in [`tests/global_setup_verification.md`](tests/global_setup_verification.md).

## [6.3.4] - 2026-09-05

### Universal One-Click Global Setup Engine (`src/setup-runner.ts`, `scripts/`)
- **Multi-Harness Targeted Setup**:
  - Engineered a universal, zero-dependency configuration engine supporting 8 initial AI agent environments:
    - **Antigravity (Google DeepMind)** (`~/.gemini/config/mcp_config.json`)
    - **Pi Desktop / Pi Agent** (`~/.pi/agent/mcp.json`)
    - **Cursor** (`~/.cursor/mcp.json`)
    - **GitHub Copilot (VS Code)** (`User/mcp.json` with `servers` format and `stdio` type)
    - **Hermes Desktop / Agent** (`config.yaml` / `%LOCALAPPDATA%\hermes\config.yaml`)
    - **Kimi Work / Kimi Code** (`~/.kimi-code/mcp.json`)
    - **Claude Desktop** (`claude_desktop_config.json`)
    - **Devin Desktop (formerly Windsurf)** (`mcp_config.json`)
  - Registered CLI binaries in `package.json`: `superpowers-setup` and `superpowers-mcp setup`.
  - Built shell wrappers [`scripts/install.sh`](scripts/install.sh) (macOS & Linux) and [`scripts/install.ps1`](scripts/install.ps1) (Windows PowerShell) for seamless remote one-line installation (`curl` / `irm`) and local repository execution.
- **Explicit Consent & Anti-Virus Design**:
  - Strictly requires explicit target specification via `--target <client>` (or `-t`).
  - Completely abolished unprompted broad disk scanning or blind crawling (`--all` removed); executing without a target safely prints interactive guidance with zero filesystem reads or writes.
- **Atomic File Operations & Race Defense (`safeWriteConfig`)**:
  - Non-destructive atomic write pattern utilizing temporary files scoped to the configuration directory with process ID and a cryptographically secure 8-byte hexadecimal nonce (`crypto.randomBytes(8)`).
  - Enforces `flag: "wx"` (exclusive creation, eliminating symlink hijacking) followed by atomic commit via `fs.renameSync`.
- **Symlink Boundary Preservation & Least-Privilege Security**:
  - Resolves target paths through `fs.realpathSync` to preserve symbolic link destinations while guarding containment boundaries.
  - Automatically restricts newly created directories to mode `0o700` (`rwx------`) and files to `0o600` (`rw-------`) or source permissions. Pre-write backup files (`.bak`) strictly inherit source permissions.
- **Injection-Free Serialization & Prototype Pollution Defense**:
  - All command arguments injected into YAML and JSON are defensively escaped using `JSON.stringify`.
  - Config parser supports JSONC (comment stripping and trailing comma tolerance) and validates dictionary structures via `isPlainObject`, blocking Prototype Pollution and root Array corruption.
- **CLI Transport Stdio Isolation**:
  - `src/server.ts` routes `setup` arguments in `main()` prior to initializing any MCP Stdio transport, preventing protocol deadlock or stdout pollution.
- **Automated Test Suite (`tests/setup_test.js`)**:
  - Added 32 comprehensive unit tests validating config formats (including `json-mcp`), JSONC comment handling, YAML injection protection, cross-platform path resolution, anti-bulk target consent, and sandbox atomic writes (100% PASS).

### Skill Compositions & End-to-End Pipelines (`docs/skill-compositions.*`, `src/server.ts`)
- **New Workflow Prompts**:
  - Registered 3 new MCP workflow prompts:
    - `feature-pipeline`: End-to-end feature delivery orchestration (`brainstorming` ➔ `writing-plans` ➔ `using-git-worktrees` ➔ `subagent-driven-development` ➔ `verification-before-completion` ➔ `requesting-code-review` ➔ `finishing-a-development-branch`).
    - `structured-debug`: Systematic root-cause debugging with worktree isolation, parallel agent investigation, failing reproduction tests (TDD), fix resolution, code review, and branch finishing.
    - `skill-composition`: Context-aware workflow dispatcher recommending optimal multi-skill compositions for large refactoring, legacy codebase safety nets, or onboarding.
- **Dedicated Multi-Language Documentation (`docs/`)**:
  - Created localized, comprehensive workflow guides across 4 languages with inter-linking navigation:
    - [`docs/skill-compositions.md`](docs/skill-compositions.md) (English)
    - [`docs/skill-compositions.zh-TW.md`](docs/skill-compositions.zh-TW.md) (Traditional Chinese)
    - [`docs/skill-compositions.ja.md`](docs/skill-compositions.ja.md) (Japanese)
    - [`docs/skill-compositions.ko.md`](docs/skill-compositions.ko.md) (Korean)
  - Standardized visual layouts with horizontal Mermaid flowcharts (Pipeline 1: Feature Pipeline, Pipeline 3: Large Refactoring, Pipeline 4: Legacy Safety Net) and ASCII workflow diagrams in all 4 READMEs.
- **Skill Authoring & Metadata Standards**:
  - Enhanced [`skills/using-superpowers/SKILL.md`](skills/using-superpowers/SKILL.md) with the Skill Compositions & Pipelines section.
  - Enhanced [`skills/writing-plans/SKILL.md`](skills/writing-plans/SKILL.md) and [`skills/subagent-driven-development/implementer-prompt.md`](skills/subagent-driven-development/implementer-prompt.md) with `Recommended Skill` task metadata standards and controller-to-subagent dispatch protocols.
- **Automated Composition Tests (`tests/prompts_compositions_test.js`)**:
  - Added 7 comprehensive test assertions validating prompt discovery, stage integrity, dynamic scenario focusing, parameter trimming, cascading injection prevention, and unknown prompt rejection (100% PASS).

### MCP Prompts Security Hardening & Lifecycle Fixes (`src/server.ts`)
- **Cascading Placeholder Injection Defense**:
  - Upgraded `interpolateTemplate` to a single-pass regular expression replacement engine with sorted, escaped keys, eliminating cascading/nested placeholder expansion vulnerabilities.
- **Universal String Argument Clamping & Prototype Defense**:
  - Enforced universal `getStringArg` with a 32 KB clamp (`MAX_PROMPT_ARG_LENGTH = 32 * 1024`) and `hasOwnProperty` validation across all 9 prompts, eliminating ReDoS and memory exhaustion hazards.
- **Input Sanitization & Balanced Syntax**:
  - Sanitized `featureName` stripping newlines and resolved unescaped parentheses in `spec-reviewer`.
- **Complete Debugging Lifecycle**:
  - Augmented `structured-debug` with Stage 6 (findings resolution via `receiving-code-review`) and Stage 7 (branch finishing and cleanup via `finishing-a-development-branch`).

### Upstream Architecture Alignment & Worktree Compatibility
- **Architecture Guards & Template Interpolation**:
  - Aligned upstream architecture guards and dynamic prompt placeholder interpolation for SDD implementers and plan reviewers.
  - Fully compatible with Git Worktrees (`.worktrees/task-<N>`) and plan shapes (`skeleton-first` vs `task-by-task`).
  - Extended regression coverage in `tests/run_test.js` verifying prompt arguments and placeholder interpolation.

### Documentation Refactoring & Hygiene
- **Unified 14-Skills Overview Matrix**:
  - Unified the 14-skills overview tables across all 4 language READMEs (`README.md`, `README.zh-TW.md`, `README.ja.md`, `README.ko.md`), aligning SDLC phases, core value propositions, and community-recommended scenarios.
- **One-Click Global Setup Guide**:
  - Added detailed setup instructions organized by Operating System and AI Agent Harness with exact copy-pasteable commands.
- **Acknowledgments & Section Streamlining**:
  - Restored upstream Acknowledgments sections in all 4 language READMEs.
  - Streamlined README changelog sections to retain the latest 2 releases.

### Comprehensive Security Audit & Verification
- **Zero-Vulnerability Verification**:
  - Executed repository-wide security scan; `npm audit` confirms **0 vulnerabilities** with exact dependency overrides for `hono` (^4.13.7), `@hono/node-server` (^2.1.1), `fast-uri` (^4.1.3), and `qs` (^6.16.0).
  - Confirmed 0 secrets, 0 world-writable files, and 0 dangerous dynamic code evaluations (`eval`, `new Function`, `innerHTML`).
- **All Test Suites Passing (100% PASS)**:
  - Validated all 5 test suites (`tests/edge_cases_test.js`, `tests/run_test.js`, `tests/brainstorm_server_test.js`, `tests/prompts_compositions_test.js`, and `tests/setup_test.js`).
  - Updated [`SECURITY.md`](SECURITY.md) and [`tests/security_audit_report.md`](tests/security_audit_report.md) with the v6.3.4 security status matrix and audit findings.


## [6.3.3] - 2026-08-29

### MCP Protocol & Multi-Harness Expansion

- **MCP Standard Prompts Support (`src/server.ts`)**:
  - Implemented `ListPromptsRequestSchema` and `GetPromptRequestSchema` handlers, registering 6 standard prompts for seamless IDE prompt-picker usage:
    - `session-start`: Superpowers system context injection.
    - `sdd-implementer`: Implementer subagent prompt with optional `task_description` and `plan_file` arguments.
    - `sdd-task-reviewer`: Task reviewer subagent prompt with optional `task_description` and `review_target` arguments.
    - `sdd-re-review`: Scoped re-review prompt for delta-only fix iterations.
    - `spec-reviewer`: Adversarial specification reviewer prompt.
    - `plan-reviewer`: Adversarial implementation plan reviewer prompt.
- **Platform Reference Mappings (`skills/using-superpowers/references/`)**:
  - Added [`references/devin-tools.md`](file:///Users/poseidomhung/Documents/github/Infinity/superpowers-mcp/skills/using-superpowers/references/devin-tools.md) for Devin CLI tool resolution (`invoke_subagent`, `skill`, `task_list`).
  - Added [`references/opencode-tools.md`](file:///Users/poseidomhung/Documents/github/Infinity/superpowers-mcp/skills/using-superpowers/references/opencode-tools.md) for OpenCode tool resolution (`use_skill`, `find_skills`).
  - Updated [`skills/using-superpowers/SKILL.md`](file:///Users/poseidomhung/Documents/github/Infinity/superpowers-mcp/skills/using-superpowers/SKILL.md) Platform Adaptation table.
- **Multi-Lingual Documentation Alignment**:
  - Refined top header sections of `README.md`, `README.zh-TW.md`, `README.ja.md`, and `README.ko.md` with explicit MCP protocol feature tables (Tools / Prompts / Resources) and the extended multi-harness support matrix.
- **Test Suite Expansion (`tests/run_test.js`)**:
  - Added automated assertions for `prompts/list` and `prompts/get` parameter injection.

### Upstream Enhancements: Skeleton-First Architecture & Wave Dispatch

Adopted upstream `skeleton-alternative` capabilities and security hardening:

- **writing-plans — Two Plan Shapes Router & Skeleton-First Plans**:
  - `skills/writing-plans/SKILL.md` adds the **Two Plan Shapes** router (`task-by-task` default vs `skeleton-first` alternative) to classify the plan shape upfront.
  - New [`skills/writing-plans/skeleton-first-plans.md`](file:///Users/poseidomhung/Documents/github/Infinity/superpowers-mcp/skills/writing-plans/skeleton-first-plans.md) defines the Walking Skeleton approach (Task 1 creates the thinnest running end-to-end slice across all subsystems), Task Contracts (precise interfaces/success criteria instead of handwritten code scripts), and explicit `Tier: mechanical | judgment` tagging.
- **subagent-driven-development (SDD) — Wave Dispatch & Parallel Worktree Protocol**:
  - `skills/subagent-driven-development/SKILL.md` gains **Dispatch Plan** scanning for `Plan shape: skeleton-first` plans, grouping file-disjoint tasks into waves for concurrent dispatch.
  - Adds the **Parallel Worktree Protocol**: each concurrent task runs in its own dedicated Git Worktree (`.worktrees/task-<N>`), with integration merges executed sequentially in plan order and merge-conflict remediation via implementer resume.
  - Step 5 now appends a `Plan holds` / `Amendment:` check line after task completion to apply plan-level corrections before subsequent task dispatches.
- **SDD — Tier-Driven Model Selection**:
  - SDD controller and [`implementer-prompt.md`](file:///Users/poseidomhung/Documents/github/Infinity/superpowers-mcp/skills/subagent-driven-development/implementer-prompt.md) follow the plan's `Tier:` tag (mechanical → fast/cheapest model, judgment → standard mid-tier model) to optimize tokens and execution speed without re-litigating tiers at dispatch.
- **writing-skills — Binary Execution Hardening in `render-graphs.js`**:
  - Switched from `execSync` shell execution to `execFileSync('dot', ...)` for Graphviz CLI invocations, preventing shell interpretation hazards and improving cross-platform reliability while maintaining full CommonJS compatibility.

## [6.3.1] - 2026-08-18

### Upstream Enhancements & Robustness Hardening

Adopted post-v6.3.0 upstream improvements across SDD, TDD, Code Review, and Brainstorming workflows with cross-platform (Bash & PowerShell) support:

- **subagent-driven-development (SDD) — Ownership Markers & Path Normalization**: `sdd-workspace` and `sdd-workspace.ps1` now write and check `plan-path` ownership markers in `.superpowers/sdd/` workspaces. Plans with identical basenames across different directories (e.g. `docs/alpha/plan.md` vs `docs/beta/plan.md`) resolve to distinct, non-colliding workspaces with parent directory or counter suffixes, eliminating artifact and ledger overwrites.
- **SDD — Review Package Range Mechanical Guards**: `review-package` and `review-package.ps1` now enforce `git merge-base --is-ancestor BASE HEAD` and `git rev-list --count BASE..HEAD > 0` (exiting with code 3 on error) to reject invalid or empty commit ranges and prevent false-pass review approvals.
- **SDD — Helper Execution Resilience**: `task-brief` and `review-package` now invoke `sdd-workspace` via explicit `"${BASH:-bash}"` so helpers execute cleanly even if executable bits (`+x`) are lost during archive extraction or cross-environment migration.
- **test-driven-development (TDD) — Project Suite Verification Floor**: `skills/test-driven-development/SKILL.md` explicitly defines "green" as passing the entire repository test suite (e.g., bare `npm test`, `pytest`, `cargo test`) before declaring a task complete, preventing omissions of broken existing tests.
- **requesting-code-review — Merge-Base Anchoring**: `skills/requesting-code-review/SKILL.md` now anchors multi-commit review `BASE_SHA` to `git merge-base origin/main HEAD` to prevent phantom deletions when `origin/main` advances.
- **brainstorming — Tooling Decision Gate**: `skills/brainstorming/SKILL.md` adds a proactive tooling inquiry (linter, formatting, unit/e2e tests, fuzzing) during the Design Presentation phase for new projects, recording choices into the spec's `Global Constraints`.

### Tests
- Added `tests/sdd/test-sdd-workspace.sh` (5 assertions for bash ownership, range guards, stripped exec bit).
- Expanded `tests/powershell/test-sdd-workspace.ps1` (13 assertions) and `tests/powershell/test-review-package.ps1` (17 assertions).
- Full suites passing 100% across MCP, Security, PowerShell, SDD Bash, and Graphviz render-graphs.

## [6.3.0] - 2026-08-16

### Upstream Sync: obra/superpowers v6.3.0

Adopted the applicable upstream v6.3.0 changes while preserving all fork-specific security hardening and PowerShell support.

- **brainstorming — three-path router**: the skill now classifies every request as `spike` / `bounded` / `architectural` before asking anything, announces the path, and scales the ceremony to the path — the approval gate applies to every path, and hidden complexity upgrades the path mid-task (never downgrades). New flow graph and red-flag table.
- **subagent-driven-development — rulings, not stalls**: a running plan no longer waits on a human for conflicts, ambiguities, or plan defects — the controller rules on each, records `Ruling:` entries in the ledger, and continues; only four named conditions stop execution (irreversible/destructive operations, security-sensitive actions, out-of-worktree side effects, a plan so broken every path is a guess). Pre-flight conflict scan now produces a ledgered table; small same-shape tasks are batched into a single dispatch; subagent waits use bounded 5–10-minute stretches with reconciliation. All three prompts (implementer / task-reviewer / re-review) gain the no-subagents contract.
- **Hermes Agent support**: new `using-superpowers/references/hermes-tools.md` maps skill actions to Hermes tools (`delegate_task`, `skill_view`, …); the harness table in `using-superpowers/SKILL.md` lists it.
- **Codex guidance update**: `codex-tools.md` documents V1/V2 multi-agent differences, `fork_turns: "none"` spawns, `followup_task` fix-round resume, event-subscription `wait_agent` semantics, and a `default_subagent_model` backstop.
- **writing-plans**: plan template gains a `Spec:` field so the spec travels with the plan.
- **finishing-a-development-branch**: worktree removal-refused procedure (never `--force` on your own initiative; show the human the stakes and ask).
- **requesting-code-review**: `code-reviewer.md` gains the no-subagents contract.
- **writing-skills**: `render-graphs.js` probes `dot -V` instead of `which` (Windows-compatible); upstream test suite `tests/writing-skills/test-render-graphs.sh` (8 assertions) added.

### Fixes from dual-agent code review

- **finishing-a-development-branch**: in the merged path, choosing "Commit them to <branch>" from the removal-refused menu left the new commit on top of the merge, so `git branch -d` refused ("not fully merged") and agents could reach for `-D`, destroying the files just chosen to preserve. The procedure now instructs re-merging (or cherry-picking) into the base branch before cleanup.
- **sdd-workspace.ps1**: slug derivation switched to case-sensitive `-creplace` so `PLAN.MD` derives the same workspace name on PowerShell as `basename` does on POSIX.

### Not Adopted (deliberate deviations)

- Upstream v6.3.0 removed several brainstorming-server security controls (loopback-only bind enforcement, `O_NOFOLLOW`/fd-identity token-file reads, nonce CSP, local brand SVG, WS control-frame caps). This fork keeps its hardened v6.2.4 server and its visual-companion docs.
- Upstream deleted the `.ps1` launcher/helper scripts; this fork keeps all of them and the Windows PowerShell references in SDD docs (covered by the 64-assertion PowerShell suite).
- Upstream restructured into a plugin-only layout (hooks/, `.devin`/`.hermes`/`.kimi`/… plugin manifests, `.opencode` entry point, `src/` removal). This fork remains an MCP server for VSCode/Antigravity/Cursor and did not adopt those.

### Tests

- All suites pass: MCP flow (`tests/run_test.js`), render-graphs (8 assertions), and the PowerShell suite (64 assertions across 5 files, `tests/powershell/run-tests.sh`).

## [6.2.4] - 2026-08-09

### Upstream Alignment: Brainstorm Session-Key Persistence
- **`--project-dir` sessions now persist the session key** (`server.cjs` / `start-server.sh` / `start-server.ps1`): the key is written to `.superpowers/brainstorm/.last-token` (0o600, owner-only dir) alongside `.last-port` and reused across restarts, so an already-open browser tab's HttpOnly cookie keeps validating — restart no longer requires re-sharing the URL. Ephemeral `/tmp` sessions keep rotating the key per invocation; setting `BRAINSTORM_TOKEN` (env) still wins over the file and is never persisted.
- **Token-file read path hardened** (`readPrivateFile`): mirrors `writePrivateFile` — lstat rejects symlinks / non-regular / multi-link files, the fd is opened with `O_NOFOLLOW` and identity re-checked via `fstat`, and permissions are tightened to 0600 through the fd (never a path-based chmod, which would follow a symlink). A symlinked `.last-token` is now rejected instead of adopted as the session key (was HIGH, found by independent security review).
- **Persistence failures are now logged**: a failed token-file write emits `Failed to write private token file:` so silent per-start rotation is diagnosable (matches the port-file behavior).
- **`BRAINSTORM_TOKEN_FILE` validation**: the env value must be an absolute path; relative paths are ignored.
- **start-server.ps1 env hygiene**: the ephemeral branch now clears stale `BRAINSTORM_TOKEN_FILE`/`BRAINSTORM_PORT_FILE` from the invoking pwsh session so a prior `--project-dir` run can't leak a project key into a `/tmp` session.
- **Docs**: `visual-companion.md` documents the persistence tradeoff and the remediation path (delete `.last-token` with the server stopped to force a fresh key).

### Tests
- **`tests/brainstorm_server_test.js` (31 assertions)**: token-file persistence across restarts, pre-seeded file honored, symlinked token file rejected (skip when symlinks are unsupported), rotation preserved without a token file; test 13 wrapped in try/finally so failures can't orphan server processes or temp dirs.
- **PowerShell suite**: `.last-token` now asserted to exist and match the served key; `start-server.ps1` env-hygiene change covered by the 17-assertion brainstorming server suite.
- All suites pass: JavaScript edge-case/security, MCP flow, companion-server, and PowerShell (`tests/powershell/run-tests.sh`).

## [6.2.3] - 2026-08-05

### Security & Hardening
- **Brainstorm Server Crash Fix**: request handlers no longer let filesystem races (content dir deleted, screen file vanishing between readdir and read) crash the process with an uncaught ENOENT — screen serving and `/files/*` reads are now guarded and degrade to the waiting page / 404.
- **stop-server.sh Temp-Deletion Traversal Fix**: `/tmp/*` prefix check now resolves both paths canonically (`cd` + `pwd -P`, matching stop-server.ps1) so a session dir like `/tmp/../home/user/project` can no longer trick it into `rm -rf` on a directory outside the temp root (Linux-real, macOS-accidentally-safe).
- **Stale PID Signal Hardening (start-server.sh / start-server.ps1)**: restart paths now prove a PID is a live brainstorm server of this session (server-instance-id + cmdline check, same as stop-server) before signalling it, with process-start revalidation to narrow PID-reuse races.
- **WebSocket Handshake Validation (server.cjs)**: upgrade requests are now verified against RFC 6455 (`Upgrade: websocket`, `Connection: upgrade`, `Sec-WebSocket-Version: 13`, well-formed `Sec-WebSocket-Key`) so non-WS clients cannot enter the frame parser.
- **WebSocket Control Frame Limit (server.cjs)**: control frames (PING/CLOSE/PONG) with payloads > 125 bytes are rejected per RFC 6455 §5.5, closing the PING-amplification path; sockets are also destroyed after sending CLOSE so scripted peers cannot linger half-open.
- **MCP Resource URI Validation (src/server.ts)**: malformed percent-encoding in `skill://` resource URIs is now reported as `InvalidRequest` (-32600) instead of leaking a URIError as an internal error.
- **Symlink Swap Defense (skills-manager)**: skill reads now validate canonical containment twice and compare the opened file descriptor identity; POSIX additionally uses `O_NOFOLLOW`, while Windows rejects reparse-point swaps through the same identity check.
- **Dependency**: `hono` pinned to >=4.12.34, resolving moderate ReDoS advisory GHSA-8j4g-w8fx-2239 (CORS middleware). `npm audit` is back to 0 vulnerabilities.

### Fixed & Improved
- **Log Origin Spoofing**: `handleMessage` now spreads the client event first so a client-supplied `source` field cannot spoof the event origin in the server log.
- **helper.js**: click handler guards `e.target instanceof Element` before calling `closest`; the offline event queue is capped at 200 (drops oldest) so a long disconnect can't grow memory.
- **Regression Suite**: new `tests/brainstorm_server_test.js` (19 assertions) covering crash survival, `/files` traversal, WS handshake rejection, control-frame limits, auth, event recording, watcher resilience, oversized screens, and security headers; wired into `npm test`.
- **Watcher Resilience (server.cjs)**: the content-dir watcher now self-heals — it is re-established after the content dir is deleted and recreated (inotify watches the inode), both on demand (next page request) and on a lifecycle interval, so new screens keep triggering reload broadcasts.
- **Resource Bounds (server.cjs)**: WebSocket clients are capped at 16 with idle/partial-frame timeouts, screens larger than 20 MB are skipped through bounded reads, skill files are capped at 10 MB, the per-session events log is capped at 1 MB, and user-event log lines are capped at 4096 UTF-8 bytes.
- **Input Validation (server.cjs)**: `BRAINSTORM_PORT` must be an integer in 1024–65535, HTTP binds and displayed URL hosts must be loopback, and the WebSocket upgrade path is restricted to `/`.
- **Security Headers (server.cjs)**: added `X-Content-Type-Options: nosniff`, nonce-based CSP, and HttpOnly-only browser authentication; screen HTML cannot access the session key through page-readable storage.
- **Shell Scripts**: `start-server.sh` resolves a relative `--project-dir` against the caller's cwd up front (a relative session path previously resolved against the wrong directory after `cd`); `start/stop-server.ps1` no longer assign to the read-only automatic variable `$IsWindows` (case-insensitive) — they use a separate name with an `OSVersion.Platform` fallback so Windows PowerShell 5.1 takes the correct branch.
- **SkillsManager**: `findSkill` no longer rejects skill names containing consecutive dots (e.g. `a..b`) — lookups are map-only and never touch the filesystem, so only separators/null/exact `.`/`..` are blocked; a failed rescan (e.g. unreadable directory) now returns the last-good cache instead of poisoning it with an empty list; `parseFrontmatter` accepts empty `name:`/`description:` values (falls back to the directory name).

### Fixed & Improved
- **`/files/` double-`writeHead` crash (found by subagent review)**: the old catch-then-`writeHead(404)` path threw `ERR_HTTP_HEADERS_SENT` (headers already sent by the 200) and crashed the process — the exact crash class the hardening claims to eliminate. Files are now read *before* headers are sent; reads also use `open` + `O_NOFOLLOW` + fd-`fstat` + size cap, closing the check-then-read TOCTOU.
- **Watcher self-heal fixed for Linux (found by subagent review)**: inotify reports deletion of the watched dir as a plain `rename` event carrying the dir's own basename (no error), so the watcher stayed non-null-but-dead and was never re-armed. `onContentEvent` now detects the dir's own basename and tears the watcher down — guarded by an inode check so a late event from an old watcher can't kill a freshly re-armed one; `ensureContentWatcher` also re-arms on inode mismatch.
- **State-dir race hardening**: `appendEvent` and the events-file unlink are wrapped in try/catch so a deleted `state/` dir at runtime can't crash the server from the WS data path.
- **WS closed-flag**: after sending CLOSE, further frames are no longer parsed or dispatched (RFC 6455 §5.5.1), and the socket is paused before destruction.
- **`BRAINSTORM_TOKEN` env validation**: the operator-supplied token must match the same `^[0-9a-f]{32,}$` rule as the file source, or a fresh token is generated.
- **Server-log bound**: user-event log lines are capped at 4096 UTF-8 bytes and oversized lines are replaced with a valid truncated JSON record, so an authenticated client can't grow `server.log` without limit (events file was already capped).
- **SkillsManager last-good cache**: a missing skills dir (transient move/rename) now returns the last-good cache instead of `[]`, consistent with the readdir-failure path.
- **start-server.ps1**: `server-instance-id` is written via `[IO.File]::WriteAllText` (UTF-8, no BOM) so Windows PowerShell 5.1's BOM-emitting `Set-Content -Encoding utf8` can't break bash-side identity checks on shared session dirs.
- **start-server.sh**: a failed `cd` for a relative `--project-dir` falls back to a lexical join against the caller's cwd instead of silently dropping the requested project dir.
- **Test suite**: `pretest` builds `out/` so `npm test` works on a fresh checkout; the harness can no longer hang if the server child already exited (close-event await raced with a timeout); new regression test: an unreadable `/files/` asset returns 404 without crashing (covers the double-`writeHead` fix).

## [6.2.2] - 2026-08-05

### Security & Hardening
- **Symlink Traversal Prevention**: `SkillsManager.readSkillContent()` now uses `fs.realpath` to resolve canonical file paths before checking relative boundaries, neutralizing symlink-based arbitrary file read vectors.
- **UTF-8 BOM Compatibility**: `parseFrontmatter` and `readSkillContent` detect and strip `\uFEFF` (Byte Order Mark), preventing parsing failures or unstripped headers on files saved with UTF-8 BOM.
- **System Directory Prefix Filtering**: `getSafeSkillsPath` in `src/server.ts` upgraded to prefix-based filtering (`unsafePrefixes`), preventing `SKILLS_PATH` injection into system subdirectories (e.g. `/etc/ssh` or `C:\Windows\System32`).
- **Resource URI Compliance**: Enforced `encodeURIComponent` for resource URIs in `ListResourcesRequestSchema` and `decodeURIComponent` in `ReadResourceRequestSchema` for RFC 3986 compliance with skill names containing spaces or special characters.

### Fixed & Improved
- **Concurrency Lock Parity**: `SkillsManager.listSkills()` verifies `if (this.loadingPromise === currentPromise)` in its `finally` block, avoiding premature lock clearing when concurrent `forceReload = true` requests occur.
- **Cache Invalidation**: `listSkills(forceReload = true)` now automatically clears `contentCache`, ensuring skill file updates take immediate effect.
- **YAML Indentation Parity**: `parseFrontmatter` now handles both tab (`\t`) and space indentation for multiline description fields.
- **Edge-Case Unit Test Suite**: Added `tests/edge_cases_test.js` to continuously validate BOM handling, path traversal, symlink defense, concurrency lock behavior, and cache invalidation.

## [6.2.1] - 2026-08-04

### Fixed
- **stop-server.ps1**: `Get-CimInstance Win32_Process` is Windows-only and crashed on macOS/Linux; the process identity check now uses `ps` on Unix platforms.

### Removed
- **copilot-tools.md**: Removed orphaned reference file (already pruned upstream in v6.2.0; nothing referenced it locally).

### Added
- **PowerShell script tests** (`tests/powershell/`): 63 assertions across 5 suites covering `sdd-workspace.ps1`, `task-brief.ps1`, `review-package.ps1`, `find-polluter.ps1`, and the brainstorm `start-server.ps1`/`stop-server.ps1` lifecycle. Run with `tests/powershell/run-tests.sh`; skips gracefully when `pwsh` is unavailable.

## [6.2.0] - 2026-07-29

### Major
- **Upstream Sync with obra/superpowers v6.2.0**: Synchronized upstream improvements across all skills while preserving local security enhancements and PowerShell helpers.

### Changed
- **subagent-driven-development Restructure**: Plan-scoped workspaces (`.superpowers/sdd/<plan>/`) so concurrent plans can never read or overwrite each other's artifacts. Resume-based review-fix loop with a five-round circuit breaker. New scoped `re-review-prompt.md` for re-reviews after fixes.
- **test-driven-development**: `testing-anti-patterns.md` replaced by upstream `writing-good-tests.md`.
- **finishing-a-development-branch**: Adopted upstream rewrite (includes the same worktree-path capture fix previously patched locally; branch discard is now explicit-request-only).
- **Skills-wide compression**: Recap and persuasion sections removed across many `SKILL.md` files, reducing prompt token footprint.
- **gemini-tools.md**: Restored to the updated upstream version; `visual-companion.md` gains a Gemini CLI launch section.
- Aligned version reporting: `package.json`, `package-lock.json`, and the MCP server handshake version are now consistent.

### Fixed
- **PowerShell exit-code parity**: With `$ErrorActionPreference = "Stop"`, `Write-Error` became a terminating error so the `exit 2/3` statements never ran; SDD `.ps1` scripts now write to stderr directly and preserve the bash exit-code contract (2 = usage/validation, 3 = task not found).
- **`sdd-workspace.ps1` slug derivation**: Strips only a trailing `.md` (matching bash `basename "$plan" .md`) instead of any extension.
- **`task-brief.ps1` / `review-package.ps1` hardening**: Capture only the first output line from `sdd-workspace.ps1` so a future extra output line cannot corrupt the workspace path.
- **`find-polluter.ps1`**: Ported the `./`-prefix and `**/` collapse fixes from the bash version.

## [6.0.3] - 2026-07-25

### Security
- **Command Injection Fix**: Replaced `cp.exec()` with `cp.execFile()` in the brainstorming Visual Companion server (`server.cjs`) for the `BRAINSTORM_OPEN_CMD` launcher path, eliminating shell metacharacter injection regardless of env var content.
- **Dependency Security (overrides)**: Added `overrides` block in `package.json` enforcing minimum versions for transitive dependencies: `@hono/node-server` >= 2.0.11 (GHSA-frvp-7c67-39w9), `fast-uri` >= 4.1.1 (GHSA-4c8g-83qw-93j6, GHSA-v2hh-gcrm-f6hx), `body-parser` >= 2.3.0 (GHSA-v422-hmwv-36x6).

### Fixed
- `find-polluter.sh`: Accepts `./`-prefixed paths and supports top-level test files by collapsing `**/` in the pattern.
- `finishing-a-development-branch/SKILL.md`: Captures `WORKTREE_PATH` before Step 5 changes directory, fixing a cleanup regression. Added detached HEAD push variant for Option 2.

### Added
- Japanese (`README.ja.md`) and Korean (`README.ko.md`) README translations; all four locales now cross-link each other.

## [6.0.2] - 2026-07-16

### Added
- Windows PowerShell helper wrappers for Visual Companion startup/shutdown, subagent-driven-development task/review package generation, and systematic-debugging polluter detection.
- `SkillsManager` module for async skill discovery, metadata lookup, and content caching.
- MCP smoke test script for initialize, `list_skills`, and `read_skill` behavior.

### Security
- **WebSocket frame size validation**: Added `MAX_FRAME_PAYLOAD_BYTES (10 MB)` bound check in `decodeFrame()` — dual protection at BigInt extended-length and general post-resolution stages. Prevents oversized frame OOM attacks (CWE-789).
- **Hardlink containment**: Added `stat.nlink !== 1` check in `isRegularFileInsideContentDir()` — blocks path traversal via hardlinked files with links outside `CONTENT_DIR`.
- **`escapeHtmlText()` extraction**: Extracted inline `escHtml` closure into a reusable named function for consistent HTML escaping across the codebase.
- **URL parsing refactor**: Extracted `pathnameOf()` and `queryKey()` helpers; refactored `handleRequest()` to use them, reducing duplicate inline URL logic.

### Changed
- Refactored MCP server skill loading into `SkillsManager`, with map-based lookups and generic error masking for skill content reads.
- Updated package metadata, README, security notes, and verification logs for v6.0.2.
- Added `.superpowers/` to `.gitignore` for generated Superpowers runtime workspace files.
- `subagent-driven-development/SKILL.md`: Added `plan-mandated` review guidance for plan conflict adjudication.
- `writing-skills/SKILL.md`: Strengthened prohibition vs. recipe guidance with empirical evidence from wording tests.
- `test-driven-development/SKILL.md`: Fixed table formatting for readability.
- `writing-skills/anthropic-best-practices.md`: Updated image CDN URLs.
- `skills/brainstorming/scripts/helper.js`: Added 4 clarifying inline comments to align with upstream documentation. DOM-safe `showTombstone()` preserved (no `innerHTML` regression).

### Fixed
- Synced `package-lock.json` root version with `package.json`.
- Replaced repository documentation links that used local `file:///Users/...` paths with portable relative links.
- Improved Windows helper parity for encoding, pid files, package inclusion, and companion state-file permissions.
- **`review-package` path resolution**: Fixed `sdd-workspace` invocation to use absolute path (`$(cd "$(dirname "$0")" && pwd)`) instead of relative path, fixing failures when invoked from a different working directory.

### Removed
- `walkthrough.md` — obsolete v5.1.0 upgrade guide.

## [6.0.0] - 2026-07-04

### Major
- **Upstream Sync with obra/superpowers v6.1.1**: Synchronized upstream improvements across all skills.

### Changed
- **subagent-driven-development Redesign**: Consolidated two-stage review (spec → code quality) into a single "task reviewer" sub-agent. Added whole-branch final review at completion. Added Pre-Flight Plan Review for conflict detection before execution begins. Added Model Selection Guidance for cost-optimized sub-agent dispatch.
- **using-superpowers Simplified**: Removed platform-specific sections and Graphviz diagram. Added per-platform reference files (`antigravity-tools.md`, `pi-tools.md`) and updated `codex-tools.md` for cleaner multi-environment support.
- **brainstorming Visual Companion**: Changed to just-in-time offering — no longer offered upfront, only when a visual question actually arises.
- **Type Safety**: Fixed `Record<string,string>` cast in `src/server.ts` with proper `typeof` guard for the `skill_name` parameter.
- **Code Quality**: Replaced remaining `innerHTML` usage with safe DOM methods. Removed redundant checks, verbose comments, and inlined single-use helpers.

### Added
- `skills/subagent-driven-development/task-reviewer-prompt.md` — consolidated reviewer prompt replacing separate spec and code-quality prompts.
- `skills/subagent-driven-development/scripts/review-package` — script for packaging review context.
- `skills/subagent-driven-development/scripts/sdd-workspace` — subagent workspace setup.
- `skills/subagent-driven-development/scripts/task-brief` — task briefing script.
- `skills/using-superpowers/references/antigravity-tools.md` — Antigravity CLI tool mapping.
- `skills/using-superpowers/references/pi-tools.md` — Pi CLI tool mapping.
- `.pi-subagents/` to `.gitignore`.

### Removed
- `skills/subagent-driven-development/spec-reviewer-prompt.md` (consolidated into task-reviewer).
- `skills/subagent-driven-development/code-quality-reviewer-prompt.md` (consolidated into task-reviewer).

## [5.1.2] - 2026-06-20

### Security
- Upgraded `hono` from `4.12.23` to `4.12.26` to address 5 high/medium severity advisories including CORS origin reflection, Lambda body-limit bypass, and Set-Cookie header merging.

### Changed
- Resolved all outstanding Dependabot alerts — 37 total advisories now fully patched.

## [5.1.1] - 2026-06-15

### Security
- Fixed DOM XSS vulnerability (DOM text reinterpreted as HTML) in `skills/brainstorming/scripts/helper.js` by replacing direct `innerHTML` usage with safe `textContent` + DOM creation methods.
- Upgraded `path-to-regexp` to version `8.4.2` to resolve high-severity Regular Expression Denial of Service (ReDoS) vulnerability.
- Updated `.gitignore` to prevent committing sensitive environment and private key files.
- Completed full-scale project security audit and updated `tests/security_audit_report.md` with new findings.

### Changed
- Upgraded devDependencies `esbuild` from `0.25.12` to `0.28.1`.

## [5.1.0] - 2026-06-11

### Added
- Added standard MCP protocol initialization response metadata matching `v5.1.0` server capabilities.

### Changed
- **Inline Self-Review**: Replaced heavyweight subagent review loops (Spec Review, Plan Review) in `brainstorming` and `writing-plans` with lightweight inline self-review checklists, reducing execution time overhead.
- **Git Worktree Redesign**: Rewrote `using-git-worktrees` and `finishing-a-development-branch` with a `detect-and-defer` mechanism, prioritizing native AI editor tools (such as Claude Code's `EnterWorktree`) and safely falling back to git CLI commands.
- **Token Footprint Optimization**: Removed obsolete `Integration` sections from all skills, reducing prompt token usage during agent execution.
- **Agent Consolidation**: Merged the independent `code-reviewer` agent directly into `requesting-code-review` skill templates.

### Removed
- Removed legacy slash commands (`/brainstorm`, `/execute-plan`, `/write-plan`) in favor of standard MCP tool invocation.
