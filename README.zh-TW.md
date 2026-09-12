# Superpowers MCP Toolpack 使用指南

[English](README.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

[![版本](https://img.shields.io/badge/version-6.3.7-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
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
| **Resources (資源)** | 14 項技能 Direct URI | `skill://superpowers/<skill-name>`（支援 MCP 協議標準資源直讀） |

### 與 AI Agent 對話（基礎操作）

安裝或配置完成後，您的 AI Agent 將能夠自動識別並調用 `Superpowers Skills` 與 `Prompts`。

**基礎互動範例：**
- **初始化工程規範**：「套用 `session-start` prompt」（注入 Superpowers 技能體系與工程紀律）
- **查詢所有可用技能**：「列出所有 superpowers 技能」
- **載入單一技能**：「使用 `read_skill` 讀取 `brainstorming` 技能並幫我分析需求」

---

## ⚡ 快速全域一鍵設定 (Targeted One-Click Setup)

為了讓您在最短時間內啟用 Superpowers，我們提供了**精確指定、尊重環境隱私、杜絕批量侵入**的跨平台一鍵安裝工具。

> [!NOTE]
> **可在系統任何目錄下直接執行**：您不需要預先切換到特定專案目錄，也無須 clone 本儲存庫。在終端機的**任意目錄**皆可直接執行以下指令！安裝程式會自動鎖定您系統中的全域設定檔（以使用者家目錄為基準），一次設定、全域與所有專案皆可自動生效。

> [!TIP]
> **透明與零污染保護原則**：Superpowers 絕不會像惡意軟體般擅自全域掃描或批量改寫您未指定的其他編輯器。您使用哪一款 AI 工具，就執行該工具的專屬一鍵指令，完全透明、可控且安全無損（採用**原子寫入技術**，保證斷電不壞檔，且**預設零磁碟垃圾殘留**，不隨意產生 `.bak`，亦絕不影響原有其他 MCP 伺服器）。

### 1. 選擇您的 AI Agent / 編輯器（一鍵精準設定）

請依據您使用的客戶端，在終端機複製並執行對應指令：

| Harness / 客戶端 | 支援 OS | 專屬一鍵設定指令 | 全域設定檔路徑 |
| :--- | :--- | :--- | :--- |
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

當執行多步驟的複雜任務時，請直接使用以下**一鍵端到端工作流**，AI 會自動按標準工程步驟引導（詳見完整指南：[`docs/skill-compositions.zh-TW.md`](docs/skill-compositions.zh-TW.md)）：

### 1. 端到端新功能開發管線 (Feature Development Pipeline)
```
brainstorming ➔ writing-plans ➔ using-git-worktrees ➔ subagent-driven-development (TDD) ➔ verification-before-completion ➔ requesting-code-review ➔ finishing-a-development-branch
```
- **一鍵指令：**「請套用 `feature-pipeline`，幫我開發 [新功能名稱]」
- **流程特色：** 需求確認 (Spec) ➔ 任務拆解 (Plan) ➔ Worktree 隔離 ➔ 獨立 Subagent + TDD 實作 ➔ 全套測試驗證 ➔ 專家代碼審查 ➔ 分支收尾。

### 2. 結構化多點除錯管線 (Structured Troubleshooting Pipeline)
```
systematic-debugging ➔ using-git-worktrees ➔ dispatching-parallel-agents ➔ test-driven-development ➔ verification-before-completion ➔ requesting-code-review ➔ finishing-a-development-branch
```
- **一鍵指令：**「請套用 `structured-debug`，幫我排查這個報錯：[貼上錯誤訊息]」
- **流程特色：** 根因分析拆解假說 ➔ Worktree 隔離平行排查 ➔ 多 Agent 驗證 ➔ 編寫失敗測試並修復 ➔ 全套迴歸驗證 ➔ 審查結果解決 ➔ 分支合併收尾。

### 3. 動態技能導引 (Dynamic Workflow Guide)
- **一鍵指令：**「請套用 `skill-composition`，我目前的情境是 [重構/遷移/接手舊專案]」
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

---

## 🔧 與上游保持同步

本 fork 以逐批審閱的方式引進上游 [`obra/superpowers`](https://github.com/obra/superpowers) 的技能內容；最後同步時的上游 blob SHA 記錄在 [`tests/upstream-sync-baseline.json`](tests/upstream-sync-baseline.json)。

```bash
npm run drift                    # 對比基線與上游，列出已變動項目
npm run drift:record             # 審閱同步完成後更新基線
node scripts/upstream-drift.js   # 離線：基線完整性 + 本地覆蓋率
```

報告會分別列出：上游變更、上游新增、上游移除、基線追蹤但本地缺漏的檔案，以及 fork 專屬新增。刻意不採用的上游技能會列為「待決策」而非 drift，並可用 `npm run drift:record -- --ignore <skill>` 記錄。當已引進的上游檔案被刪除、或某技能失去上游系譜時，`npm test` 會失敗。若 GitHub tree 回應遭截斷，報告模式會標示結果不完整並停用 `--fail-on-drift`；record 模式則直接拒絕寫入，避免不完整清單覆蓋最後一份完整基線。

## 🆕 最近更新

### v6.3.7 (最新版)

- **上游同步 — 第 1–3 批（obra/superpowers）**：
  - **技能自動路由**：`systematic-debugging` 與 `test-driven-development` 的 description 新增觸發詞（`"tdd"`、`"systematic debug"` 等）與兄弟技能交叉導引，提升 MCP 客戶端的技能選擇準確度。
  - **無測試指令的證據律**：`verification-before-completion` 新增「When There Is No Test Command」章節：報告、研究、稽核與書信類工作必須重新開啟成品、逐項證明並誠實列出未完成項，只能宣稱「完整」而非「正確」。
  - **Brainstorming 意圖閘門**：新增「Establish Shared Understanding」（探索意圖 → 回寫理解 → 帶入設計），並重寫 HARD-GATE 明列各路徑前置條件，禁止把單次核准當成跳過後續階段的許可。
  - **規劃交接審查（Planning-Handoff Review）**：brainstorming 的規格自我審查升級為 0.0–9.9 評分 + burden ledger + 單次有界改進 + 唯讀複評，並具備失敗時還原初稿的保底規則。
  - **已存計畫審閱與情境化交接**：`writing-plans` 要求人類先審閱存檔計畫才可執行；未指定執行方式時必須給出針對本計畫的推薦，而非固定預設。
  - **計畫勾選簿記**：`executing-plans` 與 `subagent-driven-development` 在完成訊息中同步勾選計畫檔步驟。
  - **遠端安全邊界**：`using-git-worktrees` 要求從共享 ref 開分支時必須加 `--no-track`，並以 `git branch -vv` 檢查追蹤狀態（首次 commit 前先 `--unset-upstream`）；`executing-plans` 要求 commit 保持本地、禁止改寫共享分支；implementer 遇到任何 push 需求一律回報 BLOCKED，不得自行推送。
  - **Discoveries 帳本**：SDD 進度帳本新增 `## Discoveries` 區段，跨任務發現可穿越 compaction，並成為下一次派工介面條款的來源。
  - **延後發現匯出**：刪除計畫工作區前，`Ruling:`／`minor (deferred)`／`parked` 行必須匯出到 PR 的「Deferred items」清單，或提交至 `docs/superpowers/follow-ups/<plan>.md`。
  - **Greenfield SDD Scripts**：repo 尚未建立時 `sdd-workspace` 退回當前目錄（`.ps1` 同步支援），`review-package` 則在非 repo 環境下給出可行動的錯誤。
  - **TDD 特徵化守門**：行為保持型重構的五步程序（先變異、確認失敗、由 VCS 還原、維持綠燈），並從邊界與變異檢查章節交叉引用。
- **上游內容同步 — 第 4 批**：brainstorm 啟動腳本改由 `BRAINSTORM_HOST`/`BRAINSTORM_URL_HOST` 決定 host（`--host`/`--url-host` 仍優先）、`writing-skills` 新增搬移內容時的連結重解指引，SDD 審查者改為把完整報告寫入 `…/task-N-review.md` 並只回傳少於 15 行摘要 — MCP 端新增 `review_file` 參數（若要求的路徑正規化後等於報告或 brief 檔，改用推導出的 `-review.md`），以及讓 `[FIX_BASE_SHA]` 真正被代入的 `fix_base_sha` 別名。
- **上游 drift 報告**：`npm run drift` 以已提交的上游基線比對 `obra/superpowers`，列出已採納檔案的變動、本地缺漏的引進檔案與 fork 專屬新增；`npm run drift:record -- --ignore <skill>` 於審閱同步後更新基線，且會在寫入前拒絕遭截斷的 API tree。
- **MCP 表面覆蓋率測試**：磁碟上的每個 skill 都必須是對外曝露、且讀出內容屬於該 skill 的 MCP resource，prompt 清單必須與 4 個 README 完全一致。
- **MCP 描述保真**：上游的跳脫引號格式改為未加引號的 YAML plain scalar，確保 `SkillsManager` 經 MCP 輸出時不會出現多餘反斜線。
- **回歸防護**：`tests/upstream_sync_test.js` 增至 22 項標記檢查（涵蓋第 1–4 批）；全測試套件通過（8 個 npm 套件共 139 項檢查、PowerShell 90 項斷言、SDD 16 + host 預設 11 + render-graph 8 項 bash 斷言）。
- **發佈前強化**：Bash 與 PowerShell 的 brainstorm host 測試明確強制 background 模式，讓完整 264 項驗證在 `CODEX_CI=1` 下也能正常結束；`package-lock.json` 已同步至 v6.3.7 與 Node `>=18`；npm repository 與 CLI `bin` metadata 已正規化，並經 `npm publish --dry-run` 與打包安裝 smoke test 驗證。

### v6.3.6

- **極致效能躍升優化 (2x~8.1x 加速)**：
  - **並行技能索引與快取前置**：`SkillsManager.listSkills` 升級為非同步並行目錄遍歷 (`Promise.all`) 搭配根目錄預解析快取，冷啟動技能索引延遲由 4.79ms 銳減至 2.35ms（**2.04x 速度提升**）。
  - **極速記憶體 Canonical 快取**：針對 `readSkillContent` 引入以實體真實路徑為鍵的 Canonical 快取與別名映射機制，二次技能讀取由 0.013ms 驟降至 1.6µs（**8.1x 速度提升**）。
  - **Frontmatter 切片與 ReDoS 防護**：`parseFrontmatter` 改以 64 KB 前綴緩衝區局部切片取代全檔正則匹配，徹底消除大檔案 GC 停頓與二次方 ReDoS 風險。
  - **JSON 解析高速直通路徑**：在 `stripJsonComments` (`src/setup-runner.ts`) 引入原生 JSON 嘗試，無註解設定檔讀取速度提升至 0.55µs（**5.1x 速度提升**）。
  - **並行多目標打包編譯**：`esbuild.js` 採用 `Promise.all` 並行編譯 4 大產物，全專案打包時間降至 ~50ms（**~42% 速度提升**）。
- **雙子 Subagent 深度 Code Review 與全面缺陷加固 (FIX ALL)**：
  - **Partial-Read 緩衝區截斷防禦**：`SkillsManager.readFileNoFollow` 實作累加式讀取迴圈（`while (totalRead < fileSize)`），杜絕高併發磁碟 I/O 或虛擬檔案系統下的無聲截斷。
  - **Scan Epoch 並發版本防護**：`listSkills` 引入遞增的 `scanEpoch` 代數計數器，防止背景慢速掃描覆寫較新的快取狀態。
  - **Canonical 快取一致性保證**：以實體真實路徑 (`realFilePath`) 為核心鍵值並透過 `canonicalPathMap` 維護別名映射，徹底消除符號連結別名的快取漂移 (Cache Drift)。
  - **系統黑名單防禦擴展**：`getSafeSkillsPath` 補齊 macOS `/private/etc` 與 `/private/var`，杜絕攻擊者透過環境變數逃逸至敏感系統目錄。
  - **設定檔寫入符號連結逃逸防禦**：`safeWriteConfig` 在寫入前透過 `fs.lstat` 與真實路徑解析，嚴格拒絕指向敏感系統路徑的符號連結偽造寫入。
  - **嚴格 TypeScript 與 Rule 7 零瑕疵合規**：徹底清理廢棄死代碼（`exists` 私有方法），全面通過 `--noUnusedLocals --noUnusedParameters`，並消除全專案所有無型別/空白 catch 區塊。
- **自動化測試套件擴充與基準回歸**：
  - 全套件 85 項核心單元/端到端測試與 174 項回歸斷言 100% 通過（包含 `setup_test.js` 33 項測試全部通過），並產出 [`SECURITY.md`](SECURITY.md)、[`tests/code_review_report.md`](tests/code_review_report.md) 與 [`tests/performance_optimization_report.md`](tests/performance_optimization_report.md)。
- **多語系文檔全面對齊**：
  - 4 語系 README（[`README.md`](README.md)、[`README.zh-TW.md`](README.zh-TW.md)、[`README.ja.md`](README.ja.md)、[`README.ko.md`](README.ko.md)）同步支援環境清單、效能指標與一鍵指令表格。

👉 *更多歷史版本更新紀錄，請參閱完整的 [CHANGELOG.md](CHANGELOG.md)。*

---

## 🙏 致謝

本專案是透過 fork 與改編自 [obra](https://github.com/obra) 的原始 [Superpowers](https://github.com/obra/superpowers) 專案。我們非常感謝他們在定義 Agentic 技能框架與軟體工程工作流上的開創性貢獻，這些構成了本 MCP Server 的基石。
