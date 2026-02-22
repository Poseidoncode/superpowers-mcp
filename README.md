# Superpowers MCP Toolpack Usage Guide

This document summarizes the information and usage instructions for packaging the original Superpowers skills library into an independent MCP Toolpack.

---

## 🏗️ Project Structure Overview

The MCP Toolpack is located in the project root directory:

```text
Superpowers-OpenVSX/
├── package.json                  ← NPM package manifest defining the built-in MCP Server registration and commands
├── src/
│   └── server.ts                 ← MCP stdio server implementation (contains 14 skills)
├── skills/                       ← Offline packaged skills library (copied from the main project)
└── out/
    └── server.js (325 KB)         ← Compiled MCP Server
```

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

## 🛠️ Manual MCP Configuration

If your IDE or AI agent environment requires manual configuration of the MCP Server, please add the following settings (specifying the local npm package or absolute physical path):

```json
{
  "superpowers": {
    "command": "node",
    "args": ["/path/to/superpowers-mcp/out/server.js"],
    "env": {
      "SKILLS_PATH": "/path/to/superpowers-mcp/skills"
    }
  }
}
```

> 💡 If you installed via npm globally, you can use `$(npm root -g)/superpowers-mcp` as the path prefix.

---

## 📋 Supported Skills Overview (14 Total)

- `brainstorming`: Software design and requirements analysis process
- `test-driven-development`: TDD (Test-Driven Development) workflow
- `systematic-debugging`: Systematic debugging and root cause analysis
- `writing-plans`: Creating detailed implementation plans
- `subagent-driven-development`: Driving sub-agents to execute tasks
- `requesting-code-review`: Initiating pre-checks for code reviews
- ... and 8 other core skills.
