# Superpowers MCP — VSCode Extension

**Superpowers** brings a complete AI development workflow to any VSCode-compatible editor — including **VSCode**, **Trae**, and **Antigravity** — via the [Model Context Protocol (MCP)](https://modelcontextprotocol.io).

## What is Superpowers?

Superpowers is a collection of proven AI agent skills for software development:

| Skill | Description |
|-------|-------------|
| `brainstorming` | Explores intent and design before writing code |
| `test-driven-development` | RED → GREEN → REFACTOR cycle |
| `systematic-debugging` | 4-phase root cause analysis |
| `writing-plans` | Detailed implementation plans |
| `subagent-driven-development` | Parallel task execution |
| `requesting-code-review` | Pre-review checklist |
| ... and 8 more | See full list below |

## Installation

Install from the [Open VSX Registry](https://open-vsx.org) or the VS Code Marketplace by searching for **Superpowers MCP**.

The MCP server starts automatically when the extension is activated.

## Usage

Once installed, the `Superpowers Skills` MCP server is available to any AI chat/agent in your editor.

### In GitHub Copilot / AI Chat

```
Use the list_skills tool to see all available superpowers skills
```

```
Use the read_skill tool to read the brainstorming skill, then help me plan this feature
```

```
Apply the session-start prompt from the superpowers-mcp MCP server
```

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `list_skills` | List all skills with descriptions |
| `read_skill` | Load a skill's full content by name |

### Available MCP Resources

Each skill is accessible as a resource:
```
skill://superpowers/brainstorming
skill://superpowers/test-driven-development
skill://superpowers/systematic-debugging
... (14 skills total)
```

### Available MCP Prompts

| Prompt | Description |
|--------|-------------|
| `session-start` | Inject superpowers context at session start |

## Manual MCP Configuration (without proposed API)

If your editor doesn't support the `mcpServerDefinitionProvider` proposed API, add this to `.vscode/mcp.json`:

```json
{
  "servers": {
    "superpowers": {
      "type": "stdio",
      "command": "node",
      "args": ["${extensionPath}/out/server.js"],
      "env": {
        "SKILLS_PATH": "${extensionPath}/skills"
      }
    }
  }
}
```

## All Skills

- `brainstorming` — Design before implementation
- `dispatching-parallel-agents` — Concurrent subagent workflows
- `executing-plans` — Batch execution with checkpoints
- `finishing-a-development-branch` — Merge/PR decision workflow
- `receiving-code-review` — Responding to feedback
- `requesting-code-review` — Pre-review checklist
- `subagent-driven-development` — Fast iteration with two-stage review
- `systematic-debugging` — Root cause analysis process
- `test-driven-development` — RED-GREEN-REFACTOR cycle
- `using-git-worktrees` — Parallel development branches
- `using-superpowers` — Introduction to the skills system
- `verification-before-completion` — Ensure it's actually fixed
- `writing-plans` — Detailed implementation plans
- `writing-skills` — Create new skills

## License

MIT — Original Superpowers by [Jesse Vincent](https://github.com/obra/superpowers)
