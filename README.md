# Superpowers MCP Toolpack Usage Guide

[English](README.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

[![Version](https://img.shields.io/badge/version-6.3.4-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

This document summarizes the information and usage instructions for packaging the Superpowers skills and autonomous workflow system into an independent, high-performance, and secure **Model Context Protocol (MCP)** server.

---

## 🚀 How to Install and Use

### Supported Environments & Harnesses

- **AI Code Editors & IDEs**: **Antigravity (AGY)**, **Cursor**, **VSCode** (GitHub Copilot), **Devin Desktop**, **MiniMax Code Desktop**, **Codex**.
- **AI Desktop Applications & Harnesses**: **Hermes Desktop**, **Kimi Work**.
- **Local & Self-Hosted AI Platforms**: **AnythingLLM**, **LibreChat**.

### MCP Capabilities Provided

| Protocol Feature | Items / Count | Description |
| :--- | :--- | :--- |
| **Tools** | `list_skills`, `read_skill` | Discover, search, and load full skill instructions and checklists on demand. |
| **Prompts** | 9 Native Prompts | `session-start`, `feature-pipeline`, `structured-debug`, `skill-composition`, `sdd-implementer`, `sdd-task-reviewer`, `sdd-re-review`, `spec-reviewer`, `plan-reviewer` |
| **Resources** | 14 Direct Skill URIs | `skill://superpowers/<skill-name>` (Standard direct URI access) |

### Chatting with the AI Agent (Basic Usage)

Once installed or configured, your AI Agent will automatically discover and invoke `Superpowers Skills` and `Prompts`.

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
| **Hermes Desktop / Agent** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target hermes` | `~/.hermes/config.yaml` *(Win: `%LOCALAPPDATA%\hermes`)* |
| **Kimi Work / Kimi Code** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target kimi` | `~/.kimi-code/mcp.json` |
| **Claude Desktop** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target claude` | `Claude/claude_desktop_config.json` |
| **Devin Desktop (formerly Windsurf)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target devin` | `~/.config/devin/mcp_config.json` *(or `windsurf`)* |

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

For complex, multi-step engineering tasks, use these **one-click end-to-end pipelines** where the AI guides you step-by-step (see detailed guide: [`docs/skill-compositions.md`](docs/skill-compositions.md)):

### 1. New Feature Development Pipeline
```
brainstorming ➔ writing-plans ➔ using-git-worktrees ➔ subagent-driven-development (TDD) ➔ verification-before-completion ➔ requesting-code-review ➔ finishing-a-development-branch
```
- **One-Click Command:** "Please apply `feature-pipeline` to build [Feature Name]"
- **Workflow:** Clarifies requirements (Spec) ➔ Decomposes plan ➔ Isolates worktree ➔ Implements via fresh subagents & TDD ➔ Runs full test suite ➔ Conducts code review ➔ Finishes branch.

### 2. Structured Troubleshooting Pipeline
```
systematic-debugging ➔ using-git-worktrees ➔ dispatching-parallel-agents ➔ test-driven-development ➔ verification-before-completion ➔ requesting-code-review ➔ finishing-a-development-branch
```
- **One-Click Command:** "Please apply `structured-debug` to investigate this error: [Paste Trace / Logs]"
- **Workflow:** Hypothesizes root causes ➔ Isolates worktrees for parallel agents ➔ Authors failing reproduction tests ➔ Applies targeted fix ➔ Confirms zero regressions ➔ Reviews fix ➔ Finishes branch.

### 3. Dynamic Workflow Guide
- **One-Click Command:** "Please apply `skill-composition` for [Refactoring / Migration / Legacy Codebase]"
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

---

## 🆕 Recent Updates

### v6.3.4 (Latest)

- **Universal One-Click Global Setup Engine (`src/setup-runner.ts`, `scripts/`)**:
  - One-click zero-dependency configuration for 8 major AI environments: Antigravity, Pi Desktop / Pi Agent, Cursor, GitHub Copilot (VS Code), Hermes Desktop / Agent, Kimi Work / Kimi Code, Claude Desktop, and Devin Desktop.
  - Added CLI executables `superpowers-setup` and `superpowers-mcp setup` with cross-platform installers ([`install.sh`](scripts/install.sh) and [`install.ps1`](scripts/install.ps1)).
  - **Explicit Consent & Anti-Virus Design**: Mandated explicit `--target <client>` requirement, completely eliminating unprompted bulk disk scanning or blind crawling (`--all` removed).
  - **Atomic File Operations & Race Defense (`safeWriteConfig`)**: Implemented non-destructive atomic writes via temporary files with process IDs and cryptographically random 8-byte nonces (`crypto.randomBytes(8)`), exclusive creation (`wx`), and atomic `renameSync`.
  - **Symlink Preservation & Permissions**: Preserves symlink destinations with `realpathSync`, restricts created directories to `0o700` and config files to `0o600`.
  - **Injection Defense & JSONC Parsing**: Parameter escaping via `JSON.stringify`, JSONC comment tolerance, and `isPlainObject` prototype pollution defense.
  - **CLI Transport Stdio Isolation**: Front-intercepts setup CLI commands in `src/server.ts` before MCP Stdio transport initialization.
  - **Comprehensive Test Suite**: Added [`tests/setup_test.js`](tests/setup_test.js) with 21 unit assertions (100% PASS).
- **Skill Compositions & End-to-End Orchestration Pipelines (`src/server.ts`, `docs/`)**:
  - Added 3 new MCP workflow prompts: `feature-pipeline`, `structured-debug`, and `skill-composition`.
  - Comprehensive localized documentation in [`docs/skill-compositions.md`](docs/skill-compositions.md) (EN), [`docs/skill-compositions.zh-TW.md`](docs/skill-compositions.zh-TW.md) (ZH-TW), [`docs/skill-compositions.ja.md`](docs/skill-compositions.ja.md) (JA), and [`docs/skill-compositions.ko.md`](docs/skill-compositions.ko.md) (KO) with horizontal Mermaid flowcharts and ASCII workflow diagrams.
  - Enhanced [`skills/using-superpowers/SKILL.md`](skills/using-superpowers/SKILL.md) and [`skills/writing-plans/SKILL.md`](skills/writing-plans/SKILL.md) with `Recommended Skill` task metadata standards and controller-to-subagent dispatch protocols.
  - Added [`tests/prompts_compositions_test.js`](tests/prompts_compositions_test.js) with 7 comprehensive assertions (100% PASS).
- **Prompts Security Hardening & Lifecycle Fixes (`src/server.ts`)**:
  - Upgraded `interpolateTemplate` to single-pass regex replacement, eliminating cascading placeholder injection risks.
  - Enforced universal `getStringArg` with a 32 KB clamp and `hasOwnProperty` validation across all 9 prompts.
  - Augmented `structured-debug` with Stage 6 (findings resolution via `receiving-code-review`) and Stage 7 (branch finishing and cleanup via `finishing-a-development-branch`).
- **Full Security Audit & Verification**:
  - Verified 0 vulnerabilities across `npm audit` with exact dependency overrides for `hono`, `@hono/node-server`, `fast-uri`, and `qs`. All 5 test suites (100+ assertions) passing 100%. Updated [`SECURITY.md`](SECURITY.md).

### v6.3.3

- **MCP Standard Prompts Support (`src/server.ts`)**:
  - Implemented standard prompt handlers, registering 6 prompts (`session-start`, `sdd-implementer`, `sdd-task-reviewer`, `sdd-re-review`, `spec-reviewer`, `plan-reviewer`) for native IDE prompt-picker usage.
- **Multi-Harness Reference Mappings**:
  - Added platform references for Devin CLI ([`references/devin-tools.md`](skills/using-superpowers/references/devin-tools.md)) and OpenCode ([`references/opencode-tools.md`](skills/using-superpowers/references/opencode-tools.md)).
- **Multi-Lingual Documentation Alignment**:
  - Aligned MCP capability tables (Tools, Prompts, Resources) and multi-harness matrices across all supported languages.
- **Test Suite Expansion**:
  - Added automated test assertions for `prompts/list` and `prompts/get` parameter injection.

👉 *For the complete release history, see [CHANGELOG.md](CHANGELOG.md).*

---

## 🙏 Acknowledgments

This project is a fork and adaptation of the original [Superpowers](https://github.com/obra/superpowers) project by [obra](https://github.com/obra). We are grateful for their pioneering work in defining the agentic skills framework and software development methodology that powers this MCP server.
