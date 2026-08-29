# OpenCode Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On OpenCode these resolve to the tools below.

## Tools

| Action skills request | OpenCode tool |
|---|---|
| Read a file | `read_file` |
| Create a new file | `write_file` |
| Edit a file (targeted patch) | `edit_file` |
| Run a shell command | `bash` / `terminal` |
| Search file contents | `grep` / `search_files` |
| Find files by name | `find_files` |
| Fetch a URL / read a webpage | `fetch_url` |
| Search the web | `web_search` |
| Invoke a skill | `use_skill(name="...")` or MCP `read_skill` |
| List available skills | `find_skills` or MCP `list_skills` |

## Instructions file

When a skill mentions "your instructions file," on OpenCode this is **`AGENTS.md`** or **`OPENCODE.md`** in the project root directory.

## Invoking a skill

OpenCode discovers registered skills via its plugin ecosystem or MCP server. To invoke a skill:

```
use_skill(name="brainstorming")
```

Or when running through the Superpowers MCP Server, use `read_skill(skill_name="brainstorming")`.
