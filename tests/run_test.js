const { spawn } = require("child_process");
const path = require("path");

const serverPath = path.join(__dirname, "..", "out", "server.js");
const server = spawn("node", [serverPath]);

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
    // Keep the last partial line
    buffer = lines.pop();

    for (const line of lines) {
        if (!line.trim()) continue;
        try {
            const response = JSON.parse(line);
            console.log(`[Response] ID: ${response.id}`);

            if (response.id === 1) {
                // Initialize response
                if (response.result && response.result.serverInfo) {
                    console.log("✅ Initialize OK");
                    // Next, test list_skills
                    sendRequest({
                        jsonrpc: "2.0",
                        id: 2,
                        method: "tools/call",
                        params: {
                            name: "list_skills",
                            arguments: {}
                        }
                    });
                } else {
                    console.error("❌ Initialize failed", response);
                    process.exit(1);
                }
            } else if (response.id === 2) {
                // list_skills response
                if (response.result && response.result.content) {
                    console.log("✅ list_skills OK");
                    // Let's read a skill, e.g. "brainstorming"
                    sendRequest({
                        jsonrpc: "2.0",
                        id: 3,
                        method: "tools/call",
                        params: {
                            name: "read_skill",
                            arguments: {
                                skill_name: "brainstorming"
                            }
                        }
                    });
                } else {
                    console.error("❌ list_skills failed", response);
                    process.exit(1);
                }
            } else if (response.id === 3) {
                // read_skill response
                if (response.result && response.result.content) {
                    const text = response.result.content[0].text;
                    // Check if frontmatter was stripped
                    if (text.startsWith("---") || text.includes("name: brainstorming")) {
                        console.error("❌ read_skill failed: Frontmatter was NOT stripped!", text.substring(0, 200));
                        process.exit(1);
                    } else {
                        console.log("✅ read_skill OK (Frontmatter successfully stripped!)");
                        sendRequest({
                            jsonrpc: "2.0",
                            id: 4,
                            method: "resources/read",
                            params: { uri: "skill://superpowers/%zz" }
                        });
                    }
                } else {
                    console.error("❌ read_skill failed", response);
                    process.exit(1);
                }
            } else if (response.id === 4) {
                if (response.error && response.error.code === -32600) {
                    console.log("✅ malformed resource URI returns InvalidRequest");
                    // Test prompts/list
                    sendRequest({
                        jsonrpc: "2.0",
                        id: 5,
                        method: "prompts/list",
                        params: {}
                    });
                } else {
                    console.error("❌ malformed resource URI was not rejected", response);
                    process.exit(1);
                }
            } else if (response.id === 5) {
                if (response.result && Array.isArray(response.result.prompts) && response.result.prompts.length >= 6) {
                    console.log(`✅ prompts/list OK (${response.result.prompts.length} prompts found)`);
                    // Test prompts/get for sdd-implementer
                    sendRequest({
                        jsonrpc: "2.0",
                        id: 6,
                        method: "prompts/get",
                        params: {
                            name: "sdd-implementer",
                            arguments: {
                                brief_file: ".superpowers/sdd/briefs/task-1.md",
                                task_name: "Implement user authentication"
                            }
                        }
                    });
                } else {
                    console.error("❌ prompts/list failed", response);
                    process.exit(1);
                }
            } else if (response.id === 6) {
                if (response.result && response.result.messages && response.result.messages.length > 0) {
                    const text = response.result.messages[0].content.text;
                    if (text.includes(".superpowers/sdd/briefs/task-1.md") && text.includes("Implement user authentication")) {
                        console.log("✅ prompts/get sdd-implementer OK (placeholder interpolation verified)");
                        // Next, test plan-reviewer with spec_file
                        sendRequest({
                            jsonrpc: "2.0",
                            id: 7,
                            method: "prompts/get",
                            params: {
                                name: "plan-reviewer",
                                arguments: {
                                    plan_file: "docs/plans/2026-09-05-auth.md",
                                    spec_file: "docs/specs/2026-09-05-auth-spec.md"
                                }
                            }
                        });
                    } else {
                        console.error("❌ prompts/get output missing expected arguments", text);
                        process.exit(1);
                    }
                } else {
                    console.error("❌ prompts/get failed", response);
                    process.exit(1);
                }
            } else if (response.id === 7) {
                if (response.result && response.result.messages && response.result.messages.length > 0) {
                    const text = response.result.messages[0].content.text;
                    if (text.includes("docs/plans/2026-09-05-auth.md") && text.includes("docs/specs/2026-09-05-auth-spec.md")) {
                        console.log("✅ prompts/get plan-reviewer OK (spec_file & plan_file interpolation verified)");
                        server.kill();
                        console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
                        process.exit(0);
                    } else {
                        console.error("❌ plan-reviewer prompt output missing spec/plan files", text);
                        process.exit(1);
                    }
                } else {
                    console.error("❌ prompts/get plan-reviewer failed", response);
                    process.exit(1);
                }
            }
        } catch (e) {
            console.error("Failed to parse JSON response:", line, e);
        }
    }
});

server.stderr.on("data", (data) => {
    console.error(`[Server Stderr] ${data.toString()}`);
});

server.on("close", (code) => {
    if (code !== 0 && code !== null) {
        console.error(`Server process exited with code ${code}`);
        process.exit(1);
    }
});

// Start by sending initialize request
setTimeout(() => {
    sendRequest({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: {
                name: "test-client",
                version: "1.0"
            }
        }
    });
}, 500);
