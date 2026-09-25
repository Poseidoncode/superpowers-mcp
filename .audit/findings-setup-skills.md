# 審計發現：src/setup-runner.ts 與 src/skills-manager.ts（已逐行驗證，合計 1730 行）

## 發現清單（依嚴重度排序）

1. **skills-manager.ts L366–418 / L452–455 / L485–492 — Medium — bug（TOCTOU／快取污染）**
   `readFileNoFollow` 讀後檢查只驗「超過上限」與 dev/ino，未驗大小/mtime 相等：
   > L414-417: `if (after.size > MAX_SKILL_FILE_BYTES || after.dev !== stat.dev || after.ino !== stat.ino)`
   L375-386 用 fd.stat 的 `actual.size` 決定讀取量（小檔 `buffer.subarray(0, totalRead)`），L418 回傳 `stat: after`。若檔案在讀取期間被同 inode 原地寫入變大：回傳前綴內容卻帶事後 stat；該 stat 存入快取（L452-455），而 L485-492 驗證（dev/ino/size/mtimeMs）全比對這份事後值 → 截斷內容永久命中，直到檔案再次變更。
   修法：L414 加 `|| after.size !== actual.size || after.mtimeMs !== actual.mtimeMs`。

2. **setup-runner.ts L646–665 — Medium — bug（吞錯）**
   > L654 `} catch (_nativeErr: unknown) {` — 原生 JSON.parse 錯誤被丟棄；
   > L657 `const sanitized = stripJsonComments(existingContent, true);` … L663 `throw new Error(\`Failed to parse existing JSON: ${err}\`);`
   只報 sanitize 後錯誤；`stripJsonComments` 刪除註解字元（L428-436 `continue` 不 push），行列號與原檔錯位，原生錯誤（最清楚）完全不可得。
   修法：錯誤訊息同時附上 `_nativeErr`。

3. **setup-runner.ts L657 / L741 / L968–995 — Medium — bug（破壞性寫入、無警告）**
   含註解的 JSONC 檔（如 kilo `settings.jsonc` L306）走 L657 fallback 解析成功後，L741 `return JSON.stringify(json, null, 2) + "\n";` → L995 寫回：使用者所有註解被靜默刪除，無警告無確認。
   修法：`sanitized !== existingContent` 時重寫前發警告，或僅在無註解時以 stringify 重寫。

4. **skills-manager.ts L111–118 vs L220 — Medium — perf（雙重指紋計算）**
   Cold path L116-118 已呼叫 `computeSkillSignature()` 比對；失敗後進掃描，L220 又算一次 `const signature = await this.computeSkillSignature();`。每次重掃固定浪費一整輪 readdir（L184）+ 每 entry 兩次序列 lstat（L192-194）。
   修法：把 cold path 指紋傳進 `internalListSkills(epoch, signature)`。

5. **skills-manager.ts L127–132 — Low — concurrency（force 不保證重讀）**
   > `if (forceReload) { this.dropContentCaches(); }` 之後緊接 `const inFlight = this.loadingPromise; if (inFlight && this.loadingEpoch === this.scanEpoch) { return inFlight; }`
   `listSkills(true)` 可能回傳啟動於 force 請求之前的掃描結果。
   修法：join 條件改 `if (!forceReload && inFlight && ...)`。

6. **skills-manager.ts L168 / L186–194 / L231 — Low — perf（指紋範圍不當 + 序列 I/O）**
   - L186 `for (const entry of entries)` 未過濾，掃描端 L231 是 `entry.isDirectory() || entry.isSymbolicLink()` → `.DS_Store` 等雜檔出現/消失即觸發不必要全量重掃。
   - L192 `kind === "l" ? await describe(skillDir) : "-"` — 一般目錄不納入指紋，與 L168 註解不符。
   - L192-194 迴圈逐筆 await（掃描端 L233 已用 `Promise.all` 平行）。
   修法：filter 成與 L231 相同候選集、`Promise.all` 並行 lstat、修正註解。

7. **setup-runner.ts L487–497 — Low — bug（合法 YAML 誤拒）**
   > L487 `const match = line.match(/^(\s*)mcp_servers:/);` — 任何縮排都算宣告
   > L492-493 `if (mcpDeclarations.length > 1) { throw new Error("Cannot safely update YAML with duplicate mcp_servers keys"); }`
   > L497 `if (declaration.indent !== "" || (declaration.tail !== "" && !declaration.tail.startsWith("#"))) {`
   其他區塊下的巢狀 `mcp_servers:`（合法 YAML）被當成重複/root 宣告而 throw。
   修法：只取 `indent === ""` 的宣告再做重複/root 檢查。

8. **setup-runner.ts L834–841 — Low — bug（備份無輪替、無上限）**
   > L836 `const backupPath = \`${targetFilePath}.${Date.now()}.bak\`;`
   全檔只有建立（L836-841），唯一 `unlinkSync` 是臨時檔清理（L873）→ 每次 `--backup` 都多一個 `.bak`，永不清理。
   修法：寫入前掃描同前綴備份、僅保留最近 N 個。

9. **setup-runner.ts L142–150 — Low — bug（win32 分支缺失）**
   devin 的 `getConfigPath: (_platform, homeDir)` 忽略 platform，一律回 `~/.config/devin/mcp.json`、`~/.codeium/windsurf/mcp_config.json`；其他 desktop target（hermes L104-114、roo L25-31、trae L363-378、copilot L67-77）皆有 win32/AppData 分支，檔案頭 L3 宣稱支援 Windows。
   修法：補 win32 分支，型式同 trae L376 `path.join(process.env.APPDATA ?? "", ...)`。

## 已驗證「無問題」的項目（供完整性參考）

- epoch/single-flight/clearCache：L139-142 `epoch = ++this.scanEpoch`、finally 僅在 `loadingPromise === currentPromise` 清理（L145-149）、L297-304 `if (scanned && epoch === this.scanEpoch)` 覆寫守衛、L501-513 clearCache 遞增世代 — 配合正確，重疊掃描無法污染快取（唯一副作用即發現 5）。
- MAX_SKILL_FILE_BYTES：L366 path-stat、L381 fd-stat、L409 chunk 上限、L415 讀後檢查 — 除發現 1 缺「大小相等」外齊全。
- readFileNoFollow TOCTOU 設計：realpath → L372 `noFollow = platform === "win32" ? 0 : O_NOFOLLOW` → L379-386 fd dev/ino 比對 → L414-417 讀後檢查；L359-365 擋越界/非一般檔；L405-410 分塊讀取無 overflow。
- parseFrontmatter（L47–96）：L53 `startsWith("---")`、L58 `/\r?\n[ \t]*---[ \t]*(?:\r?\n|$)/`、L73/L80 行內錨定正則、for-of 有界 — 無 ReDoS / 無無限迴圈。
- setup 無 ReDoS：`stripJsonComments`（L352-453）與 `extractInlineComment`（L467-474）皆線性單趟掃描。
- 離開碼正確：缺 `--target` L1119 `exitCode = 1`、結果含 error L1158、catch L1166，刻意用 `exitCode` 而非 `process.exit()`（L1156 註解）。
- allowedRoots 守衛：L815-816 `if (!rootPath) return false;` 略過空字串，L819-820 用 `path.relative` 做包含判斷正確。
- 無 sync fs 迴圈掃大量檔案、無重複讀檔：targets existsSync 每目標 ≤3 個、runSetup 單次 readFileSync（L957）、safeWrite 為 tmp+rename 原子寫（L850/L869）、CAS（L852-858）、目錄交換檢查（L860-868）、失敗清理 rethrow（L870-878）不吞錯。
- JSON/YAML 合併邏輯：L675-678 rootKey 掃描、L720-737 保留使用者欄位、L724-730 enabled/disabled、YAML remove/insert（L521-630）保留非 superpowers 行與 inline comment — 均正確。
- contentCache.set 只在 L451（readSkillContent），掃描迴圈不回填 contentCache/canonicalPathMap；L281 與 L451 均存 `body`，一致。
