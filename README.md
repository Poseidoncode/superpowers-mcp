# Superpowers MCP Toolpack Usage Guide

[English](README.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

[![Version](https://img.shields.io/badge/version-6.3.8-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

This document summarizes the information and usage instructions for packaging the Superpowers skills and autonomous workflow system into an independent, high-performance, and secure **Model Context Protocol (MCP)** server.

---

## 🚀 How to Install and Use

### Supported Environments & Harnesses

- **AI Code Editors & IDEs**: **Antigravity (AGY)**, **Cursor**, **VSCode** (GitHub Copilot), **VSCode Insiders** (GitHub Copilot), **Devin Desktop**, **Trae**, **Cline**, **Kilo Code**, **Qoder**, **Kiro**, **MiniMax Code Desktop**, **Codex**.
- **AI Desktop Applications & Harnesses**: **Claude Desktop**, **Pi Desktop**, **QwenPaw**, **Hermes Desktop**, **Kimi Work**.
- **Local & Self-Hosted AI Platforms**: **AnythingLLM**, **LibreChat**.

### MCP Capabilities Provided

| Protocol Feature | Items / Count | Description |
| :--- | :--- | :--- |
| **Tools** | `list_skills`, `read_skill` | Discover, search, and load full skill instructions and checklists on demand. |
| **Prompts** | 9 Native Prompts | `session-start`, `feature-pipeline`, `structured-debug`, `skill-composition`, `sdd-implementer`, `sdd-task-reviewer`, `sdd-re-review`, `spec-reviewer`, `plan-reviewer` |
| **Resources** | 14 Skill URIs + 1 Guide | `skill://superpowers/<skill-name>` plus `guide://superpowers/skill-compositions` |

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

> [!TIP]
> **Transparency & Zero-Pollution Principle**: Superpowers will NEVER silently scan or bulk-modify unselected editors like adware. You explicitly choose the client you use, ensuring 100% transparent and safe modification via **atomic write swap** (zero crash risk, **zero disk pollution by default** without dumping `.bak` files, zero impact on your existing MCP servers).

### 1. Choose Your AI Agent / Editor (Targeted One-Liner)

Select your client and run the corresponding command in your terminal:

| Harness / Client | Supported OS | One-Click Setup Command | Global Config Location |
| :--- | :--- | :--- | :--- |
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

## 📋 Supported Skills Overview (14 Core Skills & Scenarios)

To help you choose the right skill, we have structured all 14 skills across the Software Development Lifecycle (SDLC), merging core capabilities and community-recommended scenarios:

| # | SDLC Phase | Skill Name | What It Does (Purpose & Core Value) | Recommended Scenario |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **🚀 Planning & Design** | **`brainstorming`** | **Requirements & Architecture Design**: Explores options and constraints before coding; outputs Design Specs; includes Visual Companion browser UI review. | Before starting any new feature or major change; prevents jumping straight into code. |
| 2 | **🚀 Planning & Design** | **`writing-plans`** | **Implementation Planning**: Decomposes specs into bite-sized, testable tasks annotated with Recommended Skills and file contracts. | Before multi-file refactoring, complex migrations, or major implementations. |
| 3 | **💻 Implementation** | **`executing-plans`** | **In-Session Plan Execution**: Executes planned tasks step-by-step with checkpoint reviews in the current session. | Batch execution of plans within the same session without spawning subagents. |
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

## 🆕 Recent Updates

### v6.3.8 (Latest)

- **Actionable Interactive Workflow Launchers**:
  - `feature-pipeline` and `structured-debug` now emit explicit stage-by-stage `read_skill` calls, preserve required user approval gates, and clearly state that execution happens through the client agent rather than inside the MCP server.
  - Hosts with multi-agent support can use subagent execution; other hosts fall back to inline or sequential execution without claiming unavailable capabilities.
  - `read_skill` accepts both bare skill names and the documented `superpowers:` prefix.
  - The composition guide is included in the npm package and available through `guide://superpowers/skill-compositions`.
- **Universal Global Setup Concurrency & Symlink Breakout Defense**:
  - **Allowed Roots Boundary Containment**: Enforces destination restriction to explicit allowed user roots (`homeDir`, `appData`, `localAppData`), blocking parent-directory symlink breakout attacks.
  - **Optimistic Concurrency Conflict Defense**: Compares file content against `expectedContent` immediately prior to atomic `fs.renameSync`, preventing race conditions from silently overwriting newer configurations.
  - **Directory Inode & Device TOCTOU Verification**: Re-checks parent directory canonical path, device ID (`dev`), and inode (`ino`) before and after temporary file creation, blocking directory swap attacks.
  - **Fail-Closed Validation**: Rejects non-object JSON roots or server fields and duplicate YAML keys.
- **Skills Core Engine Collision Defense & Dynamic Cache Revalidation**:
  - **Deterministic Directory Cataloging**: Catalogs directories in deterministic alphabetical order and detects alias/name collisions in `newSkillMap`, emitting diagnostic warnings and skipping duplicates.
  - **Automatic Cache Revalidation (`CACHE_REVALIDATE_MS = 1000`)**: Detects disk modifications within 1 second without requiring MCP server restarts.
  - **Canonical Path Blacklisting**: Platform case-folding and `fs.realpathSync` validation to prevent symlink bypass of system directories (`/private/etc`, `/private/var`, `C:\Windows`).
- **RFC 6455 WebSocket Protocol & Resilient Stream Hardening**:
  - Support for fragmented text messages (`CONTINUATION` opcode `0x00`) with payload size tracking and RFC 6455 control frame constraints (`opcode >= 0x8 && !fin` rejected).
  - Resilient tail event log compaction: Preserves recent newline-delimited event records when approaching the 1 MB file cap rather than dropping all historical events.
  - Event log append mode hardened with `O_RDWR | O_APPEND | O_CREAT | O_NOFOLLOW`.
- **Shell & PowerShell Script Hardening**:
  - `find-polluter.sh` & `find-polluter.ps1`: Caller-supplied test command with safe array expansion (`"${TEST_COMMAND[@]}"`, `& $testCommand @testCommandArgs`) and space-safe while loop, preventing shell command injection.
  - `sdd-workspace`: Sanitizes `CDPATH=''` before all `cd` operations, neutralizing directory redirection attacks.
  - `sdd-workspace.ps1`: Lossless Unicode plan marker persistence using UTF-8 without BOM (`[System.Text.UTF8Encoding]::new($false)`).
- **Automated Regression Verification Floor**:
  - Expanded test suite to **274 automated test assertions** across Node.js (145), Bash (35), and PowerShell (94) with a 100% pass rate.

### v6.3.7

- **Upstream Sync — Batches 1–3 (obra/superpowers)**:
  - **Automatic Skill Routing**: `systematic-debugging` and `test-driven-development` descriptions now name their typed trigger phrases (`"tdd"`, `"systematic debug"`, …) and cross-route to the sibling skill, improving skill selection inside MCP clients.
  - **Evidence Without a Test Command**: `verification-before-completion` gains the "When There Is No Test Command" section — for reports, research, audits, and correspondence, re-open the artifact, prove what can be proven, and account for every part of the request while claiming *complete*, never *right*.
  - **Brainstorming Intent Gates**: new "Establish Shared Understanding" step (discover intent, write back your understanding, carry it into the design) plus a rewritten HARD-GATE that lists each path's prerequisites and refuses to treat one approval as permission to skip the rest.
  - **Planning-Handoff Review**: brainstorming's spec self-review becomes a scored handoff review (0.0–9.9 readiness, burden ledger, one bounded improvement pass, read-only reassessment) with a fail-safe restore rule.
  - **Saved-Plan Review & Contextual Handoff**: `writing-plans` now requires the human to review the saved plan before execution and, when no method was supplied, a plan-specific execution recommendation instead of a hardcoded default.
  - **Plan Checkbox Bookkeeping**: `executing-plans` and `subagent-driven-development` tick the plan file's steps in the same message as the completion bookkeeping.
  - **Remote-Safety Boundary**: `using-git-worktrees` requires `--no-track` plus a `git branch -vv` tracking check (`--unset-upstream` before the first commit); `executing-plans` keeps commits local and forbids rewriting shared branches; implementers report any mid-task push demand as BLOCKED instead of pushing.
  - **Discoveries Ledger**: SDD's progress ledger gains a `## Discoveries` section so cross-task findings survive compaction and feed the next dispatch's interface clauses.
  - **Deferred Findings Export**: before a plan workspace is deleted, `Ruling:` / `minor (deferred)` / `parked` lines are exported to a PR "Deferred items" checklist or a committed `docs/superpowers/follow-ups/<plan>.md`.
  - **Greenfield SDD Scripts**: `sdd-workspace` falls back to the current directory before a repo exists (matching `.ps1` behavior), while `review-package` refuses actionably outside a repo.
  - **TDD Characterization Guard**: a five-step procedure for behavior-preserving refactors — mutate, verify failure, restore via VCS, stay green — referenced from the boundary and mutation-check sections.
- **Upstream Content Sync — Batch 4**: the brainstorm start script takes its hosts from `BRAINSTORM_HOST`/`BRAINSTORM_URL_HOST` (`--host`/`--url-host` still win), `writing-skills` gained moved-content link re-resolution, and SDD reviewers now write their full report to `…/task-N-review.md` and return under 15 lines — exposed over MCP as the new `review_file` argument (replaced by the derived `-review.md` sibling when the requested path normalises to the report or brief file), plus the `fix_base_sha` alias that finally feeds `[FIX_BASE_SHA]`.
- **Upstream Drift Report**: `npm run drift` compares the committed upstream baseline against `obra/superpowers` and lists adopted files that moved, imports missing locally, and fork-only additions; `npm run drift:record -- --ignore <skill>` refreshes it after a reviewed sync and refuses truncated API trees before writing.
- **MCP Surface Coverage Test**: every skill on disk must be an exposed MCP resource serving its own content, and the prompt inventory must match all four READMEs exactly.
- **MCP Description Fidelity**: upstream's escaped-quote descriptions were adapted to unquoted YAML plain scalars so the `SkillsManager` parser never emits literal backslashes over MCP.
- **Regression Guards**: `tests/upstream_sync_test.js` now carries 22 labeled checks covering Batches 1–4; full suite green (139 npm checkmarks across 8 suites, 90 PowerShell assertions, 16 SDD + 11 host-default + 8 render-graph bash assertions).
- **Release-Readiness Hardening**: Bash and PowerShell brainstorm host tests explicitly force background mode, so the full 264-assertion matrix also completes under `CODEX_CI=1`; `package-lock.json` now matches v6.3.7 and Node `>=18`; npm repository and CLI `bin` metadata are normalized and verified through `npm publish --dry-run` plus a packed-install smoke test.

### v6.3.6

- **Extreme Performance Optimization (2x~8.1x Speedup)**:
  - **Parallel Skill Discovery**: Upgraded `SkillsManager.listSkills` to concurrent asynchronous directory traversal (`Promise.all`) combined with pre-resolved root path caching, cutting cold-start skill indexing latency from 4.79ms to 2.35ms (**2.04x speedup**).
  - **High-Velocity In-Memory Canonical Caching**: Introduced canonical realpath-keyed caching with aliasing for `readSkillContent`, dropping repeated skill reads from 0.013ms to 1.6µs (**8.1x speedup**).
  - **Frontmatter Slicing & ReDoS Defense**: Replaced full-document regular expression scans in `parseFrontmatter` with targeted 64 KB prefix buffer slices, eliminating GC pauses and quadratic ReDoS risks on large skill files.
  - **JSON Parsing Fast-Path**: Implemented native JSON trial in `stripJsonComments` (`src/setup-runner.ts`), accelerating non-commented JSON configuration reads to 0.55µs (**5.1x speedup**).
  - **Parallel Multi-Target Bundler**: Replaced sequential builds in `esbuild.js` with `Promise.all` across 4 build targets, reducing build time to ~50ms (**~42% speedup**).
- **Dual-Subagent Code Review & Comprehensive Quality Hardening (FIX ALL)**:
  - **Partial-Read Buffer Truncation Defense**: Implemented an accumulator loop (`while (totalRead < fileSize)`) in `SkillsManager.readFileNoFollow`, ensuring full buffer delivery under high disk concurrency and slow storage systems.
  - **Scan Epoch Concurrency Shield**: Added a monotonic `scanEpoch` counter in `listSkills` to prevent out-of-order asynchronous reloads from clobbering updated skill catalogs.
  - **Canonical Path Cache Invalidation**: Unified cache indexing on physical canonical paths (`realFilePath`) and linked aliases in `canonicalPathMap`, completely eliminating symlink cache drift during force reloads.
  - **System Blacklist Expansion**: Added macOS `/private/etc` and `/private/var` into `getSafeSkillsPath`, guarding against privilege directory pointer attacks.
  - **Symlink Target Defense in Configuration Writes**: `safeWriteConfig` verifies `fs.lstat` and realpaths before writes, blocking symlinks pointing to sensitive system locations.
  - **Strict TypeScript & Rule 7 Zero-Defect Compliance**: Cleaned up unused dead code (`exists`), enforced clean compilation under `--noUnusedLocals --noUnusedParameters`, and eliminated all unhandled or untyped empty catch blocks.
- **Automated Regression Suite Expansion**:
  - All 85 core unit/integration tests and 174 regression assertions passing at 100% across all suites (`edge_cases_test.js`, `run_test.js`, `brainstorm_server_test.js`, `prompts_compositions_test.js`, and `setup_test.js` with 33 passed tests). Refreshed [`SECURITY.md`](SECURITY.md), [`tests/code_review_report.md`](tests/code_review_report.md), and [`tests/performance_optimization_report.md`](tests/performance_optimization_report.md).
- **Multilingual Documentation Alignment**:
  - Synchronized supported harness directories, performance metrics, and one-click commands across all 4 localized READMEs ([`README.md`](README.md), [`README.zh-TW.md`](README.zh-TW.md), [`README.ja.md`](README.ja.md), [`README.ko.md`](README.ko.md)).

👉 *For the complete release history, see [CHANGELOG.md](CHANGELOG.md).*

---

## 🙏 Acknowledgments

This project is a fork and adaptation of the original [Superpowers](https://github.com/obra/superpowers) project by [obra](https://github.com/obra). We are grateful for their pioneering work in defining the agentic skills framework and software development methodology that powers this MCP server.
