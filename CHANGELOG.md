# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
