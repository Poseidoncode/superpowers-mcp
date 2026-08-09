# Superpowers MCP Toolpack 使用指南

[English](README.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

[![版本](https://img.shields.io/badge/version-6.2.4-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
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

### v6.2.4 (最新版)

- **對齊上游 — brainstorm 持久化 session**：搭配 `--project-dir` 時，companion 現在會把 session 金鑰持久化到 `.superpowers/brainstorm/.last-token`（僅擁有者可讀、已列入 .gitignore），與 `.last-port` 並存並在重啟後重用——已開啟的瀏覽器分頁在重啟後依然保持連線，無需重新分享 URL。暫存 `/tmp` session 仍維持每次啟動輪換金鑰；明確設定的 `BRAINSTORM_TOKEN` env 依然優先且永不寫入檔案。若要強制輪換，請在停止伺服器後刪除 `.last-token`。
- **Token 檔讀取路徑加固**（`readPrivateFile`）：symlink 或多重連結的 `.last-token` 現在會被拒絕，不再被採納為 session 金鑰；讀取透過 `O_NOFOLLOW` fd 進行，身份複查並收緊為 0600——補上與已加固寫入路徑之間的不對稱（由獨立資安審查發現）。
- **可診斷性**：token 檔寫入失敗現在會記錄 `Failed to write private token file:`，不再靜默退化為每次啟動輪換金鑰。
- **start-server.ps1 環境衛生**：無 `--project-dir` 的暫存啟動不再繼承呼叫端 pwsh session 中殘留的專案金鑰/埠號。
- **測試**：companion 套件現為 31 個斷言——重啟後金鑰持久化、預置檔原樣採用、symlink token 檔被拒絕、無 token 檔時仍輪換；測試清理具失敗安全性（try/finally）。PowerShell 套件斷言 `.last-token` 與伺服器提供之金鑰一致。

### v6.2.3 (最新版)

- **Brainstorm Visual Companion 強化 (`server.cjs`)**：本機 loopback 限定的 HTTP+WebSocket 伺服器可安全處理檔案系統競態（content 目錄被刪除或畫面檔消失時降級為等待頁 / 404）；watcher 在目錄刪除重建後自動自癒（Linux inotify + macOS FSEvents）。WebSocket handshake 依 RFC 6455 驗證，控制訊框上限 125 bytes，並加入 idle/partial-frame deadline，滿額時淘汰最舊連線。套用 nonce CSP、每次啟動輪換金鑰、畫面/技能/事件大小上限與私有 state 檔案。
- **`/files/` double-`writeHead` 崩潰修復**（subagent review 發現）：改為先讀檔再送 headers，並以 `O_NOFOLLOW` + fd 級 `fstat` + 大小上限關閉 check-then-read 的 TOCTOU。
- **程序生命週期安全**：`start-server.sh/.ps1` 在送出訊號前先驗證 PID 確實是本 session 的 brainstorm server（server-instance-id + cmdline 檢查，與 stop-server 一致）；`stop-server.sh` 刪除暫存 session 前先做路徑正規化，`/tmp/../` 手法無法逃出暫存根目錄；相對 `--project-dir` 預先解析為絕對路徑；`server-instance-id` 改以無 BOM 寫入，Windows PowerShell 5.1 跨 shell 身份檢查不再失效。
- **SkillsManager 強化**：POSIX 上以 `O_NOFOLLOW` 讀取技能檔（關閉 symlink 置換的 TOCTOU）；重新掃描失敗時回傳最後良好快取而非污染為空；名稱含連續句點（如 `a..b`）的技能現在可被查詢——查詢純走 Map、永不觸碰檔案系統。
- **MCP 協定完善**：資源 URI 的畸形百分比跳脫回傳 `InvalidRequest` (-32600)，不再洩漏內部錯誤。
- **依賴**：以已驗證的 exact override 固定 `hono` 4.13.0、`@hono/node-server` 2.0.11、`fast-uri` 4.1.2（解決相關公告）。`npm audit`：**0 漏洞**。
- **測試套件**：`npm test` 會先建置，再執行 JavaScript 邊界/安全、MCP 流程與 companion 回歸測試。63 個斷言的 PowerShell 套件改由 `tests/powershell/run-tests.sh` 分開執行；沒有 `pwsh` 時會跳過。
- **獨立審查**：已以每次啟動輪換認證金鑰、僅限 loopback 的 HTTP、nonce CSP、有界讀取、私有 state 寫入與跨平台確定性測試，處理安全與正確性審查發現。

### v6.2.2

- **Symlink 遍歷防護**：`SkillsManager.readSkillContent()` 現在會先使用 `fs.realpath` 將路徑正規化再檢查邊界，防止透過 symlink 任意讀取檔案；`getSafeSkillsPath` 也會阻擋危險的系統目錄前綴。
- **相容性與協定**：新增 frontmatter 與技能內容的 UTF-8 BOM 支援，並依 RFC 3986 對包含空格或特殊字元的 resource URI 強制進行編碼與解碼。
- **正確性與測試**：強制重新載入現在會清除內容快取；併發重新載入的鎖定更安全；多行 YAML 描述同時接受 tab 與空格縮排；新增 `tests/edge_cases_test.js` 覆蓋這些安全性與快取行為。

### v6.2.1

- **PowerShell 腳本測試套件**：新增 `tests/powershell/`，橫跨 `sdd-workspace.ps1`、`task-brief.ps1`、`review-package.ps1`、`find-polluter.ps1` 與 brainstorm `start-server.ps1`/`stop-server.ps1` 生命週期，共 63 個 assertion。使用 `tests/powershell/run-tests.sh` 執行；未安裝 `pwsh` 時會自動跳過。
- **`stop-server.ps1` 跨平台修正**：`Get-CimInstance Win32_Process` 僅 Windows 可用，腳本現在在 Unix 上改用 `ps` 以正確檢查 server-id，macOS/Linux 不再出錯。
- **清理**：移除已無用的 `skills/using-superpowers/references/copilot-tools.md`（上游已在 v6.2.0 中刪除，本地也沒有任何引用）。

### v6.2.0
- **上游同步 obra/superpowers v6.2.0**：同步上游所有技能的改進，同時保留本地的安全性強化與 PowerShell 輔助腳本。
  - **subagent-driven-development 重構**：採用計畫範圍工作區（`.superpowers/sdd/<plan>/`），並行計畫之間的產物再也不會互相讀寫。改為可續接的 review-fix 迴圈，內建五輪熔斷機制，並新增修復後複審專用的 `re-review-prompt.md`。
  - **test-driven-development**：`testing-anti-patterns.md` 由上游的 `writing-good-tests.md` 取代。
  - **finishing-a-development-branch**：採用上游重寫版（包含與本地先前修補相同的 worktree 路徑捕獲修復；分支丟棄現在需要明確要求才會執行）。
  - **技能全面精簡**：移除多個 `SKILL.md` 中的回顧與說服性段落，降低 prompt token 佔用。
  - **gemini-tools.md**：還原為上游更新版；`visual-companion.md` 新增 Gemini CLI 啟動章節。
- **PowerShell 一致性修復**：
  - 所有 SDD `.ps1` 腳本移植到新的計畫範圍 `PLAN_FILE` 介面；`find-polluter.ps1` 移植了 bash 版的 `./` 前綴與 `**/` 收縮修復。
  - **Exit code 一致性**：修復 `$ErrorActionPreference = "Stop"` 下 `Write-Error` 變成終止錯誤、導致預期 exit code 被吞掉的問題 — 驗證失敗現正確回傳 2、找不到任務回傳 3，與 bash 腳本一致。
  - **`sdd-workspace.ps1` slug 推導**：只剝除尾端的 `.md`（與 bash `basename` 一致），不再剝除任意副檔名。
- **版本對齊**：`package.json`、`package-lock.json` 與 MCP server 握手版本現統一為 6.2.0。

### v6.0.3
- **命令注入修復**：將 brainstorming Visual Companion 伺服器 (`server.cjs`) 中 `BRAINSTORM_OPEN_CMD` 的啟動方式從 `cp.exec()` 改為 `cp.execFile()`。舊版程式會將環境變數與 URL 透過 shell 串接執行；新版改以 argv 陣列傳遞參數，徹底消除 shell metacharacter 注入風險。
- **依賴安全性 (overrides)**：在 `package.json` 中新增 `overrides` 區塊，強制設定間接依賴的最低版本：
  - `@hono/node-server`: 1.19.14 → **2.0.11** — 修復 Windows 上 serve-static 經由編碼反斜線的路徑遍歷漏洞 ([GHSA-frvp-7c67-39w9](https://github.com/advisories/GHSA-frvp-7c67-39w9))
  - `fast-uri`: 3.1.2 → **4.1.1** — 修復 IDN 正規化的主機混淆 ([GHSA-4c8g-83qw-93j6](https://github.com/advisories/GHSA-4c8g-83qw-93j6)) 與反斜線權限定界符 ([GHSA-v2hh-gcrm-f6hx](https://github.com/advisories/GHSA-v2hh-gcrm-f6hx))
  - `body-parser`: 2.2.2 → **2.3.0** — 修復無效 limit 值導致大小限制被靜默停用的 DoS 漏洞 ([GHSA-v422-hmwv-36x6](https://github.com/advisories/GHSA-v422-hmwv-36x6))
- **上游錯誤修正**：
  - `find-polluter.sh`：現在支援 `./` 前綴路徑（不只是裸路徑），並透過收縮 `**/` 模式支援頂層測試檔案
  - `finishing-a-development-branch/SKILL.md`：在 Step 5 切換目錄前預先捕獲 `WORKTREE_PATH`，修復清理階段的回歸錯誤。新增 Option 2 的 detached HEAD 推送變體

### v6.0.2
- **模組化拆分與效能提升**：
  - **職責解耦**：將檔案存取、YAML 解析與快取邏輯抽離至獨立模組 [`src/skills-manager.ts`](src/skills-manager.ts)，主程式 [`src/server.ts`](src/server.ts) 專注於 MCP 路由註冊。
  - **O(1) 雙向快取**：引入大小寫不敏感的 Map 雙向鍵值快取（以技能名與目錄名為 Key），將原本 $O(N)$ 的陣列雙重遍歷優化為 $O(1)$ 的直接讀取。
  - **非同步 I/O 管線**：全面以 `fs/promises` 代替同步磁碟操作，搭配 `Promise.all` 併發枚舉，釋放 Node.js 事件循環阻塞。
  - **Markdown 內容快取**：快取已剝離 YAML frontmatter 的技能文檔，避免工具頻繁調用時對硬碟的重複讀寫損耗。
- **安全性深度防禦**：
  - **防範 ReDoS 攻擊**：棄用非貪婪正則，重構為「逐行 Frontmatter 解析器」，規避了惡意/損壞 Markdown 導致的 CPU 回溯鎖死風險，且支援了 YAML 多行 `description` 欄位。
  - **路徑遍歷（Path Traversal）防禦**：對 `skill_name` 輸入參數使用英數白名單篩選（`/^[a-zA-Z0-9-_]+$/`）。
  - **絕對路徑防洩露**：安全捕獲原生 I/O 錯誤，隱蔽主機真實實體路徑與帳號名稱，回傳通用 `McpError`。
  - **環境路徑與指令碼加固**：檢測 `SKILLS_PATH` 防範根目錄惡意注入；修復 `esbuild.js` 在 Windows 上的 `chmodSync` 崩潰問題，並在 `copy-skills.js` 中跳過符號連結 (Symlink) 杜絕遞迴拷貝死循環。

- **上游安全更新同步**：套用來自 obra/superpowers v6.1.1 的安全加固：
  - **WebSocket 影格長度限制**：在 `decodeFrame()` 中新增 `MAX_FRAME_PAYLOAD_BYTES (10 MB)` 檢測，防止超大型影格攻擊（CWE-789）。
  - **硬連結限制**：在 `isRegularFileInsideContentDir()` 中加入 `stat.nlink !== 1` 檢測，防止透過硬連結 (Hardlink) 繞過路徑遍歷。
  - **提取 `escapeHtmlText()`**：將行內的 `escHtml` 閉包提取為可重複使用的具名函數，以確保 HTML 逸出的一致性。
  - **URL 解析重構**：抽離出 `pathnameOf()` and `queryKey()` 輔助函數，減少 `handleRequest()` 中的重複 URL 解析。
- **`review-package` 路徑解析修正**：修復 `sdd-workspace` 呼叫，改用絕對路徑解析 (`$(cd "$(dirname "$0")" && pwd)`) 以防止與工作路徑 (CWD) 依賴相關的調用失敗。
- **Windows 原生輔助腳本**：新增 Visual Companion 啟動/關閉、SDD review/task helper，以及 systematic-debugging polluter detection 的 PowerShell wrapper。
- **技能文檔改進**：
  - `subagent-driven-development`：新增 `plan-mandated` 審查指引，以處理計畫之間的衝突。
  - `writing-skills`：結合字詞測試的實證，強化「禁止撰寫步驟清單 (recipes) 技能」的指引。
  - `test-driven-development`：修正表格格式以提升清晰度。
  - `writing-skills/anthropic-best-practices`：更新圖片的 CDN 網址。
- **`helper.js` 註解對齊**：新增 4 個說明的行內註解以對齊上游文檔。保留 DOM 安全的 `showTombstone()` 實作（無 `innerHTML` 退化）。
- **清理**：移除了已廢棄的 `walkthrough.md` (v5.1.0 升級指南)。

### v6.0.1
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
