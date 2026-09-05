/**
 * Superpowers MCP - Universal Global Setup & Configuration Engine
 * Supports: macOS, Windows, Linux
 * Targets: GitHub Copilot (VS Code), Cursor, Hermes Desktop, Kimi Work, Claude Desktop, Windsurf
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";

export type JsonFormatType = "json-servers" | "json-mcpServers";

export interface HarnessConfig {
    name: string;
    aliases: string[];
    getConfigPath: (platform: string, homeDir: string, appData?: string, localAppData?: string) => string;
    type: JsonFormatType | "yaml";
    defaultConfig: (cmd: string, args: string[]) => Record<string, unknown>;
}

export const HARNESS_CONFIGS: Record<string, HarnessConfig> = {
    copilot: {
        name: "GitHub Copilot (VS Code)",
        aliases: ["vscode", "code", "copilot"],
        getConfigPath: (platform, homeDir, appData, _localAppData) => {
            if (platform === "win32") {
                return path.join(appData || path.join(homeDir, "AppData", "Roaming"), "Code", "User", "mcp.json");
            } else if (platform === "darwin") {
                return path.join(homeDir, "Library", "Application Support", "Code", "User", "mcp.json");
            } else {
                return path.join(homeDir, ".config", "Code", "User", "mcp.json");
            }
        },
        type: "json-servers", // VS Code uses "servers" instead of "mcpServers"
        defaultConfig: (cmd, args) => ({
            command: cmd,
            args: args,
            type: "stdio",
        }),
    },
    cursor: {
        name: "Cursor",
        aliases: ["cursor"],
        getConfigPath: (_platform, homeDir) => {
            return path.join(homeDir, ".cursor", "mcp.json");
        },
        type: "json-mcpServers",
        defaultConfig: (cmd, args) => ({
            command: cmd,
            args: args,
        }),
    },
    hermes: {
        name: "Hermes Desktop / Agent",
        aliases: ["hermes", "hermes-desktop"],
        getConfigPath: (platform, homeDir, _appData, localAppData) => {
            if (platform === "win32") {
                const base = localAppData || path.join(homeDir, "AppData", "Local");
                return path.join(base, "hermes", "config.yaml");
            }
            return path.join(homeDir, ".hermes", "config.yaml");
        },
        type: "yaml",
        defaultConfig: (cmd, args) => ({
            command: cmd,
            args: args,
        }),
    },
    kimi: {
        name: "Kimi Work / Kimi Code",
        aliases: ["kimi", "kimi-work", "kimi-code"],
        getConfigPath: (_platform, homeDir) => {
            return path.join(homeDir, ".kimi-code", "mcp.json");
        },
        type: "json-mcpServers",
        defaultConfig: (cmd, args) => ({
            command: cmd,
            args: args,
        }),
    },
    claude: {
        name: "Claude Desktop",
        aliases: ["claude", "claude-desktop"],
        getConfigPath: (platform, homeDir, appData) => {
            if (platform === "win32") {
                return path.join(appData || path.join(homeDir, "AppData", "Roaming"), "Claude", "claude_desktop_config.json");
            } else if (platform === "darwin") {
                return path.join(homeDir, "Library", "Application Support", "Claude", "claude_desktop_config.json");
            } else {
                return path.join(homeDir, ".config", "Claude", "claude_desktop_config.json");
            }
        },
        type: "json-mcpServers",
        defaultConfig: (cmd, args) => ({
            command: cmd,
            args: args,
        }),
    },
    devin: {
        name: "Devin Desktop (formerly Windsurf)",
        aliases: ["devin", "devin-desktop", "windsurf", "codeium"],
        getConfigPath: (_platform, homeDir) => {
            const devinCliPath = path.join(homeDir, ".config", "devin", "mcp_config.json");
            if (fs.existsSync(devinCliPath)) {
                return devinCliPath;
            }
            return path.join(homeDir, ".codeium", "windsurf", "mcp_config.json");
        },
        type: "json-mcpServers",
        defaultConfig: (cmd, args) => ({
            command: cmd,
            args: args,
        }),
    },
    antigravity: {
        name: "Antigravity (Google DeepMind)",
        aliases: ["antigravity", "agy", "gemini"],
        getConfigPath: (_platform, homeDir) => {
            return path.join(homeDir, ".gemini", "config", "mcp_config.json");
        },
        type: "json-mcpServers",
        defaultConfig: (cmd, args) => ({
            command: cmd,
            args: args,
        }),
    },
    "pi-desktop": {
        name: "Pi Desktop / Pi Agent",
        aliases: ["pi-desktop", "pi", "pi-agent"],
        getConfigPath: (platform, homeDir, appData) => {
            if (platform === "win32") {
                const appDataPi = path.join(appData || path.join(homeDir, "AppData", "Roaming"), ".pi", "agent", "mcp.json");
                if (fs.existsSync(appDataPi)) return appDataPi;
                const userPiAgent = path.join(homeDir, ".pi", "agent", "mcp.json");
                if (fs.existsSync(userPiAgent)) return userPiAgent;
                const userPi = path.join(homeDir, ".pi", "mcp.json");
                if (fs.existsSync(userPi)) return userPi;
                return userPiAgent;
            }
            const agentPath = path.join(homeDir, ".pi", "agent", "mcp.json");
            if (fs.existsSync(agentPath)) return agentPath;
            const rootPath = path.join(homeDir, ".pi", "mcp.json");
            if (fs.existsSync(rootPath)) return rootPath;
            return agentPath;
        },
        type: "json-mcpServers",
        defaultConfig: (cmd, args) => ({
            command: cmd,
            args: args,
        }),
    },
};

/**
 * Checks if a value is a non-null plain object (not an Array, Date, Buffer, etc.).
 */
export function isPlainObject(val: unknown): val is Record<string, unknown> {
    return Object.prototype.toString.call(val) === "[object Object]";
}

/**
 * Strips comments and trailing commas to tolerate JSONC formatted configurations (e.g. VS Code).
 */
export function stripJsonComments(content: string): string {
    return content
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1")
        .replace(/,\s*([\]}])/g, "$1");
}

/**
 * Parses simple YAML to locate/inject mcp_servers.superpowers safely without external dependencies.
 */
export function updateYamlConfig(existingContent: string, cmd: string, args: string[], remove = false): string {
    const lines = existingContent ? existingContent.split(/\r?\n/) : [];

    if (remove) {
        const newLines: string[] = [];
        let inMcpServers = false;
        let mcpIndent = 0;
        let inSuperpowers = false;
        let superpowersIndent = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const mcpMatch = line.match(/^(\s*)mcp_servers:\s*$/);
            if (mcpMatch) {
                inMcpServers = true;
                mcpIndent = mcpMatch[1].length;
                newLines.push(line);
                continue;
            }

            if (inMcpServers) {
                const curIndent = line.match(/^(\s*)/)?.[1].length || 0;
                if (line.trim() !== "" && curIndent <= mcpIndent) {
                    inMcpServers = false;
                    inSuperpowers = false;
                } else {
                    const spMatch = line.match(/^(\s*)superpowers:\s*$/);
                    if (spMatch && spMatch[1].length > mcpIndent) {
                        inSuperpowers = true;
                        superpowersIndent = spMatch[1].length;
                        continue;
                    }
                    if (inSuperpowers) {
                        if (curIndent > superpowersIndent || line.trim() === "") {
                            continue;
                        } else {
                            inSuperpowers = false;
                        }
                    }
                }
            }
            newLines.push(line);
        }
        return newLines.join("\n");
    }

    // Detect indentation from existing content
    let indent = "  ";
    for (const line of lines) {
        const m = line.match(/^(\s+)[a-zA-Z0-9_-]+:/);
        if (m && m[1].length > 0) {
            indent = m[1];
            break;
        }
    }

    const escapedCmd = JSON.stringify(cmd);
    const argsStr = JSON.stringify(args);
    const superpowersBlock = [
        `${indent}superpowers:`,
        `${indent}${indent}command: ${escapedCmd}`,
        `${indent}${indent}args: ${argsStr}`,
    ];

    if (!existingContent || existingContent.trim() === "") {
        return `mcp_servers:\n${superpowersBlock.join("\n")}\n`;
    }

    const mcpServersIndex = lines.findIndex((l) => /^\s*mcp_servers:\s*$/.test(l));
    if (mcpServersIndex === -1) {
        return `${existingContent.trimEnd()}\n\nmcp_servers:\n${superpowersBlock.join("\n")}\n`;
    }

    let superpowersIndex = -1;
    for (let i = mcpServersIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (/^[^\s#]/.test(line)) {
            break;
        }
        if (/^\s+superpowers:\s*$/.test(line)) {
            superpowersIndex = i;
            break;
        }
    }

    if (superpowersIndex !== -1) {
        const spIndent = lines[superpowersIndex].match(/^(\s*)/)?.[1].length || 2;
        let endIndex = superpowersIndex + 1;
        while (endIndex < lines.length) {
            const line = lines[endIndex];
            const curIndent = line.match(/^(\s*)/)?.[1].length || 0;
            if (curIndent > spIndent || line.trim() === "") {
                endIndex++;
            } else {
                break;
            }
        }
        lines.splice(superpowersIndex, endIndex - superpowersIndex, ...superpowersBlock);
        return lines.join("\n");
    } else {
        lines.splice(mcpServersIndex + 1, 0, ...superpowersBlock);
        return lines.join("\n");
    }
}

/**
 * Updates a JSON MCP configuration file with JSONC tolerance and strict plain object verification.
 */
export function updateJsonConfig(
    existingContent: string,
    formatType: JsonFormatType,
    cmd: string,
    args: string[],
    remove = false
): string {
    let json: Record<string, unknown> = {};
    if (existingContent && existingContent.trim() !== "") {
        try {
            // First attempt standard native JSON.parse to preserve string literals containing '//'
            const parsed = JSON.parse(existingContent);
            if (isPlainObject(parsed)) {
                json = parsed;
            } else {
                json = {};
            }
        } catch (_nativeErr: unknown) {
            // If standard parse fails, fallback to JSONC comment and trailing comma stripping
            try {
                const sanitized = stripJsonComments(existingContent);
                const parsed = JSON.parse(sanitized);
                if (isPlainObject(parsed)) {
                    json = parsed;
                } else {
                    json = {};
                }
            } catch (e: unknown) {
                const err = e instanceof Error ? e.message : String(e);
                throw new Error(`Failed to parse existing JSON: ${err}`);
            }
        }
    }

    const rootKey = formatType === "json-servers" ? "servers" : "mcpServers";

    if (!isPlainObject(json[rootKey])) {
        json[rootKey] = {};
    }

    const targetServers = json[rootKey] as Record<string, unknown>;

    if (remove) {
        delete targetServers["superpowers"];
    } else {
        if (formatType === "json-servers") {
            targetServers["superpowers"] = {
                command: cmd,
                args: args,
                type: "stdio",
            };
        } else {
            targetServers["superpowers"] = {
                command: cmd,
                args: args,
            };
        }
    }

    return JSON.stringify(json, null, 2) + "\n";
}

/**
 * Performs atomic file write via temp file + renameSync, preserving symlinks with zero disk pollution by default.
 */
export function safeWriteConfig(configPath: string, newContent: string, backup = false): void {
    let targetFilePath = configPath;
    try {
        const stat = fs.lstatSync(configPath, { throwIfNoEntry: false });
        if (stat && stat.isSymbolicLink()) {
            try {
                targetFilePath = fs.realpathSync(configPath);
            } catch (_err) {
                // If symlink target does not exist yet (dangling symlink), resolve relative to symlink dirname
                const linkTarget = fs.readlinkSync(configPath);
                targetFilePath = path.resolve(path.dirname(configPath), linkTarget);
            }
        }
    } catch (_lstatErr) {
        // Fall back to original configPath if stat fails
    }

    const configDir = path.dirname(targetFilePath);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
    }

    let fileMode = 0o600;
    if (fs.existsSync(targetFilePath)) {
        try {
            fileMode = fs.statSync(targetFilePath).mode;
        } catch (_statErr) {
            // Keep default fileMode 0o600
        }

        if (backup) {
            const original = fs.readFileSync(targetFilePath, "utf8");
            const backupPath = `${targetFilePath}.${Date.now()}.bak`;
            try {
                fs.writeFileSync(backupPath, original, { encoding: "utf8", mode: fileMode });
            } catch (bakErr: unknown) {
                const msg = bakErr instanceof Error ? bakErr.message : String(bakErr);
                throw new Error(`Failed to create safe backup before write: ${msg}`);
            }
        }
    }

    // Atomic write via temp file in target directory using cryptographically random suffix & wx flag
    const randomSuffix = crypto.randomBytes(8).toString("hex");
    const tmpPath = path.join(configDir, `.tmp.${path.basename(targetFilePath)}.${process.pid}.${randomSuffix}`);
    try {
        fs.writeFileSync(tmpPath, newContent, { encoding: "utf8", mode: fileMode, flag: "wx" });
        fs.renameSync(tmpPath, targetFilePath);
    } catch (writeErr) {
        try {
            if (fs.existsSync(tmpPath)) {
                fs.unlinkSync(tmpPath);
            }
        } catch (_cleanErr) {
            // Best effort cleanup of temp file
        }
        throw writeErr;
    }
}

export interface SetupOptions {
    platform?: string;
    homeDir?: string;
    appData?: string;
    localAppData?: string;
    dryRun?: boolean;
    remove?: boolean;
    bun?: boolean;
    backup?: boolean;
    target?: string | null;
}

export interface SetupResult {
    target: string;
    name: string;
    path: string;
    status: "created" | "updated" | "up-to-date" | "skipped" | "removed" | "error";
    message: string;
}

/**
 * Main setup runner.
 */
export async function runSetup(options: SetupOptions = {}): Promise<SetupResult[]> {
    const platform = options.platform || os.platform();
    const homeDir = options.homeDir || os.homedir();
    const appData = options.appData || process.env.APPDATA;
    const localAppData = options.localAppData || process.env.LOCALAPPDATA;
    const isDryRun = !!options.dryRun;
    const isRemove = !!options.remove;
    const useBun = !!options.bun;
    const explicitTarget = options.target ? options.target.toLowerCase() : null;

    const cmd = useBun ? "bunx" : "npx";
    const args = ["-y", "superpowers-mcp"];

    const results: SetupResult[] = [];

    if (!explicitTarget) {
        throw new Error(
            `No target client specified. Please specify which client to configure using --target <${Object.keys(HARNESS_CONFIGS).join("|")}>.`
        );
    }

    const matchedKey = Object.keys(HARNESS_CONFIGS).find(
        (k) => k === explicitTarget || HARNESS_CONFIGS[k].aliases.includes(explicitTarget)
    );
    if (!matchedKey) {
        throw new Error(
            `Unknown harness target: "${explicitTarget}". Supported targets: ${Object.keys(HARNESS_CONFIGS).join(", ")}`
        );
    }
    const targets = [matchedKey];

    for (const key of targets) {
        const harness = HARNESS_CONFIGS[key];
        const configPath = harness.getConfigPath(platform, homeDir, appData, localAppData);

        const fileExists = fs.existsSync(configPath);

        // If removing and file does not exist, return up-to-date idempotently without creating files
        if (isRemove && !fileExists) {
            results.push({
                target: key,
                name: harness.name,
                path: configPath,
                status: "up-to-date",
                message: "Already not configured (file does not exist)",
            });
            continue;
        }

        try {
            let originalContent = "";
            if (fileExists) {
                originalContent = fs.readFileSync(configPath, "utf8");
            }

            let newContent = "";
            if (harness.type === "yaml") {
                newContent = updateYamlConfig(originalContent, cmd, args, isRemove);
            } else {
                newContent = updateJsonConfig(originalContent, harness.type, cmd, args, isRemove);
            }

            if (originalContent.trim() === newContent.trim() && fileExists) {
                results.push({
                    target: key,
                    name: harness.name,
                    path: configPath,
                    status: "up-to-date",
                    message: isRemove ? "Already not configured" : "Already configured and up-to-date",
                });
                continue;
            }

            if (!isDryRun) {
                safeWriteConfig(configPath, newContent, !!options.backup);
            }

            results.push({
                target: key,
                name: harness.name,
                path: configPath,
                status: isRemove ? "removed" : fileExists ? "updated" : "created",
                message: isDryRun
                    ? `[Dry Run] Would ${isRemove ? "remove from" : fileExists ? "update" : "create"} ${configPath}`
                    : `Successfully ${isRemove ? "removed from" : fileExists ? "updated" : "configured"}!`,
            });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            results.push({
                target: key,
                name: harness.name,
                path: configPath,
                status: "error",
                message: msg,
            });
        }
    }

    return results;
}

/**
 * CLI parser and runner.
 */
export async function runSetupCli(argv = process.argv.slice(2)): Promise<void> {
    const options: SetupOptions = {
        dryRun: false,
        remove: false,
        bun: false,
        backup: false,
        target: null,
    };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === "setup" || arg === "--setup") {
            continue;
        } else if (arg === "--dry-run") {
            options.dryRun = true;
        } else if (arg === "--remove" || arg === "--uninstall") {
            options.remove = true;
        } else if (arg === "--bun") {
            options.bun = true;
        } else if (arg === "--backup") {
            options.backup = true;
        } else if (arg === "--target" || arg === "-t") {
            const nextVal = argv[i + 1];
            if (!nextVal || nextVal.startsWith("-")) {
                console.error("❌ Error: Missing value for --target flag.\n");
                process.exit(1);
            }
            options.target = argv[++i];
        } else if (arg.startsWith("--target=")) {
            const val = arg.split("=")[1];
            if (!val) {
                console.error("❌ Error: Missing value for --target flag.\n");
                process.exit(1);
            }
            options.target = val;
        } else if (arg === "--help" || arg === "-h") {
            printHelp();
            return;
        } else if (!arg.startsWith("-") && !options.target && arg !== "setup") {
            options.target = arg;
        } else if (arg.startsWith("-")) {
            console.error(`❌ Error: Unknown option "${arg}". Use --help for usage.\n`);
            process.exit(1);
        }
    }

    console.log("\n========================================================");
    console.log("⚡ Superpowers MCP - Targeted Client Setup");
    console.log("========================================================\n");

    if (!options.target) {
        console.log("Please select which AI Agent client you would like to configure:\n");
        console.log("  npx -y superpowers-mcp setup --target antigravity # Antigravity (~/.gemini/config/mcp_config.json)");
        console.log("  npx -y superpowers-mcp setup --target pi-desktop  # Pi Desktop / Pi Agent (~/.pi/agent/mcp.json)");
        console.log("  npx -y superpowers-mcp setup --target cursor     # Cursor (~/.cursor/mcp.json)");
        console.log("  npx -y superpowers-mcp setup --target copilot    # GitHub Copilot (VS Code mcp.json)");
        console.log("  npx -y superpowers-mcp setup --target hermes     # Hermes Desktop / Agent");
        console.log("  npx -y superpowers-mcp setup --target kimi       # Kimi Work / Kimi Code");
        console.log("  npx -y superpowers-mcp setup --target claude     # Claude Desktop");
        console.log("  npx -y superpowers-mcp setup --target devin      # Devin Desktop (formerly Windsurf)\n");
        console.log("💡 Tip:");
        console.log("   You can run this setup command from ANY folder on your system.");
        console.log("   It automatically targets your global config files (~/...) without needing to clone this repo.\n");
        console.log("💡 Privacy & Safety:");
        console.log("   Superpowers MCP only configures the specific client you explicitly choose.");
        console.log("   It will NEVER silently scan or modify unselected environments.\n");
        return;
    }

    try {
        const results = await runSetup(options);

        let successCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const res of results) {
            const icon =
                res.status === "created" || res.status === "updated" || res.status === "removed"
                    ? "✅"
                    : res.status === "up-to-date"
                    ? "✨"
                    : res.status === "skipped"
                    ? "⏭️ "
                    : "❌";

            console.log(`${icon} [${res.name}] (${res.status})`);
            console.log(`   Path: ${res.path}`);
            console.log(`   Info: ${res.message}\n`);

            if (res.status === "created" || res.status === "updated" || res.status === "up-to-date" || res.status === "removed") {
                successCount++;
            } else if (res.status === "skipped") {
                skippedCount++;
            } else if (res.status === "error") {
                errorCount++;
            }
        }

        console.log("--------------------------------------------------------");
        if (errorCount > 0) {
            console.error(`⚠️ Setup finished with errors: ${errorCount} failure(s), ${successCount} succeeded.`);
            process.exit(1);
        }

        console.log(`🎉 Setup complete! ${successCount} environment(s) ready.`);
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`❌ Setup failed: ${msg}\n`);
        process.exit(1);
    }
}

function printHelp(): void {
    console.log(`
Superpowers MCP - Targeted Global Setup

Usage:
  npx -y superpowers-mcp setup --target <name> [options]

Options:
  --target, -t <name>   Configure specific harness (Required):
                        antigravity (agy, gemini), pi-desktop (pi, pi-agent), cursor,
                        copilot (vscode), hermes, kimi, claude, devin (windsurf)
  --bun                 Use "bunx" instead of "npx" in server commands
  --backup              Create a timestamped .bak backup before modifying (Default: false, zero-pollution)
  --remove              Remove superpowers MCP configuration from target
  --dry-run             Preview changes without writing files
  --help, -h            Show this help message

Examples:
  npx -y superpowers-mcp setup --target antigravity # Configure Antigravity only
  npx -y superpowers-mcp setup --target pi-desktop  # Configure Pi Desktop / Pi Agent only
  npx -y superpowers-mcp setup --target cursor      # Configure Cursor only
  npx -y superpowers-mcp setup --target copilot     # Configure GitHub Copilot (VS Code) only
  npx -y superpowers-mcp setup --target hermes      # Configure Hermes Desktop only
  npx -y superpowers-mcp setup --target kimi        # Configure Kimi Work only
  npx -y superpowers-mcp setup --target claude      # Configure Claude Desktop only
  npx -y superpowers-mcp setup --target devin       # Configure Devin Desktop (Windsurf) only

Any Directory:
  You can run this command from ANY directory on your machine.
  It automatically resolves global configuration paths based on your user home folder.

Privacy & Safety:
  Superpowers MCP only touches the client you explicitly choose.
  It never bulk-modifies your environment without your consent.
`);
}
