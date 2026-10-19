import * as path from "path";
import { runSetupCli } from "./setup-runner.js";

// Only run on direct invocation as the `superpowers-setup` bin entry point
// (built to setup.js / installed as setup-cli.js). Without this guard,
// importing this module (e.g. from tests) would execute the CLI as a side
// effect (M6). process.argv[1] is the invoked script path; path separators
// are irrelevant since only the trailing file name is matched.
const entryScript = process.argv[1] ?? "";
const base = path.basename(entryScript).toLowerCase();
if (base === "setup.js" || base === "setup-cli.js") {
    runSetupCli().catch((err: unknown) => {
        console.error(err);
        process.exitCode = 1;
    });
}

export { runSetupCli };
