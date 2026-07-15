const { spawn } = require("child_process");
const path = require("path");

const serverPath = path.join(__dirname, "..", "out", "server.js");
const server = spawn("node", [serverPath]);

let buffer = "";

function sendRequest(req) {
    server.stdin.write(JSON.stringify(req) + "\n");
}

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
                        console.log("--- Sample Content ---");
                        console.log(text.substring(0, 300));
                        console.log("----------------------");

                        // Close server
                        server.kill();
                        console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
                        process.exit(0);
                    }
                } else {
                    console.error("❌ read_skill failed", response);
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
