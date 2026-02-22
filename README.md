# Superpowers MCP Toolpack Usage Guide

[English](README.md) | [繁體中文](README.zh-TW.md)

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
1. `[superpowers:brainstorm : Confirm requirements and architecture]`
2. `[superpowers:writing-plans : Create an execution plan with specific steps]`
3. `[superpowers:test-driven-development : Implement the feature with tests]`
4. `[superpowers:verification-before-completion : Run test suites to ensure everything works]`

### 2. Emergency Hotfix Sequence
1. `[superpowers:systematic-debugging : Locate the root cause of the current issue]`
2. `[superpowers:test-driven-development : Write a failing test for the bug and fix it]`
3. `[superpowers:verification-before-completion : Validate the applied hotfix]`

---

## 📋 Supported Skills Overview (14 Total)

To help you choose the right skill, we've categorized them into 6 logical phases of software development:

### 🚀 1. Planning & Design
- `brainstorming`: Software design and requirements analysis process
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
- `subagent-driven-development`: Driving sub-agents to execute tasks
- `dispatching-parallel-agents`: Dispatching tasks to parallel agents

### ⚙️ 6. Customization & Meta
- `using-superpowers`: Guidelines and self-checks for using Superpowers
- `writing-skills`: Writing and expanding new custom skills

---

## 🙏 Acknowledgments

This project is a fork and adaptation of the original [Superpowers](https://github.com/obra/superpowers) project by [obra](https://github.com/obra). We are grateful for their work in defining the agentic skills framework and software development methodology that powers this MCP server.
