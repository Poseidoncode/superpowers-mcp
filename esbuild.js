const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");

const isProduction = process.argv.includes("--production");
const isWatch = process.argv.includes("--watch");

const baseConfig = {
    bundle: true,
    minify: isProduction,
    sourcemap: !isProduction,
    platform: "node",
    target: "node20",
    logLevel: "info",
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
        const srvCtx = await esbuild.context(serverConfig);
        await srvCtx.watch();
        console.log("Watching for changes...");
    } else {
        await esbuild.build(serverConfig);
        await esbuild.build(managerConfig);
        await esbuild.build(setupConfig);
        await esbuild.build(setupRunnerConfig);

        // Make server.js and setup.js executable safely across platforms
        const executablePaths = [
            path.join(__dirname, "out", "server.js"),
            path.join(__dirname, "out", "setup.js"),
        ];

        for (const execPath of executablePaths) {
            if (fs.existsSync(execPath)) {
                try {
                    if (process.platform !== "win32") {
                        fs.chmodSync(execPath, "755");
                    }
                } catch (chmodErr) {
                    console.warn(`Warning: Failed to set executable permissions on ${execPath}:`, chmodErr);
                }
            }
        }
        console.log("Build complete.");
    }
}

build().catch((err) => {
    console.error(err);
    process.exit(1);
});
