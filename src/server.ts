import * as path from "path";
import * as fs from "fs";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
    ListPromptsRequestSchema,
    GetPromptRequestSchema,
    ListToolsRequestSchema,
    CallToolRequestSchema,
    ErrorCode,
    McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { SkillsManager } from "./skills-manager.js";
import { runSetupCli } from "./setup-runner.js";
import {
    FEATURE_PIPELINE,
    STRUCTURED_DEBUG_PIPELINE,
    fencedDataBlock,
    renderFeaturePipeline,
    renderStructuredDebug,
} from "./pipelines.js";

// ---------------------------------------------------------------------------
// Paths & Environment Protection
// ---------------------------------------------------------------------------

function getSafeSkillsPath(): string {
    const envPath = process.env.SKILLS_PATH;
    if (envPath) {
        const resolved = path.resolve(envPath);
        let canonical = resolved;
        let canonicalized = true;
        try {
            canonical = fs.realpathSync(resolved);
        } catch (_realpathErr: unknown) {
            canonicalized = false;
        }
        const foldCase = (value: string): string =>
            process.platform === "darwin" || process.platform === "win32" ? value.toLowerCase() : value;
        const normalized = foldCase(path.normalize(canonical));
        const root = foldCase(path.parse(canonical).root);

        // Block well-known system locations: a malicious or misconfigured home
        // directory must not redirect skill loading or caching into OS paths.
        // Strip Win32 extended-path (`\\?\C:\...`) and device (`\\.\...`)
        // prefixes before matching: they address the same locations with a
        // different spelling.
        let matchPath = normalized;
        let uncPath = false;
        if (process.platform === "win32") {
            matchPath = matchPath.replace(/^\\\\\?\\/, "").replace(/^\\\\\.\\/, "");
            // A `\\server\share` UNC path is a remote filesystem, never a
            // safe local skills home.
            uncPath = matchPath.startsWith("\\\\");
        }

        const unsafePrefixes = [
            "/etc", "/var", "/bin", "/sbin", "/usr", "/root", "/sys", "/proc", "/dev", "/tmp",
            "/var/tmp", "/dev/shm",
            "/private/etc", "/private/var", "/private/tmp",
            "c:\\windows", "c:\\program files", "c:\\program files (x86)"
        ];
        // "Program Files"/"Windows" live on whatever drive Windows is installed
        // on, not necessarily C: — match them on any drive letter.
        const windowsSystemDirPattern = /^[a-z]:\\(windows|program files|program files \(x86\))($|\\)/;

        // macOS 的標準暫存目錄位於 /private/var/folders（也就是被封鎖的 /var 子樹）。
        // 該目錄是每位使用者專屬、權限 0700 的拋棄式空間，把它計入 SKILLS_PATH 的
        // 合理位置；否則 `SKILLS_PATH=$(mktemp -d)` 會靜默退回預設技能目錄。
        // /var 底下的其他路徑（以及整個 /private/var）仍然維持封鎖。
        // 刻意使用寫死的 macOS 暫存前綴，不信任執行期 os.tmpdir() 的回傳值——
        // 它的值可被 TMPDIR 環境變數操控，攻擊者能藉此把任意目錄洗白。
        // Linux 的 /tmp 維持封鎖（見上面的 unsafePrefixes）。
        // canonical 已做過 realpath 解析，因此 /var/folders（指向 /private/var/folders
        // 的符號連結）與直接寫 /private/var/folders 都會命中。
        const macTempPrefixes = ["/private/var/folders", "/var/folders"].map((p) =>
            foldCase(path.normalize(p))
        );
        const isUnderTempRoot = macTempPrefixes.some(
            (prefix) => normalized === prefix || normalized.startsWith(prefix + path.sep)
        );

        const isUnsafe =
            !isUnderTempRoot &&
            (!canonicalized ||
                uncPath ||
                normalized === root ||
                windowsSystemDirPattern.test(matchPath) ||
                unsafePrefixes.some(
                    (p) => {
                        const prefix = foldCase(path.normalize(p));
                        return matchPath === prefix || matchPath.startsWith(prefix + path.sep);
                    }
                ));

        if (isUnsafe) {
            process.stderr.write(`Warning: Potentially unsafe SKILLS_PATH: "${envPath}". Fallback to default.\n`);
        } else {
            return canonical;
        }
    }

    const defaultPath = path.join(__dirname, "..", "skills");
    return fs.existsSync(defaultPath) ? defaultPath : path.join(__dirname, "skills");
}

const SKILLS_PATH = getSafeSkillsPath();

function writeStartupTrustNotices(skillsPath: string): void {
    process.stderr.write(
        "[superpowers-mcp] Trust: stdio MCP has no application-level auth; any process that can spawn this server can use all tools and read all skills.\n"
    );
    const envPath = process.env.SKILLS_PATH;
    if (!envPath) {
        return;
    }
    let resolvedEnv = path.resolve(envPath);
    try {
        resolvedEnv = fs.realpathSync(resolvedEnv);
    } catch (_realpathErr: unknown) {
        return;
    }
    if (path.resolve(skillsPath) !== path.resolve(resolvedEnv)) {
        return;
    }
    process.stderr.write(
        `[superpowers-mcp] Trust: SKILLS_PATH is set; all SKILL.md under that directory are treated as trusted agent instructions.\n`
    );
}

const skillsManager = new SkillsManager(SKILLS_PATH);
const COMPOSITIONS_GUIDE_URI = "guide://superpowers/skill-compositions";
const COMPOSITIONS_GUIDE_PATH = path.join(__dirname, "..", "docs", "skill-compositions.md");
// Static bundled docs file — cached with its mtime so edits are picked up
// without a server restart.
let compositionsGuideCache: string | null = null;
let compositionsGuideMtimeMs = 0;
let compositionsGuideSize = 0;

// 回傳給客戶端的文字上限：單一巨大技能檔不該撐爆 list_skills 或 session-start。
const MAX_LIST_SKILLS_CHARS = 20000;
const MAX_INLINE_SKILL_CHARS = 20000;
// 單一技能描述上限：避免一個巨大描述耗盡整個 list_skills 預算，排擠掉其他技能。
const MAX_SKILL_ENTRY_CHARS = 500;

function normalizeSkillName(value: string): string {
    return value.trim().replace(/^superpowers:/i, "");
}

/** Caps skill body size for tool/resource responses (same budget as session-start). */
function truncateSkillBodyForClient(body: string): string {
    if (body.length <= MAX_INLINE_SKILL_CHARS) {
        return body;
    }
    return (
        body.slice(0, MAX_INLINE_SKILL_CHARS) +
        `\n\n...[skill content truncated (${body.length - MAX_INLINE_SKILL_CHARS} more characters not shown)]`
    );
}

/**
 * Rejects a skill name that could address something other than a scanned skill
 * directory. Shared by the resource reader and the read_skill tool so both
 * surfaces accept and refuse exactly the same names.
 */
function isSkillsRootChangedError(err: unknown): boolean {
    return Boolean(err && typeof err === "object" && (err as { code?: string }).code === "EROOTCHANGED");
}

const SKILLS_ROOT_CHANGED_MESSAGE = "Skills directory path was replaced; restart the MCP server.";

function rethrowIfSkillsRootChanged(err: unknown): void {
    if (isSkillsRootChangedError(err)) {
        throw new McpError(ErrorCode.InternalError, SKILLS_ROOT_CHANGED_MESSAGE);
    }
}

async function listSkillsForClient() {
    try {
        return await skillsManager.listSkills();
    } catch (err: unknown) {
        rethrowIfSkillsRootChanged(err);
        throw err;
    }
}

async function findSkillForClient(skillName: string) {
    try {
        return await skillsManager.findSkill(skillName);
    } catch (err: unknown) {
        rethrowIfSkillsRootChanged(err);
        throw err;
    }
}

async function readSkillContentForClient(skillPath: string) {
    try {
        return await skillsManager.readSkillContent(skillPath);
    } catch (err: unknown) {
        rethrowIfSkillsRootChanged(err);
        throw err;
    }
}

function isUnsafeSkillName(name: string): boolean {
    return (
        name === "" ||
        name === "." ||
        name === ".." ||
        name.includes("/") ||
        name.includes("\\") ||
        name.includes("\0")
    );
}

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

// Replaced at bundle time by esbuild (see esbuild.js) with the version from
// package.json. The typeof guard keeps un-bundled execution (ts-node, direct src
// imports in tests) working instead of throwing a ReferenceError.
declare const __SUPERPOWERS_MCP_VERSION__: string;

const SERVER_VERSION =
    typeof __SUPERPOWERS_MCP_VERSION__ === "string" ? __SUPERPOWERS_MCP_VERSION__ : "0.0.0-unbundled";

const server = new Server(
    {
        name: "superpowers-mcp",
        version: SERVER_VERSION,
    },
    {
        capabilities: {
            resources: { subscribe: false },
            prompts: {},
            tools: {},
        },
    }
);

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const skills = await listSkillsForClient();
    return {
        resources: [
            ...skills.map((skill) => ({
                uri: `skill://superpowers/${encodeURIComponent(skill.name)}`,
                name: skill.name,
                description: skill.description,
                mimeType: "text/markdown",
            })),
            {
                uri: COMPOSITIONS_GUIDE_URI,
                name: "Skill Compositions Guide",
                description: "Workflow selection, prerequisites, invocation, and lifecycle guidance for Superpowers pipelines.",
                mimeType: "text/markdown",
            },
        ],
    };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const rawUri = (request.params as { uri?: unknown }).uri;
    if (typeof rawUri !== "string") {
        throw new McpError(ErrorCode.InvalidParams, "Invalid resource URI");
    }
    const uri = rawUri;

    if (uri === COMPOSITIONS_GUIDE_URI) {
        try {
            const guideStat = await fs.promises.stat(COMPOSITIONS_GUIDE_PATH);
            if (compositionsGuideCache === null || guideStat.mtimeMs !== compositionsGuideMtimeMs || guideStat.size !== compositionsGuideSize) {
                compositionsGuideCache = await fs.promises.readFile(COMPOSITIONS_GUIDE_PATH, "utf8");
                // Re-stat after the read and cache THAT stat: it is the stat the
                // cached content actually matches, closing the stat->read race.
                const postReadStat = await fs.promises.stat(COMPOSITIONS_GUIDE_PATH);
                compositionsGuideMtimeMs = postReadStat.mtimeMs;
                compositionsGuideSize = postReadStat.size;
            }
            const text = truncateSkillBodyForClient(compositionsGuideCache ?? "");
            return {
                contents: [{ uri, mimeType: "text/markdown", text }],
            };
        } catch (guideErr: unknown) {
            const detail = guideErr instanceof Error ? guideErr.message : String(guideErr);
            process.stderr.write(`[superpowers-mcp] Failed to read compositions guide: ${detail}\n`);
            throw new McpError(
                ErrorCode.InternalError,
                "Failed to read the skill compositions guide."
            );
        }
    }

    const match = uri.match(/^skill:\/\/superpowers\/(.+)$/);

    if (!match) {
        throw new McpError(ErrorCode.InvalidRequest, `Invalid skill URI: ${uri}`);
    }

    let skillName: string;
    try {
        skillName = decodeURIComponent(match[1]);
    } catch (_decodeErr: unknown) {
        // Malformed percent-encoding (e.g. %zz) — report as a client error
        // instead of letting the URIError surface as an internal error.
        throw new McpError(ErrorCode.InvalidRequest, `Invalid skill URI: ${uri}`);
    }
    // Reject traversal / separator payloads after decoding: the URI matcher runs
    // before percent-decoding, so "%2F"/"%2E%2E" would otherwise slip through.
    // Normalize first so prefixed spellings (e.g. "superpowers:..") are judged by
    // the name actually looked up — the same order the read_skill tool uses.
    const normalizedSkillName = normalizeSkillName(skillName);
    if (isUnsafeSkillName(normalizedSkillName)) {
        throw new McpError(ErrorCode.InvalidRequest, `Invalid skill URI: ${uri}`);
    }
    const skill = await findSkillForClient(normalizedSkillName);

    if (!skill) {
        throw new McpError(ErrorCode.InvalidRequest, `Skill not found: ${skillName}`);
    }

    try {
        const content = truncateSkillBodyForClient(await readSkillContentForClient(skill.skillPath));
        return {
            contents: [
                {
                    uri,
                    mimeType: "text/markdown",
                    text: content,
                },
            ],
        };
    } catch (readErr: unknown) {
        const detail = readErr instanceof Error ? readErr.message : String(readErr);
        process.stderr.write(`[superpowers-mcp] Failed to read resource "${uri}": ${detail}\n`);
        if ((readErr as { code?: string }).code === "ENOENT") {
            throw new McpError(ErrorCode.InvalidRequest, `Skill not found: ${skillName}`);
        }
        throw new McpError(
            ErrorCode.InternalError,
            `Failed to read skill content for "${skillName}".`
        );
    }
});

// ---------------------------------------------------------------------------
// Review file naming for the SDD prompt templates
// ---------------------------------------------------------------------------
/**
 * "…-report.md" → "…-review.md" style sibling naming.
 */
function siblingReviewFile(file: string, suffix: string): string {
    return file.endsWith(suffix) ? `${file.slice(0, -suffix.length)}-review.md` : "";
}

/**
 * Two spellings that address the same file must not slip past the identity
 * checks below: `./` segments, doubled or trailing separators and `..` links are
 * normalised away, and the comparison is case-insensitive on the platforms whose
 * default filesystem is (macOS, Windows). A match makes deriveReviewFile fall
 * through to the derived sibling, so every miss errs on the safe side — the
 * caller's path is used only when it does not resolve to the report or brief
 * file under these rules. Best-effort hardening, not a security boundary:
 * symlinked paths (the review file usually does not exist yet, so it cannot be
 * resolved), relative paths that mean a different file for the caller's working
 * directory than for the server's, and unicode normalisation differences can
 * still evade it — callers must not rely on it to prevent overwrites.
 */
function sameFilePath(a: string, b: string): boolean {
    if (!a || !b) {
        return false;
    }
    const normalize = (file: string): string => {
        // Resolve `.`/`..`/duplicate separators lexically first so non-existent
        // paths (the review file usually doesn't exist yet) still compare sanely.
        let resolved = path.resolve(file);
        // Where the path exists (or its parent does), canonicalize symlinks so
        // symlinked spellings of the same file compare equal.
        try {
            resolved = fs.realpathSync(resolved);
        } catch {
            try {
                const parent = fs.realpathSync(path.dirname(resolved));
                resolved = path.join(parent, path.basename(resolved));
            } catch {
                // Fall back to the lexical resolution above.
            }
        }
        // Unify separators, strip trailing separators, NFC-normalize unicode so
        // composed vs decomposed spellings of the same name compare equal.
        resolved = resolved.replace(/[\\/]+$/, "");
        if (typeof resolved.normalize === "function") {
            resolved = resolved.normalize("NFC");
        }
        return process.platform === "darwin" || process.platform === "win32" ? resolved.toLowerCase() : resolved;
    };
    return normalize(a) === normalize(b);
}

/**
 * The review file is the reviewer's durable record and the detail fix subagents
 * read. A caller may name it; otherwise it is derived from the report file's or
 * the brief file's sibling naming (…/task-N-report.md → …/task-N-review.md).
 * A path that resolves to the report or the brief file is replaced by that
 * derived sibling — a reviewer must never be asked to overwrite the
 * implementer's report. Returns "" when nothing safe can be derived, in which
 * case the template keeps its [REVIEW_FILE] placeholder.
 */
function deriveReviewFile(requested: string, reportFile: string, briefFile: string): string {
    if (requested && !sameFilePath(requested, reportFile) && !sameFilePath(requested, briefFile)) {
        return requested;
    }
    const derived = siblingReviewFile(reportFile, "-report.md") || siblingReviewFile(briefFile, "-brief.md");
    if (derived) {
        return derived;
    }
    if (reportFile) {
        const trimmedReport = reportFile.replace(/[\\/]+$/, "");
        if (trimmedReport === "") {
            return "";
        }
        const lastSep = Math.max(trimmedReport.lastIndexOf("/"), trimmedReport.lastIndexOf("\\"));
        const prefix = trimmedReport.slice(0, lastSep + 1);
        const base = trimmedReport.slice(lastSep + 1);
        const strippedBase = base.replace(/\.[^./\\]*$/, "");
        // A pure dot-file (e.g. ".review") has no stem before its extension;
        // stripping would empty the basename and yield "-review.md".
        if (strippedBase === "") {
            return `${trimmedReport}-review.md`;
        }
        return `${prefix}${strippedBase}-review.md`;
    }
    return "";
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

// Placeholder alternation patterns are derived from a tiny, fixed set of keys, so
// the pattern source strings can be memoised instead of rebuilt on every prompt
// request. A fresh RegExp is constructed per call: sharing one `/g` RegExp across
// renders would share its mutable lastIndex state.
const placeholderRegexCache = new Map<string, string>();

function compilePlaceholderRegex(pattern: string): RegExp {
    const cached = placeholderRegexCache.get(pattern);
    if (cached !== undefined) {
        return new RegExp(cached, "g");
    }
    // Bounded cache: the key set is fixed by the caller, so eviction is only a
    // safety net against unbounded growth if that ever changes.
    if (placeholderRegexCache.size >= 64) {
        placeholderRegexCache.clear();
    }
    placeholderRegexCache.set(pattern, pattern);
    return new RegExp(pattern, "g");
}

function interpolateTemplate(template: string, replacements: Record<string, string | undefined>): string {
    const validKeys = Object.keys(replacements).filter((key) => {
        const val = replacements[key];
        return val !== undefined && val !== "";
    });
    if (validKeys.length === 0) {
        return template;
    }
    for (const key of validKeys) {
        if (!template.includes(key)) {
            process.stderr.write(
                `[superpowers-mcp] Ignored prompt argument for missing placeholder "${key}" — the template does not contain it.\n`
            );
        }
    }
    // Sort longer keys first to prevent prefix shadowing and escape regex characters
    const pattern = validKeys
        .sort((a, b) => b.length - a.length)
        .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|");
    const regex = compilePlaceholderRegex(pattern);
    const substitute = (text: string): string => {
        regex.lastIndex = 0;
        return text.replace(regex, (matched) => {
            const val = replacements[matched];
            return val !== undefined && val !== "" ? String(val) : matched;
        });
    };
    // Templates close with a "**Placeholders:**" appendix whose bullets name each
    // accepted token (`- `[FINDINGS]` — what it holds`); substituting there renames
    // the token to the caller's value. A backticked token opening a list item occurs
    // only in that appendix, so it is the discriminator.
    const isAppendixEntry = (line: string): boolean => /^\s*-\s+`\[.+\]`\s+\S/.test(line);
    return template
        .split("\n")
        .map((line) => (isAppendixEntry(line) ? line : substitute(line)))
        .join("\n");
}

/**
 * Collects the placeholder names whose replacement the template actually consumed.
 *
 * Legacy "extra context" sections used a `rendered.includes(value)` substring test
 * to decide whether a value had already been interpolated. That test produced false
 * positives for short values (any coincidental appearance anywhere in the template
 * silently dropped the section), and keying the result by value let two different
 * fields that happened to share a value collide. Returning the consumed placeholder
 * names is exact: a legacy section is skipped only when its corresponding modern
 * placeholder was filled.
 */
function appliedInterpolations(template: string, replacements: Record<string, string | undefined>): Set<string> {
    const applied = new Set<string>();
    // 與 interpolateTemplate 使用相同的行過濾視角：附錄條目行（`**Placeholders:**`
    // 下方 `- `[TOKEN]` …` 形式的說明行）不做代換，因此也不能計入已套用。
    const isAppendixEntry = (line: string): boolean => /^\s*-\s+`\[.+\]`\s+\S/.test(line);
    const interpolatable = template
        .split("\n")
        .filter((line) => !isAppendixEntry(line))
        .join("\n");
    for (const [placeholder, value] of Object.entries(replacements)) {
        if (value !== undefined && value !== "" && interpolatable.includes(placeholder)) {
            applied.add(placeholder);
        }
    }
    return applied;
}

server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
        prompts: [
            {
                name: "session-start",
                description: "Inject the Superpowers context into an AI agent session. Tells the agent it has superpowers and how to use the skill system.",
            },
            {
                name: "sdd-implementer",
                description: "Subagent-Driven Development (SDD) Implementer Prompt. Directs a subagent to implement a specific task using TDD and self-verification.",
                arguments: [
                    {
                        name: "brief_file",
                        description: "Path to the task brief file (scripts/task-brief PLAN N)",
                        required: false,
                    },
                    {
                        name: "task_name",
                        description: "Name or description of the task to implement",
                        required: false,
                    },
                    {
                        name: "report_file",
                        description: "Path where the implementer should write its detailed report",
                        required: false,
                    },
                    {
                        name: "work_dir",
                        description: "Working directory path for implementation",
                        required: false,
                    },
                    {
                        name: "model",
                        description: "Model tier/name selection for implementer",
                        required: false,
                    },
                    {
                        name: "plan_file",
                        description: "Legacy alias: Path to the task brief or plan file",
                        required: false,
                    },
                    {
                        name: "task_description",
                        description: "Legacy alias: Task description",
                        required: false,
                    },
                ],
            },
            {
                name: "sdd-task-reviewer",
                description: "Subagent-Driven Development (SDD) Task Reviewer Prompt. Evaluates task implementation against specification and code quality.",
                arguments: [
                    {
                        name: "brief_file",
                        description: "Path to the task brief file",
                        required: false,
                    },
                    {
                        name: "report_file",
                        description: "Path to the implementer's report file",
                        required: false,
                    },
                    {
                        name: "diff_file",
                        description: "Path to the review package diff file",
                        required: false,
                    },
                    {
                        name: "review_file",
                        description: "Path the reviewer writes its full report to; defaults to the report or brief file's -review.md sibling",
                        required: false,
                    },
                    {
                        name: "base_sha",
                        description: "Base commit SHA before this task",
                        required: false,
                    },
                    {
                        name: "head_sha",
                        description: "Head commit SHA for this task",
                        required: false,
                    },
                    {
                        name: "global_constraints",
                        description: "Binding global constraints copied verbatim from the plan or spec",
                        required: false,
                    },
                    {
                        name: "model",
                        description: "Reviewer model selection",
                        required: false,
                    },
                    {
                        name: "task_description",
                        description: "Legacy alias: Description of the task being reviewed",
                        required: false,
                    },
                    {
                        name: "review_target",
                        description: "Legacy alias: Review target or diff path",
                        required: false,
                    },
                ],
            },
            {
                name: "sdd-re-review",
                description: "SDD Scoped Re-Review Prompt. Reviews only fix-round deltas and previous feedback to prevent context bloat.",
                arguments: [
                    {
                        name: "brief_file",
                        description: "Path to the task brief file",
                        required: false,
                    },
                    {
                        name: "report_file",
                        description: "Path to the implementer's report file with fix notes",
                        required: false,
                    },
                    {
                        name: "diff_file",
                        description: "Path to the scoped review package diff file over fix range",
                        required: false,
                    },
                    {
                        name: "review_file",
                        description: "Path to the task's review file; this round's verdicts are appended to it",
                        required: false,
                    },
                    {
                        name: "fix_base_sha",
                        description: "Alias: the head the previous review saw (same as base_sha for a fix round)",
                        required: false,
                    },
                    {
                        name: "previous_findings",
                        description: "Previous reviewer findings that needed fixing",
                        required: false,
                    },
                    {
                        name: "base_sha",
                        description: "Base commit SHA for the fix round",
                        required: false,
                    },
                    {
                        name: "head_sha",
                        description: "Current head commit SHA",
                        required: false,
                    },
                    {
                        name: "model",
                        description: "Re-reviewer model selection",
                        required: false,
                    },
                    {
                        name: "fix_summary",
                        description: "Legacy alias: Summary of changes made to address previous findings",
                        required: false,
                    },
                ],
            },
            {
                name: "builder-check",
                description: "Brainstorming Builder Check Prompt. A fresh builder reads the approved design and lists what they'd still need to ask before planning it.",
                arguments: [
                    {
                        name: "design_file",
                        description: "Path to the approved design document (e.g., docs/superpowers/specs/...)",
                        required: false,
                    },
                    {
                        name: "domain",
                        description: "Builder domain expertise to assume (e.g., \"software engineer\")",
                        required: false,
                    },
                ],
            },
            {
                name: "plan-reviewer",
                description: "Plan Document Reviewer Prompt. Adversarially reviews an implementation plan for completeness, testability, and task contracts.",
                arguments: [
                    {
                        name: "plan_file",
                        description: "Path to the implementation plan document to review",
                        required: false,
                    },
                    {
                        name: "spec_file",
                        description: "Path to the reference specification document",
                        required: false,
                    },
                ],
            },
            {
                name: FEATURE_PIPELINE.promptName,
                description: FEATURE_PIPELINE.purpose,
                arguments: [
                    {
                        name: "feature_name",
                        description: "Name or title of the feature to develop",
                        required: true,
                    },
                    {
                        name: "requirements",
                        description: "Initial feature requirements, constraints, or description",
                        required: false,
                    },
                ],
            },
            {
                name: STRUCTURED_DEBUG_PIPELINE.promptName,
                description: STRUCTURED_DEBUG_PIPELINE.purpose,
                arguments: [
                    {
                        name: "issue_description",
                        description: "Description of the bug, error logs, or symptoms",
                        required: false,
                    },
                    {
                        name: "failing_tests",
                        description: "Names or paths of failing tests",
                        required: false,
                    },
                ],
            },
            {
                name: "skill-composition",
                description: "Skill Composition & Workflow Guide Prompt. Recommends multi-skill compositions for feature development, debugging, refactoring, or legacy safety net.",
                arguments: [
                    {
                        name: "scenario",
                        description: "Development scenario (feature, debug, refactor, legacy-safety)",
                        required: false,
                    },
                ],
            },
        ],
    };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const rawName = (request.params as { name?: unknown }).name;
    if (typeof rawName !== "string") {
        throw new McpError(ErrorCode.InvalidParams, 'Prompt "name" must be a string');
    }
    const rawArgs = (request.params as { arguments?: unknown }).arguments;
    if (
        rawArgs !== undefined &&
        (typeof rawArgs !== "object" ||
            rawArgs === null ||
            Array.isArray(rawArgs) ||
            (Object.getPrototypeOf(rawArgs) !== Object.prototype &&
                Object.getPrototypeOf(rawArgs) !== null))
    ) {
        throw new McpError(ErrorCode.InvalidParams, 'Prompt "arguments" must be an object');
    }
    const promptName = rawName;
    const args = (rawArgs ?? {}) as Record<string, unknown>;

    const MAX_PROMPT_ARG_LENGTH = 32 * 1024;

    const getStringArg = (key: string, maxLen = MAX_PROMPT_ARG_LENGTH): string => {
        const val = Object.prototype.hasOwnProperty.call(args, key) ? args[key] : undefined;
        if (val === undefined || val === null) {
            return "";
        }
        if (typeof val !== "string") {
            throw new McpError(ErrorCode.InvalidParams, `Prompt argument "${key}" must be a string`);
        }
        const str = val.trim();
        if (str.length > maxLen) {
            throw new McpError(
                ErrorCode.InvalidParams,
                `Prompt argument "${key}" exceeds the maximum length of ${maxLen} characters`
            );
        }
        return str;
    };

    const readPromptFileSafe = async (relPath: string): Promise<string> => {
        const fullPath = path.join(SKILLS_PATH, relPath);
        try {
            const content = await readSkillContentForClient(fullPath);
            if (content.trim() === "") {
                // Returning an empty template would silently hand the user a blank
                // prompt with no indication that the installation is broken.
                throw new Error("prompt template is empty");
            }
            return truncateSkillBodyForClient(content);
        } catch (fileErr: unknown) {
            const detail = fileErr instanceof Error ? fileErr.message : String(fileErr);
            process.stderr.write(`[superpowers-mcp] Failed to load prompt template "${relPath}": ${detail}\n`);
            // 回傳給客戶端的訊息刻意不帶 detail：它可能內含檔案系統絕對路徑等
            // 細節；完整資訊已寫入 stderr 供伺服器端除錯。
            throw new McpError(
                ErrorCode.InternalError,
                `Failed to load prompt template "${relPath}". The Superpowers skills directory may be missing or incomplete.`
            );
        }
    };

    if (promptName === "session-start") {
        let skillContent = "";
        try {
            const skill = await findSkillForClient("using-superpowers");
            const targetPath = skill ? skill.skillPath : path.join(SKILLS_PATH, "using-superpowers", "SKILL.md");
            skillContent = truncateSkillBodyForClient(await readSkillContentForClient(targetPath));
        } catch (_skillErr: unknown) {
            const detail = _skillErr instanceof Error ? _skillErr.message : String(_skillErr);
            process.stderr.write(`[superpowers-mcp] Failed to load using-superpowers skill, using fallback: ${detail}\n`);
            skillContent = "# Superpowers\n\nYou have superpowers. Use the read_skill and list_skills tools to discover and load skills.";
        }

        const sessionContext = `<EXTREMELY_IMPORTANT>
You have superpowers.

**Below is the full content of your 'superpowers:using-superpowers' skill - your introduction to using skills. For all other skills, use the read_skill tool:**

${skillContent}
</EXTREMELY_IMPORTANT>`;

        return {
            description: "Superpowers session start context — establishes how to find and use skills",
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: sessionContext,
                    },
                },
            ],
        };
    }

    if (promptName === "sdd-implementer") {
        const template = await readPromptFileSafe("subagent-driven-development/implementer-prompt.md");
        const briefFileArg = getStringArg("brief_file");
        const taskNameArg = getStringArg("task_name");
        const briefFile = briefFileArg || getStringArg("plan_file");
        const taskName = taskNameArg || getStringArg("task_description");
        const reportFile = getStringArg("report_file");
        const workDir = getStringArg("work_dir");
        const model = getStringArg("model");
        const taskDesc = getStringArg("task_description");
        const planFile = getStringArg("plan_file");

        const replacements = {
            "[BRIEF_FILE]": briefFile,
            "[task name]": taskName,
            "[REPORT_FILE]": reportFile,
            "[directory]": workDir,
            "[MODEL]": model,
        };
        const rendered = interpolateTemplate(template, replacements);
        const alreadyApplied = appliedInterpolations(template, replacements);

        const legacyAppends = [
            // 別名欄位只在正規欄位缺席時才補：兩者並存時正規值已內插，
            // 再附加別名值只會造成重複。
            taskDesc && !taskNameArg && !alreadyApplied.has("[task name]") ? `\n\n### Target Task:\n${fencedDataBlock(taskDesc)}` : "",
            planFile && !briefFileArg && !alreadyApplied.has("[BRIEF_FILE]") ? `\n\n### Plan / Brief File:\n${fencedDataBlock(planFile)}` : "",
        ].join("");

        return {
            description: "Subagent-Driven Development Implementer Prompt",
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `${rendered}${legacyAppends}`,
                    },
                },
            ],
        };
    }

    if (promptName === "sdd-task-reviewer") {
        const template = await readPromptFileSafe("subagent-driven-development/task-reviewer-prompt.md");
        const briefFile = getStringArg("brief_file");
        const reportFile = getStringArg("report_file");
        const diffFile = getStringArg("diff_file") || getStringArg("review_target");
        const reviewFile = deriveReviewFile(getStringArg("review_file"), reportFile, briefFile);
        const baseSha = getStringArg("base_sha");
        const headSha = getStringArg("head_sha");
        const globalConstraints = getStringArg("global_constraints");
        const model = getStringArg("model");
        const taskDesc = getStringArg("task_description");
        const reviewTarget = getStringArg("review_target");

        const replacements = {
            "[BRIEF_FILE]": briefFile,
            "[REPORT_FILE]": reportFile,
            "[DIFF_FILE]": diffFile,
            "[BASE_SHA]": baseSha,
            "[HEAD_SHA]": headSha,
            "[GLOBAL_CONSTRAINTS]": globalConstraints,
            "[REVIEW_FILE]": reviewFile,
            "[MODEL]": model,
            "[TASK_DESCRIPTION]": taskDesc,
            "[REVIEW_TARGET]": reviewTarget,
        };
        const rendered = interpolateTemplate(template, replacements);
        const alreadyApplied = appliedInterpolations(template, replacements);

        // appliedInterpolations() reports the placeholder NAMES it substituted, so
        // the suppression test must use the key, not the value. Passing taskDesc /
        // reviewTarget made this guard a permanent no-op: a value can never equal
        // "[TASK_DESCRIPTION]" / "[REVIEW_TARGET]", so the legacy section was appended
        // even when the template already consumed the value.
        const legacyAppends = [
            taskDesc && !alreadyApplied.has("[TASK_DESCRIPTION]") ? `\n\n### Reviewed Task:\n${fencedDataBlock(taskDesc)}` : "",
            reviewTarget && !alreadyApplied.has("[REVIEW_TARGET]") ? `\n\n### Review Target:\n${fencedDataBlock(reviewTarget)}` : "",
        ].join("");

        return {
            description: "Subagent-Driven Development Task Reviewer Prompt",
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `${rendered}${legacyAppends}`,
                    },
                },
            ],
        };
    }

    if (promptName === "sdd-re-review") {
        const template = await readPromptFileSafe("subagent-driven-development/re-review-prompt.md");
        const briefFile = getStringArg("brief_file");
        const reportFile = getStringArg("report_file");
        const diffFile = getStringArg("diff_file");
        // Re-reviews append to the same review file the task reviewer wrote.
        const reviewFile = deriveReviewFile(getStringArg("review_file"), reportFile, briefFile);
        const findings = getStringArg("previous_findings");
        const baseSha = getStringArg("base_sha") || getStringArg("fix_base_sha");
        const fixBaseSha = getStringArg("fix_base_sha") || baseSha;
        const headSha = getStringArg("head_sha");
        const model = getStringArg("model");
        const fixSummary = getStringArg("fix_summary");

        const replacements = {
            "[BRIEF_FILE]": briefFile,
            "[REPORT_FILE]": reportFile,
            "[DIFF_FILE]": diffFile,
            "[REVIEW_FILE]": reviewFile,
            "[FINDINGS]": findings,
            "[FIX_BASE_SHA]": fixBaseSha,
            "[HEAD_SHA]": headSha,
            "[MODEL]": model,
            "[FIX_SUMMARY]": fixSummary,
        };
        const rendered = interpolateTemplate(template, replacements);
        const alreadyApplied = appliedInterpolations(template, replacements);

        const legacyAppends = [
            findings && !alreadyApplied.has("[FINDINGS]") ? `\n\n### Previous Findings:\n${fencedDataBlock(findings)}` : "",
            fixSummary && !alreadyApplied.has("[FIX_SUMMARY]") ? `\n\n### Fix Summary:\n${fencedDataBlock(fixSummary)}` : "",
        ].join("");

        return {
            description: "SDD Scoped Re-Review Prompt",
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `${rendered}${legacyAppends}`,
                    },
                },
            ],
        };
    }

    if (promptName === "builder-check") {
        const template = await readPromptFileSafe("brainstorming/builder-check-prompt.md");
        const designFile = getStringArg("design_file");
        // The template's domain slot is guidance text ("[DOMAIN, e.g. ...]"),
        // not a bare placeholder, so an explicit domain lands in the legacy
        // append below rather than interpolating inline.
        const domain = getStringArg("domain");
        const replacements = { "[DOCUMENT_PATH]": designFile, "[DOMAIN]": domain };
        const rendered = interpolateTemplate(template, replacements);
        const alreadyApplied = appliedInterpolations(template, replacements);
        const legacyAppend = designFile && !alreadyApplied.has("[DOCUMENT_PATH]") ? `\n\n### Target Design Document:\n${fencedDataBlock(designFile)}` : "";
        const legacyDomainAppend = domain && !alreadyApplied.has("[DOMAIN]") ? `\n\n### Builder Domain:\n${fencedDataBlock(domain)}` : "";

        return {
            description: "Brainstorming Builder Check Prompt",
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `${rendered}${legacyAppend}${legacyDomainAppend}`,
                    },
                },
            ],
        };
    }

    if (promptName === "plan-reviewer") {
        const template = await readPromptFileSafe("writing-plans/plan-document-reviewer-prompt.md");
        const planFile = getStringArg("plan_file");
        const specFile = getStringArg("spec_file");
        const replacements = {
            "[PLAN_FILE_PATH]": planFile,
            "[SPEC_FILE_PATH]": specFile,
        };
        const rendered = interpolateTemplate(template, replacements);
        const alreadyApplied = appliedInterpolations(template, replacements);
        const legacyAppend = planFile && !alreadyApplied.has("[PLAN_FILE_PATH]") ? `\n\n### Target Implementation Plan:\n${fencedDataBlock(planFile)}` : "";
        const legacySpecAppend = specFile && !alreadyApplied.has("[SPEC_FILE_PATH]") ? `\n\n### Reference Specification:\n${fencedDataBlock(specFile)}` : "";

        return {
            description: "Writing-Plans Plan Document Reviewer Prompt",
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `${rendered}${legacyAppend}${legacySpecAppend}`,
                    },
                },
            ],
        };
    }

    if (promptName === FEATURE_PIPELINE.promptName) {
        // Schema marks feature_name required (#3): reject a truly absent argument,
        // but keep the tested fallback for a present-but-blank/whitespace value.
        if (!Object.prototype.hasOwnProperty.call(args, "feature_name") || args["feature_name"] === null) {
            throw new McpError(
                ErrorCode.InvalidParams,
                'Prompt argument "feature_name" is required for the feature-pipeline prompt'
            );
        }
        const rawFeatureName = getStringArg("feature_name");
        // A title must stay on one line; newlines are flattened to spaces.
        // The name is untrusted input: pass it raw to renderFeaturePipeline,
        // which wraps it via fencedDataBlock (always fenced, capped).
        // A present-but-blank value keeps the tested "(Unspecified feature)" fallback.
        const flatFeatureName = rawFeatureName.replace(/[\r\n]+/g, " ");
        const featureName = flatFeatureName ? flatFeatureName : "(Unspecified feature)";
        const requirements = getStringArg("requirements").replace(/\r\n?/g, "\n");

        const text = renderFeaturePipeline(featureName, requirements);

        return {
            description: FEATURE_PIPELINE.purpose,
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text,
                    },
                },
            ],
        };
    }

    if (promptName === STRUCTURED_DEBUG_PIPELINE.promptName) {
        const rawIssueDescription = getStringArg("issue_description").replace(/\r\n?/g, "\n");
        const rawFailingTests = getStringArg("failing_tests").replace(/\r\n?/g, "\n");
        const text = renderStructuredDebug(rawIssueDescription, rawFailingTests);

        return {
            description: STRUCTURED_DEBUG_PIPELINE.purpose,
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text,
                    },
                },
            ],
        };
    }

    if (promptName === "skill-composition") {
        const rawScenario = getStringArg("scenario");
        // 呼叫端提供的 scenario 是不可信輸入：包進圍欄區塊並標註為資料，
        // 避免其中的指示語句被下游 agent 誤當成指令。標題保留以相容既有測試。
        let scenario = "";
        if (rawScenario) {
            scenario = `\n### Selected Scenario:\n${fencedDataBlock(rawScenario)}\n`;
        }

        let scenarioFocus = "";
        if (rawScenario) {
            const lower = rawScenario.toLowerCase();
            // Word-anchored so a keyword buried inside an unrelated longer word
            // ("reNEWal") does not select a pipeline. The build branch also accepts
            // a prefix, since "rebuild" is a real request that anchoring alone drops.
            if (/\b(debug\w*|troubleshoot\w*|bug|fix(?:ing|ed)?)\b/.test(lower)) {
                scenarioFocus = "\n> **Recommended Pipeline Focus:** Pipeline 2 (Structured Debugging & Troubleshooting)\n";
            } else if (/\b(refactor\w*|migrat\w*|upgrad\w*)/.test(lower)) {
                scenarioFocus = "\n> **Recommended Pipeline Focus:** Pipeline 3 (Large Refactoring & System Migration)\n";
            } else if (/\b(legacy|safety)\b/.test(lower)) {
                scenarioFocus = "\n> **Recommended Pipeline Focus:** Pipeline 4 (Legacy Codebase Safety Net)\n";
            } else if (/\b(feature|new)\b|\b\w*build\w*\b/.test(lower)) {
                scenarioFocus = "\n> **Recommended Pipeline Focus:** Pipeline 1 (New Feature Development)\n";
            }
        }

        const text = `# Superpowers Skill Composition Guide

You are selecting or executing a multi-skill workflow pipeline.
${scenario}${scenarioFocus}
## Available Workflow Pipelines

The canonical published guide is available as the MCP resource \`${COMPOSITIONS_GUIDE_URI}\`.

1. **New Feature Development:**
   \`brainstorming\` ➔ \`writing-plans\` ➔ \`using-git-worktrees\` ➔ \`subagent-driven-development\` (TDD) ➔ \`verification-before-completion\` ➔ \`requesting-code-review\` ➔ \`finishing-a-development-branch\`

2. **Structured Debugging & Multi-failure Troubleshooting:**
   \`systematic-debugging\` ➔ \`using-git-worktrees\` ➔ \`dispatching-parallel-agents\` ➔ \`test-driven-development\` ➔ \`verification-before-completion\` ➔ \`requesting-code-review\` ➔ \`finishing-a-development-branch\`

3. **Large Refactoring & System Migration:**
   \`brainstorming\` ➔ \`writing-plans\` (skeleton-first) ➔ \`using-git-worktrees\` ➔ \`subagent-driven-development\` ➔ \`verification-before-completion\` ➔ \`requesting-code-review\` ➔ \`finishing-a-development-branch\`

4. **Legacy Codebase Safety Net:**
   \`brainstorming\` ➔ \`writing-plans\` ➔ \`test-driven-development\` (characterization tests) ➔ \`systematic-debugging\` ➔ \`verification-before-completion\`

Use \`read_skill(skill_name)\` to inspect any skill before starting.`;

        return {
            description: "Superpowers Skill Composition Guide Prompt",
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text,
                    },
                },
            ],
        };
    }

    throw new McpError(ErrorCode.InvalidParams, `Unknown prompt: ${promptName}`);
});

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "list_skills",
                description: "List all available Superpowers skills with their names and descriptions. Use this to discover which skills are available before loading one.",
                inputSchema: {
                    type: "object",
                    properties: {},
                    required: [],
                },
            },
            {
                name: "read_skill",
                description: "Read the full content of a Superpowers skill by name. The skill content contains instructions, checklists, and patterns to follow. Read a skill before attempting the task it covers.",
                inputSchema: {
                    type: "object",
                    properties: {
                        skill_name: {
                            type: "string",
                            description: 'Name of the skill to read (e.g. "brainstorming", "test-driven-development", "systematic-debugging")',
                        },
                    },
                    required: ["skill_name"],
                },
            },
        ],
    };
});

/**
 * Escape markdown metacharacters in skill descriptions rendered into the
 * list_skills markdown output, so a description cannot inject formatting,
 * headings, or links. Names are never escaped: they are used verbatim for
 * lookups and must round-trip exactly.
 */
function escapeListMarkdown(value: string): string {
    return value.replace(/([`*#\[\]])/g, "\\$1");
}

interface ReadSkillArguments {
    skill_name?: unknown;
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    // Non-object arguments are rejected, including falsy ones ("", 0, false):
    // only undefined/null mean "no arguments were supplied".
    if (args !== undefined && args !== null && (typeof args !== "object" || Array.isArray(args))) {
        throw new McpError(ErrorCode.InvalidParams, 'Tool "arguments" must be an object');
    }

    if (name === "list_skills") {
        const skills = await listSkillsForClient();
        const header = `# Superpowers Skills (${skills.length} available)\n\nUse \`read_skill\` with the skill name to load its full content.`;
        // 總輸出上限：技能一多或描述一大就截斷，並註明省略數量。
        const entries: string[] = [];
        let omitted = 0;
        let bodyLength = 0;
        for (const s of skills) {
            let description = s.description;
            if (description.length > MAX_SKILL_ENTRY_CHARS) {
                description =
                    escapeListMarkdown(description.slice(0, MAX_SKILL_ENTRY_CHARS)) +
                    `...[description truncated (${s.description.length - MAX_SKILL_ENTRY_CHARS} more characters)]`;
            } else {
                description = escapeListMarkdown(description);
            }
            const entry = `**${s.name}**\n${description}`;
            const chunkLength = (entries.length > 0 ? "\n\n---\n\n".length : 0) + entry.length;
            if (header.length + bodyLength + chunkLength > MAX_LIST_SKILLS_CHARS) {
                omitted++;
                continue;
            }
            entries.push(entry);
            bodyLength += chunkLength;
        }
        const truncationNote = omitted > 0 ? `\n\n...and ${omitted} more skill(s) not shown (output truncated).` : "";

        return {
            content: [
                {
                    type: "text",
                    text: `${header}\n\n---\n\n${entries.join("\n\n---\n\n")}${truncationNote}`,
                },
            ],
        };
    }

    if (name === "read_skill") {
        const readArgs = args as ReadSkillArguments | undefined;
        const skillName = typeof readArgs?.skill_name === "string" ? normalizeSkillName(readArgs.skill_name) : undefined;

        if (!skillName) {
            throw new McpError(ErrorCode.InvalidParams, "skill_name is required");
        }
        if (isUnsafeSkillName(skillName)) {
            throw new McpError(ErrorCode.InvalidParams, `Invalid skill name: "${skillName}"`);
        }

        const skill = await findSkillForClient(skillName);
        if (!skill) {
            throw new McpError(
                ErrorCode.InvalidParams,
                `Skill "${skillName}" not found. Use the list_skills tool to see available skills.`
            );
        }

        try {
            const content = truncateSkillBodyForClient(await readSkillContentForClient(skill.skillPath));
            return {
                content: [
                    {
                        type: "text",
                        text: `# Skill: ${skill.name}\n\n${content}`,
                    },
                ],
            };
        } catch (toolErr: unknown) {
            const detail = toolErr instanceof Error ? toolErr.message : String(toolErr);
            process.stderr.write(`[superpowers-mcp] read_skill("${skillName}") failed: ${detail}\n`);
            if ((toolErr as { code?: string }).code === "ENOENT") {
                throw new McpError(
                    ErrorCode.InvalidParams,
                    `Skill "${skillName}" not found. Use the list_skills tool to see available skills.`
                );
            }
            // 回傳給客戶端的訊息刻意不帶 detail：它可能內含檔案系統絕對路徑等
            // 細節；完整資訊已寫入 stderr 供伺服器端除錯。
            throw new McpError(
                ErrorCode.InternalError,
                `Failed to read skill "${skillName}".`
            );
        }
    }

    throw new McpError(ErrorCode.InvalidParams, `Unknown tool: ${name}`);
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

async function main() {
    const args = process.argv.slice(2);

    // Explicit CLI setup interception before initializing any MCP transports.
    // Only the `--setup` flag or a bare `setup`/`install` command triggers it, so
    // skill names or paths that merely contain those words are left alone.
    // Matched anywhere in argv so `server --setup ...` works, not just `server setup`.
    const firstCommand = args.find((a) => !a.startsWith("-"));
    if (args.includes("--setup") || firstCommand === "setup" || firstCommand === "install") {
        try {
            await runSetupCli(args);
        } catch (err) {
            console.error("Setup failed:", err);
            process.exitCode = 1;
        }
        // 不啟動 MCP transport，讓事件迴圈自然結束。以 process.exit() 強制結束會
        // 截斷尚未送出的 stdout/stderr（透過管道或 npx 呼叫時特別明顯）。
        return;
    }

    writeStartupTrustNotices(SKILLS_PATH);
    const transport = new StdioServerTransport();
    await server.connect(transport);

    let shuttingDown = false;
    const shutdown = async () => {
        if (shuttingDown) {
            return;
        }
        shuttingDown = true;
        try {
            await transport.close();
        } catch (_transportErr) {
            // Ignore transport close errors during termination
        }
        try {
            await server.close();
        } catch (_closeErr) {
            // Ignore close errors during termination
        }
        try {
            // Release stdin so the process can actually exit while the event
            // loop drains pending stdout; without this the stdio transport's
            // stdin listener keeps the loop alive after SIGINT/SIGTERM.
            process.stdin.unref();
        } catch (_stdinErr) {
            // Ignore: stdin may already be closed
        }
        // Let the event loop drain instead of process.exit(), which can truncate
        // pending stdout writes; the guard makes a second signal a no-op.
        process.exitCode = 0;
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

main().catch((err) => {
    process.stderr.write(`MCP Server fatal error: ${String(err)}\n`);
    process.exitCode = 1;
});
