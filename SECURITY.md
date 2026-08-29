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
- **Process-Lifecycle Safety**: `start-server.sh/.ps1` verify a PID is a live brainstorm server of this session (server-instance-id + cmdline match, same as stop-server) before signalling it, with process-start revalidation to narrow PID-reuse races; `stop-server.sh` canonicalizes paths before deleting temp sessions so `/tmp/../` tricks cannot escape the temp root. The companion refuses non-loopback plain HTTP binds. In `--project-dir` mode the session key is persisted to an owner-only `.last-token` and reused across restarts (v6.2.4); ephemeral sessions rotate the key per invocation.
- **SkillsManager Cache & Lookup**: a failed rescan returns the last-good cache instead of poisoning it with an empty list; bounded reads and canonical containment allow safe in-root symlinks; skill names containing consecutive dots (e.g. `a..b`) are map-only lookups.
- **Dependency**: `hono` is overridden to the verified exact version 4.13.0, with exact overrides for `@hono/node-server` 2.0.11 and `fast-uri` 4.1.2. `npm audit` reports **0 vulnerabilities**.
- **Regression Coverage**: `npm test` (builds first) runs the JavaScript edge-case, MCP flow, and companion-server suites. The 63-assertion PowerShell suite is run separately with `tests/powershell/run-tests.sh` and skips when `pwsh` is unavailable.

## v6.2.2 Security & Quality Hardening Notes

- **Symlink Traversal Protection**: `fs.realpath` in `readSkillContent` before relative boundary checks neutralizes symlink-based arbitrary file reads targeting system files outside `SKILLS_PATH`.
- **UTF-8 BOM Compatibility**: `\uFEFF` detection and stripping in `parseFrontmatter` and `readSkillContent` prevents frontmatter parsing failures on files saved with a BOM.
- **System Directory Prefix Filtering**: `getSafeSkillsPath` blocks `SKILLS_PATH` pointing at system subdirectories (e.g. `/etc/ssh` or `C:\Windows\System32`).
- **RFC 3986 Resource URI Compliance**: `encodeURIComponent`/`decodeURIComponent` for resource URIs with spaces or special characters.
- **Concurrency Lock Safety**: instance-reference-checked `loadingPromise` release; `forceReload` clears the content cache.

## Current Security Status (v6.3.2)

| Check | Status |
| ----- | ------ |
| npm audit vulnerabilities | :zero: Zero — exact verified overrides for `hono`, `@hono/node-server`, and `fast-uri` |
| `innerHTML` usage | :zero: Zero — entire codebase uses safe DOM APIs |
| `eval` / `new Function` / `document.write` | :zero: Zero occurrences |
| Command Injection (`execFileSync` in `render-graphs.js` & `server.cjs`) | :white_check_mark: Secured — direct binary execution, shell interpreters eliminated |
| Hardcoded secrets in tracked files | :zero: Zero — `.gitignore` covers `.env*`, `*.pem`, `*.key`, `*.token`, `credentials*` |
| World-writable files | :zero: Zero |
| MCP Prompts Injection & Path Traversal | :white_check_mark: Secured — dynamic prompt templating inherits `SkillsManager` double physical containment, `O_NOFOLLOW` / fd identity match, and safe argument sanitization |
| Symlink / Path Traversal Defense | :white_check_mark: Secured — bounded `O_NOFOLLOW`/fd reads, `realpath` containment, private state files, canonical temp-deletion guard in v6.2.3, and hardened token-file read (`readPrivateFile`) rejecting symlinked/multi-link `.last-token` in v6.2.4; **unchanged in v6.3.0** (upstream's removal of these controls was deliberately not adopted) |
| WebSocket Protocol Validation | :white_check_mark: Secured — RFC 6455 handshake check, 125-byte control-frame cap, 10 MB frame cap, 16-client cap, idle timeout, and partial-frame deadline in v6.2.3; unchanged in v6.3.0 |
| Filesystem Race / Crash Resilience | :white_check_mark: Secured — read-before-headers, try/catch fs paths, watcher self-heal in v6.2.3 |
| Process Lifecycle (stale PID) | :white_check_mark: Secured — server-instance-id + cmdline identity proof before signalling in v6.2.3 |
| Environment Input Validation (`SKILLS_PATH`, `BRAINSTORM_TOKEN`, `BRAINSTORM_PORT`) | :white_check_mark: Secured — system-dir prefix check + token format + port range in v6.2.3; `BRAINSTORM_TOKEN_FILE` must be an absolute path in v6.2.4 |
| Concurrency & Cache Safety | :white_check_mark: Secured — instance-checked promise lock, last-good cache on transient failure in v6.2.3 |
| XSS vectors (brainstorming Visual Companion & server) | :white_check_mark: Patched — DOM XSS fixed in v5.1.1, remaining `innerHTML` eliminated in v6.0.0, reflected server-side XSS fixed in v6.0.1, nonce CSP + `nosniff` + HttpOnly-only auth in v6.2.3; remote brand image from upstream v6.3.0 **not adopted** (keeps the local inline SVG, no third-party request) |
| Shell Command Injection (`BRAINSTORM_OPEN_CMD`) | :white_check_mark: Patched — `cp.execFile` with argv array in v6.0.3 |
| CORS / Lambda / Set-Cookie (`hono`) | :white_check_mark: Patched — exact `hono` 4.13.0 override (GHSA-8j4g-w8fx-2239) in v6.2.3 |

## Comprehensive Security Audit & Verification Report

A full repository security audit was conducted covering dependencies, core MCP server, Brainstorm Companion server, secret hygiene, and automated regression testing.

### 1. Dependencies & Supply Chain
- **Vulnerability Audit**: `npm audit` returned **0 vulnerabilities**.
- **Dependency Overrides**: Pinned versions for `hono` (4.13.0), `@hono/node-server` (2.0.11), and `fast-uri` (4.1.2) protect against upstream CVEs (including GHSA-8j4g-w8fx-2239).

### 2. MCP Server, Prompts & Skills Core Engine (`src/server.ts`, `src/skills-manager.ts`)
- **Prompts Injection & Argument Sanitization**:
  - `ListPromptsRequestSchema` and `GetPromptRequestSchema` are guarded against prompt injection; all template files are read through hardened `SkillsManager` APIs.
  - Arguments are evaluated safely with optional chaining and string boundary guards, preventing `undefined` concatenation or prototype pollution.
- **Path Traversal & Symlink Defense**:
  - `getSafeSkillsPath()` blocks hazardous system directory prefixes (`/etc`, `/var`, `/usr`, `C:\Windows`, etc.).
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
- **WebSocket Hardening**:
  - Strict RFC 6455 handshake validation, control frame payload cap (≤125 bytes), 10 MB frame cap, 16 concurrent client limit, and idle/partial-frame socket teardowns.

### 4. Secrets & Git Hygiene
- **Secret Scanning**: No hardcoded API keys, private keys, or tokens detected in tracked files.
- **Git Ignore**: Comprehensive rules in `.gitignore` cover `.env*`, `*.pem`, `*.key`, `*.token`, `credentials*`, and ephemeral worktrees.
- **Working Tree**: Clean git status without untracked artifacts.

### 5. Automated Security & Edge-Case Verification
- **Edge Cases & Security Suite** (`tests/edge_cases_test.js`): Passed (BOM handling, traversal blocking, concurrency locks, dot-named skills, transient failure cache preservation).
- **MCP Protocol & Prompts Suite** (`tests/run_test.js`): Passed (Initialization, `list_skills`, `read_skill`, malformed URI handling, `prompts/list`, `prompts/get` dynamic injection).
- **Companion Server Suite** (`tests/brainstorm_server_test.js`): **31 passed, 0 failed** (Authentication, token persistence, WS caps, CSP, traversal protection, PID lifecycle).

---

## Security Best Practices

When using Superpowers MCP:

- Keep the package updated to the latest version (`npm update -g superpowers-mcp` or `npx superpowers-mcp@latest`)
- Review skill files before execution in sensitive environments
- Report any suspicious behavior immediately
- The brainstorming Visual Companion starts a local HTTP+WebSocket server bound to `127.0.0.1` on an ephemeral port. Access is gated by a 256-bit key (transmitted only in the initial URL, then held in an `HttpOnly`/`SameSite=Strict` cookie and compared in constant time) plus a WebSocket Origin check. With `--project-dir` the key is persisted to an owner-only `.last-token` and reused across restarts (delete the file with the server stopped to rotate); ephemeral sessions get a fresh key per invocation. Do not set `BRAINSTORM_HOST` or `BRAINSTORM_URL_HOST` to a non-loopback value; use an authenticated SSH tunnel or TLS reverse proxy for remote browser access, and never share the companion URL with others.
- Server-generated files (`server-info`, session state, and launcher logs) are written with owner-only permissions (`0o600` / `umask 077` / ACL-restricted on Windows)
