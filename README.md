# Superpowers MCP 擴充套件使用指南

這份文件總結了將 Superpowers 改寫為 Open VSX / VSCode 擴充套件後的相關資訊與使用說明。

---

## 🏗️ 專案結構概覽

擴充套件位於 `vscode-extension/` 目錄中：

```text
superpowers-main/vscode-extension/
├── superpowers-mcp-x.y.z.vsix   ← 打包完成的擴充套件檔案，可直接安裝
├── package.json                  ← 擴充套件清單，定義了內建 MCP Server 註冊
├── src/
│   ├── extension.ts             ← VSCode/Trae/Antigravity 擴充套件啟動邏輯
│   └── server.ts                ← MCP stdio server 本體（實作 14 個 skills）
├── skills/                       ← 離線打包的技能庫（從主專案複製）
└── out/
    ├── extension.js (1.1 KB)      ← 編譯後的擴充套件邏輯
    └── server.js (325 KB)         ← 編譯後的 MCP Server
```

---

## 🚀 如何安裝與使用

### 適用環境
**Antigravity**、**VSCode (GitHub Copilot)**、**Trae** 等支援 VSCode Extension API 的編輯器。

### 安裝步驟 (VSIX)
1. 在編輯器中打開 **Extensions** 側邊欄。
2. 點擊右上角的三個點 `...` 或齒輪圖示，選擇 **Install from VSIX...**。
3. 選擇 `superpowers-mcp-x.y.z.vsix` 進行安裝。
4. 安裝後系統會自動啟動內建的 MCP Server。

### 在 AI Chat 中對話
安裝完成後，AI Agent (例如 Copilot 或 Antigravity Cascade) 就能識別到 `Superpowers Skills`。

**你可以這樣問：**
- "列出所有 superpowers skills"
- "使用 read_skill 讀取 brainstorming skill，然後幫我分析這個功能的實作方式"
- "套用 session-start prompt" (模擬原有的啟動注入機制)

---

## 🛠️ 若平台不支援 Proposed API (手動配置)

`mcpServerDefinitionProvider` 目前是 VSCode 的 Proposed API。若你的 IDE 環境尚未支援此 API 自動註冊，請在專案根目錄手動建立 `.vscode/mcp.json`：

```json
{
  "servers": {
    "superpowers": {
      "type": "stdio",
      "command": "node",
      "args": [
        "${extensionPath}/out/server.js"
      ],
      "env": {
        "SKILLS_PATH": "${extensionPath}/skills"
      }
    }
  }
}
```

---

## 📋 支援的 Skills 一覽 (共 14 個)

- `brainstorming`: 軟體設計與需求分析流程
- `test-driven-development`: TDD 測試驅動開發流程
- `systematic-debugging`: 系統化除錯與根因分析
- `writing-plans`: 撰寫詳細的實作計畫
- `subagent-driven-development`: 驅動子代理執行任務
- `requesting-code-review`: 發起程式碼審查前置查核
- ... 以及其他共 14 個核心技能。
