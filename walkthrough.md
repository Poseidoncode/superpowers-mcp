# superpowers-mcp v5.1.0 升級調整 Walkthrough

本文件記錄了本次為對齊 `obra/superpowers` 最新 v5.1.0 變更所做的所有調整。

## 🌟 升級亮點與變更

### 1. 同步 14 個最新技能 (Skills) 檔案
- **輕量化行內自我審查 (Inline Self-Review)**：
  - 在 `brainstorming` 和 `writing-plans` 中，將原先會啟動 subagent 做 Spec/Plan Review 的循環流程移除。該流程在實測中會引入約 25 分鐘的額外等待，但對代碼產出品質無顯著差別。
  - 替換為行內自我審查清單 (Self-Review checklists)，幫助 AI Agent 快速在 30秒內發現並修復常見的 Placeholder 或是 API 不匹配問題。
- **Git Worktree 機制重構**：
  - 重新編寫了 `using-git-worktrees` 與 `finishing-a-development-branch`。
  - 引入 `detect-and-defer`（檢測與委派）機制。如果當前環境為 Claude Code 等內建原生 Worktree 工具的編輯器，將優先使用 native 工具 (如 `EnterWorktree` / `WorktreeCreate`)，否則安全降級 fallback 到一般的 git 指令。
  - 修正了在 Finish 階段合併、驗證、刪除 worktree 與分支的順序 (Bug #999, #940, #238)，避免合併失敗時造成的代碼遺失。
- **Token 最佳化**：
  - 移除了所有 Skills 檔案末尾的 `Integration` 區塊，大幅減少 AI Agent 載入技能時的 Token 佔用，提高對話反應效率。
- **代碼審查角色合併**：
  - 將獨立的 `code-reviewer` 代理角色合併至 `requesting-code-review` 技能中，精簡專案結構。

### 2. 專案配置與版本升級
- 將 `package.json` 中的 `version` 從 `4.3.2` 升級至 `5.1.0`。
- 將 `src/server.ts` 中的 `version` 從 `4.3.0` 升級至 `5.1.0`。
- 更新並編譯專案 (`npm run build`)，確保型別檢查 100% 通過，並輸出最新的 `out/server.js`。

### 3. 文件與 Changelog 更新
- 更新 `README.md` 和 `README.zh-TW.md` 中的版本資訊 (v5.1.0) 與 Recent Updates 更新日誌，對齊英文與中文的使用指南說明。
- 新增符合 Keep a Changelog 規範的 `CHANGELOG.md` 檔案，說明 v5.1.0 的 Added, Changed, Removed 項目。

---

## 🧪 驗證與測試

我們已透過 MCP 標準的 JSON-RPC 協議在終端機對 `node out/server.js` 進行了 StdIO 的測試：
1. **初始化測試 (Initialize)**：伺服器正確啟動，並在 response 中回傳 `version: "5.1.0"`。
2. **工具調用測試 (list_skills)**：執行 `list_skills` 成功回傳最新的 14 個 Skills 及其描述資訊。

相關驗證日誌與測試終端機截圖已保存於專案的 [tests/](file:///Users/poseidomhung/Documents/github/Infinity/superpowers-mcp/tests/) 目錄下：
- [verification_log.md](file:///Users/poseidomhung/Documents/github/Infinity/superpowers-mcp/tests/verification_log.md)
- [terminal_test_success.png](file:///Users/poseidomhung/Documents/github/Infinity/superpowers-mcp/tests/terminal_test_success.png)
