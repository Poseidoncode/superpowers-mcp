import * as path from "path";
import * as fs from "fs";
import * as os from "os";
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

        const unsafePrefixes = [
            "/etc", "/var", "/bin", "/sbin", "/usr", "/root", "/sys", "/proc", "/dev",
            "/private/etc", "/private/var",
            "c:\\windows", "c:\\program files", "c:\\program files (x86)"
        ];

        // macOS 的標準暫存目錄位於 /private/var/folders（也就是被封鎖的 /var 子樹）。
        // 該目錄是每位使用者專屬、權限 0700 的拋棄式空間，把它計入 SKILLS_PATH 的
        // 合理位置；否則 `SKILLS_PATH=$(mktemp -d)` 會靜默退回預設技能目錄。
        // /var 底下的其他路徑（以及整個 /private/var）仍然維持封鎖。
        const tempRoot = (() => {
            try {
                return foldCase(path.normalize(fs.realpathSync(os.tmpdir())));
            } catch {
                return null;
            }
        })();
        const isUnderTempRoot =
            tempRoot !== null && (normalized === tempRoot || normalized.startsWith(tempRoot + path.sep));

        const isUnsafe =
            !isUnderTempRoot &&
            (!canonicalized ||
                normalized === root ||
                unsafePrefixes.some(
                    (p) => {
                        const prefix = foldCase(path.normalize(p));
                        return normalized === prefix || normalized.startsWith(prefix + path.sep);
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
const skillsManager = new SkillsManager(SKILLS_PATH);
const COMPOSITIONS_GUIDE_URI = "guide://superpowers/skill-compositions";
const COMPOSITIONS_GUIDE_PATH = path.join(__dirname, "..", "docs", "skill-compositions.md");

function normalizeSkillName(value: string): string {
    return value.trim().replace(/^superpowers:/i, "");
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
    const skills = await skillsManager.listSkills();
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
    const uri = request.params.uri;

    if (uri === COMPOSITIONS_GUIDE_URI) {
        try {
            const text = await fs.promises.readFile(COMPOSITIONS_GUIDE_PATH, "utf8");
            return {
                contents: [{ uri, mimeType: "text/markdown", text }],
            };
        } catch (guideErr: unknown) {
            const detail = guideErr instanceof Error ? guideErr.message : String(guideErr);
            process.stderr.write(`[superpowers-mcp] Failed to read compositions guide: ${detail}\n`);
            throw new McpError(
                ErrorCode.InternalError,
                `Failed to read the skill compositions guide: ${detail}`
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
    const skill = await skillsManager.findSkill(normalizeSkillName(skillName));

    if (!skill) {
        throw new McpError(ErrorCode.InvalidRequest, `Skill not found: ${skillName}`);
    }

    try {
        const content = await skillsManager.readSkillContent(skill.skillPath);
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
        throw new McpError(
            ErrorCode.InternalError,
            `Failed to read skill content for "${skillName}": ${detail}`
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
 * file under these rules. Deliberately not closed: symlinked paths (the review
 * file usually does not exist yet, so it cannot be resolved), relative paths
 * that mean a different file for the caller's working directory than for the
 * server's, and unicode normalisation differences.
 */
function sameFilePath(a: string, b: string): boolean {
    if (!a || !b) {
        return false;
    }
    const normalize = (file: string): string => {
        const resolved = path.resolve(file);
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
        return `${reportFile.replace(/(\.[^./\\]*)?$/, "")}-review.md`;
    }
    return "";
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

// Placeholder alternation patterns are derived from a tiny, fixed set of keys, so
// the compiled RegExp can be memoised instead of rebuilt on every prompt request.
const placeholderRegexCache = new Map<string, RegExp>();

function compilePlaceholderRegex(pattern: string): RegExp {
    const cached = placeholderRegexCache.get(pattern);
    if (cached) {
        return cached;
    }
    const regex = new RegExp(pattern, "g");
    // Bounded cache: the key set is fixed by the caller, so eviction is only a
    // safety net against unbounded growth if that ever changes.
    if (placeholderRegexCache.size >= 64) {
        placeholderRegexCache.clear();
    }
    placeholderRegexCache.set(pattern, regex);
    return regex;
}

function interpolateTemplate(template: string, replacements: Record<string, string | undefined>): string {
    const validKeys = Object.keys(replacements).filter((key) => {
        const val = replacements[key];
        return val !== undefined && val !== "";
    });
    if (validKeys.length === 0) {
        return template;
    }
    // Sort longer keys first to prevent prefix shadowing and escape regex characters
    const pattern = validKeys
        .sort((a, b) => b.length - a.length)
        .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|");
    const regex = compilePlaceholderRegex(pattern);
    regex.lastIndex = 0;
    return template.replace(regex, (matched) => {
        const val = replacements[matched];
        return val !== undefined && val !== "" ? String(val) : matched;
    });
}

/**
 * Collects the replacement values that the template actually consumed through a
 * placeholder.
 *
 * Legacy "extra context" sections used a `rendered.includes(value)` substring test
 * to decide whether a value had already been interpolated. That test produced false
 * positives for short values (any coincidental appearance anywhere in the template
 * silently dropped the section). Checking whether the value maps to a placeholder
 * that exists in the template is exact, and preserves the intended behaviour of
 * skipping a section only when that very value was substituted.
 */
function appliedInterpolations(template: string, replacements: Record<string, string | undefined>): Set<string> {
    const applied = new Set<string>();
    for (const [placeholder, value] of Object.entries(replacements)) {
        if (value !== undefined && value !== "" && template.includes(placeholder)) {
            applied.add(String(value));
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
                name: "spec-reviewer",
                description: "Spec Document Reviewer Prompt. Adversarially reviews a design specification across requirements, architecture, and edge cases.",
                arguments: [
                    {
                        name: "spec_file",
                        description: "Path to the specification document to review (e.g., docs/superpowers/specs/...)",
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
    const promptName = request.params.name;
    const args = request.params.arguments || {};

    const MAX_PROMPT_ARG_LENGTH = 32 * 1024;

    const getStringArg = (key: string, maxLen = MAX_PROMPT_ARG_LENGTH): string => {
        const val = Object.prototype.hasOwnProperty.call(args, key) ? args[key] : undefined;
        let str = "";
        if (typeof val === "string") {
            str = val.trim();
        } else if (val !== undefined && val !== null) {
            str = String(val).trim();
        }
        return str.length > maxLen ? str.slice(0, maxLen) : str;
    };

    const readPromptFileSafe = async (relPath: string): Promise<string> => {
        const fullPath = path.join(SKILLS_PATH, relPath);
        try {
            const content = await skillsManager.readSkillContent(fullPath);
            if (content.trim() === "") {
                // Returning an empty template would silently hand the user a blank
                // prompt with no indication that the installation is broken.
                throw new Error("prompt template is empty");
            }
            return content;
        } catch (fileErr: unknown) {
            const detail = fileErr instanceof Error ? fileErr.message : String(fileErr);
            process.stderr.write(`[superpowers-mcp] Failed to load prompt template "${relPath}": ${detail}\n`);
            throw new McpError(
                ErrorCode.InternalError,
                `Failed to load prompt template "${relPath}": ${detail}. The Superpowers skills directory may be missing or incomplete.`
            );
        }
    };

    if (promptName === "session-start") {
        let skillContent = "";
        try {
            const skill = await skillsManager.findSkill("using-superpowers");
            const targetPath = skill ? skill.skillPath : path.join(SKILLS_PATH, "using-superpowers", "SKILL.md");
            skillContent = await skillsManager.readSkillContent(targetPath);
        } catch (_skillErr: unknown) {
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
        const briefFile = getStringArg("brief_file") || getStringArg("plan_file");
        const taskName = getStringArg("task_name") || getStringArg("task_description");
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
            taskDesc && !alreadyApplied.has(taskDesc) ? `\n\n### Target Task:\n${taskDesc}` : "",
            planFile && !alreadyApplied.has(planFile) ? `\n\n### Plan / Brief File:\n${planFile}` : "",
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
        };
        const rendered = interpolateTemplate(template, replacements);
        const alreadyApplied = appliedInterpolations(template, replacements);

        const legacyAppends = [
            taskDesc && !alreadyApplied.has(taskDesc) ? `\n\n### Reviewed Task:\n${taskDesc}` : "",
            reviewTarget && !alreadyApplied.has(reviewTarget) ? `\n\n### Review Target:\n${reviewTarget}` : "",
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
        const headSha = getStringArg("head_sha");
        const model = getStringArg("model");
        const fixSummary = getStringArg("fix_summary");

        const replacements = {
            "[BRIEF_FILE]": briefFile,
            "[REPORT_FILE]": reportFile,
            "[DIFF_FILE]": diffFile,
            "[REVIEW_FILE]": reviewFile,
            "[FINDINGS]": findings,
            "[BASE_SHA]": baseSha,
            "[FIX_BASE_SHA]": baseSha,
            "[HEAD_SHA]": headSha,
            "[MODEL]": model,
        };
        const rendered = interpolateTemplate(template, replacements);
        const alreadyApplied = appliedInterpolations(template, replacements);

        const legacyAppends = [
            findings && !alreadyApplied.has(findings) ? `\n\n### Previous Findings:\n${findings}` : "",
            fixSummary ? `\n\n### Fix Summary:\n${fixSummary}` : "",
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

    if (promptName === "spec-reviewer") {
        const template = await readPromptFileSafe("brainstorming/spec-document-reviewer-prompt.md");
        const specFile = getStringArg("spec_file");
        const replacements = { "[SPEC_FILE_PATH]": specFile };
        const rendered = interpolateTemplate(template, replacements);
        const alreadyApplied = appliedInterpolations(template, replacements);
        const legacyAppend = specFile && !alreadyApplied.has(specFile) ? `\n\n### Target Specification:\n${specFile}` : "";

        return {
            description: "Brainstorming Spec Document Reviewer Prompt",
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `${rendered}${legacyAppend}`,
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
        const legacyAppend = planFile && !alreadyApplied.has(planFile) ? `\n\n### Target Implementation Plan:\n${planFile}` : "";
        const legacySpecAppend = specFile && !alreadyApplied.has(specFile) ? `\n\n### Reference Specification:\n${specFile}` : "";

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
        const rawFeatureName = getStringArg("feature_name");
        const featureName = rawFeatureName ? rawFeatureName.replace(/[\r\n]+/g, " ") : "(Unspecified feature)";
        const rawRequirements = getStringArg("requirements");

        const text = renderFeaturePipeline(featureName, rawRequirements);

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
        const rawIssueDescription = getStringArg("issue_description");
        const rawFailingTests = getStringArg("failing_tests");
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
        const scenario = rawScenario ? `\n### Selected Scenario:\n${rawScenario}\n` : "";

        let scenarioFocus = "";
        if (rawScenario) {
            const lower = rawScenario.toLowerCase();
            if (lower.includes("debug") || lower.includes("troubleshoot") || lower.includes("bug") || lower.includes("fix")) {
                scenarioFocus = "\n> **Recommended Pipeline Focus:** Pipeline 2 (Structured Debugging & Troubleshooting)\n";
            } else if (lower.includes("refactor") || lower.includes("migrat") || lower.includes("upgrade")) {
                scenarioFocus = "\n> **Recommended Pipeline Focus:** Pipeline 3 (Large Refactoring & System Migration)\n";
            } else if (lower.includes("legacy") || lower.includes("safety")) {
                scenarioFocus = "\n> **Recommended Pipeline Focus:** Pipeline 4 (Legacy Codebase Safety Net)\n";
            } else if (lower.includes("feature") || lower.includes("new") || lower.includes("build")) {
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

    throw new McpError(ErrorCode.InvalidRequest, `Unknown prompt: ${promptName}`);
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

interface ReadSkillArguments {
    skill_name?: unknown;
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "list_skills") {
        const skills = await skillsManager.listSkills();
        const skillList = skills
            .map((s) => `**${s.name}**\n${s.description}`)
            .join("\n\n---\n\n");

        return {
            content: [
                {
                    type: "text",
                    text: `# Superpowers Skills (${skills.length} available)\n\nUse \`read_skill\` with the skill name to load its full content.\n\n---\n\n${skillList}`,
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

        const skill = await skillsManager.findSkill(skillName);
        if (!skill) {
            const availableSkills = await skillsManager.listSkills();
            const available = availableSkills.map((s) => s.name).join(", ");
            throw new McpError(
                ErrorCode.InvalidRequest,
                `Skill "${skillName}" not found. Available skills: ${available}`
            );
        }

        try {
            const content = await skillsManager.readSkillContent(skill.skillPath);
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
            throw new McpError(
                ErrorCode.InternalError,
                `Failed to read skill "${skillName}": ${detail}`
            );
        }
    }

    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

async function main() {
    const args = process.argv.slice(2);
    const firstArg = args[0];

    // Explicit CLI setup interception before initializing any MCP transports
    if (firstArg === "setup" || firstArg === "--setup") {
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

    const transport = new StdioServerTransport();
    await server.connect(transport);

    const shutdown = async () => {
        try {
            await server.close();
        } catch (_closeErr) {
            // Ignore close errors during termination
        }
        process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

main().catch((err) => {
    process.stderr.write(`MCP Server fatal error: ${String(err)}\n`);
    process.exitCode = 1;
});
