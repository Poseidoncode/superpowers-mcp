export * from "./setup-runner.js";
import { runSetupCli } from "./setup-runner.js";

runSetupCli().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ Fatal error: ${msg}`);
    process.exit(1);
});
