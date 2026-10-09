#!/usr/bin/env node
/**
 * Runs every test suite and reports all failures, not just the first.
 *
 * The previous `test` script chained the suites with `&&`, so a failure in an early
 * suite skipped every later one — a green-to-red signal depended on which suite
 * broke first, and a single regression could hide most of the suite.
 */

const { spawnSync } = require("child_process");
const path = require("path");

const SUITES = [
    "tests/edge_cases_test.js",
    "tests/run_test.js",
    "tests/brainstorm_server_test.js",
    "tests/prompts_compositions_test.js",
    "tests/upstream_sync_test.js",
    "tests/mcp_coverage_test.js",
    "tests/drift_test.js",
    "tests/setup_test.js",
    "tests/executing-plans/test-task-start.sh",
    "tests/executing-plans/test-task-done.sh",
];

const results = [];

for (const suite of SUITES) {
    const started = process.hrtime.bigint();
    const run = suite.endsWith(".sh")
        ? spawnSync("bash", [suite], { cwd: path.join(__dirname, ".."), stdio: "inherit" })
        : spawnSync("node", [suite], { cwd: path.join(__dirname, ".."), stdio: "inherit" });
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    const code = run.status === null ? 1 : run.status;
    results.push({ suite, code, ms });
    if (code !== 0) {
        console.error(`\n✗ ${suite} exited ${code} — continuing so every suite still runs\n`);
    }
}

console.log("\n================ test summary ================");
for (const { suite, code, ms } of results) {
    console.log(`  ${code === 0 ? "PASS" : "FAIL"}  ${suite.padEnd(48)} ${ms.toFixed(0)}ms`);
}
const failed = results.filter((r) => r.code !== 0);
console.log(`==============================================`);
console.log(`  ${results.length - failed.length}/${results.length} suites passed`);
if (failed.length > 0) {
    console.error(`  failing: ${failed.map((f) => f.suite).join(", ")}`);
    process.exit(1);
}
