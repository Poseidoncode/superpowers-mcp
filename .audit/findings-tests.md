# 審計發現：tests/*（測試缺陷與效能）

1. **tests/mcp_coverage_test.js:80–124｜High｜test-gap**：server 子程序只有 `error` 處理器（L82），沒有 `exit`/`close`；20 秒 watchdog 又被 `unref()`（L124）。server 中途結束時 pending request 永不 settle，event loop 清空後 Node 以 exit 0 結束——L291 的 `failures.length > 0` 永遠不執行，測試靜默通過。修法：註冊 `server.on("exit", …)` 未完成即 `process.exit(1)`；移除 `watchdog.unref()`。
> `    watchdog.unref();`

2. **tests/run_test.js:178–183｜High｜test-gap**：`close` handler 只在 `code !== 0 && code !== null` 時失敗。server 以 code 0 中途結束時後續斷言不執行，watchdog 又 `unref()`（L13–18），程序 exit 0——後半段測試（含 L151 起 id 7 檢查）被跳過仍算通過。修法：close handler 加 `finished` 旗標，未完成一律 `process.exit(1)`。
> `    if (code !== 0 && code !== null) {`

3. **tests/setup_test.js:896–905｜High｜test-gap**：symlink 保留測試的 `assert.ok(fs.lstatSync(symlinkPath).isSymbolicLink(), …)`（L899）與「真的更新目標檔」斷言（L901）都寫在 `try` 內，`catch` 統一印「restricted OS 跳過」且不計 failed。非受限 OS 上若 symlink 被覆寫成實體檔（回歸），斷言失敗被吞掉照樣過。修法：只把 `fs.symlinkSync` 放 try 並只 catch EPERM/EACCES，斷言移出 try。
> `            console.log("  ℹ️ Symlink creation skipped on restricted OS");`

4. **tests/prompts_compositions_test.js:13–18, 26–31｜Medium｜test-gap**：同型漏洞——`exit` 只在 `code !== 0` 時 fail，watchdog `unref()`（L31）。server 以 code 0 提前退出時 pending 請求懸空、剩餘 prompts 檢查被跳過且不算失敗。修法：完成前收到 exit（不論 code）即 `process.exit(1)`，或取消 `unref()`。
> `    if (code !== 0 && code !== null) {`

5. **tests/setup_test.js:1061–1064｜Medium｜test-gap**：CLI 端對端測試在 `out/server.js` 不存在時只印 SKIP 並 `passed++` 後 return。CLI 退出碼契約（L1068 起）完全沒驗證卻顯示全數通過，建置缺失掩蓋回歸。修法：SKIP 單獨計數並警示（或計為失敗）。
> `            console.log("  ⏭️  SKIP: out/server.js not built");`

6. **tests/setup_test.js:126–130（另見204）｜Medium｜perf**：ReDoS 防護以單次牆鐘 `elapsed < 100`ms 斷言，無 warmup、無多次取樣。CI 高峰誤報 flaky，門檻太寬也測不出真實退化。修法：3–5 輪取中位數 + warmup，或用操作次數漸進比值。
> `    assert.ok(elapsed < 100, \`ReDoS payload took ${elapsed}ms, must be < 100ms\`);`

7. **tests/perf_benchmark.js:15–25｜Medium｜perf**：冷路徑基準直接跑20 次取平均，無 warmup。首批迭代混入 V8 JIT 與 OS/FS cache 冷啟動成本，單一 `performance.now()` 差值對毫秒級操作放大噪聲，平均不穩定也不可跨機器比較。修法：丟棄2–3 輪 warmup，正式輪取中位數。
> `    const coldRuns = 20;`

8. **tests/perf_benchmark.js:101｜Medium｜bug**：基準錯誤只被 `console.error` 接住，`runBenchmark()` 拋錯（out/ 未建置等）時程序仍 exit 0，CI 無從得知基準沒跑。修法：`runBenchmark().catch((err) => { console.error(err); process.exit(1); });`
> `runBenchmark().catch(console.error);`

9. **tests/brainstorm_server_test.js:346–349｜Medium｜test-gap（race）**：送大事件後固定等800ms，再用 `existsSync ? size : 0` 讀 events 檔；server 未寫入時 `eventsSize` 為0，`eventsSize <= 1MiB` 恆真——上限驗證在慢機器上完全空過。修法：輪詢等 events 檔出現且大小穩定再斷言，檔不存在判失敗。
> `            const eventsSize = fs.existsSync(eventsFile) ? fs.statSync(eventsFile).size : 0;`

10. **tests/brainstorm_server_test.js:363｜Medium｜perf**：建1MiB 種子的迴圈每輪以 `Buffer.byteLength(seeded + fillerLine + recent)` 重建整串再比較——每輪拷貝整個目前已成長的 ~1MiB，約1 萬輪即 O(n²) 數 GB 拷貝，單測耗時數秒起跳。修法：維護 running byte 計數。
> `        while (Buffer.byteLength(seeded + fillerLine + recent) < 1024 * 1024 - 100) seeded += fillerLine;`

11. **tests/brainstorm_server_test.js:506–507｜Medium｜test-gap**：無法建 symlink 權限時直接 `report(..., true)`——「拒絕 symlink token file」安全斷言被當通過。skip-as-pass 讓測試在受限環境永不失敗。修法：第三態 `report(name, "skipped")` 不計 passed。
> `        report("symlinked token file rejected (skipped: no symlink privilege)", true);`

12. **tests/mcp_coverage_test.js:121–122｜Low｜bug**：watchdog 回調內兩行完全相同的 `process.exit(1);`，第二行永不可達死碼。
```
        process.exit(1);
        process.exit(1);
```

13. **tests/run_test.js:106｜Low｜test-gap**：`prompts/list` 只檢查 `length >= 6` 下界；prompt 新增、重複或改名時數量7+ 仍通過，介面漂移偵測不到。修法：`deepStrictEqual` 排序後名稱陣列。
> `... && response.result.prompts.length >= 6) {`

14. **tests/setup_test.js:22–31｜Low｜test-gap**：收集器 `it()` 同步執行 `fn()` 不檢查回傳值；未來 async 用例的 reject 逃過 catch，失敗被當通過。修法：await 或偵測 Promise。
> `        fn();`

15. **tests/drift_test.js:186–191｜Low｜test-gap**：宣稱驗證「offline mode 端到端」，但既無 `--offline` 也未隔離網路（繼承 `process.env`），只斷言輸出含字串；offline 行為失效仍通過。修法：明確傳 offline 參數並封網/spy fetch 驗證。
> `    const output = execFileSync("node", [path.join(ROOT, "scripts/upstream-drift.js")], { encoding: "utf-8" });`

16. **tests/edge_cases_test.js:179, 234, 275｜Low｜perf**：三個測試各固定 `await` 1100–1200ms 等1秒 TTL 過期，串行疊加至少 +3.5 秒牆鐘，且 TTL 改長時靜默變 flaky。修法：輪詢條件（每50ms 檢查直到生效），上限由 TTL 常數推導。
> `            await new Promise((resolve) => setTimeout(resolve, 1200));`
