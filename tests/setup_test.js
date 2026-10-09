const assert = require("assert");
const path = require("path");
const fs = require("fs");
const os = require("os");
const {
    HARNESS_CONFIGS,
    updateYamlConfig,
    updateTomlConfig,
    updateJsonConfig,
    stripJsonComments,
    isPlainObject,
    safeWriteConfig,
    runSetup,
} = require("../out/setup-runner.js");

console.log("==================================================");
console.log("🧪 Running Superpowers Global Setup Comprehensive Tests");
console.log("==================================================");

let passed = 0;
let failed = 0;
let skipped = 0;

const pendingTests = [];

function it(desc, fn) {
    let result;
    try {
        result = fn();
    } catch (err) {
        console.error(`  ❌ FAIL: ${desc}`);
        console.error(`     ${err.message}`);
        failed++;
        return;
    }
    if (result && typeof result.then === "function") {
        // Async case (#14): only count after settlement, so rejections are not lost.
        pendingTests.push(result.then(() => {
            console.log(`  ✅ PASS: ${desc}`);
            passed++;
        }, (err) => {
            console.error(`  ❌ FAIL: ${desc}`);
            console.error(`     ${err.message}`);
            failed++;
        }));
        return;
    }
    console.log(`  ✅ PASS: ${desc}`);
    passed++;
}

// 1. JSON Configuration Tests (Copilot vs Standard)
it("should configure VS Code Copilot format with 'servers' root and 'stdio' type", () => {
    const original = JSON.stringify({
        servers: {
            existingServer: { command: "node", args: ["other.js"] }
        }
    });

    const updated = updateJsonConfig(original, "json-servers", "npx", ["-y", "superpowers-mcp"]);
    const parsed = JSON.parse(updated);

    assert.ok(parsed.servers, "Must have 'servers' key");
    assert.strictEqual(parsed.servers.existingServer.command, "node", "Must preserve existingServer");
    assert.strictEqual(parsed.servers.superpowers.command, "npx");
    assert.deepStrictEqual(parsed.servers.superpowers.args, ["-y", "superpowers-mcp"]);
    assert.strictEqual(parsed.servers.superpowers.type, "stdio");
});

it("should configure standard format (Cursor, Kimi, Claude) with 'mcpServers' root", () => {
    const original = JSON.stringify({
        mcpServers: {
            fetch: { command: "uvx", args: ["mcp-server-fetch"] }
        }
    });

    const updated = updateJsonConfig(original, "json-mcpServers", "npx", ["-y", "superpowers-mcp"]);
    const parsed = JSON.parse(updated);

    assert.ok(parsed.mcpServers, "Must have 'mcpServers' key");
    assert.strictEqual(parsed.mcpServers.fetch.command, "uvx", "Must preserve existing server");
    assert.strictEqual(parsed.mcpServers.superpowers.command, "npx");
    assert.deepStrictEqual(parsed.mcpServers.superpowers.args, ["-y", "superpowers-mcp"]);
    assert.strictEqual(parsed.mcpServers.superpowers.type, undefined);
});

it("should configure Kilo format with 'mcp' root and 'local' type", () => {
    const original = JSON.stringify({
        mcp: {
            existingTool: { type: "local", command: ["node", "test.js"], enabled: true }
        }
    });

    const updated = updateJsonConfig(original, "json-mcp", "npx", ["-y", "superpowers-mcp"]);
    const parsed = JSON.parse(updated);

    assert.ok(parsed.mcp, "Must have 'mcp' root key");
    assert.strictEqual(parsed.mcp.existingTool.type, "local");
    assert.strictEqual(parsed.mcp.superpowers.type, "local");
    assert.deepStrictEqual(parsed.mcp.superpowers.command, ["npx", "-y", "superpowers-mcp"]);
    assert.strictEqual(parsed.mcp.superpowers.enabled, true);

    const removed = updateJsonConfig(updated, "json-mcp", "npx", [], true);
    const parsedRemoved = JSON.parse(removed);
    assert.strictEqual(parsedRemoved.mcp.superpowers, undefined);
    assert.ok(parsedRemoved.mcp.existingTool, "Must preserve existingTool");
});

it("should support removing superpowers from JSON configuration", () => {
    const original = JSON.stringify({
        mcpServers: {
            superpowers: { command: "npx", args: ["-y", "superpowers-mcp"] },
            other: { command: "node", args: [] }
        }
    });

    const updated = updateJsonConfig(original, "json-mcpServers", "npx", [], true);
    const parsed = JSON.parse(updated);

    assert.strictEqual(parsed.mcpServers.superpowers, undefined);
    assert.ok(parsed.mcpServers.other);
});

// 2. JSON Edge Cases: JSONC (Comments & Trailing Commas), Nulls, Arrays
it("should parse and tolerate JSONC with comments and trailing commas", () => {
    const jsonc = `{
        // User custom comment
        /* Multi-line
           comment */
        "mcpServers": {
            "fetch": { "command": "uvx", "args": ["fetch"], },
        },
    }`;

    const updated = updateJsonConfig(jsonc, "json-mcpServers", "npx", ["-y", "superpowers-mcp"]);
    const parsed = JSON.parse(updated);
    assert.ok(parsed.mcpServers.fetch);
    assert.ok(parsed.mcpServers.superpowers);
});

it("should defend against polynomial ReDoS (CodeQL js/polynomial-redos) and process inputs in linear time", () => {
    // Attack payload from CodeQL alert: starts with '/*' and with many repetitions of 'a/*' without closing '*/'
    const attackPayload = "/*" + "a/*".repeat(50000);
    const result = stripJsonComments(attackPayload);

    // Median of 3 runs (#6): a single wall-clock sample flaked on loaded CI.
    // The threshold only guards against an order-of-magnitude (quadratic) regression.
    const samples = [0, 0, 0].map(() => {
        const t = Date.now();
        stripJsonComments(attackPayload);
        return Date.now() - t;
    });
    samples.sort((a, b) => a - b);
    const elapsed = samples[1];

    assert.ok(elapsed < 500, `ReDoS payload took ${elapsed}ms (median), must be < 500ms`);
    assert.strictEqual(result, "");

    // Test with valid JSON and heavy repeated comment markers inside string literals
    const jsonWithStringComments = JSON.stringify({
        url: "https://example.com/api//v1/*test*/",
        tricky: "/* not a comment */, }",
        normal: 123
    });
    const sanitized = stripJsonComments(jsonWithStringComments);
    const parsed = JSON.parse(sanitized);
    assert.strictEqual(parsed.url, "https://example.com/api//v1/*test*/");
    assert.strictEqual(parsed.tricky, "/* not a comment */, }");
    assert.strictEqual(parsed.normal, 123);
});

it("should fail closed when root or mcpServers has an incompatible shape", () => {
    assert.throws(
        () => updateJsonConfig("null", "json-mcpServers", "npx", ["-y", "superpowers-mcp"]),
        /root must be an object/
    );
    assert.throws(
        () => updateJsonConfig(JSON.stringify({ mcpServers: [{ keep: "me" }] }), "json-mcpServers", "npx", ["-y", "superpowers-mcp"]),
        /field "mcpServers" must be an object/
    );
});

it("should throw a clear error on completely malformed JSON", () => {
    assert.throws(() => {
        updateJsonConfig("{ malformed json", "json-mcpServers", "npx", ["-y", "superpowers-mcp"]);
    }, /Failed to parse existing JSON/);
});

// 3. YAML Configuration Tests (Hermes)
it("should preserve commented YAML declarations through install, update and remove", () => {
    const original = 'mcp_servers: # configured servers\r\n# keep this comment\r\n  other:\r\n    command: "other#literal"\r\n';
    const installed = updateYamlConfig(original, "npx", ["-y", "superpowers-mcp"]);
    assert.ok(installed.includes("mcp_servers: # configured servers"));
    const commented = installed.replace("  superpowers:", "  superpowers: # my agent");
    const updated = updateYamlConfig(commented, "bunx", ["-y", "superpowers-mcp"]);
    assert.strictEqual((updated.match(/^  superpowers:/gm) || []).length, 1);
    assert.ok(updated.includes('command: "bunx"'));
    assert.ok(updated.includes("superpowers: # my agent"));
    assert.strictEqual(updateYamlConfig(updated, "bunx", ["-y", "superpowers-mcp"]), updated);
    const removed = updateYamlConfig(updated, "npx", [], true);
    assert.ok(!removed.includes("superpowers:"));
    assert.ok(removed.includes('# keep this comment'));
    assert.ok(removed.includes('command: "other#literal"'));
    assert.throws(() => updateYamlConfig('mcp_servers: # one\nmcp_servers: # two\n', 'npx', []), /duplicate/);
});

it("should stay linear on YAML padded with long whitespace runs", () => {
    // Regression guard for js/polynomial-redos: the old `\s*(.*?)\s*$` key match and the
    // unanchored `\s+#.*$` comment extraction both blew up on whitespace-padded input.
    const padding = " ".repeat(60000);
    const start = Date.now();

    const padded = `mcp_servers:${padding}\n  superpowers:${padding}# keep me\n`;
    const updated = updateYamlConfig(padded, "npx", ["-y", "superpowers-mcp"]);
    assert.strictEqual((updated.match(/superpowers:/g) || []).length, 1, "Must not duplicate superpowers block");
    assert.ok(updated.includes("# keep me"), "Must preserve the padded inline comment");
    assert.ok(updated.includes('command: "npx"'), "Must still rewrite the command");

    assert.throws(
        () => updateYamlConfig(`mcp_servers:${padding}extra\n`, "npx", []),
        /root-level block mapping/,
        "Padded inline values must still be rejected"
    );

    const removed = updateYamlConfig(`mcp_servers:\n  superpowers:${padding}# c\n  other:\n    command: x\n`, "npx", [], true);
    assert.ok(!removed.includes("superpowers:"), "Must remove the padded superpowers block");
    assert.ok(removed.includes("other:"), "Must preserve sibling servers");

    const elapsed = Date.now() - start;
    // Relaxed threshold (#6): only guards against super-linear blowups; the
    // absolute value is dominated by CI jitter, not by the algorithm.
    assert.ok(elapsed < 5000, `Padded YAML handling must stay linear (took ${elapsed}ms)`);
});

it("should emit clean desktop import JSON without modifying client files", () => {
    const { execFileSync, spawnSync } = require("child_process");
    const cli = path.join(__dirname, "../out/setup.js");
    for (const bun of [false, true]) {
        const flags = [cli, "--print-config", ...(bun ? ["--bun"] : [])];
        const json = JSON.parse(execFileSync(process.execPath, flags, { encoding: "utf8" }));
        assert.deepStrictEqual(json, { mcpServers: { superpowers: {
            command: bun ? "bunx" : "npx", args: ["-y", "superpowers-mcp"],
        } } });
    }
    // Verify fail-closed defense against conflicting flags in both out/setup.js and out/server.js
    const serverCli = path.join(__dirname, "../out/server.js");
    const conflictingCombos = [
        ["--target", "lmstudio"],
        ["--remove"],
        ["--backup"],
        ["--dry-run"],
    ];
    for (const combo of conflictingCombos) {
        const resSetup = spawnSync(process.execPath, [cli, "--print-config", ...combo], { encoding: "utf8" });
        assert.strictEqual(resSetup.status, 1, `out/setup.js with ${combo[0]} must exit code 1`);
        assert.strictEqual(resSetup.stdout, "");
        assert.ok(resSetup.stderr.includes("--print-config supports only --bun"));

        const resServer = spawnSync(process.execPath, [serverCli, "setup", "--print-config", ...combo], { encoding: "utf8" });
        assert.strictEqual(resServer.status, 1, `out/server.js with ${combo[0]} must exit code 1`);
        assert.strictEqual(resServer.stdout, "");
        assert.ok(resServer.stderr.includes("--print-config supports only --bun"));
    }
});

it("should create valid YAML structure from empty file", () => {
    const yaml = updateYamlConfig("", "npx", ["-y", "superpowers-mcp"]);
    assert.ok(yaml.includes("mcp_servers:"), "Must create mcp_servers root");
    assert.ok(yaml.includes("superpowers:"), "Must contain superpowers section");
    assert.ok(yaml.includes('command: "npx"'), "Must contain command");
    assert.ok(yaml.includes('args: ["-y","superpowers-mcp"]'), "Must contain args");
});

it("should inject superpowers into existing YAML with other configs", () => {
    const existing = `model: gpt-4
temperature: 0.7

mcp_servers:
  memory:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-memory"]
`;
    const updated = updateYamlConfig(existing, "npx", ["-y", "superpowers-mcp"]);
    assert.ok(updated.includes("model: gpt-4"));
    assert.ok(updated.includes("memory:"));
    assert.ok(updated.includes("superpowers:"));
});

it("should update superpowers in existing YAML without duplicating", () => {
    const existing = `mcp_servers:
  superpowers:
    command: "bunx"
    args: ["old-superpowers"]
`;
    const updated = updateYamlConfig(existing, "npx", ["-y", "superpowers-mcp"]);
    assert.ok(updated.includes('command: "npx"'));
    assert.strictEqual(updated.match(/superpowers:/g).length, 1, "Must not duplicate superpowers block");
});

it("should remove superpowers from YAML when remove=true", () => {
    const existing = `model: test
mcp_servers:
  superpowers:
    command: "npx"
    args: ["-y", "superpowers-mcp"]
  other:
    command: "python"
`;
    const updated = updateYamlConfig(existing, "npx", [], true);
    assert.ok(!updated.includes("superpowers:"), "Should not contain superpowers");
    assert.ok(updated.includes("other:"), "Should preserve other server");

    const nestedName = `mcp_servers:
  other:
    superpowers:
      command: "belongs-to-other"
`;
    const nestedNameResult = updateYamlConfig(nestedName, "npx", [], true);
    assert.ok(nestedNameResult.includes("belongs-to-other"), "Must not remove a nested key that merely has the same name");
});

it("should reject YAML shapes the updater cannot preserve safely", () => {
    assert.throws(
        () => updateYamlConfig("profile:\n  mcp_servers:\n    existing:\n      command: old\n", "npx", []),
        /root-level block mapping/
    );
    // An empty flow mapping is now expanded in place instead of rejected, so a
    // config left as `rootKey: {}` by a previous --remove stays installable.
    assert.doesNotThrow(() => updateYamlConfig("mcp_servers: {}\nother: true\n", "npx", []));
    assert.throws(
        () => updateYamlConfig("mcp_servers:\n  one: {}\nmcp_servers:\n  two: {}\n", "npx", []),
        /duplicate mcp_servers keys/
    );
});

it("should create valid TOML structure from empty file", () => {
    const toml = updateTomlConfig("", "npx", ["-y", "superpowers-mcp"]);
    assert.ok(toml.includes("[mcp_servers.superpowers]"), "Must create mcp_servers.superpowers table");
    assert.ok(toml.includes('command = "npx"'), "Must contain command");
    assert.ok(toml.includes('args = ["-y","superpowers-mcp"]'), "Must contain args");
});

it("should inject superpowers into existing TOML with other servers", () => {
    const existing = `model = "gpt-5"

[mcp_servers.other]
command = "other"
`;
    const updated = updateTomlConfig(existing, "npx", ["-y", "superpowers-mcp"]);
    assert.ok(updated.includes('model = "gpt-5"'), "Must preserve top-level keys");
    assert.ok(updated.includes("[mcp_servers.other]"), "Must preserve other server");
    assert.ok(updated.includes("[mcp_servers.superpowers]"), "Must contain superpowers table");
    assert.strictEqual(updated.match(/\[mcp_servers\.superpowers\]/g).length, 1, "Must not duplicate superpowers table");
});

it("should update superpowers in existing TOML without duplicating", () => {
    const existing = `[mcp_servers.superpowers]
command = "bunx"
args = ["old-superpowers"]
enabled = true

[mcp_servers.superpowers.env]
FOO = "bar"
`;
    const updated = updateTomlConfig(existing, "npx", ["-y", "superpowers-mcp"]);
    assert.ok(updated.includes('command = "npx"'), "Must update command");
    assert.ok(updated.includes("enabled = true"), "Must preserve user-added keys");
    assert.ok(updated.includes("[mcp_servers.superpowers.env]"), "Must preserve sub-tables");
    assert.strictEqual(updated.match(/\[mcp_servers\.superpowers\]/g).length, 1, "Must not duplicate superpowers table");
});

it("should treat equivalent TOML values as up-to-date", () => {
    const existing = `[mcp_servers.superpowers]
command = 'npx'  # kept comment
args = [ '-y', 'superpowers-mcp' ]
`;
    const updated = updateTomlConfig(existing, "npx", ["-y", "superpowers-mcp"]);
    assert.strictEqual(updated, existing, "Equivalent values must return content unchanged");
});

it("should remove superpowers from TOML when remove=true", () => {
    const existing = `model = "gpt-5"

[mcp_servers.superpowers]
command = "npx"
args = ["-y", "superpowers-mcp"]

[mcp_servers.superpowers.env]
FOO = "bar"

[mcp_servers.other]
command = "other"
`;
    const updated = updateTomlConfig(existing, "npx", [], true);
    assert.ok(!updated.includes("superpowers"), "Should not contain superpowers or its sub-tables");
    assert.ok(updated.includes("[mcp_servers.other]"), "Should preserve other server");
    assert.ok(updated.includes('model = "gpt-5"'), "Should preserve top-level keys");

    const untouched = updateTomlConfig("[mcp_servers.other]\ncommand = \"other\"\n", "npx", [], true);
    assert.ok(untouched.includes("[mcp_servers.other]"), "Remove without our table must leave content unchanged");
});

it("should reject TOML shapes the updater cannot preserve safely", () => {
    assert.throws(
        () => updateTomlConfig("[mcp_servers.superpowers]\ncommand = \"a\"\n[mcp_servers.superpowers]\ncommand = \"b\"\n", "npx", []),
        /duplicate mcp_servers\.superpowers tables/
    );
    assert.throws(
        () => updateTomlConfig('["mcp_servers"."superpowers"]\ncommand = "a"\n', "npx", []),
        /quoted mcp_servers\.superpowers table names/
    );
});

it("should create valid goose extensions structure from empty file", () => {
    const yaml = updateYamlConfig("", "npx", ["-y", "superpowers-mcp"], false, "goose");
    assert.ok(yaml.includes("extensions:"), "Must create extensions root");
    assert.ok(yaml.includes("superpowers:"), "Must contain superpowers entry");
    assert.ok(yaml.includes('cmd: "npx"'), "Must contain cmd (goose uses cmd, not command)");
    assert.ok(yaml.includes('args: ["-y","superpowers-mcp"]'), "Must contain args");
    assert.ok(yaml.includes("type: stdio"), "Must contain type");
    assert.ok(!yaml.includes("mcp_servers:"), "Must not create hermes-style root");
});

it("should merge goose entry preserving user enabled/timeout/envs", () => {
    const existing = `extensions:
  github:
    cmd: "npx"
    type: stdio
  superpowers:
    cmd: "bunx"
    args: ["old"]
    enabled: false
    timeout: 600
    envs: { "FOO": "bar" }
`;
    const updated = updateYamlConfig(existing, "npx", ["-y", "superpowers-mcp"], false, "goose");
    assert.ok(updated.includes('cmd: "npx"'), "Must update cmd");
    assert.ok(updated.includes("enabled: false"), "Must not flip user's enabled switch");
    assert.ok(updated.includes("timeout: 600"), "Must preserve user's timeout");
    assert.ok(updated.includes('envs: { "FOO": "bar" }'), "Must preserve user's envs");
    assert.ok(updated.includes("github:"), "Must preserve other extensions");
    assert.strictEqual(updated.match(/superpowers:/g).length, 1, "Must not duplicate superpowers entry");
    assert.strictEqual(updated.match(/^\s*enabled:/gm).length, 1, "Must not duplicate enabled key");
});

it("should remove goose entry preserving others", () => {
    const existing = `extensions:
  superpowers:
    cmd: "npx"
  other:
    cmd: "python"
`;
    const updated = updateYamlConfig(existing, "npx", [], true, "goose");
    assert.ok(!updated.includes("superpowers:"), "Should not contain superpowers");
    assert.ok(updated.includes("other:"), "Should preserve other extensions");
});

it("should reject duplicate extensions roots", () => {
    assert.throws(
        () => updateYamlConfig("extensions:\n  one: {}\nextensions:\n  two: {}\n", "npx", [], false, "goose"),
        /duplicate extensions keys/
    );
});

it("should create nested mcp.servers.superpowers for OpenClaw-style configs", () => {
    const out = updateJsonConfig("", "json-mcpServers", "npx", ["-y", "superpowers-mcp"], false, undefined, ["mcp", "servers"]);
    assert.deepStrictEqual(JSON.parse(out).mcp.servers.superpowers, { command: "npx", args: ["-y", "superpowers-mcp"] });
});

it("should merge into existing nested servers preserving user fields", () => {
    const existing = JSON.stringify({ mcp: { servers: {
        other: { command: "other" },
        superpowers: { command: "bunx", args: ["old"], enabled: false },
    } } });
    const out = updateJsonConfig(existing, "json-mcpServers", "npx", ["-y", "superpowers-mcp"], false, undefined, ["mcp", "servers"]);
    const json = JSON.parse(out);
    assert.strictEqual(json.mcp.servers.superpowers.command, "npx");
    assert.strictEqual(json.mcp.servers.superpowers.enabled, false, "Must preserve user's enabled switch");
    assert.ok(json.mcp.servers.other, "Must preserve sibling servers");
});

it("should remove nested superpowers without touching siblings", () => {
    const existing = JSON.stringify({ mcp: { servers: { superpowers: { command: "x" }, other: { command: "y" } } }, gateway: {} });
    const out = updateJsonConfig(existing, "json-mcpServers", "npx", [], true, undefined, ["mcp", "servers"]);
    const json = JSON.parse(out);
    assert.ok(!("superpowers" in json.mcp.servers));
    assert.ok(json.mcp.servers.other);
    assert.ok(json.gateway, "Must preserve sibling subtrees");
    const untouched = updateJsonConfig(JSON.stringify({ mcp: {} }), "json-mcpServers", "npx", [], true, undefined, ["mcp", "servers"]);
    assert.strictEqual(JSON.parse(untouched).mcp.servers, undefined, "Remove with missing path must leave content unchanged");
});

it("should reject non-object nested containers", () => {
    assert.throws(
        () => updateJsonConfig(JSON.stringify({ mcp: { servers: "nope" } }), "json-mcpServers", "npx", [], false, undefined, ["mcp", "servers"]),
        /must be an object/
    );
});

it("should preserve nested keys that share managed names (yaml direct-child only)", () => {
    const mcpExisting = `mcp_servers:
  superpowers:
    command: "bunx"
    args: ["old"]
    env:
      command: my-nested-value
      OTHER: 1
`;
    const mcpUpdated = updateYamlConfig(mcpExisting, "npx", ["-y"], false, "mcp");
    assert.ok(mcpUpdated.includes('command: "npx"'), "Must update direct command");
    assert.ok(mcpUpdated.includes("my-nested-value"), "Must preserve nested command under env");
    assert.ok(mcpUpdated.includes("OTHER: 1"), "Must preserve sibling nested keys");

    const gooseExisting = `extensions:
  superpowers:
    cmd: "bunx"
    args: ["old"]
    enabled: false
    envs:
      type: foo
      MYVAR: bar
`;
    const gooseUpdated = updateYamlConfig(gooseExisting, "npx", ["-y", "superpowers-mcp"], false, "goose");
    assert.ok(gooseUpdated.includes('cmd: "npx"'), "Must update direct cmd");
    assert.ok(gooseUpdated.includes("type: foo"), "Must preserve nested type under envs");
    assert.ok(gooseUpdated.includes("MYVAR: bar"), "Must preserve sibling nested keys");
    assert.ok(gooseUpdated.includes("enabled: false"), "Must preserve enabled");
});

it("should preserve user-customized goose name on update", () => {
    const existing = `extensions:
  superpowers:
    name: "My Custom"
    cmd: "bunx"
    args: ["old"]
    type: stdio
`;
    const updated = updateYamlConfig(existing, "npx", ["-y", "superpowers-mcp"], false, "goose");
    assert.ok(updated.includes('name: "My Custom"'), "Must not overwrite user name");
    assert.ok(updated.includes('cmd: "npx"'), "Must update direct cmd");
});

it("should accept YAML root with space before colon without duplicating", () => {
    const existing = `extensions :\n  superpowers:\n    cmd: "x"\n`;
    const updated = updateYamlConfig(existing, "npx", ["-y"], false, "goose");
    assert.strictEqual(updated.match(/extensions\s*:/g).length, 1, "Must not duplicate extensions root");
    assert.ok(updated.includes('cmd: "npx"'), "Must update entry");
});

it("should reject TOML inline mcp_servers assignments", () => {
    assert.throws(
        () => updateTomlConfig('mcp_servers = { superpowers = { command = "old" } }\n', "npx", []),
        /inline mcp_servers/
    );
    assert.throws(
        () => updateTomlConfig('mcp_servers.superpowers = { command = "old" }\n', "npx", []),
        /inline mcp_servers/
    );
});

it("should handle escaped quotes in TOML comment scan", () => {
    const existing = `[mcp_servers.superpowers]\ncommand = "npx"\nargs = ["-y"]\nnote = "a \\" # not comment"\n`;
    const updated = updateTomlConfig(existing, "npx", ["-y"]);
    assert.ok(updated.includes("note ="), "Must preserve user key with escaped quote");
});

// 3b. YAML idempotency: re-running setup must not rewrite the user's file.
it("should preserve a trailing newline when updating an existing YAML entry", () => {
    const original = "mcp_servers:\n  superpowers:\n    command: OLD\n";
    const updated = updateYamlConfig(original, "npx", ["-y"], false, "mcp");
    assert.ok(
        updated.endsWith("\n"),
        "trailing newline must survive the line-splice reassembly"
    );
    // The real invariant: a second identical run is a byte-for-byte no-op.
    assert.strictEqual(
        updateYamlConfig(updated, "npx", ["-y"], false, "mcp"),
        updated,
        "re-running setup must be idempotent"
    );
});

it("should preserve trailing-newline state across CRLF install/update/remove", () => {
    const original = 'mcp_servers: # c\r\n  other:\r\n    command: "x"\r\n';
    const installed = updateYamlConfig(original, "npx", ["-y"], false, "mcp");
    assert.ok(installed.endsWith("\r\n"), "CRLF convention must be preserved");
    const updated = updateYamlConfig(installed, "npx", ["-y"], false, "mcp");
    assert.strictEqual(updated, installed, "CRLF update must be idempotent");
    const removed = updateYamlConfig(updated, "npx", ["-y"], true, "mcp");
    assert.ok(removed.endsWith("\r\n"), "CRLF convention must survive removal");
});

// Regression (CodeQL js/polynomial-redos #8): the trailing-newline normalizer
// used `/(?:\r?\n)+$/`, which rescans every "\n" run once per candidate start
// position — quadratic on newline-padded input (5k→29ms, 10k→104ms, 20k→422ms
// measured pre-fix). A mid-file run with no trailing EOL exercises the
// strip-all branch; it must pass through byte-identical, in milliseconds.
it("should pass long newline runs through in linear time without changing bytes", () => {
    const padded = `mcp_servers:\n  other:\n    x: 1${"\n".repeat(60000)}tail: 2`;
    const start = Date.now();
    const result = updateYamlConfig(padded, "npx", ["-y"], true, "mcp");
    const elapsed = Date.now() - start;
    assert.strictEqual(result, padded, "newline runs must pass through byte-identical");
    assert.ok(elapsed < 2000, `newline run took ${elapsed}ms, expected well under 2s`);
});

// Regression: removing the last managed entry used to leave a bare `mcp_servers:`
// header, which parses as a null value rather than an empty map. Clients that
// distinguish null from absent reject the resulting config.
it("should emit an explicit empty map when removal empties the root key", () => {
    const removed = updateYamlConfig(
        "mcp_servers:\n  superpowers:\n    enabled: true\n",
        "npx",
        [],
        true,
        "mcp"
    );
    assert.strictEqual(removed, "mcp_servers: {}\n");
    assert.ok(
        !/^mcp_servers:\s*$/m.test(removed),
        "must not leave a valueless (null) root key"
    );
});

it("should not rewrite the root key when sibling entries survive removal", () => {
    const removed = updateYamlConfig(
        "mcp_servers:\n  other:\n    x: 1\n  superpowers:\n    enabled: true\n",
        "npx",
        [],
        true,
        "mcp"
    );
    assert.strictEqual(removed, "mcp_servers:\n  other:\n    x: 1\n");
    assert.ok(!removed.includes("{}"), "non-empty map must not be collapsed to {}");
});

// Regression: YAML permits quoting the root key (`"mcp_servers":`). The updater
// did not match quoted forms, so the add path appended a *second* unquoted
// `mcp_servers:` block — a duplicate-key mapping — and remove silently no-op'd.
it("should update in place under a double-quoted root key without duplicating it", () => {
    const existing = '"mcp_servers":\n  other:\n    x: 1\n';
    const added = updateYamlConfig(existing, "npx", ["-y"], false, "mcp");
    assert.strictEqual(
        (added.match(/^\s*["']?mcp_servers["']?\s*:/gm) || []).length,
        1,
        "must not emit a duplicate root key"
    );
    assert.ok(added.startsWith('"mcp_servers":'), "quoted style must be preserved");
    assert.ok(added.includes("superpowers:"), "entry must actually be added");
});

it("should update in place under a single-quoted root key", () => {
    const existing = "'mcp_servers':\n  other:\n    x: 1\n";
    const added = updateYamlConfig(existing, "npx", ["-y"], false, "mcp");
    assert.strictEqual(
        (added.match(/^\s*["']?mcp_servers["']?\s*:/gm) || []).length,
        1,
        "must not emit a duplicate root key"
    );
    assert.ok(added.includes("superpowers:"), "entry must actually be added");
});

it("should remove entries nested under a quoted root key", () => {
    const removed = updateYamlConfig(
        '"mcp_servers":\n  superpowers:\n    enabled: true\n',
        "npx",
        [],
        true,
        "mcp"
    );
    assert.strictEqual(removed, "mcp_servers: {}\n");
    assert.ok(!removed.includes("superpowers"), "entry must actually be removed");
});

it("should remove entries whose own key is quoted", () => {
    const removed = updateYamlConfig(
        'mcp_servers:\n  "superpowers":\n    enabled: true\n',
        "npx",
        [],
        true,
        "mcp"
    );
    assert.ok(!removed.includes("superpowers"), "quoted child key must be removed");
    assert.strictEqual(removed, "mcp_servers: {}\n");
});

it("should apply the empty-map rule to the goose extensions profile", () => {
    const removed = updateYamlConfig(
        "extensions:\n  superpowers:\n    enabled: true\n",
        "npx",
        [],
        true,
        "goose"
    );
    assert.strictEqual(removed, "extensions: {}\n");
});

// 4. Platform Path Resolvers & Unknown Target Defense
it("should correctly resolve paths for macOS, Windows, Linux", () => {
    const home = "/mock/home";
    const appData = "C:\\Users\\mock\\AppData\\Roaming";
    const localAppData = "C:\\Users\\mock\\AppData\\Local";

    for (const platform of ["darwin", "win32", "linux"]) {
        assert.strictEqual(HARNESS_CONFIGS.lmstudio.getConfigPath(platform, home, appData), path.join(home, ".lmstudio", "mcp.json"));
        const base = platform === "win32" ? appData : platform === "darwin"
            ? path.join(home, "Library", "Application Support") : path.join(home, ".config");
        assert.strictEqual(HARNESS_CONFIGS.roo.getConfigPath(platform, home, appData),
            path.join(base, "Code", "User", "globalStorage", "rooveterinaryinc.roo-cline", "settings", "mcp_settings.json"));
        assert.strictEqual(HARNESS_CONFIGS.codex.getConfigPath(platform, home, appData),
            path.join(home, ".codex", "config.toml"));
        assert.strictEqual(HARNESS_CONFIGS.openclaw.getConfigPath(platform, home, appData),
            path.join(home, ".openclaw", "openclaw.json"));
        const gooseExpect = platform === "win32"
            ? path.join(appData, "Block", "goose", "config", "config.yaml")
            : path.join(home, ".config", "goose", "config.yaml");
        assert.strictEqual(HARNESS_CONFIGS.goose.getConfigPath(platform, home, appData), gooseExpect);
    }

    // Copilot
    assert.strictEqual(
        HARNESS_CONFIGS.copilot.getConfigPath("darwin", home),
        path.join(home, "Library", "Application Support", "Code", "User", "mcp.json")
    );
    assert.strictEqual(
        HARNESS_CONFIGS.copilot.getConfigPath("linux", home),
        path.join(home, ".config", "Code", "User", "mcp.json")
    );
    assert.strictEqual(
        HARNESS_CONFIGS.copilot.getConfigPath("win32", home, appData),
        path.join(appData, "Code", "User", "mcp.json")
    );

    // Copilot Insiders
    assert.strictEqual(
        HARNESS_CONFIGS["copilot-insiders"].getConfigPath("darwin", home),
        path.join(home, "Library", "Application Support", "Code - Insiders", "User", "mcp.json")
    );
    assert.strictEqual(
        HARNESS_CONFIGS["copilot-insiders"].getConfigPath("linux", home),
        path.join(home, ".config", "Code - Insiders", "User", "mcp.json")
    );
    assert.strictEqual(
        HARNESS_CONFIGS["copilot-insiders"].getConfigPath("win32", home, appData),
        path.join(appData, "Code - Insiders", "User", "mcp.json")
    );
    assert.ok(HARNESS_CONFIGS["copilot-insiders"].aliases.includes("vscode-insiders"));
    assert.ok(HARNESS_CONFIGS["copilot-insiders"].aliases.includes("code-insiders"));
    assert.ok(HARNESS_CONFIGS["copilot-insiders"].aliases.includes("insiders"));
    assert.ok(HARNESS_CONFIGS["copilot-insiders"].aliases.includes("insider"));
    assert.ok(HARNESS_CONFIGS["copilot-insiders"].aliases.includes("vscode-insider"));
    assert.ok(HARNESS_CONFIGS["copilot-insiders"].aliases.includes("code-insider"));
    assert.ok(HARNESS_CONFIGS["copilot-insiders"].aliases.includes("copilot-insider"));

    // Cursor
    assert.strictEqual(
        HARNESS_CONFIGS.cursor.getConfigPath("darwin", home),
        path.join(home, ".cursor", "mcp.json")
    );
    assert.strictEqual(
        HARNESS_CONFIGS.cursor.getConfigPath("win32", home),
        path.join(home, ".cursor", "mcp.json")
    );

    // Hermes (Windows fallback test)
    assert.strictEqual(
        HARNESS_CONFIGS.hermes.getConfigPath("darwin", home),
        path.join(home, ".hermes", "config.yaml")
    );
    assert.strictEqual(
        HARNESS_CONFIGS.hermes.getConfigPath("win32", home, appData, localAppData),
        path.join(localAppData, "hermes", "config.yaml")
    );
    assert.strictEqual(
        HARNESS_CONFIGS.hermes.getConfigPath("win32", home, appData, undefined),
        path.join(home, "AppData", "Local", "hermes", "config.yaml")
    );

    // Kimi
    assert.strictEqual(
        HARNESS_CONFIGS.kimi.getConfigPath("darwin", home),
        path.join(home, ".kimi-code", "mcp.json")
    );

    // Devin Desktop (formerly Windsurf)
    assert.strictEqual(
        HARNESS_CONFIGS.devin.getConfigPath("darwin", home),
        path.join(home, ".codeium", "windsurf", "mcp_config.json")
    );
    assert.ok(HARNESS_CONFIGS.devin.aliases.includes("windsurf"));

    // QwenPaw
    assert.strictEqual(
        HARNESS_CONFIGS.qwenpaw.getConfigPath("darwin", home),
        path.join(home, ".qwenpaw", "config.json")
    );
    assert.ok(HARNESS_CONFIGS.qwenpaw.aliases.includes("qwen-paw"));
    assert.ok(HARNESS_CONFIGS.qwenpaw.aliases.includes("copaw"));

    // Cline
    assert.strictEqual(
        HARNESS_CONFIGS.cline.getConfigPath("darwin", home),
        path.join(home, "Library", "Application Support", "Code", "User", "globalStorage", "saoudrizwan.claude-dev", "settings", "cline_mcp_settings.json")
    );
    assert.strictEqual(
        HARNESS_CONFIGS.cline.getConfigPath("win32", home, appData),
        path.join(appData, "Code", "User", "globalStorage", "saoudrizwan.claude-dev", "settings", "cline_mcp_settings.json")
    );
    assert.strictEqual(
        HARNESS_CONFIGS.cline.getConfigPath("linux", home),
        path.join(home, ".config", "Code", "User", "globalStorage", "saoudrizwan.claude-dev", "settings", "cline_mcp_settings.json")
    );
    assert.ok(HARNESS_CONFIGS.cline.aliases.includes("claude-dev"));

    // Kilo Code
    assert.strictEqual(
        HARNESS_CONFIGS.kilo.getConfigPath("darwin", home),
        path.join(home, ".config", "kilo", "kilo.jsonc")
    );
    assert.ok(HARNESS_CONFIGS.kilo.aliases.includes("kilocode"));
    assert.ok(HARNESS_CONFIGS.kilo.aliases.includes("kilo-code"));

    // Qoder
    assert.strictEqual(
        HARNESS_CONFIGS.qoder.getConfigPath("darwin", home),
        path.join(home, ".qoder", "settings.json")
    );

    // Kiro
    assert.strictEqual(
        HARNESS_CONFIGS.kiro.getConfigPath("darwin", home),
        path.join(home, ".kiro", "settings", "mcp.json")
    );
    assert.ok(HARNESS_CONFIGS.kiro.aliases.includes("kiro-code"));

    // Claude Desktop
    assert.strictEqual(
        HARNESS_CONFIGS.claude.getConfigPath("darwin", home),
        path.join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json")
    );
    assert.strictEqual(
        HARNESS_CONFIGS.claude.getConfigPath("win32", home, appData),
        path.join(appData, "Claude", "claude_desktop_config.json")
    );
    assert.strictEqual(
        HARNESS_CONFIGS.claude.getConfigPath("linux", home),
        path.join(home, ".config", "Claude", "claude_desktop_config.json")
    );
    assert.ok(HARNESS_CONFIGS.claude.aliases.includes("claude-desktop"));

    // Trae
    assert.strictEqual(
        HARNESS_CONFIGS.trae.getConfigPath("darwin", home),
        path.join(home, "Library", "Application Support", "Trae", "User", "mcp.json")
    );
    assert.strictEqual(
        HARNESS_CONFIGS.trae.getConfigPath("win32", home, appData),
        path.join(appData, "Trae", "User", "mcp.json")
    );
    assert.strictEqual(
        HARNESS_CONFIGS.trae.getConfigPath("linux", home),
        path.join(home, ".config", "Trae", "User", "mcp.json")
    );
});

// 5. runSetup sandbox, Atomic Write & Backup verification
(async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sp-setup-test-"));
    try {
        const mockHome = path.join(tmpDir, "home");
        fs.mkdirSync(mockHome, { recursive: true });

        // No target specified throws (Anti-virus protection)
        await assert.rejects(async () => {
            await runSetup({ platform: "darwin", homeDir: mockHome });
        }, /No target client specified/);
        console.log("  ✅ PASS: No target client specified correctly rejected with error (anti-bulk modification)");
        passed++;

        // Unknown target throws
        await assert.rejects(async () => {
            await runSetup({ platform: "darwin", homeDir: mockHome, target: "non_existent_app" });
        }, /Unknown harness target/);
        console.log("  ✅ PASS: Unknown harness target correctly rejected with error");
        passed++;

        // Desktop targets: real temporary-file merge, idempotence, dry run and removal.
        for (const target of ["lm-studio", "roo-code"]) {
            const installed = await runSetup({ platform: "darwin", homeDir: mockHome, target });
            assert.strictEqual(installed[0].status, "created");
            const configPath = installed[0].path;
            const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
            config.mcpServers.other = { command: "other" };
            config.theme = "dark";
            fs.writeFileSync(configPath, JSON.stringify(config));
            const before = fs.readFileSync(configPath, "utf8");
            await runSetup({ platform: "darwin", homeDir: mockHome, target, bun: true, dryRun: true });
            assert.strictEqual(fs.readFileSync(configPath, "utf8"), before);
            const changed = await runSetup({ platform: "darwin", homeDir: mockHome, target, bun: true });
            assert.strictEqual(changed[0].status, "updated");
            assert.strictEqual(JSON.parse(fs.readFileSync(configPath, "utf8")).mcpServers.superpowers.command, "bunx");
            const again = await runSetup({ platform: "darwin", homeDir: mockHome, target, bun: true });
            assert.strictEqual(again[0].status, "up-to-date");
            const removed = await runSetup({ platform: "darwin", homeDir: mockHome, target, remove: true });
            assert.strictEqual(removed[0].status, "removed");
            assert.deepStrictEqual(JSON.parse(fs.readFileSync(configPath, "utf8")), { mcpServers: { other: { command: "other" } }, theme: "dark" });
            console.log(`  ✅ PASS: ${target} install, merge, dry run, Bun, idempotence and removal`);
            passed++;
        }

        // Codex (TOML): real temporary-file merge, idempotence, dry run and removal.
        {
            const installed = await runSetup({ platform: "darwin", homeDir: mockHome, target: "codex" });
            assert.strictEqual(installed[0].status, "created");
            assert.ok(installed[0].path.endsWith(path.join(".codex", "config.toml")));
            const created = fs.readFileSync(installed[0].path, "utf8");
            assert.ok(created.includes("[mcp_servers.superpowers]"));
            const withOther = `${created.trimEnd()}\n\nmodel = "gpt-5"\n\n[mcp_servers.other]\ncommand = "other"\n`;
            fs.writeFileSync(installed[0].path, withOther);
            const before = fs.readFileSync(installed[0].path, "utf8");
            await runSetup({ platform: "darwin", homeDir: mockHome, target: "codex", bun: true, dryRun: true });
            assert.strictEqual(fs.readFileSync(installed[0].path, "utf8"), before);
            const changed = await runSetup({ platform: "darwin", homeDir: mockHome, target: "codex", bun: true });
            assert.strictEqual(changed[0].status, "updated");
            const merged = fs.readFileSync(installed[0].path, "utf8");
            assert.ok(merged.includes('command = "bunx"'));
            assert.ok(merged.includes("[mcp_servers.other]"));
            assert.ok(merged.includes('model = "gpt-5"'));
            const again = await runSetup({ platform: "darwin", homeDir: mockHome, target: "codex", bun: true });
            assert.strictEqual(again[0].status, "up-to-date");
            const removed = await runSetup({ platform: "darwin", homeDir: mockHome, target: "codex", remove: true });
            assert.strictEqual(removed[0].status, "removed");
            const cleaned = fs.readFileSync(installed[0].path, "utf8");
            assert.ok(!cleaned.includes("superpowers"));
            assert.ok(cleaned.includes("[mcp_servers.other]"));
            console.log("  ✅ PASS: codex install, merge, dry run, Bun, idempotence and removal");
            passed++;
        }

        // OpenClaw (nested JSON): real temporary-file merge, idempotence, dry run and removal.
        {
            const installed = await runSetup({ platform: "darwin", homeDir: mockHome, target: "openclaw" });
            assert.strictEqual(installed[0].status, "created");
            assert.ok(installed[0].path.endsWith(path.join(".openclaw", "openclaw.json")));
            const created = JSON.parse(fs.readFileSync(installed[0].path, "utf8"));
            assert.deepStrictEqual(created.mcp.servers.superpowers, { command: "npx", args: ["-y", "superpowers-mcp"] });
            const withOther = { mcp: { servers: { ...created.mcp.servers, other: { command: "other" } } }, gateway: { port: 18789 } };
            fs.writeFileSync(installed[0].path, JSON.stringify(withOther));
            const before = fs.readFileSync(installed[0].path, "utf8");
            await runSetup({ platform: "darwin", homeDir: mockHome, target: "openclaw", bun: true, dryRun: true });
            assert.strictEqual(fs.readFileSync(installed[0].path, "utf8"), before);
            const changed = await runSetup({ platform: "darwin", homeDir: mockHome, target: "openclaw", bun: true });
            assert.strictEqual(changed[0].status, "updated");
            const merged = JSON.parse(fs.readFileSync(installed[0].path, "utf8"));
            assert.strictEqual(merged.mcp.servers.superpowers.command, "bunx");
            assert.ok(merged.mcp.servers.other);
            assert.strictEqual(merged.gateway.port, 18789);
            const again = await runSetup({ platform: "darwin", homeDir: mockHome, target: "openclaw", bun: true });
            assert.strictEqual(again[0].status, "up-to-date");
            const removed = await runSetup({ platform: "darwin", homeDir: mockHome, target: "openclaw", remove: true });
            assert.strictEqual(removed[0].status, "removed");
            const cleaned = JSON.parse(fs.readFileSync(installed[0].path, "utf8"));
            assert.ok(!("superpowers" in cleaned.mcp.servers));
            assert.ok(cleaned.mcp.servers.other);
            console.log("  ✅ PASS: openclaw install, merge, dry run, Bun, idempotence and removal");
            passed++;
        }

        // Goose (YAML extensions profile): real temporary-file merge, idempotence, dry run and removal.
        {
            const installed = await runSetup({ platform: "darwin", homeDir: mockHome, target: "goose" });
            assert.strictEqual(installed[0].status, "created");
            assert.ok(installed[0].path.endsWith(path.join("goose", "config.yaml")));
            let content = fs.readFileSync(installed[0].path, "utf8");
            assert.ok(content.includes("extensions:"));
            const withOther = `extensions:\n  superpowers:\n    cmd: "npx"\n    args: ["-y", "superpowers-mcp"]\n    enabled: false\n    type: stdio\n    timeout: 600\n  developer:\n    cmd: "other"\n    type: stdio\n`;
            fs.writeFileSync(installed[0].path, withOther);
            const before = fs.readFileSync(installed[0].path, "utf8");
            await runSetup({ platform: "darwin", homeDir: mockHome, target: "goose", bun: true, dryRun: true });
            assert.strictEqual(fs.readFileSync(installed[0].path, "utf8"), before);
            const changed = await runSetup({ platform: "darwin", homeDir: mockHome, target: "goose", bun: true });
            assert.strictEqual(changed[0].status, "updated");
            content = fs.readFileSync(installed[0].path, "utf8");
            assert.ok(content.includes('cmd: "bunx"'));
            assert.ok(content.includes("enabled: false"), "Must not flip user's enabled switch");
            assert.ok(content.includes("developer:"));
            assert.strictEqual(content.match(/^\s*enabled:/gm).length, 1, "Must not duplicate enabled key");
            const again = await runSetup({ platform: "darwin", homeDir: mockHome, target: "goose", bun: true });
            assert.strictEqual(again[0].status, "up-to-date");
            const removed = await runSetup({ platform: "darwin", homeDir: mockHome, target: "goose", remove: true });
            assert.strictEqual(removed[0].status, "removed");
            content = fs.readFileSync(installed[0].path, "utf8");
            assert.ok(!content.includes("superpowers"));
            assert.ok(content.includes("developer:"));
            console.log("  ✅ PASS: goose install, merge, dry run, Bun, idempotence and removal");
            passed++;
        }

        // Test explicit target cursor creation
        const results = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "cursor",
        });

        assert.strictEqual(results.length, 1);
        assert.strictEqual(results[0].target, "cursor");
        assert.strictEqual(results[0].status, "created");

        const cursorConfig = JSON.parse(fs.readFileSync(results[0].path, "utf8"));
        assert.strictEqual(cursorConfig.mcpServers.superpowers.command, "npx");

        // Test alias windsurf -> devin
        const devinRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "windsurf",
        });
        assert.strictEqual(devinRes.length, 1);
        assert.strictEqual(devinRes[0].target, "devin");
        assert.strictEqual(devinRes[0].status, "created");
        console.log("  ✅ PASS: Alias 'windsurf' correctly resolves to 'devin'");
        passed++;

        // Test Antigravity and its aliases (agy, gemini)
        const agyRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "agy",
        });
        assert.strictEqual(agyRes.length, 1);
        assert.strictEqual(agyRes[0].target, "antigravity");
        assert.strictEqual(agyRes[0].status, "created");
        assert.ok(agyRes[0].path.endsWith(path.join(".gemini", "config", "mcp_config.json")));

        const geminiRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "gemini",
        });
        assert.strictEqual(geminiRes.length, 1);
        assert.strictEqual(geminiRes[0].target, "antigravity");
        assert.strictEqual(geminiRes[0].status, "up-to-date");
        console.log("  ✅ PASS: Antigravity target and aliases ('agy', 'gemini') correctly configure mcp_config.json");
        passed++;

        // Test Pi Desktop and aliases ('pi', 'pi-agent')
        const piRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "pi-desktop",
        });
        assert.strictEqual(piRes.length, 1);
        assert.strictEqual(piRes[0].target, "pi-desktop");
        assert.strictEqual(piRes[0].status, "created");
        assert.ok(piRes[0].path.endsWith(path.join(".pi", "agent", "mcp.json")));

        const piAliasRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "pi",
        });
        assert.strictEqual(piAliasRes.length, 1);
        assert.strictEqual(piAliasRes[0].target, "pi-desktop");
        assert.strictEqual(piAliasRes[0].status, "up-to-date");
        console.log("  ✅ PASS: Pi Desktop target and aliases ('pi', 'pi-agent') correctly configure ~/.pi/agent/mcp.json");
        passed++;

        // Test Copilot Insiders and aliases ('vscode-insiders', 'insiders')
        const insidersRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "copilot-insiders",
        });
        assert.strictEqual(insidersRes.length, 1);
        assert.strictEqual(insidersRes[0].target, "copilot-insiders");
        assert.strictEqual(insidersRes[0].status, "created");
        assert.ok(insidersRes[0].path.includes("Code - Insiders"));
        const insidersContent = JSON.parse(fs.readFileSync(insidersRes[0].path, "utf8"));
        assert.strictEqual(insidersContent.servers.superpowers.type, "stdio");

        const insidersAliasRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "vscode-insiders",
        });
        assert.strictEqual(insidersAliasRes.length, 1);
        assert.strictEqual(insidersAliasRes[0].target, "copilot-insiders");
        assert.strictEqual(insidersAliasRes[0].status, "up-to-date");

        // Test singular alias 'insider'
        const insiderSingularRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "insider",
        });
        assert.strictEqual(insiderSingularRes[0].target, "copilot-insiders");
        assert.strictEqual(insiderSingularRes[0].status, "up-to-date");

        // Test --bun on copilot-insiders
        const insidersBunRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "copilot-insiders",
            bun: true,
        });
        assert.strictEqual(insidersBunRes[0].status, "updated");
        const bunContent = JSON.parse(fs.readFileSync(insidersBunRes[0].path, "utf8"));
        assert.strictEqual(bunContent.servers.superpowers.command, "bunx");

        // Test Co-existence: install Stable Copilot alongside Copilot Insiders in same home
        const stableCopilotRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "copilot",
        });
        assert.strictEqual(stableCopilotRes[0].target, "copilot");
        assert.strictEqual(stableCopilotRes[0].status, "created");
        assert.ok(fs.existsSync(stableCopilotRes[0].path), "Stable Code/User/mcp.json must exist");
        assert.ok(fs.existsSync(insidersRes[0].path), "Code - Insiders/User/mcp.json must co-exist independently");

        // Test --remove on json-servers (copilot-insiders)
        const removeInsidersRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "copilot-insiders",
            remove: true,
        });
        assert.strictEqual(removeInsidersRes[0].status, "removed");
        const afterRemoveContent = JSON.parse(fs.readFileSync(removeInsidersRes[0].path, "utf8"));
        assert.strictEqual(afterRemoveContent.servers.superpowers, undefined, "superpowers key must be removed from servers");

        console.log("  ✅ PASS: Copilot Insiders target, singular aliases, --bun, co-existence & remove correctly verified");
        passed++;

        // Test QwenPaw and alias 'copaw'
        const qwenRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "qwenpaw",
        });
        assert.strictEqual(qwenRes[0].target, "qwenpaw");
        assert.strictEqual(qwenRes[0].status, "created");
        assert.ok(qwenRes[0].path.endsWith(path.join(".qwenpaw", "config.json")));
        const qwenContent = JSON.parse(fs.readFileSync(qwenRes[0].path, "utf8"));
        assert.strictEqual(qwenContent.mcpServers.superpowers.command, "npx");

        const copawAliasRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "copaw",
        });
        assert.strictEqual(copawAliasRes[0].target, "qwenpaw");
        assert.strictEqual(copawAliasRes[0].status, "up-to-date");
        console.log("  ✅ PASS: QwenPaw target and alias 'copaw' correctly verified");
        passed++;

        // Test Cline and alias 'claude-dev'
        const clineRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "cline",
        });
        assert.strictEqual(clineRes[0].target, "cline");
        assert.strictEqual(clineRes[0].status, "created");
        assert.ok(clineRes[0].path.endsWith("cline_mcp_settings.json"));
        const clineContent = JSON.parse(fs.readFileSync(clineRes[0].path, "utf8"));
        assert.strictEqual(clineContent.mcpServers.superpowers.command, "npx");

        const clineAliasRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "claude-dev",
        });
        assert.strictEqual(clineAliasRes[0].target, "cline");
        assert.strictEqual(clineAliasRes[0].status, "up-to-date");
        console.log("  ✅ PASS: Cline target and alias 'claude-dev' correctly verified");
        passed++;

        // Test Kilo Code and alias 'kilocode'
        const kiloRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "kilo",
        });
        assert.strictEqual(kiloRes[0].target, "kilo");
        assert.strictEqual(kiloRes[0].status, "created");
        assert.ok(kiloRes[0].path.endsWith(path.join(".config", "kilo", "kilo.jsonc")));
        const kiloContent = JSON.parse(fs.readFileSync(kiloRes[0].path, "utf8"));
        assert.strictEqual(kiloContent.mcp.superpowers.type, "local");
        assert.deepStrictEqual(kiloContent.mcp.superpowers.command, ["npx", "-y", "superpowers-mcp"]);

        const kiloAliasRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "kilocode",
        });
        assert.strictEqual(kiloAliasRes[0].target, "kilo");
        assert.strictEqual(kiloAliasRes[0].status, "up-to-date");
        console.log("  ✅ PASS: Kilo Code target, 'mcp' root format, and alias 'kilocode' correctly verified");
        passed++;

        // Test Qoder
        const qoderRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "qoder",
        });
        assert.strictEqual(qoderRes[0].target, "qoder");
        assert.strictEqual(qoderRes[0].status, "created");
        assert.ok(qoderRes[0].path.endsWith(path.join(".qoder", "settings.json")));
        const qoderContent = JSON.parse(fs.readFileSync(qoderRes[0].path, "utf8"));
        assert.strictEqual(qoderContent.mcpServers.superpowers.command, "npx");
        console.log("  ✅ PASS: Qoder target correctly verified");
        passed++;

        // Test Kiro and alias 'kiro-code'
        const kiroRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "kiro",
        });
        assert.strictEqual(kiroRes[0].target, "kiro");
        assert.strictEqual(kiroRes[0].status, "created");
        assert.ok(kiroRes[0].path.endsWith(path.join(".kiro", "settings", "mcp.json")));
        const kiroContent = JSON.parse(fs.readFileSync(kiroRes[0].path, "utf8"));
        assert.strictEqual(kiroContent.mcpServers.superpowers.command, "npx");

        const kiroAliasRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "kiro-code",
        });
        assert.strictEqual(kiroAliasRes[0].target, "kiro");
        assert.strictEqual(kiroAliasRes[0].status, "up-to-date");
        console.log("  ✅ PASS: Kiro target and alias 'kiro-code' correctly verified");
        passed++;

        // Test Trae
        const traeRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "trae",
        });
        assert.strictEqual(traeRes[0].target, "trae");
        assert.strictEqual(traeRes[0].status, "created");
        assert.ok(traeRes[0].path.includes("Trae"));
        const traeContent = JSON.parse(fs.readFileSync(traeRes[0].path, "utf8"));
        assert.strictEqual(traeContent.mcpServers.superpowers.command, "npx");

        // Test Trae remove
        const removeTraeRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "trae",
            remove: true,
        });
        assert.strictEqual(removeTraeRes[0].status, "removed");
        const afterRemoveTrae = JSON.parse(fs.readFileSync(removeTraeRes[0].path, "utf8"));
        assert.strictEqual(afterRemoveTrae.mcpServers.superpowers, undefined);
        console.log("  ✅ PASS: Trae target creation and removal correctly verified");
        passed++;

        // Test Claude Desktop and alias 'claude-desktop'
        const claudeRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "claude",
        });
        assert.strictEqual(claudeRes[0].target, "claude");
        assert.strictEqual(claudeRes[0].status, "created");
        assert.ok(claudeRes[0].path.endsWith("claude_desktop_config.json"));
        const claudeContent = JSON.parse(fs.readFileSync(claudeRes[0].path, "utf8"));
        assert.strictEqual(claudeContent.mcpServers.superpowers.command, "npx");

        const claudeAliasRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "claude-desktop",
        });
        assert.strictEqual(claudeAliasRes[0].target, "claude");
        assert.strictEqual(claudeAliasRes[0].status, "up-to-date");
        console.log("  ✅ PASS: Claude Desktop target and alias 'claude-desktop' correctly verified");
        passed++;

        // Test Kimi Work and alias 'kimi-code'
        const kimiRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "kimi",
        });
        assert.strictEqual(kimiRes[0].target, "kimi");
        assert.strictEqual(kimiRes[0].status, "created");
        assert.ok(kimiRes[0].path.endsWith(path.join(".kimi-code", "mcp.json")));
        const kimiContent = JSON.parse(fs.readFileSync(kimiRes[0].path, "utf8"));
        assert.strictEqual(kimiContent.mcpServers.superpowers.command, "npx");

        const kimiAliasRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "kimi-code",
        });
        assert.strictEqual(kimiAliasRes[0].target, "kimi");
        assert.strictEqual(kimiAliasRes[0].status, "up-to-date");
        console.log("  ✅ PASS: Kimi Work target and alias 'kimi-code' correctly verified");
        passed++;

        // Test Hermes Desktop and alias 'hermes-desktop' (YAML)
        const hermesRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "hermes",
        });
        assert.strictEqual(hermesRes[0].target, "hermes");
        assert.strictEqual(hermesRes[0].status, "created");
        assert.ok(hermesRes[0].path.endsWith(path.join(".hermes", "config.yaml")));
        const hermesYaml = fs.readFileSync(hermesRes[0].path, "utf8");
        assert.ok(hermesYaml.includes("mcp_servers:"));
        assert.ok(hermesYaml.includes("superpowers:"));

        const hermesAliasRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "hermes-desktop",
        });
        assert.strictEqual(hermesAliasRes[0].target, "hermes");
        assert.strictEqual(hermesAliasRes[0].status, "up-to-date");
        console.log("  ✅ PASS: Hermes Desktop target (YAML) and alias 'hermes-desktop' correctly verified");
        passed++;

        // Test update without backup (Default: Zero pollution)
        const updateRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "cursor",
            bun: true,
        });
        assert.strictEqual(updateRes[0].status, "updated");

        const cursorDir = path.dirname(results[0].path);
        let filesInCursor = fs.readdirSync(cursorDir);
        let backupFiles = filesInCursor.filter((f) => f.includes(".bak"));
        assert.strictEqual(backupFiles.length, 0, "Default must NOT generate .bak files (zero pollution)");

        // Test update with explicit backup=true
        await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "cursor",
            bun: false,
            backup: true,
        });
        filesInCursor = fs.readdirSync(cursorDir);
        backupFiles = filesInCursor.filter((f) => f.includes(".bak"));
        assert.ok(backupFiles.length >= 1, "Must generate timestamped .bak backup file when backup=true is requested");

        // Test remove idempotent
        const removeRes = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "cursor",
            remove: true,
        });
        assert.strictEqual(removeRes[0].status, "removed");

        const removeAgain = await runSetup({
            platform: "darwin",
            homeDir: mockHome,
            target: "cursor",
            remove: true,
        });
        assert.strictEqual(removeAgain[0].status, "up-to-date");

        console.log("  ✅ PASS: runSetup sandbox atomic write, backup & idempotent removal passed");
        passed++;

        // Test Symlink preservation
        const realTarget = path.join(tmpDir, "real_target.json");
        fs.writeFileSync(realTarget, JSON.stringify({ mcpServers: {} }));
        const symlinkPath = path.join(tmpDir, "symlink_config.json");
        // Only symlink creation may be skipped on restricted OSes (#3); assertion
        // failures must propagate instead of being swallowed by the catch.
        let symlinkCreated = true;
        try {
            fs.symlinkSync(realTarget, symlinkPath);
        } catch (symlinkErr) {
            symlinkCreated = false;
            console.log("  ℹ️ Symlink creation skipped on restricted OS");
        }
        if (symlinkCreated) {
            safeWriteConfig(symlinkPath, JSON.stringify({ mcpServers: { superpowers: { command: "npx" } } }), false, [tmpDir]);
            assert.ok(fs.lstatSync(symlinkPath).isSymbolicLink(), "Must preserve symlink");
            const updatedContent = JSON.parse(fs.readFileSync(realTarget, "utf8"));
            assert.ok(updatedContent.mcpServers.superpowers, "Must update real target file through symlink");
            console.log("  ✅ PASS: Symlink preservation test passed");
            passed++;
        }

        // A symlinked parent must not redirect a targeted setup write outside
        // the selected home/configuration roots.
        const boundedHome = path.join(tmpDir, "bounded-home");
        const redirectedDir = path.join(tmpDir, "redirected-config");
        fs.mkdirSync(boundedHome);
        fs.mkdirSync(redirectedDir);
        fs.symlinkSync(redirectedDir, path.join(boundedHome, ".cursor"));
        const redirectedResult = await runSetup({ platform: "darwin", homeDir: boundedHome, target: "cursor" });
        assert.strictEqual(redirectedResult[0].status, "error");
        assert.match(redirectedResult[0].message, /outside allowed roots/);
        assert.ok(!fs.existsSync(path.join(redirectedDir, "mcp.json")), "must not write through a parent symlink outside home");
        console.log("  ✅ PASS: parent-directory symlink cannot redirect setup outside allowed roots");
        passed++;

        // Expected-content verification detects a stale read before rename.
        const racedConfig = path.join(tmpDir, "raced.json");
        fs.writeFileSync(racedConfig, "newer content");
        assert.throws(
            () => safeWriteConfig(racedConfig, "replacement", false, [tmpDir], "older content"),
            /changed concurrently/
        );
        assert.strictEqual(fs.readFileSync(racedConfig, "utf8"), "newer content");
        console.log("  ✅ PASS: concurrent config changes are not overwritten");
        passed++;

        // Test --remove on non-existent file: must be idempotent and NEVER create directories or files
        const emptyHome = path.join(tmpDir, "empty_home");
        const removeNonExistent = await runSetup({
            platform: "darwin",
            homeDir: emptyHome,
            target: "cursor",
            remove: true,
        });
        assert.strictEqual(removeNonExistent[0].status, "up-to-date");
        assert.ok(!fs.existsSync(path.join(emptyHome, ".cursor")), "Must NOT create directory or file when removing non-existent config");
        console.log("  ✅ PASS: --remove on non-existent config is idempotent and creates no files");
        passed++;

        // Test string literals containing '//' in JSON are preserved
        const jsonWithSlashSlash = JSON.stringify({
            mcpServers: {
                test: { command: "node", args: ["--flag=http://example.com", "foo // bar"] }
            }
        }, null, 2);
        const updatedJson = updateJsonConfig(jsonWithSlashSlash, "json-mcpServers", "npx", ["-y", "superpowers-mcp"]);
        const parsedBack = JSON.parse(updatedJson);
        assert.strictEqual(parsedBack.mcpServers.test.args[1], "foo // bar", "Must not corrupt string literals containing //");
        console.log("  ✅ PASS: Native JSON parsing preserves string literals containing '//'");
        passed++;

        // Test CLI execution via scripts/setup.js: must execute exactly once (no double invocation)
        const { execSync } = require("child_process");
        const setupScriptPath = path.join(__dirname, "..", "scripts", "setup.js");
        const cliHelpOut = execSync(`node "${setupScriptPath}" --help`, { encoding: "utf8" });
        const helpOccurrences = (cliHelpOut.match(/Superpowers MCP - Targeted Global Setup/g) || []).length;
        assert.strictEqual(helpOccurrences, 1, "scripts/setup.js must execute CLI exactly once (no double invocation)");
        console.log("  ✅ PASS: scripts/setup.js executes exactly once without double invocation");
        passed++;
    } catch (err) {
        console.error("  ❌ FAIL: runSetup sandbox test failed:", err);
        failed++;
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    // ---------------------------------------------------------------------
    // Regression: re-running setup must never destroy user-managed fields
    // ---------------------------------------------------------------------
    it("should preserve user-managed JSON fields (env/disabled) on re-install", () => {
        const existing = JSON.stringify(
            {
                mcpServers: {
                    "other-server": { command: "foo" },
                    superpowers: {
                        command: "npx",
                        args: ["-y", "superpowers-mcp"],
                        env: { SKILLS_PATH: "/custom/skills" },
                        disabled: true,
                    },
                },
            },
            null,
            2
        );

        const updated = JSON.parse(updateJsonConfig(existing, "json", "npx", ["-y", "superpowers-mcp"]));
        const entry = updated.mcpServers.superpowers;

        assert.deepStrictEqual(entry.env, { SKILLS_PATH: "/custom/skills" }, "env must be preserved");
        assert.strictEqual(entry.disabled, true, "disabled must be preserved");
        assert.deepStrictEqual(updated.mcpServers["other-server"], { command: "foo" }, "unrelated entries must be preserved");
        assert.deepStrictEqual(entry.args, ["-y", "superpowers-mcp"], "managed fields must still be updated");
    });

    it("should reuse an existing root key instead of writing a duplicate entry", () => {
        const existing = JSON.stringify(
            { mcpServers: { superpowers: { command: "npx", env: { A: "1" } } } },
            null,
            2
        );

        // json-mcp would conventionally use "mcp"; the file already uses "mcpServers".
        const updated = JSON.parse(updateJsonConfig(existing, "json-mcp", "npx", ["-y", "superpowers-mcp"]));
        assert.strictEqual(updated.mcp, undefined, "must not create a second root key");
        assert.deepStrictEqual(updated.mcpServers.superpowers.env, { A: "1" }, "existing entry must be merged into");

        // ...and --remove must be able to delete that entry again.
        const removed = JSON.parse(updateJsonConfig(JSON.stringify(updated), "json-mcp", "npx", ["-y", "superpowers-mcp"], true));
        assert.strictEqual(removed.mcpServers.superpowers, undefined, "remove must delete the discovered entry");
        assert.strictEqual(removed.mcp, undefined, "remove must not invent a new root key");
    });

    it("should find an existing entry under a non-conventional root key", () => {
        const existing = JSON.stringify({ servers: { superpowers: { command: "npx", env: { B: "2" } } } }, null, 2);
        const updated = JSON.parse(updateJsonConfig(existing, "json", "npx", ["-y", "superpowers-mcp"]));
        assert.strictEqual(updated.mcpServers, undefined, "must not create mcpServers when servers already holds the entry");
        assert.deepStrictEqual(updated.servers.superpowers.env, { B: "2" }, "servers entry must be merged into");
    });

    it("should not leave a contradictory enabled flag next to a user's disabled flag", () => {
        const existing = JSON.stringify({ mcp: { superpowers: { type: "local", command: ["npx"], disabled: true } } }, null, 2);
        const updated = JSON.parse(updateJsonConfig(existing, "json-mcp", "npx", ["-y", "superpowers-mcp"]));
        const entry = updated.mcp.superpowers;
        assert.strictEqual(entry.disabled, true, "user's disabled flag must survive");
        assert.strictEqual(entry.enabled, undefined, "must not force enabled:true next to disabled:true");
        assert.strictEqual(entry.args, undefined, "json-mcp folds args into command; stale args must be dropped");
        assert.deepStrictEqual(entry.command, ["npx", "-y", "superpowers-mcp"]);
    });

    it("should detect the correct indent when the first YAML child key is not a plain identifier", () => {
        const existing = `mcp_servers:
    my.key: v
    superpowers:
        command: npx
        env:
            X: 1
`;
        const updated = updateYamlConfig(existing, "npx", ["-y", "superpowers-mcp"]);

        assert.strictEqual((updated.match(/^\s*superpowers:/gm) || []).length, 1, "must not create a duplicate superpowers key");
        assert.strictEqual((updated.match(/^    superpowers:/gm) || []).length, 1, "must reuse the file's 4-space indent");
        assert.ok(updated.includes("        env:"), "user-managed env block must be preserved");
        assert.ok(updated.includes("        command: \"npx\""), "managed command must be updated");

        // Removing must leave the sibling key and drop the whole block
        const removed = updateYamlConfig(updated, "npx", ["-y", "superpowers-mcp"], true);
        assert.ok(removed.includes("my.key: v"));
        assert.ok(!removed.includes("superpowers:"));
    });

    it("should exit non-zero for malformed CLI invocations instead of failing silently", () => {
        const { spawnSync } = require("child_process");
        const entry = path.join(__dirname, "..", "out", "server.js");
        if (!fs.existsSync(entry)) {
            console.log("  ⏭️  SKIP: out/server.js not built — CLI exit-code contract NOT verified");
            skipped++;
            return;
        }

        const noTarget = spawnSync("node", [entry, "setup"], { encoding: "utf8" });
        assert.strictEqual(noTarget.status, 1, "missing --target must exit non-zero");

        const extraArg = spawnSync("node", [entry, "setup", "copilot", "cursor"], { encoding: "utf8" });
        assert.strictEqual(extraArg.status, 1, "unexpected positional argument must exit non-zero");
        assert.match(extraArg.stderr, /Unexpected argument "cursor"/);
    });

    it("should refuse a multi-line TOML value instead of corrupting config.toml", () => {
        const multiLine = [
            "[mcp_servers.superpowers]",
            'command = "npx"',
            "args = [",
            '  "-y",',
            '  "superpowers-mcp",',
            "]",
            "",
        ].join("\n");

        let err = null;
        try {
            updateTomlConfig(multiLine, "npx", ["-y", "superpowers-mcp"]);
        } catch (e) {
            err = e;
        }
        assert.ok(err, "a multi-line managed TOML value must be refused, not rewritten");
        assert.match(err.message, /single line|multiple lines/i, `error must be actionable, got: ${err.message}`);

        const removed = updateTomlConfig(multiLine, "npx", [], true);
        assert.ok(!removed.includes("superpowers"), "remove must delete the whole managed table");
        assert.ok(!removed.includes('  "-y",'), "remove must delete continuation lines too");
        assert.ok(!removed.includes("]"), "remove must not leave a dangling bracket");
    });

    it("should parse and update a UTF-8 BOM-prefixed JSON config", () => {
        const withBom = "\uFEFF{\n  \"mcpServers\": {}\n}\n";
        let out;
        try {
            out = updateJsonConfig(withBom, "json-mcpServers", "npx", ["-y", "superpowers-mcp"]);
        } catch (e) {
            assert.fail(`a BOM-prefixed config must not break setup: ${e.message}`);
        }
        const parsed = JSON.parse(out);
        assert.strictEqual(parsed.mcpServers.superpowers.command, "npx");
        assert.deepStrictEqual(parsed.mcpServers.superpowers.args, ["-y", "superpowers-mcp"]);
    });

    it("should leave a JSONC config byte-identical when --remove has nothing to remove", () => {
        const jsonc = '{\n  // my servers\n  "mcpServers": {\n    "other": { "command": "foo" },\n  },\n}\n';
        const out = updateJsonConfig(jsonc, "json-mcpServers", "npx", [], true);
        assert.strictEqual(out, jsonc, "a no-op removal must not rewrite the user's file");
        assert.ok(out.includes("my servers"), "user comments must survive a no-op removal");

        const nested = '{\n  // keep me\n  "mcp": {\n    "servers": { "other": {} },\n  },\n}\n';
        const nestedOut = updateJsonConfig(nested, "json-mcpServers", "npx", [], true, undefined, ["mcp", "servers"]);
        assert.strictEqual(nestedOut, nested, "a no-op nested removal must not rewrite the user's file");
    });

    it("should keep the YAML root key's inline comment when the last entry is removed", () => {
        const yaml = 'mcp_servers: # my servers\n  superpowers:\n    command: npx\n    args: []\n';
        const out = updateYamlConfig(yaml, "npx", [], true, "mcp");
        assert.ok(out.includes("# my servers"), `root-key inline comment was dropped: ${JSON.stringify(out)}`);
        assert.match(out, /^mcp_servers: \{\}/m, `expected an explicit empty map, got: ${JSON.stringify(out)}`);
    });

    it("should not emit a null YAML map when a nested same-named key follows the root block", () => {
        const yaml = [
            "mcp_servers:",
            "  superpowers:",
            "    command: npx",
            "    args: []",
            "something:",
            "  mcp_servers:",
            "    keep: 1",
            "",
        ].join("\n");
        const out = updateYamlConfig(yaml, "npx", [], true, "mcp");
        assert.ok(
            !/^mcp_servers:\s*$/m.test(out),
            `root key was left as a null value (the exact state the empty-map guard exists to prevent): ${JSON.stringify(out)}`
        );
        assert.match(out, /^mcp_servers: \{\}/m, `expected an explicit empty map, got: ${JSON.stringify(out)}`);
        assert.ok(out.includes("keep: 1"), "the nested mapping under another parent must be preserved");
    });

    it("should handle a YAML root key written as an empty flow mapping on install", () => {
        // `--remove` leaves `mcp_servers: {}`; a later install must expand it into
        // a block mapping rather than appending an indented child after a value.
        const out = updateYamlConfig("mcp_servers: {}\nother: 1\n", "npx", ["-y"], false, "mcp");
        assert.match(out, /^mcp_servers:\s*$/m, `expected a block mapping, got: ${JSON.stringify(out)}`);
        assert.ok(!/^mcp_servers: \{\}/m.test(out), "the flow mapping must be replaced, not left beside a child");
        assert.ok(out.includes("  superpowers:"), "the entry must be installed");
        assert.ok(out.includes("other: 1"), "sibling keys must be preserved");

        const lines = out.split("\n").filter(Boolean);
        const superpowersIdx = lines.findIndex((l) => /^\s*superpowers:/.test(l));
        assert.ok(superpowersIdx > 0, "entry must be present");
        assert.strictEqual(/^\s*/.exec(lines[superpowersIdx])[0].length, 2, "entry must be indented one level");
        const otherIdx = lines.findIndex((l) => l.startsWith("other:"));
        assert.ok(otherIdx > 0 && !/^\s/.test(lines[otherIdx]), "sibling must remain at column 0");
    });

    it("should be idempotent when --remove runs twice on a YAML target", async () => {
        const mockHome = fs.mkdtempSync(path.join(os.tmpdir(), "sp-rm-twice-"));
        try {
            for (const target of ["hermes", "goose"]) {
                const first = await runSetup({ platform: "darwin", homeDir: mockHome, target });
                assert.strictEqual(first[0].status, "created", `${target}: first install must succeed`);

                const rm1 = await runSetup({ platform: "darwin", homeDir: mockHome, target, remove: true });
                assert.strictEqual(rm1[0].status, "removed", `${target}: first remove must succeed`);

                // The tool wrote `rootKey: {}` itself; it must be able to read it back.
                const rm2 = await runSetup({ platform: "darwin", homeDir: mockHome, target, remove: true });
                assert.strictEqual(
                    rm2[0].status,
                    "up-to-date",
                    `${target}: a second --remove must be idempotent, got: ${rm2[0].status} (${rm2[0].message})`
                );
            }
        } finally {
            fs.rmSync(mockHome, { recursive: true, force: true });
        }
    });

    it("should refuse a TOML array-of-tables and still remove it cleanly", () => {
        const arrayOfTables = '[[mcp_servers.superpowers]]\ncommand = "npx"\nargs = ["-y"]\n\n[other]\nB = "2"\n';

        assert.throws(
            () => updateTomlConfig(arrayOfTables, "npx", ["-y"]),
            /array-of-tables|\[\[|Cannot safely update TOML/i,
            "install must refuse an existing array-of-tables definition"
        );

        const removed = updateTomlConfig(arrayOfTables, "npx", [], true);
        assert.ok(!removed.includes("superpowers"), `remove must clear the array-of-tables, got: ${JSON.stringify(removed)}`);
        assert.ok(removed.includes('B = "2"'), "unrelated tables must be preserved");
    });

    it("should report up-to-date for goose on a second run (key order must be stable)", async () => {
        const mockHome = fs.mkdtempSync(path.join(os.tmpdir(), "sp-goose-idem-"));
        try {
            const first = await runSetup({ platform: "darwin", homeDir: mockHome, target: "goose" });
            assert.strictEqual(first[0].status, "created");
            const cfgPath = first[0].path;
            const afterFirst = fs.readFileSync(cfgPath, "utf-8");

            const second = await runSetup({ platform: "darwin", homeDir: mockHome, target: "goose" });
            const afterSecond = fs.readFileSync(cfgPath, "utf-8");
            assert.strictEqual(
                second[0].status,
                "up-to-date",
                `goose must be idempotent, got: ${second[0].status}`
            );
            assert.strictEqual(afterSecond, afterFirst, "a no-op re-install must not rewrite the file");
        } finally {
            fs.rmSync(mockHome, { recursive: true, force: true });
        }
    });

    it("should reject a repeated --target instead of silently keeping the last one", () => {
        const { spawnSync } = require("child_process");
        const entry = path.join(__dirname, "..", "out", "server.js");
        if (!fs.existsSync(entry)) {
            console.log("  ⏭️  SKIP: out/server.js not built — duplicate --target contract NOT verified");
            skipped++;
            return;
        }
        const res = spawnSync("node", [entry, "setup", "--target", "cursor", "--target", "claude"], { encoding: "utf8" });
        assert.strictEqual(res.status, 1, "a repeated --target must exit non-zero");
        assert.match(res.stderr, /--target.*(more than once|specified)/i);
    });

    it("should not create a backup when a concurrent change refuses the write", () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sp-bak-"));
        try {
            const target = path.join(dir, "cfg.json");
            fs.writeFileSync(target, '{"a":1}');

            assert.throws(
                () => safeWriteConfig(target, '{"a":2}', true, [dir], '{"STALE":true}'),
                /changed concurrently/i,
                "a stale expectedContent must refuse the write"
            );
            assert.deepStrictEqual(
                fs.readdirSync(dir).filter((f) => f.includes(".bak")),
                [],
                "a refused write must not leave a backup behind"
            );
            assert.strictEqual(fs.readFileSync(target, "utf-8"), '{"a":1}', "target content must be untouched");
            assert.deepStrictEqual(
                fs.readdirSync(dir).filter((f) => f.startsWith(".tmp.")),
                [],
                "no temp file may be left behind"
            );
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it("should replace, not duplicate, a YAML child entry written as an empty flow mapping", () => {
        // A `superpowers: {}` child used to be invisible to the child matcher, so
        // install appended a second `superpowers:` beside it; YAML resolves duplicate
        // keys last-wins, so the new entry was silently discarded while the CLI
        // still reported success.
        const out = updateYamlConfig(
            "mcp_servers:\n  superpowers: {}\n  other:\n    command: o\n",
            "npx",
            ["-y", "superpowers-mcp"],
            false,
            "mcp"
        );
        const childKeys = out.split("\n").filter((l) => /^\s+superpowers\s*:/.test(l));
        assert.strictEqual(
            childKeys.length,
            1,
            `install must not leave a duplicate superpowers key: ${JSON.stringify(out)}`
        );
        assert.ok(!/^\s+superpowers:\s*\{\}\s*$/m.test(out), `the flow mapping must be replaced: ${JSON.stringify(out)}`);
        assert.ok(out.includes('command: "npx"'), `the entry must be installed: ${JSON.stringify(out)}`);
        assert.ok(out.includes("other:"), "sibling entries must be preserved");
    });

    it("should round-trip install, remove and reinstall when the root key has an inline comment", () => {
        // `--remove` leaves `mcp_servers: {} # <inline comment>`, a state the
        // install path rejected — leaving the user unable to ever reinstall.
        const start = 'mcp_servers: # my MCP servers\n  superpowers:\n    command: "npx"\n    args: ["-y","superpowers-mcp"]\n';
        const removed = updateYamlConfig(start, "npx", ["-y", "superpowers-mcp"], true, "mcp");
        assert.match(removed, /^mcp_servers: \{\}/m, `expected an empty map, got: ${JSON.stringify(removed)}`);
        assert.ok(removed.includes("# my MCP servers"), "the inline comment must survive the removal");

        let reinstalled;
        try {
            reinstalled = updateYamlConfig(removed, "npx", ["-y", "superpowers-mcp"], false, "mcp");
        } catch (e) {
            assert.fail(`reinstall after --remove must not fail, got: ${e.message}`);
        }
        assert.ok(reinstalled.includes("# my MCP servers"), "the inline comment must survive the reinstall");
        assert.ok(reinstalled.includes('command: "npx"'), `the entry must be installed: ${JSON.stringify(reinstalled)}`);
    });

    it("should clear a YAML `superpowers: {}` child on --remove", () => {
        const start = "mcp_servers:\n  superpowers: {}\n  other:\n    command: o\n";
        const out = updateYamlConfig(start, "npx", ["-y", "superpowers-mcp"], true, "mcp");
        assert.ok(
            !/^\s+superpowers\s*:/m.test(out),
            `--remove must clear the flow-mapping child too: ${JSON.stringify(out)}`
        );
        assert.ok(out.includes("other:"), "sibling entries must be preserved");
    });

    it("should never replace an unresolvable symlink with a regular file", () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sp-symlink-"));
        try {
            // A symlink loop makes realpathSync fail with ELOOP.
            const a = path.join(dir, "a.json");
            const b = path.join(dir, "b.json");
            fs.symlinkSync(b, a);
            fs.symlinkSync(a, b);

            try {
                safeWriteConfig(a, '{"x":1}', false, [dir]);
            } catch (e) {
                assert.match(e.message, /symlink|Cannot safely|ELOOP|ENOENT/i, `unexpected error: ${e.message}`);
            }

            assert.ok(
                fs.lstatSync(a).isSymbolicLink(),
                "the symlink was replaced by a regular file — a user's link must never be destroyed"
            );
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    console.log("==================================================");
    await Promise.all(pendingTests);
    console.log(`Results: ${passed} passed, ${failed} failed${skipped > 0 ? `, ${skipped} skipped` : ""}`);
    console.log("==================================================");

    if (skipped > 0) {
        console.warn(`  ⚠️ WARNING: ${skipped} test(s) skipped — coverage gap, build out/server.js and re-run`);
    }
    if (failed > 0) {
        process.exit(1);
    }
})();
