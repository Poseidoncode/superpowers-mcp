#!/usr/bin/env node
/**
 * Copy skills from the parent superpowers repository into the extension's
 * own skills/ directory so they are included in the .vsix package.
 *
 * Copies are incremental (unchanged files are skipped) and a manifest records
 * what this script copied so that skills removed/renamed upstream are cleaned up
 * without ever deleting fork-specific skills the manifest does not know about.
 */

const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "..", "target-learn", "skills");
const dest = path.join(__dirname, "..", "skills");
const manifestPath = path.join(__dirname, ".copy-skills-manifest.json");

if (!fs.existsSync(src)) {
    console.log(`Source not found, skipping copy: ${src}`);
    process.exit(0);
}

function listFiles(root) {
    const out = [];
    const walk = (dir, rel) => {
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            return;
        }
        for (const entry of entries) {
            const abs = path.join(dir, entry.name);
            const childRel = rel ? `${rel}/${entry.name}` : entry.name;
            if (entry.isDirectory()) {
                walk(abs, childRel);
            } else if (entry.isFile()) {
                out.push(childRel);
            }
        }
    };
    walk(root, "");
    return out.sort();
}

function sameFile(a, b) {
    try {
        const sa = fs.statSync(a);
        const sb = fs.statSync(b);
        return sa.size === sb.size && Math.floor(sa.mtimeMs) === Math.floor(sb.mtimeMs);
    } catch {
        return false;
    }
}

function loadManifest() {
    try {
        const parsed = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        return Array.isArray(parsed.files) ? parsed.files : [];
    } catch {
        return [];
    }
}

const srcFiles = listFiles(src);
const previousCopied = loadManifest();
const currentlyCopied = new Set();

fs.mkdirSync(dest, { recursive: true });

let copied = 0;
let skipped = 0;
for (const rel of srcFiles) {
    const from = path.join(src, rel);
    const to = path.join(dest, rel);
    currentlyCopied.add(rel);
    if (fs.existsSync(to) && sameFile(from, to)) {
        skipped++;
        continue; // unchanged — avoid needless disk writes and mtime churn
    }
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
    copied++;
}

// Remove only files THIS script copied previously that no longer exist upstream.
// Fork-specific skills (never in the manifest) are left untouched.
const currentSet = new Set(srcFiles);
const stale = previousCopied.filter((rel) => !currentSet.has(rel));
for (const rel of stale) {
    const target = path.join(dest, rel);
    try {
        if (fs.existsSync(target)) {
            fs.unlinkSync(target);
        }
    } catch {
        // best-effort
    }
}

// Prune directories that are now empty and were part of the previous copy set.
const staleDirs = [...new Set(stale.map((rel) => path.posix.dirname(rel)))]
    .filter((d) => d && d !== ".")
    .sort((a, b) => b.split("/").length - a.split("/").length);
for (const dir of staleDirs) {
    const target = path.join(dest, dir);
    try {
        if (fs.existsSync(target) && fs.readdirSync(target).length === 0) {
            fs.rmdirSync(target);
        }
    } catch {
        // best-effort
    }
}

try {
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify({ files: [...currentlyCopied].sort() }, null, 2) + "\n", "utf-8");
} catch {
    // Manifest write is best-effort; a missing manifest just means no stale cleanup next run.
}

console.log(`✅ Copied ${copied} file(s), skipped ${skipped} unchanged, removed ${stale.length} stale file(s).`);
