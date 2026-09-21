# Superpowers MCP Toolpack Usage Guide

[English](README.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

[![Version](https://img.shields.io/badge/version-6.3.10-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
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

Desktop quick setup: [LM Studio, Roo Code, ChatWise and Cherry Studio](docs/desktop-setup.md). New CLI options below are unreleased; use the local commands in the guide until the next npm release.

> [!TIP]
> **Transparency & Zero-Pollution Principle**: Superpowers will NEVER silently scan or bulk-modify unselected editors like adware. You explicitly choose the client you use, ensuring 100% transparent and safe modification via **atomic write swap** (zero crash risk, **zero disk pollution by default** without dumping `.bak` files, zero impact on your existing MCP servers).

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
| 2 | **🚀 Planning & Design** | **`writing-plans`** | **Implementation Planning**: Decomposes specs into bite-sized, testable tasks annotated with Recommended Skills and file contracts. | Before multi-file refactoring, complex migrations, or major implementations. |
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

### v6.4.1 (Latest)

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
