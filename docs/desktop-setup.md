# Desktop import guide

This guide covers ChatWise and Cherry Studio, which require manual JSON import.

```bash
npx -y superpowers-mcp setup --print-config
```

Install Node.js with npm first and restart the desktop app after saving its configuration. If a GUI cannot find `npx`, use its absolute executable path in the app's MCP configuration (`command -v npx` on macOS/Linux; `where.exe npx` on Windows). This installs the Superpowers MCP connection, not the desktop application. Tool execution also depends on the model and the client's available capabilities.

## ChatWise and Cherry Studio

Copy this complete JSON, or generate it with `npx -y superpowers-mcp setup --print-config` (`--bun` selects `bunx`).

```json
{
  "mcpServers": {
    "superpowers": {
      "command": "npx",
      "args": ["-y", "superpowers-mcp"]
    }
  }
}
```

### ChatWise

[Add Superpowers to ChatWise](https://chatwise.app/mcp-add?json=eyJtY3BTZXJ2ZXJzIjp7InN1cGVycG93ZXJzIjp7ImNvbW1hbmQiOiJucHgiLCJhcmdzIjpbIi15Iiwic3VwZXJwb3dlcnMtbWNwIl19fX0%3D)

ChatWise must already be installed. Alternatively, copy the JSON, open **Settings → Tools → + → Import JSON from Clipboard**, then enable tools for the chat. Use the MCP Tools chat workflow: ChatWise's current Agent preview documents MCP as disabled in that mode.

### Cherry Studio

Open **Settings → MCP → MCP Servers → Add → Import from JSON**, paste the JSON, save and enable the server. If using manual creation, choose **stdio**, name `superpowers`, command `npx`, and two separate arguments: `-y` and `superpowers-mcp`. Then open **Work → Agent menu → Edit → MCP** and enable this server for the intended Agent.

## Verify the connection

Ask the assistant: **Use `list_skills` to list the Superpowers skills, then use `read_skill` to read `brainstorming`.** Confirm that actual tool results appear. Prompts and resources vary by client; the tool-based path is the common verification route.

## References

- [ChatWise JSON import and install links](https://docs.chatwise.app/tools)
- [ChatWise Agent preview limitations](https://docs.chatwise.app/agent)
- [Cherry Studio MCP setup and Agent binding](https://docs.cherryai.com.cn/advanced-basic/extensions/mcp)

Import formats were checked against these sources on 2026-09-13. Automated checks exercise configuration generation, preservation and removal; desktop GUI connections have not been tested on physical Windows/Linux installations.
