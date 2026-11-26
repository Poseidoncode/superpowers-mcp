const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { SkillsManager } = require("../out/skills-manager.js");

let passed = 0;
let failed = 0;
const pending = [];
function it(desc, fn) {
    pending.push(
        Promise.resolve()
            .then(fn)
            .then(() => {
                console.log(`  ✅ ${desc}`);
                passed++;
            })
            .catch((err) => {
                console.error(`  ❌ FAIL: ${desc}\n     ${err.stack || err.message}`);
                failed++;
            })
    );
}
const tmp = (p) => fs.mkdtempSync(path.join(os.tmpdir(), p));

console.log("🧪 Robustness regression tests");

// setup must refuse (not hang on) a config path that is a FIFO.
if (process.platform !== "win32") {
    it("setup refuses a FIFO config file instead of blocking", () => {
        const home = tmp("sp-fifo-");
        try {
            const code = `
                const { HARNESS_CONFIGS, runSetup } = require(${JSON.stringify(path.join(__dirname, "../out/setup-runner.js"))});
                const home = ${JSON.stringify(home)};
                const cfg = HARNESS_CONFIGS.cursor.getConfigPath(process.platform, home);
                require("fs").mkdirSync(require("path").dirname(cfg), { recursive: true });
                const r = require("child_process").spawnSync("mkfifo", [cfg]);
                if (r.status !== 0) { console.log("NOFIFO"); process.exit(0); }
                runSetup({ target: "cursor", homeDir: home, platform: process.platform }).then((res) => {
                    console.log(JSON.stringify(res));
                });
            `;
            const run = spawnSync(process.execPath, ["-e", code], { timeout: 10000, encoding: "utf8" });
            assert.ok(!run.error, `setup hung or failed to run: ${run.error && run.error.message}`);
            if (run.stdout.trim() === "NOFIFO") return;
            const [result] = JSON.parse(run.stdout);
            assert.strictEqual(result.status, "error");
            assert.match(result.message, /non-regular/);
        } finally {
            fs.rmSync(home, { recursive: true, force: true });
        }
    });
}

it("references beyond the 100-file listing cap stay readable", async () => {
    const root = tmp("sp-refs-");
    try {
        const dir = path.join(root, "demo");
        fs.mkdirSync(path.join(dir, "references"), { recursive: true });
        fs.writeFileSync(path.join(dir, "SKILL.md"), "---\nname: demo\ndescription: d\n---\nbody\n");
        for (let i = 0; i < 101; i++) {
            fs.writeFileSync(path.join(dir, "references", `ref-${String(i).padStart(3, "0")}.md`), `content ${i}`);
        }
        const mgr = new SkillsManager(root);
        const skillPath = path.join(dir, "SKILL.md");
        assert.strictEqual((await mgr.listSkillReferences(skillPath)).length, 100);
        assert.strictEqual(await mgr.hasSkillReference(skillPath, "ref-100.md"), true);
        assert.strictEqual(await mgr.hasSkillReference(skillPath, "missing.md"), false);
        assert.strictEqual(await mgr.hasSkillReference(skillPath, "../SKILL.md"), false);
        assert.match(await mgr.readSkillReference(skillPath, "ref-100.md"), /content 100/);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});

it("a transient read failure does not stick: the skill returns on the next scan", async () => {
    const root = tmp("sp-transient-");
    try {
        for (const n of ["alpha", "beta"]) {
            fs.mkdirSync(path.join(root, n));
            fs.writeFileSync(path.join(root, n, "SKILL.md"), `---\nname: ${n}\ndescription: d\n---\nbody\n`);
        }
        const mgr = new SkillsManager(root);
        const realRead = mgr.readFileNoFollow.bind(mgr);
        let failOnce = true;
        mgr.readFileNoFollow = async (file, ...rest) => {
            if (failOnce && file.includes(`${path.sep}beta${path.sep}`)) {
                failOnce = false;
                const err = new Error("EIO: simulated transient failure");
                err.code = "EIO";
                throw err;
            }
            return realRead(file, ...rest);
        };
        const origErr = process.stderr.write;
        process.stderr.write = () => true;
        let first;
        try {
            first = await mgr.listSkills(true);
        } finally {
            process.stderr.write = origErr;
        }
        assert.deepStrictEqual(first.map((s) => s.name), ["alpha"]);
        mgr.lastSuccessfulScanAt = 0; // skip the 1s hot path; files are unchanged on disk
        const second = await mgr.listSkills();
        assert.deepStrictEqual(second.map((s) => s.name), ["alpha", "beta"]);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});

it("scan keeps the content cache within budget and every skill stays readable", async () => {
    const root = tmp("sp-budget-");
    try {
        const big = "x".repeat(8 * 1024 * 1024);
        for (let i = 0; i < 5; i++) {
            fs.mkdirSync(path.join(root, `s${i}`));
            fs.writeFileSync(path.join(root, `s${i}`, "SKILL.md"), `---\nname: s${i}\ndescription: d\n---\n${big}${i}`);
        }
        const mgr = new SkillsManager(root);
        const skills = await mgr.listSkills(true);
        assert.strictEqual(skills.length, 5);
        let bytes = 0;
        for (const body of mgr.contentCache.values()) bytes += Buffer.byteLength(body);
        assert.ok(bytes <= 20 * 1024 * 1024, `cached ${bytes} bytes exceeds the 20 MiB budget`);
        for (const s of skills) {
            assert.ok((await mgr.readSkillContent(s.skillPath)).endsWith(s.name.slice(1)));
        }
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});

Promise.all(pending).then(() => {
    console.log(`Results: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
});
