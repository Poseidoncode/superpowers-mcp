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
            "/private/etc", "/private/var",
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
        version: "6.3.6",
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
    } catch (_decodeErr: unknown) {
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
    } catch (_readErr: unknown) {
        throw new McpError(ErrorCode.InternalError, `Failed to read skill content safely.`);
    }
});

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

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
    const regex = new RegExp(pattern, "g");
    return template.replace(regex, (matched) => {
        const val = replacements[matched];
        return val !== undefined && val !== "" ? String(val) : matched;
    });
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
                name: "feature-pipeline",
                description: "Feature Development Pipeline Prompt. Chains brainstorming, writing-plans, git-worktrees, SDD/TDD, verification, code review, and branch finishing into a structured workflow.",
                arguments: [
                    {
                        name: "feature_name",
                        description: "Name or title of the feature to develop",
                        required: false,
                    },
                    {
                        name: "requirements",
                        description: "Initial feature requirements, constraints, or description",
                        required: false,
                    },
                ],
            },
            {
                name: "structured-debug",
                description: "Structured Troubleshooting Pipeline Prompt. Chains systematic debugging, worktree isolation, parallel agent investigation, TDD fix, full verification, and review.",
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
            return await skillsManager.readSkillContent(fullPath);
        } catch (_fileErr: unknown) {
            return "";
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

        const rendered = interpolateTemplate(template, {
            "[BRIEF_FILE]": briefFile,
            "[task name]": taskName,
            "[REPORT_FILE]": reportFile,
            "[directory]": workDir,
            "[MODEL]": model,
        });

        const legacyAppends = [
            taskDesc && !rendered.includes(taskDesc) ? `\n\n### Target Task:\n${taskDesc}` : "",
            planFile && !rendered.includes(planFile) ? `\n\n### Plan / Brief File:\n${planFile}` : "",
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
        const baseSha = getStringArg("base_sha");
        const headSha = getStringArg("head_sha");
        const globalConstraints = getStringArg("global_constraints");
        const model = getStringArg("model");
        const taskDesc = getStringArg("task_description");
        const reviewTarget = getStringArg("review_target");

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
            taskDesc && !rendered.includes(taskDesc) ? `\n\n### Reviewed Task:\n${taskDesc}` : "",
            reviewTarget && !rendered.includes(reviewTarget) ? `\n\n### Review Target:\n${reviewTarget}` : "",
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
        const findings = getStringArg("previous_findings");
        const baseSha = getStringArg("base_sha") || getStringArg("fix_base_sha");
        const headSha = getStringArg("head_sha");
        const model = getStringArg("model");
        const fixSummary = getStringArg("fix_summary");

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
            findings && !rendered.includes(findings) ? `\n\n### Previous Findings:\n${findings}` : "",
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
        const planFile = getStringArg("plan_file");
        const specFile = getStringArg("spec_file");
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

    if (promptName === "feature-pipeline") {
        const rawFeatureName = getStringArg("feature_name");
        const featureName = rawFeatureName ? rawFeatureName.replace(/[\r\n]+/g, " ") : "(Unspecified feature)";
        const rawRequirements = getStringArg("requirements");
        const requirements = rawRequirements ? `\n### Requirements / Context:\n${rawRequirements}\n` : "";

        const text = `# Feature Development Pipeline

You are executing an end-to-end feature development workflow using Superpowers skills.

**Target Feature:** ${featureName}
${requirements}
## Mandatory Execution Stages:

1. **Stage 1: Requirements & Architecture Discovery**
   - **Invoke Skill:** \`superpowers:brainstorming\`
   - Clarify user intent, requirements, constraints, and architecture decisions.
   - Produce a design specification document (e.g., in \`docs/superpowers/specs/\`).

2. **Stage 2: Plan Construction**
   - **Invoke Skill:** \`superpowers:writing-plans\`
   - Decompose the spec into bite-sized, independently testable tasks.
   - Specify Recommended Skills (e.g. \`superpowers:test-driven-development\`) for each task.
   - Save plan to \`docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md\`.

3. **Stage 3: Workspace Isolation**
   - **Invoke Skill:** \`superpowers:using-git-worktrees\`
   - Create an isolated Git worktree for this feature development to keep main branch pristine.

4. **Stage 4: Execution & Implementation**
   - **Invoke Skill:** \`superpowers:subagent-driven-development\` (or \`superpowers:executing-plans\`)
   - For each task:
     - Follow \`superpowers:test-driven-development\` (Red -> Green -> Refactor).
     - Run task-level verification and self-review.
     - Dispatch fresh task reviewer per task.

5. **Stage 5: Full Suite Verification**
   - **Invoke Skill:** \`superpowers:verification-before-completion\`
   - Run complete repository test suite, linter, and type checks. Do NOT skip.

6. **Stage 6: Code Review**
   - **Invoke Skill:** \`superpowers:requesting-code-review\` (and \`superpowers:receiving-code-review\`)
   - Generate review package and resolve all findings.

7. **Stage 7: Branch Finishing & Cleanup**
   - **Invoke Skill:** \`superpowers:finishing-a-development-branch\`
   - Merge/PR, remove temporary worktree, and clean up.`;

        return {
            description: "Feature Development Pipeline Prompt",
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

    if (promptName === "structured-debug") {
        const rawIssueDescription = getStringArg("issue_description");
        const issueDescription = rawIssueDescription ? `\n### Issue Description / Logs:\n${rawIssueDescription}\n` : "";
        const rawFailingTests = getStringArg("failing_tests");
        const failingTests = rawFailingTests ? `\n### Failing Tests:\n${rawFailingTests}\n` : "";

        const text = `# Structured Troubleshooting Pipeline

You are executing a rigorous root-cause debugging process for complex failures or multiple failing tests.
${issueDescription}${failingTests}
## Mandatory Troubleshooting Stages:

1. **Stage 1: Systematic Root Cause Analysis**
   - **Invoke Skill:** \`superpowers:systematic-debugging\`
   - Gather exact error traces, logs, and state.
   - Decompose into testable, mutually exclusive hypotheses.

2. **Stage 2: Workspace Isolation for Investigation**
   - **Invoke Skill:** \`superpowers:using-git-worktrees\`
   - If investigating multiple independent hypotheses in parallel, create separate worktrees to prevent test interference and race conditions.

3. **Stage 3: Parallel Hypothesis Verification (Optional / Recommended for multi-bug)**
   - **Invoke Skill:** \`superpowers:dispatching-parallel-agents\`
   - Dispatch subagents into isolated worktrees to prove/disprove hypotheses.

4. **Stage 4: Test-Driven Bugfix**
   - **Invoke Skill:** \`superpowers:test-driven-development\`
   - Write a minimal failing reproduction test first (RED).
   - Apply the fix until test passes (GREEN).
   - Refactor without altering semantics.

5. **Stage 5: Full Regression Verification**
   - **Invoke Skill:** \`superpowers:verification-before-completion\`
   - Run entire repository test suite to confirm zero regressions.

6. **Stage 6: Code Review & Findings Resolution**
   - **Invoke Skill:** \`superpowers:requesting-code-review\` (and \`superpowers:receiving-code-review\`)
   - Review fix delta, ensure regression tests are defensive, and resolve all review findings.

7. **Stage 7: Branch Finishing & Cleanup**
   - **Invoke Skill:** \`superpowers:finishing-a-development-branch\`
   - Merge/PR the bugfix branch, clean up temporary worktrees, and delete obsolete branches.`;

        return {
            description: "Structured Troubleshooting Pipeline Prompt",
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
## Available Workflow Pipelines (see docs/skill-compositions.md for full details):

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
        } catch (_toolErr: unknown) {
            throw new McpError(ErrorCode.InternalError, `Failed to read skill "${skillName}" due to an internal error.`);
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
            process.exit(0);
        } catch (err) {
            console.error("Setup failed:", err);
            process.exit(1);
        }
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
    process.exit(1);
});
