# 任務：研究 `obra/superpowers` 最新變更並調整專案

## 📋 任務描述
研究上游專案 `https://github.com/obra/superpowers` 的最新內容，評估並調整本地的 `superpowers-mcp` 專案以對齊最新版本的功能與最佳實踐。

## 🔍 上游分析 (v5.1.0 變更重點)
- [x] 研究 commit 歷史與版本異動：上游已發布 v5.1.0，包含多項重大更新。
  - **輕量自我審查 (Inline Self-Review)**: 移除了會帶來 25 分鐘額外開銷的 subagent 審查循環（Spec Review 與 Plan Review），改為行內自我審查。
  - **Git Worktree 重構**: 重新編寫了 `using-git-worktrees` 與 `finishing-a-development-branch` 技能，引入了 `detect-and-defer` 機制（優先委派給 AI 編輯器的原生 worktree 工具如 Claude Code 的 `EnterWorktree`，否則才 fallback 到 git 指令）。
  - **移除 Integration 區塊**: 移除了所有技能檔案中的 `Integration` 區塊，減少 token 消耗並提高回應效率。
  - **合併 Code Reviewer**: 將原先獨立的 `agents/code-reviewer.md` 合併進 `requesting-code-review` 技能。

## 🛠️ 執行步驟
- [x] 1. 同步上游技能檔案：
  - [x] 複製並克隆 `https://github.com/obra/superpowers` 最新 main 分支的 `skills` 目錄。
  - [x] 用最新的技能檔案覆蓋本地 `skills/` 目錄。
- [x] 2. 升級本地專案配置：
  - [x] 修改 `package.json` 中的版本號至 `5.1.0`（對齊上游主版本）。
  - [x] 修改 `src/server.ts` 中的版本號至 `5.1.0`。
  - [x] 更新 `package-lock.json`（執行 `npm install` 確保依賴一致）。
- [x] 3. 更新說明文件：
  - [x] 更新 `README.md` 中的版本資訊 (v5.1.0) 與新增功能的簡介（例如：輕量自我審查與 detect-and-defer worktrees 支援）。
  - [x] 更新 `README.zh-TW.md` 中的相關中文說明。
- [x] 4. 驗證與測試：
  - [x] 執行專案構建 (`npm run build`)，確保沒有編譯錯誤。
  - [x] 驗證 MCP Server 能夠正常啟動並讀取所有新的 skills。
- [x] 5. 保存成功證明與清理：
  - [x] 刪除臨時的克隆目錄。
  - [x] 撰寫 `walkthrough.md` 說明本次調整。
- [x] 6. 新增 `CHANGELOG.md`：
  - [x] 撰寫符合 Keep a Changelog 規範的 `CHANGELOG.md` 檔案以利 NPM 發布。
