export * from "./setup-runner.js";
import { runSetupCli } from "./setup-runner.js";

runSetupCli().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ Fatal error: ${msg}`);
    // 使用 exitCode 讓標準輸出／錯誤輸出有機會完整送出後再結束行程
    process.exitCode = 1;
});
