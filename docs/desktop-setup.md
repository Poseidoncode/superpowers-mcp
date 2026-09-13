# Desktop quick setup / 桌面版快速安裝

The new `lmstudio`, `roo` and `--print-config` options are unreleased. Until the next npm release, run from a checkout:

```bash
npm ci
npm run build
node out/setup.js --target lmstudio
# Or choose Roo Code in VS Code Desktop:
node out/setup.js --target roo
# Or print JSON to import into a desktop app:
node out/setup.js --print-config
```

目前新增選項尚未發布至 npm。發布前請使用上方本機指令；設定中的 MCP 伺服器仍透過 npm 啟動已發布版本。

Install Node.js with npm first and restart the desktop app after saving its configuration. If a GUI cannot find `npx`, use its absolute executable path in the app's MCP configuration (`command -v npx` on macOS/Linux; `where.exe npx` on Windows). This installs the Superpowers MCP connection, not the desktop application. Tool execution also depends on the model and the client's available capabilities.

## File-based desktop setup

After the next npm release:

```bash
npx -y superpowers-mcp setup --target lmstudio
npx -y superpowers-mcp setup --target roo
```

Run only the command for the client you want. Both targets support `--dry-run`, `--backup`, `--bun` and `--remove`. `lm-studio` aliases `lmstudio`; `roo-code` and `roocode` alias `roo`.

| Client | Configuration location |
| --- | --- |
| LM Studio, all three OSes | User home + `.lmstudio/mcp.json` |
| Roo Code, macOS | `~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json` |
| Roo Code, Windows | `%APPDATA%/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json` |
| Roo Code, Linux | `~/.config/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json` |

Roo setup targets the standard VS Code Desktop profile. For Insiders, portable builds, remote VS Code or a custom storage location, open Roo's **Edit Global MCP** configuration and merge the JSON below into its existing `mcpServers` object.

LM Studio: open **Program → Install → Edit mcp.json** to inspect the configuration, then enable the integration for your chat. Select a model that supports tool use.

## ChatWise and Cherry Studio

Copy this complete JSON, or generate it with `node out/setup.js --print-config` (`--bun` selects `bunx`). After release, the equivalent command is `npx -y superpowers-mcp setup --print-config`.

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

[Add Superpowers to ChatWise / 一鍵加入 ChatWise](https://chatwise.app/mcp-add?json=eyJtY3BTZXJ2ZXJzIjp7InN1cGVycG93ZXJzIjp7ImNvbW1hbmQiOiJucHgiLCJhcmdzIjpbIi15Iiwic3VwZXJwb3dlcnMtbWNwIl19fX0%3D)

ChatWise must already be installed. Alternatively, copy the JSON, open **Settings → Tools → + → Import JSON from Clipboard**, then enable tools for the chat. Use the MCP Tools chat workflow: ChatWise's current Agent preview documents MCP as disabled in that mode.

先安裝 ChatWise，再點上方連結；也可以在 Tools 設定從剪貼簿匯入 JSON，並在對話開啟工具。請使用支援 MCP Tools 的對話模式，目前 Agent 預覽模式不支援 MCP。

### Cherry Studio

Open **Settings → MCP → MCP Servers → Add → Import from JSON**, paste the JSON, save and enable the server. If using manual creation, choose **stdio**, name `superpowers`, command `npx`, and two separate arguments: `-y` and `superpowers-mcp`. Then open **Work → Agent menu → Edit → MCP** and enable this server for the intended Agent.

在「設定 → MCP → MCP 伺服器 → 新增」匯入 JSON，儲存並啟動後，到「工作 → Agent 選單 → 編輯 → MCP」綁定。只加入伺服器、未綁定 Agent 時，Agent 不會取得工具。

## Verify the connection

Ask the assistant: **Use `list_skills` to list the Superpowers skills, then use `read_skill` to read `brainstorming`.** Confirm that actual tool results appear. Prompts and resources vary by client; the tool-based path is the common verification route.

Hermes users can now keep inline comments such as `mcp_servers: # configured servers`; setup also recognizes `superpowers: # my agent` during update and removal.

## References

- [LM Studio MCP configuration and paths](https://lmstudio.ai/blog/lmstudio-v0.3.17)
- [LM Studio MCP usage](https://lmstudio.ai/docs/app/mcp)
- [Roo Code MCP configuration](https://roocodeinc.github.io/Roo-Code/features/mcp/using-mcp-in-roo/)
- [Roo Code storage and configuration migration](https://github.com/RooCodeInc/Roo-Code/issues/8520)
- [ChatWise JSON import and install links](https://docs.chatwise.app/tools)
- [ChatWise Agent preview limitations](https://docs.chatwise.app/agent)
- [Cherry Studio MCP setup and Agent binding](https://docs.cherryai.com.cn/advanced-basic/extensions/mcp)

Paths and import formats were checked against these sources on 2026-09-13. Automated checks exercise configuration generation, preservation and removal; desktop GUI connections have not been tested on physical Windows/Linux installations.
