# Superpowers MCP Toolpack 使用指南

[English](README.md) | [繁體中文](README.zh-TW.md)

[![版本](https://img.shields.io/badge/version-6.0.0-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
[![授權](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

本文檔總結了將原始 Superpowers 技能庫打包成獨立 MCP Toolpack 的相關資訊與使用說明。

---

## 🚀 安裝與使用方式

### 支援的環境

**Antigravity**、**Cursor**、**VSCode**，以及其他支援 MCP 工具鏈的 AI 編輯器。

### 與 AI Agent 對話

安裝或配置完成後，您的 AI Agent（例如 Copilot 或 Antigravity Cascade）將能夠識別並使用 `Superpowers Skills`。

**您可以這樣提問：**

- "列出所有 superpowers 技能"
- "使用 read_skill 讀取 brainstorming 技能，然後幫我分析這個功能的實作"
- "套用 session-start prompt"（模擬原始的啟動注入機制）

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
| `writing-plans` | 進行多檔案重構或複雜迁移前。 | 建立明確的執行藍圖。 |
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
  - **具體用法**：適用於「執行已規劃好的詳細計畫」。針對每一個小任務，AI 會派發全新的「實作代理」去寫 Code，完成後啟動合併的 **task reviewer**（規格 + 品質一次審查），並在最後執行 **whole-branch final review**（全分支最終審查）。在執行前還會進行 **Pre-Flight Plan Review**，掃描任務之間的潛在衝突。
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

### v6.0.1 (最新版)
- **安全性修復 — Reflected XSS (#2)**: 修復 `skills/brainstorming/scripts/server.cjs` 中的伺服器端反射型跨站腳本漏洞。原本 `bootstrapPage()` 使用使用者提供的 `keyFromQuery` 參數（雖已通過 `timingSafeEqualStr` 驗證），現改為使用伺服器端 `TOKEN` 常數，徹底消除使用者可控資料進入 HTML 回應的風險。行為完全不變（驗證後的值相同）。

### v6.0.0
- **同步上游 obra/superpowers v6.1.1**: 大規模同步，引入上游對所有技能的改進。
- **subagent-driven-development 流程改造**: 將原本的兩階段審查（規格 → 程式碼品質）合併為單一 **task reviewer** 子代理，並在最後增加 **whole-branch final review**。新增 **Pre-Flight Plan Review** 在執行前掃描任務衝突。新增 **Model Selection Guidance** 以最佳化成本與回合數。
- **using-superpowers 簡化**: 移除平台特定說明與 Graphviz 圖表，改為 **各平台獨立參考檔案**（新增 `antigravity-tools.md`、`pi-tools.md`，更新 `codex-tools.md`），更乾淨地支援多種 AI 環境。
- **brainstorming Visual Companion**: 改為 **just-in-time 觸發** — 不再預先詢問，只在真正需要視覺呈現時才提議。
- **型別安全與程式碼品質**: 修正 `server.ts` 中的 `Record<string,string>` 型別強轉為正確的 `typeof` 守衛。以安全的 DOM 方法取代殘餘的 `innerHTML`。移除冗餘檢查與囉嗦註解。

### v5.1.2
- **安全性強化**: 移除 `skills/brainstorming/scripts/helper.js` 中最後一個 `innerHTML` 用法，以安全的 DOM 創建方法取代 — 現在整個程式庫 zero `innerHTML`。
- **依賴安全性**: 升級 `hono` 從 `4.12.23` 至 `4.12.26`，修補 5 個安全公告，包括 CORS origin reflection、Lambda body-limit bypass 和 Set-Cookie header merging。
- **乾淨狀態**: 所有 37 個 Dependabot 安全公告與 npm audit 警告全部解決 — 零未修補漏洞。

### v5.1.1
- **資安檢測與加固**: 進行了專案發布前的全方位安全性審查，並更新 `.gitignore` 設定以防未來潛在的金鑰與敏感環境變數檔案外洩。
- **漏洞修補 (Patches)**: 修復了 brainstorming 技能中 Visual Companion (`helper.js`) 的 DOM XSS 漏洞，將不安全的 `innerHTML` 替換為安全的 DOM 操作 API；同時將 `path-to-regexp` 套件安全升級至 `8.4.2` 以解決高風險的 ReDoS 漏洞。
- **開發依賴升級**: 將 `esbuild` 套件版本升級至 `0.28.1`。

### v5.1.0
- **輕量化行內自我審查 (Inline Self-Review)**: 在 `brainstorming` 和 `writing-plans` 中，將開銷巨大（約 25 分鐘）的子代理審查循環（Spec Review 與 Plan Review）替換為更高效的行內自我審查清單，消除子代理帶來的額外資源消耗與等待時間。
- **Git Worktree 機制重構**: 重寫了 `using-git-worktrees` 與 `finishing-a-development-branch` 技能，引入 `detect-and-defer`（檢測與委派）機制，優先委派給 AI 編輯器（如 Claude Code）的原生 worktree 工具，並能安全地 fallback 到 git 指令。
- **Token 消耗最佳化**: 移除了所有技能檔案中的 `Integration` 區塊，減少載入時的 Token 佔用，提高執行效率。
- **程式碼審查角色合併**: 將獨立的 `code-reviewer` 代理角色直接合併至 `requesting-code-review` 技能中。

### v4.3.2
- **安全性**: 修復 brainstorming Visual Companion 中的 XSS 漏洞
- **文件**: 更新 README 和 SECURITY，修正版本資訊

### v4.3.0
- 初始 MCP 伺服器實作
- 從原始 Superpowers 遷移 14 個核心技能

---

## 🙏 致謝

本專案是透過 fork 與改編自 [obra](https://github.com/obra) 的原始 [Superpowers](https://github.com/obra/superpowers) 專案。我們非常感謝他們在定義 Agentic 技能框架與軟體開發方法論上的貢獻，這些成為了這個 MCP Server 的基石。
