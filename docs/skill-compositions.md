# Superpowers MCP: Skill Compositions & Workflow Pipelines

[English](skill-compositions.md) | [繁體中文](skill-compositions.zh-TW.md) | [日本語](skill-compositions.ja.md) | [한국어](skill-compositions.ko.md)


## 1. Why Skill Compositions Matter

The 14 core skills in `superpowers-mcp` span the entire software development lifecycle (SDLC): from requirements discovery, architecture planning, isolated workspace setup, test-driven development (TDD), and systematic debugging, to full verification, code review, and branch integration.

While each atomic skill acts as a precision engineering tool, production-grade development requires **workflow orchestration**. Skill compositions transform ad-hoc AI interactions into disciplined, reproducible, and safety-guarded engineering pipelines.

---

## 2. Core Architectural Principles

When composing skills, always enforce these four safety mechanisms:

1. **Isolation First (via Git Worktrees)**: Whenever coordinating multiple subagents or debugging independent hypotheses in parallel, always use `superpowers:using-git-worktrees` to avoid filesystem race conditions and workspace pollution.
2. **Test-Driven by Default (TDD)**: No code modifications should occur without a failing test first (Red-Green-Refactor cycle) to guarantee regression safety.
3. **Dual-Layer Review Gates**: Never skip task-level spec compliance checks or feature-level branch reviews (`requesting-code-review` / `receiving-code-review`).
4. **Full Verification Before Completion**: Run the entire project test suite, type-checker, and linter (`verification-before-completion`) before claiming done or merging branches.

---

## 3. Four Standard Workflow Pipelines

```mermaid
flowchart TD
    subgraph FeaturePipeline["1. Feature Development Pipeline"]
        F1[brainstorming] --> F2[writing-plans]
        F2 --> F3[using-git-worktrees]
        F3 --> F4[subagent-driven-development / executing-plans]
        F4 --> F5[test-driven-development]
        F5 --> F6[verification-before-completion]
        F6 --> F7[requesting-code-review]
        F7 --> F8[finishing-a-development-branch]
    end
```

### Pipeline 1: End-to-End Feature Development
**Ideal for:** Building new features, major modules, or core subsystem enhancements.

| Step | Skill | Responsibility & Deliverable |
| :--- | :--- | :--- |
| **1. Requirements & Design** | `brainstorming` | Clarify intent, constraints, architecture decisions, and edge cases; output Design Spec. |
| **2. Plan Construction** | `writing-plans` | Decompose Spec into bite-sized, testable tasks annotated with Recommended Skills. |
| **3. Workspace Isolation** | `using-git-worktrees` | Create an isolated Git worktree to protect the main branch and active work. |
| **4. Task Execution** | `subagent-driven-development` | Dispatch fresh, context-isolated subagents to execute tasks sequentially. |
| **5. Core Implementation** | `test-driven-development` | Enforce the strict Red ➔ Green ➔ Refactor cycle for all business logic. |
| **6. Full Suite Verification** | `verification-before-completion` | Execute the full test suite, linter, and type checks to ensure zero regressions. |
| **7. Adversarial Review** | `requesting-code-review` | Assemble review package and perform comprehensive code & architecture reviews. |
| **8. Branch Finalization** | `finishing-a-development-branch` | Merge/PR, clean up worktrees, and delete temporary branches cleanly. |

---

### Pipeline 2: Structured Troubleshooting & Multi-failure Debugging
**Ideal for:** Complex bugs, flaky tests, multiple test failures, or production incidents.

```mermaid
flowchart LR
    D1[systematic-debugging] --> D2[using-git-worktrees]
    D2 --> D3[dispatching-parallel-agents]
    D3 --> D4[test-driven-development]
    D4 --> D5[verification-before-completion]
    D5 --> D6[requesting-code-review]
    D6 --> D7[finishing-a-development-branch]
```

1. **`systematic-debugging`**: Investigate root causes and break failures into distinct, testable hypotheses.
2. **`using-git-worktrees`**: Provision isolated worktrees for parallel investigations to prevent test interference.
3. **`dispatching-parallel-agents`**: Dispatch concurrent subagents to validate or invalidate individual hypotheses.
4. **`test-driven-development`**: Write minimal failing reproduction tests before applying targeted bugfixes.
5. **`verification-before-completion`**: Validate that all repository tests pass with clean outputs.
6. **`requesting-code-review`** (and `receiving-code-review`): Review the fix delta, ensure defensive regression test coverage, and resolve review findings.
7. **`finishing-a-development-branch`**: Merge the bugfix branch, remove temporary worktrees, and clean up workspace.

---

### Pipeline 3: Large Refactoring & System Migration
**Ideal for:** Architectural refactors, framework migrations, or service decoupling.

1. **`brainstorming`**: Define interface contracts, transition strategies, and parity validation criteria.
2. **`writing-plans` (Skeleton-First Mode)**: Design the thinnest end-to-end slice across all subsystems first.
3. **`using-git-worktrees`**: Establish dedicated long-lived migration worktrees.
4. **`subagent-driven-development`**: Execute phased refactoring tasks with mandatory per-task review gates.
5. **`verification-before-completion`** + **`requesting-code-review`**: Full regression verification and architectural review.
6. **`finishing-a-development-branch`**: Merge migration branch, clean up worktrees, and finalize delivery.

---

### Pipeline 4: Legacy Codebase Safety Net
**Ideal for:** Legacy codebases lacking automated test coverage or consistent patterns.

1. **`brainstorming`**: Identify critical business paths and high-risk modules.
2. **`writing-plans`**: Create a roadmap for adding characterization and boundary tests.
3. **`test-driven-development`**: Author golden-master and regression tests against existing behaviors.
4. **`systematic-debugging`**: Root-cause hidden defects surfaced while establishing test baselines.
5. **`verification-before-completion`**: Solidify automated CI test barriers.

---

## 4. Plan-Driven Skill Metadata Schema

In plans generated by `writing-plans`, specify recommended skills for each task:

```markdown
### Task 1: Implement Token Authentication Middleware
- **Goal**: Validate JWT tokens and extract user claims
- **Target Files**: `src/auth/jwt.ts`, `tests/auth/jwt.test.ts`
- **Recommended Skill**: `superpowers:test-driven-development`
- **Task Brief**:
  1. Write failing test for expired and invalid signatures (FAIL)
  2. Implement minimal signature verification (PASS)
  3. Refactor with strict type safety
```

### Controller-to-Subagent Dispatch Protocol
When the controller agent dispatches a task subagent:
1. The controller reads the `Recommended Skill` specified in the plan task.
2. The controller injects instructions or guides the subagent to load that skill via `read_skill(skill_name)`.
3. The subagent executes under the strict methodology of that skill (e.g., Red-Green-Refactor).

---

## 5. Native MCP Prompts Reference

`superpowers-mcp` provides native, ready-to-use MCP prompts across IDEs (Cursor, Antigravity, VS Code, Windsurf, Claude Desktop):

| MCP Prompt | Arguments | Purpose |
| :--- | :--- | :--- |
| **`feature-pipeline`** | `feature_name`, `requirements` | One-click orchestrator for end-to-end feature development. |
| **`structured-debug`** | `issue_description`, `failing_tests` | One-click orchestrator for systematic debugging & multi-agent investigation. |
| **`skill-composition`** | `scenario` | Dynamic skill composition recommender for feature, debug, refactor, or legacy tasks. |
| **`session-start`** | - | Injects foundational Superpowers context and skill invocation rules. |
| **`sdd-implementer`** | `brief_file`, `task_name`, ... | SDD task implementer subagent prompt template. |
| **`sdd-task-reviewer`** | `brief_file`, `report_file`, ... | SDD per-task spec & quality reviewer prompt template. |
| **`sdd-re-review`** | `brief_file`, `previous_findings`, ... | SDD fix-round scoped re-reviewer prompt template. |
| **`spec-reviewer`** | `spec_file` | Adversarial design specification reviewer prompt template. |
| **`plan-reviewer`** | `plan_file`, `spec_file` | Adversarial implementation plan reviewer prompt template. |

---

## 6. Practical Usage Guide (How to Use in Practice)

With `superpowers-mcp` installed, you **do not need to memorize or invoke 14 individual skill names manually**. Choose one of two simple ways to get started:

### Method A: One-Click via IDE MCP Prompts (Recommended)
In Cursor, Antigravity, VS Code, Claude Desktop, or Windsurf:
1. **New Feature Development**: Type `/feature-pipeline` or select `feature-pipeline` from the MCP prompts menu and provide your feature goal.
2. **Troubleshooting & Bugfixes**: Select `structured-debug` and paste the error logs or failing test names.
3. **Custom / Architecture Tasks**: Select `skill-composition` to let the AI recommend the best pipeline for your scenario.

### Method B: Natural Language Direct Instructions
Simply state the pipeline name in your prompt; the AI will load the methodology automatically:
- *"Please follow the `feature-pipeline` to build [Feature Name]."*
- *"Run the `structured-debug` workflow on this error: [Paste error / trace]."*
- *"Apply the Refactoring Pipeline from `docs/skill-compositions.md` to refactor [Module]."*

### 💬 Interactive Step-by-Step Walkthrough Example:
```text
[You]: "Please follow feature-pipeline to build a coupon code checkout system."
  ↓
[AI]: (Auto-invokes brainstorming) "Understood. Does the coupon have an expiry date, and can it stack with site-wide sales?"
  ↓
[You]: "It has an expiry date, and it cannot stack."
  ↓
[AI]: (Auto-invokes writing-plans) "Spec finalized. Created implementation plan at docs/superpowers/plans/... Please review."
  ↓
[You]: "Looks good, proceed."
  ↓
[AI]: (Auto-provisions worktree ➔ runs SDD ➔ implements tasks via TDD ➔ runs full test suite ➔ requests code review ➔ finishes branch)
  ↓
[AI]: "All tasks and full test suite passed (100%). Code review clean. Branch ready for merge!"
```
