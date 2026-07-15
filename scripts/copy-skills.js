#!/usr/bin/env node
/**
 * Copy skills from the parent superpowers repository into the extension's
 * own skills/ directory so they are included in the .vsix package.
 */

const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "..", "target-learn", "skills");
const dest = path.join(__dirname, "..", "skills");

function copyRecursive(from, to) {
    try {
        if (!fs.existsSync(from)) {
            console.error(`Source not found: ${from}`);
            process.exit(1);
        }

        if (!fs.existsSync(to)) {
            fs.mkdirSync(to, { recursive: true });
        }

        const entries = fs.readdirSync(from, { withFileTypes: true });
        for (const entry of entries) {
            const srcPath = path.join(from, entry.name);
            const destPath = path.join(to, entry.name);

            // 防禦性設計：過濾符號連結防止無限迴圈或任意讀寫
            if (entry.isSymbolicLink()) {
                console.warn(`Warning: Skipping symbolic link: ${srcPath}`);
                continue;
            }

            if (entry.isDirectory()) {
                copyRecursive(srcPath, destPath);
            } else if (entry.isFile()) {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    } catch (err) {
        console.error(`Fatal error copying files from "${from}" to "${to}":`, err);
        process.exit(1);
    }
}

copyRecursive(src, dest);
console.log(`Skills copied from ${src} to ${dest}`);
