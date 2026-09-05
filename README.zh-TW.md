# Superpowers MCP Toolpack 使用指南

[English](README.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

[![版本](https://img.shields.io/badge/version-6.3.4-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
[![授權](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

本文檔總結了將 Superpowers 技能庫與自主 Agent 工作流架構打包成獨立、高效能且安全加固的 **Model Context Protocol (MCP)** 伺服器之相關資訊與使用說明。

---

## 🚀 安裝與使用方式

### 支援的環境與 Agent 平台

- **MCP 原生 AI 編輯器與 IDE**：**Antigravity (AGY)**、**Cursor**、**VSCode**、**Windsurf**、**Claude Desktop / Claude Code**。

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

## 🛠️ MCP 配置

將以下設定加入您的 IDE（例如 Cursor, Antigravity, 或 VSCode 的 MCP 設定）。

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
systematic-debugging ➔ using-git-worktrees ➔ dispatching-parallel-agents ➔ test-driven-development ➔ verification-before-completion ➔ requesting-code-review
```
- **一鍵指令：**「請套用 `structured-debug`，幫我排查這個報錯：[貼上錯誤訊息]」
- **流程特色：** 根因分析拆解假說 ➔ Worktree 隔離平行排查 ➔ 多 Agent 驗證 ➔ 編寫失敗測試並修復 ➔ 全套迴歸驗證。

### 3. 動態技能導引 (Dynamic Workflow Guide)
- **一鍵指令：**「請套用 `skill-composition`，我目前的情境是 [重構/遷移/接手舊專案]」
- **流程特色：** 針對大型重構、舊代碼防護網建立或團隊新人上手，動態推薦最佳步驟。


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

