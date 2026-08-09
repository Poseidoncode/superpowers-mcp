# 完整 Code Review、雙 Subagent 審查與資安重構驗證日誌 (Verification Log)

本文件紀錄完整 Code Review 所發掘之隱患、雙 Subagent 協作審查意見、Bug 修復與邊界測試（UTF-8 BOM、並行競態、軟連結 Symlink Traversal、URL 規範化、前綴安全目錄）之自動化測試結果。

## 🧪 測試結果

我們執行了自動化測試腳本：
1. `node tests/edge_cases_test.js`：驗證 UTF-8 BOM 檔頭、含空格/點之技能名稱、路徑遍歷企圖、軟連結 (Symlink) 跳躍防禦、並行競態鎖及快取重載清理。
2. `node tests/run_test.js`：透過 stdio JSON-RPC 2.0 通訊驗證 MCP 伺服器核心功能。

### 📥 測試輸出紀錄 (Test Output)
```text
> superpowers-mcp@6.2.1 build
> node esbuild.js --production

  out/server.js  331.0kb
  out/skills-manager.js  3.6kb
⚡ Done in 71ms
Build complete.

🧪 Starting Edge Case & Security Unit Tests...

Test 1: UTF-8 BOM frontmatter parsing & content stripping...
  ✅ Test 1 Passed!

Test 2: Search skill with spaces in name...
  ✅ Test 2 Passed!

Test 3: Path Traversal & Symlink defense in findSkill & readSkillContent...
  ✅ Test 3 Passed!

Test 4: Concurrent listSkills() calls (Race condition check)...
  ✅ Test 4 Passed!

Test 5: ForceReload clears contentCache...
  ✅ Test 5 Passed!

🎉 ALL EDGE CASE & SECURITY UNIT TESTS PASSED!

[Response] ID: 1
✅ Initialize OK
[Response] ID: 2
✅ list_skills OK
[Response] ID: 3
✅ read_skill OK (Frontmatter successfully stripped!)
--- Sample Content ---
# Skill: brainstorming

# Brainstorming Ideas Into Designs

Help turn ideas into fully formed designs and specs through natural collaborative dialogue.

Start by understanding the current project context, then ask questions one at a time to refine the idea. Once you understand what you're building, 
----------------------

🎉 ALL TESTS PASSED SUCCESSFULLY!
```

## 📋 雙 Subagent 審查意見與最終修復總覽

1. **`listSkills` 併發鎖條件比對 (Race Condition Fix)**：
   - 避免 `forceReload = true` 異步觸發時，早期完成的 `listSkills(false)` 將 `loadingPromise` 誤清空為 `null`。修復為在 `finally` 中檢查 `if (this.loadingPromise === currentPromise) this.loadingPromise = null;`。

2. **`readSkillContent` 軟連結防禦 (Symlink Traversal Fix)**：
   - 導入 `fs.realpath` 獲取磁碟實體路徑後再進行 `path.relative` 邊界比對，徹底消除軟連結導向 `/etc/passwd` 等外部敏感檔案的繞過風險。

3. **`forceReload` 同步清理內容快取**：
   - 於 `listSkills(forceReload = true)` 觸發時自動清空 `contentCache`，確保技能清單與技能檔案內容快取保持一致。

4. **`getSafeSkillsPath` 前綴相符防禦 (Prefix Check)**：
   - 將原本的完全相對黑名單改為 `unsafePrefixes.some((p) => normalized === p || normalized.startsWith(p + path.sep))`，防止設定 `SKILLS_PATH` 為 `/etc/ssh` 或 `C:\Windows\System32` 等子目錄。

5. **Resource URI 符合 RFC 3986 規範 (Percent-Encoding)**：
   - MCP Resource URIs 生成改用 `encodeURIComponent(skill.name)`，讀取時呼叫 `decodeURIComponent`，保證含空格或特殊符號之技能名稱在嚴格 Client 上不致解析失敗。

## 🔒 URL Strings 告警修復 (Alert Locations Fix)

**告警來源**：掃描器回報專案內存在外部 URL strings — `primeradiant.com`（品牌圖 + CSP allowlist）、`127.0.0.1`（loopback 綁定）、`_combined.dot`（render-graphs 輸出檔名）、ajv json-schema meta-schema `$id`（node_modules 依賴）。

**修復項目（真實可修項目）**：

6. **品牌 Logo 去第三方化 (Third-Party Dependency Removal)**：
   - `skills/brainstorming/scripts/server.cjs` 原先讓瀏覽器每次開啟 Brainstorm UI 時向 `https://primeradiant.com/brand/superpowers-visual-brainstorming-logo.png` 請求 Logo（含 `?v=<版本>` 查詢參數，等同洩漏使用者 IP/UA/版本至第三方網域）。
   - 改為伺服器本機產生內嵌 SVG（`GET /brand-logo.svg`，`BRAND_LOGO_SVG` 內聯產生，無外部資源），`SUPERPOWERS_BRAND_IMAGE_URL` 改為 `/brand-logo.svg`。
   - CSP 自 `img-src 'self' https://primeradiant.com data:` 收緊為 `img-src 'self'`（`data:` 無任何使用點，一併移除）。

**評估為誤報、不須修改**：
- `127.0.0.1`：`server.cjs`/`start-server.sh`/`start-server.ps1` 的 loopback-only 綁定，屬主動防護（非 loopback 直接拒絕啟動）。
- `https://github.com/obra/superpowers`：頁尾專案歸屬連結，非風險。
- `_combined.dot`：`render-graphs.js` 的輸出檔名樣板，不觸發網路。
- ajv/json-schema URL（`node_modules/ajv/lib/refs/data.json` 之 `$id` 等）：JSON Schema meta-schema 標準識別符，ajv 執行期不抓取遠端 schema，無法也不應修改依賴。

**新增測試**（`tests/brainstorm_server_test.js`，28 passed / 0 failed）：
- `brand logo served same-origin`（200 + `image/svg+xml`）
- `brand logo has no external URL`（不含 `primeradiant` / `https://`）
- `CSP restricts images to same-origin`（`img-src 'self'` 且無 primeradiant）
- `brand markup uses the local logo path`（頁面引用 `/brand-logo.svg`）

## 🔄 上游 (obra/superpowers) 同步調整紀錄

**背景**：與上游比對發現其 brainstorming companion 已實作 per-session key 認證與 `BRAINSTORM_TOKEN_FILE` 持久化（重啟後重用同一 key，已開啟的瀏覽器分頁 cookie 持續有效）。我們 fork 的認證模型（HttpOnly cookie + PID/instance-id 驗證）保留不動，僅移植其「token 檔案持久化」機制。

**修改**（`server.cjs` / `start-server.sh` / `start-server.ps1`）：
- `initialToken()` 來源優先序改為 `BRAINSTORM_TOKEN` env → `BRAINSTORM_TOKEN_FILE`（`.last-token`，0o600）→ 新生成並持久化（`writePrivateFile`：O_NOFOLLOW + nlink 檢查 + 0o600）。
- `--project-dir` 模式（bash + PowerShell）同時 export `BRAINSTORM_PORT_FILE` 與 `BRAINSTORM_TOKEN_FILE`；`.last-token` 與 `.last-port` 同生命週期（stop 保留、`.gitignore` 已含 `.superpowers/`）。
- 未設定 token 檔（/tmp 暫存模式）時，每次啟動仍輪換 key——原安全行為不變。

**測試更新**（30 passed / 0 failed + PowerShell 全過）：
- `token file persists the key across restarts`：兩次啟動重用同一 key，且檔案內容為合法 64-hex。
- `pre-seeded token file is honored`：預置 token 檔被原樣採用。
- `key rotates without a token file`：無 token 檔時仍每次輪換。
- PowerShell `test-brainstorming-server.ps1`：原「`.last-token` 不應存在」斷言改為「存在且等於 server-info 中的 key」。

**保留未動**（與上游差異，屬我們 fork 的強化/特色）：
- Windows PowerShell 支援（SDD `.ps1` scripts、`find-polluter.ps1`）——上游已移除，我們保留。
- helper.js 保持 cookie-based（HttpOnly，頁面腳本無法讀 key），不採上游 sessionStorage 方案。
- PID + server-instance-id 雙重驗證、`O_NOFOLLOW`/inode 比對、WS 資源上限等既有強化。

## 🔍 雙 Subagent Code Review 與修復紀錄

派出 `security-reviewer` 與 `correctness-reviewer` 兩個獨立 agent（fresh context、唯讀）平行審查上述同步調整。共識發現一項 HIGH、多項 MEDIUM/LOW，全部已修復：

**修復項目**：
1. **[HIGH] Token 檔讀取路徑未加固**（security #1 / correctness #2）：原 `initialToken()` 用裸 `fs.readFileSync` 讀取 `.last-token`（會跟隨 symlink），寫入路徑卻有 O_NOFOLLOW/nlink 檢查。已實證 symlink 指向攻擊者檔案時 key 會被採納。→ 新增 `readPrivateFile()`（lstat 拒 symlink/nlink≠1 → `O_NOFOLLOW|O_RDONLY` open → fstat identity 複查 → fd 內 `fchmod 0600`），與 `writePrivateFile` 完全對稱。
2. **[MEDIUM] path-based chmod 跟隨 symlink**（security #2）：`chmodOwnerOnly` 會改 symlink 目標的權限。→ 已刪除，權限收緊併入 `readPrivateFile` 的 fd-based `fchmodSync`。
3. **[MEDIUM] 持久化靜默失敗**（correctness #1）：`writePrivateFile` 失敗時無任何診斷（port file 有 log，token 沒有）。→ 失敗時 `console.error('Failed to write private token file:', …)`。
4. **[LOW] 過時註解**（security #5 / correctness #4）：onListen 的「Authentication is deliberately not persisted」與新行為矛盾。→ 更新為說明 port/token 持久化配對與寫入不對稱。
5. **[LOW] PS1 環境變數跨污染**（correctness #3）：`$env:BRAINSTORM_TOKEN_FILE` 在 pwsh 會話內持久，ephemeral 分支不清除會把 project token 帶進 /tmp session。→ else 分支 `Remove-Item Env:BRAINSTORM_TOKEN_FILE, Env:BRAINSTORM_PORT_FILE`。
6. **[LOW] Test 13 無 try/finally**（correctness #5）：失敗路徑會 orphan 最多 5 個 node 進程與 6 個 temp dir。→ 全區塊包入 try/finally 統一 kill + 清理。
7. **[LOW] 無負面測試**（security #6）：→ 新增 `symlinked token file rejected` 測試（key 非連結目標內容、target 未被寫入、symlink 未被破壞；Windows 無 symlink 權限時跳過）。
8. **[LOW] env 指向任意路徑**（security #4）：→ `TOKEN_FILE` 要求 `path.isAbsolute`，相對路徑直接忽略。
9. **文件**：visual-companion.md 補「刪除 `.last-token` 即強制輪換 key」的 remediation 說明。

**審查確認無回歸的部分**：loopback-only 綁定、WS Origin/RFC6455 檢查、403 流程、cookie 一致性（port+key 同步持久化）、bash/PS1 env 傳遞 parity（含 foreground/background 分支）、測試非空洞性（security reviewer 實證、correctness reviewer 矩陣 A–F）。

**最終驗證**：`brainstorm_server_test.js` 31 passed / 0 failed（含新增 symlink 測試）；`edge_cases_test.js`、`run_test.js` 全過；PowerShell 套件全過（brainstorming server 17 項，驗證 start-server.ps1 修改）。
