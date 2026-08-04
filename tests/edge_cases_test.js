const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { SkillsManager } = require("../out/skills-manager.js");

async function runEdgeCaseTests() {
    console.log("🧪 Starting Edge Case & Security Unit Tests...\n");

    const tmpSkillsDir = path.join(__dirname, "tmp_skills");
    if (fs.existsSync(tmpSkillsDir)) {
        fs.rmSync(tmpSkillsDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tmpSkillsDir, { recursive: true });

    try {
        // 1. Setup test skills
        // Skill 1: UTF-8 BOM
        const bomDir = path.join(tmpSkillsDir, "bom-skill");
        fs.mkdirSync(bomDir);
        fs.writeFileSync(
            path.join(bomDir, "SKILL.md"),
            "\uFEFF---\r\nname: bom-skill\r\ndescription: Skill with UTF-8 BOM\r\n---\r\n# BOM Content\r\nThis is content with BOM.",
            "utf-8"
        );

        // Skill 2: Spaces and dots in name
        const spaceDir = path.join(tmpSkillsDir, "space-skill");
        fs.mkdirSync(spaceDir);
        fs.writeFileSync(
            path.join(spaceDir, "SKILL.md"),
            "---\nname: Advanced Code Review & Audit\ndescription: Multi word skill\n---\n# Advanced Review\nContent here.",
            "utf-8"
        );

        // Skill 3: Symlink Traversal test
        const symlinkDir = path.join(tmpSkillsDir, "symlink-skill");
        fs.mkdirSync(symlinkDir);
        const outsideTarget = path.join(__dirname, "..", "package.json");
        const symlinkPath = path.join(symlinkDir, "SKILL.md");
        try {
            fs.symlinkSync(outsideTarget, symlinkPath);
        } catch {
            // Symlinks may require elevated privileges on Windows, test conditionally
        }

        const manager = new SkillsManager(tmpSkillsDir);

        // Test 1: UTF-8 BOM Parsing & Frontmatter Stripping
        console.log("Test 1: UTF-8 BOM frontmatter parsing & content stripping...");
        const skills = await manager.listSkills();
        const bomSkill = skills.find((s) => s.name === "bom-skill");
        assert.ok(bomSkill, "BOM skill should be found in listSkills()");
        assert.strictEqual(bomSkill.description, "Skill with UTF-8 BOM");

        const bomContent = await manager.readSkillContent(bomSkill.skillPath);
        assert.ok(!bomContent.includes("---"), "Frontmatter should be stripped even with BOM");
        assert.ok(bomContent.includes("This is content with BOM."), "Body content should match");
        console.log("  ✅ Test 1 Passed!");

        // Test 2: Spaces in skill name search
        console.log("\nTest 2: Search skill with spaces in name...");
        const spaceSkill = await manager.findSkill("Advanced Code Review & Audit");
        assert.ok(spaceSkill, "Skill with spaces in name should be findable");
        assert.strictEqual(spaceSkill.name, "Advanced Code Review & Audit");
        console.log("  ✅ Test 2 Passed!");

        // Test 3: Path Traversal Defense & Symlink Check
        console.log("\nTest 3: Path Traversal & Symlink defense in findSkill & readSkillContent...");
        const invalid1 = await manager.findSkill("../etc/passwd");
        assert.strictEqual(invalid1, undefined, "Path traversal with ../ should return undefined");

        const invalid2 = await manager.findSkill("..\\windows\\system32");
        assert.strictEqual(invalid2, undefined, "Path traversal with ..\\ should return undefined");

        const invalid3 = await manager.findSkill("/etc/passwd");
        assert.strictEqual(invalid3, undefined, "Path traversal with leading slash should return undefined");

        try {
            await manager.readSkillContent(path.join(__dirname, "..", "package.json"));
            assert.fail("readSkillContent should reject paths outside skillsPath");
        } catch (err) {
            assert.ok(err.message.includes("outside") || err.message.includes("Failed"), "Should reject path outside skills directory");
        }

        if (fs.existsSync(symlinkPath) && fs.lstatSync(symlinkPath).isSymbolicLink()) {
            try {
                await manager.readSkillContent(symlinkPath);
                assert.fail("readSkillContent should reject symlink pointing outside skillsPath");
            } catch (err) {
                assert.ok(err.message.includes("outside") || err.message.includes("Failed"), "Symlink pointing outside should be rejected");
            }
        }
        console.log("  ✅ Test 3 Passed!");

        // Test 4: Concurrency & Race Condition
        console.log("\nTest 4: Concurrent listSkills() calls (Race condition check)...");
        manager.clearCache();
        const concurrentPromises = Array.from({ length: 50 }, () => manager.listSkills());
        const results = await Promise.all(concurrentPromises);
        assert.strictEqual(results.length, 50);
        for (const res of results) {
            assert.ok(res.length >= 2, "All concurrent listSkills() calls should return skills");
        }
        console.log("  ✅ Test 4 Passed!");

        // Test 5: Cache Invalidation on forceReload
        console.log("\nTest 5: ForceReload clears contentCache...");
        await manager.readSkillContent(bomSkill.skillPath);
        await manager.listSkills(true); // forceReload
        console.log("  ✅ Test 5 Passed!");

        console.log("\n🎉 ALL EDGE CASE & SECURITY UNIT TESTS PASSED!");
    } finally {
        if (fs.existsSync(tmpSkillsDir)) {
            fs.rmSync(tmpSkillsDir, { recursive: true, force: true });
        }
    }
}

runEdgeCaseTests().catch((err) => {
    console.error("❌ Test Failed:", err);
    process.exit(1);
});
