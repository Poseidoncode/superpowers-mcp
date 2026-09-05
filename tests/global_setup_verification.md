# Superpowers MCP - 全域一鍵安裝驗證報告

## 執行時間
2026-09-05

## 交付清單
1. **核心安裝與配置引擎**：
   - [`scripts/setup.js`](file:///Users/poseidomhung/Documents/github/Infinity/superpowers-mcp/scripts/setup.js)
   - [`src/setup-runner.ts`](file:///Users/poseidomhung/Documents/github/Infinity/superpowers-mcp/src/setup-runner.ts)
   - [`src/server.ts`](file:///Users/poseidomhung/Documents/github/Infinity/superpowers-mcp/src/server.ts)（整合 `setup` CLI 參數識別）
2. **一鍵跨平台腳本**：
   - [`scripts/install.sh`](file:///Users/poseidomhung/Documents/github/Infinity/superpowers-mcp/scripts/install.sh) (macOS / Linux)
   - [`scripts/install.ps1`](file:///Users/poseidomhung/Documents/github/Infinity/superpowers-mcp/scripts/install.ps1) (Windows PowerShell)
3. **單元與整合測試套件**：
   - [`tests/setup_test.js`](file:///Users/poseidomhung/Documents/github/Infinity/superpowers-mcp/tests/setup_test.js) (9/9 通過)
4. **4 語系文檔**：
   - [`README.zh-TW.md`](file:///Users/poseidomhung/Documents/github/Infinity/superpowers-mcp/README.zh-TW.md)
   - [`README.md`](file:///Users/poseidomhung/Documents/github/Infinity/superpowers-mcp/README.md)
   - [`README.ja.md`](file:///Users/poseidomhung/Documents/github/Infinity/superpowers-mcp/README.ja.md)
   - [`README.ko.md`](file:///Users/poseidomhung/Documents/github/Infinity/superpowers-mcp/README.ko.md)

## 支援的 OS 與 Harness 矩陣
- **作業系統**：macOS (darwin)、Windows (win32)、Linux (linux)
- **Harnesses**：
  - **Antigravity (Google DeepMind)**：`~/.gemini/config/mcp_config.json`（支援別名 `antigravity`, `agy`, `gemini`）
  - **Pi Desktop / Pi Agent**：`~/.pi/agent/mcp.json`（支援別名 `pi-desktop`, `pi`, `pi-agent`）
  - **GitHub Copilot (VS Code)**：`Code/User/mcp.json`（自動適配 VS Code 特有的 `servers` root 與 `stdio` 類型規範）
  - **Cursor**：`~/.cursor/mcp.json`
  - **Hermes Desktop / Agent**：`~/.hermes/config.yaml`（安全 YAML 區塊合併與更新）
  - **Kimi Work / Kimi Code**：`~/.kimi-code/mcp.json`
  - **Claude Desktop**：`claude_desktop_config.json`
  - **Devin Desktop (原 Windsurf)**：`~/.config/devin/mcp_config.json` 或舊版 `~/.codeium/windsurf/mcp_config.json`（支援別名 `devin`, `windsurf`）
- **安全防護**：
  - **預設零磁碟污染（Zero-Pollution）**：預設不產生任何 `.bak` 孤兒檔案，杜絕空間浪費與目錄殘留（僅在使用者顯式指定 `--backup` 時生成）。
  - **原子化檔案置換（Atomic Write via renameSync）**：使用隨機後綴與 `flag: 'wx'` 寫入同目錄暫存檔再進行作業系統級原子替換，防禦 Symlink 劫持，保證斷電、行程異常時原設定檔 100% 完好無損。
  - 符號連結（Symlink）解析保護：包含懸空符號連結 (Dangling Symlink) 韌性防護，保留連結並正確寫入真實目標路徑。
  - 嚴格型別檢查，使用加固版 `isPlainObject` 防禦非純物件干擾。
  - 支援 VS Code `mcp.json` 的 JSONC 註解相容性解析，並優先原生 JSON.parse 保護含 `//` 的字串值。
  - YAML 縮排動態偵測與 scoped remove 限制在 `mcp_servers` 內刪除。
  - `src/server.ts` 執行流程徹底隔離，防止 CLI setup 與 MCP Server Stdio 產生競態與協議污染。
  - 支援 `--dry-run`、`--backup` 與 `--remove` 完整生命週期管理，並於失敗時正確回傳非零退出碼。
  - 嚴格拒絕全量盲目安裝，必須顯式指定 `--target`，杜絕流氓軟體/惡意全域掃描風險。

## 雙子 Agent 審查與落實紀錄
- **架構與安全性審查員 (Architectural & Security Reviewer)**：
  - 解決暫存檔名偽預測性（引入 `crypto.randomBytes` + `flag: 'wx'`）。
  - 解決懸空符號連結 (Dangling Symlink) 斷裂問題。
  - 統一 `--setup` CLI 參數轉發一致性。
  - 消除 Floating Promise 與空 catch 區塊。
- **代碼品質與邊界審查員 (Quality & Edge Cases Reviewer)**：
  - 修復 `scripts/setup.js` 進入點重複呼叫兩次的 High 級缺陷。
  - 修復 `--remove` 於檔案不存在時反向建立空設定檔之冪等性缺陷。
  - 解決 `stripJsonComments` 誤傷字串內部 `//` 的問題。
  - 移除死碼變數，全數落實 4 語系 README 與參數一致性。
- **全量測試結果**：
  - Edge Cases & Security: 7/7 通過
  - Basic MCP Protocol: 7/7 通過
  - Brainstorm UI & Security: 31/31 通過
  - Prompts Compositions: 9/9 通過
  - Global Setup Comprehensive: 21/21 通過
