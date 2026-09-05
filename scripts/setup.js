#!/usr/bin/env node
/**
 * Superpowers MCP - Global Setup Forwarder Wrapper
 * Forwards calls to compiled out/setup.js (Single Source of Truth: src/setup-runner.ts)
 */

const path = require("path");
const fs = require("fs");

const compiledRunner = path.join(__dirname, "..", "out", "setup-runner.js");

if (!fs.existsSync(compiledRunner)) {
    const { execSync } = require("child_process");
    try {
        execSync("node esbuild.js", { cwd: path.join(__dirname, ".."), stdio: "inherit" });
    } catch (e) {
        console.error("Failed to build out/setup-runner.js automatically:", e.message);
        process.exit(1);
    }
}

const runner = require(compiledRunner);

module.exports = runner;

if (require.main === module) {
    runner.runSetupCli().catch((err) => {
        console.error("❌ Fatal error during setup execution:", err);
        process.exit(1);
    });
}
