#!/usr/bin/env node
/**
 * Copy skills from the parent superpowers repository into the extension's
 * own skills/ directory so they are included in the .vsix package.
 */

const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "..", "skills");
const dest = path.join(__dirname, "..", "skills");

function copyRecursive(from, to) {
    if (!fs.existsSync(from)) {
        console.error(`Source not found: ${from}`);
        process.exit(1);
    }

    if (!fs.existsSync(to)) {
        fs.mkdirSync(to, { recursive: true });
    }

    for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
        const srcPath = path.join(from, entry.name);
        const destPath = path.join(to, entry.name);

        if (entry.isDirectory()) {
            copyRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

copyRecursive(src, dest);
console.log(`Skills copied from ${src} to ${dest}`);
