/**
 * Upstream drift baseline tests (offline).
 *
 * The baseline (tests/upstream-sync-baseline.json) records the upstream blob
 * SHAs captured at the last sync plus the upstream skill inventory and the
 * skills this fork deliberately does not adopt. These tests keep it honest
 * without touching the network: a tracked file the fork deleted, a skill that
 * lost its upstream lineage, a stale ignore entry, or a broken comparison
 * helper fails here before anyone reads a drift report.
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { execFileSync } = require("child_process");
const {
    parseArgs,
    skillNameOf,
    readBaseline,
    localSkillPaths,
    classifyDrift,
    classifyCoverage,
    requireCompleteTreeForRecord,
} = require("../scripts/upstream-drift.js");

const ROOT = path.join(__dirname, "..");
const SKILLS_DIR = path.join(ROOT, "skills");
/**
 * Fork-only skills have no upstream counterpart. Add entries as
 * "name: reason" — only the part before the colon is compared, and check 4
 * exempts them from the baseline-entry requirement.
 */
const FORK_ONLY_SKILLS = [];
const forkOnlyNames = () => FORK_ONLY_SKILLS.map((entry) => entry.split(":")[0].trim());

const failures = [];

function check(label, fn) {
    try {
        fn();
        console.log(`  ✅ ${label} Passed!`);
    } catch (err) {
        failures.push(`${label}: ${err.message}`);
        console.error(`  ❌ ${label} Failed: ${err.message}`);
    }
}

function expectThrows(fn, needle) {
    try {
        fn();
    } catch (err) {
        assert.ok(err.message.includes(needle), `expected "${needle}" in: ${err.message}`);
        return;
    }
    assert.fail(`expected an error containing "${needle}"`);
}

const sha = (char) => char.repeat(40);

// 1. The baseline describes a real upstream capture.
check("1 (baseline shape)", () => {
    const baseline = readBaseline();
    assert.strictEqual(baseline.repo, "obra/superpowers", "baseline must name the upstream repo");
    assert.ok(/^[0-9a-f]{40}$/.test(baseline.commit), `commit must be a full sha, got ${baseline.commit}`);
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(baseline.capturedAt), `capturedAt must be an ISO date, got ${baseline.capturedAt}`);
    const entries = Object.entries(baseline.files);
    assert.ok(entries.length > 20, `baseline should track the upstream skill tree, got ${entries.length} files`);
    for (const [filePath, blob] of entries) {
        assert.ok(filePath.startsWith("skills/"), `${filePath} must live under skills/`);
        assert.ok(skillNameOf(filePath), `${filePath} must belong to a skill directory`);
        assert.ok(/^[0-9a-f]{40}$/.test(blob), `${filePath} must record a blob sha, got ${blob}`);
    }
    assert.ok(Array.isArray(baseline.upstreamSkills) && baseline.upstreamSkills.length > 0, "baseline must record the upstream skill inventory");
    assert.deepStrictEqual([...baseline.upstreamSkills].sort(), baseline.upstreamSkills, "upstreamSkills must stay sorted");
    assert.ok(Array.isArray(baseline.ignoredUpstreamSkills), "baseline must record ignoredUpstreamSkills");
    assert.deepStrictEqual([...baseline.ignoredUpstreamSkills].sort(), baseline.ignoredUpstreamSkills, "ignoredUpstreamSkills must stay sorted");
});

// 2. Every tracked upstream file still ships: deleting an adopted file fails here.
check("2 (tracked files still ship)", () => {
    const coverage = classifyCoverage(readBaseline(), localSkillPaths());
    assert.deepStrictEqual(coverage.missingLocal, [], `tracked upstream files missing from the fork: ${coverage.missingLocal.join(", ")}`);
});

// 3. Every shipped skill is either upstream-tracked or a deliberate fork-only addition,
//    and every upstream skill is either shipped or deliberately ignored.
check("3 (skill lineage)", () => {
    const baseline = readBaseline();
    const coverage = classifyCoverage(baseline, localSkillPaths());
    assert.deepStrictEqual(coverage.unadoptedSkills, [], `upstream skills this fork neither ships nor ignores: ${coverage.unadoptedSkills.join(", ")}`);
    assert.deepStrictEqual(coverage.forkOnlySkills, forkOnlyNames(), `fork-only skills must be listed in FORK_ONLY_SKILLS: ${coverage.forkOnlySkills.join(", ")}`);
    const localSkills = new Set([...localSkillPaths()].map(skillNameOf).filter(Boolean));
    const stale = coverage.ignoredSkills.filter((name) => !baseline.upstreamSkills.includes(name));
    assert.deepStrictEqual(stale, [], `ignoredUpstreamSkills entries that upstream no longer ships: ${stale.join(", ")}`);
    const contradictory = coverage.ignoredSkills.filter((name) => localSkills.has(name));
    assert.deepStrictEqual(contradictory, [], `skills both shipped and ignored: ${contradictory.join(", ")}`);
});

// 4. Every shipped SKILL.md is tracked, so a dropped entry cannot hide.
check("4 (every SKILL.md tracked)", () => {
    const tracked = readBaseline().files;
    const exempt = new Set(forkOnlyNames());
    const shipped = fs
        .readdirSync(SKILLS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => `skills/${entry.name}/SKILL.md`)
        .filter((filePath) => fs.existsSync(path.join(ROOT, filePath)))
        .filter((filePath) => !exempt.has(skillNameOf(filePath)));
    const untracked = shipped.filter((filePath) => !Object.prototype.hasOwnProperty.call(tracked, filePath));
    assert.deepStrictEqual(untracked, [], `SKILL.md files without a baseline entry: ${untracked.join(", ")}`);
});

// 5. classifyDrift: an unchanged tree is not drift.
check("5 (classifyDrift: identical trees)", () => {
    const files = { "skills/a/SKILL.md": sha("a") };
    assert.deepStrictEqual(classifyDrift(files, { ...files }), { changed: [], added: [], removed: [], unadoptedFiles: [] });
});

// 6. classifyDrift: exactly the moved blob is reported.
check("6 (classifyDrift: changed blob)", () => {
    const baseline = { "skills/a/SKILL.md": sha("a"), "skills/b/SKILL.md": sha("b") };
    const upstream = { "skills/a/SKILL.md": sha("c"), "skills/b/SKILL.md": sha("b") };
    const drift = classifyDrift(baseline, upstream);
    assert.deepStrictEqual(drift.changed, ["skills/a/SKILL.md"]);
    assert.deepStrictEqual(drift.added, []);
    assert.deepStrictEqual(drift.removed, []);
    assert.deepStrictEqual(drift.unadoptedFiles, []);
});

// 7. classifyDrift: additions, removals and unadopted skills stay separate.
check("7 (classifyDrift: added, removed, unadopted)", () => {
    const baseline = { "skills/a/SKILL.md": sha("a") };
    const upstream = {
        "skills/a/SKILL.md": sha("a"),
        "skills/a/extra.md": sha("e"), // new file inside an adopted skill -> drift
        "skills/c/SKILL.md": sha("c"), // skill this fork does not adopt -> decision
        "skills/d/SKILL.md": sha("d"), // ignored skill -> silent
    };
    const drift = classifyDrift(baseline, upstream, ["d"]);
    assert.deepStrictEqual(drift.added, ["skills/a/extra.md"]);
    assert.deepStrictEqual(drift.unadoptedFiles, ["skills/c/SKILL.md"]);
    assert.deepStrictEqual(drift.removed, []);
    // and the reverse direction reports the removals
    assert.deepStrictEqual(classifyDrift(upstream, baseline, ["d"]).removed, ["skills/a/extra.md", "skills/c/SKILL.md", "skills/d/SKILL.md"]);
});

// 8. classifyCoverage: missing, fork-only and unadopted stay separate.
check("8 (classifyCoverage: divergence buckets)", () => {
    const baseline = {
        files: { "skills/a/SKILL.md": sha("a"), "skills/b/SKILL.md": sha("b") },
        upstreamSkills: ["a", "b", "gone", "later"],
        ignoredUpstreamSkills: ["later"],
    };
    const local = new Set(["skills/a/SKILL.md", "skills/c/SKILL.md", "skills/b/scripts/x.ps1"]);
    const coverage = classifyCoverage(baseline, local);
    assert.deepStrictEqual(coverage.missingLocal, ["skills/b/SKILL.md"]);
    assert.deepStrictEqual(coverage.localExtra, ["skills/b/scripts/x.ps1", "skills/c/SKILL.md"]);
    assert.deepStrictEqual(coverage.unadoptedSkills, ["gone"]);
    assert.deepStrictEqual(coverage.forkOnlySkills, ["c"]);
    assert.deepStrictEqual(coverage.ignoredSkills, ["later"]);
});

// 9. The CLI parses its arguments strictly.
check("9 (parseArgs)", () => {
    assert.deepStrictEqual(parseArgs(["--fetch", "--ref", "main", "--repo", "x/y", "--json", "--fail-on-drift"]), {
        fetch: true,
        record: false,
        json: true,
        failOnDrift: true,
        help: false,
        ref: "main",
        repo: "x/y",
        ignore: [],
    });
    assert.deepStrictEqual(parseArgs(["--record", "--ignore", "one", "--ignore", "two"]).ignore, ["one", "two"]);
    expectThrows(() => parseArgs(["--nope"]), "Unknown argument");
    expectThrows(() => parseArgs(["--ref"]), "Missing value");
    expectThrows(() => parseArgs(["--ignore"]), "Missing value");
    assert.doesNotThrow(() => requireCompleteTreeForRecord({ truncated: false }));
    expectThrows(
        () => requireCompleteTreeForRecord({ truncated: true }),
        "Refusing to record a truncated upstream tree"
    );
});

// 10. The CLI's offline mode works end to end without the network.
// The guard module (#15) makes any fetch/http(s) attempt throw, proving the
// default path never touches the network instead of merely inheriting it.
check("10 (CLI offline mode)", () => {
    const guard = path.join(__dirname, "block_network.cjs");
    const run = (args) => execFileSync(
        "node",
        ["--require", guard, path.join(ROOT, "scripts", "upstream-drift.js"), ...args],
        { encoding: "utf-8" }
    );
    const output = run([]);
    assert.ok(output.includes("Baseline: obra/superpowers@"), output);
    assert.ok(output.includes("Tracked upstream skill files: "), output);
    const json = JSON.parse(run(["--json"]));
    assert.strictEqual(json.baseline.tracked, Object.keys(readBaseline().files).length);
    assert.deepStrictEqual(json.coverage.missingLocal, []);
});

if (failures.length > 0) {
    throw new Error(`${failures.length} drift assertion(s) failed:\n- ${failures.join("\n- ")}`);
}

console.log("\n🎉 ALL UPSTREAM DRIFT TESTS PASSED!");
