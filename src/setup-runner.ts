/**
 * Superpowers MCP - Universal Global Setup & Configuration Engine
 * Supports: macOS, Windows, Linux
 * Targets: GitHub Copilot (VS Code / VS Code Insiders), Cursor, Hermes Desktop, Kimi Work,
 *          Claude Desktop, Devin Desktop, Antigravity, Pi Desktop, QwenPaw, Cline,
 *          Kilo Code, Qoder, Kiro, Trae, LM Studio, Roo Code (VS Code Desktop)
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
    type: JsonFormatType | "yaml";
    defaultConfig: (cmd: string, args: string[]) => Record<string, unknown>;
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
export function updateYamlConfig(existingContent: string, cmd: string, args: string[], remove = false): string {
    const lines = existingContent ? existingContent.split(/\r?\n/) : [];
    const mcpDeclarations = lines
        // Match the key with a single unambiguous pattern, then trim the remainder with
        // String#trim: the previous `\s*(.*?)\s*$` tail backtracks polynomially on input
        // padded with long whitespace runs (CodeQL js/polynomial-redos).
        .map((line, index) => {
            const match = line.match(/^(\s*)mcp_servers:/);
            if (!match) return null;
            return { index, indent: match[1], tail: line.slice(match[0].length).trim() };
        })
        .filter((entry) => entry !== null);

    // Only root-level (column-0) mcp_servers mappings are the ones this updater
    // manages. A nested mcp_servers under another key must not count as a duplicate
    // (it belongs to a different parent) nor be mistaken for the root mapping.
    const rootDecls = mcpDeclarations.filter((entry) => entry.indent === "");

    if (rootDecls.length > 1) {
        throw new Error("Cannot safely update YAML with duplicate mcp_servers keys");
    }
    if (rootDecls.length === 1) {
        const declaration = rootDecls[0];
        if (declaration.tail !== "" && !declaration.tail.startsWith("#")) {
            throw new Error("Cannot safely update YAML unless mcp_servers is a root-level block mapping");
        }
    } else if (mcpDeclarations.length > 0) {
        // mcp_servers exists but only nested under another key — there is no root
        // mapping to update, and we must not inject into the nested one.
        throw new Error("Cannot safely update YAML unless mcp_servers is a root-level block mapping");
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
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const mcpMatch = line.match(/^(\s*)mcp_servers:\s*(?:#.*)?$/);
            if (mcpMatch) {
                inMcpServers = true;
                mcpIndent = mcpMatch[1].length;
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
                    const spMatch = line.match(/^(\s*)superpowers:\s*(?:#.*)?$/);
                    if (spMatch && spMatch[1] === indent) {
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

    const mcpServersIndex = rootDecls.length === 1 ? rootDecls[0].index : -1;
    if (mcpServersIndex === -1) {
        return `${existingContent.trimEnd()}\n\nmcp_servers:\n${superpowersBlock.join("\n")}\n`;
    }

    let superpowersIndex = -1;
    for (let i = mcpServersIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (/^[^\s#]/.test(line)) {
            break;
        }
        const leadingWhitespace = line.match(/^(\s*)/)?.[1] || "";
        if (leadingWhitespace === indent && /^\s+["']?superpowers["']?\s*:\s*(?:#.*)?$/.test(line)) {
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
        for (let i = superpowersIndex + 1; i < endIndex; i++) {
            const line = lines[i];
            if (line.trim() === "") continue;
            const childIndent = line.match(/^(\s*)/)?.[1].length ?? 0;
            if (skipIndent !== -1 && childIndent > skipIndent) {
                // 被移除欄位的巢狀子行（例如 command 底下的映射）一併移除
                continue;
            }
            skipIndent = -1;
            if (childIndent > spIndent && /^\s*["']?(?:command|args)["']?\s*:/.test(line)) {
                skipIndent = childIndent;
                continue;
            }
            keptChildren.push(line);
        }

        // 保留使用者在此條目下自行加入的欄位（env、type、disabled、cwd…），
        // 只重寫由我們負責管理的 command / args。舊行為整塊置換，重跑 setup
        // 會讓使用者的 env 等設定無聲消失。
        superpowersBlock[0] += extractInlineComment(lines[superpowersIndex]);
        lines.splice(superpowersIndex, endIndex - superpowersIndex, ...superpowersBlock, ...keptChildren);
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
    remove = false,
    customConfig?: Record<string, unknown>
): string {
    let json: Record<string, unknown> = {};
    let hadJsoncSyntax = false;
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
    }

    const conventionalRootKey =
        formatType === "json-servers" ? "servers" : formatType === "json-mcp" ? "mcp" : "mcpServers";

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
        delete targetServers["superpowers"];
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
        const existing = targetServers["superpowers"];
        if (!isPlainObject(existing)) {
            targetServers["superpowers"] = desired;
        } else {
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

            targetServers["superpowers"] = merged;
        }
    }

    const updated = JSON.stringify(json, null, 2) + "\n";
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
            pruneOldBackups(targetFilePath);
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
                const serverConfig = typeof harness.defaultConfig === "function" ? harness.defaultConfig(cmd, args) : undefined;
                newContent = updateJsonConfig(originalContent, harness.type, cmd, args, isRemove, serverConfig);
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
            options.target = argv[++i];
        } else if (arg.startsWith("--target=")) {
            const val = arg.split("=")[1];
            if (!val) {
                console.error("❌ Error: Missing value for --target flag.\n");
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
        console.log("  npx -y superpowers-mcp setup --target trae       # Trae (~/.../Trae/User/mcp.json)\n");
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
                        qoder, kiro (kiro-code), trae, lmstudio (lm-studio), roo (roo-code, roocode)
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

Any Directory:
  You can run this command from ANY directory on your machine.
  It automatically resolves global configuration paths based on your user home folder.

Privacy & Safety:
  Superpowers MCP only touches the client you explicitly choose.
  It never bulk-modifies your environment without your consent.
`);
}
