# Superpowers MCP Toolpack 使用指南

[English](README.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

[![版本](https://img.shields.io/badge/version-6.3.3-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
[![授權](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

本文檔總結了將 Superpowers 技能庫與自主 Agent 工作流架構打包成獨立、高效能且安全加固的 **Model Context Protocol (MCP)** 伺服器之相關資訊與使用說明。

---

## 🚀 安裝與使用方式

### 支援的環境與 Agent 平台

- **MCP 原生 AI 編輯器與 IDE**：**Antigravity (AGY)**、**Cursor**、**VSCode**、**Windsurf**、**Claude Desktop / Claude Code**。
- **CLI 工具與自主代理環境**：**Devin CLI**、**Hermes Agent**、**OpenCode**、**Kimi CLI**、**Pi CLI**、**Gemini CLI**。

### 提供之 MCP 協議功能

| 協議功能 | 包含項目 | 說明 |
| :--- | :--- | :--- |
| **Tools (工具)** | `list_skills`, `read_skill` | 依需求隨時探索並載入 14 項 Superpowers 技能完整內容。 |
| **Prompts (提示詞)** | `session-start`, `sdd-implementer`, `sdd-task-reviewer`, `sdd-re-review`, `spec-reviewer`, `plan-reviewer` | 可在 IDE Prompts 列表直接選用之對抗式審查與子代理協調 Prompt 模板。 |
| **Resources (資源)** | `skill://superpowers/<skill-name>` | 提供符合 MCP 標準的 Direct URI 技能讀取協議。 |

### 與 AI Agent 對話

安裝或配置完成後，您的 AI Agent 將能夠自動識別並調用 `Superpowers Skills` 與 `Prompts`。

**您可以這樣提問：**

- "列出所有 superpowers 技能"
- "使用 read_skill 讀取 brainstorming 技能，然後幫我分析這個功能的實作"
- "套用 session-start prompt"（初始化完整的 Superpowers 工作流上下文）
- "使用 subagent-driven-development 執行 docs/plans/feature-plan.md 的開發計畫"

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

## 💡 常用技能與情境

| 技能名稱 | 社群推薦使用情境 | 核心價值 |
| :--- | :--- | :--- |
| `brainstorming` | 啟動新功能前，探索需求與設計。 | 防止 AI 直接衝進去寫 code。 |
| `writing-plans` | 進行多檔案重構或複雜遷移前。 | 建立明確的執行藍圖。 |
| `systematic-debugging` | 遇到任何報錯或行為異常時。 | 強制執行「根因分析」而非亂猜。 |
| `test-driven-development` | 實作具邏輯挑戰的功能時。 | 確保代碼隨附測試，實現 Red-Green-Refactor。 |
| `verification-before-completion` | 聲稱「修好了」或「做完了」之前。 | 證據導向的完工確認。 |

---

## 🔄 推薦的指令 (Command Sequences)

### 1. 新功能開發
1. 「用 read_skill 讀取 brainstorming 技能，確認需求與架構。」
2. 「用 read_skill 讀取 writing-plans 技能，建立具體的實作步驟。」
3. 「用 read_skill 讀取 test-driven-development 技能，以 TDD 方式實作功能。」
4. 「用 read_skill 讀取 verification-before-completion 技能，跑測試確認一切正常。」

### 2. 緊急修復 (Hotfix)
1. 「用 read_skill 讀取 systematic-debugging 技能，定位目前問題的根因。」
2. 「用 read_skill 讀取 test-driven-development 技能，寫一個失敗測試再修復它。」
3. 「用 read_skill 讀取 verification-before-completion 技能，驗證修復結果。」

---

## 📋 支援技能總覽 (共 14 個)

為了解決技能太多難以選擇的問題，我們將這 14 個技能依照軟體開發的 6 個階段進行了分類：

### 🚀 1. 規劃與設計 (Planning & Design)
- `brainstorming`: 軟體設計與需求分析流程
  - Visual Companion 瀏覽器視覺化設計審查工具（just-in-time 觸發）
- `writing-plans`: 建立詳細的實作計畫

### 💻 2. 開發與除錯 (Implementation & Debugging)
- `executing-plans`: 執行已建立的實作計畫
- `test-driven-development`: TDD（測試驅動開發）工作流
- `systematic-debugging`: 系統性除錯與根因分析

### 🛡️ 3. 品質驗證與審查 (Quality & Review)
- `verification-before-completion`: 完工前的證據導向驗證
- `requesting-code-review`: 發起程式碼審查的預先檢查
- `receiving-code-review`: 接收與處理程式碼審查回饋
- `finishing-a-development-branch`: 收尾開發分支與整合

### 🌿 4. 版本控制 (Version Control)
- `using-git-worktrees`: 使用 Git Worktrees 管理多重分支

### 🤖 5. 代理進階控制 (Advanced Agent Controls)

這是特別針對在支援多重代理 (Multi-Agent) 協作或具備強大推論能力的 IDE（如 Antigravity 或 Cursor）中所設計的高階操作技巧。

- **`subagent-driven-development`**: 驅動子代理執行複雜任務
  - **具體用法**：適用於「執行已規劃好的詳細計畫」。針對每一個小任務，AI 會派發全新的「實作代理」去寫 Code，完成後啟動合併的 **task reviewer**（規格 + 品質一次審查），並在最後執行 **whole-branch final review**（全分支最終審查）。在執行前還會進行 **Pre-Flight Plan Review**，掃描任務之間的潛在衝突。計畫在 plan-scoped 工作區（`.superpowers/sdd/<plan>/`）執行；控制器對衝突直接裁決並記錄於 ledger（rulings），不再停擺等待；相同形狀的小任務會批次合併為單次派發。
  - **模型選擇**：根據任務複雜度選擇子代理模型 — 機械性工作用低成本模型，架構設計與細微併發變更需要強大模型。
  - **指令範例**：「用 read_skill 讀取 subagent-driven-development 技能，然後依照 docs/plans/feature-plan.md 的內容逐一派發子代理實作。」
- **`dispatching-parallel-agents`**: 派發平行代理同步執行任務
  - **具體用法**：適用於「同時處理多個互不干擾的獨立問題」（例如 3 個無關聯的 Bug，或 3 個獨立的網路查詢需求）。AI 會切換為平行處理的思維模型，將各個問題視為獨立專案同時處理，避免記憶混亂（Context 污染）並加速多任務產出。
  - **偵錯範例**：「用 read_skill 讀取 dispatching-parallel-agents 技能，然後派發 3 個平行代理去分別排查 A、B、C 三個獨立測試報錯。」
  - **查詢範例**：「用 read_skill 讀取 dispatching-parallel-agents 技能，然後平行查詢 React 19 新特性、Vue 3.5 更新重點、Svelte 5 的 Runes 系統，各自獨立摘要。」

### ⚙️ 6. 系統與自定義 (Meta & Customization)
- `using-superpowers`: Superpowers 核心操作指南與自我檢查
- `writing-skills`: 撰寫與擴充新的自訂技能

---

## 🆕 最近更新

### v6.3.3 (最新版)

- **MCP 標準 Prompts 支援 (`src/server.ts`)**：
  - 實作標準 Prompt 處理常式，註冊 6 組常用 Prompts（`session-start`、`sdd-implementer`、`sdd-task-reviewer`、`sdd-re-review`、`spec-reviewer`、`plan-reviewer`），可直接於 IDE Prompt Picker 中選用。
- **多 Harness 參考對應表**：
  - 新增 Devin CLI（[`references/devin-tools.md`](skills/using-superpowers/references/devin-tools.md)）與 OpenCode（[`references/opencode-tools.md`](skills/using-superpowers/references/opencode-tools.md)）之原生工具對應。
- **多語言文檔對齊**：
  - 統一各語言 README 中的 MCP 功能支援表（Tools / Prompts / Resources）與多 Harness 支援矩陣。
- **測試套件擴充**：
  - 新增 `prompts/list` 與 `prompts/get` 參數注入的自動化測試斷言。

### v6.3.2

- **writing-plans — 雙計畫形態（Two Plan Shapes）與骨架優先（Skeleton-First）**：
  - `skills/writing-plans/SKILL.md` 加入 **Two Plan Shapes** 路由機制（`task-by-task` 預設模式 vs `skeleton-first` 骨架優先），在撰寫計畫前提早決定架構模型。
  - 新增 [`skills/writing-plans/skeleton-first-plans.md`](skills/writing-plans/skeleton-first-plans.md) 定義 Walking Skeleton（Task 1 先完成貫穿所有子系統的真實薄切片）、契約式任務（Task Contracts，嚴格定義 Consumes/Produces 接口與可觀測驗收標準，不預寫代碼腳本）與 `Tier: mechanical | judgment` 標記。
- **subagent-driven-development (SDD) — 波次派發（Wave Dispatch）與並行工作樹協議**：
  - 控制器在衝突掃描階段針對 skeleton-first 計畫生成 **DISPATCH PLAN**，將檔案互斥且無未完成介面依賴的任務組成波次並行派發。
  - **並行工作樹協議（Parallel Worktree Protocol）**：並行任務各於專屬 `.worktrees/task-<N>` 執行，按計畫順序依次合併；若遇衝突或驗證失敗，自動 rebase 並喚醒 implementer 自行修復。
  - Step 5 增加完工後的 `Plan holds` / `Amendment:` 檢查行，確保並行在途任務順利收斂，並將介面變動直接傳遞給後續任務。
- **SDD — Tier 驅動模型分派**：
  - SDD 控制器與 `implementer-prompt.md` 嚴格遵循計畫中的 `Tier:` 標記（`mechanical` → 快速經濟型模型；`judgment` → 標準中階模型），大幅節省 token 且不再重複審議。
- **writing-skills — 二進位安全加固（`render-graphs.js`）**：
  - 改用 `execFileSync('dot', ['-Tsvg'], ...)` 徹底杜絕 shell 注入，設置 10MB 緩衝上限，支援 Windows CRLF（`\r?\n`）換行匹配與 `winget` 安裝提示。
- **測試與驗證**：MCP 協定、邊界安全、SDD Bash（11 項斷言）、PowerShell（70 項斷言）及 Graphviz 渲染測試全數 100% 通過。

👉 *更多歷史版本更新紀錄，請參閱完整的 [CHANGELOG.md](CHANGELOG.md)。*

---

## 🙏 致謝

本專案是透過 fork 與改編自 [obra](https://github.com/obra) 的原始 [Superpowers](https://github.com/obra/superpowers) 專案。我們非常感謝他們在定義 Agentic 技能框架與軟體開發方法論上的貢獻，這些成為了這個 MCP Server 的基石。
