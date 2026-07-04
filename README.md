# Superpowers MCP Toolpack Usage Guide

[English](README.md) | [繁體中文](README.zh-TW.md)

[![Version](https://img.shields.io/badge/version-6.0.0-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
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
  - **Usage**: Used to execute a predefined plan task-by-task. The system spawns a fresh "implementer" sub-agent per task, followed by a consolidated **task reviewer** (spec compliance + code quality) sub-agent, plus a **whole-branch final review** at the end. A **Pre-Flight Plan Review** scans for task conflicts before execution begins.
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

### v6.0.0 (Latest)
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
