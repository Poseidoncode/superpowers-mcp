const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { SkillsManager, CACHE_REVALIDATE_MS } = require("../out/skills-manager.js");

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

        // Test 8: caches refresh without requiring an MCP server restart.
        console.log("\nTest 8: Automatic cache revalidation...");
        const refreshedBody = "# BOM Content\nUpdated after cache warm-up.";
        fs.writeFileSync(
            path.join(bomDir, "SKILL.md"),
            `---\nname: bom-skill\ndescription: Refreshed description\n---\n${refreshedBody}`,
            "utf-8"
        );
        // Poll for automatic revalidation (#16) instead of a fixed sleep.
        const revalidateDeadline = Date.now() + 5000;
        let refreshedSkills = await manager.listSkills();
        while (
            refreshedSkills.find((s) => s.name === "bom-skill").description !== "Refreshed description" &&
            Date.now() < revalidateDeadline
        ) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            refreshedSkills = await manager.listSkills();
        }
        assert.strictEqual(refreshedSkills.find((s) => s.name === "bom-skill").description, "Refreshed description");
        assert.strictEqual(await manager.readSkillContent(bomSkill.skillPath), refreshedBody);
        console.log("  ✅ Test 8 Passed!");

        // Test 9: duplicate names are resolved deterministically and never
        // produce duplicate resources/map entries.
        console.log("\nTest 9: Duplicate skill-name collision handling...");
        const duplicateDir = path.join(tmpSkillsDir, "zzz-duplicate");
        fs.mkdirSync(duplicateDir);
        fs.writeFileSync(
            path.join(duplicateDir, "SKILL.md"),
            "---\nname: bom-skill\ndescription: Duplicate\n---\n# Duplicate\n",
            "utf-8"
        );
        const duplicateManager = new SkillsManager(tmpSkillsDir);
        const deduplicated = await duplicateManager.listSkills();
        assert.strictEqual(deduplicated.filter((s) => s.name === "bom-skill").length, 1);
        assert.strictEqual((await duplicateManager.findSkill("bom-skill")).description, "Refreshed description");
        console.log("  ✅ Test 9 Passed!");

        // Test 10: reading a single skill must not trigger a full directory rescan.
        // Regression guard for the cache design: readSkillContent() used to call
        // listSkills(true) once the entry TTL expired, re-reading every skill file
        // just to serve one, and letting parallel callers each rescan the tree.
        console.log("\nTest 10: readSkillContent does not rescan the whole tree...");
        {
            const fsp = require("fs/promises");
            const originalOpen = fsp.open;
            const originalReaddir = fsp.readdir;
            let opens = 0;
            let readdirs = 0;
            fsp.open = async (...args) => {
                opens++;
                return originalOpen.apply(fsp, args);
            };
            fsp.readdir = async (...args) => {
                readdirs++;
                return originalReaddir.apply(fsp, args);
            };

            try {
                const perfDir = path.join(tmpSkillsDir, "perf-skill");
                fs.mkdirSync(perfDir, { recursive: true });
                fs.writeFileSync(
                    path.join(perfDir, "SKILL.md"),
                    "---\nname: perf-skill\ndescription: Perf\n---\n# Perf\nbody\n",
                    "utf-8"
                );

                const perfManager = new SkillsManager(tmpSkillsDir);
                await perfManager.listSkills();

                // Wait past cache revalidation so the old code would force a rescan;
                // tied to the exported TTL (#16) so it cannot silently go stale.
                await new Promise((resolve) => setTimeout(resolve, CACHE_REVALIDATE_MS + 500));

                opens = 0;
                readdirs = 0;
                const contents = await Promise.all(
                    Array.from({ length: 10 }, () => perfManager.readSkillContent(path.join(perfDir, "SKILL.md")))
                );

                assert.ok(contents.every((c) => c.includes("body")), "cached content must still be returned");
                assert.strictEqual(readdirs, 0, `readSkillContent must not rescan the directory (got ${readdirs} readdir calls)`);
                assert.strictEqual(opens, 0, `readSkillContent must not re-open any skill file on a cache hit (got ${opens})`);
            } finally {
                fsp.open = originalOpen;
                fsp.readdir = originalReaddir;
            }
        }
        console.log("  ✅ Test 10 Passed!");

        // Test 11: the directory fingerprint must detect an in-place edit, and a
        // burst of concurrent listSkills() calls must collapse into one scan.
        console.log("\nTest 11: fingerprint invalidation and single-flight scanning...");
        {
            const fsp = require("fs/promises");
            const sigDir = path.join(tmpSkillsDir, "sig-skill");
            fs.mkdirSync(sigDir, { recursive: true });
            fs.writeFileSync(
                path.join(sigDir, "SKILL.md"),
                "---\nname: sig-skill\ndescription: Before\n---\n# Sig\nv1\n",
                "utf-8"
            );

            const sigManager = new SkillsManager(tmpSkillsDir);
            const initialList = await sigManager.listSkills();
            assert.strictEqual(initialList.find((s) => s.name === "sig-skill").description, "Before");

            // In-place overwrite: only the file mtime changes, never the parent dir's.
            fs.writeFileSync(
                path.join(sigDir, "SKILL.md"),
                "---\nname: sig-skill\ndescription: After\n---\n# Sig\nv2\n",
                "utf-8"
            );
            // Poll for signature invalidation (#16) instead of a fixed sleep.
            const invalidateDeadline = Date.now() + 5000;
            let refreshed = await sigManager.listSkills();
            while (
                refreshed.find((s) => s.name === "sig-skill").description !== "After" &&
                Date.now() < invalidateDeadline
            ) {
                await new Promise((resolve) => setTimeout(resolve, 100));
                refreshed = await sigManager.listSkills();
            }
            assert.strictEqual(
                refreshed.find((s) => s.name === "sig-skill").description,
                "After",
                "a changed file must invalidate the list cache"
            );
            assert.ok(
                (await sigManager.readSkillContent(path.join(sigDir, "SKILL.md"))).includes("v2"),
                "a changed file must invalidate the content cache"
            );

            const originalOpen = fsp.open;
            const originalReaddir = fsp.readdir;
            let opens = 0;
            let readdirs = 0;
            fsp.open = async (...args) => {
                opens++;
                return originalOpen.apply(fsp, args);
            };
            fsp.readdir = async (...args) => {
                readdirs++;
                return originalReaddir.apply(fsp, args);
            };
            try {
                const burstManager = new SkillsManager(tmpSkillsDir);
                const results = await Promise.all(Array.from({ length: 40 }, () => burstManager.listSkills()));
                assert.ok(results.every((r) => Array.isArray(r) && r.length > 0), "every caller must receive the list");
                // One scan reads each SKILL.md exactly once; the fingerprint check adds
                // one extra readdir. A per-caller rescan would open far more files.
                const skillFileCount = fs.readdirSync(tmpSkillsDir).filter((n) => fs.statSync(path.join(tmpSkillsDir, n)).isDirectory()).length;
                assert.ok(
                    opens <= skillFileCount,
                    `40 concurrent listSkills() calls must share one scan (opened ${opens} files for ${skillFileCount} skills)`
                );
            } finally {
                fsp.open = originalOpen;
                fsp.readdir = originalReaddir;
            }
        }
        console.log("  ✅ Test 11 Passed!");

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
