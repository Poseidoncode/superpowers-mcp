# Devin CLI Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On Devin CLI these resolve to the tools below.

## Tools

| Action skills request | Devin CLI tool |
|---|---|
| Read a file | `read_file` / `view_file` |
| Create a new file | `write_to_file` |
| Edit a file (targeted patch) | `replace_file_content` / `edit_file` |
| Run a shell command | `run_command` |
| Search file contents | `grep_search` |
| Find files by name | `find_by_name` / `list_dir` |
| Fetch a URL / read a webpage | `read_url_content` / `browser` |
| Search the web | `search_web` |
| Dispatch a subagent | `invoke_subagent` / `spawn_agent` |
| Task tracking | `task_list` / session todo list |
| Ask user question | `ask_question` |
| Invoke a skill | Native `skill` tool or `read_skill` via MCP |

## Instructions file

When a skill mentions "your instructions file," on Devin CLI this is **`DEVIN.md`** or **`AGENTS.md`** in the project root directory.

## Invoking a skill

Devin CLI auto-discovers skills from installed plugins. To invoke a superpowers skill, invoke the native skill runner or call the MCP tool:

```
skill(name="brainstorming")
```

If native skill resolution is unavailable, fall back to reading the skill file directly or via the MCP server's `read_skill` tool.

## Subagent dispatch

When executing Subagent-Driven Development (SDD) or parallel dispatch, use Devin's subagent capability (`invoke_subagent`):

- **Implementers**: Dispatch focused implementer subagents for single task isolation.
- **Reviewers**: Dispatch fresh, independent reviewer subagents to review against specifications.
