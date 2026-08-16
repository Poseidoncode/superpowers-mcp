# Superpowers MCP Toolpack Usage Guide

[English](README.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

[![Version](https://img.shields.io/badge/version-6.3.0-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

This document summarizes the information and usage instructions for packaging the original Superpowers skills library into an independent MCP Toolpack.

---

## 🚀 How to Install and Use

### Supported Environments

**Antigravity**, **Cursor**, **VSCode**, and other AI editors that support the MCP toolchain.

### Chatting with the AI Agent

Once installed or configured, your AI Agent (such as Copilot or Antigravity Cascade) will be able to recognize the `Superpowers Skills`.

**You can ask things like:**

- "List all superpowers skills"
- "Use read_skill to read the brainstorming skill, and then help me analyze the implementation of this feature"
- "Apply the session-start prompt" (Simulates the original startup injection mechanism)

---

## 🛠️ MCP Configuration

Add the following settings to your IDE (e.g., Cursor, Antigravity, or VSCode MCP settings). 

### Method : NPX / BUNX (Recommended)

This is the easiest way as it handles path resolution automatically.

#### Using Bun (Faster)
```json
{
  "superpowers": {
    "command": "bunx",
    "args": ["-y", "superpowers-mcp"]
  }
}
```

#### Using Node/NPM
```json
{
  "superpowers": {
    "command": "npx",
    "args": ["-y", "superpowers-mcp"]
  }
}
```

---

## 💡 Common Skills & Scenarios

| Skill Name | Community Recommended Scenario | Core Value |
| :--- | :--- | :--- |
| `brainstorming` | Before starting a new feature, exploring requirements and design. | Prevents the AI from jumping straight into writing code. |
| `writing-plans` | Before multi-file refactoring or complex migrations. | Establishes a clear execution blueprint. |
| `systematic-debugging` | When encountering any errors or abnormal behavior. | Enforces "root cause analysis" instead of guessing. |
| `test-driven-development` | When implementing logically challenging features. | Ensures code is accompanied by tests, achieving Red-Green-Refactor. |
| `verification-before-completion` | Before claiming "it's fixed" or "it's done". | Evidence-based completion confirmation. |

---

## 🔄 Recommended Prompt Sequences

### 1. New Feature Development Sequence
1. "Read the brainstorming skill to confirm requirements and architecture."
2. "Read the writing-plans skill to create an execution plan with specific steps."
3. "Read the test-driven-development skill to implement the feature with tests."
4. "Read the verification-before-completion skill to run test suites and ensure everything works."

### 2. Emergency Hotfix Sequence
1. "Read the systematic-debugging skill to locate the root cause of the current issue."
2. "Read the test-driven-development skill to write a failing test for the bug and fix it."
3. "Read the verification-before-completion skill to validate the applied hotfix."

---

## 📋 Supported Skills Overview (14 Total)

To help you choose the right skill, we've categorized them into 6 logical phases of software development:

### 🚀 1. Planning & Design
- `brainstorming`: Software design and requirements analysis process
  - Visual Companion for browser-based mockups and design reviews (just-in-time)
- `writing-plans`: Creating detailed implementation plans

### 💻 2. Implementation & Debugging
- `executing-plans`: Executing created implementation plans
- `test-driven-development`: TDD (Test-Driven Development) workflow
- `systematic-debugging`: Systematic debugging and root cause analysis

### 🛡️ 3. Quality & Review
- `verification-before-completion`: Evidence-based verification before completion
- `requesting-code-review`: Initiating pre-checks for code reviews
- `receiving-code-review`: Receiving and addressing code review feedback
- `finishing-a-development-branch`: Finalizing and integrating feature branches

### 🌿 4. Version Control
- `using-git-worktrees`: Managing multiple branches using Git Worktrees

### 🤖 5. Advanced Agent Controls

These skills are designed for orchestrating complex meta-execution patterns within supported IDEs (like Antigravity or Cursor).

- **`subagent-driven-development`**: Driving sub-agents to execute tasks
  - **Usage**: Used to execute a predefined plan task-by-task. The system spawns a fresh "implementer" sub-agent per task, followed by a consolidated **task reviewer** (spec compliance + code quality) sub-agent, plus a **whole-branch final review** at the end. A **Pre-Flight Plan Review** scans for task conflicts before execution begins. Plans run in plan-scoped workspaces (`.superpowers/sdd/<plan>/`), the controller rules on conflicts and records them in the ledger instead of stopping, and small same-shape tasks are batched into a single dispatch.
  - **Model Selection**: Choose sub-agent models based on task complexity — cheaper models for mechanical work, capable models for architecture and subtle concurrency changes.
  - **Example**: "Read the subagent-driven-development skill, then execute the tasks listed in docs/plans/feature-plan.md one by one."
- **`dispatching-parallel-agents`**: Dispatching tasks to parallel agents
  - **Usage**: Used for tackling multiple *independent* issues (e.g., 3 unrelated failing tests or 3 separate web research topics). The AI will adopt a parallel-execution mindset, addressing each task independently without crossing state or experiencing context pollution, significantly speeding up output generation.
  - **Debugging Example**: "Read the dispatching-parallel-agents skill, then dispatch 3 parallel agents to investigate the independently failing tests A, B, and C."
  - **Research Example**: "Read the dispatching-parallel-agents skill, then search the web for React 19 features, Vue 3.5 updates, and Svelte 5 Runes in parallel — summarize each independently."

### ⚙️ 6. Customization & Meta
- `using-superpowers`: Guidelines and self-checks for using Superpowers
- `writing-skills`: Writing and expanding new custom skills

---

## 🆕 Recent Updates

### v6.3.0 (Latest)

- **Upstream sync with obra/superpowers v6.3.0** — all applicable improvements adopted, fork-specific security hardening and PowerShell support preserved.
  - **brainstorming — three-path router**: every request is classified `spike` / `bounded` / `architectural` up front; the ceremony scales with the task but the approval gate never does. Hidden complexity upgrades the path mid-task — never downgrades.
  - **subagent-driven-development — rulings, not stalls**: conflicts, ambiguities, and plan defects are ruled on and ledgered (`Ruling: ...`) instead of parking the session on a human; only four named conditions stop execution. Pre-flight conflict scans produce a ledgered table, small same-shape tasks batch into one dispatch, subagent waits use bounded stretches, and all three prompts carry the no-subagents contract.
  - **Hermes Agent support**: new `hermes-tools.md` reference maps skill actions to Hermes tools (`delegate_task`, `skill_view`, …).
  - **Codex**: V1/V2 multi-agent differences, `followup_task` fix-round resume, and event-subscription `wait_agent` guidance.
  - **writing-plans**: plan template now carries a `Spec:` field.
  - **finishing-a-development-branch**: worktree removal-refused procedure — never `--force` on your own initiative.
- **Fixes from dual-agent code review**: merged-path "commit them to \<branch\>" no longer strands files outside the base branch (finishing-a-development-branch); `sdd-workspace.ps1` slug derivation matches `basename` on all platforms (`PLAN.MD` stays `PLAN.MD`).
- **Not adopted (deliberate)**: upstream's v6.3.0 server simplification (it removed loopback-only enforcement, `O_NOFOLLOW` reads, nonce CSP, and the local brand SVG) — this package keeps its hardened server; upstream's `.ps1` deletions and plugin-only restructuring also don't apply to this MCP server layout.
- **Tests**: MCP flow, render-graphs (8 assertions), and the full PowerShell suite (64 assertions) all pass.

### v6.2.4

- **Upstream alignment — persistent brainstorm sessions**: with `--project-dir`, the companion now persists its session key to `.superpowers/brainstorm/.last-token` (owner-only, gitignored) alongside `.last-port` and reuses it across restarts — an already-open browser tab stays connected after a restart, no URL re-sharing needed. Ephemeral `/tmp` sessions keep rotating the key per invocation, and an explicit `BRAINSTORM_TOKEN` env var still wins and is never persisted. Delete `.last-token` (server stopped) to force a fresh key.
- **Token-file read path hardened** (`readPrivateFile`): symlinked or multi-link `.last-token` files are rejected instead of being adopted as the session key, with the read performed through an `O_NOFOLLOW` fd whose identity is re-checked and tightened to 0600 — closing the asymmetry with the already-hardened write path (found by independent security review).
- **Diagnosability**: a failed token-file write now logs `Failed to write private token file:` instead of silently degrading to per-start key rotation.
- **start-server.ps1 env hygiene**: an ephemeral (no `--project-dir`) launch no longer inherits a stale project key/port from the invoking pwsh session.
- **Tests**: companion suite now 31 assertions — token persistence across restarts, pre-seeded file honored, symlinked token file rejected, rotation preserved without a token file; test cleanup is failure-safe (try/finally). PowerShell suite asserts `.last-token` matches the served key.

### v6.2.3

- **Hardened Brainstorming Visual Companion (`server.cjs`)**: the local loopback-only HTTP+WebSocket server is crash-resistant against filesystem races (a deleted content dir or a screen vanishing mid-read degrades to the waiting page / 404 instead of killing the process), and its watcher self-heals after the content dir is deleted and recreated (Linux inotify + macOS FSEvents). WebSocket handshakes are validated against RFC 6455 (version/upgrade/connection/key), control-frame payloads are capped at 125 bytes, clients have idle/partial-frame deadlines, and the oldest connection is evicted when the cap is full. Security headers now include `nosniff` and a nonce CSP; generated keys rotate per invocation; screen, skill, event, and user-event reads/logs are size-capped and state files are private.
- **Companion security defaults**: the server only binds to loopback HTTP, rotates its key on every invocation, stores browser authentication only in an HttpOnly/SameSite cookie after the initial URL, and blocks unnonce'd scripts in screen HTML. Remote browsers must use an authenticated SSH tunnel; a restart requires sharing the new `server-info` URL.
- **`/files/` double-`writeHead` crash fixed** (found by subagent review): files are read *before* headers are sent, and reads use `O_NOFOLLOW` + fd-based `fstat` + size cap, closing the check-then-read TOCTOU.
- **Process-lifecycle safety**: `start-server.sh/.ps1` now prove a PID is a live brainstorm server of this session (server-instance-id + cmdline check, same as stop-server) before signalling it; `stop-server.sh` resolves paths canonically before deleting temp sessions so `/tmp/../` tricks can't escape the temp root; relative `--project-dir` is resolved up front; `server-instance-id` is written without BOM so cross-shell identity checks work on Windows PowerShell 5.1.
- **SkillsManager hardening**: skill reads use `O_NOFOLLOW` on POSIX (symlink-swap TOCTOU); a failed rescan returns the last-good cache instead of poisoning it; skill names containing consecutive dots (e.g. `a..b`) are now findable — lookups are map-only and never touch the filesystem.
- **MCP protocol polish**: malformed percent-encoding in resource URIs now returns `InvalidRequest` (-32600) instead of leaking an internal error.
- **Dependencies**: exact verified overrides pin `hono` to 4.13.0, `@hono/node-server` to 2.0.11, and `fast-uri` to 4.1.2 (resolving the relevant advisories). `npm audit`: **0 vulnerabilities**.
- **Test suite**: `npm test` builds first and runs the JavaScript edge-case/security, MCP server flow, and companion-server regression suites. The 63-assertion PowerShell suite runs separately with `tests/powershell/run-tests.sh` and skips gracefully when `pwsh` is unavailable.
- **Independent review**: the security and correctness findings were addressed with per-invocation auth rotation, loopback-only HTTP, nonce CSP, bounded reads, private state writes, and deterministic cross-platform tests.

### v6.2.2

- **Symlink Traversal Prevention**: `SkillsManager.readSkillContent()` now canonicalizes paths with `fs.realpath` before checking boundaries, preventing symlink-based arbitrary file reads; `getSafeSkillsPath` also blocks dangerous system-directory prefixes.
- **Compatibility & Protocol**: Added UTF-8 BOM support for frontmatter and skill content, and enforced RFC 3986 encoding/decoding for resource URIs containing spaces or special characters.
- **Correctness & Tests**: Force reloads now invalidate the content cache, concurrent reload locking is safer, multiline YAML descriptions accept tab or space indentation, and `tests/edge_cases_test.js` covers these security and cache behaviors.

### v6.2.1

- **PowerShell Script Test Suite**: Added `tests/powershell/` with 63 assertions across 5 suites for `sdd-workspace.ps1`, `task-brief.ps1`, `review-package.ps1`, `find-polluter.ps1`, and the brainstorm `start-server.ps1`/`stop-server.ps1` lifecycle. Run with `tests/powershell/run-tests.sh`; it skips gracefully when `pwsh` is unavailable.
- **stop-server.ps1 Cross-Platform Fix**: `Get-CimInstance Win32_Process` is Windows-only; the script now uses `ps` on Unix so the server-id check works correctly on macOS/Linux.
- **Cleanup**: Removed `skills/using-superpowers/references/copilot-tools.md`, an orphaned reference file already pruned upstream.

### v6.2.0
- **Upstream Sync with obra/superpowers v6.2.0**: Synchronized upstream improvements across all skills while preserving local security enhancements and PowerShell helpers.
  - **subagent-driven-development Restructure**: Plan-scoped workspaces (`.superpowers/sdd/<plan>/`) so concurrent plans can never read or overwrite each other's artifacts. Resume-based review-fix loop with a five-round circuit breaker, plus a new scoped `re-review-prompt.md` for re-reviews after fixes.
  - **test-driven-development**: `testing-anti-patterns.md` replaced by upstream `writing-good-tests.md`.
  - **finishing-a-development-branch**: Adopted the upstream rewrite (includes the same worktree-path capture fix previously patched locally; branch discard is now explicit-request-only).
  - **Skills-wide compression**: Recap and persuasion sections removed across many `SKILL.md` files, reducing prompt token footprint.
  - **gemini-tools.md**: Restored to the updated upstream version; `visual-companion.md` gains a Gemini CLI launch section.
- **PowerShell Parity Fixes**:
  - All SDD `.ps1` scripts ported to the new plan-scoped `PLAN_FILE` interfaces; `find-polluter.ps1` gained the `./`-prefix and `**/` collapse fixes from the bash version.
  - **Exit-code parity**: Fixed `Write-Error` under `$ErrorActionPreference = "Stop"` swallowing the intended exit codes — validation failures now correctly exit 2 and a missing task exits 3, matching the bash scripts.
  - **`sdd-workspace.ps1` slug derivation**: Strips only a trailing `.md` (matching bash `basename`), instead of any file extension.
- **Version Alignment**: `package.json`, `package-lock.json`, and the MCP server handshake version are now consistent at 6.2.0.

### v6.0.3
- **Command Injection Fix**: Replaced `cp.exec()` with `cp.execFile()` in the brainstorming Visual Companion server (`server.cjs`) for the `BRAINSTORM_OPEN_CMD` launcher path. The old code concatenated the env var with the URL via the shell; the new code passes arguments as an argv array, eliminating shell metacharacter injection regardless of env var content.
- **Dependency Security (overrides)**: Added `overrides` block in `package.json` enforcing minimum versions for transitive dependencies:
  - `@hono/node-server`: 1.19.14 → **2.0.11** — fixes Windows path traversal in serve-static via encoded backslash ([GHSA-frvp-7c67-39w9](https://github.com/advisories/GHSA-frvp-7c67-39w9))
  - `fast-uri`: 3.1.2 → **4.1.1** — fixes host confusion via IDN canonicalization ([GHSA-4c8g-83qw-93j6](https://github.com/advisories/GHSA-4c8g-83qw-93j6)) and literal backslash authority delimiter ([GHSA-v2hh-gcrm-f6hx](https://github.com/advisories/GHSA-v2hh-gcrm-f6hx))
  - `body-parser`: 2.2.2 → **2.3.0** — fixes DoS when invalid limit value silently disables size enforcement ([GHSA-v422-hmwv-36x6](https://github.com/advisories/GHSA-v422-hmwv-36x6))
- **Upstream Bug Fixes**:
  - `find-polluter.sh`: Now accepts `./`-prefixed paths (not just bare paths) and supports top-level test files by collapsing `**/` in the pattern
  - `finishing-a-development-branch/SKILL.md`: Captures `WORKTREE_PATH` before Step 5 changes directory, fixing a cleanup regression. Added detached HEAD push variant for Option 2

### v6.0.2
- **Modular Refactoring & Performance Upgrades**:
  - **Decoupled Architecture**: Extracted file system access, metadata caching, and parsing logic into a dedicated [`src/skills-manager.ts`](src/skills-manager.ts), leaving [`src/server.ts`](src/server.ts) purely focused on MCP protocol handling.
  - **O(1) Map-Based Cache**: Replaced the $O(N)$ double-array scan with case-insensitive, dual-key (by name and directory name) memory caches for fast $O(1)$ lookups.
  - **Async I/O Pipeline**: Swapped synchronous file API calls (`readdirSync`, `readFileSync`) with promises and `Promise.all` concurrent execution, unlocking high-throughput performance.
  - **Markdown Cache**: Cached stripped skill content in memory to avoid repetitive disk reads when tools are invoked frequently.
- **Security Hardening**:
  - **ReDoS Prevention**: Replaced regex-based frontmatter parser with a safe, line-by-line state machine parser, completely eliminating CPU exhaustion risks and supporting multiline YAML descriptions.
  - **Path Traversal Shield**: Added strict alphanumeric white-listing (`/^[a-zA-Z0-9-_]+$/`) on skill name inputs to prevent traversal attacks.
  - **Directory Injection Check**: Validated `SKILLS_PATH` to actively reject potentially hostile system root folders.
  - **Path & Username Leak Protection**: Caught native file system errors and masked them into generic, path-free `McpError` payloads.
  - **Windows Build and Script Safety**: Handled Windows `chmodSync` platform checks in `esbuild.js` and skipped Symlinks in `copy-skills.js` to prevent recursive file copy loops.

- **Upstream Security Cherry-Picks**: Applied security hardening from obra/superpowers v6.1.1:
  - **WebSocket frame size validation**: Added `MAX_FRAME_PAYLOAD_BYTES (10 MB)` check in `decodeFrame()` to prevent oversized frame attacks (CWE-789). Dual protection — BigInt extended-length and general post-resolution guard.
  - **Hardlink containment**: Added `stat.nlink !== 1` check in `isRegularFileInsideContentDir()` prevents path traversal via hardlinks.
  - **`escapeHtmlText()` extraction**: Extracted inline `escHtml` closure into a reusable named function for consistent HTML escaping.
  - **URL parsing refactor**: Extracted `pathnameOf()` and `queryKey()` helpers, reducing duplicate inline URL logic in `handleRequest()`.
- **`review-package` Path Resolution Fix**: Fixed `sdd-workspace` invocation to use absolute path resolution (`$(cd "$(dirname "$0")" && pwd)`) instead of relative path, fixing CWD-dependent failures.
- **Windows Native Helper Scripts**: Added PowerShell wrappers for Visual Companion startup/shutdown, SDD review/task helpers, and systematic-debugging polluter detection.
- **Skill Documentation Enhancements**:
  - `subagent-driven-development`: Added `plan-mandated` review guidance for handling plan conflicts.
  - `writing-skills`: Strengthened prohibition vs. recipe guidance with empirical evidence from wording tests.
  - `test-driven-development`: Fixed table formatting for clarity.
  - `writing-skills/anthropic-best-practices`: Updated image CDN URLs.
- **`helper.js` Comment Alignment**: Added 4 clarifying inline comments to align with upstream documentation without changing behavior. DOM-safe `showTombstone()` preserved (no `innerHTML` regression).
- **Cleanup**: Removed obsolete `walkthrough.md` (v5.1.0 upgrade guide).

### v6.0.1
- **Security Fix — Reflected XSS (#2)**: Fixed server-side reflected cross-site scripting in `skills/brainstorming/scripts/server.cjs`. The `bootstrapPage()` function was called with the user-supplied `keyFromQuery` parameter (even though validated via `timingSafeEqualStr`). Changed to use the server-side `TOKEN` constant instead, eliminating user-tainted data from the HTML response sink. Zero behavior change (the validated value is identical).

### v6.0.0
- **Upstream Sync with obra/superpowers v6.1.1**: Major synchronization bringing upstream improvements across all skills.
- **subagent-driven-development Redesign**: Consolidated two-stage review (spec → code quality) into a single "task reviewer" sub-agent, plus added a broad **whole-branch final review** at completion. New **Pre-Flight Plan Review** catches task conflicts before execution begins. Added **Model Selection Guidance** to optimize cost vs. turn count.
- **using-superpowers Simplified**: Removed platform-specific sections and Graphviz diagram. Introduced **per-platform reference files** (`antigravity-tools.md`, `pi-tools.md`) and updated `codex-tools.md` for cleaner multi-environment support.
- **brainstorming Visual Companion**: Changed to **just-in-time** offering — no longer offered upfront, only when a visual question actually arises.
- **Type Safety & Code Quality**: Fixed `Record<string,string>` cast in `server.ts` with proper `typeof` guard. Replaced remaining `innerHTML` with safe DOM methods. Removed redundant checks and verbose comments across the codebase.

### v5.1.2
- **Security Hardening**: Removed the last remaining `innerHTML` usage in `skills/brainstorming/scripts/helper.js`, replacing it with safe DOM creation methods — now zero `innerHTML` in the entire codebase.
- **Dependency Security**: Upgraded `hono` from `4.12.23` to `4.12.26` to patch 5 advisories including CORS origin reflection, Lambda body-limit bypass, and Set-Cookie header merging.
- **Clean Slate**: All 37 Dependabot advisories and npm audit warnings now fully resolved — zero outstanding vulnerabilities.

### v5.1.1
- **Security Audit & Hardening**: Conducted a full-scale security audit and updated `.gitignore` rules to prevent potential secret leaks.
- **Vulnerability Patches**: Patched XSS vulnerability in brainstorming Visual Companion (`helper.js`) by replacing unsafe `innerHTML` usage with secure DOM APIs. Upgraded `path-to-regexp` to `8.4.2` to resolve a high-severity ReDoS vulnerability.
- **Dev Dependencies**: Bumped `esbuild` to `0.28.1`.

### v5.1.0
- **Inline Self-Review**: Replaced heavyweight subagent review loops (Spec Review, Plan Review) in `brainstorming` and `writing-plans` with lightweight inline self-review checklists, significantly improving efficiency by eliminating subagent overhead.
- **Git Worktree Redesign**: Rewrote `using-git-worktrees` and `finishing-a-development-branch` with a `detect-and-defer` mechanism, natively supporting AI editors' (like Claude Code) built-in worktree tools while safely falling back to git CLI commands.
- **Token Optimization**: Removed obsolete `Integration` sections from all skills, reducing prompt token footprints.
- **Consolidation**: Consolidated the independent `code-reviewer` agent directly into `requesting-code-review`.

### v4.3.2
- **Security**: Fixed XSS vulnerability in brainstorming Visual Companion
- **Docs**: Updated README and SECURITY with accurate version info

### v4.3.0
- Initial MCP server implementation
- 14 core skills migrated from original Superpowers

---

## 🙏 Acknowledgments

This project is a fork and adaptation of the original [Superpowers](https://github.com/obra/superpowers) project by [obra](https://github.com/obra). We are grateful for their work in defining the agentic skills framework and software development methodology that powers this MCP server.
