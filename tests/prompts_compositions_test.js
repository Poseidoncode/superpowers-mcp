const { spawn } = require("child_process");
const path = require("path");

const serverPath = path.join(__dirname, "..", "out", "server.js");
const server = spawn("node", [serverPath]);
server.stdout.setEncoding("utf8");

server.on("error", (err) => {
    console.error("❌ Failed to start server child process:", err);
    process.exit(1);
});

server.on("exit", (code, signal) => {
    if (code !== 0 && code !== null) {
        console.error(`❌ Server exited prematurely with code ${code}, signal ${signal}`);
        process.exit(1);
    }
});

let buffer = "";

function sendRequest(req) {
    server.stdin.write(JSON.stringify(req) + "\n");
}

const watchdog = setTimeout(() => {
    console.error("❌ Test timed out after 10 seconds");
    server.kill();
    process.exit(1);
}, 10000);
watchdog.unref();

server.stdout.on("data", (data) => {
    buffer += data.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
        if (!line.trim()) continue;
        try {
            const response = JSON.parse(line);

            if (response.id === 1) {
                if (response.result && response.result.serverInfo) {
                    console.log("✅ Initialize OK");
                    sendRequest({
                        jsonrpc: "2.0",
                        id: 2,
                        method: "prompts/list",
                        params: {}
                    });
                } else {
                    console.error("❌ Initialize failed", response);
                    process.exit(1);
                }
            } else if (response.id === 2) {
                const prompts = response.result?.prompts || [];
                const promptNames = prompts.map(p => p.name);
                console.log("Registered prompts:", promptNames);

                const required = ["feature-pipeline", "structured-debug", "skill-composition"];
                const missing = required.filter(r => !promptNames.includes(r));
                if (missing.length > 0) {
                    console.error("❌ Missing prompts in prompts/list:", missing);
                    process.exit(1);
                }
                console.log("✅ prompts/list includes all new workflow prompts");

                // The SDD reviewer prompts must declare the review-file contract.
                const argNames = (name) => (prompts.find((p) => p.name === name)?.arguments || []).map((a) => a.name);
                const missingArgs = [
                    ["sdd-task-reviewer", "review_file"],
                    ["sdd-re-review", "review_file"],
                    ["sdd-re-review", "fix_base_sha"]
                ].filter(([prompt, arg]) => !argNames(prompt).includes(arg));
                if (missingArgs.length > 0) {
                    console.error("❌ Missing declared prompt arguments:", missingArgs);
                    process.exit(1);
                }
                console.log("✅ prompts/list declares the SDD review-file arguments");

                const featureNameArg = prompts
                    .find((p) => p.name === "feature-pipeline")
                    ?.arguments?.find((arg) => arg.name === "feature_name");
                if (!featureNameArg?.required) {
                    console.error("❌ feature-pipeline must require feature_name");
                    process.exit(1);
                }
                console.log("✅ feature-pipeline requires feature_name");

                // Test feature-pipeline get
                sendRequest({
                    jsonrpc: "2.0",
                    id: 3,
                    method: "prompts/get",
                    params: {
                        name: "feature-pipeline",
                        arguments: {
                            feature_name: "OAuth2 SSO Integration",
                            requirements: "Must support Google and GitHub providers with PKCE"
                        }
                    }
                });
            } else if (response.id === 3) {
                const text = response.result?.messages?.[0]?.content?.text || "";
                if (text.includes("OAuth2 SSO Integration") && 
                    text.includes("superpowers:brainstorming") && 
                    text.includes("superpowers:writing-plans") && 
                    text.includes("superpowers:using-git-worktrees") &&
                    text.includes("superpowers:subagent-driven-development") &&
                    text.includes("superpowers:test-driven-development") &&
                    text.includes("superpowers:verification-before-completion") &&
                    text.includes("superpowers:requesting-code-review") &&
                    text.includes("superpowers:finishing-a-development-branch") &&
                    text.includes('read_skill({"skill_name":"brainstorming"})') &&
                    text.includes('read_skill({"skill_name":"executing-plans"})') &&
                    text.includes("does not execute the stages server-side") &&
                    text.includes("wait for explicit user approval") &&
                    text.includes("when the host provides multi-agent tools")) {
                    console.log("✅ prompts/get feature-pipeline returned an actionable interactive workflow");
                } else {
                    console.error("❌ prompts/get feature-pipeline content mismatch:", text);
                    process.exit(1);
                }

                // Test structured-debug get
                sendRequest({
                    jsonrpc: "2.0",
                    id: 4,
                    method: "prompts/get",
                    params: {
                        name: "structured-debug",
                        arguments: {
                            issue_description: "Memory leak in event emitter pool",
                            failing_tests: "tests/emitter.test.ts"
                        }
                    }
                });
            } else if (response.id === 4) {
                const text = response.result?.messages?.[0]?.content?.text || "";
                if (text.includes("Memory leak in event emitter pool") &&
                    text.includes("superpowers:systematic-debugging") &&
                    text.includes("superpowers:using-git-worktrees") &&
                    text.includes("superpowers:dispatching-parallel-agents") &&
                    text.includes("superpowers:test-driven-development") &&
                    text.includes("superpowers:verification-before-completion") &&
                    text.includes("superpowers:requesting-code-review") &&
                    text.includes("superpowers:receiving-code-review") &&
                    text.includes("superpowers:finishing-a-development-branch") &&
                    text.includes('read_skill({"skill_name":"systematic-debugging"})') &&
                    text.includes("Otherwise investigate hypotheses sequentially") &&
                    text.includes("does not execute the stages server-side")) {
                    console.log("✅ prompts/get structured-debug returned an actionable interactive workflow");
                } else {
                    console.error("❌ prompts/get structured-debug content mismatch:", text);
                    process.exit(1);
                }

                // Test skill-composition get
                sendRequest({
                    jsonrpc: "2.0",
                    id: 5,
                    method: "prompts/get",
                    params: {
                        name: "skill-composition",
                        arguments: {
                            scenario: "Refactoring legacy authentication subsystem"
                        }
                    }
                });
            } else if (response.id === 5) {
                const text = response.result?.messages?.[0]?.content?.text || "";
                if (text.includes("Refactoring legacy authentication subsystem") &&
                    text.includes("Recommended Pipeline Focus:") &&
                    text.includes("Pipeline 3 (Large Refactoring & System Migration)") &&
                    text.includes("New Feature Development") &&
                    text.includes("Structured Debugging") &&
                    text.includes("Large Refactoring") &&
                    text.includes("Legacy Codebase Safety Net")) {
                    console.log("✅ prompts/get skill-composition returned comprehensive guide with dynamic scenario focus");

                    // Test prompt whitespace and empty args robustness
                    sendRequest({
                        jsonrpc: "2.0",
                        id: 6,
                        method: "prompts/get",
                        params: {
                            name: "feature-pipeline",
                            arguments: {
                                feature_name: "   ",
                                requirements: "   "
                            }
                        }
                    });
                } else {
                    console.error("❌ prompts/get skill-composition content mismatch:", text);
                    process.exit(1);
                }
            } else if (response.id === 6) {
                const text = response.result?.messages?.[0]?.content?.text || "";
                if (text.includes("(Unspecified feature)") && !text.includes("Requirements / Context")) {
                    console.log("✅ prompts/get whitespace argument trimming & fallback verified");

                    // Test 7: Cascading template interpolation protection
                    sendRequest({
                        jsonrpc: "2.0",
                        id: 7,
                        method: "prompts/get",
                        params: {
                            name: "sdd-implementer",
                            arguments: {
                                brief_file: "path/with/[task name]/in/name.md",
                                task_name: "REAL_TASK_NAME"
                            }
                        }
                    });
                } else {
                    console.error("❌ prompts/get whitespace robustness check failed:", text);
                    process.exit(1);
                }
            } else if (response.id === 7) {
                const text = response.result?.messages?.[0]?.content?.text || "";
                if (text.includes("path/with/[task name]/in/name.md")) {
                    console.log("✅ prompts/get cascading template placeholder injection protection verified");

                    // Test 8: Negative test (Unknown prompt returns InvalidRequest error)
                    sendRequest({
                        jsonrpc: "2.0",
                        id: 8,
                        method: "prompts/get",
                        params: {
                            name: "non-existent-pipeline",
                            arguments: {}
                        }
                    });
                } else {
                    console.error("❌ prompts/get cascading template injection occurred!", text);
                    process.exit(1);
                }
            } else if (response.id === 8) {
                if (response.error && (response.error.code === -32600 || response.error.code === -32602)) {
                    console.log(`✅ prompts/get unknown prompt returns InvalidRequest error (${response.error.code})`);

                    // Test 9: SDD task reviewer writes its full report to a review
                    // file and returns a short contract (upstream PR #1966). The path
                    // is derived from the report file when the caller omits it.
                    sendRequest({
                        jsonrpc: "2.0",
                        id: 9,
                        method: "prompts/get",
                        params: {
                            name: "sdd-task-reviewer",
                            arguments: {
                                brief_file: "/tmp/task-9-brief.md",
                                report_file: "/tmp/task-9-report.md",
                                diff_file: "/tmp/task-9-diff.md",
                                global_constraints: "Global constraints",
                                model: "reviewer-model"
                            }
                        }
                    });
                } else {
                    console.error("❌ prompts/get unknown prompt did not return expected error:", response);
                    process.exit(1);
                }
            } else if (response.id === 9) {
                const text = response.result?.messages?.[0]?.content?.text || "";
                const checks = [
                    ["derived review file path", text.includes("/tmp/task-9-review.md")],
                    ["review-file report format", text.includes("## Report Format")],
                    ["short final message contract", text.includes("under 15 lines")],
                    ["output format is the review file", text.includes("## Output Format (the review file)")],
                    ["no unresolved placeholder", !text.includes("[REVIEW_FILE]")]
                ];
                const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
                if (failed.length > 0) {
                    console.error("❌ prompts/get sdd-task-reviewer review-file contract failed:", failed);
                    process.exit(1);
                }
                console.log("✅ prompts/get sdd-task-reviewer writes its full report to a review file");

                // Test 10: the scoped re-review appends to the same review file.
                sendRequest({
                    jsonrpc: "2.0",
                    id: 10,
                    method: "prompts/get",
                    params: {
                        name: "sdd-re-review",
                        arguments: {
                            brief_file: "/tmp/task-9-brief.md",
                            report_file: "/tmp/task-9-report.md",
                            diff_file: "/tmp/task-9-diff.md",
                            previous_findings: "1) Magic number",
                            model: "reviewer-model"
                        }
                    }
                });
            } else if (response.id === 10) {
                const text = response.result?.messages?.[0]?.content?.text || "";
                if (text.includes("/tmp/task-9-review.md") && text.includes("### Round <N>")) {
                    console.log("✅ prompts/get sdd-re-review appends its verdicts to the review file");

                    // Test 11: an explicitly named review file is honoured.
                    sendRequest({
                        jsonrpc: "2.0",
                        id: 11,
                        method: "prompts/get",
                        params: {
                            name: "sdd-task-reviewer",
                            arguments: {
                                brief_file: "/tmp/task-11-brief.md",
                                report_file: "/tmp/task-11-report.md",
                                review_file: "/tmp/where-the-review-goes.md",
                                model: "reviewer-model"
                            }
                        }
                    });
                } else {
                    console.error("❌ prompts/get sdd-re-review review-file append contract failed:", text);
                    process.exit(1);
                }
            } else if (response.id === 11) {
                const text = response.result?.messages?.[0]?.content?.text || "";
                if (text.includes("/tmp/where-the-review-goes.md") && !text.includes("[REVIEW_FILE]")) {
                    console.log("✅ prompts/get sdd-task-reviewer honours an explicitly named review file");

                    // Test 12: a review file equal to the report file must be refused,
                    // so a reviewer can never overwrite the implementer's report.
                    sendRequest({
                        jsonrpc: "2.0",
                        id: 12,
                        method: "prompts/get",
                        params: {
                            name: "sdd-task-reviewer",
                            arguments: {
                                brief_file: "/tmp/task-12-brief.md",
                                report_file: "/tmp/task-12-report.md",
                                review_file: "/tmp/task-12-report.md",
                                model: "reviewer-model"
                            }
                        }
                    });
                } else {
                    console.error("❌ prompts/get explicit review_file was not honoured:", text.slice(0, 400));
                    process.exit(1);
                }
            } else if (response.id === 12) {
                const text = response.result?.messages?.[0]?.content?.text || "";
                const target = (text.match(/Write your full report to ([^\s`]+)/) || [])[1] || "";
                if (target === "/tmp/task-12-review.md") {
                    console.log("✅ prompts/get substitutes the derived review file for review_file == report_file");

                    // Test 13: the report file spelled with a ./ segment. Path
                    // normalisation must keep it from addressing the report.
                    sendRequest({
                        jsonrpc: "2.0",
                        id: 13,
                        method: "prompts/get",
                        params: {
                            name: "sdd-task-reviewer",
                            arguments: {
                                brief_file: "/tmp/task-13-brief.md",
                                report_file: "/tmp/task-13-report.md",
                                review_file: "/tmp/./task-13-report.md",
                                model: "reviewer-model"
                            }
                        }
                    });
                } else {
                    console.error("❌ prompts/get did not substitute review_file == report_file (target:", target, ")");
                    process.exit(1);
                }
            } else if (response.id === 13) {
                const text = response.result?.messages?.[0]?.content?.text || "";
                const target = (text.match(/Write your full report to ([^\s`]+)/) || [])[1] || "";
                if (target === "/tmp/task-13-review.md") {
                    console.log("✅ prompts/get normalises the path before the review-file identity check");

                    // Test 14: a review file equal to the brief file is substituted
                    // as well, not just the report file.
                    sendRequest({
                        jsonrpc: "2.0",
                        id: 14,
                        method: "prompts/get",
                        params: {
                            name: "sdd-task-reviewer",
                            arguments: {
                                brief_file: "/tmp/task-14-brief.md",
                                report_file: "/tmp/task-14-report.md",
                                review_file: "/tmp/task-14-brief.md",
                                model: "reviewer-model"
                            }
                        }
                    });
                } else {
                    console.error("❌ prompts/get honoured a normalised review_file that resolves to the report file (target:", target, ")");
                    process.exit(1);
                }
            } else if (response.id === 14) {
                const text = response.result?.messages?.[0]?.content?.text || "";
                const target = (text.match(/Write your full report to ([^\s`]+)/) || [])[1] || "";
                if (target === "/tmp/task-14-review.md") {
                    console.log("✅ prompts/get substitutes the derived review file for review_file == brief_file");
                    sendRequest({
                        jsonrpc: "2.0",
                        id: 15,
                        method: "tools/call",
                        params: {
                            name: "read_skill",
                            arguments: { skill_name: "superpowers:brainstorming" }
                        }
                    });
                    continue;
                }
                console.error("❌ prompts/get did not substitute review_file == brief_file (target:", target, ")");
                process.exit(1);
            } else if (response.id === 15) {
                const text = response.result?.content?.[0]?.text || "";
                if (text.includes("# Skill: brainstorming")) {
                    console.log("✅ read_skill accepts the documented superpowers: prefix");
                    console.log("🎉 ALL ADVANCED COMPOSITIONS & SECURITY PROMPT TESTS PASSED 100%!");
                    server.kill();
                    process.exit(0);
                }
                console.error("❌ read_skill did not normalize the superpowers: prefix:", response);
                process.exit(1);
            }
        } catch (err) {
            console.error("JSON parse error:", err, line);
            process.exit(1);
        }
    }
});

server.stderr.on("data", (data) => {
    // ignore or log
});

// Start with Initialize
sendRequest({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test-client", version: "1.0" }
    }
});
