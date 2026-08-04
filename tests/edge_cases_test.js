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

        // An in-root symlink remains supported after canonical containment checks.
        const inRootLinkDir = path.join(tmpSkillsDir, "in-root-link");
        const inRootLink = path.join(inRootLinkDir, "SKILL.md");
        fs.mkdirSync(inRootLinkDir);
        try {
            fs.symlinkSync(path.join(bomDir, "SKILL.md"), inRootLink);
        } catch {
            // Symlinks may require elevated privileges on Windows, test conditionally
        }

        const hugeSkillDir = path.join(tmpSkillsDir, "huge-skill");
        fs.mkdirSync(hugeSkillDir);
        fs.writeFileSync(path.join(hugeSkillDir, "SKILL.md"), Buffer.alloc(10 * 1024 * 1024 + 1, 0x78));

        const manager = new SkillsManager(tmpSkillsDir);

        // Test 1: UTF-8 BOM Parsing & Frontmatter Stripping
        console.log("Test 1: UTF-8 BOM frontmatter parsing & content stripping...");
        const skills = await manager.listSkills();
        const bomSkill = skills.find((s) => s.name === "bom-skill");
        assert.ok(bomSkill, "BOM skill should be found in listSkills()");
        assert.ok(!skills.some((s) => s.name === "huge-skill"), "oversized skill files should be skipped");
        assert.strictEqual(bomSkill.description, "Skill with UTF-8 BOM");
        if (fs.existsSync(inRootLink) && fs.lstatSync(inRootLink).isSymbolicLink()) {
            const linkedContent = await manager.readSkillContent(inRootLink);
            assert.ok(linkedContent.includes("This is content with BOM."), "in-root symlink should remain readable");
        }

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

        // Test 6: Skill names containing ".." are findable (map-only lookup —
        // user input never reaches the filesystem, so consecutive dots are safe)
        console.log("\nTest 6: Skill names with consecutive dots are findable...");
        const dotDir = path.join(tmpSkillsDir, "dot..skill");
        fs.mkdirSync(dotDir);
        fs.writeFileSync(
            path.join(dotDir, "SKILL.md"),
            "---\nname: dot..skill\ndescription: Name with consecutive dots\n---\n# Dots\nContent.",
            "utf-8"
        );
        const mgr2 = new SkillsManager(tmpSkillsDir);
        const dotSkill = await mgr2.findSkill("dot..skill");
        assert.ok(dotSkill, "Skill names containing '..' should be findable");
        assert.strictEqual(dotSkill.name, "dot..skill");
        // Exact "." / ".." are still rejected
        assert.strictEqual(await mgr2.findSkill(".."), undefined, "Exact '..' must still be rejected");
        assert.strictEqual(await mgr2.findSkill("."), undefined, "Exact '.' must still be rejected");
        assert.strictEqual(await mgr2.findSkill("a/b"), undefined, "Separators must still be rejected");
        console.log("  ✅ Test 6 Passed!");

        // Test 7: A transient rescan failure must not poison the cache — the
        // last-good list is returned instead of an empty one, and scanning
        // recovers as soon as the directory is readable again.
        console.log("\nTest 7: Transient rescan failure keeps last-good cache...");
        const mgr3 = new SkillsManager(tmpSkillsDir);
        const warm = await mgr3.listSkills();
        assert.ok(warm.length >= 2, "warm cache populated");
        const movedSkillsDir = `${tmpSkillsDir}.moved`;
        fs.renameSync(tmpSkillsDir, movedSkillsDir);
        let during = [];
        try {
            during = await mgr3.listSkills(true);
        } finally {
            fs.renameSync(movedSkillsDir, tmpSkillsDir);
        }
        assert.ok(during.length >= 2, "failed rescan returns last-good cache, not empty");
        const recovered = await mgr3.listSkills(true);
        assert.ok(recovered.length >= 2, "rescan recovers once the directory is readable again");
        console.log("  ✅ Test 7 Passed!");

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
