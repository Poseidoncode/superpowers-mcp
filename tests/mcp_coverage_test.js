/**
 * MCP surface coverage test.
 *
 * Guards this fork's own contract rather than upstream content: every skill on
 * disk is exposed as an MCP resource that serves that skill's content, the
 * native prompt list matches what all seven READMEs document, the counts the
 * READMEs claim match reality, and the composition guide covers the shipped
 * skills. A skill added without a resource, a renamed prompt, or a stale count
 * in one translation fails here.
 */

const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const ROOT = path.join(__dirname, "..");
const SKILLS_DIR = path.join(ROOT, "skills");
const README_FILES = ["README.md", "README.zh-TW.md", "README.ja.md", "README.ko.md", "README.es.md", "README.pt-BR.md", "README.hi.md"];
const COMPOSITIONS_DOC = path.join(ROOT, "docs", "skill-compositions.md");
const COMPOSITIONS_GUIDE_URI = "guide://superpowers/skill-compositions";
// Meta skills that deliberately stay out of the composition guide.
const UNDOCUMENTED_SKILLS = ["using-superpowers", "writing-skills"];

const failures = [];

function check(label, fn) {
    try {
        fn();
        console.log(`  ✅ ${label}`);
    } catch (err) {
        failures.push(`${label}: ${err.message}`);
        console.error(`  ❌ ${label}: ${err.message}`);
    }
}

function skillDirs() {
    return fs
        .readdirSync(SKILLS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(SKILLS_DIR, entry.name, "SKILL.md")))
        .map((entry) => entry.name)
        .sort();
}

/** The first non-empty body line of a skill — a marker unique to its content. */
function skillBodyMarker(name) {
    const raw = fs.readFileSync(path.join(SKILLS_DIR, name, "SKILL.md"), "utf-8");
    const frontmatter = raw.match(/^---\r?\n[\s\S]*?\r?\n---/);
    const body = frontmatter ? raw.slice(frontmatter[0].length) : raw;
    const firstLine = body.split(/\r?\n/).find((line) => line.trim());
    return firstLine ? firstLine.trim() : "";
}

function lineContaining(file, needle) {
    // Prefer a markdown table row: a release note that happens to mention the
    // needle must not be mistaken for the inventory row.
    const lines = fs.readFileSync(file, "utf-8").split(/\r?\n/);
    const row = lines.find((line) => line.trimStart().startsWith("|") && line.includes(needle));
    const chosen = row || lines.find((line) => line.includes(needle));
    assert.ok(chosen, `${path.basename(file)} has no line containing "${needle}"`);
    return chosen;
}

/** Backticked spans outside fenced code blocks (fences break naive pairing). */
function strikeFences(text) {
    return text.replace(/```[\s\S]*?```/g, "");
}

function firstInteger(line) {
    const match = line.match(/\d+/);
    assert.ok(match, `no number in: ${line}`);
    return Number(match[0]);
}

function backtickedTokens(line) {
    return [...line.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
}

let finished = false;

async function main() {
    const server = spawn("node", [path.join(ROOT, "out", "server.js")]);
    server.stdout.setEncoding("utf8");
    server.on("error", (err) => {
        console.error("❌ Failed to start server child process:", err);
        process.exit(1);
    });
    // If the server dies before main() finishes, pending request() promises would
    // hang forever and the process could exit 0 with checks unrun. Fail loudly instead.
    server.on("exit", (code, signal) => {
        if (!finished) {
            console.error(`❌ Server exited prematurely (code ${code}, signal ${signal}) before coverage checks completed`);
            process.exit(1);
        }
    });

    const pending = new Map();
    let nextId = 1;
    let buffer = "";

    const request = (method, params) =>
        new Promise((resolve, reject) => {
            const id = nextId++;
            pending.set(id, { resolve, reject });
            server.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
        });

    server.stdout.on("data", (data) => {
        buffer += data.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
            if (!line.trim()) continue;
            let response;
            try {
                response = JSON.parse(line);
            } catch (err) {
                console.error("JSON parse error:", err, line);
                process.exit(1);
            }
            const entry = pending.get(response.id);
            if (!entry) continue;
            pending.delete(response.id);
            if (response.error) entry.reject(new Error(`${response.error.code}: ${response.error.message}`));
            else entry.resolve(response.result);
        }
    });

    const watchdog = setTimeout(() => {
        console.error("❌ MCP coverage test timed out after 20 seconds");
        process.exit(1);
    }, 20000);

    await request("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "coverage-test", version: "1.0" },
    });

    const resources = await request("resources/list", {});
    const prompts = await request("prompts/list", {});

    const skills = skillDirs();
    const resourceUris = (resources.resources || []).map((resource) => resource.uri);
    const promptNames = (prompts.prompts || []).map((prompt) => prompt.name).sort();

    check("1 (one resource per skill on disk)", () => {
        const expected = [
            ...skills.map((name) => `skill://superpowers/${encodeURIComponent(name)}`),
            COMPOSITIONS_GUIDE_URI,
        ].sort();
        assert.deepStrictEqual(resourceUris.slice().sort(), expected, "resources/list must expose every skill plus the compositions guide");
        assert.strictEqual(new Set(resourceUris).size, resourceUris.length, "resource URIs must be unique");
    });

    check("2 (resources carry metadata)", () => {
        for (const resource of resources.resources || []) {
            assert.ok(resource.name, `${resource.uri} is missing a name`);
            assert.ok(resource.description, `${resource.uri} is missing a description`);
        }
    });

    // Read every resource and prove the served content belongs to that skill.
    const markerFailures = [];
    for (const name of skills) {
        const uri = `skill://superpowers/${encodeURIComponent(name)}`;
        let text = "";
        try {
            const read = await request("resources/read", { uri });
            text = (read.contents || []).map((entry) => entry.text || "").join("");
        } catch (err) {
            markerFailures.push(`${uri}: ${err.message}`);
            continue;
        }
        const marker = skillBodyMarker(name);
        if (!marker || !text.includes(marker)) {
            markerFailures.push(`${uri}: served content does not contain "${marker.slice(0, 40)}"`);
        }
    }
    check("3 (each resource serves its own skill content)", () => {
        assert.deepStrictEqual(markerFailures, [], markerFailures.join("; "));
    });

    let guideText = "";
    try {
        const guide = await request("resources/read", { uri: COMPOSITIONS_GUIDE_URI });
        guideText = (guide.contents || []).map((entry) => entry.text || "").join("");
    } catch (err) {
        failures.push(`3a (composition guide resource is readable): ${err.message}`);
    }
    check("3a (composition guide resource is readable)", () => {
        assert.ok(guideText.includes("Four Standard Workflow Pipelines"), "guide resource returned the wrong content");
        assert.ok(guideText.includes("feature-pipeline"), "guide resource does not document feature-pipeline");
    });

    check("3b (composition guides are included in the npm package)", () => {
        const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
        assert.ok(manifest.files.includes("docs"), "package.json files must include the published composition guides");
    });

    check("4 (prompt list is unique and non-empty)", () => {
        assert.ok(promptNames.length > 0, "prompts/list must not be empty");
        assert.strictEqual(new Set(promptNames).size, promptNames.length, "prompt names must be unique");
    });

    for (const readme of README_FILES) {
        const file = path.join(ROOT, readme);

        check(`5 (${readme}: skill URI count claim)`, () => {
            const claim = firstInteger(lineContaining(file, "skill://superpowers/"));
            assert.strictEqual(claim, skills.length, `${readme} claims ${claim} skill URIs, the server exposes ${skills.length}`);
        });

        check(`6 (${readme}: prompt inventory claim)`, () => {
            const line = lineContaining(file, "session-start");
            const claim = firstInteger(line);
            assert.strictEqual(claim, promptNames.length, `${readme} claims ${claim} prompts, the server exposes ${promptNames.length}`);
            const kebabTokens = backtickedTokens(line).filter((token) => /^[a-z0-9]+(-[a-z0-9]+)+$/.test(token));
            assert.deepStrictEqual(kebabTokens.slice().sort(), promptNames, `${readme} prompt list must match prompts/list exactly`);
        });
    }

    check("7 (composition guide references real surfaces)", () => {
        const doc = fs.readFileSync(COMPOSITIONS_DOC, "utf-8");
        const documentedPrompts = promptNames.filter((name) => doc.includes(name));
        assert.deepStrictEqual(documentedPrompts, promptNames, `docs must cover every prompt, missing: ${promptNames.filter((name) => !doc.includes(name)).join(", ")}`);
        const undocumented = skills.filter((name) => !doc.includes(name) && !UNDOCUMENTED_SKILLS.includes(name));
        assert.deepStrictEqual(undocumented, [], `skills missing from the composition guide: ${undocumented.join(", ")}`);
    });

    check("8 (composition guide has no stale skill names)", () => {
        const doc = strikeFences(fs.readFileSync(COMPOSITIONS_DOC, "utf-8"));
        const kebabTokens = new Set(backtickedTokens(doc).filter((token) => /^[a-z0-9]+(-[a-z0-9]+)+$/.test(token)));
        const known = new Set([...skills, ...promptNames, "superpowers-mcp", "list-skills", "read-skill", "skill-compositions"]);
        const stale = [...kebabTokens].filter((token) => !known.has(token)).sort();
        assert.deepStrictEqual(stale, [], `composition guide mentions unknown surfaces: ${stale.join(", ")}`);
        assert.ok(kebabTokens.size >= skills.length, `expected to scan the whole guide, only found ${kebabTokens.size} backticked surfaces`);
    });

    check("9 (unsafe SKILLS_PATH is rejected, user temp dirs are honored)", () => {
        const os = require("os");

        // Start a throwaway server with the given SKILLS_PATH and list what it exposes.
        const probe = (skillsPath) => {
            const child = spawnSync("node", [path.join(ROOT, "out", "server.js")], {
                env: { ...process.env, SKILLS_PATH: skillsPath },
                input:
                    JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "list_skills", arguments: {} } }) +
                    "\n",
                encoding: "utf8",
                timeout: 15000,
            });
            const line = (child.stdout || "").split("\n").find((l) => l.trim().startsWith("{") && l.includes('"id":1'));
            let text = "";
            if (line) {
                try {
                    text = JSON.parse(line).result?.content?.[0]?.text || "";
                } catch {
                    text = "";
                }
            }
            return { text, stderr: child.stderr || "" };
        };

        // A user-owned temp directory must be usable as SKILLS_PATH. On macOS the
        // standard temp dir lives under /private/var, which used to trip the
        // system-path guard and silently fall back to the bundled skills.
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "spmcp-coverage-"));
        try {
            const skillDir = path.join(tempDir, "probe-skill");
            fs.mkdirSync(skillDir, { recursive: true });
            fs.writeFileSync(
                path.join(skillDir, "SKILL.md"),
                '---\nname: probe-skill\ndescription: "probe"\n---\n\nbody\n',
                "utf-8"
            );
            const honored = probe(tempDir);
            assert.ok(
                honored.text.includes("probe-skill"),
                `SKILLS_PATH in the OS temp dir must be honored (got: ${honored.text.slice(0, 80)})`
            );
        } finally {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }

        // ...while genuine system paths keep failing closed onto the bundled skills.
        for (const unsafe of ["/etc", "/usr/bin", "/private/var/db"]) {
            const rejected = probe(unsafe);
            assert.ok(
                rejected.text.includes("brainstorming"),
                `SKILLS_PATH=${unsafe} must fall back to the bundled skills (got: ${rejected.text.slice(0, 80)})`
            );
        }
    });


    check("10 (every advertised prompt argument reaches the rendered prompt)", () => {
        const getPrompt = (name, args) => {
            const child = spawnSync("node", [path.join(ROOT, "out", "server.js")], {
                input: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "prompts/get", params: { name, arguments: args } }) + "\n",
                encoding: "utf8",
                timeout: 15000,
            });
            const line = (child.stdout || "").split("\n").find((l) => l.trim().startsWith("{") && l.includes('"id":1'));
            if (!line) return "";
            const parsed = JSON.parse(line);
            if (parsed.error) return `ERROR: ${parsed.error.message}`;
            return parsed.result?.messages?.[0]?.content?.text || "";
        };

        // Its template used to carry "[MODEL — REQUIRED: ...]" instead of a real "[MODEL]" token.
        const implemented = getPrompt("sdd-implementer", { task_name: "TASK-PROBE", model: "probe-model-id" });
        assert.ok(
            implemented.includes("probe-model-id"),
            `sdd-implementer must render the model argument (got: ${implemented.slice(0, 160)})`
        );
        assert.ok(
            !/\[MODEL/.test(implemented),
            `no un-substituted [MODEL…] token may reach the agent (got: ${(implemented.match(/\[MODEL[^\]]{0,40}/) || [""])[0]})`
        );

        // Each template ends with a "**Placeholders:**" appendix that names every
        // token it accepts. Interpolating those lines replaces the token names with
        // the caller's values, so the appendix stops documenting itself.
        const appendix = getPrompt("sdd-re-review", { previous_findings: "FINDING-PROBE" });
        assert.ok(
            appendix.includes("- `[FINDINGS]` —"),
            `the placeholder appendix must keep its literal token names (got: ${appendix.slice(-400)})`
        );
        assert.ok(
            !appendix.includes("- `FINDING-PROBE` —"),
            "the appendix line must not be rewritten with the caller's value"
        );

        // The classifier used plain substring matching, so "reNEWal" selected Pipeline 1.
        // The word-anchored form then over-corrected: "rebuild" matched nothing at all,
        // so a prefixed build request got no pipeline recommendation whatsoever.
        const pipelineFor = (scenario) => {
            const text = getPrompt("skill-composition", { scenario });
            const m = text.match(/Recommended Pipeline Focus:\*\* Pipeline (\d)/);
            return m ? m[1] : "none";
        };
        assert.strictEqual(pipelineFor("fix a bug"), "2", '"bug" -> Pipeline 2');
        assert.strictEqual(pipelineFor("debugging"), "2", '"debugging" -> Pipeline 2');
        assert.strictEqual(pipelineFor("refactor the parser"), "3", '"refactor" -> Pipeline 3');
        assert.strictEqual(pipelineFor("upgrade deps"), "3", '"upgrade" -> Pipeline 3');
        assert.strictEqual(pipelineFor("legacy code safety"), "4", '"legacy" -> Pipeline 4');
        assert.strictEqual(pipelineFor("new feature"), "1", '"new feature" -> Pipeline 1');
        assert.strictEqual(pipelineFor("build a dashboard"), "1", '"build" -> Pipeline 1');
        assert.strictEqual(
            pipelineFor("renewal of the lease"),
            "none",
            '"renewal" contains "new" but is not a new-feature request — must not select Pipeline 1'
        );
        assert.strictEqual(
            pipelineFor("rebuild the parser"),
            "1",
            '"rebuild" is a prefixed build request — must select Pipeline 1'
        );
        assert.strictEqual(
            pipelineFor("renovate the kitchen"),
            "none",
            '"renovate" must not match any pipeline keyword'
        );
    });

    check("11 (skill name validation is identical for the tool and the resource)", () => {
        const rpc = (method, params) => {
            const child = spawnSync("node", [path.join(ROOT, "out", "server.js")], {
                input: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) + "\n",
                encoding: "utf8",
                timeout: 15000,
            });
            const line = (child.stdout || "").split("\n").find((l) => l.trim().startsWith("{") && l.includes('"id":1'));
            if (!line) return { code: null, message: "" };
            const parsed = JSON.parse(line);
            return { code: parsed.error?.code ?? 200, message: parsed.error?.message || "" };
        };

        // The resource reader rejected names containing ".." while the tool accepted them.
        for (const name of ["a..b", "../etc", "a/b", "a\\b"]) {
            const viaTool = rpc("tools/call", { name: "read_skill", arguments: { skill_name: name } });
            const viaResource = rpc("resources/read", { uri: `skill://superpowers/${encodeURIComponent(name)}` });
            assert.ok(
                viaTool.code < 0,
                `read_skill(${JSON.stringify(name)}) must be rejected, got code ${viaTool.code}`
            );
            assert.ok(
                viaResource.code < 0,
                `resources/read(${JSON.stringify(name)}) must be rejected, got code ${viaResource.code}`
            );
        }

        // Each surface keeps its own error class: a bad URI is InvalidRequest,
        // a bad argument is InvalidParams.
        const badName = rpc("tools/call", { name: "read_skill", arguments: { skill_name: "a..b" } });
        assert.strictEqual(badName.code, -32602, "read_skill must report InvalidParams");
        const badUri = rpc("resources/read", { uri: "skill://superpowers/a..b" });
        assert.strictEqual(badUri.code, -32600, "resources/read must report InvalidRequest");

        const ok = rpc("tools/call", { name: "read_skill", arguments: { skill_name: "brainstorming" } });
        assert.strictEqual(ok.code, 200, `brainstorming must still load (got: ${ok.message})`);
    });

    finished = true;
    clearTimeout(watchdog); // success path must clear the ref'd timer (finding #1)
    server.kill();
    if (failures.length > 0) {
        throw new Error(`${failures.length} MCP coverage assertion(s) failed:\n- ${failures.join("\n- ")}`);
    }
    console.log("\n🎉 ALL MCP SURFACE COVERAGE TESTS PASSED!");
}

main().catch((err) => {
    console.error("❌ Test Failed:", err.message);
    process.exit(1);
});
