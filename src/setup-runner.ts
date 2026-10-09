/**
 * Superpowers MCP - Universal Global Setup & Configuration Engine
 * Supports: macOS, Windows, Linux
 * Targets: GitHub Copilot (VS Code / VS Code Insiders), Cursor, Hermes Desktop, Kimi Work,
 *          Claude Desktop, Devin Desktop, Antigravity, Pi Desktop, QwenPaw, Cline,
 *          Kilo Code, Qoder, Kiro, Trae, LM Studio, Roo Code (VS Code Desktop), Codex,
 *          OpenClaw, Goose
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";

export type JsonFormatType = "json-servers" | "json-mcpServers" | "json-mcp";

export interface HarnessConfig {
    name: string;
    aliases: string[];
    getConfigPath: (platform: string, homeDir: string, appData?: string, localAppData?: string) => string;
    type: JsonFormatType | "yaml" | "toml";
    defaultConfig: (cmd: string, args: string[]) => Record<string, unknown>;
    // Optional explicit container path for JSON configs, e.g. ["mcp", "servers"]
    // for OpenClaw (mcp.servers.superpowers). When set, discovery, creation,
    // and removal are confined to this path instead of the format-conventional
    // root key.
    serverPath?: string[];
    // YAML profile: "mcp" writes mcp_servers.<name> with command/args (default),
    // "goose" writes extensions.<name> with name/cmd/args/type (goose CLI/Desktop).
    yamlProfile?: "mcp" | "goose";
}

export const HARNESS_CONFIGS: Record<string, HarnessConfig> = {
    lmstudio: {
        name: "LM Studio",
        aliases: ["lmstudio", "lm-studio"],
        getConfigPath: (_platform, homeDir) => path.join(homeDir, ".lmstudio", "mcp.json"),
        type: "json-mcpServers",
        defaultConfig: (command, args) => ({ command, args }),
    },
    roo: {
        name: "Roo Code (VS Code Desktop)",
        aliases: ["roo", "roo-code", "roocode"],
        getConfigPath: (platform, homeDir, appData) => {
            const base = platform === "win32"
                ? appData || path.join(homeDir, "AppData", "Roaming")
                : platform === "darwin"
                    ? path.join(homeDir, "Library", "Application Support")
                    : path.join(homeDir, ".config");
            return path.join(base, "Code", "User", "globalStorage", "rooveterinaryinc.roo-cline", "settings", "mcp_settings.json");
        },
        type: "json-mcpServers",
        defaultConfig: (command, args) => ({ command, args }),
    },
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
    "copilot-insiders": {
        name: "GitHub Copilot (VS Code Insiders)",
        aliases: ["vscode-insiders", "code-insiders", "insiders", "insider", "vscode-insider", "code-insider", "copilot-insider"],
        getConfigPath: (platform, homeDir, appData, _localAppData) => {
            if (platform === "win32") {
                return path.join(appData || path.join(homeDir, "AppData", "Roaming"), "Code - Insiders", "User", "mcp.json");
            } else if (platform === "darwin") {
                return path.join(homeDir, "Library", "Application Support", "Code - Insiders", "User", "mcp.json");
            } else {
                return path.join(homeDir, ".config", "Code - Insiders", "User", "mcp.json");
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
        getConfigPath: (platform, homeDir, appData) => {
            // The devin CLI keeps its config under the platform's config home; on
            // Windows that is %APPDATA% (mirroring the other JSON targets) rather than
            // ~/.config. The Windsurf/Codeium path is home-relative on every platform.
            const configHome = platform === "win32" && appData ? appData : path.join(homeDir, ".config");
            const devinCliPath = path.join(configHome, "devin", "mcp_config.json");
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
    qwenpaw: {
        name: "QwenPaw (Personal Agent Workstation)",
        aliases: ["qwenpaw", "qwen-paw", "copaw"],
        getConfigPath: (_platform, homeDir) => {
            const qwenPath = path.join(homeDir, ".qwenpaw", "config.json");
            if (fs.existsSync(qwenPath)) return qwenPath;
            const legacyPath = path.join(homeDir, ".copaw", "config.json");
            if (fs.existsSync(legacyPath)) return legacyPath;
            return qwenPath;
        },
        type: "json-mcpServers",
        defaultConfig: (cmd, args) => ({
            command: cmd,
            args: args,
        }),
    },
    cline: {
        name: "Cline (VS Code / CLI)",
        aliases: ["cline", "claude-dev"],
        getConfigPath: (platform, homeDir, appData) => {
            let globalStoragePath = "";
            if (platform === "win32") {
                globalStoragePath = path.join(
                    appData || path.join(homeDir, "AppData", "Roaming"),
                    "Code",
                    "User",
                    "globalStorage",
                    "saoudrizwan.claude-dev",
                    "settings",
                    "cline_mcp_settings.json"
                );
            } else if (platform === "darwin") {
                globalStoragePath = path.join(
                    homeDir,
                    "Library",
                    "Application Support",
                    "Code",
                    "User",
                    "globalStorage",
                    "saoudrizwan.claude-dev",
                    "settings",
                    "cline_mcp_settings.json"
                );
            } else {
                globalStoragePath = path.join(
                    homeDir,
                    ".config",
                    "Code",
                    "User",
                    "globalStorage",
                    "saoudrizwan.claude-dev",
                    "settings",
                    "cline_mcp_settings.json"
                );
            }
            if (fs.existsSync(globalStoragePath)) return globalStoragePath;
            const cliPath = path.join(homeDir, ".cline", "data", "settings", "cline_mcp_settings.json");
            if (fs.existsSync(cliPath)) return cliPath;
            return globalStoragePath;
        },
        type: "json-mcpServers",
        defaultConfig: (cmd, args) => ({
            command: cmd,
            args: args,
        }),
    },
    kilo: {
        name: "Kilo Code",
        aliases: ["kilo", "kilocode", "kilo-code"],
        getConfigPath: (_platform, homeDir) => {
            const jsoncPath = path.join(homeDir, ".config", "kilo", "kilo.jsonc");
            if (fs.existsSync(jsoncPath)) return jsoncPath;
            const jsonPath = path.join(homeDir, ".config", "kilo", "kilo.json");
            if (fs.existsSync(jsonPath)) return jsonPath;
            return jsoncPath;
        },
        type: "json-mcp",
        defaultConfig: (cmd, args) => ({
            type: "local",
            command: [cmd, ...args],
            enabled: true,
        }),
    },
    qoder: {
        name: "Qoder",
        aliases: ["qoder"],
        getConfigPath: (_platform, homeDir) => {
            return path.join(homeDir, ".qoder", "settings.json");
        },
        type: "json-mcpServers",
        defaultConfig: (cmd, args) => ({
            command: cmd,
            args: args,
        }),
    },
    kiro: {
        name: "Kiro",
        aliases: ["kiro", "kiro-code"],
        getConfigPath: (_platform, homeDir) => {
            return path.join(homeDir, ".kiro", "settings", "mcp.json");
        },
        type: "json-mcpServers",
        defaultConfig: (cmd, args) => ({
            command: cmd,
            args: args,
        }),
    },
    trae: {
        name: "Trae",
        aliases: ["trae"],
        getConfigPath: (platform, homeDir, appData) => {
            if (platform === "win32") {
                const standard = path.join(appData || path.join(homeDir, "AppData", "Roaming"), "Trae", "User", "mcp.json");
                if (fs.existsSync(standard)) return standard;
                const cn = path.join(appData || path.join(homeDir, "AppData", "Roaming"), "Trae CN", "User", "mcp.json");
                if (fs.existsSync(cn)) return cn;
                return standard;
            } else if (platform === "darwin") {
                const standard = path.join(homeDir, "Library", "Application Support", "Trae", "User", "mcp.json");
                if (fs.existsSync(standard)) return standard;
                const cn = path.join(homeDir, "Library", "Application Support", "Trae CN", "User", "mcp.json");
                if (fs.existsSync(cn)) return cn;
                return standard;
            } else {
                const standard = path.join(homeDir, ".config", "Trae", "User", "mcp.json");
                if (fs.existsSync(standard)) return standard;
                const cn = path.join(homeDir, ".config", "Trae CN", "User", "mcp.json");
                if (fs.existsSync(cn)) return cn;
                return standard;
            }
        },
        type: "json-mcpServers",
        defaultConfig: (cmd, args) => ({
            command: cmd,
            args: args,
        }),
    },
    codex: {
        name: "Codex",
        aliases: ["codex"],
        getConfigPath: (_platform, homeDir) => {
            return path.join(homeDir, ".codex", "config.toml");
        },
        type: "toml",
        defaultConfig: (cmd, args) => ({
            command: cmd,
            args: args,
        }),
    },
    openclaw: {
        name: "OpenClaw",
        aliases: ["openclaw", "open-claw"],
        getConfigPath: (_platform, homeDir) => {
            return path.join(homeDir, ".openclaw", "openclaw.json");
        },
        type: "json-mcpServers",
        serverPath: ["mcp", "servers"],
        defaultConfig: (cmd, args) => ({
            command: cmd,
            args: args,
        }),
    },
    goose: {
        name: "Goose",
        aliases: ["goose"],
        getConfigPath: (platform, homeDir, appData) => {
            if (platform === "win32") {
                return path.join(appData || path.join(homeDir, "AppData", "Roaming"), "Block", "goose", "config", "config.yaml");
            }
            return path.join(homeDir, ".config", "goose", "config.yaml");
        },
        type: "yaml",
        yamlProfile: "goose",
        defaultConfig: (cmd, args) => ({
            cmd: cmd,
            args: args,
        }),
    },
};

/**
 * Root key candidates for JSON configurations, in preference order. A file may use
 * any of them for the same purpose, so all are inspected before deciding where the
 * superpowers entry belongs.
 */
export const JSON_SERVER_ROOT_KEYS = ["mcpServers", "servers", "mcp"] as const;

/**
 * Checks if a value is a non-null plain object (not an Array, Date, Buffer, etc.).
 */
export function isPlainObject(val: unknown): val is Record<string, unknown> {
    return Object.prototype.toString.call(val) === "[object Object]";
}

/**
 * Strips comments and trailing commas to tolerate JSONC formatted configurations (e.g. VS Code).
 * Implemented as a deterministic O(N) single-pass scanner to eliminate polynomial ReDoS (CWE-1333).
 */
export function stripJsonComments(content: string, skipFastPath = false): string {
    if (!content) {
        return "";
    }

    // 若未明確略過且原內容已是標準合法 JSON（無註解與尾隨逗號），直接直通返回，零開銷
    if (!skipFastPath) {
        try {
            JSON.parse(content);
            return content;
        } catch (_parseErr: unknown) {
            // 含註解或尾隨逗號，走單趟線性掃描器
        }
    }

    const len = content.length;
    const output: string[] = [];

    let inString = false;
    let isEscaped = false;
    let inSingleComment = false;
    let inMultiComment = false;
    let lastCommaIndex = -1;

    for (let i = 0; i < len; i++) {
        const ch = content[i];
        const next = i + 1 < len ? content[i + 1] : "";

        if (inSingleComment) {
            if (ch === "\n" || ch === "\r") {
                inSingleComment = false;
                output.push(ch);
            }
            continue;
        }

        if (inMultiComment) {
            if (ch === "*" && next === "/") {
                inMultiComment = false;
                i++; // Skip '/'
            }
            continue;
        }

        if (inString) {
            output.push(ch);
            if (isEscaped) {
                isEscaped = false;
            } else if (ch === "\\") {
                isEscaped = true;
            } else if (ch === '"') {
                inString = false;
            }
            continue;
        }

        // Not in comment or string
        if (ch === '"') {
            inString = true;
            isEscaped = false;
            lastCommaIndex = -1;
            output.push(ch);
            continue;
        }

        if (ch === "/" && next === "/") {
            inSingleComment = true;
            i++; // Skip next '/'
            continue;
        }

        if (ch === "/" && next === "*") {
            inMultiComment = true;
            i++; // Skip next '*'
            continue;
        }

        // Handle trailing commas
        if (ch === ",") {
            lastCommaIndex = output.length;
            output.push(ch);
            continue;
        }

        if (ch === "}" || ch === "]") {
            if (lastCommaIndex !== -1) {
                output[lastCommaIndex] = " ";
                lastCommaIndex = -1;
            }
            output.push(ch);
            continue;
        }

        if (ch !== " " && ch !== "\t" && ch !== "\n" && ch !== "\r") {
            // Any non-whitespace character other than } or ] resets lastCommaIndex
            lastCommaIndex = -1;
        }

        output.push(ch);
    }

    return output.join("");
}

/** Single whitespace character test, mirroring the `\s` class used by the YAML patterns. */
const WHITESPACE_CHAR = /\s/;

/**
 * Returns a YAML line's trailing inline comment, including the whitespace run directly
 * before it (e.g. `"  superpowers: # note"` -> `" # note"`), or an empty string when the
 * line has no inline comment.
 *
 * Implemented as a single linear scan because the equivalent unanchored pattern with a
 * leading quantifier backtracks quadratically on lines padded with long whitespace runs.
 */
function extractInlineComment(line: string): string {
    for (let i = 1; i < line.length; i++) {
        if (line[i] !== "#" || !WHITESPACE_CHAR.test(line[i - 1])) continue;
        let start = i - 1;
        while (start > 0 && WHITESPACE_CHAR.test(line[start - 1])) start--;
        return line.slice(start);
    }
    return "";
}

/**
 * Parses simple YAML to locate/inject mcp_servers.superpowers safely without external dependencies.
 */
export function updateYamlConfig(existingContent: string, cmd: string, args: string[], remove = false, yamlProfile: "mcp" | "goose" = "mcp"): string {
    // Profile selects the managed root and entry shape. "mcp" (Hermes-style)
    // owns command/args under mcp_servers.<name>; "goose" owns cmd/args/type
    // under extensions.<name> and deliberately preserves the user's name,
    // enabled, timeout, and envs (same philosophy as the JSON updater's enabled/disabled
    // preservation: never flip a switch the user set explicitly).
    const spec = yamlProfile === "goose"
        ? {
            rootKey: "extensions",
            // name is create-only default ("Superpowers"): user renames are preserved
            // on update via keptChildren, same as enabled/timeout/envs.
            ownedKeys: ["cmd", "args", "type"],
            // Owned keys first: an update replays them ahead of the user's
            // preserved keys, so emitting them in this order makes a re-run
            // byte-identical (create -> update -> update, not create -> reorder).
            freshEntry: (indent: string, c: string, a: string[]): string[] => [
                `${indent}superpowers:`,
                `${indent}${indent}cmd: ${JSON.stringify(c)}`,
                `${indent}${indent}args: ${JSON.stringify(a)}`,
                `${indent}${indent}type: stdio`,
                `${indent}${indent}name: "Superpowers"`,
                `${indent}${indent}enabled: true`,
                `${indent}${indent}timeout: 300`,
            ],
        }
        : {
            rootKey: "mcp_servers",
            ownedKeys: ["command", "args"],
            freshEntry: (indent: string, c: string, a: string[]): string[] => [
                `${indent}superpowers:`,
                `${indent}${indent}command: ${JSON.stringify(c)}`,
                `${indent}${indent}args: ${JSON.stringify(a)}`,
            ],
        };
    if (!/^[A-Za-z0-9_-]+$/.test(spec.rootKey)) throw new Error("Invalid YAML root key");
    // Built once from internal constants (never user input): anchored patterns
    // only, preserving the linear-time ReDoS discipline documented below.
    // YAML permits the root key to be quoted (`"mcp_servers":` / `'mcp_servers':`),
    // which is what several editors emit. Without the optional quotes these forms
    // are invisible to the updater: the add path appended a second, unquoted
    // `mcp_servers:` block (a duplicate-key mapping that most parsers reject or
    // silently overwrite) and the remove path left the entry in place.
    const rootKeyPattern = new RegExp(`^(\\s*)["']?${spec.rootKey}["']?\\s*:`);
    const rootHeaderPattern = new RegExp(`^(\\s*)["']?${spec.rootKey}["']?\\s*:\\s*(?:#.*)?$`);
    const ownedKeyPattern = new RegExp(`^\\s*["']?(?:${spec.ownedKeys.join("|")})["']?\\s*:`);
    // The empty flow mapping is load-bearing: without it `superpowers: {}` is
    // invisible here, and install then appends a second `superpowers:` beside it —
    // a duplicate key YAML resolves last-wins, silently dropping the new entry.
    const managedEntryPattern = /^(\s*)["']?superpowers["']?\s*:\s*(?:\{[ \t]*\})?\s*(?:#.*)?$/;
    const lines = existingContent ? existingContent.split(/\r?\n/) : [];
    // Line edits are newline-agnostic (lines are split on /\r?\n/), so every
    // reassembly must restore the file's original convention. CRLF configs are
    // common on Windows; emitting LF would rewrite every line of the user's file.
    const eol = existingContent.includes("\r\n") ? "\r\n" : "\n";
    // Strips up to `max` trailing "\r?\n" terminators (`max` < 0 strips all)
    // with a single linear scan. The previous `text.replace(/(?:\r?\n)+$/, "")`
    // was quadratic on newline-padded input (CodeQL js/polynomial-redos #8):
    // every candidate start position inside a "\n" run re-consumed the
    // remainder before failing the `$` anchor. Consuming one trailing "\n"
    // (plus its "\r" half, if present) per iteration matches the regex exactly,
    // including lone-"\r" pass-through (the regex never strips a bare "\r").
    const stripTerminators = (value: string, max: number): string => {
        let end = value.length;
        let stripped = 0;
        while (end > 0 && value[end - 1] === "\n" && (max < 0 || stripped < max)) {
            end--;
            if (end > 0 && value[end - 1] === "\r") {
                end--;
            }
            stripped++;
        }
        return value.slice(0, end);
    };
    const withEol = (body: string): string => {
        const hadTrailingEol = existingContent.endsWith("\n");
        const text = body.split("\n").join(eol);
        // With a trailing EOL the file keeps content plus exactly one normalized
        // terminator (the old `/(?:\r?\n)?$/` dropped at most one); without one,
        // every trailing terminator goes (the old `/(?:\r?\n)+$/`).
        return hadTrailingEol ? stripTerminators(text, 1) + eol : stripTerminators(text, -1);
    };
    const mcpDeclarations = lines
        // Match the key with a single unambiguous pattern, then trim the remainder with
        // String#trim: the previous `\s*(.*?)\s*$` tail backtracks polynomially on input
        // padded with long whitespace runs (CodeQL js/polynomial-redos).
        .map((line, index) => {
            const match = line.match(rootKeyPattern);
            if (!match) return null;
            return { index, indent: match[1], tail: line.slice(match[0].length).trim() };
        })
        .filter((entry) => entry !== null);

    // Only root-level (column-0) mcp_servers mappings are the ones this updater
    // manages. A nested mcp_servers under another key must not count as a duplicate
    // (it belongs to a different parent) nor be mistaken for the root mapping.
    const rootDecls = mcpDeclarations.filter((entry) => entry.indent === "");

    if (rootDecls.length > 1) {
        throw new Error(`Cannot safely update YAML with duplicate ${spec.rootKey} keys`);
    }
    // The value a root declaration carries, with any trailing inline comment
    // removed. `--remove` writes `rootKey: {}` and re-attaches the user's comment,
    // so the value must be judged without it — otherwise the state the tool itself
    // produces is rejected on the next install.
    const rootValue = (tail: string): string =>
        (extractInlineComment(` ${tail}`) ? tail.slice(0, tail.length - extractInlineComment(` ${tail}`).length) : tail).trim();

    if (rootDecls.length === 1) {
        const declaration = rootDecls[0];
        const value = rootValue(declaration.tail);
        const isEmptyFlowMap = value === "{}" || value === "{ }";
        if (declaration.tail !== "" && !declaration.tail.startsWith("#") && !isEmptyFlowMap) {
            throw new Error(`Cannot safely update YAML unless ${spec.rootKey} is a root-level block mapping`);
        }
    } else if (mcpDeclarations.length > 0) {
        // mcp_servers exists but only nested under another key — there is no root
        // mapping to update, and we must not inject into the nested one.
        throw new Error(`Cannot safely update YAML unless ${spec.rootKey} is a root-level block mapping`);
    }

    let indent = "  ";
    if (rootDecls.length === 1) {
        // 以第一個子層級（非空、非註解）行的縮排為準，而不是只看緊接的下一行，
        // 也不要求該行是 [a-zA-Z0-9_-]+ 形式的 key。舊行為在首個子項 key 含
        // 點號或引號（例如 "my.key:"）時會退回預設兩空格，導致插入第二個
        // superpowers: 造成重複 key。
        for (let i = rootDecls[0].index + 1; i < lines.length; i++) {
            if (lines[i].trim() === "" || lines[i].trimStart().startsWith("#")) continue;
            if (/^[^\s]/.test(lines[i])) break;
            const child = lines[i].match(/^(\s+)\S/);
            if (child) indent = child[1];
            break;
        }
    }

    if (remove) {
        const newLines: string[] = [];
        let inMcpServers = false;
        let mcpIndent = 0;
        let inSuperpowers = false;
        let superpowersIndent = 0;
        let removedEntry = false;
        let headerIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const mcpMatch = line.match(rootHeaderPattern);
            if (mcpMatch) {
                inMcpServers = true;
                mcpIndent = mcpMatch[1].length;
                // Only the root-level header owns the empty-map rewrite; a nested
                // header of the same name belongs to a different parent.
                if (mcpIndent === 0) headerIndex = newLines.length;
                newLines.push(line);
                continue;
            }

            if (inMcpServers) {
                const curIndent = line.match(/^(\s*)/)?.[1].length || 0;
                if (line.trimStart().startsWith("#")) {
                    newLines.push(line);
                    continue;
                }
                if (line.trim() !== "" && curIndent <= mcpIndent) {
                    inMcpServers = false;
                    inSuperpowers = false;
                } else {
                    const spMatch = line.match(managedEntryPattern);
                    if (spMatch && spMatch[1] === indent) {
                        inSuperpowers = true;
                        superpowersIndent = spMatch[1].length;
                        removedEntry = true;
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
        // Removing the last managed entry leaves `rootKey:` with no children,
        // which parses as a null value. Some clients distinguish a null map from
        // an absent key and reject the config, so emit an explicit empty map.
        if (removedEntry && headerIndex >= 0 && headerIndex < newLines.length) {
            const header = newLines[headerIndex];
            const headerMatch = header.match(rootHeaderPattern);
            if (headerMatch) {
                const headerIndent = headerMatch[1].length;
                let survivingChild = false;
                for (let i = headerIndex + 1; i < newLines.length; i++) {
                    const candidate = newLines[i];
                    if (candidate.trim() === "" || candidate.trimStart().startsWith("#")) continue;
                    const candidateIndent = candidate.match(/^(\s*)/)?.[1].length ?? 0;
                    if (candidateIndent <= headerIndent) break;
                    survivingChild = true;
                    break;
                }
                if (!survivingChild) {
                    newLines[headerIndex] =
                        header.replace(rootHeaderPattern, `${headerMatch[1]}${spec.rootKey}: {}`) +
                        extractInlineComment(header);
                }
            }
        }
        return withEol(newLines.join("\n"));
    }

    const superpowersBlock = spec.freshEntry(indent, cmd, args);

    if (!existingContent || existingContent.trim() === "") {
        return withEol(`${spec.rootKey}:\n${superpowersBlock.join("\n")}`);
    }

    const mcpServersIndex = rootDecls.length === 1 ? rootDecls[0].index : -1;
    if (mcpServersIndex === -1) {
        return withEol(
            `${existingContent.trimEnd()}\n\n${spec.rootKey}:\n${superpowersBlock.join("\n")}`
        );
    }

    const rootValueText = rootDecls.length === 1 ? rootValue(rootDecls[0].tail) : "";
    if (rootValueText === "{}" || rootValueText === "{ }") {
        // Strip only the flow value, keeping any inline comment: an indented child
        // appended after a flow value would not parse as YAML.
        const header = lines[mcpServersIndex];
        const keyEnd = header.match(rootKeyPattern)?.[0].length ?? 0;
        const afterKey = header.slice(keyEnd);
        lines[mcpServersIndex] = (header.slice(0, keyEnd) +
            afterKey.slice(afterKey.indexOf(rootValueText) + rootValueText.length)).trimEnd();
    }

    let superpowersIndex = -1;
    for (let i = mcpServersIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (/^[^\s#]/.test(line)) {
            break;
        }
        const leadingWhitespace = line.match(/^(\s*)/)?.[1] || "";
        if (leadingWhitespace === indent && managedEntryPattern.test(line)) {
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
        // Keep the user's inline comment on the server declaration.
        const keptChildren: string[] = [];
        let skipIndent = -1;
        // Only direct children (superpowers indent + one level) are managed.
        // Deeper keys (e.g. envs: { type: ... } or env: { command: ... })
        // belong to user nested mappings and must be preserved verbatim.
        const directChildIndent = spIndent + indent.length;
        for (let i = superpowersIndex + 1; i < endIndex; i++) {
            const line = lines[i];
            if (line.trim() === "") continue;
            const childIndent = line.match(/^(\s*)/)?.[1].length ?? 0;
            if (skipIndent !== -1 && childIndent > skipIndent) {
                // 被移除欄位的巢狀子行（例如 command 底下的映射）一併移除
                continue;
            }
            skipIndent = -1;
            if (childIndent === directChildIndent && ownedKeyPattern.test(line)) {
                skipIndent = childIndent;
                continue;
            }
            keptChildren.push(line);
        }

        // 保留使用者在此條目下自行加入的欄位（env、type、disabled、cwd…），
        // 只重寫由我們負責管理的 command / args。舊行為整塊置換，重跑 setup
        // 會讓使用者的 env 等設定無聲消失。
        superpowersBlock[0] += extractInlineComment(lines[superpowersIndex]);
        // 更新時只重放 header 與受管 key；create 專用的預設值（例如 goose 的
        // enabled/timeout）不重放，以免與 keptChildren 裡的使用者設定重複成
        // duplicate key。mcp profile 的 fresh 行全為受管 key，行為與舊版一致。
        const updateBody = superpowersBlock.filter((line, idx) => {
            if (idx === 0) return true;
            const keyMatch = line.match(/^\s*["']?([A-Za-z0-9_-]+)["']?\s*:/);
            return !keyMatch || spec.ownedKeys.includes(keyMatch[1]);
        });
        lines.splice(superpowersIndex, endIndex - superpowersIndex, ...updateBody, ...keptChildren);
        return withEol(lines.join("\n"));
    } else {
        lines.splice(mcpServersIndex + 1, 0, ...superpowersBlock);
        return withEol(lines.join("\n"));
    }
}

/**
 * Splits a TOML line into [code, comment]. The comment starts at the first `#`
 * outside single/double-quoted strings; leading whitespace before it belongs to
 * the comment so reattaching it preserves the original spacing.
 *
 * Single linear scan — no backtracking patterns (same ReDoS discipline as the
 * YAML comment scanner above).
 */
function splitTomlComment(line: string): [string, string] {
    let quote: string | null = null;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (quote) {
            // TOML basic strings (double-quoted) support backslash escapes
            // (\" , \\ ...): skip the escaped char so an escaped quote
            // does not close the string early and a # inside stays code.
            // Literal strings (single-quoted) have no escapes.
            if (quote === '"' && ch === '\\' && i + 1 < line.length) {
                i++;
                continue;
            }
            if (ch === quote) quote = null;
            continue;
        }
        if (ch === '"' || ch === "'") {
            quote = ch;
            continue;
        }
        if (ch === "#") {
            let start = i;
            while (start > 0 && WHITESPACE_CHAR.test(line[start - 1])) start--;
            return [line.slice(0, start), line.slice(start)];
        }
    }
    return [line, ""];
}

/** Exact managed table header, tolerating surrounding whitespace and a trailing comment. */
const TOML_SUPERPOWERS_HEADER = /^\s*\[\s*mcp_servers\s*\.\s*superpowers\s*\]\s*(?:#.*)?$/;

/** TOML whitespace (space/tab/CR/LF/FF/VT) — explicit set keeps scans linear. */
function isTomlWhitespace(ch: string): boolean {
    return ch === " " || ch === "\t" || ch === "\n" || ch === "\r" || ch === "\f" || ch === "\v";
}

/**
 * Any TOML table header line — single linear scan, no backtracking.
 *
 * Replaces /^\s*\[.*\]\s*(?:#.*)?$/ which backtracks polynomially on
 * attacker-controlled config lines with many `]` runs (CWE-1333,
 * CodeQL js/polynomial-redos).
 */
function isTomlTableHeader(line: string): boolean {
    let start = 0;
    while (start < line.length && isTomlWhitespace(line[start])) start++;
    if (start >= line.length || line[start] !== "[") return false;
    const close = line.lastIndexOf("]");
    if (close <= start) return false;
    let j = close + 1;
    while (j < line.length && isTomlWhitespace(line[j])) j++;
    if (j >= line.length) return true;
    return line[j] === "#";
}

/** A `[mcp_servers.superpowers.…]` sub-table header, which belongs to our section. */
const TOML_SUPERPOWERS_SUBTABLE = /^\s*\[\s*mcp_servers\s*\.\s*superpowers\s*\./;

/**
 * `[[mcp_servers.superpowers]]` — an array-of-tables form that declares the same
 * name as our managed table and so can neither be updated in place nor left in
 * place by a removal that reported success.
 */
const TOML_SUPERPOWERS_ARRAY_HEADER = /^\s*\[\[\s*mcp_servers\s*\.\s*superpowers\s*\]\]/;

/**
 * Quoted table-name variants we cannot reason about safely — fail closed on sight.
 *
 * Linear scan (no backtracking): the previous
 * /^\s*\[.*["']mcp_servers["'].*["']superpowers["'].*\]\s*(?:#.*)?$/
 * stacked three `.*` repetitions and ran polynomially on lines starting with
 * `["mcp_servers"` (CWE-1333, CodeQL js/polynomial-redos). Any header that
 * mentions both table names and contains a quote is rejected; the bare
 * `[mcp_servers.superpowers]` form has no quotes and is unaffected.
 */
function isQuotedManagedTableHeader(line: string): boolean {
    let start = 0;
    while (start < line.length && isTomlWhitespace(line[start])) start++;
    if (start >= line.length || line[start] !== "[") return false;
    const close = line.lastIndexOf("]");
    if (close <= start) return false;
    let j = close + 1;
    while (j < line.length && isTomlWhitespace(line[j])) j++;
    if (j < line.length && line[j] !== "#") return false;
    const inner = line.slice(start + 1, close);
    if (!inner.includes("mcp_servers") || !inner.includes("superpowers")) return false;
    return inner.includes('"') || inner.includes("'");
}

/**
 * Parses a `command = <value>` / `args = <value>` assignment from comment-stripped
 * TOML code. Linear scan without backtracking (replaces
 * /^\s*(command|args)\s*=\s*([\s\S]*?)\s*$/).
 */
function parseTomlManagedAssignment(code: string): { key: "command" | "args"; value: string } | null {
    let i = 0;
    while (i < code.length && isTomlWhitespace(code[i])) i++;
    let key: "command" | "args" | null = null;
    if (code.startsWith("command", i)) {
        key = "command";
        i += 7;
    } else if (code.startsWith("args", i)) {
        key = "args";
        i += 4;
    } else {
        return null;
    }
    while (i < code.length && isTomlWhitespace(code[i])) i++;
    if (i >= code.length || code[i] !== "=") return null;
    i++;
    while (i < code.length && isTomlWhitespace(code[i])) i++;
    let end = code.length;
    while (end > i && isTomlWhitespace(code[end - 1])) end--;
    return { key, value: code.slice(i, end) };
}

/** Direct-child `command` / `args` key lines (comment already split off). */
const TOML_MANAGED_KEY = /^\s*(command|args)\s*=/;

/**
 * True when a managed TOML value is still open at end-of-line (unclosed `[`/`{`
 * or quote), i.e. it continues on the next line. The updater rewrites only the
 * physical line carrying `command =` / `args =`, so it must refuse such a value
 * rather than leave the continuation lines behind as invalid TOML.
 * Linear scan, no backtracking (same discipline as the scanners above).
 */
function tomlValueContinuesOnNextLine(value: string): boolean {
    let depth = 0;
    let quote: string | null = null;
    for (let i = 0; i < value.length; i++) {
        const ch = value[i];
        if (quote) {
            if (quote === '"' && ch === "\\" && i + 1 < value.length) {
                i++;
                continue;
            }
            if (ch === quote) quote = null;
            continue;
        }
        if (ch === '"' || ch === "'") {
            quote = ch;
            continue;
        }
        if (ch === "[" || ch === "{") depth++;
        else if (ch === "]" || ch === "}") depth--;
    }
    return depth > 0 || quote !== null;
}

/**
 * Parses Codex `config.toml` to locate/inject `[mcp_servers.superpowers]` safely without
 * external dependencies (runtime dependencies must stay empty per SECURITY.md).
 *
 * Surgical text updater: every other table, key, comment, and blank line is preserved
 * verbatim, including `[mcp_servers.superpowers.*]` sub-tables and user-added keys
 * (`enabled`, `env`, `cwd`, timeouts…). Only `command` / `args` under the managed
 * table are rewritten; their trailing comments are reattached.
 */
export function updateTomlConfig(existingContent: string, cmd: string, args: string[], remove = false): string {
    const lines = existingContent ? existingContent.split(/\r?\n/) : [];

    // Inline-table form (mcp_servers = {...} or mcp_servers.superpowers = {...})
    // cannot be merged surgically: appending a [mcp_servers.superpowers] table
    // would create a duplicate definition (invalid TOML). Fail closed.
    for (const line of lines) {
        if (/^\s*mcp_servers(?:\s*\.\s*[A-Za-z0-9_-]+)*\s*=/.test(line)) {
            throw new Error("Cannot safely update TOML with inline mcp_servers assignment (expected [mcp_servers.superpowers] table)");
        }
    }

    const headerIndexes: number[] = [];
    let arrayHeaderIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (isQuotedManagedTableHeader(lines[i])) {
            throw new Error("Cannot safely update TOML with quoted mcp_servers.superpowers table names");
        }
        if (TOML_SUPERPOWERS_ARRAY_HEADER.test(lines[i])) arrayHeaderIndex = i;
        if (TOML_SUPERPOWERS_HEADER.test(lines[i])) headerIndexes.push(i);
    }
    if (headerIndexes.length > 1) {
        throw new Error("Cannot safely update TOML with duplicate mcp_servers.superpowers tables");
    }

    // Our managed section runs to the next foreign table header (or EOF);
    // `[mcp_servers.superpowers.*]` sub-tables belong to us and are preserved on
    // update, removed together with the parent on remove.
    const blockEnd = (start: number): number => {
        let end = start + 1;
        while (end < lines.length) {
            if (isTomlTableHeader(lines[end]) && !TOML_SUPERPOWERS_SUBTABLE.test(lines[end])) break;
            end++;
        }
        return end;
    };

    if (remove) {
        const ranges = [...headerIndexes, ...(arrayHeaderIndex === -1 ? [] : [arrayHeaderIndex])]
            .map((start) => [start, blockEnd(start)] as const)
            .sort((a, b) => a[0] - b[0]);
        if (ranges.length === 0) return existingContent;
        const dropped = new Set<number>();
        for (const [start, end] of ranges) {
            for (let i = start; i < end; i++) dropped.add(i);
        }
        return lines.filter((_, i) => !dropped.has(i)).join("\n");
    }

    if (arrayHeaderIndex !== -1) {
        throw new Error(
            "Cannot safely update TOML: [[mcp_servers.superpowers]] is an array-of-tables, which cannot coexist with a [mcp_servers.superpowers] table. Remove it first."
        );
    }

    const expectedCommand = `command = ${JSON.stringify(cmd)}`;
    const expectedArgs = `args = ${JSON.stringify(args)}`;
    // Quote-style and whitespace agnostic comparison so re-runs over an equivalent
    // file return it untouched (idempotent `up-to-date` instead of noisy `updated`).
    const normTomlValue = (value: string): string => value.replace(/'/g, '"').replace(/\s+/g, "");

    if (headerIndexes.length === 0) {
        const block = `[mcp_servers.superpowers]\n${expectedCommand}\n${expectedArgs}\n`;
        if (!existingContent || existingContent.trim() === "") return block;
        return `${existingContent.trimEnd()}\n\n${block}`;
    }

    const header = headerIndexes[0];
    const end = blockEnd(header);
    // Direct children end at the first sub-table header.
    let childrenEnd = end;
    for (let i = header + 1; i < end; i++) {
        if (isTomlTableHeader(lines[i])) {
            childrenEnd = i;
            break;
        }
    }

    let currentCommand: string | null = null;
    let currentArgs: string | null = null;
    const comments: Record<string, string> = {};
    for (let i = header + 1; i < childrenEnd; i++) {
        const [code, comment] = splitTomlComment(lines[i]);
        const m = parseTomlManagedAssignment(code);
        if (!m) continue;
        if (tomlValueContinuesOnNextLine(m.value)) {
            throw new Error(
                `Cannot safely update TOML: ${m.key} under [mcp_servers.superpowers] spans multiple lines. Put it on a single line and re-run.`
            );
        }
        if (m.key === "command") {
            if (currentCommand === null) currentCommand = normTomlValue(m.value);
        } else {
            if (currentArgs === null) currentArgs = normTomlValue(m.value);
        }
        if (!(m.key in comments)) comments[m.key] = comment;
    }
    if (currentCommand === normTomlValue(JSON.stringify(cmd)) && currentArgs === normTomlValue(JSON.stringify(args))) {
        return existingContent;
    }

    const body = [`${expectedCommand}${comments.command ?? ""}`, `${expectedArgs}${comments.args ?? ""}`];
    const out = lines.slice(0, header + 1);
    let inserted = false;
    for (let i = header + 1; i < childrenEnd; i++) {
        const [code] = splitTomlComment(lines[i]);
        if (TOML_MANAGED_KEY.test(code)) {
            if (!inserted) {
                out.push(...body);
                inserted = true;
            }
            continue;
        }
        out.push(lines[i]);
    }
    if (!inserted) out.push(...body);
    out.push(...lines.slice(childrenEnd, end));
    out.push(...lines.slice(end));
    return out.join("\n");
}

/**
 * Merges a managed `superpowers` server entry over an existing one, preserving
 * user-authored fields. Shared by the flat-root and nested-path JSON writers
 * so both keep env/disabled/enabled semantics identical.
 */
function mergeServerEntry(
    existing: unknown,
    desired: Record<string, unknown>,
    formatType: JsonFormatType
): Record<string, unknown> {
    if (!isPlainObject(existing)) return desired;
    const merged: Record<string, unknown> = { ...existing, ...desired };

    // enabled 只是預設值：使用者已明示啟用狀態時不得覆寫，
    // 否則會出現 `disabled: true` 與 `enabled: true` 並存的矛盾設定。
    if (existing["enabled"] !== undefined || existing["disabled"] !== undefined) {
        if (existing["enabled"] !== undefined) {
            merged["enabled"] = existing["enabled"];
        } else {
            delete merged["enabled"];
        }
    }

    // json-mcp 形式把參數收進 command 陣列，殘留的 args 會與之矛盾。
    if (formatType === "json-mcp" && Array.isArray(merged["command"])) {
        delete merged["args"];
    }
    return merged;
}

/**
 * Updates a JSON MCP configuration file with JSONC tolerance and strict plain object verification.
 */
export function updateJsonConfig(
    existingContent: string,
    formatType: JsonFormatType,
    cmd: string,
    args: string[],
    remove = false,
    customConfig?: Record<string, unknown>,
    serverPath?: string[]
): string {
    let json: Record<string, unknown> = {};
    let hadJsoncSyntax = false;
    // U+FEFF is not JSON whitespace, so JSON.parse rejects a BOM-prefixed file and
    // Windows editors write them routinely. U+FEFF *is* trimmed by String#trim, so
    // the runSetup up-to-date comparison below is unaffected by dropping it.
    if (existingContent.charCodeAt(0) === 0xfeff) {
        existingContent = existingContent.slice(1);
    }
    let parsedSnapshot: string | null = null;
    if (existingContent && existingContent.trim() !== "") {
        try {
            // First attempt standard native JSON.parse to preserve string literals containing '//'
            const parsed = JSON.parse(existingContent);
            if (!isPlainObject(parsed)) throw new Error("Existing JSON root must be an object");
            json = parsed;
        } catch (_nativeErr: unknown) {
            // If standard parse fails, fallback to JSONC comment and trailing comma stripping
            try {
                const sanitized = stripJsonComments(existingContent, true);
                const parsed = JSON.parse(sanitized);
                if (!isPlainObject(parsed)) throw new Error("Existing JSON root must be an object");
                json = parsed;
                // Native parse failed but the sanitized parse succeeded: the file used
                // JSONC-only syntax (comments / trailing commas) that the rewrite drops.
                hadJsoncSyntax = sanitized !== existingContent;
            } catch (e: unknown) {
                const err = e instanceof Error ? e.message : String(e);
                // Prefer the sanitized position for the actionable error but keep the raw
                // JSON.parse message so the user can locate the problem in their real file.
                const native = _nativeErr instanceof Error ? _nativeErr.message : String(_nativeErr);
                throw new Error(`Failed to parse existing JSON: ${err} (raw JSON error: ${native})`);
            }
        }
        parsedSnapshot = JSON.stringify(json);
    }

    const conventionalRootKey =
        formatType === "json-servers" ? "servers" : formatType === "json-mcp" ? "mcp" : "mcpServers";

    // Explicit container path (e.g. OpenClaw ["mcp", "servers"]): discovery,
    // creation, and removal stay inside it and never touch sibling subtrees.
    // JSON5 inputs (comments, trailing commas) ride the same JSONC fallback as
    // above; anything beyond that (single quotes, unquoted keys) fails closed
    // with a parse error instead of risking corruption.
    if (serverPath && serverPath.length > 0) {
        const dotted = serverPath.join(".");
        // Prototype-pollution guard (CWE-915, CodeQL js/prototype-polluting-assignment):
        // serverPath is library input, so a "__proto__"/"constructor"/"prototype"
        // segment would turn `container[segment]` into Object.prototype and let the
        // later `container["superpowers"]` write mutate the global prototype.
        // Fail closed before any computed property access. The literal "__proto__"
        // comparisons are intentional: CodeQL recognizes them as sanitizers.
        for (const segment of serverPath) {
            if (typeof segment !== "string" || segment.length === 0) {
                throw new Error(`Invalid JSON field "${dotted}"`);
            }
            if (segment === "__proto__" || segment === "constructor" || segment === "prototype") {
                throw new Error(`Refusing to use unsafe JSON field "${dotted}"`);
            }
            if (!/^[A-Za-z0-9_-]+$/.test(segment)) {
                throw new Error(`Invalid JSON field "${dotted}"`);
            }
        }
        let container: Record<string, unknown> = json;
        for (const segment of serverPath) {
            // Re-assert the literal guard at the use site so the sanitizer dominates
            // the computed property access for static analysis.
            if (segment === "__proto__" || segment === "constructor" || segment === "prototype") {
                throw new Error(`Refusing to use unsafe JSON field "${dotted}"`);
            }
            const next = container[segment];
            if (next === undefined) {
                if (remove) return existingContent;
                container[segment] = {};
            } else if (!isPlainObject(next)) {
                throw new Error(`Existing JSON field "${dotted}" must be an object`);
            }
            container = container[segment] as Record<string, unknown>;
        }
        if (remove) {
            const had = container["superpowers"] !== undefined;
            delete container["superpowers"];
            if (!had) return existingContent;
        } else {
            const desired = customConfig ? { ...customConfig } : { command: cmd, args: args };
            container["superpowers"] = mergeServerEntry(container["superpowers"], desired, formatType);
        }
    const updatedNested = JSON.stringify(json, null, 2) + "\n";
    if (parsedSnapshot !== null && JSON.stringify(json) === parsedSnapshot) {
        return existingContent;
    }
    if (hadJsoncSyntax && updatedNested !== existingContent) {
            process.stderr.write(
                "[superpowers-mcp] Warning: JSONC comments/trailing commas in the existing config were removed while updating it (the file is rewritten as plain JSON).\n"
            );
        }
        return updatedNested;
    }

    // 先尋找任何已經存放 superpowers 條目的 root key。舊行為只在「慣用」key 不存在
    // 時直接新建一個空物件，因此當設定檔其實使用另一個等效 key（例如 VS Code 的
    // servers 對上 mcpServers、Kilo 的 mcp 對上 mcpServers）時，會寫入第二份互相
    // 衝突的 superpowers 設定，而 --remove 也刪不掉原本那一份。
    const rootKey =
        JSON_SERVER_ROOT_KEYS.find(
            (key) => isPlainObject(json[key]) && (json[key] as Record<string, unknown>)["superpowers"] !== undefined
        ) ?? conventionalRootKey;

    if (json[rootKey] !== undefined && !isPlainObject(json[rootKey])) {
        throw new Error(`Existing JSON field "${rootKey}" must be an object`);
    }
    if (json[rootKey] === undefined) {
        json[rootKey] = {};
    }

    const targetServers = json[rootKey] as Record<string, unknown>;

    if (remove) {
        const had = targetServers["superpowers"] !== undefined;
        delete targetServers["superpowers"];
        if (!had) return existingContent;
    } else {
        let desired: Record<string, unknown>;
        if (customConfig) {
            desired = { ...customConfig };
        } else if (formatType === "json-servers") {
            desired = {
                command: cmd,
                args: args,
                type: "stdio",
            };
        } else if (formatType === "json-mcp") {
            desired = {
                type: "local",
                command: [cmd, ...args],
                enabled: true,
            };
        } else {
            desired = {
                command: cmd,
                args: args,
            };
        }

        // 與既有條目合併，保留使用者自行加入的欄位（env、envFile、disabled、
        // alwaysAllow、cwd 等）。舊行為以整塊覆蓋，重跑 setup 會直接刪掉這些設定。
        targetServers["superpowers"] = mergeServerEntry(targetServers["superpowers"], desired, formatType);
    }

    const updated = JSON.stringify(json, null, 2) + "\n";
    if (parsedSnapshot !== null && JSON.stringify(json) === parsedSnapshot) {
        return existingContent;
    }
    if (hadJsoncSyntax && updated !== existingContent) {
        process.stderr.write(
            "[superpowers-mcp] Warning: JSONC comments/trailing commas in the existing config were removed while updating it (the file is rewritten as plain JSON).\n"
        );
    }
    return updated;
}

/**
 * Prunes timestamped backups (`<file>.<epoch-ms>.bak`) created by safeWriteConfig,
 * keeping only the most recent `keep` entries so repeated `--backup` runs cannot
 * grow the config directory without bound. Cleanup is strictly best-effort: a
 * listing or unlink failure must never abort the config write that triggered it.
 */
function pruneOldBackups(targetFilePath: string, keep = 10): void {
    try {
        const dir = path.dirname(targetFilePath);
        const prefix = `${path.basename(targetFilePath)}.`;
        const suffix = ".bak";
        const backups = fs
            .readdirSync(dir)
            .filter((name) => {
                if (!name.startsWith(prefix) || !name.endsWith(suffix)) return false;
                const middle = name.slice(prefix.length, name.length - suffix.length);
                return /^\d+$/.test(middle);
            })
            .map((name) => {
                const full = path.join(dir, name);
                try {
                    return { full, mtimeMs: fs.statSync(full).mtimeMs };
                } catch {
                    return { full, mtimeMs: 0 };
                }
            })
            .sort((a, b) => b.mtimeMs - a.mtimeMs);
        for (const stale of backups.slice(keep)) {
            try {
                fs.unlinkSync(stale.full);
            } catch {
                // Best-effort: skip files we cannot remove (permissions, races).
            }
        }
    } catch {
        // Never fail the surrounding config write because cleanup was impossible.
    }
}

/**
 * Performs an atomic, conflict-detecting write within explicit allowed roots.
 * Final-file symlinks are preserved when their canonical target stays in-bounds.
 */
export function safeWriteConfig(
    configPath: string,
    newContent: string,
    backup = false,
    allowedRoots: string[] = [],
    expectedContent?: string | null
): void {
    if (allowedRoots.length === 0) {
        throw new Error("safeWriteConfig requires at least one allowed destination root");
    }
    let targetFilePath = configPath;
    let sawSymlink = false;
    try {
        const stat = fs.lstatSync(configPath, { throwIfNoEntry: false });
        if (stat && stat.isSymbolicLink()) {
            sawSymlink = true;
            try {
                targetFilePath = fs.realpathSync(configPath);
            } catch (_err) {
                // If symlink target does not exist yet (dangling symlink), resolve relative to symlink dirname
                const linkTarget = fs.readlinkSync(configPath);
                targetFilePath = path.resolve(path.dirname(configPath), linkTarget);
            }
            const normalizedTarget = path.normalize(path.resolve(targetFilePath)).toLowerCase();
            const tempDir = path.normalize(path.resolve(os.tmpdir())).toLowerCase();
            const isInsideTemp = normalizedTarget === tempDir || normalizedTarget.startsWith(tempDir + path.sep);
            const unsafePrefixes = [
                "/etc", "/bin", "/sbin", "/usr", "/root", "/sys", "/proc", "/dev",
                "/private/etc",
                "c:\\windows"
            ];
            if (!isInsideTemp && (
                unsafePrefixes.some((p) => normalizedTarget === p || normalizedTarget.startsWith(p + path.sep)) ||
                normalizedTarget === "/var" || (normalizedTarget.startsWith("/var" + path.sep) && !normalizedTarget.startsWith("/var/folders" + path.sep)) ||
                normalizedTarget === "/private/var" || (normalizedTarget.startsWith("/private/var" + path.sep) && !normalizedTarget.startsWith("/private/var/folders" + path.sep))
            )) {
                throw new Error(`Refusing to write to unsafe symlink target: ${targetFilePath}`);
            }
        }
    } catch (_lstatErr) {
        if (_lstatErr instanceof Error && _lstatErr.message.includes("Refusing to write to unsafe symlink target")) {
            throw _lstatErr;
        }
        if (sawSymlink) {
            // Falling back to configPath here would make renameSync replace the
            // user's symlink with a regular file, silently destroying it.
            const msg = _lstatErr instanceof Error ? _lstatErr.message : String(_lstatErr);
            throw new Error(`Cannot safely resolve symlink target for ${configPath}: ${msg}`);
        }
        // Fall back to original configPath if stat fails
    }

    const configDir = path.dirname(targetFilePath);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
    }

    const canonicalDir = fs.realpathSync(configDir);
    const canonicalDirStat = fs.statSync(canonicalDir);
    targetFilePath = path.join(canonicalDir, path.basename(targetFilePath));
    const canonicalTarget = path.normalize(path.resolve(targetFilePath)).toLowerCase();
    const canonicalTempDir = path.normalize(path.resolve(os.tmpdir())).toLowerCase();
    const insideTemp = canonicalTarget === canonicalTempDir || canonicalTarget.startsWith(canonicalTempDir + path.sep);
    const protectedPrefixes = [
        "/etc", "/bin", "/sbin", "/usr", "/root", "/sys", "/proc", "/dev", "/private/etc", "c:\\windows"
    ];
    const protectedTarget = protectedPrefixes.some(
        (prefix) => canonicalTarget === prefix || canonicalTarget.startsWith(prefix + path.sep)
    ) || canonicalTarget === "/var" ||
        (canonicalTarget.startsWith("/var" + path.sep) && !canonicalTarget.startsWith("/var/folders" + path.sep)) ||
        canonicalTarget === "/private/var" ||
        (canonicalTarget.startsWith("/private/var" + path.sep) && !canonicalTarget.startsWith("/private/var/folders" + path.sep));
    if (!insideTemp && protectedTarget) {
        throw new Error(`Refusing to write to unsafe configuration target: ${targetFilePath}`);
    }
    const insideAllowedRoot = allowedRoots.some((rootPath) => {
        if (!rootPath) return false;
        let canonicalRoot = path.resolve(rootPath);
        try { canonicalRoot = fs.realpathSync(canonicalRoot); } catch (_rootErr) { /* lexical fallback */ }
        const relative = path.relative(canonicalRoot, targetFilePath);
        return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
    });
    if (!insideAllowedRoot) {
        throw new Error(`Refusing to write configuration outside allowed roots: ${targetFilePath}`);
    }

    let fileMode = 0o600;
    const targetExists = fs.existsSync(targetFilePath);
    if (targetExists) {
        try {
            fileMode = fs.statSync(targetFilePath).mode;
        } catch (_statErr) {
            // Keep default fileMode 0o600
        }
    }

    // Atomic write via temp file in target directory using cryptographically random suffix & wx flag
    const randomSuffix = crypto.randomBytes(8).toString("hex");
    const tmpPath = path.join(canonicalDir, `.tmp.${path.basename(targetFilePath)}.${process.pid}.${randomSuffix}`);
    try {
        fs.writeFileSync(tmpPath, newContent, { encoding: "utf8", mode: fileMode, flag: "wx" });
        const currentExists = fs.existsSync(targetFilePath);
        if (expectedContent === null && currentExists) {
            throw new Error("Configuration changed concurrently before it could be created");
        }
        if (expectedContent !== undefined && expectedContent !== null) {
            if (!currentExists || fs.readFileSync(targetFilePath, "utf8") !== expectedContent) {
                throw new Error("Configuration changed concurrently; refusing to overwrite newer content");
            }
        }
        const confirmedDir = fs.realpathSync(configDir);
        const confirmedDirStat = fs.statSync(confirmedDir);
        if (
            confirmedDir !== canonicalDir ||
            confirmedDirStat.dev !== canonicalDirStat.dev ||
            confirmedDirStat.ino !== canonicalDirStat.ino
        ) {
            throw new Error("Configuration directory changed while writing");
        }
        // Backed up only once every check has passed, so a refused write neither
        // leaves a .bak behind nor prunes the existing backup history.
        if (backup && targetExists) {
            const original = fs.readFileSync(targetFilePath, "utf8");
            const backupPath = `${targetFilePath}.${Date.now()}.bak`;
            try {
                fs.writeFileSync(backupPath, original, { encoding: "utf8", mode: fileMode });
            } catch (bakErr: unknown) {
                const msg = bakErr instanceof Error ? bakErr.message : String(bakErr);
                throw new Error(`Failed to create safe backup before write: ${msg}`);
            }
            pruneOldBackups(targetFilePath);
        }
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
                newContent = updateYamlConfig(originalContent, cmd, args, isRemove, harness.yamlProfile);
            } else if (harness.type === "toml") {
                newContent = updateTomlConfig(originalContent, cmd, args, isRemove);
            } else {
                const serverConfig = typeof harness.defaultConfig === "function" ? harness.defaultConfig(cmd, args) : undefined;
                newContent = updateJsonConfig(originalContent, harness.type, cmd, args, isRemove, serverConfig, harness.serverPath);
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
                safeWriteConfig(
                    configPath,
                    newContent,
                    !!options.backup,
                    [homeDir, appData || "", localAppData || ""],
                    fileExists ? originalContent : null
                );
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
    let printConfig = false;
    const options: SetupOptions = {
        dryRun: false,
        remove: false,
        bun: false,
        backup: false,
        target: null,
    };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === "setup" || arg === "install" || arg === "--setup") {
            continue;
        } else if (arg === "--print-config") {
            printConfig = true;
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
                process.exitCode = 1;
                return;
            }
            if (options.target !== null) {
                console.error("❌ Error: --target was specified more than once. Configure one client per invocation.\n");
                process.exitCode = 1;
                return;
            }
            options.target = argv[++i];
        } else if (arg.startsWith("--target=")) {
            const val = arg.split("=")[1];
            if (!val) {
                console.error("❌ Error: Missing value for --target flag.\n");
                process.exitCode = 1;
                return;
            }
            if (options.target !== null) {
                console.error("❌ Error: --target was specified more than once. Configure one client per invocation.\n");
                process.exitCode = 1;
                return;
            }
            options.target = val;
        } else if (arg === "--help" || arg === "-h") {
            printHelp();
            return;
        } else if (arg.startsWith("-")) {
            console.error(`❌ Error: Unknown option "${arg}". Use --help for usage.\n`);
            process.exitCode = 1;
            return;
        } else if (!options.target) {
            options.target = arg;
        } else {
            // 舊行為會靜默忽略多餘的位置參數，例如 `setup copilot cursor`
            // 只會設定 copilot，cursor 被無聲丟棄。
            console.error(`❌ Error: Unexpected argument "${arg}". Use --help for usage.\n`);
            process.exitCode = 1;
            return;
        }
    }

    if (printConfig) {
        if (options.target || options.remove || options.backup || options.dryRun) {
            console.error("--print-config supports only --bun; omit target and file-operation flags.");
            process.exitCode = 1;
            return;
        }
        console.log(JSON.stringify({ mcpServers: { superpowers: {
            command: options.bun ? "bunx" : "npx",
            args: ["-y", "superpowers-mcp"],
        } } }, null, 2));
        return;
    }

    console.log("\n========================================================");
    console.log("⚡ Superpowers MCP - Targeted Client Setup");
    console.log("========================================================\n");

    if (!options.target) {
        console.log("Please select which AI Agent client you would like to configure:\n");
        console.log("  npx -y superpowers-mcp setup --target lmstudio   # LM Studio (~/.lmstudio/mcp.json)");
        console.log("  npx -y superpowers-mcp setup --target roo        # Roo Code in VS Code Desktop");
        console.log("  npx -y superpowers-mcp setup --print-config      # JSON for desktop app import");
        console.log("  npx -y superpowers-mcp setup --target antigravity # Antigravity (~/.gemini/config/mcp_config.json)");
        console.log("  npx -y superpowers-mcp setup --target pi-desktop  # Pi Desktop / Pi Agent (~/.pi/agent/mcp.json)");
        console.log("  npx -y superpowers-mcp setup --target cursor     # Cursor (~/.cursor/mcp.json)");
        console.log("  npx -y superpowers-mcp setup --target copilot    # GitHub Copilot (VS Code mcp.json)");
        console.log("  npx -y superpowers-mcp setup --target copilot-insiders # GitHub Copilot (VS Code Insiders mcp.json)");
        console.log("  npx -y superpowers-mcp setup --target hermes     # Hermes Desktop / Agent");
        console.log("  npx -y superpowers-mcp setup --target kimi       # Kimi Work / Kimi Code");
        console.log("  npx -y superpowers-mcp setup --target claude     # Claude Desktop");
        console.log("  npx -y superpowers-mcp setup --target devin      # Devin Desktop (formerly Windsurf)");
        console.log("  npx -y superpowers-mcp setup --target qwenpaw    # QwenPaw / CoPaw (~/.qwenpaw/config.json)");
        console.log("  npx -y superpowers-mcp setup --target cline      # Cline (~/.../cline_mcp_settings.json)");
        console.log("  npx -y superpowers-mcp setup --target kilo       # Kilo Code (~/.config/kilo/kilo.jsonc)");
        console.log("  npx -y superpowers-mcp setup --target qoder      # Qoder (~/.qoder/settings.json)");
        console.log("  npx -y superpowers-mcp setup --target kiro       # Kiro (~/.kiro/settings/mcp.json)");
        console.log("  npx -y superpowers-mcp setup --target trae       # Trae (~/.../Trae/User/mcp.json)");
        console.log("  npx -y superpowers-mcp setup --target codex      # Codex (~/.codex/config.toml)");
        console.log("  npx -y superpowers-mcp setup --target openclaw   # OpenClaw (~/.openclaw/openclaw.json)");
        console.log("  npx -y superpowers-mcp setup --target goose      # Goose (~/.config/goose/config.yaml)\n");
        console.log("💡 Tip:");
        console.log("   You can run this setup command from ANY folder on your system.");
        console.log("   It automatically targets your global config files (~/...) without needing to clone this repo.\n");
        console.log("💡 Privacy & Safety:");
        console.log("   Superpowers MCP only configures the specific client you explicitly choose.");
        console.log("   It will NEVER silently scan or modify unselected environments.\n");
        // --target 是必填參數：缺少時是使用錯誤，應以非零離開碼結束，
        // 否則 shell 腳本與 CI 會誤判為設定成功。
        process.exitCode = 1;
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
            // 使用 exitCode 而非 process.exit()：串接管道（例如 npx ... setup | tail）
            // 時 stdout/stderr 是非同步寫入，process.exit() 會截斷尚未送出的輸出。
            process.exitCode = 1;
            return;
        }

        console.log(`🎉 Setup complete! ${successCount} environment(s) ready.`);
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`❌ Setup failed: ${msg}\n`);
        process.exitCode = 1;
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
                        copilot (vscode), copilot-insiders (vscode-insiders, code-insiders, insiders),
                        hermes, kimi, claude, devin (windsurf),
                        qwenpaw (qwen-paw, copaw), cline (claude-dev), kilo (kilocode),
                        qoder, kiro (kiro-code), trae, lmstudio (lm-studio), roo (roo-code, roocode),
                        codex, openclaw (open-claw), goose
  --print-config        Print importable mcpServers JSON without writing files (optional --bun)
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
  npx -y superpowers-mcp setup --target copilot-insiders # Configure GitHub Copilot (VS Code Insiders) only
  npx -y superpowers-mcp setup --target hermes      # Configure Hermes Desktop only
  npx -y superpowers-mcp setup --target kimi        # Configure Kimi Work only
  npx -y superpowers-mcp setup --target claude      # Configure Claude Desktop only
  npx -y superpowers-mcp setup --target devin       # Configure Devin Desktop (Windsurf) only
  npx -y superpowers-mcp setup --target qwenpaw     # Configure QwenPaw only
  npx -y superpowers-mcp setup --target cline       # Configure Cline only
  npx -y superpowers-mcp setup --target kilo        # Configure Kilo Code only
  npx -y superpowers-mcp setup --target qoder       # Configure Qoder only
  npx -y superpowers-mcp setup --target kiro        # Configure Kiro only
  npx -y superpowers-mcp setup --target trae        # Configure Trae only
  npx -y superpowers-mcp setup --target codex       # Configure Codex only
  npx -y superpowers-mcp setup --target openclaw    # Configure OpenClaw only
  npx -y superpowers-mcp setup --target goose       # Configure Goose only

Any Directory:
  You can run this command from ANY directory on your machine.
  It automatically resolves global configuration paths based on your user home folder.

Privacy & Safety:
  Superpowers MCP only touches the client you explicitly choose.
  It never bulk-modifies your environment without your consent.
`);
}
