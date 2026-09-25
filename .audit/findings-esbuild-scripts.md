# 審計發現：esbuild.js / scripts（已逐行驗證）

1. **esbuild.js，行 66-74、84-99｜Medium｜bug**：`chmod` 只存在於非 watch 的 `else` 分支，`--watch` 分支建完 context 後直接 `watch()` 就結束。watch 模式下 esbuild 首次建立的 `out/server.js`、`out/setup.js` 權限為 0644，因此 `"superpowers-setup": "out/setup.js"` 與 `./out/server.js` 直接執行會 EACCES。修法：把 chmod 抽成函式，掛在 `onEnd` plugin 與非 watch 建構後共用。
　證據：`await Promise.all(contexts.map((ctx) => ctx.watch()));`

2. **scripts/setup.js，行 12-19｜Medium｜bug（race）**：`existsSync(compiledRunner)` 檢查與 `execSync("node esbuild.js")` 之間無互斥；兩個並行啟動都會判定不存在而同時啟動 esbuild，交錯寫入相同 `out/*` 可能產生毀損輸出。另外只需 `out/setup-runner.js` 卻重建全部四個 target，浪費 CPU/IO。修法：只建單一 target，並以 lock 檔或 temp+原子 rename 防競態。
　證據：`execSync("node esbuild.js", { cwd: path.join(__dirname, ".."), stdio: "inherit" });`

3. **scripts/setup.js，行 12｜Low｜bug**：只有在輸出「不存在」時才建構；修改 `src/setup-runner.ts` 後執行本 wrapper 永遠載入過期的 `out/setup-runner.js`，無任何警告。修法：比較輸入與輸出 mtime，輸出較舊才重建。
　證據：`if (!fs.existsSync(compiledRunner)) {`

4. **scripts/copy-skills.js，行 13-40｜Medium｜bug**：複製是純增量的——目的目錄從不清空、也不刪除多餘檔案。來源中已刪除或改名的 skill 會永久殘留在 `skills/`，照樣被打包進 .vsix 發布，發布內容逐漸腐化且無警告。修法：複製前先 `fs.rmSync(dest, { recursive: true, force: true })`，或依 manifest 刪除多餘檔案。
　證據：`if (!fs.existsSync(to)) { fs.mkdirSync(to, { recursive: true }); }`

5. **scripts/copy-skills.js，行 38｜Low｜perf**：每次執行都無條件 `copyFileSync` 整個目錄樹，即使 size/mtime 相同也全量重寫，白白消耗磁碟 IO 並使所有 mtime 失效。修法：size 與 mtime 一致時跳過。
　證據：`fs.copyFileSync(srcPath, destPath);`

6. **esbuild.js，行 76-81（及 67-72）｜Low｜perf**：四個獨立 build/context 各自重新解析並 bundle 相同依賴；`managerConfig` 與 `setupRunnerConfig` 除 entryPoints/outfile 外完全相同。修法：相同 target 合併成單一 build 的多 entryPoints。
　證據：`esbuild.build(serverConfig),`

7. **scripts/upstream-drift.js，行 58-60｜Low｜bug（參數解析）**：取值只檢查 falsy，不檢查是否以 `--` 開頭；`--fetch --ref --json` 會把 `"--json"` 當成 ref 值，flag 被吞掉且請求錯誤的 ref，靜默比對錯誤的上游。修法：value 以 `--` 開頭時拋錯。
　證據：`const value = argv[++i];`

8. **scripts/upstream-drift.js，行 169、206、319｜Low｜bug（錯誤比較語意）**：`GET /git/trees/{ref}` 回傳的是 tree SHA 而非 commit SHA，卻存成 `commit` 並顯示為上游 commit；`git show <sha>` 對不上。修法：另取 commits 端點，或改標示為 tree。
　證據：`return { commit: parsed.sha || "", files, source, truncated: Boolean(parsed.truncated) };`

9. **scripts/upstream-drift.js，行 306-324、330-335｜Medium｜bug（不正確比較）**：tree truncated 時 `classifyDrift` 仍拿不完整清單計算——baseline 檔案被誤判 `removed`、driftCount 虛高（假陽性），或漏 adopted 檔案時印「No drift」假陰性。資料本身錯誤易被 CI 誤用。修法：truncated 時置空 `removed` 或標記 `partial: true` 拒絕輸出確定性結論。
　證據：`const drift = classifyDrift(baseline.files, tree.files, ignored);`

10. **scripts/upstream-drift.js，行 254-303｜Low｜bug（吞掉 --json）**：`--record` 路徑完全忽略 `opts.json`，一律輸出人類可讀文字；`--record --json` 的 CI 流程拿到非 JSON 輸出解析失敗（`--fetch` 卻支援），介面契約不一致。修法：record 結束前若 `opts.json` 輸出 JSON。
　證據：`console.log(\`Tracked upstream skill files: ${tracked}\`);`

11. **scripts/upstream-drift.js，行 272｜Low｜bug（非原子寫入）**：baseline 直接 `writeFileSync` 覆寫；寫入中被殺會留下截斷 JSON，之後一般模式 `readBaseline` 拋錯 exit 2，而下一次 `--record` 又當「No usable baseline yet」靜默重建，損壞被掩蓋。修法：temp 檔 + `fs.renameSync` 原子取代。
　證據：`fs.writeFileSync(BASELINE_PATH, JSON.stringify(recorded, null, 2) + "\n", "utf-8");`
