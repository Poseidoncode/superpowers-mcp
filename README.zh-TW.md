# Superpowers MCP Toolpack 使用指南

[English](README.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

[![版本](https://img.shields.io/badge/version-6.3.10-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
[![授權](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

本文檔總結了將 Superpowers 技能庫與自主 Agent 工作流架構打包成獨立、高效能且安全加固的 **Model Context Protocol (MCP)** 伺服器之相關資訊與使用說明。

---

## 🚀 安裝與使用方式

### 支援的環境與 Agent 平台

- **AI 程式碼編輯器與 IDE**：**Antigravity (AGY)**、**Cursor**、**VSCode**（GitHub Copilot）、**VSCode Insiders**（GitHub Copilot）、**Devin Desktop**、**Trae**、**Cline**、**Kilo Code**、**Qoder**、**Kiro**、**MiniMax Code Desktop**、**Codex**。
- **AI 桌面應用與 Agent 工具**：**Claude Desktop**、**Pi Desktop**、**QwenPaw**、**Hermes Desktop**、**Kimi Work**。
- **開源與私有化 AI 平台**：**AnythingLLM**、**LibreChat**。

### 提供之 MCP 協議功能

| 協議功能 | 包含項目 / 數量 | 說明 |
| :--- | :--- | :--- |
| **Tools (工具)** | `list_skills`, `read_skill` | 依需求隨時探索、搜尋並載入技能完整內容與操作規範。 |
| **Prompts (提示詞)** | 9 個原生 Prompts | `session-start`, `feature-pipeline`, `structured-debug`, `skill-composition`, `sdd-implementer`, `sdd-task-reviewer`, `sdd-re-review`, `spec-reviewer`, `plan-reviewer` |
| **Resources (資源)** | 14 項技能 URI + 1 項指南 | `skill://superpowers/<skill-name>`，以及 `guide://superpowers/skill-compositions` |

### 與 AI Agent 對話（基礎操作）

安裝或配置完成後，MCP 客戶端即可發現 Superpowers 的 tools、prompts 與 resources。MCP prompt 必須由使用者選取；之後是否載入技能，取決於 Agent 是否遵循 prompt 並呼叫 `read_skill`。

**基礎互動範例：**
- **初始化工程規範**：「套用 `session-start` prompt」（注入 Superpowers 技能體系與工程紀律）
- **查詢所有可用技能**：「列出所有 superpowers 技能」
- **載入單一技能**：「使用 `read_skill` 讀取 `brainstorming` 技能並幫我分析需求」

---

## ⚡ 快速全域一鍵設定 (Targeted One-Click Setup)

為了讓您在最短時間內啟用 Superpowers，我們提供了**精確指定、尊重環境隱私、杜絕批量侵入**的跨平台一鍵安裝工具。

> [!NOTE]
> **可在系統任何目錄下直接執行**：您不需要預先切換到特定專案目錄，也無須 clone 本儲存庫。在終端機的**任意目錄**皆可直接執行以下指令！安裝程式會自動鎖定您系統中的全域設定檔（以使用者家目錄為基準），一次設定、全域與所有專案皆可自動生效。

桌面版快速安裝：[LM Studio、Roo Code、ChatWise 與 Cherry Studio](docs/desktop-setup.md)。以下新增的 CLI 選項尚未發布至 npm；發布前請使用指南中的本機指令。

> [!TIP]
> **透明與零污染保護原則**：Superpowers 絕不會像惡意軟體般擅自全域掃描或批量改寫您未指定的其他編輯器。您使用哪一款 AI 工具，就執行該工具的專屬一鍵指令，完全透明、可控且安全無損（採用**原子寫入技術**，保證斷電不壞檔，且**預設零磁碟垃圾殘留**，不隨意產生 `.bak`，亦絕不影響原有其他 MCP 伺服器）。

### 1. 選擇您的 AI Agent / 編輯器（一鍵精準設定）

請依據您使用的客戶端，在終端機複製並執行對應指令：

| Harness / 客戶端 | 支援 OS | 專屬一鍵設定指令 | 全域設定檔路徑 |
| :--- | :--- | :--- | :--- |
| **LM Studio** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target lmstudio` | `~/.lmstudio/mcp.json` |
| **Roo Code (VS Code Desktop)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target roo` | `.../rooveterinaryinc.roo-cline/settings/mcp_settings.json` |
| **Antigravity (Google DeepMind)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target antigravity` | `~/.gemini/config/mcp_config.json` |
| **Pi Desktop / Pi Agent** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target pi-desktop` | `~/.pi/agent/mcp.json` |
| **Cursor** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target cursor` | `~/.cursor/mcp.json` |
| **GitHub Copilot (VS Code)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target copilot` | `Code/User/mcp.json` *(VS Code `servers` 格式)* |
| **GitHub Copilot (VS Code Insiders)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target copilot-insiders` | `Code - Insiders/User/mcp.json` *(VS Code `servers` 格式)* |
| **Hermes Desktop / Agent** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target hermes` | `~/.hermes/config.yaml` *(Win: `%LOCALAPPDATA%\hermes`)* |
| **Kimi Work / Kimi Code** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target kimi` | `~/.kimi-code/mcp.json` |
| **Claude Desktop** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target claude` | `Claude/claude_desktop_config.json` |
| **Devin Desktop (原 Windsurf)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target devin` | `~/.config/devin/mcp_config.json` *(或 `windsurf`)* |
| **QwenPaw (個人 AI 助理工作站)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target qwenpaw` | `~/.qwenpaw/config.json` *(相容 `copaw`)* |
| **Cline (VS Code / CLI)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target cline` | `.../saoudrizwan.claude-dev/settings/cline_mcp_settings.json` |
| **Kilo Code** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target kilo` | `~/.config/kilo/kilo.jsonc` *(自適應 `mcp` 規格)* |
| **Qoder** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target qoder` | `~/.qoder/settings.json` |
| **Kiro** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target kiro` | `~/.kiro/settings/mcp.json` |
| **Trae** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target trae` | `.../Trae/User/mcp.json` *(支援 Trae CN)* |

*(若偏好使用 Bun，指令可加上 `--bun`，例如 `npx -y superpowers-mcp setup --target cursor --bun`)*

---

### 2. 透過 Curl / PowerShell 一鍵設定

- **macOS / Linux（透過 Curl 指定目標）：**
  ```bash
  curl -fsSL https://raw.githubusercontent.com/Poseidoncode/superpowers-mcp/main/scripts/install.sh | bash -s -- --target cursor
  ```

- **Windows（透過 PowerShell 指定目標）：**
  ```powershell
  & ([scriptblock]::Create((irm https://raw.githubusercontent.com/Poseidoncode/superpowers-mcp/main/scripts/install.ps1))) -Target cursor
  ```

#### 常用進階參數：
- `--dry-run`：預覽即將修改的檔案與配置內容，不實際寫入磁碟。
- `--remove`：從指定目標 Harness 安全移除 Superpowers 配置。
- `--backup`：修改前建立時間戳記 `.bak` 備份檔（預設為關閉，維持系統純淨零殘留）。
- `--bun`：在產生的設定中改用 `bunx` 啟動，享受極速啟動效能。
- `--target <name>`：指定目標名稱（支援常用別名，如 `code`、`vscode`、`kimi-code` 等）。

---

## 🛠️ 手動 MCP 配置 (Manual Configuration)

若您偏好手動設定，可將以下設定加入您的 IDE 或 MCP 客戶端（例如 Cursor、Antigravity、VSCode、AnythingLLM 等）。

### 方法：NPX / BUNX（推薦）

這是最簡單的方式，因為它會自動處理路徑解析。

#### 使用 Bun（較快）
```json
{
  "superpowers": {
    "command": "bunx",
    "args": ["-y", "superpowers-mcp"]
  }
}
```

#### 使用 Node/NPM
```json
{
  "superpowers": {
    "command": "npx",
    "args": ["-y", "superpowers-mcp"]
  }
}
```

---

## 🔄 技能編排與工作流流水線 (Skill Compositions & Pipelines)

當執行多步驟的複雜任務時，請使用以下**互動式工作流啟動器**。它會啟動 Agent 引導的流程，並在設計、計畫審閱與分支收尾時等待使用者決定；它不是伺服器端無人值守自動化。詳見 [`docs/skill-compositions.zh-TW.md`](docs/skill-compositions.zh-TW.md)。

### 1. 端到端新功能開發管線 (Feature Development Pipeline)
```
brainstorming ➔ writing-plans ➔ using-git-worktrees ➔ subagent-driven-development (TDD) ➔ verification-before-completion ➔ requesting-code-review ➔ finishing-a-development-branch
```
- **啟動方式：**從客戶端的 MCP Prompts 選單選取 `feature-pipeline`，提供必要的 `feature_name` 與選填的 `requirements`。
- **流程特色：** 需求確認 (Spec) ➔ 任務拆解 (Plan) ➔ Worktree 隔離 ➔ 獨立 Subagent + TDD 實作 ➔ 全套測試驗證 ➔ 專家代碼審查 ➔ 分支收尾。

### 2. 結構化多點除錯管線 (Structured Troubleshooting Pipeline)
```
systematic-debugging ➔ using-git-worktrees ➔ dispatching-parallel-agents ➔ test-driven-development ➔ verification-before-completion ➔ requesting-code-review ➔ finishing-a-development-branch
```
- **啟動方式：**從 MCP Prompts 選單選取 `structured-debug`，提供錯誤描述或失敗測試。
- **流程特色：** 根因分析拆解假說 ➔ Worktree 隔離平行排查 ➔ 多 Agent 驗證 ➔ 編寫失敗測試並修復 ➔ 全套迴歸驗證 ➔ 審查結果解決 ➔ 分支合併收尾。

### 3. 動態技能導引 (Dynamic Workflow Guide)
- **啟動方式：**選取 `skill-composition` 取得重構、遷移或舊系統的流程建議；這些情境目前沒有各自獨立的啟動 prompt。
- **流程特色：** 針對大型重構、舊代碼防護網建立或團隊新人上手，動態推薦最佳步驟：
  - **大型重構與遷移 (Pipeline 3)：** `brainstorming` ➔ `writing-plans (skeleton-first)` ➔ `using-git-worktrees` ➔ `subagent-driven-development` ➔ `verification-before-completion` ➔ `requesting-code-review` ➔ `finishing-a-development-branch`
  - **舊專案工程防護網 (Pipeline 4)：** `brainstorming` ➔ `writing-plans` ➔ `test-driven-development (characterization)` ➔ `systematic-debugging` ➔ `verification-before-completion`


---

## 📋 支援技能總覽 (14 項核心技能與適用情境)

為了讓您能快速選用合適的技能，我們將 14 個技能依照軟體開發生命週期 (SDLC) 進行分類，並整合其核心用途與社群推薦使用情境：

| # | 開發階段 (Phase) | 技能名稱 (Skill Name) | 它是幹嘛用的？ (Purpose & Core Value) | 推薦使用情境 (Recommended Scenario) |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **🚀 規劃與設計** | **`brainstorming`** | **需求澄清與設計探索**：在寫代碼前探索架構方案、釐清邊界，產出 Spec。內建 Visual Companion 瀏覽器即時設計審查。 | 啟動任何新功能或大改版前，防止 AI 直接衝進去寫 code。 |
| 2 | **🚀 規劃與設計** | **`writing-plans`** | **實作計畫拆解**：將設計規格分解為獨立可測試的原子任務清單，標註檔案契約與 Recommended Skill。 | 進行多檔案重構、複雜遷移或大型開發前，建立清晰藍圖。 |
| 3 | **💻 開發與實作** | **`executing-plans`** | **會話內計畫執行**：在當前會話中依據計畫逐步批次執行任務，並於關鍵節點進行檢查點審查。 | 不需要開多個 Subagent 時的連續計畫執行。 |
| 4 | **💻 開發與實作** | **`subagent-driven-development`** | **子代理驅動開發 (SDD)**：為各任務派發乾淨上下文的獨立 Subagent 實作，並在任務間發起雙層對抗式代碼審查。 | 推薦的複雜計畫執行方式，防止上下文污染並提高精確度。 |
| 5 | **💻 開發與實作** | **`test-driven-development`** | **測試驅動開發 (TDD)**：嚴格執行「紅燈（寫失敗測試）➔ 綠燈（最小實作）➔ 重構」循環。 | 實作邏輯複雜功能時，確保代碼隨附測試且具備回歸防護。 |
| 6 | **🔍 除錯與排查** | **`systematic-debugging`** | **系統性除錯與根因分析**：將問題拆解為可測試的假說並設計驗證實驗，徹底杜絕盲猜式亂改。 | 遇到任何報錯、異常行為或難以重現的 Bug 時。 |
| 7 | **🛡️ 品質與驗證** | **`verification-before-completion`** | **完工前證據驗證**：強制執行全專案完整測試套件、型別檢查與 Linter，確認零迴歸。 | 聲稱「修好了」或「做完了」之前，提供完工鐵證。 |
| 8 | **🛡️ 品質與驗證** | **`requesting-code-review`** | **發起代碼審查**：產生 Review Package（差異與報告），主動從架構與代碼品質等多維度進行嚴格審查。 | 完成任務或提交 PR 前，主動尋求多維度架構與品質檢查。 |
| 9 | **🛡️ 品質與驗證** | **`receiving-code-review`** | **處理審查反饋**：系統性評估審查意見、修復問題並記錄裁決理由，確保每一條 Finding 均被妥善處理。 | 收到代碼審查反饋時，進行結構化修復與記錄。 |
| 10 | **🛡️ 品質與驗證** | **`finishing-a-development-branch`** | **分支整合與收尾**：驗證通過後進行分支合併/PR、清理 Git Worktree 與刪除暫存分支，完成乾淨交付。 | 功能開發完成後，乾淨整合至主分支並清理工作區。 |
| 11 | **🌿 版本控制** | **`using-git-worktrees`** | **Git Worktree 物理隔離**：為功能開發或平行調查建立獨立工作目錄，防止檔案衝突與環境污染。 | 同時進行多個任務或多 Agent 平行除錯時。 |
| 12 | **🤖 進階調度** | **`dispatching-parallel-agents`** | **並行代理調度**：在隔離環境中同時派發多個 Subagent 平行驗證獨立假說或處理多個子任務。 | 多個測試同時失敗，需要加速並行排查根因時。 |
| 13 | **🤖 進階調度** | **`using-superpowers`** | **Superpowers 基礎紀律**：MCP 入口技能，引導 Agent 在任何任務前主動搜尋並載入對應技能規範。 | 開啟對話時自動載入，規範 AI 的行為準則。 |
| 14 | **🤖 進階調度** | **`writing-skills`** | **技能撰寫與維護**：規範如何為團隊建立、測試與封裝新的 Superpowers 技能。 | 需要擴充專屬新技能或更新既有技能時。 |

## 🆕 最近更新

### v6.3.10 (最新版)

- **全域安裝引擎鍵名衝突化解與使用者設定無損保留**：
  - 自動探索既有的 `servers`、`mcp`、`mcpServers`，防止在不同 AI Client 環境中重複建立互相矛盾的設定區塊。
  - 重新執行安裝時自動合併並無損保留使用者自訂的 `env`、`cwd`、`disabled`、`alwaysAllow` 等欄位。
  - 徹底消除 `disabled: true` 與 `enabled: true` 同時並存的矛盾無效狀態。
  - 嚴格校驗命令列引數，拒絕未預期的位置參數（結束碼 1）；全面以 `process.exitCode` 取代突兀退出，確保非同步串流完整沖刷。
- **核心技能引擎單次 Stat 快照校驗與世代隔離**：
  - 引入單次 `fs.stat` 快照校驗 (`dev`, `ino`, `size`, `mtimeMs`)，若符號連結或實體檔案遭置換立即失效快取，無需重新遍歷整個目錄。
  - `clearCache()` 採用單調遞增的 `scanEpoch` 並重設 `loadingEpoch`，杜絕慢速異步掃描在快取重設後的髒覆寫。
  - 權威描述元 Inode 校驗 (`readFileNoFollow`) 消除 TOCTOU 描述元置換競態。
- **MCP Prompt 模板健壯性與去重機制**：
  - 遇到空白或遺失模板時主動輸出結構化 `stderr` 並拋出標準 `McpError(ErrorCode.InternalError)`。
  - 以 `appliedInterpolations` 追蹤已替換標記，防止多餘參數重複追加。
- **全方位安全審計與回歸測試底線**：
  - 全套件 **292 項自動化測試斷言**（Node.js: 163 項、Bash: 35 項、PowerShell: 94 項）100% 通過，0 漏洞、0 敏感資訊外洩。

### v6.3.9

- **永久 ReDoS 防禦（CodeQL Alert #4 關閉）**：
  - 將 YAML 解析（`updateYamlConfig`）中的多項式回溯正則改為單一無歧義前綴匹配與原生 `String.prototype.trim()`。
  - 引入 `extractInlineComment` 線性掃描器（$O(N)$），徹底杜絕長空白填充下的多項式回溯；GitHub CodeQL Alert #4 (`js/polynomial-redos`) 經遠端靜態分析確認正式關閉。
  - 於 `tests/setup_test.js` 增加 60,000 字元極限空白填充壓力測試，確保線性執行耗時（<1ms）。
- **目標客戶端生態系擴充（支援 17 款 AI Agent 客戶端）**：
  - 新增 **LM Studio**（`lmstudio`，指向 `~/.lmstudio/mcp.json`）與 VS Code 桌面版 **Roo Code**（`roo`，指向 `rooveterinaryinc.roo-cline/settings/mcp_settings.json`）跨平台安裝目標。
  - 增強 YAML 解析器，在更新與移除流程中完美保留 `mcp_servers:` 與 `superpowers:` 宣告的行內註解與檔案標頭註解。
- **桌面端安全匯入工具與退出碼完整性**：
  - 提供 `setup --print-config`（支援 `--bun`）輸出純淨 MCP JSON 設定，方便 ChatWise、Cherry Studio 等桌面客戶端無副作用匯入。
  - 修正 `src/server.ts` setup 命令轉發機制，完整繼承 CLI 返回之 `process.exitCode`。
- **桌面整合指南**：
  - 新增完整文件 [`docs/desktop-setup.md`](docs/desktop-setup.md)，涵蓋 LM Studio、Roo Code、ChatWise 與 Cherry Studio 步驟指引。

### v6.3.8

- **可執行的互動式工作流啟動器**：
  - `feature-pipeline` 與 `structured-debug` 會逐階段給出明確的 `read_skill` 呼叫，保留必要的使用者核准關卡，並清楚說明流程由客戶端 Agent 執行，不是 MCP 伺服器內部自動執行。
  - 支援多 Agent 的 Host 可使用 Subagent；其他 Host 會退回會話內或序列執行，不會聲稱使用不存在的能力。
  - `read_skill` 同時接受純技能名稱與文件所載的 `superpowers:` 前綴。
  - Skill Compositions 指南已納入 npm 套件，並可透過 `guide://superpowers/skill-compositions` 讀取。
- **全域安裝引擎並行安全、Inode 防禦與符號連結跳脫隔離**：
  - **Allowed Roots 邊界隔離**：強制限制目的地路徑必須在使用者允許目錄（`homeDir`、`appData`、`localAppData`），杜絕父層符號連結跳脫攻擊。
  - **樂觀並行衝突檢測**：在原子 `fs.renameSync` 前比對磁碟檔案與 `expectedContent`，防止多行程競態覆寫較新的設定檔。
  - **目錄 Inode & Dev TOCTOU 防禦**：比對暫存檔案目錄之真實裝置與 inode 識別碼，防止目錄置換攻擊。
  - **Fail-Closed 嚴格解析防護**：JSON 根目錄或伺服器欄位非 Plain Object 時即刻拒絕，阻斷原型污染與畸形設定。
- **核心技能引擎確定性排序與動態快取驗證**：
  - **目錄確定性排序與別名衝突防禦**：目錄按字母確定性排序並即時阻擋衝突鍵名，杜絕隨機覆寫與快取錯位。
  - **自動快取驗證 (`CACHE_REVALIDATE_MS = 1000`)**：磁碟變更在 1 秒內自動同步，無需重啟 MCP 伺服器即可反映檔案編輯。
  - **大小寫折疊與真實路徑防禦**：`src/server.ts` 在 darwin/win32 進行大小寫折疊與 `fs.realpathSync` 驗證，徹底攔截系統保護目錄（`/private/etc`、`/private/var`、`C:\Windows`）。
- **RFC 6455 WebSocket 協議加固與日誌彈性壓縮**：
  - 完整支援 `CONTINUATION` (0x00) 分段訊息重組，並嚴格驗證控制幀不得分段 (`opcode >= 0x8 && !fin`)，阻絕非標準 RSV 擴展。
  - 尾部彈性日誌壓縮：日誌達 1 MB 上限時保留最新換行對齊記錄，避免整檔抹除遺失事件上下文。
  - 私有檔案描述元以 `O_RDWR | O_APPEND | O_CREAT | O_NOFOLLOW` 安全開啟。
- **Shell 與 PowerShell 腳本指令注入防禦**：
  - `find-polluter.sh` 與 `find-polluter.ps1`：指令參數陣列化展開 (`"${TEST_COMMAND[@]}"`、`& $testCommand @testCommandArgs`) 搭配含空白檔名安全讀取迴圈，杜絕 Shell 注入。
  - `sdd-workspace`：執行 `cd` 前重設 `CDPATH=''`，阻絕環境變數目錄劫持。
  - `sdd-workspace.ps1`：以 UTF-8 without BOM (`[System.Text.UTF8Encoding]::new($false)`) 寫入計畫標記，確保無損 Unicode 路徑往返。
- **全自動化回歸測試底線**：
  - 擴展測試套件至 **274 項自動化斷言全數通過**（Node.js: 145 項、Bash: 35 項、PowerShell: 94 項），維持 100% 通過率。

👉 *更多歷史版本更新紀錄，請參閱完整的 [CHANGELOG.md](CHANGELOG.md)。*

---

## 🙏 致謝

本專案是透過 fork 與改編自 [obra](https://github.com/obra) 的原始 [Superpowers](https://github.com/obra/superpowers) 專案。我們非常感謝他們在定義 Agentic 技能框架與軟體工程工作流上的開創性貢獻，這些構成了本 MCP Server 的基石。
