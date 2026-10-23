const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const serverPath = path.join(__dirname, "..", "out", "server.js");
const tmpSkillsDir = path.join(__dirname, "tmp_trunc_skills");
const MAX_INLINE = 20000;

function runMcpRoundtrip(env) {
    return new Promise((resolve, reject) => {
        const server = spawn("node", [serverPath], { env: { ...process.env, ...env } });
        let buffer = "";
        let step = 0;
        const timeout = setTimeout(() => {
            server.kill();
            reject(new Error("MCP truncation test timed out"));
        }, 15000);

        const fail = (err) => {
            clearTimeout(timeout);
            server.kill();
            reject(err);
        };

        server.stdout.on("data", (data) => {
            buffer += data.toString();
            const lines = buffer.split("\n");
            buffer = lines.pop();
            for (const line of lines) {
                if (!line.trim()) continue;
                let response;
                try {
                    response = JSON.parse(line);
                } catch {
                    continue;
                }
                if (response.id === 1 && step === 0) {
                    step = 1;
                    server.stdin.write(
                        JSON.stringify({
                            jsonrpc: "2.0",
                            id: 2,
                            method: "tools/call",
                            params: { name: "read_skill", arguments: { skill_name: "huge-trunc" } },
                        }) + "\n"
                    );
                } else if (response.id === 2 && step === 1) {
                    clearTimeout(timeout);
                    server.kill();
                    if (response.error) {
                        fail(new Error(`read_skill failed: ${JSON.stringify(response.error)}`));
                        return;
                    }
                    const text = response.result?.content?.[0]?.text ?? "";
                    resolve(text);
                }
            }
        });

        server.stderr.on("data", () => {});

        server.stdin.write(
            JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "initialize",
                params: {
                    protocolVersion: "2024-11-05",
                    capabilities: {},
                    clientInfo: { name: "truncation-test", version: "1.0" },
                },
            }) + "\n"
        );
    });
}

async function main() {
    if (fs.existsSync(tmpSkillsDir)) {
        fs.rmSync(tmpSkillsDir, { recursive: true, force: true });
    }
    const skillDir = path.join(tmpSkillsDir, "huge-trunc");
    fs.mkdirSync(skillDir, { recursive: true });
    const body = "x".repeat(MAX_INLINE + 5000);
    fs.writeFileSync(
        path.join(skillDir, "SKILL.md"),
        `---\nname: huge-trunc\ndescription: truncation test\n---\n${body}`,
        "utf-8"
    );

    const text = await runMcpRoundtrip({ SKILLS_PATH: tmpSkillsDir });
    assert.ok(text.includes("skill content truncated"), "read_skill must truncate oversized skill bodies");
    assert.ok(text.length < body.length + 500, "truncated response must be shorter than the source body");

    fs.rmSync(tmpSkillsDir, { recursive: true, force: true });
    console.log("✅ read_skill client truncation OK");
}

main().catch((err) => {
    console.error("❌", err);
    process.exit(1);
});
