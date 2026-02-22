# Superpowers MCP Toolpack 使用指南

[English](README.md) | [繁體中文](README.zh-TW.md)

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

## 🔄 推薦工作流 (Workflow)

### 1. 新功能開發流
1. `[superpowers:brainstorm : 確認需求與架構]`
2. `[superpowers:writing-plans : 寫下具體步驟]`
3. `[superpowers:test-driven-development : 撰寫測試與實作]`
4. `[superpowers:verification-before-completion : 跑測試確認無誤]`

### 2. 緊急修復流 (Hotfix)
1. `[superpowers:systematic-debugging : 定位問題根源]`
2. `[superpowers:test-driven-development : 寫一個失敗測試重現問題，再修復]`
3. `[superpowers:verification-before-completion : 驗證修復結果]`

---

## 📋 支援技能總覽 (共 14 個)

- `brainstorming`: 軟體設計與需求分析流程
- `test-driven-development`: TDD（測試驅動開發）工作流
- `systematic-debugging`: 系統性除錯與根因分析
- `writing-plans`: 建立詳細的實作計畫
- `subagent-driven-development`: 驅動子代理執行任務
- `requesting-code-review`: 發起程式碼審查的預先檢查
- ... 以及其他 8 個核心技能。

---

## 🙏 致謝

本專案是透過 fork 與改編自 [obra](https://github.com/obra) 的原始 [Superpowers](https://github.com/obra/superpowers) 專案。我們非常感謝他們在定義 Agentic 技能框架與軟體開發方法論上的貢獻，這些成為了這個 MCP Server 的基石。
