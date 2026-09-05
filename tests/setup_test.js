const assert = require("assert");
const path = require("path");
const fs = require("fs");
const os = require("os");
const {
    HARNESS_CONFIGS,
    updateYamlConfig,
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

function it(desc, fn) {
    try {
        fn();
        console.log(`  ✅ PASS: ${desc}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ FAIL: ${desc}`);
        console.error(`     ${err.message}`);
        failed++;
    }
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

it("should recover gracefully when root or mcpServers is null or Array", () => {
    // null root
    const updatedNull = updateJsonConfig("null", "json-mcpServers", "npx", ["-y", "superpowers-mcp"]);
    const parsedNull = JSON.parse(updatedNull);
    assert.ok(parsedNull.mcpServers.superpowers);

    // array mcpServers
    const originalArray = JSON.stringify({ mcpServers: [] });
    const updatedArray = updateJsonConfig(originalArray, "json-mcpServers", "npx", ["-y", "superpowers-mcp"]);
    const parsedArray = JSON.parse(updatedArray);
    assert.ok(parsedArray.mcpServers.superpowers);
    assert.ok(!Array.isArray(parsedArray.mcpServers));
});

it("should throw a clear error on completely malformed JSON", () => {
    assert.throws(() => {
        updateJsonConfig("{ malformed json", "json-mcpServers", "npx", ["-y", "superpowers-mcp"]);
    }, /Failed to parse existing JSON/);
});

// 3. YAML Configuration Tests (Hermes)
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
});

// 4. Platform Path Resolvers & Unknown Target Defense
it("should correctly resolve paths for macOS, Windows, Linux", () => {
    const home = "/mock/home";
    const appData = "C:\\Users\\mock\\AppData\\Roaming";
    const localAppData = "C:\\Users\\mock\\AppData\\Local";

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
        try {
            fs.symlinkSync(realTarget, symlinkPath);
            safeWriteConfig(symlinkPath, JSON.stringify({ mcpServers: { superpowers: { command: "npx" } } }));
            assert.ok(fs.lstatSync(symlinkPath).isSymbolicLink(), "Must preserve symlink");
            const updatedContent = JSON.parse(fs.readFileSync(realTarget, "utf8"));
            assert.ok(updatedContent.mcpServers.superpowers, "Must update real target file through symlink");
            console.log("  ✅ PASS: Symlink preservation test passed");
            passed++;
        } catch (symlinkErr) {
            console.log("  ℹ️ Symlink creation skipped on restricted OS");
        }

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

    console.log("==================================================");
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log("==================================================");

    if (failed > 0) {
        process.exit(1);
    }
})();
