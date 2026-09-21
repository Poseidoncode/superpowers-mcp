const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { SkillsManager } = require("../out/skills-manager.js");

const SKILLS_DIR = path.join(__dirname, "..", "skills");
const readSkill = (name) => fs.readFileSync(path.join(SKILLS_DIR, name, "SKILL.md"), "utf-8");
const readSkillFile = (name, relPath) => fs.readFileSync(path.join(SKILLS_DIR, name, relPath), "utf-8");

const failures = [];

function check(label, fn) {
    try {
        fn();
        console.log(`  ✅ Test ${label} Passed!`);
    } catch (err) {
        failures.push(`${label}: ${err.message}`);
        console.error(`  ❌ Test ${label} Failed: ${err.message}`);
    }
}

function expectContains(file, needle) {
    assert.ok(file.includes(needle), `missing content: ${needle}`);
}

async function runUpstreamSyncTests() {
    console.log("🧪 Starting Upstream Sync Regression Tests (Batches 1–4, v6.4.1)...\n");

    // Batch 1 guards the skill content adopted from obra/superpowers PRs
    // #2229, #2263, #2265, #2270 and #2237; Batch 2 the dev intent gates
    // (3b4f2ca, 069edf3) and PR #2271; Batch 3 the remote-safety boundary
    // (#2228), Discoveries ledger (#2274), deferred-findings export (#2255),
    // greenfield SDD scripts (#2276) and the TDD characterization guard
    // (#2196). A later sync or refactor must not silently drop any of it.
    //
    // Batch 4 (content sync only, no harness work) adds the brainstorm host
    // env defaults (#2262), writing-skills link re-resolution (#2259) and the
    // SDD review-file contract (#1966).
    //
    // The v6.4.1 sync (upstream main@5bf4e78, PR #2338) adopts native inline
    // plan execution, the review-behavior alignment, the new tool refs, the
    // interpreter-invocation guidance, and diagnosing-superpowers.

    // Test 1: PR #2229 — typed trigger phrases and sibling cross-routes
    const debugging = readSkill("systematic-debugging");
    const tdd = readSkill("test-driven-development");

    check("1a (PR #2229: systematic-debugging description)", () => {
        expectContains(debugging, 'including when you say "systematic debug"');
        expectContains(debugging, '"find the root cause first"');
        expectContains(debugging, "use test-driven-development instead");
    });

    check("1b (PR #2229: test-driven-development description)", () => {
        expectContains(tdd, 'including when you say "tdd"');
        expectContains(tdd, '"red green refactor"');
        expectContains(tdd, "use systematic-debugging instead");
    });

    // Test 2: PR #2270 — evidence law for work with no test command
    const verification = readSkill("verification-before-completion");

    check("2a (PR #2270: no-test-command description scope)", () => {
        expectContains(
            verification,
            "for work with no test command (reports, research, recipes, correspondence, audits)"
        );
    });

    check("2b (PR #2270: no-test-command section)", () => {
        expectContains(verification, "## When There Is No Test Command");
        expectContains(verification, "Prove whatever CAN be proven");
        expectContains(verification, "For everything else, account for the request in full");
        expectContains(verification, "Four of five things done is not");
        expectContains(verification, "that the work is *complete*, not that it is *right*");
    });

    // Test 3: PR #2263 — a request for context does not close the open question
    check("3 (PR #2263: brainstorming open question)", () => {
        expectContains(readSkill("brainstorming"), "A request for context is not an answer");
    });

    // Test 4: PR #2265 — plan-specific execution handoff recommendation
    check("4 (PR #2265: contextual execution handoff)", () => {
        const plans = readSkill("writing-plans");
        expectContains(plans, "Recommended for this plan: [pick one]");
        expectContains(plans, "**Subagent-driven** when tasks are largely independent");
        expectContains(plans, "**Inline** when tasks share interfaces/state");
        expectContains(plans, "Never default to one without looking");
    });

    // Test 5: PR #2237 — completion bookkeeping ticks the plan file
    check("5 (PR #2237: plan checkbox bookkeeping)", () => {
        const executing = readSkill("executing-plans");
        expectContains(executing, "the todo **and** the plan file");
        expectContains(executing, "never tick one you skipped");

        const sdd = readSkill("subagent-driven-development");
        expectContains(sdd, "edit the plan file and flip this task's steps");
        expectContains(sdd, "None of them ever opens the plan.");
    });

    // Test 6: the fork's frontmatter parser must surface clean descriptions —
    // upstream ships escaped quotes, which this fork stores as YAML plain
    // scalars so MCP clients never see literal backslashes.
    try {
        const manager = new SkillsManager(SKILLS_DIR);
        const skills = await manager.listSkills(true);
        const byName = new Map(skills.map((s) => [s.name, s.description]));

        check("6 (SkillsManager description pipeline)", () => {
            const expected = [
                ["systematic-debugging", '"systematic debug"'],
                ["test-driven-development", '"red green refactor"'],
                [
                    "verification-before-completion",
                    "no test command (reports, research, recipes, correspondence, audits)",
                ],
                ["diagnosing-superpowers", '"it took too long"'],
            ];
            for (const [name, needle] of expected) {
                const description = byName.get(name);
                assert.ok(description, `${name} must be discoverable through listSkills`);
                assert.ok(description.includes(needle), `${name} description must contain: ${needle}`);
                assert.ok(!description.includes('\\"'), `${name} description must not leak escaped quotes`);
            }
        });
    } catch (err) {
        failures.push(`6 (SkillsManager description pipeline): ${err.message}`);
        console.error(`  ❌ Test 6 Failed: ${err.message}`);
    }

    // Test 7: dev 3b4f2ca (PR #2258) — establish shared intent before design
    check("7 (dev intent gates: brainstorming shared understanding)", () => {
        const brain = readSkill("brainstorming");
        expectContains(brain, "## Establish Shared Understanding");
        expectContains(brain, "**Discover intent.**");
        expectContains(brain, "**Write back your understanding.**");
        expectContains(brain, "**Carry intent into the design.**");
        expectContains(brain, "A reply approves the stage actually presented.");
        expectContains(brain, "at the earliest incomplete stage");
        expectContains(brain, "Spike: the human partner approves the question and probe.");
    });

    // Test 8: PR #2271 — planning-handoff review replaces the spec self-review
    check("8 (PR #2271: planning-handoff review)", () => {
        const brain = readSkill("brainstorming");
        expectContains(brain, "**Planning-Handoff Review:**");
        expectContains(brain, "planning-handoff readiness from 0.0–9.9");
        expectContains(brain, "burden ledger");
        expectContains(brain, "**minor (1):**");
        expectContains(brain, "**major (2):**");
        expectContains(brain, "never grants permission to begin planning");
        // Fork-local refinement (see CHANGELOG): the selected draft must be committed.
        expectContains(brain, "commit the selected draft");
        // The handoff node must exist as the declaration AND both graph edges - a
        // bare substring check would stay green if the edges were dropped.
        expectContains(brain, '(rate; burden ledger; bounded branch)" [shape=box];');
        expectContains(brain, '"Write design doc" -> "Planning-handoff review');
        expectContains(brain, '(rate; burden ledger; bounded branch)" -> "User reviews spec?"');
        assert.strictEqual(
            brain.split("(rate; burden ledger; bounded branch)").length - 1,
            3,
            "planning-handoff node must appear as the declaration and both edges"
        );
        assert.ok(!brain.includes("**Spec Self-Review:**"), "legacy Spec Self-Review block must be replaced");
    });

    // Test 9: dev 069edf3 — the saved plan is reviewed before execution
    check("9 (dev: saved-plan review gate in writing-plans)", () => {
        const plans = readSkill("writing-plans");
        expectContains(plans, "After saving and self-reviewing the plan, link it for your human partner");
        expectContains(plans, "**When no execution method has already been supplied:**");
        expectContains(plans, "Please review the plan. Two execution options:");
        expectContains(plans, "**When an execution method has already been supplied:**");
        expectContains(plans, "Please review the plan. Does it capture what you want?");
    });

    // Test 10: PR #2228 — remote-safety boundary in the git-workflow skills
    check("10 (PR #2228: remote-safety boundary)", () => {
        const executing = readSkill("executing-plans");
        expectContains(executing, "Commits stay local — no push/pull/fetch unless the plan or your human partner says so");
        expectContains(executing, "Never rewrite a shared branch (`git push --force*` to main/dev/production)");

        const worktrees = readSkill("using-git-worktrees");
        expectContains(worktrees, "--no-track is REQUIRED, not optional");
        expectContains(worktrees, "git branch --unset-upstream");
        expectContains(worktrees, "Tracking the base ref is expected — I branched from it");

        const implementer = readSkillFile("subagent-driven-development", "implementer-prompt.md");
        expectContains(implementer, "## Your Git Work Stays Local");
        expectContains(implementer, "report BLOCKED quoting it verbatim");
    });

    // Test 11: PR #2274 — ledger Discoveries carry cross-task findings
    check("11 (PR #2274: Discoveries ledger)", () => {
        const sdd = readSkill("subagent-driven-development");
        expectContains(sdd, "reads the ledger's `## Discoveries`");
        expectContains(sdd, "read them from the ledger's Discoveries section, not from your");
        expectContains(sdd, "Copy the task's Discoveries into the ledger in the same message");
        expectContains(sdd, "[Ledger: Discoveries — Task 1: hooks dir must be created before install; none other]");

        const implementer = readSkillFile("subagent-driven-development", "implementer-prompt.md");
        expectContains(implementer, "**Discoveries for later tasks:**");
    });

    // Test 12: PR #2255 — deferred findings exported before workspace deletion
    check("12 (PR #2255: deferred findings export)", () => {
        const sdd = readSkill("subagent-driven-development");
        expectContains(sdd, "Rulings are not the only content that dies with the workspace.");
        expectContains(sdd, "docs/superpowers/follow-ups/<plan-basename>.md");
        expectContains(sdd, "The export, not git history, is the record");
        expectContains(sdd, "Finish path resolved: export deferred findings to its durable artifact");

        const finishing = readSkill("finishing-a-development-branch");
        expectContains(finishing, "deferred findings first: carry every ledger line tagged");
        expectContains(finishing, 'a "Deferred items" checklist carrying every ledger line tagged');
    });

    // Test 13: PR #2276 — SDD scripts survive a greenfield (no repo yet) plan
    check("13 (PR #2276: greenfield SDD scripts)", () => {
        const workspace = readSkillFile("subagent-driven-development", "scripts/sdd-workspace");
        expectContains(workspace, "no git repository yet, using $root/.superpowers/sdd");

        const review = readSkillFile("subagent-driven-development", "scripts/review-package");
        expectContains(review, "error: not a git repository — review-package needs the BASE and HEAD commits");

        const workspacePs1 = readSkillFile("subagent-driven-development", "scripts/sdd-workspace.ps1");
        expectContains(workspacePs1, "no git repository yet, using $root/.superpowers/sdd");
        expectContains(workspacePs1, '$base = Join-Path $rootPhys ".superpowers/sdd"');

        const reviewPs1 = readSkillFile("subagent-driven-development", "scripts/review-package.ps1");
        expectContains(reviewPs1, "not a git repository — review-package needs the BASE and HEAD commits");
    });

    // Test 14: PR #2196 — characterization guard for behavior-preserving refactors
    check("14 (PR #2196: characterization guard)", () => {
        const tdd = readSkill("test-driven-development");
        expectContains(tdd, "### Characterization Test for a Behavior-Preserving Refactor");
        expectContains(tdd, "git restore --source=HEAD --worktree -- <production-paths>");
        expectContains(tdd, "[characterization guard](#characterization-test-for-a-behavior-preserving-refactor)");
        expectContains(tdd, "- Test for new or changed behavior passes immediately");

        const good = readSkillFile("test-driven-development", "writing-good-tests.md");
        expectContains(good, "[characterization guard](SKILL.md#characterization-test-for-a-behavior-preserving-refactor)");
        expectContains(good, "run the actual mutation and");
    });

    // Test 15: PR #2262 — the start scripts take their host defaults from
    // BRAINSTORM_HOST / BRAINSTORM_URL_HOST; flags still win because the
    // defaults are applied before argument parsing.
    check("15a (PR #2262: start-server.sh host defaults)", () => {
        const sh = readSkillFile("brainstorming", "scripts/start-server.sh");
        expectContains(sh, 'BIND_HOST="${BRAINSTORM_HOST:-127.0.0.1}"');
        expectContains(sh, 'URL_HOST="${BRAINSTORM_URL_HOST:-}"');
        const parseLoop = sh.indexOf('while [[ $# -gt 0 ]]; do');
        assert.ok(parseLoop > 0, "start-server.sh argument parser not found");
        assert.ok(sh.indexOf("BRAINSTORM_HOST:-127.0.0.1") < parseLoop, "env defaults must be applied before flag parsing so flags win");
    });

    check("15b (PR #2262: start-server.ps1 parity)", () => {
        const ps1 = readSkillFile("brainstorming", "scripts/start-server.ps1");
        expectContains(ps1, 'if ($env:BRAINSTORM_HOST) { $bindHost = $env:BRAINSTORM_HOST }');
        expectContains(ps1, 'if ($env:BRAINSTORM_URL_HOST) { $urlHost = $env:BRAINSTORM_URL_HOST }');
        const parseLoop = ps1.indexOf('for ($i = 0; $i -lt $args.Count; $i++)');
        assert.ok(parseLoop > 0, "start-server.ps1 argument parser not found");
        assert.ok(ps1.indexOf('$env:BRAINSTORM_HOST') < parseLoop, "env defaults must be applied before flag parsing so flags win");
    });

    // Test 16: PR #2259 — moving content into a skill re-resolves its links
    check("16 (PR #2259: moved content re-resolves relative links)", () => {
        const writingSkills = readSkill("writing-skills");
        expectContains(writingSkills, "### Moving Content Into a Skill");
        expectContains(writingSkills, "Re-resolve links mechanically, never by counting `../` by eye:");
        expectContains(writingSkills, "No link checker can catch this - only reading can.");
        expectContains(writingSkills, "Content moved from another file: every relative link re-resolved");
    });

    // Test 17: PR #1966 — the task reviewer writes a review file and returns
    // a short contract; fix subagents and re-reviews read/append that file.
    check("17a (PR #1966: SDD SKILL.md review-file contract)", () => {
        const sdd = readSkill("subagent-driven-development");
        expectContains(sdd, "the task reviewer gets four paths");
        expectContains(sdd, "- **Review file:** the reviewer writes its full report there");
        expectContains(sdd, "Don't read the review file during the loop");
        expectContains(sdd, "copy\n  each one-liner from the review file's Minor section");
        expectContains(sdd, "Dispatch fix subagents for Critical and Important findings, passing the");
        expectContains(sdd, "(brief `…/task-N-brief.md` → review `…/task-N-review.md`)");
        expectContains(sdd, "Full report: task-1-review.md");
    });

    check("17b (PR #1966: task-reviewer prompt writes the review file)", () => {
        const prompt = readSkillFile("subagent-driven-development", "task-reviewer-prompt.md");
        expectContains(prompt, "## Report Format");
        expectContains(prompt, "Write your full report to [REVIEW_FILE]");
        expectContains(prompt, "Minor findings: count only");
        expectContains(prompt, "## Output Format (the review file)");
        expectContains(prompt, "**Reviewer returns:** full report in `[REVIEW_FILE]`; final message under");
    });

    check("17c (PR #1966: re-review appends to the review file)", () => {
        const reReview = readSkillFile("subagent-driven-development", "re-review-prompt.md");
        expectContains(reReview, "Append this round's verdicts to [REVIEW_FILE]");
        expectContains(reReview, "appended to `[REVIEW_FILE]`, with a short final message");
    });

    // Test 18: v6.4.1 (upstream #2338) — native plan execution, review
    // behavior, tool refs, interpreter invocation, diagnosing-superpowers.
    check("18a (v6.4.1: native executing-plans)", () => {
        const executing = readSkill("executing-plans");
        expectContains(executing, "Rulings, not stalls");
        expectContains(executing, "Do not pause to check in with your human partner");
        expectContains(executing, "scripts/task-start PLAN_FILE N");
        expectContains(executing, "scripts/task-done PLAN_FILE N BASE");
    });

    check("18b (v6.4.1: task-start / task-done ship)", () => {
        const start = readSkillFile("executing-plans", "scripts/task-start");
        expectContains(start, "task-start PLAN_FILE TASK_NUMBER");
        expectContains(start, "base: $(git rev-parse HEAD)");
        const done = readSkillFile("executing-plans", "scripts/task-done");
        expectContains(done, "task-done PLAN_FILE TASK_NUMBER BASE -- TEST_COMMAND");
        expectContains(done, "Task $n: complete");
    });

    check("18c (v6.4.1: review behavior)", () => {
        const reviewer = readSkillFile("requesting-code-review", "code-reviewer.md");
        expectContains(reviewer, "## Declined to judge");
        expectContains(reviewer, "judge by what a reasonable person using this");
        expectContains(readSkill("requesting-code-review"), "git merge-base origin/main HEAD");
    });

    check("18d (v6.4.1: plan Review Focus)", () => {
        const plans = readSkill("writing-plans");
        expectContains(plans, "## Review Focus");
        expectContains(plans, "**4. Review Focus:**");
        expectContains(plans, "For this plan I recommend <one of the two>");
    });

    check("18e (v6.4.1: interpreter invocation + tool refs)", () => {
        const sdd = readSkill("subagent-driven-development");
        expectContains(sdd, "bash scripts/sdd-workspace PLAN_FILE");
        expectContains(sdd, "bash scripts/review-package PLAN_FILE BASE HEAD");
        const using = readSkill("using-superpowers");
        expectContains(using, "references/claude-code-tools.md");
        expectContains(using, "references/muse-tools.md");
        expectContains(readSkill("writing-skills"), "Invoke bundled scripts through their interpreter");
        expectContains(readSkillFile("brainstorming", "visual-companion.md"), "bash scripts/start-server.sh");
        expectContains(readSkillFile("systematic-debugging", "root-cause-tracing.md"), "bash ./find-polluter.sh");
    });

    check("18f (v6.4.1: diagnosing-superpowers)", () => {
        const diagnosing = readSkill("diagnosing-superpowers");
        expectContains(diagnosing, "Every finding cites `path:line`");
        expectContains(diagnosing, "prompts/analyst-common.md");
        expectContains(diagnosing, "## Hard rules");
    });

    if (failures.length > 0) {
        throw new Error(`${failures.length} upstream sync assertion(s) failed:\n- ${failures.join("\n- ")}`);
    }

    console.log("\n🎉 ALL UPSTREAM SYNC REGRESSION TESTS PASSED!");
}

runUpstreamSyncTests().catch((err) => {
    console.error("❌ Test Failed:", err);
    process.exit(1);
});
