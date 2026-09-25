#!/usr/bin/env node
/**
 * Superpowers MCP - Global Setup Forwarder Wrapper
 * Forwards calls to compiled out/setup.js (Single Source of Truth: src/setup-runner.ts)
 */

const path = require("path");
const fs = require("fs");

const repoRoot = path.join(__dirname, "..");
const compiledRunner = path.join(repoRoot, "out", "setup-runner.js");
const lockPath = path.join(repoRoot, "out", ".setup-build.lock");

const inputFiles = [
    path.join(repoRoot, "src", "setup-runner.ts"),
    path.join(repoRoot, "src", "setup-cli.ts"),
    path.join(repoRoot, "esbuild.js"),
    path.join(repoRoot, "package.json"),
];

function sleepSync(ms) {
    // Portable synchronous sleep; blocks this thread while waiting on the lock.
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function newestInputMtime() {
    let newest = 0;
    for (const file of inputFiles) {
        try {
            newest = Math.max(newest, fs.statSync(file).mtimeMs);
        } catch {
            // Ignore missing inputs.
        }
    }
    return newest;
}

// Rebuild when the output is missing OR any build input is newer, so edits to the
// sources are never silently ignored (the old check only tested for existence).
function needsBuild() {
    if (!fs.existsSync(compiledRunner)) {
        return true;
    }
    try {
        return fs.statSync(compiledRunner).mtimeMs < newestInputMtime();
    } catch {
        return true;
    }
}

function acquireLock() {
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    try {
        fs.writeFileSync(lockPath, String(process.pid), { flag: "wx" });
        return true;
    } catch (err) {
        if (err && err.code === "EEXIST") {
            return false; // another build holds the lock
        }
        // Unexpected lock error (e.g. permissions) — proceed without exclusion; the
        // build itself will surface any real failure.
        return true;
    }
}

function releaseLock() {
    try {
        fs.unlinkSync(lockPath);
    } catch {
        // Ignore: we may not own it.
    }
}

function lockIsStale() {
    try {
        return Date.now() - fs.statSync(lockPath).mtimeMs > 120000;
    } catch {
        return false; // already gone
    }
}

if (needsBuild()) {
    const { execSync } = require("child_process");

    const deadline = Date.now() + 60000;
    let owned = acquireLock();

    // Wait for a concurrent build to finish (and release the lock) before building,
    // so two invocations never run esbuild at once and interleave writes to out/*.
    while (!owned && needsBuild() && Date.now() < deadline) {
        if (lockIsStale()) {
            releaseLock();
            owned = acquireLock();
            break;
        }
        sleepSync(250);
    }

    if (owned) {
        try {
            execSync("node esbuild.js", { cwd: repoRoot, stdio: "inherit" });
        } catch (e) {
            console.error("Failed to build out/setup-runner.js automatically:", e.message);
            process.exit(1);
        } finally {
            releaseLock();
        }
    } else if (needsBuild()) {
        console.error("Timed out waiting for a concurrent build of out/setup-runner.js.");
        process.exit(1);
    }
    // If !owned but !needsBuild(), another process finished the build — reuse it.
}

const runner = require(compiledRunner);

module.exports = runner;

if (require.main === module) {
    runner.runSetupCli().catch((err) => {
        console.error("❌ Fatal error during setup execution:", err);
        process.exit(1);
    });
}
