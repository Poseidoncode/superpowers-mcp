const path = require("path");
const fs = require("fs");
const { performance } = require("perf_hooks");
const { SkillsManager } = require("../out/skills-manager.js");
const { stripJsonComments } = require("../out/setup-runner.js");

async function runBenchmark() {
    console.log("==================================================");
    console.log("⚡ Superpowers MCP Performance Benchmark");
    console.log("==================================================");

    const skillsPath = path.join(__dirname, "..", "skills");
    const manager = new SkillsManager(skillsPath);

    // 1. Cold listSkills() benchmark
    const coldRuns = 20;
    let totalColdTime = 0;
    for (let i = 0; i < coldRuns; i++) {
        manager.clearCache();
        const start = performance.now();
        await manager.listSkills(true);
        totalColdTime += (performance.now() - start);
    }
    const avgColdListTime = totalColdTime / coldRuns;
    console.log(`1. Cold listSkills() avg latency: ${avgColdListTime.toFixed(3)} ms (over ${coldRuns} runs)`);

    // 2. Warm listSkills() benchmark
    const warmRuns = 1000;
    const startWarm = performance.now();
    for (let i = 0; i < warmRuns; i++) {
        await manager.listSkills();
    }
    const avgWarmListTime = (performance.now() - startWarm) / warmRuns;
    console.log(`2. Warm listSkills() avg latency: ${(avgWarmListTime * 1000).toFixed(3)} µs (over ${warmRuns} runs)`);

    // 3. readSkillContent() benchmark (First read after listSkills vs cached)
    const skills = await manager.listSkills();
    let totalFirstReadTime = 0;
    for (const s of skills) {
        manager.clearCache();
        await manager.listSkills();
        const start = performance.now();
        await manager.readSkillContent(s.skillPath);
        totalFirstReadTime += (performance.now() - start);
    }
    const avgFirstReadTime = totalFirstReadTime / skills.length;
    console.log(`3. readSkillContent() first read latency: ${avgFirstReadTime.toFixed(3)} ms (avg per skill)`);

    // Warm read
    const startWarmRead = performance.now();
    for (let i = 0; i < 500; i++) {
        for (const s of skills) {
            await manager.readSkillContent(s.skillPath);
        }
    }
    const avgWarmReadTime = (performance.now() - startWarmRead) / (500 * skills.length);
    console.log(`4. readSkillContent() warm cached latency: ${(avgWarmReadTime * 1000).toFixed(3)} µs`);

    // 4. stripJsonComments benchmark
    const sampleJsonc = `{
        // Main comment line
        "name": "superpowers", /* inline multi-comment */
        "servers": {
            "test": {
                "command": "node //not-a-comment",
                "args": ["a", "b", /* comment inside array */ "c",],
            },
        },
    }`.repeat(50);

    const jsoncRuns = 200;
    const startJsonc = performance.now();
    for (let i = 0; i < jsoncRuns; i++) {
        stripJsonComments(sampleJsonc);
    }
    const avgJsoncTime = (performance.now() - startJsonc) / jsoncRuns;
    console.log(`5. stripJsonComments() JSONC parsing latency: ${avgJsoncTime.toFixed(3)} ms (sample size ~${(sampleJsonc.length / 1024).toFixed(1)} KB)`);

    // Standard valid JSON fast-path
    const sampleStandardJson = JSON.stringify({
        name: "superpowers-mcp",
        version: "6.3.5",
        mcpServers: {
            superpowers: {
                command: "npx",
                args: ["-y", "superpowers-mcp"],
            },
        },
    });
    const standardRuns = 1000;
    const startStandard = performance.now();
    for (let i = 0; i < standardRuns; i++) {
        stripJsonComments(sampleStandardJson);
    }
    const avgStandardTime = ((performance.now() - startStandard) / standardRuns) * 1000;
    console.log(`6. stripJsonComments() Standard JSON fast-path: ${avgStandardTime.toFixed(3)} µs`);

    console.log("==================================================");
}

runBenchmark().catch(console.error);
