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

// Build extension host (VSCode extension)
const extensionConfig = {
    ...baseConfig,
    entryPoints: ["src/extension.ts"],
    outfile: "out/extension.js",
    external: ["vscode"],
    format: "cjs",
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

async function build() {
    if (isWatch) {
        const [extCtx, srvCtx] = await Promise.all([
            esbuild.context(extensionConfig),
            esbuild.context(serverConfig),
        ]);
        await Promise.all([extCtx.watch(), srvCtx.watch()]);
        console.log("Watching for changes...");
    } else {
        await Promise.all([
            esbuild.build(extensionConfig),
            esbuild.build(serverConfig),
        ]);

        // Make server.js executable
        const serverPath = path.join(__dirname, "out", "server.js");
        if (fs.existsSync(serverPath)) {
            fs.chmodSync(serverPath, "755");
        }
        console.log("Build complete.");
    }
}

build().catch((err) => {
    console.error(err);
    process.exit(1);
});
