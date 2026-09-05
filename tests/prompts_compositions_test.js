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
                    text.includes("superpowers:finishing-a-development-branch")) {
                    console.log("✅ prompts/get feature-pipeline returned complete workflow with all stages");
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
                    text.includes("superpowers:finishing-a-development-branch")) {
                    console.log("✅ prompts/get structured-debug returned complete troubleshooting workflow with lifecycle completion");
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
                    console.log("🎉 ALL ADVANCED COMPOSITIONS & SECURITY PROMPT TESTS PASSED 100%!");
                    server.kill();
                    process.exit(0);
                } else {
                    console.error("❌ prompts/get unknown prompt did not return expected error:", response);
                    process.exit(1);
                }
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
