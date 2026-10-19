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
const crypto = require("crypto");

const src = path.join(__dirname, "..", "..", "target-learn", "skills");
const dest = path.join(__dirname, "..", "skills");
const manifestPath = path.join(__dirname, ".copy-skills-manifest.json");

if (!fs.existsSync(src)) {
    console.log(`Source not found, skipping copy: ${src}`);
    process.exit(0);
}

function listFiles(root) {
    const out = [];
    // A readdir failure (permissions, concurrent deletion, I/O error) yields a
    // partial file list; the stale cleanup below deletes every manifest entry
    // missing from that list, so a partial walk must abort the run instead of
    // proceeding as if upstream had shrunk.
    let walkFailed = false;
    const walk = (dir, rel) => {
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch (err) {
            walkFailed = true;
            console.warn(`Warning: cannot read directory, skipping: ${dir} (${err.message})`);
            return;
        }
        for (const entry of entries) {
            const abs = path.join(dir, entry.name);
            const childRel = rel ? `${rel}/${entry.name}` : entry.name;
            // Never follow symlinks: a crafted or stale link would copy content
            // from outside the skills tree (or loop forever). Skip with a warning.
            // Dirent comes from lstat, so isSymbolicLink() needs no extra stat.
            if (entry.isSymbolicLink()) {
                console.warn(`Warning: skipping symlink: ${abs}`);
                continue;
            }
            if (entry.isDirectory()) {
                walk(abs, childRel);
            } else if (entry.isFile()) {
                out.push(childRel);
            }
        }
    };
    walk(root, "");
    return { files: out.sort(), walkFailed };
}

function sameFile(a, b) {
    // Size + content hash: mtime granularity (and preserved mtimes) can hide
    // a same-size content change, which the old size+mtimeMs check then
    // skipped forever. Skills are small text files, so hashing is cheap.
    try {
        const sa = fs.statSync(a);
        const sb = fs.statSync(b);
        if (sa.size !== sb.size) return false;
        const ha = crypto.createHash("sha256").update(fs.readFileSync(a)).digest();
        const hb = crypto.createHash("sha256").update(fs.readFileSync(b)).digest();
        return ha.equals(hb);
    } catch {
        return false;
    }
}

// Manifest entries are data, not trusted paths: a crafted rel such as
// "../../evil" would otherwise make the stale cleanup below delete outside
// the skills directory. Skip absolute paths, parent traversals, and anything
// that normalizes outside the destination.
function isSafeRel(rel) {
    if (typeof rel !== "string" || rel.length === 0) return false;
    if (path.isAbsolute(rel)) return false;
    if (rel.includes("..")) return false;
    const target = path.join(dest, rel);
    return target === dest || target.startsWith(dest + path.sep);
}

function loadManifest() {
    try {
        const parsed = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        return Array.isArray(parsed.files) ? parsed.files : [];
    } catch {
        return [];
    }
}

const { files: srcFiles, walkFailed } = listFiles(src);
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
    if (fs.existsSync(to) && !sameFile(from, to)) {
        try {
            fs.copyFileSync(to, `${to}.bak`);
            console.warn(`Warning: overwriting modified file, backup created: ${to}.bak`);
        } catch {
            // best-effort backup; the overwrite below still proceeds.
        }
    }
    fs.copyFileSync(from, to);
    copied++;
}

if (walkFailed) {
    // The source walk above hit unreadable directories: srcFiles is partial, so
    // the stale cleanup below would delete fork-shipped files that still exist
    // upstream. Copies already made are incremental and harmless; skip cleanup
    // and the manifest rewrite (which would record the partial set) and fail.
    console.error("❌ Aborting: source tree walk failed; stale cleanup skipped to avoid deleting live skills.");
    process.exit(1);
}

// Remove only files THIS script copied previously that no longer exist upstream.
// Fork-specific skills (never in the manifest) are left untouched.
const currentSet = new Set(srcFiles);
const stale = previousCopied.filter((rel) => isSafeRel(rel) && !currentSet.has(rel));
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
    // Atomic write (tmp + rename, exclusive create): a crash mid-write must not
    // leave a truncated manifest that the next run mistakes for the full set.
    const manifestTmp = `${manifestPath}.${process.pid}.${crypto.randomBytes(8).toString("hex")}.tmp`;
    try {
        fs.writeFileSync(manifestTmp, JSON.stringify({ files: [...currentlyCopied].sort() }, null, 2) + "\n", { encoding: "utf-8", flag: "wx" });
        fs.renameSync(manifestTmp, manifestPath);
    } catch (manifestErr) {
        try { fs.unlinkSync(manifestTmp); } catch { /* ignore */ }
        throw manifestErr;
    }
} catch {
    // Manifest write is best-effort; a missing manifest just means no stale cleanup next run.
}

console.log(`✅ Copied ${copied} file(s), skipped ${skipped} unchanged, removed ${stale.length} stale file(s).`);
