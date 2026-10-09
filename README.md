# Superpowers MCP Toolpack Usage Guide

[English](README.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Português (BR)](README.pt-BR.md) | [हिन्दी](README.hi.md)

[![Version](https://img.shields.io/badge/version-6.4.7-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

This document summarizes the information and usage instructions for packaging the Superpowers skills and autonomous workflow system into an independent, high-performance, and secure **Model Context Protocol (MCP)** server.

---

## 🚀 How to Install and Use

### Supported Environments & Harnesses

- **AI Code Editors & IDEs**: **Antigravity (AGY)**, **Cursor**, **VSCode** (GitHub Copilot), **VSCode Insiders** (GitHub Copilot), **Devin Desktop**, **Trae**, **Cline**, **Kilo Code**, **Qoder**, **Kiro**, **MiniMax Code Desktop** *(manual setup)*, **Codex**.
- **AI Desktop Applications & Harnesses**: **Claude Desktop**, **Pi Desktop**, **QwenPaw**, **Hermes Desktop**, **Kimi Work**, **Goose**, **OpenClaw**.
- **Local & Self-Hosted AI Platforms**: **AnythingLLM**, **LibreChat**.

### MCP Capabilities Provided

| Protocol Feature | Items / Count | Description |
| :--- | :--- | :--- |
| **Tools** | `list_skills`, `read_skill` | Discover, search, and load full skill instructions and checklists on demand. |
| **Prompts** | 9 Native Prompts | `session-start`, `feature-pipeline`, `structured-debug`, `skill-composition`, `sdd-implementer`, `sdd-task-reviewer`, `sdd-re-review`, `spec-reviewer`, `plan-reviewer` |
| **Resources** | 15 Skill URIs + 1 Guide | `skill://superpowers/<skill-name>` plus `guide://superpowers/skill-compositions` |

### Chatting with the AI Agent (Basic Usage)

Once installed or configured, your MCP client can discover the Superpowers tools, prompts, and resources. MCP prompts are user-invoked; select one from your client's MCP Prompts menu. Skill loading then depends on the agent following the selected prompt and calling `read_skill`.

**Basic Interaction Examples:**
- **Initialize Engineering Discipline:** "Apply `session-start` prompt" (Injects Superpowers rules & context)
- **Discover Available Skills:** "List all superpowers skills"
- **Load an Atomic Skill:** "Use `read_skill` to load the `brainstorming` skill and help me explore requirements"

---

## ⚡ Targeted One-Click Setup

To get up and running with Superpowers instantly without intrusive background modifications, use our **targeted, privacy-respecting** one-click setup tool.

> [!NOTE]
> **Run From Any Directory**: You do NOT need to clone this repository or navigate to a specific folder. You can execute these commands directly from **any directory** in your terminal. The installer automatically targets global configuration files rooted in your user home directory (`~`), instantly enabling Superpowers across all your workspaces.

ChatWise and Cherry Studio require manual import, see the [desktop import guide](docs/desktop-setup.md).

### 1. Choose Your AI Agent / Editor (Targeted One-Liner)

Select your client and run the corresponding command in your terminal:

| Harness / Client | Supported OS | One-Click Setup Command | Global Config Location |
| :--- | :--- | :--- | :--- |
| **LM Studio** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target lmstudio` | `~/.lmstudio/mcp.json` |
| **Roo Code (VS Code Desktop)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target roo` | `.../rooveterinaryinc.roo-cline/settings/mcp_settings.json` |
| **Antigravity (Google DeepMind)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target antigravity` | `~/.gemini/config/mcp_config.json` |
| **Pi Desktop / Pi Agent** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target pi-desktop` | `~/.pi/agent/mcp.json` |
| **Cursor** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target cursor` | `~/.cursor/mcp.json` |
| **GitHub Copilot (VS Code)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target copilot` | `Code/User/mcp.json` *(VS Code `servers` schema)* |
| **GitHub Copilot (VS Code Insiders)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target copilot-insiders` | `Code - Insiders/User/mcp.json` *(VS Code `servers` schema)* |
| **Hermes Desktop / Agent** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target hermes` | `~/.hermes/config.yaml` *(Win: `%LOCALAPPDATA%\hermes`)* |
| **Kimi Work / Kimi Code** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target kimi` | `~/.kimi-code/mcp.json` |
| **Claude Desktop** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target claude` | `Claude/claude_desktop_config.json` |
| **Devin Desktop (formerly Windsurf)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target devin` | `~/.config/devin/mcp_config.json` *(or `windsurf`)* |
| **QwenPaw (Personal Agent Workstation)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target qwenpaw` | `~/.qwenpaw/config.json` *(aliases: `copaw`)* |
| **Cline (VS Code / CLI)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target cline` | `.../saoudrizwan.claude-dev/settings/cline_mcp_settings.json` |
| **Kilo Code** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target kilo` | `~/.config/kilo/kilo.jsonc` *(native `mcp` schema)* |
| **Qoder** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target qoder` | `~/.qoder/settings.json` |
| **Kiro** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target kiro` | `~/.kiro/settings/mcp.json` |
| **Trae** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target trae` | `.../Trae/User/mcp.json` *(supports Trae CN)* |
| **Codex** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target codex` | `~/.codex/config.toml` *(TOML `[mcp_servers]`)* |
| **OpenClaw** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target openclaw` | `~/.openclaw/openclaw.json` *(JSON5 `mcp.servers`)* |
| **Goose** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target goose` | `~/.config/goose/config.yaml` *(Win: `%APPDATA%\Block\goose\config\config.yaml`)* |

*(If using Bun, append `--bun` for faster startup, e.g., `npx -y superpowers-mcp setup --target cursor --bun`)*

---

### 2. Setup via Curl or PowerShell

- **macOS / Linux (via Curl with explicit target):**
  ```bash
  curl -fsSL https://raw.githubusercontent.com/Poseidoncode/superpowers-mcp/main/scripts/install.sh | bash -s -- --target cursor
  ```

- **Windows (via PowerShell with explicit target):**
  ```powershell
  & ([scriptblock]::Create((irm https://raw.githubusercontent.com/Poseidoncode/superpowers-mcp/main/scripts/install.ps1))) -Target cursor
  ```

#### Advanced Flags:
- `--dry-run`: Preview changes without writing to disk.
- `--remove`: Safely remove Superpowers configuration from the targeted client.
- `--backup`: Create a timestamped `.bak` backup before modifying (Default: disabled, zero-pollution).
- `--bun`: Use `bunx` instead of `npx` in the generated configuration.
- `--target <name>`: Explicit target name (aliases supported, e.g. `code`, `vscode`, `kimi-code`).

---

## 🛠️ Manual MCP Configuration

If you prefer configuring manually, add the following settings to your IDE or MCP client (e.g., Cursor, Antigravity, VSCode, AnythingLLM, etc.).

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

## 🔄 Skill Compositions & Workflow Pipelines

For complex engineering tasks, use these **interactive workflow launchers**. They start an agent-guided process and pause at design, plan-review, and branch-finishing decisions; they do not execute server-side or run unattended. See the published [`Skill Compositions Guide`](docs/skill-compositions.md), also available as the MCP resource `guide://superpowers/skill-compositions`.

### 1. New Feature Development Pipeline
```
brainstorming ➔ writing-plans ➔ using-git-worktrees ➔ subagent-driven-development (TDD) ➔ verification-before-completion ➔ requesting-code-review ➔ finishing-a-development-branch
```
- **Start it:** Select `feature-pipeline` from your client's MCP Prompts menu and provide `feature_name` plus optional `requirements`.
- **Workflow:** Clarifies requirements (Spec) ➔ waits for design approval ➔ creates a reviewable plan ➔ waits for plan approval ➔ isolates a worktree ➔ implements with SDD or the inline fallback and TDD ➔ verifies ➔ reviews ➔ asks how to finish the branch.
- **Fallback:** If the host has no multi-agent tools, the workflow uses `executing-plans` instead of claiming to dispatch subagents.

### 2. Structured Troubleshooting Pipeline
```
systematic-debugging ➔ using-git-worktrees ➔ dispatching-parallel-agents ➔ test-driven-development ➔ verification-before-completion ➔ requesting-code-review ➔ finishing-a-development-branch
```
- **Start it:** Select `structured-debug` from your client's MCP Prompts menu and provide the issue or failing tests.
- **Workflow:** Hypothesizes root causes ➔ Isolates worktrees for parallel agents ➔ Authors failing reproduction tests ➔ Applies targeted fix ➔ Confirms zero regressions ➔ Reviews fix ➔ Finishes branch.

### 3. Dynamic Workflow Guide
- **Start it:** Select `skill-composition` to get a recommended workflow for refactoring, migration, or a legacy codebase. These scenarios do not currently have dedicated launcher prompts.
- **Workflow:** Dynamically recommends the optimal multi-skill composition for large refactors, migration safety nets, or onboarding:
  - **Large Refactoring & Migration:** `brainstorming` ➔ `writing-plans (skeleton-first)` ➔ `using-git-worktrees` ➔ `subagent-driven-development` ➔ `verification-before-completion` ➔ `requesting-code-review` ➔ `finishing-a-development-branch`
  - **Legacy Codebase Safety Net:** `brainstorming` ➔ `writing-plans` ➔ `test-driven-development (characterization)` ➔ `systematic-debugging` ➔ `verification-before-completion`


---

## 📋 Supported Skills Overview (15 Core Skills & Scenarios)

To help you choose the right skill, we have structured all 15 skills across the Software Development Lifecycle (SDLC), merging core capabilities and community-recommended scenarios:

| # | SDLC Phase | Skill Name | What It Does (Purpose & Core Value) | Recommended Scenario |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **🚀 Planning & Design** | **`brainstorming`** | **Requirements & Architecture Design**: Explores options and constraints before coding; outputs Design Specs; includes Visual Companion browser UI review. | Before starting any new feature or major change; prevents jumping straight into code. |
| 2 | **🚀 Planning & Design** | **`writing-plans`** | **Implementation Planning**: Decomposes specs into bite-sized, testable tasks annotated with Recommended Skills and exact file references. | Before multi-file refactoring, complex migrations, or major implementations. |
| 3 | **💻 Implementation** | **`executing-plans`** | **In-Session Plan Execution**: Executes every planned task step-by-step in the current session, then one whole-branch review at the end. | Batch execution of plans within the same session without spawning subagents. |
| 4 | **💻 Implementation** | **`subagent-driven-development`** | **Subagent-Driven Development (SDD)**: Dispatches fresh, context-isolated subagents per task with dual-layer adversarial reviews. | Recommended execution model for complex plans to eliminate context pollution. |
| 5 | **💻 Implementation** | **`test-driven-development`** | **Test-Driven Development (TDD)**: Enforces strict Red ➔ Green ➔ Refactor cycles ensuring robust test coverage. | When implementing logically challenging features or critical algorithms. |
| 6 | **🔍 Debugging** | **`systematic-debugging`** | **Systematic Root Cause Debugging**: Deconstructs complex errors into testable hypotheses with validation experiments. | When encountering any unexpected error, test failure, or intermittent bug. |
| 7 | **🛡️ Quality & Review** | **`verification-before-completion`** | **Evidence-Based Verification**: Mandates running the full repository test suite, linter, and type checks. | Before claiming "it works" or "it is done"; provides tangible proof of completion. |
| 8 | **🛡️ Quality & Review** | **`requesting-code-review`** | **Initiating Code Reviews**: Packages diffs and reports for multi-dimensional architectural and quality reviews. | Before merging branches or finalizing tasks to ensure architectural integrity. |
| 9 | **🛡️ Quality & Review** | **`receiving-code-review`** | **Processing Review Feedback**: Systematically evaluates review feedback, applies fixes, and records rulings. | When addressing review findings systematically without losing context. |
| 10 | **🛡️ Quality & Review** | **`finishing-a-development-branch`** | **Branch Integration & Cleanup**: Manages PR/merge, cleans up Git worktrees, and deletes temporary branches cleanly. | After all verifications pass to cleanly integrate the feature into the main branch. |
| 11 | **🌿 Version Control** | **`using-git-worktrees`** | **Physical Git Isolation**: Creates isolated worktree directories for features or debugging to prevent race conditions. | When working on concurrent tasks or running parallel multi-agent investigations. |
| 12 | **🤖 Advanced Agents** | **`dispatching-parallel-agents`** | **Parallel Agent Orchestration**: Dispatches concurrent subagents in isolated workspaces to investigate multiple hypotheses simultaneously. | When facing multiple failing tests or investigating independent theories in parallel. |
| 13 | **🤖 Advanced Agents** | **`using-superpowers`** | **Superpowers Foundation & Discipline**: Establishes mandatory skill discovery, loading discipline, and priority rules. | Automatically loaded at session start to enforce software engineering standards. |
| 14 | **🤖 Advanced Agents** | **`writing-skills`** | **Skill Authoring & Maintenance**: Guides the creation, testing, and packaging of new Superpowers skills. | When creating custom skills or enhancing existing skill instructions. |
| 15 | **🤖 Advanced Agents** | **`diagnosing-superpowers`** | **Session Forensics & Maintainer Reports**: Reconstructs what went wrong in a session from on-disk transcripts with cited evidence; drafts scrubbed bundles and GitHub issues. | When a session went sideways and you need evidence of why, or a bug report for the Superpowers maintainers. |

## 🆕 Recent Updates

### v6.4.7 (Latest)

- **Full project security scan (2026-10-09)**: `src/*.ts`, the brainstorming companion server, `scripts/`, `esbuild.js`, npm packaging and lockfile integrity, secret/permission hygiene, and every automated suite. Baseline controls re-verified clean — 0 `eval` / `new Function` / `innerHTML` / `document.write` / `shell: true` in shipped source, `child_process` argv-only, 0 hardcoded secrets, 0 world-writable tracked files (details in [SECURITY.md](SECURITY.md)).
- **`--remove` could report success while a live MCP entry survived** (CWE-459, reproduced by execution): TOML keeps all but the last `[[mcp_servers.superpowers]]` array table and orphans `[[mcp_servers.superpowers.env]]`; JSON clears only the first root key holding a `superpowers` entry; YAML removal is a no-op on a populated flow map `superpowers: {…}`. A caller-chosen `command` therefore keeps auto-launching after an uninstall that reported success.
- **YAML `--remove` could delete another parent's `superpowers` block** (CWE-459): the new root-level guard covers the empty-map rewrite but not the entry deletion, so a nested `mcp_servers:` under a different top-level key lost its `superpowers` subtree — including user keys such as `env`.
- **`SKILLS_PATH` containment is a blocklist, not an allowlist** (CWE-22, pre-existing): `~/.ssh`, `~/.config/gh` and `/Users/Shared` are accepted because they exist, while `~/.aws` is rejected only for non-existence. On **Linux** the documented `SKILLS_PATH=$(mktemp -d)` flow resolves to world-writable `/tmp`, so a local user on a shared host can plant skill content the agent then treats as trusted instructions.
- **`[MODEL]` is no longer dropped for `sdd-task-reviewer` / `sdd-re-review`** (found by this scan, fixed here): both templates spelled that slot `model: [MODEL — REQUIRED: …]`, which carries no literal token, so the caller's `model` value reached the rendered prompt **zero** times and the new diagnostic could not see it. Both now use `model: [MODEL]` plus a `#` comment, matching `implementer-prompt.md`, and are pinned by two fail-without / pass-with assertions.
- **Packaging hardening targets**: `npm pack` does not rebuild (`prepublishOnly` is publish-only and `out/` is gitignored, so a packed tarball ships on-disk `out/*.js` unreviewed — the build belongs in `prepack`); and `files: ["scripts"]` ships the installer, which prefers a co-located `setup.js`.
- Verification: `npm test` green **10/10 suites**, PowerShell suite **128/128**, `npx tsc --noEmit` clean, `npm run build` ok, `npm audit` **0** vulnerabilities, `npm run drift` 0 (regression floor re-measured at **396 assertions**: Node.js 236 + Bash 32 + PowerShell 128).

### v6.4.6

- **Full security scan (2026-10-06)**: no new findings across `src/*.ts`, the brainstorming companion server, `scripts/`, and the build pipeline — 0 `eval` / `new Function` / `innerHTML` / `shell: true` in shipped code, argv-only child processes, `crypto.randomBytes` temp nonces, 0 hardcoded secrets, 0 world-writable files (details in [SECURITY.md](SECURITY.md)).
- **Dependency advisories remediated (`npm audit` 2 → 0)**: GHSA-6qxp-vccf-f47h (high, MCP SDK OAuth credential leak) fixed by raising `@modelcontextprotocol/sdk` to `^1.32.1`; GHSA-jqcg-44mw-7w3h (critical, `proxy-addr` IP spoofing via `express`) fixed with a new `overrides.proxy-addr ^2.0.8` floor. Both are build-time-only and unreachable from the stdio-only shipped bundle.
- **Post-v6.4.5 fixes now on record**: brainstorming frame injection preserves literal `$` tokens via function replacers; single-flight skill scans, quoted YAML root-key handling with empty-map emission and CRLF preservation, and placeholder-key prompt append guards.
- Verification: `npm test` green (regression floor **409 assertions**: setup 78/78, edge-cases 12/12, brainstorming 35/35, prompts 18/18), `tsc` clean, `npm audit` 0 vulnerabilities.

### v6.4.5

- **Upstream sync to `obra/superpowers@8ca22db` (upstream v6.4.2, 2026-09-25, PR #2384 "leaner plans")**: `writing-plans` now records the decisions an implementer needs (signatures, test assertions, spec values) instead of transcribing code — new spec-first plan header with an explicit `Spec:` path, new `## What a Step Contains` step template, `## Bite-Sized Task Granularity` renamed `## Step Granularity`, and a seven-check `## Self-Review`.
- **Fork content preserved through the three-way merge**: the fork-only `## Two Plan Shapes` section and `skeleton-first-plans.md` survive intact; `plan-document-reviewer-prompt.md` stays in the fork because `src/server.ts` renders it as the `plan-reviewer` MCP prompt.
- **Drift baseline re-recorded** at `8ca22db` (74/74 upstream skill files, `npm run drift` clean); new regression `Test 19 (v6.4.2)` in `tests/upstream_sync_test.js`.
- **Docs & scan hygiene**: the README skill matrix and `docs/skill-compositions.*` examples now match the current `writing-plans` template (exact file references, not the long-removed "file contracts"); `npm run drift` ignores OS junk (`.DS_Store`) instead of listing it as a fork-only file.

### v6.4.4

- **CodeQL remediation & security patch (2026-09-28)**:
  - Code scanning is now **0 open / 7 fixed**: closed the 3 alerts reported against v6.4.3 in `src/setup-runner.ts` (details in [SECURITY.md](SECURITY.md)).
  - **TOML ReDoS fix**: quoted-table detection regexes replaced with linear scanners — adversarial config lines no longer cause polynomial backtracking; fail-closed behavior unchanged.
  - **Prototype-pollution guard**: nested JSON `serverPath` segments (used by the `openclaw` target) now reject `__proto__` / `constructor` / `prototype` and non-identifier keys before any write.
  - No behavior change for valid configs; verification: `npm test` green (regression floor **389/389**), `tsc` clean, `npm audit` 0 vulnerabilities.

### v6.4.3

- **Codex target & docs cleanup (2026-09-28)**:
  - New `codex` one-click target: `setup --target codex` writes `~/.codex/config.toml` (`[mcp_servers.superpowers]`) via zero-dependency TOML merge; supports `--dry-run` / `--backup` / `--bun` / `--remove`.
  - New `openclaw` / `goose` targets: `setup --target openclaw` writes `~/.openclaw/openclaw.json` (`mcp.servers`); `setup --target goose` writes the `extensions` block of goose's `config.yaml` (user's `enabled`/`timeout`/`envs` preserved).
  - Removed the redundant Transparency & Zero-Pollution TIP from the setup section (duplicated the targeted-setup heading); safety details remain in Advanced Flags and SECURITY.md.
  - `docs/desktop-setup.md` is now the English-only import guide for ChatWise and Cherry Studio (`setup --print-config`); LM Studio / Roo Code stay on the one-click table. Dropped the stale "unreleased CLI options" wording (`lmstudio`, `roo`, `--print-config` shipped in v6.3.9).
  - Released the 7-language README nav (new ES / PT-BR / HI READMEs), ES / PT-BR / HI skill-composition guides, and the CJK bold-delimiter fix.
  - MiniMax Code Desktop is marked *(manual setup)* (config path unverified).
  - Verification: `npm test` green, regression floor now **389/389** (+17 setup-target cases), `npm audit` 0 vulnerabilities.

### v6.4.2

- **v6.4.2 security audit & code review (2026-09-24)**: closed the audit findings across the MCP server, setup scripts, build pipeline, and test harness (details in [SECURITY.md](SECURITY.md)).
  - **Traversal & error hygiene**: skill names are decoded *before* allowlist validation, so double-encoded `..%2f` / `%2e%2e` payloads are rejected with `InvalidParams`; unknown tools and prompts now return actionable `InvalidParams` errors instead of `MethodNotFound`.
  - **TOCTOU & destructive-path defense**: canonical paths are re-verified after symlink checks, cache cleanup is gated by the copy manifest (fork-specific skills can never be deleted), and drift/coverage records are written atomically via temp file + rename.
  - **Fail-soft sync & always-executable builds**: the four esbuild targets build concurrently, watch-mode output is chmod-ed executable on every rebuild, and missing upstream sources exit cleanly instead of raising false drift.
  - **Honest test harness**: a ref'd watchdog plus server `exit`/`close` handlers end silent hangs, drift tests run behind a network guard, and privilege-limited skips can no longer count as passes — regression floor holds at **365/365** assertions.

### v6.4.1

- **Upstream Sync to obra/superpowers v6.4.1**:
  - **Native inline plan execution**: rewritten `executing-plans` runs the whole plan via new `task-start` / `task-done` helpers, then one whole-branch review — no mid-plan check-ins.
  - **New skill: `diagnosing-superpowers`**: session forensics from on-disk transcripts with cited evidence, plus scrubbed bundles and GitHub issue drafts (15 skills total).
  - **Review behavior**: grade unspecified behavior by reasonable-user expectation, `Declined to judge` list, `BASE_SHA` via `git merge-base origin/main HEAD`.
  - **Plan Review Focus**: new template section and self-review item pinning spec-implied edge cases to owning tasks.
  - **New harness refs**: Muse and Claude Code tool mappings; Devin/OpenCode refs retained.
  - Scripts invoked through their interpreter (`bash` / `node`) so marketplace packaging can't break them.
- **Windows Parity & Regression Floor**:
  - New `task-start.ps1` / `task-done.ps1` ports with sh/ps1 symmetry test suites.
  - All adopted-PR durability content retained (Discoveries ledger, review-file contract, greenfield scripts, remote-safety); drift baseline re-recorded with zero drift.
- **Comprehensive Security Audit & Automated Regression Floor** ([`SECURITY.md`](SECURITY.md)):
  - 100% verified across **365 automated test assertions** (Node.js 170, Bash 67, PowerShell 128), 0 vulnerabilities, 0 hardcoded secrets.
  - Inline `task-done` runs operator-chosen tests as argv (`"$@"` / `& $exe @rest`), not a shell; ledger text is display-only.
  - `diagnosing-superpowers` is local-read and export-gated; redaction is best-effort — review every file before sharing.
  - Deferred-findings export now includes `Final: minor (deferred):` without matching completion-line parked counts.
  - Local Devin config (`.devin/`) is gitignored.

### v6.3.10

- **Universal Setup Key Conflict Resolution & Lossless Field Preservation**:
  - Automatically discovers existing declarations across recognized server keys (`servers`, `mcp`, `mcpServers`), preventing duplicate conflicting configurations.
  - Safely merges and preserves user-authored configuration fields (`env`, `cwd`, `disabled`, `alwaysAllow`, `args`) on re-installation.
  - Eliminates contradictory states between opposing flags (`disabled: true` vs `enabled: true`).
  - Rejects unknown flags and unexpected positional CLI arguments with exit code 1; standardizes on `process.exitCode` for non-truncating output over Unix pipes.
- **Skills Core Engine Fast-Path Cache Stat Verification & Scan Epoch Shielding**:
  - Implements fast-path single-stat verification (`dev`, `ino`, `size`, `mtimeMs`) on cached skill paths, immediately invalidating stale cache if symlinks redirect without rescanning the whole tree.
  - Advancing monotonic `scanEpoch` and resetting `loadingEpoch` on `clearCache()` prevents pending async directory scans from repopulating flushed caches.
  - Authoritative open file descriptor verification (`readFileNoFollow`) prevents TOCTOU descriptor swaps.
- **MCP Prompt Template Robustness & Deduplication**:
  - Halts with `McpError(ErrorCode.InternalError)` and structured stderr diagnostic when prompt template files are missing or empty.
  - Tracks applied template substitutions via `appliedInterpolations`, preventing redundant argument appending.
- **Comprehensive Security Audit & Automated Regression Floor**:
  - 100% verified across **292 automated test assertions** (Node.js 163, Bash 35, PowerShell 94), 0 vulnerabilities, 0 hardcoded secrets.

### v6.3.9

- **Permanent ReDoS Defense (CodeQL Alert #4 Resolved)**:
  - Replaced ambiguous regex backtracking in YAML parsing (`updateYamlConfig`) with unambiguous prefix key matching and native `String.prototype.trim()`.
  - Added `extractInlineComment` linear scan ($O(N)$), preventing polynomial backtracking on inputs padded with long whitespace runs. Formally closed CodeQL Alert #4 (`js/polynomial-redos`).
  - Added regression test suite in `tests/setup_test.js` validating linear processing (<1ms) against 60,000 whitespace characters.
- **Client Setup Expansion (17 Supported AI Agent Clients)**:
  - Added setup targets for **LM Studio** (`lmstudio`, `~/.lmstudio/mcp.json`) and **Roo Code** in VS Code Desktop (`roo`, `rooveterinaryinc.roo-cline/settings/mcp_settings.json`) across macOS, Windows, and Linux.
  - Enhanced YAML configuration parser to preserve inline comments on `mcp_servers:` and `superpowers:`.
- **Desktop Import Tooling & Delegation Exit Code Integrity**:
  - Added `setup --print-config` (optional `--bun`) to output clean MCP JSON for desktop client import (ChatWise, Cherry Studio, etc.) without writing files.
  - Hardened `src/server.ts` setup delegation to preserve `process.exitCode` from CLI commands.
- **Desktop Setup Guide**:
  - Added comprehensive [`docs/desktop-setup.md`](docs/desktop-setup.md) covering LM Studio, Roo Code, ChatWise, and Cherry Studio setup.

👉 *For the complete release history, see [CHANGELOG.md](CHANGELOG.md).*

---

## 🙏 Acknowledgments

This project is a fork and adaptation of the original [Superpowers](https://github.com/obra/superpowers) project by [obra](https://github.com/obra). We are grateful for their pioneering work in defining the agentic skills framework and software development methodology that powers this MCP server.
