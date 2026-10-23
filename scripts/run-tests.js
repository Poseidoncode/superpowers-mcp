#!/usr/bin/env node
/**
 * Runs every test suite and reports all failures, not just the first.
 *
 * The previous `test` script chained the suites with `&&`, so a failure in an early
 * suite skipped every later one — a green-to-red signal depended on which suite
 * broke first, and a single regression could hide most of the suite.
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.join(__dirname, "..");

const FAIL_ON_SKIP = process.argv.includes("--fail-on-skip");

// Resolve a bash binary so .sh suites also run on Windows (Git for Windows
// ships bash outside PATH). Returns null when no bash exists — .sh suites are
// then reported as SKIP, never as passed.
function resolveBash() {
    const candidates = ["bash"];
    if (process.platform === "win32") {
        candidates.push(
            "C:\\Program Files\\Git\\bin\\bash.exe",
            "C:\\Program Files (x86)\\Git\\bin\\bash.exe",
            "C:\\Program Files\\Git\\usr\\bin\\bash.exe"
        );
    }
    for (const bin of candidates) {
        try {
            const probe = spawnSync(bin, ["--version"], { stdio: "ignore", timeout: 30000 });
            if (!probe.error && probe.status === 0) return bin;
        } catch {
            // Try the next candidate.
        }
    }
    return null;
}

function havePwsh() {
    try {
        const probe = spawnSync("pwsh", ["--version"], { stdio: "ignore", timeout: 30000 });
        return !probe.error && probe.status === 0;
    } catch {
        return false;
    }
}

const BASH_BIN = resolveBash();
const HAVE_PWSH = havePwsh();

const SUITES = [
    "tests/edge_cases_test.js",
    "tests/run_test.js",
    "tests/client_truncation_test.js",
    "tests/brainstorm_server_test.js",
    "tests/prompts_compositions_test.js",
    "tests/upstream_sync_test.js",
    "tests/mcp_coverage_test.js",
    "tests/drift_test.js",
    "tests/setup_test.js",
    "tests/executing-plans/test-task-start.sh",
    "tests/executing-plans/test-task-done.sh",
    "tests/sdd/test-sdd-workspace.sh",
    "tests/writing-skills/test-render-graphs.sh",
    "tests/brainstorming/test-start-server-env-hosts.sh",
    // Intentionally excluded: tests/perf_benchmark.js (timing benchmark, not a
    // pass/fail suite), tests/block_network.cjs (helper required by drift_test,
    // not standalone).
];

// PowerShell suites run under pwsh when it exists; when pwsh is missing they
// are reported as SKIP (not a pass, not a failure) so a green run on a
// pwsh-less machine never claims Windows coverage it did not run.
let psSuites = [];
try {
    psSuites = fs.readdirSync(path.join(REPO_ROOT, "tests", "powershell"))
        .filter((f) => f.startsWith("test-") && f.endsWith(".ps1"))
        .sort()
        .map((f) => `tests/powershell/${f}`);
} catch {
    psSuites = [];
}

const results = [];

function runSuite(suite) {
    const started = process.hrtime.bigint();
    let run;
    if (suite.endsWith(".sh")) {
        if (!BASH_BIN) {
            const ms = Number(process.hrtime.bigint() - started) / 1e6;
            results.push({ suite, status: "SKIP", ms, note: "no bash available" });
            console.error(`\n⊘ ${suite} SKIPPED: no bash available\n`);
            return;
        }
        run = spawnSync(BASH_BIN, [suite], { cwd: REPO_ROOT, stdio: "inherit", timeout: 180000 });
    } else if (suite.endsWith(".ps1")) {
        // Caller guarantees HAVE_PWSH; kept explicit so the SKIP path above
        // stays the only way a ps1 suite is not executed.
        run = spawnSync("pwsh", ["-NoProfile", "-File", suite], { cwd: REPO_ROOT, stdio: "inherit", timeout: 180000 });
    } else {
        run = spawnSync(process.execPath, [suite], { cwd: REPO_ROOT, stdio: "inherit", timeout: 180000 });
    }
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    // Differentiate the three failure modes: spawn failure (binary missing),
    // signal death (killed/timeout), and non-zero exit. A null status from a
    // signal kill previously collapsed into `1`, hiding the cause.
    if (run.error) {
        results.push({ suite, status: "FAIL", code: null, signal: null, error: run.error.message, ms });
        console.error(`\n✗ ${suite} failed to spawn: ${run.error.message}\n`);
    } else if (run.signal) {
        results.push({ suite, status: "FAIL", code: run.status, signal: run.signal, error: null, ms });
        console.error(`\n✗ ${suite} killed by signal ${run.signal} — continuing so every suite still runs\n`);
    } else {
        const code = run.status === null ? 1 : run.status;
        results.push({ suite, status: code === 0 ? "PASS" : "FAIL", code, signal: null, error: null, ms });
        if (code !== 0) {
            console.error(`\n✗ ${suite} exited ${code} — continuing so every suite still runs\n`);
        }
    }
}

for (const suite of SUITES) {
    runSuite(suite);
}
if (HAVE_PWSH) {
    for (const suite of psSuites) {
        runSuite(suite);
    }
} else {
    for (const suite of psSuites) {
        results.push({ suite, status: "SKIP", ms: 0, note: "pwsh not available" });
        console.error(`\n⊘ ${suite} SKIPPED: pwsh not available (not a pass)\n`);
    }
}

console.log("\n================ test summary ================");
for (const { suite, status, ms } of results) {
    const mark = status === "PASS" ? "PASS" : status === "SKIP" ? "SKIP" : "FAIL";
    console.log(`  ${mark}  ${suite.padEnd(48)} ${ms.toFixed(0)}ms`);
}
const failed = results.filter((r) => r.status === "FAIL");
const skipped = results.filter((r) => r.status === "SKIP");
console.log(`==============================================`);
console.log(`  ${results.length - failed.length - skipped.length}/${results.length} suites passed${skipped.length > 0 ? ` (${skipped.length} skipped)` : ""}`);
if (skipped.length > 0) {
    console.log(`  skipped: ${skipped.map((s) => s.suite).join(", ")}`);
}
if (failed.length > 0) {
    console.error(`  failing: ${failed.map((f) => {
        if (f.error) return `${f.suite} (spawn: ${f.error})`;
        if (f.signal) return `${f.suite} (signal ${f.signal})`;
        return `${f.suite} (exit ${f.code})`;
    }).join(", ")}`);
    process.exit(1);
}
if (FAIL_ON_SKIP && skipped.length > 0) {
    console.error(`  skipped (fail-on-skip): ${skipped.map((s) => s.suite).join(", ")}`);
    process.exit(1);
}
