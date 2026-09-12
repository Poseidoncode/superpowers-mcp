#!/usr/bin/env node
/**
 * Upstream drift report for the skills this fork ships.
 *
 * The fork imports upstream superpowers content in reviewed batches. Between
 * batches nothing records which upstream files moved, so every sync starts with
 * a manual hunt. This tool stores the upstream blob SHAs captured at the last
 * sync (tests/upstream-sync-baseline.json) and reports:
 *
 *   - adopted skill files that changed, appeared or disappeared upstream
 *   - tracked files that are missing from this fork
 *   - upstream skills this fork deliberately does not adopt
 *   - files this fork adds on top of upstream
 *
 * Usage:
 *   node scripts/upstream-drift.js              # offline: baseline integrity + coverage
 *   node scripts/upstream-drift.js --fetch      # compare the baseline against upstream
 *   node scripts/upstream-drift.js --record     # refresh the baseline from upstream
 *
 * Options:
 *   --ref <ref>          upstream ref to read (default: the baseline ref, else "dev")
 *   --repo <owner/name>  upstream repository (default: obra/superpowers)
 *   --ignore <skill>     record an upstream skill as deliberately not adopted
 *                        (repeatable; --record only)
 *   --json               machine-readable report
 *   --fail-on-drift      exit 1 when an adopted file drifted (skipped on a
 *                        truncated upstream listing)
 *
 * The upstream git tree is read through `gh api` when the GitHub CLI is
 * available and falls back to the public GitHub API (Node 18+). Zero
 * dependencies. Only --record writes, and it writes the baseline file only.
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const REPO_ROOT = path.join(__dirname, "..");
const SKILLS_DIR = path.join(REPO_ROOT, "skills");
const BASELINE_PATH = path.join(REPO_ROOT, "tests", "upstream-sync-baseline.json");
const DEFAULT_REPO = "obra/superpowers";
const DEFAULT_REF = "dev";
const MAX_LISTED = 40;
const NETWORK_TIMEOUT_MS = 20000;

function parseArgs(argv) {
    const opts = { fetch: false, record: false, json: false, failOnDrift: false, help: false, ref: "", repo: "", ignore: [] };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === "--fetch") opts.fetch = true;
        else if (arg === "--record") opts.record = true;
        else if (arg === "--json") opts.json = true;
        else if (arg === "--fail-on-drift") opts.failOnDrift = true;
        else if (arg === "--help" || arg === "-h") opts.help = true;
        else if (arg === "--ref" || arg === "--repo" || arg === "--ignore") {
            const value = argv[++i];
            if (!value) throw new Error(`Missing value for ${arg}`);
            if (arg === "--ref") opts.ref = value;
            else if (arg === "--repo") opts.repo = value;
            else opts.ignore.push(value);
        } else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }
    return opts;
}

function printHelp() {
    console.log(`Upstream drift report for the skills this fork ships.

  node scripts/upstream-drift.js            offline baseline integrity + local coverage
  node scripts/upstream-drift.js --fetch    compare the baseline against upstream
  node scripts/upstream-drift.js --record   refresh the baseline from upstream

Options: --ref <ref>  --repo <owner/name>  --ignore <skill>  --json  --fail-on-drift`);
}

/** The skill directory an upstream path belongs to ("skills/<name>/..." -> "<name>"). */
function skillNameOf(filePath) {
    const parts = String(filePath).split("/");
    return parts.length > 2 && parts[0] === "skills" ? parts[1] : "";
}

function readBaseline(baselinePath = BASELINE_PATH) {
    const parsed = JSON.parse(fs.readFileSync(baselinePath, "utf-8"));
    if (!parsed || typeof parsed !== "object" || typeof parsed.files !== "object" || parsed.files === null) {
        throw new Error(`${path.relative(REPO_ROOT, baselinePath)} is missing its "files" map`);
    }
    return parsed;
}

/** Walk the fork's skills tree and return the upstream-style paths it covers. */
function localSkillPaths(skillsDir = SKILLS_DIR) {
    const found = new Set();
    const walk = (dir, relative) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const nextRelative = relative ? `${relative}/${entry.name}` : entry.name;
            if (entry.isDirectory()) {
                walk(path.join(dir, entry.name), nextRelative);
            } else if (entry.isFile()) {
                found.add(`skills/${nextRelative}`);
            }
        }
    };
    if (fs.existsSync(skillsDir)) {
        walk(skillsDir, "");
    }
    return found;
}

/**
 * Classify the current upstream tree against the recorded baseline.
 *
 * `added` and `changed`/`removed` cover the skills this fork adopts, so they are
 * actionable drift. Files that belong to a skill the fork does not adopt (and
 * has not listed in ignoredUpstreamSkills) land in `unadoptedFiles`, which is a
 * decision to make rather than drift to review.
 */
function classifyDrift(baselineFiles, upstreamFiles, ignoredSkills = []) {
    const adoptedSkills = new Set(Object.keys(baselineFiles).map(skillNameOf).filter(Boolean));
    const ignored = new Set(ignoredSkills);
    const changed = [];
    const added = [];
    const removed = [];
    const unadoptedFiles = [];
    for (const [filePath, sha] of Object.entries(upstreamFiles)) {
        if (Object.prototype.hasOwnProperty.call(baselineFiles, filePath)) {
            if (baselineFiles[filePath] !== sha) changed.push(filePath);
            continue;
        }
        const skill = skillNameOf(filePath);
        if (adoptedSkills.has(skill)) added.push(filePath);
        else if (!ignored.has(skill)) unadoptedFiles.push(filePath);
    }
    for (const filePath of Object.keys(baselineFiles)) {
        if (!Object.prototype.hasOwnProperty.call(upstreamFiles, filePath)) removed.push(filePath);
    }
    const byPath = (a, b) => a.localeCompare(b);
    return {
        changed: changed.sort(byPath),
        added: added.sort(byPath),
        removed: removed.sort(byPath),
        unadoptedFiles: unadoptedFiles.sort(byPath),
    };
}

/** Compare the recorded baseline with what the fork actually ships. */
function classifyCoverage(baseline, localPaths) {
    const files = baseline.files || {};
    const ignored = new Set(Array.isArray(baseline.ignoredUpstreamSkills) ? baseline.ignoredUpstreamSkills : []);
    const localSkillDirs = new Set([...localPaths].map(skillNameOf).filter(Boolean));
    const upstreamSkillDirs = new Set((baseline.upstreamSkills || Object.keys(files).map(skillNameOf)).filter(Boolean));
    const byPath = (a, b) => a.localeCompare(b);
    return {
        missingLocal: Object.keys(files).filter((filePath) => !localPaths.has(filePath)).sort(byPath),
        localExtra: [...localPaths].filter((filePath) => !Object.prototype.hasOwnProperty.call(files, filePath)).sort(byPath),
        unadoptedSkills: [...upstreamSkillDirs].filter((name) => !localSkillDirs.has(name) && !ignored.has(name)).sort(byPath),
        forkOnlySkills: [...localSkillDirs].filter((name) => !upstreamSkillDirs.has(name)).sort(byPath),
        ignoredSkills: [...ignored].sort(byPath),
    };
}

const encodePath = (value) => String(value).split("/").map(encodeURIComponent).join("/");

async function fetchUpstreamTree(repo, ref) {
    const endpoint = `repos/${encodePath(repo)}/git/trees/${encodeURIComponent(ref)}?recursive=1`;
    let raw = null;
    let source = "gh api";
    let ghError = "";
    try {
        raw = execFileSync("gh", ["api", endpoint], {
            encoding: "utf-8",
            stdio: ["ignore", "pipe", "pipe"],
            timeout: NETWORK_TIMEOUT_MS,
        });
    } catch (err) {
        raw = null;
        ghError = err && err.stderr ? String(err.stderr).trim().split("\n")[0] : String((err && err.message) || "");
    }
    if (!raw) {
        source = "api.github.com";
        const response = await fetch(`https://api.github.com/${endpoint}`, {
            headers: { accept: "application/vnd.github+json", "user-agent": "superpowers-mcp-drift" },
            signal: AbortSignal.timeout(NETWORK_TIMEOUT_MS),
        });
        if (!response.ok) {
            throw new Error(`Could not read ${repo}@${ref} (gh failed${ghError ? `: ${ghError}` : ""}; GitHub API HTTP ${response.status})`);
        }
        raw = await response.text();
    }
    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch (err) {
        throw new Error(`Could not parse the upstream tree response: ${err.message}`);
    }
    const files = {};
    for (const entry of parsed.tree || []) {
        if (entry && entry.type === "blob" && typeof entry.path === "string" && entry.path.startsWith("skills/")) {
            files[entry.path] = entry.sha;
        }
    }
    return { commit: parsed.sha || "", files, source, truncated: Boolean(parsed.truncated) };
}

function list(title, entries) {
    if (entries.length === 0) return;
    console.log(`${title} (${entries.length}):`);
    for (const entry of entries.slice(0, MAX_LISTED)) console.log(`  - ${entry}`);
    if (entries.length > MAX_LISTED) console.log(`  ... and ${entries.length - MAX_LISTED} more`);
}

function reportCoverage(coverage) {
    list("Tracked upstream files missing from the fork", coverage.missingLocal);
    list("Upstream skills this fork does not adopt", coverage.unadoptedSkills);
    list("Fork-only skills (not tracked upstream)", coverage.forkOnlySkills);
    list("Fork-only files (not tracked upstream)", coverage.localExtra);
    list("Upstream skills recorded as deliberately not adopted", coverage.ignoredSkills);
}

function reportDrift(drift) {
    list("Adopted skill files changed upstream since the baseline", drift.changed);
    list("New upstream files inside adopted skills", drift.added);
    list("Adopted skill files removed upstream", drift.removed);
    list("New upstream files in skills this fork does not adopt", drift.unadoptedFiles);
}

async function main() {
    const opts = parseArgs(process.argv.slice(2));
    if (opts.help) {
        printHelp();
        return;
    }

    let baseline = null;
    try {
        baseline = readBaseline();
    } catch (err) {
        if (!opts.record) throw err;
        console.log(`No usable baseline yet (${err.message}); --record will create one.`);
        baseline = { repo: DEFAULT_REPO, ref: DEFAULT_REF, commit: "", capturedAt: "", files: {}, upstreamSkills: [], ignoredUpstreamSkills: [] };
    }
    const localPaths = localSkillPaths();

    if (opts.record) {
        const repo = opts.repo || baseline.repo || DEFAULT_REPO;
        const ref = opts.ref || baseline.ref || DEFAULT_REF;
        const ignored = [...new Set([...(baseline.ignoredUpstreamSkills || []), ...opts.ignore])].sort();
        const tree = await fetchUpstreamTree(repo, ref);
        const previousFiles = baseline.files || {};
        const previousDrift = classifyDrift(previousFiles, tree.files, ignored);

        // Track only the upstream files this fork actually ships: the baseline
        // states which upstream blobs were imported, so a later deletion of an
        // adopted file shows up as a missing local path.
        const files = {};
        for (const filePath of Object.keys(tree.files).sort()) {
            if (localPaths.has(filePath)) files[filePath] = tree.files[filePath];
        }
        const upstreamSkills = [...new Set(Object.keys(tree.files).map(skillNameOf).filter(Boolean))].sort();
        const recorded = { repo, ref, commit: tree.commit, capturedAt: new Date().toISOString().slice(0, 10), files, upstreamSkills, ignoredUpstreamSkills: ignored };
        fs.writeFileSync(BASELINE_PATH, JSON.stringify(recorded, null, 2) + "\n", "utf-8");

        console.log(`Baseline recorded from ${tree.source}: ${repo}@${ref} ${tree.commit.slice(0, 12)} — ${Object.keys(files).length} tracked files of ${Object.keys(tree.files).length} upstream skill files`);
        if (Object.keys(previousFiles).length > 0) {
            const moved = previousDrift.changed.length + previousDrift.added.length + previousDrift.removed.length;
            console.log(moved === 0
                ? "No adopted skill file moved upstream since the previous baseline."
                : `warning: ${moved} adopted skill file(s) moved upstream since the previous baseline — record only what you actually reviewed.`);
        }
        if (opts.ignore.length > 0) {
            console.log(`Recorded as deliberately not adopted: ${opts.ignore.join(", ")}`);
        }
        reportCoverage(classifyCoverage(recorded, localPaths));
        return;
    }

    const repo = opts.repo || baseline.repo || DEFAULT_REPO;
    const ref = opts.ref || baseline.ref || DEFAULT_REF;
    const coverage = classifyCoverage(baseline, localPaths);
    const tracked = Object.keys(baseline.files).length;
    const ignored = Array.isArray(baseline.ignoredUpstreamSkills) ? baseline.ignoredUpstreamSkills : [];

    if (!opts.fetch) {
        if (opts.json) {
            console.log(JSON.stringify({ baseline: { repo, ref, commit: baseline.commit, capturedAt: baseline.capturedAt, tracked }, coverage }, null, 2));
            return;
        }
        console.log(`Baseline: ${repo}@${ref} ${String(baseline.commit).slice(0, 12)} (captured ${baseline.capturedAt})`);
        console.log(`Tracked upstream skill files: ${tracked}`);
        reportCoverage(coverage);
        console.log("\nRun `node scripts/upstream-drift.js --fetch` to compare the baseline against upstream.");
        return;
    }

    const tree = await fetchUpstreamTree(repo, ref);
    const drift = classifyDrift(baseline.files, tree.files, ignored);
    const driftCount = drift.changed.length + drift.added.length + drift.removed.length;
    if (opts.json) {
        console.log(JSON.stringify({
            baseline: { repo, ref, commit: baseline.commit, capturedAt: baseline.capturedAt, tracked },
            upstream: { ref, commit: tree.commit, tracked: Object.keys(tree.files).length, source: tree.source, truncated: tree.truncated },
            drift,
            driftCount,
            coverage,
        }, null, 2));
    } else {
        console.log(`Baseline: ${repo}@${baseline.ref} ${String(baseline.commit).slice(0, 12)} (captured ${baseline.capturedAt})`);
        console.log(`Upstream: ${repo}@${ref} ${String(tree.commit).slice(0, 12)} via ${tree.source}`);
        reportDrift(drift);
        reportCoverage(coverage);
        if (driftCount === 0) {
            console.log("\nNo drift in adopted skill files.");
        } else {
            console.log(`\n${driftCount} adopted skill file(s) changed upstream. Review them before the next sync.`);
        }
        if (drift.unadoptedFiles.length > 0) {
            console.log(`${drift.unadoptedFiles.length} upstream file(s) belong to skills this fork does not adopt — adopt or record them with --ignore.`);
        }
        if (tree.truncated) {
            console.log("warning: the upstream listing was truncated, so this comparison may be partial.");
        }
    }
    if (opts.failOnDrift && driftCount > 0 && !tree.truncated) {
        process.exitCode = 1;
    }
}

if (require.main === module) {
    main().catch((err) => {
        console.error(`❌ upstream-drift: ${err.message}`);
        process.exitCode = 2;
    });
}

module.exports = { parseArgs, skillNameOf, readBaseline, localSkillPaths, classifyDrift, classifyCoverage };
