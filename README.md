# Superpowers MCP Toolpack Usage Guide

[English](README.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

[![Version](https://img.shields.io/badge/version-6.3.3-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

This document summarizes the information and usage instructions for packaging the Superpowers skills and autonomous workflow system into an independent, high-performance, and secure **Model Context Protocol (MCP)** server.

---

## 🚀 How to Install and Use

### Supported Environments & Harnesses

- **MCP-Native AI Editors & IDEs**: **Antigravity (AGY)**, **Cursor**, **VSCode**, **Windsurf**, **Claude Desktop / Claude Code**.
- **CLI & Autonomous Agents**: **Devin CLI**, **Hermes Agent**, **OpenCode**, **Kimi CLI**, **Pi CLI**, **Gemini CLI**.

### MCP Capabilities Provided

| Protocol Feature | Items / Capabilities | Description |
| :--- | :--- | :--- |
| **Tools** | `list_skills`, `read_skill` | Discover and load any of the 14 Superpowers skills on demand. |
| **Prompts** | `session-start`, `sdd-implementer`, `sdd-task-reviewer`, `sdd-re-review`, `spec-reviewer`, `plan-reviewer` | Ready-to-use adversarial review and subagent orchestrator prompts in your IDE prompt list. |
| **Resources** | `skill://superpowers/<skill-name>` | Direct URI-based skill access for MCP-compliant hosts. |

### Chatting with the AI Agent

Once installed or configured, your AI Agent will automatically discover and invoke `Superpowers Skills` and `Prompts`.

**Example prompts to your agent:**

- "List all superpowers skills"
- "Use read_skill to read the brainstorming skill, and then help me analyze the implementation of this feature"
- "Apply the session-start prompt" (Initializes the full Superpowers workflow context)
- "Run Subagent-Driven Development for docs/plans/feature-plan.md"

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

### v6.3.3 (Latest)

- **MCP Standard Prompts Support (`src/server.ts`)**:
  - Implemented standard prompt handlers, registering 6 prompts (`session-start`, `sdd-implementer`, `sdd-task-reviewer`, `sdd-re-review`, `spec-reviewer`, `plan-reviewer`) for native IDE prompt-picker usage.
- **Multi-Harness Reference Mappings**:
  - Added platform references for Devin CLI (`references/devin-tools.md`) and OpenCode (`references/opencode-tools.md`).
- **Multi-Lingual Documentation Alignment**:
  - Aligned MCP capability tables (Tools, Prompts, Resources) and multi-harness matrices across all supported languages.
- **Test Suite Expansion**:
  - Added automated test assertions for `prompts/list` and `prompts/get` parameter injection.

### v6.3.2

- **writing-plans — Two Plan Shapes Router & Skeleton-First Plans**:
  - `skills/writing-plans/SKILL.md` introduces the **Two Plan Shapes** router (`task-by-task` default vs `skeleton-first` alternative) to determine architecture upfront.
  - New [`skills/writing-plans/skeleton-first-plans.md`](skills/writing-plans/skeleton-first-plans.md) defines the Walking Skeleton pattern (Task 1 builds the thinnest running end-to-end slice across all subsystems), Task Contracts (strict interfaces and observable behaviors without code scripts), and deliberate `Tier: mechanical | judgment` tagging.
- **subagent-driven-development (SDD) — Wave Dispatch & Parallel Worktree Protocol**:
  - SDD controller performs **Dispatch Plan** scanning on skeleton-first plans, grouping mutually file-disjoint tasks into waves for concurrent dispatch.
  - **Parallel Worktree Protocol**: Runs concurrent tasks in dedicated `.worktrees/task-<N>` worktrees, with sequential plan-order merges and automatic rebase-to-fix loops on merge conflict or test regression.
  - Step 5 adds the post-completion `Plan holds` / `Amendment:` check line, ensuring in-flight tasks complete cleanly while downstream tasks inherit updated plan contracts.
- **SDD — Tier-Driven Model Selection**:
  - SDD dispatcher and `implementer-prompt.md` respect task `Tier:` markings (`mechanical` → fastest/cheapest tier; `judgment` → standard tier), saving tokens without redundant re-adjudication.
- **writing-skills — Binary Execution Hardening (`render-graphs.js`)**:
  - Replaced `execSync` shell execution with direct `execFileSync('dot', ['-Tsvg'], ...)` to eliminate shell injection risks. Added 10MB buffer limits, Windows CRLF support (`\r?\n`), and Windows `winget` installation guidance.
- **Tests & Verification**: Full regression suites pass 100% across MCP protocol, Security Edge Cases, SDD Bash (11 assertions), PowerShell (70 assertions), and Graphviz rendering.

👉 *For the complete release history, see [CHANGELOG.md](CHANGELOG.md).*

---

## 🙏 Acknowledgments

This project is a fork and adaptation of the original [Superpowers](https://github.com/obra/superpowers) project by [obra](https://github.com/obra). We are grateful for their work in defining the agentic skills framework and software development methodology that powers this MCP server.
