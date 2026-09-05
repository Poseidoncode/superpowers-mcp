/**
 * Brainstorm companion server regression tests.
 *
 * Covers the security & robustness fixes in skills/brainstorming/scripts/server.cjs:
 *   1. The server must survive the content dir being deleted mid-run (an
 *      uncaught ENOENT in the request handler used to crash the process).
 *   2. The server must survive a screen file vanishing between readdir and read.
 *   3. WebSocket handshake validation: bad version / upgrade / key / no auth
 *      must be rejected.
 *   4. WebSocket control frames (PING) with payloads > 125 bytes must be
 *      rejected per RFC 6455.
 *   5. /files/* must not serve files outside the content dir (traversal).
 *   6. Unauthenticated requests must be rejected with 403.
 *
 * Pure Node (http + net), no external dependencies, no curl required.
 */

const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const SERVER_CJS = path.join(__dirname, "..", "skills", "brainstorming", "scripts", "server.cjs");

let passed = 0;
let failed = 0;

function report(name, ok) {
    if (ok) {
        passed++;
        console.log(`  ✅ ${name}`);
    } else {
        failed++;
        console.log(`  ❌ ${name}`);
    }
}

async function waitForServerInfo(sessionDir, timeoutMs = 8000) {
    const infoFile = path.join(sessionDir, "state", "server-info");
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs) {
        try {
            return JSON.parse(fs.readFileSync(infoFile, "utf-8"));
        } catch (e) {
            await new Promise((r) => setTimeout(r, 100));
        }
    }
    throw new Error("server-info not written in time");
}

function waitForClose(child, timeoutMs = 3000) {
    return new Promise((resolve) => {
        let settled = false;
        const finish = (code) => {
            if (settled) return;
            settled = true;
            resolve(code);
        };
        child.once("close", finish);
        setTimeout(() => finish(null), timeoutMs).unref();
    });
}

function startServer(sessionDir, extraEnv = {}) {
    return spawn("node", [SERVER_CJS], {
        env: {
            ...process.env,
            BRAINSTORM_DIR: sessionDir,
            BRAINSTORM_LIFECYCLE_CHECK_MS: "60000",
            ...extraEnv,
        },
        stdio: ["ignore", "pipe", "pipe"],
    });
}

// Bootstrap must also surface the Set-Cookie header for getWithCookie.
function get(port, key, pathname) {
    return new Promise((resolve, reject) => {
        const req = http.request(
            { host: "127.0.0.1", port, path: pathname || "/?key=" + key, method: "GET" },
            (res) => {
                const chunks = [];
                res.on("data", (c) => chunks.push(c));
                res.on("end", () =>
                    resolve({
                        status: res.statusCode,
                        body: Buffer.concat(chunks).toString(),
                        setCookie: res.headers["set-cookie"] || [],
                        headers: res.headers,
                    })
                );
            }
        );
        req.on("error", reject);
        req.end();
    });
}

// Cookie-authenticated request (the flow a real browser uses after bootstrap).
// First bootstraps via /?key= to obtain the session cookie, then requests the
// given pathname with that cookie.
async function getWithCookie(port, key, pathname) {
    const boot = await get(port, key, "/?key=" + key);
    const setCookie = boot.setCookie || [];
    const cookie = setCookie.length ? setCookie[0].split(";")[0] : "";
    assert.ok(cookie, "bootstrap response must set the session cookie");
    return new Promise((resolve, reject) => {
        const req = http.request(
            { host: "127.0.0.1", port, path: pathname || "/", method: "GET", headers: { Cookie: cookie } },
            (res) => {
                const chunks = [];
                res.on("data", (c) => chunks.push(c));
                res.on("end", () =>
                    resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString(), headers: res.headers })
                );
            }
        );
        req.on("error", reject);
        req.end();
    });
}

function wsUpgrade(port, key, { version = "13", upgrade = "websocket", wsKey = null, cookie = "" } = {}) {
    return new Promise((resolve) => {
        const req = http.request({
            host: "127.0.0.1",
            port,
            path: key ? "/?key=" + key : "/",
            headers: {
                ...(cookie ? { Cookie: cookie } : {}),
                Upgrade: upgrade,
                Connection: "Upgrade",
                "Sec-WebSocket-Version": version,
                "Sec-WebSocket-Key": wsKey || crypto.randomBytes(16).toString("base64"),
            },
        });
        let done = false;
        req.on("upgrade", (res, socket) => {
            if (!done) { done = true; resolve({ ok: true, socket }); }
        });
        req.on("response", (res) => {
            if (!done) { done = true; resolve({ ok: false, status: res.statusCode }); }
        });
        req.on("error", () => {
            if (!done) { done = true; resolve({ ok: false }); }
        });
        req.end();
    });
}

function sendMaskedFrame(socket, opcode, payload) {
    const mask = crypto.randomBytes(4);
    const masked = Buffer.from(payload.map((b, i) => b ^ mask[i % 4]));
    const len = payload.length;
    let header;
    if (len < 126) {
        header = Buffer.from([0x80 | opcode, 0x80 | len]);
    } else if (len < 65536) {
        // 16-bit extended length (RFC 6455 §5.2)
        header = Buffer.from([0x80 | opcode, 0x80 | 126, len >> 8, len & 0xff]);
    } else {
        // 64-bit extended length (RFC 6455 §5.2)
        header = Buffer.alloc(10);
        header[0] = 0x80 | opcode;
        header[1] = 0x80 | 127;
        header.writeBigUInt64BE(BigInt(len), 2);
    }
    socket.write(Buffer.concat([header, mask, masked]));
}

// Parse unmasked server→client frames; return true when a TEXT frame whose
// payload contains the given needle has been seen.
function bufferHasTextFrame(buf, needle) {
    let off = 0;
    while (off + 2 <= buf.length) {
        const b0 = buf[off];
        const b1 = buf[off + 1];
        const opcode = b0 & 0x0f;
        let len = b1 & 0x7f;
        let hdr = 2;
        if (len === 126) {
            if (off + 4 > buf.length) break;
            len = buf.readUInt16BE(off + 2);
            hdr = 4;
        } else if (len === 127) {
            if (off + 10 > buf.length) break;
            len = Number(buf.readBigUInt64BE(off + 2));
            hdr = 10;
        }
        if (off + hdr + len > buf.length) break;
        if (opcode === 0x01 && buf.slice(off + hdr, off + hdr + len).toString().includes(needle)) {
            return true;
        }
        off += hdr + len;
    }
    return false;
}

function waitFor(cond, timeoutMs) {
    return new Promise((resolve) => {
        const t0 = Date.now();
        (function poll() {
            if (cond()) resolve(true);
            else if (Date.now() - t0 > timeoutMs) resolve(false);
            else setTimeout(poll, 50);
        })();
    });
}

async function run() {
    const sessionDir = fs.mkdtempSync(path.join(os.tmpdir(), "bstest."));
    const server = startServer(sessionDir);
    let serverStderr = "";
    server.stderr.on("data", (d) => { serverStderr += d.toString(); });

    try {
        const info = await waitForServerInfo(sessionDir);
        const { port, url } = info;
        const key = url.split("key=")[1];
        assert.ok(key && /^[0-9a-f]{64}$/.test(key), "server-info embeds a 64-hex key");

        // 1. Unauthenticated requests are rejected
        const unauth = await get(port, "wrongkey");
        report("unauthenticated request rejected (403)", unauth.status === 403);

        // 2. Bootstrap + cookie flow works
        const boot = await get(port, key, "/?key=" + key);
        report("bootstrap redirects with valid key", boot.status === 303 && boot.headers.location === "/");
        report("bootstrap does not expose token to page scripts", !boot.body.includes("sessionStorage"));
        report("nosniff security header present", boot.headers["x-content-type-options"] === "nosniff");
        report("frame-ancestors CSP present", (boot.headers["content-security-policy"] || "").includes("frame-ancestors 'none'"));
        const cookieRes = await getWithCookie(port, key, "/");
        report("cookie-authenticated page served", cookieRes.status === 200);
        report("screen CSP uses a nonce and blocks inline scripts", (cookieRes.headers["content-security-policy"] || "").includes("script-src 'nonce-") && !cookieRes.body.includes("sessionStorage"));

        // 3. Server survives content dir deletion (regression for uncaught ENOENT crash)
        fs.mkdirSync(path.join(sessionDir, "content"), { recursive: true });
        fs.writeFileSync(path.join(sessionDir, "content", "screen-1.html"), "<html><body>SCREEN</body></html>");
        fs.rmSync(path.join(sessionDir, "content"), { recursive: true, force: true });
        const afterDelete = await getWithCookie(port, key, "/");
        report("survives content dir deletion", afterDelete.status === 200 && server.exitCode === null);

        // 4. /files/* traversal is blocked
        fs.mkdirSync(path.join(sessionDir, "content"), { recursive: true });
        const trav = await getWithCookie(port, key, "/files/..%2F..%2Fpackage.json");
        report("/files traversal blocked", trav.status === 404);

        // 5. /files/* serves only files inside the content dir
        fs.writeFileSync(path.join(sessionDir, "content", "asset.png"), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
        const asset = await getWithCookie(port, key, "/files/asset.png");
        report("/files serves in-dir asset", asset.status === 200);

        // 5b. Brand logo is served locally — no third-party URL strings
        const logo = await getWithCookie(port, key, "/brand-logo.svg");
        report("brand logo served same-origin", logo.status === 200 && (logo.headers["content-type"] || "").includes("image/svg+xml"));
        report("brand logo has no external URL", logo.body.includes("SUPERPOWERS") && !logo.body.includes("primeradiant") && !logo.body.includes("https://"));
        const indexCsp = cookieRes.headers["content-security-policy"] || "";
        report("CSP restricts images to same-origin", indexCsp.includes("img-src 'self'") && !indexCsp.includes("primeradiant"));
        report("brand markup uses the local logo path", cookieRes.body.includes("/brand-logo.svg"));

        // 6. WebSocket handshake validation
        const wsOk = await wsUpgrade(port, key);
        report("valid WS handshake accepted", wsOk.ok === true);
        if (wsOk.socket) wsOk.socket.destroy();
        const browserCookie = (boot.setCookie[0] || "").split(";")[0];
        const wsCookie = await wsUpgrade(port, null, { cookie: browserCookie });
        report("browser-style WS handshake uses HttpOnly cookie", wsCookie.ok === true);
        if (wsCookie.socket) wsCookie.socket.destroy();

        const wsBadVersion = await wsUpgrade(port, key, { version: "12" });
        report("WS bad version rejected", wsBadVersion.ok === false);

        const wsBadUpgrade = await wsUpgrade(port, key, { upgrade: "h2c" });
        report("WS bad upgrade header rejected", wsBadUpgrade.ok === false);

        const wsBadKey = await wsUpgrade(port, key, { wsKey: "not-a-valid-key!" });
        report("WS malformed key rejected", wsBadKey.ok === false);

        const wsNoAuth = await wsUpgrade(port, "deadbeef".repeat(8));
        report("WS without auth rejected", wsNoAuth.ok === false);

        // 7. Control frame (PING) with > 125-byte payload is closed (RFC 6455)
        const wsPing = await wsUpgrade(port, key);
        if (wsPing.ok) {
            const closed = await new Promise((resolve) => {
                const s = wsPing.socket;
                s.on("close", () => resolve(true));
                s.on("error", () => {});
                // Drain inbound data: without a reader the CLOSE frame stays in
                // the buffer and 'close' never fires (a real browser reads it).
                s.resume();
                sendMaskedFrame(s, 0x09, Buffer.alloc(200, 0x61)); // PING, 200 bytes
                setTimeout(() => resolve(false), 3000);
            });
            report("oversized PING frame closed", closed === true);
            wsPing.socket.destroy();
        } else {
            report("oversized PING frame closed", false);
        }

        // 8. Valid choice event is recorded to state/events
        const wsMsg = await wsUpgrade(port, key);
        if (wsMsg.ok) {
            sendMaskedFrame(wsMsg.socket, 0x01, Buffer.from(JSON.stringify({ type: "choice", choice: "B" })));
            await new Promise((r) => setTimeout(r, 800));
            const eventsFile = path.join(sessionDir, "state", "events");
            const events = fs.existsSync(eventsFile) ? fs.readFileSync(eventsFile, "utf-8") : "";
            report("choice event recorded", events.includes('"choice":"B"'));
            wsMsg.socket.destroy();
        } else {
            report("choice event recorded", false);
        }

        // 9. A single event larger than the events-file cap must be dropped,
        //    rather than bypassing the cap through appendFileSync.
        const wsLargeEvent = await wsUpgrade(port, key);
        if (wsLargeEvent.ok) {
            const largeChoice = "x".repeat(2 * 1024 * 1024);
            sendMaskedFrame(
                wsLargeEvent.socket,
                0x01,
                Buffer.from(JSON.stringify({ type: "choice", choice: largeChoice }))
            );
            await new Promise((r) => setTimeout(r, 800));
            const eventsFile = path.join(sessionDir, "state", "events");
            const eventsSize = fs.existsSync(eventsFile) ? fs.statSync(eventsFile).size : 0;
            report("events file hard cap applies to one large event", eventsSize <= 1024 * 1024);
            wsLargeEvent.socket.destroy();
        } else {
            report("events file hard cap applies to one large event", false);
        }

        // 10. Watcher resilience: after the content dir is deleted and

        //    recreated, a new screen must still trigger a reload broadcast
        const contentDir = path.join(sessionDir, "content");
        fs.mkdirSync(contentDir, { recursive: true });
        fs.writeFileSync(path.join(contentDir, "pre.html"), "<html><body>PRE</body></html>");
        const wsWatch = await wsUpgrade(port, key);
        assert.ok(wsWatch.ok, "watcher test: ws upgrade failed");
        const watchSocket = wsWatch.socket;
        watchSocket.resume();
        let watchBuf = Buffer.alloc(0);
        watchSocket.on("data", (c) => { watchBuf = Buffer.concat([watchBuf, c]); });
        // Delete + recreate the dir (kills the inotify/FSEvents watch), then
        // GET / so serveScreen re-establishes the watcher.
        fs.rmSync(contentDir, { recursive: true, force: true });
        fs.mkdirSync(contentDir, { recursive: true });
        await getWithCookie(port, key, "/");
        fs.writeFileSync(path.join(contentDir, "post.html"), "<html><body>POST</body></html>");
        const reloaded = await waitFor(() => bufferHasTextFrame(watchBuf, '"type":"reload"'), 6000);
        report("watcher resumes after content dir recreation", reloaded);
        watchSocket.destroy();

        // 10. Oversized screens are skipped, not served or crashed on
        fs.writeFileSync(
            path.join(contentDir, "huge.html"),
            "<html><body>" + "x".repeat(20 * 1024 * 1024 + 1024) + "</body></html>"
        );
        const huge = await getWithCookie(port, key, "/");
        report(
            "oversized screen skipped (no crash, no 20MB serve)",
            huge.status === 200 && !huge.body.includes("x".repeat(500))
        );

        // 11. /files/ rejects non-regular assets without crashing the process.
        //     This is deterministic across POSIX, Windows, and privileged users.
        const nonRegular = path.join(contentDir, "secret.html");
        fs.mkdirSync(nonRegular);
        const f404 = await getWithCookie(port, key, "/files/secret.html");
        report("non-regular /files/ asset returns 404 without crash",
            f404.status === 404 && server.exitCode === null);
    } finally {
        server.kill();
        // Race the close event with a timeout: if the server already crashed
        // (exit before we killed it), the 'close' event fired before this
        // finally runs and awaiting it would hang the suite forever.
        await Promise.race([
            new Promise((r) => server.on("close", r)),
            new Promise((r) => setTimeout(r, 3000)),
        ]);
        fs.rmSync(sessionDir, { recursive: true, force: true });
    }

    // 12. Non-loopback HTTP binds are rejected before exposing a token.
    const remoteDir = fs.mkdtempSync(path.join(os.tmpdir(), "bsremote."));
    const remote = startServer(remoteDir, { BRAINSTORM_HOST: "0.0.0.0" });
    const remoteCode = await waitForClose(remote);
    report("non-loopback HTTP bind rejected", remoteCode !== null && remoteCode !== 0);
    fs.rmSync(remoteDir, { recursive: true, force: true });

    // 13. BRAINSTORM_TOKEN_FILE persists the session key across restarts so an
    // already-open browser tab's cookie keeps validating; a pre-seeded file is
    // honored; a symlinked file is rejected (read-path hardening); and without
    // a token file, each logical session still rotates.
    const tokenDir = fs.mkdtempSync(path.join(os.tmpdir(), "bstoken."));
    const tokenFile = path.join(tokenDir, "persisted-token");
    const firstDir = fs.mkdtempSync(path.join(os.tmpdir(), "bsfirst."));
    const secondDir = fs.mkdtempSync(path.join(os.tmpdir(), "bssecond."));
    const thirdDir = fs.mkdtempSync(path.join(os.tmpdir(), "bsseeded."));
    const rotA = fs.mkdtempSync(path.join(os.tmpdir(), "bsrota."));
    const rotB = fs.mkdtempSync(path.join(os.tmpdir(), "bsrotb."));
    const linkDir = fs.mkdtempSync(path.join(os.tmpdir(), "bslink."));
    const liveServers = [];
    const allDirs = [tokenDir, firstDir, secondDir, thirdDir, rotA, rotB, linkDir];
    const track = (child) => { liveServers.push(child); return child; };
    try {
      const first = track(startServer(firstDir, { BRAINSTORM_TOKEN_FILE: tokenFile }));
      const firstInfo = await waitForServerInfo(firstDir);
      first.kill();
      await waitForClose(first);
      // The first launch generated a fresh key and persisted it to the file.
      const persisted = fs.readFileSync(tokenFile, "utf-8").trim();
      const second = track(startServer(secondDir, { BRAINSTORM_TOKEN_FILE: tokenFile }));
      const secondInfo = await waitForServerInfo(secondDir);
      second.kill();
      await waitForClose(second);
      const firstKey = firstInfo.url.split("key=")[1];
      const secondKey = secondInfo.url.split("key=")[1];
      report("token file persists the key across restarts",
          /^[0-9a-f]{64}$/.test(persisted) &&
          firstKey === persisted && secondKey === persisted);
      // A pre-seeded token file is reused as-is (no regeneration).
      const seeded = "b".repeat(64);
      fs.writeFileSync(tokenFile, seeded);
      const third = track(startServer(thirdDir, { BRAINSTORM_TOKEN_FILE: tokenFile }));
      const thirdInfo = await waitForServerInfo(thirdDir);
      third.kill();
      await waitForClose(third);
      report("pre-seeded token file is honored",
          thirdInfo.url.split("key=")[1] === seeded);
      // A symlinked token file must NOT be adopted as the session key: the
      // server generates a fresh key instead, and the link target is never
      // written (the O_NOFOLLOW write path rejects the symlink).
      const linkFile = path.join(tokenDir, "link-token");
      const targetFile = path.join(tokenDir, "target-token");
      const evil = "c".repeat(64);
      fs.writeFileSync(targetFile, evil);
      let symlinkOk = true;
      try {
        fs.symlinkSync(targetFile, linkFile);
      } catch (e) {
        symlinkOk = false; // no symlink privilege (Windows without dev mode)
      }
      if (symlinkOk) {
        const linkServer = track(startServer(linkDir, { BRAINSTORM_TOKEN_FILE: linkFile }));
        const linkInfo = await waitForServerInfo(linkDir);
        linkServer.kill();
        await waitForClose(linkServer);
        const linkKey = linkInfo.url.split("key=")[1];
        const targetAfter = fs.readFileSync(targetFile, "utf-8");
        report("symlinked token file rejected",
            /^[0-9a-f]{64}$/.test(linkKey) && linkKey !== evil &&
            targetAfter === evil && fs.lstatSync(linkFile).isSymbolicLink());
      } else {
        report("symlinked token file rejected (skipped: no symlink privilege)", true);
      }
      // Without a token file, keys still rotate per logical session.
      const ra = track(startServer(rotA, {}));
      const raInfo = await waitForServerInfo(rotA);
      ra.kill();
      await waitForClose(ra);
      const rb = track(startServer(rotB, {}));
      const rbInfo = await waitForServerInfo(rotB);
      rb.kill();
      await waitForClose(rb);
      report("key rotates without a token file",
          raInfo.url.split("key=")[1] !== rbInfo.url.split("key=")[1]);
    } finally {
      // Never orphan servers or leak temp dirs on any failure path.
      for (const c of liveServers) {
        try { c.kill(); } catch (e) { /* already gone */ }
      }
      for (const d of allDirs) fs.rmSync(d, { recursive: true, force: true });
    }

    if (serverStderr.trim()) {
        console.log("\n[server stderr]\n" + serverStderr.trim());
    }
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed === 0 ? 0 : 1);
}

run().catch((err) => {
    console.error("❌ Test run failed:", err);
    process.exit(1);
});
