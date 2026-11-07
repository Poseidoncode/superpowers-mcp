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
        let listText = "";
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
                            params: { name: "list_skills", arguments: {} },
                        }) + "\n"
                    );
                } else if (response.id === 2 && step === 1) {
                    if (response.error) {
                        fail(new Error(`list_skills failed: ${JSON.stringify(response.error)}`));
                        return;
                    }
                    // Keep the rendered list text for its escaping assertions.
                    listText = response.result?.content?.[0]?.text ?? "";
                    step = 2;
                    server.stdin.write(
                        JSON.stringify({
                            jsonrpc: "2.0",
                            id: 3,
                            method: "tools/call",
                            params: { name: "read_skill", arguments: { skill_name: "huge-trunc" } },
                        }) + "\n"
                    );
                } else if (response.id === 3 && step === 2) {
                    clearTimeout(timeout);
                    server.kill();
                    if (response.error) {
                        fail(new Error(`read_skill failed: ${JSON.stringify(response.error)}`));
                        return;
                    }
                    const skillText = response.result?.content?.[0]?.text ?? "";
                    resolve({ listText, skillText });
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
    const description = "*bold* _italic_ # heading [link](https://example.com) <script>alert(1)</script> slash\\ marker";
    fs.writeFileSync(
        path.join(skillDir, "SKILL.md"),
        `---\nname: huge-trunc\ndescription: '${description}'\n  # injected heading\n---\n${body}`,
        "utf-8"
    );

    const { listText, skillText } = await runMcpRoundtrip({ SKILLS_PATH: tmpSkillsDir });
    assert.ok(listText.includes("\\*bold\\* \\_italic\\_ \\# heading"), "list_skills must escape Markdown formatting and heading markers");
    assert.ok(listText.includes("\\[link\\]\\(https\\:\\/\\/example\\.com\\)"), "list_skills must escape link syntax");
    assert.ok(listText.includes("\\<script\\>"), "list_skills must escape raw HTML delimiters");
    assert.ok(listText.includes("slash\\\\ marker"), "list_skills must escape input backslashes before Markdown parsing");
    assert.ok(listText.includes("\\# injected heading"), "multiline descriptions must not inject a new Markdown heading");
    assert.ok(!listText.includes("<script>"), "untrusted descriptions must not emit raw HTML tags");
    assert.ok(skillText.includes("skill content truncated"), "read_skill must truncate oversized skill bodies");
    assert.ok(skillText.length < body.length + 500, "truncated response must be shorter than the source body");

    fs.rmSync(tmpSkillsDir, { recursive: true, force: true });
    console.log("✅ read_skill client truncation OK");
}

main().catch((err) => {
    console.error("❌", err);
    process.exit(1);
});
