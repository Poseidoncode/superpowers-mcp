const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");

const isProduction = process.argv.includes("--production");
const isWatch = process.argv.includes("--watch");

// Inject the package version at build time so the runtime banner can never drift
// from package.json (previously it was hardcoded in src/server.ts).
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf8"));

// Runs after every build — including each watch rebuild — so out/server.js and
// out/setup.js are always executable. The previous code only chmod'ed on the
// non-watch path, leaving watch-produced outputs non-executable (EACCES when run
// directly via the package's bin/CLI entry points).
const chmodPlugin = {
    name: "chmod-executables",
    setup(build) {
        build.onEnd((result) => {
            if (result.errors.length > 0) return;
            if (process.platform === "win32") return;
            for (const execPath of ["out/server.js", "out/setup.js"]) {
                if (fs.existsSync(execPath)) {
                    try {
                        fs.chmodSync(execPath, "755");
                    } catch (chmodErr) {
                        console.warn(`Warning: Failed to set executable permissions on ${execPath}:`, chmodErr);
                    }
                }
            }
        });
    },
};

const baseConfig = {
    bundle: true,
    minify: isProduction,
    sourcemap: !isProduction,
    platform: "node",
    target: "node20",
    logLevel: "info",
    define: {
        __SUPERPOWERS_MCP_VERSION__: JSON.stringify(String(pkg.version)),
    },
    plugins: [chmodPlugin],
};



// Build MCP server (standalone node process)
const serverConfig = {
    ...baseConfig,
    entryPoints: ["src/server.ts"],
    outfile: "out/server.js",
    // No "vscode" external — server has NO vscode dependency
    external: [],
    format: "cjs",
    banner: {
        js: "#!/usr/bin/env node",
    },
};

const managerConfig = {
    ...baseConfig,
    entryPoints: ["src/skills-manager.ts"],
    outfile: "out/skills-manager.js",
    format: "cjs",
};

const setupConfig = {
    ...baseConfig,
    entryPoints: ["src/setup-cli.ts"],
    outfile: "out/setup.js",
    external: [],
    format: "cjs",
    banner: {
        js: "#!/usr/bin/env node",
    },
};

const setupRunnerConfig = {
    ...baseConfig,
    entryPoints: ["src/setup-runner.ts"],
    outfile: "out/setup-runner.js",
    external: [],
    format: "cjs",
};

async function build() {
    if (isWatch) {
        const contexts = await Promise.all([
            esbuild.context(serverConfig),
            esbuild.context(managerConfig),
            esbuild.context(setupConfig),
            esbuild.context(setupRunnerConfig),
        ]);
        await Promise.all(contexts.map((ctx) => ctx.watch()));
        console.log("Watching for changes across all targets...");
    } else {
        await Promise.all([
            esbuild.build(serverConfig),
            esbuild.build(managerConfig),
            esbuild.build(setupConfig),
            esbuild.build(setupRunnerConfig),
        ]);

        // Executable bits are set by the chmodPlugin onEnd hook above (covers both
        // watch and non-watch builds, so watch outputs are never left non-executable).
        console.log("Build complete.");
    }
}

build().catch((err) => {
    console.error(err);
    process.exit(1);
});
