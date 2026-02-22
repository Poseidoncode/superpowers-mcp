# Superpowers MCP

**Superpowers** brings a complete AI development workflow to any MCP-compatible environment — including **Antigravity**, **Cursor**, **Trae**, and **Claude Desktop**. It exposes the proven [Superpowers](https://github.com/obra/superpowers) skill library via the [Model Context Protocol (MCP)](https://modelcontextprotocol.io).

## What is Superpowers?

Superpowers is a collection of high-discipline AI agent skills and workflows for software development:

| Skill | Description |
|-------|-------------|
| `brainstorming` | Explore intent and design requirements before implementation |
| `test-driven-development` | Enforce the RED → GREEN → REFACTOR cycle |
| `systematic-debugging` | 4-phase root cause analysis and fix verification |
| `writing-plans` | Create detailed implementation plans with checkpoints |
| `subagent-driven-development` | Coordinate parallel tasks with two-stage reviews |
| `verification-before-completion` | Ensure work is actually fixed before declaring success |
| ... and more | 14 total specialized development workflows |

## Getting Started (Quick Start)

The easiest way to use Superpowers is via `npx`. No manual installation of the package is required if your IDE supports running commands.

### Antigravity / Cursor / Trae

Add the following to your MCP settings (e.g., `settings.json` or MCP configuration UI):

```json
"superpowers": {
  "command": "npx",
  "args": ["-y", "superpowers-mcp"]
}
```

### Manual Installation (Development)

If you prefer to install it globally:

```bash
npm install -g superpowers-mcp
```

Then run the server:
```bash
superpowers-mcp
```

## Features

### 🛠️ MCP Tools

| Tool | Input | Description |
|------|-------|-------------|
| `list_skills` | None | List all available skills with concise descriptions. |
| `read_skill` | `skill_name` | Load the full content, checklists, and patterns of a skill. |

### 🧠 MCP Prompts

| Prompt | Description |
|--------|-------------|
| `session-start` | Kickstart an AI session with the Superpowers mindset and tool instructions. |

### 📚 MCP Resources

Individual skills can be referenced directly via URIs:
`skill://superpowers/[skill-name]` (e.g., `skill://superpowers/test-driven-development`)

## Why use Superpowers?

AI agents are powerful but often lack discipline. Superpowers provides the **discipline** and **process** required for enterprise-grade software engineering. By invoking a skill, you force the AI to follow industry best practices, use checklists, and avoid "shotgun debugging" or "lazy implementation."

## License

MIT — Based on the original Superpowers project by [Jesse Vincent](https://github.com/obra/superpowers).
