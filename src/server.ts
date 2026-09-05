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

// ---------------------------------------------------------------------------
// Paths & Environment Protection
// ---------------------------------------------------------------------------

function getSafeSkillsPath(): string {
    const envPath = process.env.SKILLS_PATH;
    if (envPath) {
        const resolved = path.resolve(envPath);
        const normalized = path.normalize(resolved).toLowerCase();
        const root = path.parse(resolved).root.toLowerCase();

        const unsafePrefixes = [
            "/etc", "/var", "/bin", "/sbin", "/usr", "/root", "/sys", "/proc", "/dev",
            "c:\\windows", "c:\\program files", "c:\\program files (x86)"
        ];

        const isUnsafe =
            normalized === root ||
            unsafePrefixes.some(
                (p) => normalized === p || normalized.startsWith(p + path.sep)
            );

        if (isUnsafe) {
            process.stderr.write(`Warning: Potentially unsafe SKILLS_PATH: "${envPath}". Fallback to default.\n`);
        } else {
            return resolved;
        }
    }

    const defaultPath = path.join(__dirname, "..", "skills");
    return fs.existsSync(defaultPath) ? defaultPath : path.join(__dirname, "skills");
}

const SKILLS_PATH = getSafeSkillsPath();
const skillsManager = new SkillsManager(SKILLS_PATH);

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

const server = new Server(
    {
        name: "superpowers-mcp",
        version: "6.3.3",
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
        resources: skills.map((skill) => ({
            uri: `skill://superpowers/${encodeURIComponent(skill.name)}`,
            name: skill.name,
            description: skill.description,
            mimeType: "text/markdown",
        })),
    };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const match = uri.match(/^skill:\/\/superpowers\/(.+)$/);

    if (!match) {
        throw new McpError(ErrorCode.InvalidRequest, `Invalid skill URI: ${uri}`);
    }

    let skillName: string;
    try {
        skillName = decodeURIComponent(match[1]);
    } catch {
        // Malformed percent-encoding (e.g. %zz) — report as a client error
        // instead of letting the URIError surface as an internal error.
        throw new McpError(ErrorCode.InvalidRequest, `Invalid skill URI: ${uri}`);
    }
    const skill = await skillsManager.findSkill(skillName);

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
    } catch {
        throw new McpError(ErrorCode.InternalError, `Failed to read skill content safely.`);
    }
});

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

function interpolateTemplate(template: string, replacements: Record<string, string | undefined>): string {
    let result = template;
    for (const [key, value] of Object.entries(replacements)) {
        if (value !== undefined && value !== "") {
            // Replace exact literal key occurrences
            result = result.split(key).join(value);
        }
    }
    return result;
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
                        description: "Path to the specification document to review (docs/superpowers/specs/...",
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
        ],
    };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const promptName = request.params.name;
    const args = request.params.arguments || {};

    const readPromptFileSafe = async (relPath: string): Promise<string> => {
        const fullPath = path.join(SKILLS_PATH, relPath);
        try {
            return await skillsManager.readSkillContent(fullPath);
        } catch {
            return "";
        }
    };

    if (promptName === "session-start") {
        let skillContent = "";
        try {
            const skill = await skillsManager.findSkill("using-superpowers");
            const targetPath = skill ? skill.skillPath : path.join(SKILLS_PATH, "using-superpowers", "SKILL.md");
            skillContent = await skillsManager.readSkillContent(targetPath);
        } catch {
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
        const briefFile = args.brief_file || args.plan_file;
        const taskName = args.task_name || args.task_description;
        const reportFile = args.report_file;
        const workDir = args.work_dir;
        const model = args.model;

        const rendered = interpolateTemplate(template, {
            "[BRIEF_FILE]": briefFile,
            "[task name]": taskName,
            "[REPORT_FILE]": reportFile,
            "[directory]": workDir,
            "[MODEL]": model,
        });

        const legacyAppends = [
            args.task_description && !rendered.includes(args.task_description) ? `\n\n### Target Task:\n${args.task_description}` : "",
            args.plan_file && !rendered.includes(args.plan_file) ? `\n\n### Plan / Brief File:\n${args.plan_file}` : "",
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
        const briefFile = args.brief_file;
        const reportFile = args.report_file;
        const diffFile = args.diff_file || args.review_target;
        const baseSha = args.base_sha;
        const headSha = args.head_sha;
        const globalConstraints = args.global_constraints;
        const model = args.model;

        const rendered = interpolateTemplate(template, {
            "[BRIEF_FILE]": briefFile,
            "[REPORT_FILE]": reportFile,
            "[DIFF_FILE]": diffFile,
            "[BASE_SHA]": baseSha,
            "[HEAD_SHA]": headSha,
            "[GLOBAL_CONSTRAINTS]": globalConstraints,
            "[MODEL]": model,
        });

        const legacyAppends = [
            args.task_description && !rendered.includes(args.task_description) ? `\n\n### Reviewed Task:\n${args.task_description}` : "",
            args.review_target && !rendered.includes(args.review_target) ? `\n\n### Review Target:\n${args.review_target}` : "",
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
        const briefFile = args.brief_file;
        const reportFile = args.report_file;
        const diffFile = args.diff_file;
        const findings = args.previous_findings;
        const baseSha = args.base_sha || args.fix_base_sha;
        const headSha = args.head_sha;
        const model = args.model;

        const rendered = interpolateTemplate(template, {
            "[BRIEF_FILE]": briefFile,
            "[REPORT_FILE]": reportFile,
            "[DIFF_FILE]": diffFile,
            "[FINDINGS]": findings,
            "[BASE_SHA]": baseSha,
            "[HEAD_SHA]": headSha,
            "[MODEL]": model,
        });

        const legacyAppends = [
            args.previous_findings && !rendered.includes(args.previous_findings) ? `\n\n### Previous Findings:\n${args.previous_findings}` : "",
            args.fix_summary ? `\n\n### Fix Summary:\n${args.fix_summary}` : "",
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
        const specFile = args.spec_file;
        const rendered = interpolateTemplate(template, {
            "[SPEC_FILE_PATH]": specFile,
        });
        const legacyAppend = specFile && !rendered.includes(specFile) ? `\n\n### Target Specification:\n${specFile}` : "";

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
        const planFile = args.plan_file;
        const specFile = args.spec_file;
        const rendered = interpolateTemplate(template, {
            "[PLAN_FILE_PATH]": planFile,
            "[SPEC_FILE_PATH]": specFile,
        });
        const legacyAppend = planFile && !rendered.includes(planFile) ? `\n\n### Target Implementation Plan:\n${planFile}` : "";
        const legacySpecAppend = specFile && !rendered.includes(specFile) ? `\n\n### Reference Specification:\n${specFile}` : "";

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
        const skillName = typeof readArgs?.skill_name === 'string' ? readArgs.skill_name.trim() : undefined;

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
        } catch {
            throw new McpError(ErrorCode.InternalError, `Failed to read skill "${skillName}" due to an internal error.`);
        }
    }

    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);

    const shutdown = async () => {
        try {
            await server.close();
        } catch {
            // Ignore close errors during termination
        }
        process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

main().catch((err) => {
    process.stderr.write(`MCP Server fatal error: ${String(err)}\n`);
    process.exit(1);
});
