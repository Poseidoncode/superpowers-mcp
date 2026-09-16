# Security Policy

## Supported Versions

The following versions of Superpowers MCP are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
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

## Current Security Status (v6.3.10 - Verified: 2026-09-17)

| Check | Status |
| ----- | ------ |
| npm audit vulnerabilities | :zero: Zero — exact verified overrides for `hono` (^4.13.7), `@hono/node-server` (^2.1.1), `fast-uri` (^4.1.3), `qs` (^6.16.0) |
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
| Hardcoded secrets in tracked files | :zero: Zero — `.gitignore` covers `.env*`, `*.pem`, `*.key`, `*.token`, `credentials*`, `task.md` |
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
| Full Security Audit & Secret Hygiene | :white_check_mark: Verified (2026-09-17) — 0 vulnerabilities, 0 hardcoded secrets, 0 world-writable files, 292/292 automated test assertions passed |

## Comprehensive Security Audit & Verification Report (Last Audited: 2026-09-17)

A full repository security audit was conducted covering dependencies, core MCP server, Universal Global Setup Engine, Brainstorm Companion server, secret hygiene, and automated regression testing.

### 1. Dependencies & Supply Chain
- **Vulnerability Audit**: `npm audit` returned **0 vulnerabilities**.
- **Dependency Overrides**: Verified exact overrides for `hono` (^4.13.7), `@hono/node-server` (^2.1.1), `fast-uri` (^4.1.3), and `qs` (^6.16.0) protect against upstream CVEs (including GHSA-8j4g-w8fx-2239).

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

### 5. Secrets & Git Hygiene
- **Secret Scanning**: No hardcoded API keys, private keys, or tokens detected in tracked files.
- **Git Ignore**: Comprehensive rules in `.gitignore` cover `.env*`, `*.pem`, `*.key`, `*.token`, `credentials*`, `task.md`, and ephemeral worktrees.
- **Working Tree & File Modes**: Clean git status without untracked artifacts. Zero world-writable files.

### 6. Automated Security & Edge-Case Verification
- **Edge Cases & Security Suite** (`tests/edge_cases_test.js`): Passed **11/11 tests** (BOM handling, traversal blocking, concurrency locks, dot-named skills, transient failure cache preservation, automatic cache revalidation, duplicate skill-name collision handling, single-stat cache validation, and epoch invalidation).
- **MCP Protocol & Prompts Suite** (`tests/run_test.js`): Passed **7/7 tests** (Initialization, `list_skills`, `read_skill`, malformed URI handling, `prompts/list`, `prompts/get` dynamic injection).
- **Companion Server Suite** (`tests/brainstorm_server_test.js`): Passed **33/33 tests** (Authentication, token persistence, WS caps, CSP, traversal protection, PID lifecycle, fragmented text assembly, resilient tail event compaction).
- **Compositions & Prompts Injection Suite** (`tests/prompts_compositions_test.js`): Passed **16/16 checks** (Workflow prompts coverage, multi-stage integrity, dynamic scenario focus, cascading injection defense, unknown prompt rejection, declared SDD review-file arguments, an explicitly named review file, normalised-path substitution, brief-file substitution, and `superpowers:` prefix normalization).
- **Global Setup Engine Suite** (`tests/setup_test.js`): Passed **47/47 tests** (Full coverage across 17 AI agent harnesses: Antigravity, Pi Desktop, Cursor, Copilot, Copilot Insiders, Hermes, Kimi, Claude, Devin, QwenPaw, Cline, Kilo Code, Qoder, Kiro, Trae, LM Studio, Roo Code; JSONC comment tolerance, YAML comment preservation, YAML linear ReDoS guard with 60,000 whitespace padding, `--print-config` clean JSON emission, `json-mcp` local format, YAML injection defense, plain object validation, anti-bulk target consent, cross-platform path resolution, atomic write sandbox & symlink preservation, idempotent removal, double invocation defense, parent-directory symlink breakout defense, concurrent config change detection, fail-closed shape parsing, user-managed JSON fields preservation, multi-root keys reuse, disabled flag consistency, non-identifier YAML indentation, and malformed CLI invocation exit codes).
- **SDD Workspace Bash Suite** (`tests/sdd/test-sdd-workspace.sh`): Passed **16/16 tests** (Workspace isolation, path normalization, collision counters, commit range validation, permission-stripped execution).
- **Writing Skills Render Graphs Suite** (`tests/writing-skills/test-render-graphs.sh`): Passed **8/8 tests** (Direct binary execution, SVG rendering, output verification, error capture).
- **PowerShell Script Hardening Suite** (`tests/powershell/`): Passed **94/94 assertions** across 5 test scripts (`test-brainstorming-server.ps1`: 29, `test-find-polluter.ps1`: 12, `test-review-package.ps1`: 20, `test-sdd-workspace.ps1`: 20, `test-task-brief.ps1`: 13).
- **Upstream Sync Regression Suite** (`tests/upstream_sync_test.js`): Passed **22/22 checks** pinning the imported upstream content (Batches 1-4: skill routing, evidence law, intent gates, remote-safety, SDD review-file contract, brainstorm host defaults).
- **MCP Surface Coverage Suite** (`tests/mcp_coverage_test.js`): Passed **17/17 checks** (one resource per skill on disk, each resource serves that skill's own content, prompt inventory matches all four READMEs exactly, composition guide references only real surfaces, composition guides included in npm package, and unsafe SKILLS_PATH rejection).
- **Upstream Drift Suite** (`tests/drift_test.js`): Passed **10/10 checks** (the offline CLI run is one of them); the committed baseline (`tests/upstream-sync-baseline.json`) records the upstream blob SHAs of every adopted skill file, so a deleted import, a lost upstream lineage or a stale ignore entry fails here. Network mode (`npm run drift`) compares the baseline against upstream without writing anything.
- **Brainstorm Host Defaults Bash Suite** (`tests/brainstorming/test-start-server-env-hosts.sh`): Passed **11/11 tests** (env-supplied bind/url hosts, flag precedence, empty values, and the non-loopback refusal).
- **Total Automated Regression Floor**: **292 automated test assertions across Node.js (163), Bash (35), and PowerShell (94), 100% pass rate, 0 regressions**.


---

## Security Best Practices

When using Superpowers MCP:

- Keep the package updated to the latest version (`npm update -g superpowers-mcp` or `npx superpowers-mcp@latest`)
- Review skill files before execution in sensitive environments
- Report any suspicious behavior immediately
- The brainstorming Visual Companion starts a local HTTP+WebSocket server bound to `127.0.0.1` on an ephemeral port. Access is gated by a 256-bit key (transmitted only in the initial URL, then held in an `HttpOnly`/`SameSite=Strict` cookie and compared in constant time) plus a WebSocket Origin check. With `--project-dir` the key is persisted to an owner-only `.last-token` and reused across restarts (delete the file with the server stopped to rotate); ephemeral sessions get a fresh key per invocation. Do not set `BRAINSTORM_HOST` or `BRAINSTORM_URL_HOST` to a non-loopback value; use an authenticated SSH tunnel or TLS reverse proxy for remote browser access, and never share the companion URL with others.
- Server-generated files (`server-info`, session state, and launcher logs) are written with owner-only permissions (`0o600` / `umask 077` / ACL-restricted on Windows)
