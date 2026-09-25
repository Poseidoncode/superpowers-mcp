# 審計發現：src/server.ts、src/pipelines.ts（已逐行驗證全檔）

1. **src/server.ts L722、L734｜Medium｜bug**：`sdd-re-review` 的 `baseSha = getStringArg("base_sha") || getStringArg("fix_base_sha")`，但替換表把 `[BASE_SHA]` 和 `[FIX_BASE_SHA]` 都映射到 `baseSha`。同時提供兩參數時 `fix_base_sha` 永遠被忽略，`[FIX_BASE_SHA]` 填入 `base_sha` 的值，re-review 比對錯誤的 diff 基準。修法：`const fixBaseSha = getStringArg("fix_base_sha") || baseSha;` 分開映射。
> `"[FIX_BASE_SHA]": baseSha,`

2. **src/server.ts L567–L575｜Medium｜bug（驗證漏洞）**：`getStringArg` 對超過 32KB 參數「靜默截斷」而非回傳 InvalidParams，客戶端收到被改寫的 prompt 毫無警示；`slice(0, maxLen)` 可能切在 surrogate pair 中間產生無效 UTF-16；非字串參數以 `String(val)` 靜默轉成 "[object Object]" 而非拒絕。修法：超長拋 InvalidParams；截斷避開代理對邊界；拒絕非字串。
> `return str.length > maxLen ? str.slice(0, maxLen) : str;`

3. **src/server.ts L521 vs L809–L811｜Medium｜bug（驗證漏洞）**：schema 宣告 `feature_name` 為 `required: true`，但 GetPrompt handler 從不強制——缺參數默默填 `"(Unspecified feature)"`。依賴 schema 的客戶端誤以為會被擋。修法：handler 拋 InvalidParams，或宣告改 `required: false`。
> `required: true,`

4. **src/server.ts L903｜Medium｜bug（錯誤碼）**：未知 prompt 名稱回傳 `ErrorCode.InvalidRequest`（-32600）；參數值無效應為 `InvalidParams`（-32602），-32600 誤導客戶端重試/除錯策略。修法：改 InvalidParams。
> `throw new McpError(ErrorCode.InvalidRequest, \`Unknown prompt: ${promptName}\`);`

5. **src/server.ts L1001｜Medium｜bug（錯誤碼）**：未知工具回傳 `ErrorCode.MethodNotFound`（-32601）；MCP 規範 tools/call 傳不存在工具應回 -32602 InvalidParams（方法本身存在）。修法：改 InvalidParams。
> `throw new McpError(ErrorCode.MethodNotFound, \`Unknown tool: ${name}\`);`

6. **src/server.ts L975–L976、L968｜Low｜bug（錯誤碼不一致）**：`read_skill` 缺參數用 InvalidParams（正確），「skill 不存在」卻用 InvalidRequest；且錯誤訊息中額外呼叫 `listSkills()`（快取失效時觸發目錄重掃）只為組提示字串。修法：統一 InvalidParams；清單交給 list_skills 工具。
> `ErrorCode.InvalidRequest,`

7. **src/server.ts L856｜Low｜bug（錯誤比較）**：`scenarioFocus` 以 `lower.includes("fix")` 分類——"add prefix parsing"、"suffix cache"、"renew" 等含子串的場景被誤判，推薦錯誤 Pipeline。修法：詞邊界比對 `/\bfix(ing|ed)?\b/` 或分詞精確比對。
> `if (lower.includes("debug") || lower.includes("troubleshoot") || lower.includes("bug") || lower.includes("fix")) {`

8. **src/server.ts L604–L605｜Low｜bug（吞錯誤）**：`session-start` 的 `catch (_skillErr)` 吞掉 readSkillContent 所有失敗且不寫 stderr（與 L160、L197、L993 不一致）；SKILL.md 讀不到時管理員無線索，只看到靜默降級的後備內容。修法：catch 內輸出 `_skillErr` 到 stderr。
> `} catch (_skillErr: unknown) {`

9. **src/server.ts L257｜Low｜bug（邊界 off-by-one）**：extension 剝離 regex `(\.[^./\\]*)?$` 對隱藏檔整名剝光：`reportFile = ".review"` 替換後為空，產生 `"-review.md"` 而非 `.review-review.md`，衍生錯誤 review 檔位置。修法：僅 `indexOf(".") > 0` 時才剝副檔名。
> `return \`${reportFile.replace(/(\.[^./\\]*)?$/, "")}-review.md\`;`

10. **src/server.ts L165、L92–L94｜Low｜security（防禦深度）**：resource URI regex `(.+)` 允許含 `/`、`..`，且 `decodeURIComponent` 在匹配之後執行——`%2F`、`%2E%2E` 解碼後穿透 URI 層檢查；`normalizeSkillName` 只 trim 與去前綴，不攔分隔符。目前僅靠 `skills-manager.findSkill` 名稱檢查擋住，server.ts 自身零驗證。修法：對解碼後名稱驗 `^[A-Za-z0-9._-]+$`。
> `const match = uri.match(/^skill:\/\/superpowers\/(.+)$/);`

11. **src/server.ts L33–L36｜Low｜security（TOCTOU）**：`SKILLS_PATH` 的 `realpathSync` 與危險前綴檢查只在啟動時執行一次；啟動後路徑元件被換成 symlink 指向封鎖區，後續讀取不再重驗。修法：把 canonical 前綴檢查移入每次 listSkills/readSkillContent 邊界。
> `canonical = fs.realpathSync(resolved);`

12. **src/server.ts L151｜Low｜perf（熱路徑重複 I/O）**：`resources/read` 每次請求都完整 `readFile` `COMPOSITIONS_GUIDE_PATH`，無快取——隨套件發布的靜態 docs 檔反覆讀磁碟（技能內容有 SkillsManager 快取，此處沒有）。修法：載入時讀一次或 mtime 快取。
> `const text = await fs.promises.readFile(COMPOSITIONS_GUIDE_PATH, "utf8");`

13. **src/server.ts L651｜Low｜bug（以值去重誤判）**：legacy append 以「值字串」而非 placeholder 作去重鍵（`alreadyApplied.has(taskDesc)`）；兩個語義不同參數同值時誤判已插入，跳過 `### Target Task:` 區塊造成 prompt 缺段。修法：以 placeholder 名稱組成已套用集合。
> `taskDesc && !alreadyApplied.has(taskDesc) ? ...`

14. **src/server.ts L1020–L1021 vs L1034｜Low｜bug**：L1020 註解明言 `process.exit()` 會截斷 pending stdout，setup 路徑刻意避免；但 `shutdown()` 卻直接 `process.exit(0)`，信號關機時截斷 pending 輸出，且 SIGINT/SIGTERM 同時抵達會重入執行兩次 `server.close()`。修法：一次性旗標防重入，只設定 `process.exitCode` 讓事件迴圈自然結束。
> `process.exit(0);`

15. **src/pipelines.ts（全檔）｜無 bug/perf 發現**：兩 renderer 為純字串組裝，無 I/O、無 regex、無同步阻塞；靜態 skill 名稱注入不構成注入風險。僅有重複的 stage 迴圈邏輯（風格問題，不計入）。
