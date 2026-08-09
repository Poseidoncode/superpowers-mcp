# Security Policy

## Supported Versions

The following versions of Superpowers MCP are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
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

## Current Security Status (v6.2.4)

| Check | Status |
| ----- | ------ |
| npm audit vulnerabilities | :zero: Zero — exact verified overrides for `hono`, `@hono/node-server`, and `fast-uri` |
| `innerHTML` usage | :zero: Zero — entire codebase uses safe DOM APIs |
| `eval` / `new Function` / `document.write` | :zero: Zero occurrences |
| Hardcoded secrets in tracked files | :zero: Zero — `.gitignore` covers `.env*`, `*.pem`, `*.key`, `*.token`, `credentials*` |
| World-writable files | :zero: Zero |
| Symlink / Path Traversal Defense | :white_check_mark: Secured — bounded `O_NOFOLLOW`/fd reads, `realpath` containment, private state files, canonical temp-deletion guard in v6.2.3, and hardened token-file read (`readPrivateFile`) rejecting symlinked/multi-link `.last-token` in v6.2.4 |
| WebSocket Protocol Validation | :white_check_mark: Secured — RFC 6455 handshake check, 125-byte control-frame cap, 10 MB frame cap, 16-client cap, idle timeout, and partial-frame deadline in v6.2.3 |
| Filesystem Race / Crash Resilience | :white_check_mark: Secured — read-before-headers, try/catch fs paths, watcher self-heal in v6.2.3 |
| Process Lifecycle (stale PID) | :white_check_mark: Secured — server-instance-id + cmdline identity proof before signalling in v6.2.3 |
| Environment Input Validation (`SKILLS_PATH`, `BRAINSTORM_TOKEN`, `BRAINSTORM_PORT`) | :white_check_mark: Secured — system-dir prefix check + token format + port range in v6.2.3; `BRAINSTORM_TOKEN_FILE` must be an absolute path in v6.2.4 |
| Concurrency & Cache Safety | :white_check_mark: Secured — instance-checked promise lock, last-good cache on transient failure in v6.2.3 |
| XSS vectors (brainstorming Visual Companion & server) | :white_check_mark: Patched — DOM XSS fixed in v5.1.1, remaining `innerHTML` eliminated in v6.0.0, reflected server-side XSS fixed in v6.0.1, nonce CSP + `nosniff` + HttpOnly-only auth in v6.2.3 |
| Shell Command Injection (`BRAINSTORM_OPEN_CMD`) | :white_check_mark: Patched — `cp.execFile` with argv array in v6.0.3 |
| CORS / Lambda / Set-Cookie (`hono`) | :white_check_mark: Patched — exact `hono` 4.13.0 override (GHSA-8j4g-w8fx-2239) in v6.2.3 |

## Security Best Practices

When using Superpowers MCP:

- Keep the package updated to the latest version (`npm update -g superpowers-mcp` or `npx superpowers-mcp@latest`)
- Review skill files before execution in sensitive environments
- Report any suspicious behavior immediately
- The brainstorming Visual Companion starts a local HTTP+WebSocket server bound to `127.0.0.1` on an ephemeral port. Access is gated by a 256-bit key (transmitted only in the initial URL, then held in an `HttpOnly`/`SameSite=Strict` cookie and compared in constant time) plus a WebSocket Origin check. With `--project-dir` the key is persisted to an owner-only `.last-token` and reused across restarts (delete the file with the server stopped to rotate); ephemeral sessions get a fresh key per invocation. Do not set `BRAINSTORM_HOST` or `BRAINSTORM_URL_HOST` to a non-loopback value; use an authenticated SSH tunnel or TLS reverse proxy for remote browser access, and never share the companion URL with others.
- Server-generated files (`server-info`, session state, and launcher logs) are written with owner-only permissions (`0o600` / `umask 077` / ACL-restricted on Windows)
