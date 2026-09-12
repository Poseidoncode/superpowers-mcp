export interface PipelineSkill {
    name: string;
    when?: string;
}

export interface PipelineStage {
    title: string;
    skills: PipelineSkill[];
    instructions: string[];
}

export interface PipelineDefinition {
    promptName: string;
    title: string;
    purpose: string;
    stages: PipelineStage[];
}

export const FEATURE_PIPELINE: PipelineDefinition = {
    promptName: "feature-pipeline",
    title: "Feature Development Pipeline",
    purpose: "Start an interactive feature workflow from requirements through branch finishing.",
    stages: [
        {
            title: "Requirements & Architecture Discovery",
            skills: [{ name: "brainstorming" }],
            instructions: [
                "Clarify user intent, requirements, constraints, and architecture decisions.",
                "Produce a design specification document (for example, in `docs/superpowers/specs/`).",
                "Stop at the skill's design-approval gate and wait for explicit user approval.",
            ],
        },
        {
            title: "Plan Construction",
            skills: [{ name: "writing-plans" }],
            instructions: [
                "Decompose the approved spec into bite-sized, independently testable tasks.",
                "Specify recommended skills for each task and save the plan under `docs/superpowers/plans/`.",
                "Stop at the plan-review gate and wait for explicit user approval before implementation.",
            ],
        },
        {
            title: "Workspace Isolation",
            skills: [{ name: "using-git-worktrees" }],
            instructions: ["Create or verify an isolated Git worktree before implementation."],
        },
        {
            title: "Execution & Implementation",
            skills: [
                { name: "subagent-driven-development", when: "when the host provides multi-agent tools" },
                { name: "executing-plans", when: "otherwise, as the inline fallback" },
                { name: "test-driven-development", when: "for implementation tasks" },
            ],
            instructions: [
                "Use Red -> Green -> Refactor for implementation work.",
                "Run task-level verification and review as required by the selected execution skill.",
                "Never claim that subagents were dispatched when the host does not provide multi-agent tools.",
            ],
        },
        {
            title: "Full Suite Verification",
            skills: [{ name: "verification-before-completion" }],
            instructions: ["Run the complete repository test suite, linter, and type checks; do not skip."],
        },
        {
            title: "Code Review",
            skills: [
                { name: "requesting-code-review" },
                { name: "receiving-code-review", when: "when findings are returned" },
            ],
            instructions: ["Generate a review package and resolve or explicitly rule on every finding."],
        },
        {
            title: "Branch Finishing & Cleanup",
            skills: [{ name: "finishing-a-development-branch" }],
            instructions: [
                "Present the skill's branch-finishing choices and wait for the user to select one.",
                "Do not merge, push, create a PR, or delete a worktree without the authorization required by the skill.",
            ],
        },
    ],
};

export const STRUCTURED_DEBUG_PIPELINE: PipelineDefinition = {
    promptName: "structured-debug",
    title: "Structured Troubleshooting Pipeline",
    purpose: "Start an interactive root-cause debugging and regression-fix workflow.",
    stages: [
        {
            title: "Systematic Root Cause Analysis",
            skills: [{ name: "systematic-debugging" }],
            instructions: [
                "Gather exact error traces, logs, and state.",
                "Decompose the failure into testable hypotheses before proposing fixes.",
            ],
        },
        {
            title: "Workspace Isolation",
            skills: [{ name: "using-git-worktrees" }],
            instructions: ["Create or verify an isolated worktree before changing code."],
        },
        {
            title: "Hypothesis Verification",
            skills: [{ name: "dispatching-parallel-agents", when: "only when independent hypotheses and multi-agent tools are available" }],
            instructions: [
                "Investigate independent hypotheses in parallel only when the host supports safe subagent dispatch.",
                "Otherwise investigate hypotheses sequentially in the current agent; do not claim that subagents ran.",
            ],
        },
        {
            title: "Test-Driven Bugfix",
            skills: [{ name: "test-driven-development" }],
            instructions: [
                "Write a minimal failing reproduction test first, apply the smallest fix, and refactor only while green.",
            ],
        },
        {
            title: "Full Regression Verification",
            skills: [{ name: "verification-before-completion" }],
            instructions: ["Run the complete repository verification suite and report exact evidence."],
        },
        {
            title: "Review & Findings Resolution",
            skills: [
                { name: "requesting-code-review" },
                { name: "receiving-code-review", when: "when findings are returned" },
            ],
            instructions: ["Review the fix delta and resolve or explicitly rule on every finding."],
        },
        {
            title: "Branch Finishing & Cleanup",
            skills: [{ name: "finishing-a-development-branch" }],
            instructions: ["Present branch-finishing choices and perform only the option selected by the user."],
        },
    ],
};

function renderSkill(skill: PipelineSkill): string {
    const condition = skill.when ? ` (${skill.when})` : "";
    return [
        `   - **Skill:** \`superpowers:${skill.name}\`${condition}`,
        `   - **Load it with:** \`read_skill({"skill_name":"${skill.name}"})\``,
    ].join("\n");
}

export function renderFeaturePipeline(featureName: string, requirements: string): string {
    const context = requirements ? `\n### Requirements / Context:\n${requirements}\n` : "";
    const stages = FEATURE_PIPELINE.stages
        .map((stage, index) => {
            const skills = stage.skills.map(renderSkill).join("\n");
            const instructions = stage.instructions.map((item) => `   - ${item}`).join("\n");
            return `${index + 1}. **Stage ${index + 1}: ${stage.title}**\n${skills}\n${instructions}`;
        })
        .join("\n\n");

    return `# ${FEATURE_PIPELINE.title}

This prompt starts an interactive, agent-guided workflow. It does not execute the stages server-side and it must pause at the design, plan-review, and branch-finishing decision gates.

For every stage, call \`read_skill\` with the exact bare skill name shown below before acting, then follow the returned instructions completely.

**Target Feature:** ${featureName}
${context}
## Mandatory Execution Stages

${stages}`;
}

export function renderStructuredDebug(issueDescription: string, failingTests: string): string {
    const issue = issueDescription ? `\n### Issue Description / Logs:\n${issueDescription}\n` : "";
    const tests = failingTests ? `\n### Failing Tests:\n${failingTests}\n` : "";
    const stages = STRUCTURED_DEBUG_PIPELINE.stages
        .map((stage, index) => {
            const skills = stage.skills.map(renderSkill).join("\n");
            const instructions = stage.instructions.map((item) => `   - ${item}`).join("\n");
            return `${index + 1}. **Stage ${index + 1}: ${stage.title}**\n${skills}\n${instructions}`;
        })
        .join("\n\n");

    return `# ${STRUCTURED_DEBUG_PIPELINE.title}

This prompt starts an interactive, agent-guided debugging workflow. It does not execute the stages server-side.

For every applicable stage, call \`read_skill\` with the exact bare skill name shown below before acting, then follow the returned instructions completely.
${issue}${tests}
## Mandatory Troubleshooting Stages

${stages}`;
}
