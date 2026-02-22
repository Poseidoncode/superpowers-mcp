import * as fs from "fs";
import * as path from "path";
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

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

// Support running from npm package or local development
const SKILLS_PATH = process.env.SKILLS_PATH
    ? process.env.SKILLS_PATH
    : fs.existsSync(path.join(__dirname, "..", "skills"))
        ? path.join(__dirname, "..", "skills") // dist/server.js -> skills/
        : path.join(__dirname, "skills");    // current dir during dev

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface SkillMeta {
    name: string;
    description: string;
    skillPath: string;
}

/**
 * Parse YAML frontmatter from a SKILL.md file.
 * Only extracts `name` and `description` fields (the only two supported by superpowers).
 */
function parseFrontmatter(content: string): { name: string; description: string } {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) {
        return { name: "", description: "" };
    }

    const yaml = match[1];
    const nameMatch = yaml.match(/^name:\s*["']?(.+?)["']?\s*$/m);
    const descMatch = yaml.match(/^description:\s*["']?([\s\S]+?)["']?\s*$/m);

    return {
        name: nameMatch ? nameMatch[1].trim() : "",
        description: descMatch ? descMatch[1].trim().replace(/\n\s*/g, " ") : "",
    };
}

/**
 * Enumerate all skills from the skills directory.
 */
function listSkills(): SkillMeta[] {
    if (!fs.existsSync(SKILLS_PATH)) {
        return [];
    }

    const skills: SkillMeta[] = [];

    for (const entry of fs.readdirSync(SKILLS_PATH, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;

        const skillDir = path.join(SKILLS_PATH, entry.name);
        const skillFile = path.join(skillDir, "SKILL.md");

        if (!fs.existsSync(skillFile)) continue;

        const content = fs.readFileSync(skillFile, "utf-8");
        const { name, description } = parseFrontmatter(content);

        skills.push({
            name: name || entry.name,
            description,
            skillPath: skillFile,
        });
    }

    return skills.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Find a skill by name (directory name or frontmatter name).
 */
function findSkill(skillName: string): SkillMeta | undefined {
    const skills = listSkills();
    return (
        skills.find((s) => s.name === skillName) ??
        skills.find((s) => path.basename(path.dirname(s.skillPath)) === skillName)
    );
}

/**
 * Read skill content, stripping frontmatter.
 */
function readSkillContent(skillPath: string): string {
    const raw = fs.readFileSync(skillPath, "utf-8");
    // Strip YAML frontmatter block
    return raw.replace(/^---\n[\s\S]*?\n---\n?/, "").trim();
}

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

const server = new Server(
    {
        name: "superpowers-mcp",
        version: "4.3.0",
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
    const skills = listSkills();

    return {
        resources: skills.map((skill) => ({
            uri: `skill://superpowers/${skill.name}`,
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

    const skillName = match[1];
    const skill = findSkill(skillName);

    if (!skill) {
        throw new McpError(ErrorCode.InvalidRequest, `Skill not found: ${skillName}`);
    }

    const content = fs.readFileSync(skill.skillPath, "utf-8");

    return {
        contents: [
            {
                uri,
                mimeType: "text/markdown",
                text: content,
            },
        ],
    };
});

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
        prompts: [
            {
                name: "session-start",
                description:
                    "Inject the Superpowers context into an AI agent session. Tells the agent it has superpowers and how to use the skill system.",
            },
        ],
    };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    if (request.params.name !== "session-start") {
        throw new McpError(
            ErrorCode.InvalidRequest,
            `Unknown prompt: ${request.params.name}`
        );
    }

    // Read using-superpowers skill content (same as what session-start hook injects)
    const usingSuperpowersPath = path.join(
        SKILLS_PATH,
        "using-superpowers",
        "SKILL.md"
    );

    let skillContent = "";
    if (fs.existsSync(usingSuperpowersPath)) {
        skillContent = fs.readFileSync(usingSuperpowersPath, "utf-8");
    } else {
        skillContent = "# Superpowers\n\nYou have superpowers. Use the read_skill and list_skills tools to discover and load skills.";
    }

    const sessionContext = `<EXTREMELY_IMPORTANT>
You have superpowers.

**Below is the full content of your 'superpowers:using-superpowers' skill - your introduction to using skills. For all other skills, use the read_skill tool:**

${skillContent}
</EXTREMELY_IMPORTANT>`;

    return {
        description:
            "Superpowers session start context — establishes how to find and use skills",
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
});

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "list_skills",
                description:
                    "List all available Superpowers skills with their names and descriptions. Use this to discover which skills are available before loading one.",
                inputSchema: {
                    type: "object",
                    properties: {},
                    required: [],
                },
            },
            {
                name: "read_skill",
                description:
                    "Read the full content of a Superpowers skill by name. The skill content contains instructions, checklists, and patterns to follow. Read a skill before attempting the task it covers.",
                inputSchema: {
                    type: "object",
                    properties: {
                        skill_name: {
                            type: "string",
                            description:
                                'Name of the skill to read (e.g. "brainstorming", "test-driven-development", "systematic-debugging")',
                        },
                    },
                    required: ["skill_name"],
                },
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "list_skills") {
        const skills = listSkills();

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
        const skillName = (args as Record<string, string>)?.skill_name;
        if (!skillName) {
            throw new McpError(ErrorCode.InvalidParams, "skill_name is required");
        }

        const skill = findSkill(skillName);
        if (!skill) {
            const available = listSkills()
                .map((s) => s.name)
                .join(", ");
            throw new McpError(
                ErrorCode.InvalidRequest,
                `Skill "${skillName}" not found. Available skills: ${available}`
            );
        }

        const content = fs.readFileSync(skill.skillPath, "utf-8");

        return {
            content: [
                {
                    type: "text",
                    text: `# Skill: ${skill.name}\n\n${content}`,
                },
            ],
        };
    }

    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // Server runs until process exits
}

main().catch((err) => {
    process.stderr.write(`MCP Server fatal error: ${String(err)}\n`);
    process.exit(1);
});
