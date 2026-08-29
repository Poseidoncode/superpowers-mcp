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
        version: "6.3.2",
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
                        name: "task_description",
                        description: "Description or brief of the task to implement",
                        required: false,
                    },
                    {
                        name: "plan_file",
                        description: "Path to the plan file or task brief",
                        required: false,
                    },
                ],
            },
            {
                name: "sdd-task-reviewer",
                description: "Subagent-Driven Development (SDD) Task Reviewer Prompt. Evaluates task implementation against specification and code quality.",
                arguments: [
                    {
                        name: "task_description",
                        description: "Description of the task being reviewed",
                        required: false,
                    },
                    {
                        name: "review_target",
                        description: "Files, commit SHAs, or review package to examine",
                        required: false,
                    },
                ],
            },
            {
                name: "sdd-re-review",
                description: "SDD Scoped Re-Review Prompt. Reviews only fix-round deltas and previous feedback to prevent context bloat.",
                arguments: [
                    {
                        name: "previous_findings",
                        description: "Previous reviewer findings that needed fixing",
                        required: false,
                    },
                    {
                        name: "fix_summary",
                        description: "Summary of changes made to address previous findings",
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
                        description: "Path or content of the specification document to review",
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
                        description: "Path or content of the plan document to review",
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
        const skill = await skillsManager.findSkill("using-superpowers");
        let skillContent = "";
        if (skill) {
            try {
                skillContent = await skillsManager.readSkillContent(skill.skillPath);
            } catch {
                skillContent = "# Superpowers\n\nYou have superpowers. Use the read_skill and list_skills tools to discover and load skills.";
            }
        } else {
            const usingSuperpowersPath = path.join(SKILLS_PATH, "using-superpowers", "SKILL.md");
            try {
                skillContent = await skillsManager.readSkillContent(usingSuperpowersPath);
            } catch {
                skillContent = "# Superpowers\n\nYou have superpowers. Use the read_skill and list_skills tools to discover and load skills.";
            }
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
        const taskDesc = args.task_description ? `\n\n### Target Task:\n${args.task_description}` : "";
        const planFile = args.plan_file ? `\n\n### Plan / Brief File:\n${args.plan_file}` : "";
        return {
            description: "Subagent-Driven Development Implementer Prompt",
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `${template}${taskDesc}${planFile}`,
                    },
                },
            ],
        };
    }

    if (promptName === "sdd-task-reviewer") {
        const template = await readPromptFileSafe("subagent-driven-development/task-reviewer-prompt.md");
        const taskDesc = args.task_description ? `\n\n### Reviewed Task:\n${args.task_description}` : "";
        const target = args.review_target ? `\n\n### Review Target:\n${args.review_target}` : "";
        return {
            description: "Subagent-Driven Development Task Reviewer Prompt",
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `${template}${taskDesc}${target}`,
                    },
                },
            ],
        };
    }

    if (promptName === "sdd-re-review") {
        const template = await readPromptFileSafe("subagent-driven-development/re-review-prompt.md");
        const findings = args.previous_findings ? `\n\n### Previous Findings:\n${args.previous_findings}` : "";
        const summary = args.fix_summary ? `\n\n### Fix Summary:\n${args.fix_summary}` : "";
        return {
            description: "SDD Scoped Re-Review Prompt",
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `${template}${findings}${summary}`,
                    },
                },
            ],
        };
    }

    if (promptName === "spec-reviewer") {
        const template = await readPromptFileSafe("brainstorming/spec-document-reviewer-prompt.md");
        const specFile = args.spec_file ? `\n\n### Target Specification:\n${args.spec_file}` : "";
        return {
            description: "Brainstorming Spec Document Reviewer Prompt",
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `${template}${specFile}`,
                    },
                },
            ],
        };
    }

    if (promptName === "plan-reviewer") {
        const template = await readPromptFileSafe("writing-plans/plan-document-reviewer-prompt.md");
        const planFile = args.plan_file ? `\n\n### Target Implementation Plan:\n${args.plan_file}` : "";
        return {
            description: "Writing-Plans Plan Document Reviewer Prompt",
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `${template}${planFile}`,
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
}

main().catch((err) => {
    process.stderr.write(`MCP Server fatal error: ${String(err)}\n`);
    process.exit(1);
});
