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
        return fs.statSync(compiledRunner).mtimeMs <= newestInputMtime();
    } catch {
        return true;
    }
}

// PID of the process holding the build lock, or null when unreadable.
function lockOwnerPid() {
    try {
        const pid = Number.parseInt(fs.readFileSync(lockPath, "utf8").trim(), 10);
        return Number.isSafeInteger(pid) && pid > 0 ? pid : null;
    } catch {
        return null;
    }
}

// True when the lock holder might still be running. Fail closed: an unreadable
// owner counts as alive so its lock is never stolen.
function lockOwnerAlive() {
    const pid = lockOwnerPid();
    if (pid === null) return true;
    if (pid === process.pid) return false; // Our own leftover lock: reclaim it.
    try {
        process.kill(pid, 0);
        return true;
    } catch (err) {
        // ESRCH means no such process; anything else (e.g. EPERM) assumes alive.
        return err && err.code !== "ESRCH";
    }
}

function acquireLock() {
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    try {
        fs.writeFileSync(lockPath, String(process.pid), { flag: "wx" });
        return true;
    } catch (err) {
        if (err && err.code === "EEXIST") {
            // Only steal the lock when its holder is dead; a live holder keeps it.
            if (!lockOwnerAlive()) {
                try {
                    fs.unlinkSync(lockPath);
                } catch {
                    return false;
                }
                try {
                    fs.writeFileSync(lockPath, String(process.pid), { flag: "wx" });
                    return true;
                } catch {
                    return false;
                }
            }
            return false; // another (live) build holds the lock
        }
        // Unexpected lock error (e.g. permissions) — proceed without exclusion; the
        // build itself will surface any real failure.
        return true;
    }
}

function releaseLock() {
    try {
        // Only remove the lock when we still own it; another builder may have
        // taken over since (e.g. after stealing our dead-holder lock).
        if (fs.readFileSync(lockPath, "utf8").trim() !== String(process.pid)) {
            return;
        }
        fs.unlinkSync(lockPath);
    } catch {
        // Ignore: already gone or unreadable.
    }
}

function lockIsStale() {
    try {
        // Stale threshold (30s) stays well under the 60s wait deadline below, so a
        // dead holder's lock is reclaimed instead of timing out the waiter.
        return Date.now() - fs.statSync(lockPath).mtimeMs > 30000;
    } catch {
        return false; // already gone
    }
}

// Help and dry-run never execute the runner, so they must not trigger a build.
const cliArgs = process.argv.slice(2);
const skipBuild = cliArgs.includes("--help") || cliArgs.includes("-h") || cliArgs.includes("--dry-run");

if (!skipBuild && needsBuild()) {
    const { execFileSync } = require("child_process");

    const deadline = Date.now() + 60000;
    let owned = acquireLock();

    // Wait for a concurrent build to finish (and release the lock) before building,
    // so two invocations never run esbuild at once and interleave writes to out/*.
    while (!owned && needsBuild() && Date.now() < deadline) {
        if (!fs.existsSync(lockPath) || lockIsStale()) {
            // acquireLock steals only a dead holder's lock; a live holder keeps
            // it and we keep waiting for it to finish. A missing lock means the
            // holder released cleanly, so it is acquirable.
            owned = acquireLock();
            if (owned) break;
        }
        sleepSync(250);
    }

    if (owned) {
        // Heartbeat: periodically refresh the lock mtime so concurrent waiters
        // (30s stale threshold) do not steal it mid-build on slow machines.
        const heartbeat = setInterval(() => {
            try {
                fs.utimesSync(lockPath, new Date(), new Date());
            } catch {
                // Best-effort; the build proceeds regardless.
            }
        }, 10000);
        try {
            execFileSync(process.execPath, ["esbuild.js"], { cwd: repoRoot, stdio: "inherit" });
        } catch (e) {
            console.error("Failed to build out/setup-runner.js automatically:", e.message);
            process.exit(1);
        } finally {
            clearInterval(heartbeat);
            releaseLock();
        }
    } else if (needsBuild()) {
        console.error("Timed out waiting for a concurrent build of out/setup-runner.js.");
        process.exit(1);
    }
    // If !owned but !needsBuild(), another process finished the build — reuse it.
}

let runner;
try {
    runner = require(compiledRunner);
} catch (loadErr) {
    // Help and dry-run skip the build above, so the bundle may legitimately be
    // missing here (fresh checkout). Serve those without the bundle — reading
    // the version straight from package.json — instead of crashing on require.
    // Any other case (a build was expected, or the bundle exists but is broken)
    // rethrows: that is a genuine failure, not a skippable one.
    if (require.main !== module || !skipBuild || fs.existsSync(compiledRunner)) {
        throw loadErr;
    }
    let pkgVersion = "unknown";
    try {
        pkgVersion = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8")).version || "unknown";
    } catch {
        // Keep "unknown".
    }
    if (cliArgs.includes("--help") || cliArgs.includes("-h")) {
        console.log(`\nSuperpowers MCP v${pkgVersion} - Targeted Global Setup`);
        console.log("\nUsage:\n  superpowers-mcp setup --target <name> [options]\n");
        console.log("The setup bundle (out/setup-runner.js) is not built yet;");
        console.log("re-run without --help/--dry-run to build it, then use --help for full usage.\n");
        process.exit(0);
    }
    console.log(`Superpowers MCP v${pkgVersion}: setup bundle is not built; re-run without --dry-run to build it first.`);
    process.exit(0);
}

module.exports = runner;

if (require.main === module) {
    runner.runSetupCli().catch((err) => {
        console.error("❌ Fatal error during setup execution:", err);
        process.exit(1);
    });
}
