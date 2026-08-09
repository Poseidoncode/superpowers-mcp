const crypto = require('crypto');
const http = require('http');
const fs = require('fs');
const path = require('path');
const net = require('net');

// ========== WebSocket Protocol (RFC 6455) ==========

const OPCODES = { TEXT: 0x01, CLOSE: 0x08, PING: 0x09, PONG: 0x0A };
const WS_MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const MAX_FRAME_PAYLOAD_BYTES = 10 * 1024 * 1024;
// Bound concurrent WebSocket clients (each holds a frame buffer up to
// MAX_FRAME_PAYLOAD_BYTES) so an authenticated local client can't exhaust
// memory. Generous: covers many browser tabs plus scripted clients.
const MAX_WS_CLIENTS = 16;
const WS_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const WS_FRAME_TIMEOUT_MS = 5000;
// Screens are agent-generated HTML; cap how much of one we'll read/serve.
const MAX_SCREEN_BYTES = 20 * 1024 * 1024;
// Cap the per-session events log (dropped oldest when exceeded).
const MAX_EVENTS_FILE_BYTES = 1024 * 1024;
const MAX_LOG_EVENT_BYTES = 4096;

function computeAcceptKey(clientKey) {
  return crypto.createHash('sha1').update(clientKey + WS_MAGIC).digest('base64');
}

function encodeFrame(opcode, payload) {
  const fin = 0x80;
  const len = payload.length;
  let header;

  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = fin | opcode;
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = fin | opcode;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = fin | opcode;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }

  return Buffer.concat([header, payload]);
}

function decodeFrame(buffer) {
  if (buffer.length < 2) return null;

  const secondByte = buffer[1];
  const opcode = buffer[0] & 0x0F;
  const masked = (secondByte & 0x80) !== 0;
  let payloadLen = secondByte & 0x7F;
  let offset = 2;

  if (!masked) throw new Error('Client frames must be masked');

  if (payloadLen === 126) {
    if (buffer.length < 4) return null;
    payloadLen = buffer.readUInt16BE(2);
    offset = 4;
  } else if (payloadLen === 127) {
    if (buffer.length < 10) return null;
    const extendedLen = buffer.readBigUInt64BE(2);
    if (extendedLen > BigInt(MAX_FRAME_PAYLOAD_BYTES)) {
      throw new Error('WebSocket frame payload exceeds maximum allowed size');
    }
    payloadLen = Number(extendedLen);
    offset = 10;
  }

  if (payloadLen > MAX_FRAME_PAYLOAD_BYTES) {
    throw new Error('WebSocket frame payload exceeds maximum allowed size');
  }

  // RFC 6455 §5.5: control frames (opcodes 0x8-0xA) must have payloads
  // of at most 125 bytes. Enforce it so a PING can't be used to amplify.
  if (opcode >= 0x8 && payloadLen > 125) {
    throw new Error('WebSocket control frame payload exceeds 125 bytes');
  }

  const maskOffset = offset;
  const dataOffset = offset + 4;
  const totalLen = dataOffset + payloadLen;
  if (buffer.length < totalLen) return null;

  const mask = buffer.slice(maskOffset, dataOffset);
  const data = Buffer.alloc(payloadLen);
  for (let i = 0; i < payloadLen; i++) {
    data[i] = buffer[dataOffset + i] ^ mask[i % 4];
  }

  return { opcode, payload: data, bytesConsumed: totalLen };
}

// ========== Configuration ==========

const PORT_FILE = process.env.BRAINSTORM_PORT_FILE || null;
// Per-session secret key. The companion is reachable by any local browser tab.
// The key authenticates the client, rides the served URL as ?key=, and is
// mirrored into a HttpOnly cookie on first load so the WebSocket and /files/*
// subresources authenticate for free. When BRAINSTORM_TOKEN_FILE is set (the
// persistent --project-dir launcher mode), the key is persisted alongside the
// port so a restart reuses it and an already-open browser tab's cookie keeps
// validating. Without a token file the key is rotated on every server start.
const TOKEN_FILE = process.env.BRAINSTORM_TOKEN_FILE || null;
const randomPort = () => 49152 + Math.floor(Math.random() * 16383);
// Prefer an explicit port, else the port this session last bound, else a random
// high port.
function preferredPort() {
  if (process.env.BRAINSTORM_PORT) {
    const p = Number(process.env.BRAINSTORM_PORT);
    if (Number.isInteger(p) && p > 1023 && p < 65536) return p;
  }
  if (PORT_FILE) {
    try {
      const p = Number(fs.readFileSync(PORT_FILE, 'utf-8').trim());
      if (Number.isInteger(p) && p > 1023 && p < 65536) return p;
    } catch (e) { /* no prior port recorded */ }
  }
  return randomPort();
}
let PORT = preferredPort();
function isLoopbackHost(value) {
  const host = String(value).trim().replace(/^\[|\]$/g, '').toLowerCase();
  return host === 'localhost' || host === '::1' || (net.isIP(host) === 4 && host.startsWith('127.'));
}

const HOST = process.env.BRAINSTORM_HOST || '127.0.0.1';
if (!isLoopbackHost(HOST)) {
  console.error('Refusing insecure non-loopback HTTP bind; use a TLS reverse proxy or tunnel to 127.0.0.1');
  process.exit(1);
}
const URL_HOST = process.env.BRAINSTORM_URL_HOST || (HOST === '127.0.0.1' ? 'localhost' : HOST);
if (!isLoopbackHost(URL_HOST)) {
  console.error('BRAINSTORM_URL_HOST must be a loopback hostname or address');
  process.exit(1);
}
const SESSION_DIR = process.env.BRAINSTORM_DIR || '/tmp/brainstorm';
const CONTENT_DIR = path.join(SESSION_DIR, 'content');
const STATE_DIR = path.join(SESSION_DIR, 'state');
const SUPERPOWERS_VERSION = readSuperpowersVersion();
// The brand mark is served locally from /brand-logo.svg so the page never
// contacts a third-party host; the SVG payload is generated inline below.
const SUPERPOWERS_BRAND_IMAGE_URL = '/brand-logo.svg';
const BRAND_LOGO_SVG = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 24' role='img' aria-label='Superpowers'><g fill='#fff'><path d='M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z' transform='translate(0 2.5) scale(0.62)'/><text x='24' y='17.5' font-family='system-ui, sans-serif' font-size='15' font-weight='700' letter-spacing='2.5'>SUPERPOWERS</text></g></svg>";
const TELEMETRY_DISABLE_ENV_VARS = [
  'SUPERPOWERS_DISABLE_TELEMETRY',
  'DISABLE_TELEMETRY',
  'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC'
];
const SUPERPOWERS_TELEMETRY_DISABLED = TELEMETRY_DISABLE_ENV_VARS.some(name => isTruthyEnv(process.env[name]));
let ownerPid = process.env.BRAINSTORM_OWNER_PID ? Number(process.env.BRAINSTORM_OWNER_PID) : null;

// A 256-bit secret. An explicitly supplied BRAINSTORM_TOKEN is retained for
// controlled integrations. In persistent launcher mode (BRAINSTORM_TOKEN_FILE)
// the key is reused across restarts so already-open tabs stay authenticated;
// otherwise each server invocation gets a fresh key. Persistence is best effort:
// a write failure must never prevent the server from starting.
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Mirror of writePrivateFile for the read path: the token file must be a
// regular, single-link, non-symlink file. The fd is opened with O_NOFOLLOW and
// its identity re-checked, and it is tightened to 0600 via the fd — never a
// path-based chmod, which would follow a symlink to an attacker-chosen target.
// Returns the file content or null on any violation/error.
function readPrivateFile(filePath) {
  const noFollow = fs.constants.O_NOFOLLOW || 0;
  try {
    const before = fs.lstatSync(filePath);
    if (before.isSymbolicLink() || !before.isFile() || before.nlink !== 1) return null;
    const fd = fs.openSync(filePath, fs.constants.O_RDONLY | noFollow);
    try {
      const stat = fs.fstatSync(fd);
      if (!stat.isFile() || stat.nlink !== 1 || !sameFileIdentity(before, stat)) return null;
      fs.fchmodSync(fd, 0o600);
      return fs.readFileSync(fd, 'utf-8');
    } finally {
      fs.closeSync(fd);
    }
  } catch (e) {
    return null;
  }
}

function initialToken() {
  if (process.env.BRAINSTORM_TOKEN) {
    const t = String(process.env.BRAINSTORM_TOKEN).trim();
    if (/^[0-9a-f]{32,}$/i.test(t)) {
      // A file path is not touched when the env token wins: the env value is a
      // transient override for controlled integrations, and persisting it would
      // turn a one-off secret into a durable one. Note the interaction: a later
      // launch without the env var falls back to whatever .last-token holds.
      return { value: t, source: 'env' };
    }
  }
  if (TOKEN_FILE && path.isAbsolute(TOKEN_FILE)) {
    // No prior token recorded (or the file fails the regular-file checks below)
    // — either way, fall through to generating a fresh key.
    const t = readPrivateFile(TOKEN_FILE);
    if (t !== null && /^[0-9a-f]{32,}$/i.test(t.trim())) {
      return { value: t.trim(), source: 'file' };
    }
  }
  const generated = { value: generateToken(), source: 'generated' };
  if (TOKEN_FILE && path.isAbsolute(TOKEN_FILE)) {
    // Persist the key so a restart reuses it; best effort only — a write
    // failure must never prevent the server from starting, but it silently
    // degrades "restart keeps the tab alive" into per-start rotation.
    if (!writePrivateFile(TOKEN_FILE, generated.value + '\n')) {
      console.error('Failed to write private token file:', TOKEN_FILE);
    }
  }
  return generated;
}

const tokenInfo = initialToken();
const TOKEN = tokenInfo.value;
const tokenSource = tokenInfo.source;
let COOKIE_NAME = 'brainstorm-key-' + PORT; // refined to the actual bound port in onListen

const MIME_TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml'
};

// ========== Templates and Constants ==========

function waitingPage() {
  return renderBranding(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Brainstorm Companion</title>
<style>
body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
h1 { color: #333; } p { color: #666; }
.brand { display: flex; align-items: center; min-width: 0; overflow: hidden; margin-bottom: 1.5rem; color: #666; font-size: 0.9rem; line-height: 1; }
.brand a { color: inherit; text-decoration: none; display: flex; align-items: center; gap: 0.5rem; min-width: 0; max-width: 100%; line-height: 1; }
.brand-copy { display: block; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1; transform: translateY(-1px); }
.brand-logo { display: block; height: 1em; width: auto; max-width: 180px; filter: invert(1); }
</style>
</head>
<body><!-- BRANDING --><h1>Brainstorm Companion</h1>
<p>Waiting for the agent to push a screen...</p></body></html>`);
}

const FORBIDDEN_PAGE = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Session key required</title>
<style>body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
h1 { color: #333; } p { color: #666; } code { background: #f0f0f0; padding: 0.1em 0.3em; border-radius: 4px; }</style>
</head>
<body><h1>Session key required</h1>
<p>This page needs the full URL your coding agent gave you, including the
<code>?key=&hellip;</code> part. Copy the complete URL and open it again.</p></body></html>`;

const frameTemplate = fs.readFileSync(path.join(__dirname, 'frame-template.html'), 'utf-8');
const helperScript = fs.readFileSync(path.join(__dirname, 'helper.js'), 'utf-8');
function helperInjection(nonce) {
  return '<script nonce="' + nonce + '">\n' + helperScript + '\n</script>';
}

// ========== Helper Functions ==========

function readSuperpowersVersion() {
  const root = path.join(__dirname, '../../..');
  const manifests = [
    path.join(root, 'package.json'),
    path.join(root, '.codex-plugin/plugin.json')
  ];

  for (const manifest of manifests) {
    try {
      const data = JSON.parse(fs.readFileSync(manifest, 'utf-8'));
      if (data.version) return String(data.version);
    } catch (e) {
      // Packaged Codex plugins omit package.json; try the next manifest.
    }
  }

  return 'unknown';
}

function isTruthyEnv(value) {
  if (!value) return false;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return false;
  return !['0', 'false', 'no', 'off'].includes(normalized);
}

function escapeHtmlText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function brandMarkup() {
  const version = escapeHtmlText(SUPERPOWERS_VERSION);
  const text = SUPERPOWERS_TELEMETRY_DISABLED
    ? 'Prime Radiant Superpowers v' + version
    : 'Superpowers v' + version;
  const logo = SUPERPOWERS_TELEMETRY_DISABLED
    ? ''
    : '<img class="brand-logo" src="' + SUPERPOWERS_BRAND_IMAGE_URL + '" alt="Prime Radiant" referrerpolicy="no-referrer" decoding="async">';

  return '<div class="brand"><a href="https://github.com/obra/superpowers">' + logo + '<span class="brand-copy">' + text + '</span></a></div>';
}

function renderBranding(html) {
  return html.split('<!-- BRANDING -->').join(brandMarkup());
}

function isFullDocument(html) {
  const trimmed = html.trimStart().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

function wrapInFrame(content) {
  return renderBranding(frameTemplate).replace('<!-- CONTENT -->', content);
}

function ensurePrivateDirectory(directory) {
  try {
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    const stat = fs.lstatSync(directory);
    if (stat.isSymbolicLink() || !stat.isDirectory()) return false;
    fs.chmodSync(directory, 0o700);
    return true;
  } catch (e) {
    return false;
  }
}

function openPrivateAppendFile(filePath) {
  const noFollow = fs.constants.O_NOFOLLOW || 0;
  let before = null;
  try {
    before = fs.lstatSync(filePath);
    if (before.isSymbolicLink() || !before.isFile() || before.nlink !== 1) return null;
  } catch (e) {
    if (e.code !== 'ENOENT') return null;
  }

  let fd = null;
  const appendFlags = fs.constants.O_WRONLY | fs.constants.O_APPEND | fs.constants.O_CREAT | noFollow;
  try {
    if (!before) {
      try {
        fd = fs.openSync(filePath, appendFlags | fs.constants.O_EXCL, 0o600);
      } catch (e) {
        if (e.code !== 'EEXIST') throw e;
      }
    }
    if (fd === null) {
      before = fs.lstatSync(filePath);
      if (before.isSymbolicLink() || !before.isFile() || before.nlink !== 1) return null;
      fd = fs.openSync(filePath, appendFlags, 0o600);
    }
    const actual = fs.fstatSync(fd);
    if (!actual.isFile() || actual.nlink !== 1 || (before && !sameFileIdentity(before, actual))) {
      fs.closeSync(fd);
      return null;
    }
    fs.fchmodSync(fd, 0o600);
    return fd;
  } catch (e) {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch (closeErr) { /* already closed */ }
    }
    return null;
  }
}

function writePrivateFile(filePath, data) {
  const noFollow = fs.constants.O_NOFOLLOW || 0;
  let before = null;
  try {
    before = fs.lstatSync(filePath);
    if (before.isSymbolicLink() || !before.isFile() || before.nlink !== 1) return false;
  } catch (e) {
    if (e.code !== 'ENOENT') return false;
  }

  let fd = null;
  const writeFlags = fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_TRUNC | noFollow;
  try {
    if (!before) {
      try {
        fd = fs.openSync(filePath, writeFlags | fs.constants.O_EXCL, 0o600);
      } catch (e) {
        if (e.code !== 'EEXIST') throw e;
      }
    }
    if (fd === null) {
      before = fs.lstatSync(filePath);
      if (before.isSymbolicLink() || !before.isFile() || before.nlink !== 1) return false;
      fd = fs.openSync(filePath, writeFlags, 0o600);
    }
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || stat.nlink !== 1 || (before && !sameFileIdentity(before, stat))) return false;
    fs.fchmodSync(fd, 0o600);
    fs.writeFileSync(fd, data);
    return true;
  } catch (e) {
    return false;
  } finally {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch (e) { /* already closed */ }
    }
  }
}

// Best-effort: return the newest screen file, or null when the content dir is
// missing/empty or a file vanished between readdir and stat (the agent may be
// writing screens concurrently). Callers must not let a throw escape the
// request handler — an uncaught ENOENT there would crash the whole server.
function getNewestScreen() {
  try {
    const files = fs.readdirSync(CONTENT_DIR)
      .filter(f => !f.startsWith('.') && f.endsWith('.html'))
      .map(f => {
        const fp = path.join(CONTENT_DIR, f);
        if (!isRegularFileInsideContentDir(fp)) return null;
        try {
          const st = fs.statSync(fp);
          if (!st.isFile() || st.size > MAX_SCREEN_BYTES) return null;
          return { path: fp, mtime: st.mtime.getTime() };
        } catch (e) {
          return null; // deleted between readdir and stat
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.mtime - a.mtime);
    return files.length > 0 ? files[0].path : null;
  } catch (e) {
    console.error('Failed to list screens:', e.message);
    return null;
  }
}

// Make sure the content dir exists (it may have been deleted at runtime) and
// the watcher is (re-)established so new screens keep triggering reloads.
function ensureContentDir() {
  if (!ensurePrivateDirectory(CONTENT_DIR)) {
    console.error('Failed to recreate or validate content dir');
    return false;
  }
  ensureContentWatcher();
  return true;
}

// Resolve a content file and capture its identity before opening it. The
// second resolution plus fd-level identity check closes the check/open race:
// if a parent directory or file is swapped between checks, the opened fd no
// longer matches the expected device/inode and the read is rejected.
function resolveContentFile(filePath) {
  const contentDirStat = fs.lstatSync(CONTENT_DIR);
  if (contentDirStat.isSymbolicLink() || !contentDirStat.isDirectory()) return null;

  const realContentDir = fs.realpathSync(CONTENT_DIR);
  const pathStat = fs.lstatSync(filePath);
  if (pathStat.isSymbolicLink() || !pathStat.isFile() || pathStat.nlink !== 1) return null;

  const realFilePath = fs.realpathSync(filePath);
  const relative = path.relative(realContentDir, realFilePath);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return null;

  const stat = fs.statSync(realFilePath);
  if (!stat.isFile() || stat.nlink !== 1) return null;
  return { realFilePath, stat };
}

function sameFileIdentity(a, b) {
  return a.dev === b.dev && a.ino === b.ino;
}

// Read a file from CONTENT_DIR defensively: open with O_NOFOLLOW (POSIX) and
// fstat the open fd so a concurrent writer can't swap the file for a symlink
// or an oversized file between our identity check and the read. Returns null
// on any failure — callers must treat null as "not found" and MUST NOT call
// writeHead again after a 200 was already sent (that throws
// ERR_HTTP_HEADERS_SENT and crashes the process).
function readContentFile(filePath, maxBytes) {
  let fd = null;
  try {
    const expected = resolveContentFile(filePath);
    if (!expected || expected.stat.size > maxBytes) return null;

    const confirmed = resolveContentFile(filePath);
    if (
      !confirmed ||
      expected.realFilePath !== confirmed.realFilePath ||
      !sameFileIdentity(expected.stat, confirmed.stat)
    ) return null;

    fd = fs.openSync(filePath, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
    const st = fs.fstatSync(fd);
    if (!st.isFile() || st.nlink !== 1 || st.size > maxBytes || !sameFileIdentity(st, confirmed.stat)) return null;

    const chunks = [];
    const chunkSize = 64 * 1024;
    let total = 0;
    while (total <= maxBytes) {
      const buffer = Buffer.allocUnsafe(Math.min(chunkSize, maxBytes + 1 - total));
      const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, null);
      if (bytesRead === 0) break;
      total += bytesRead;
      chunks.push(buffer.subarray(0, bytesRead));
      if (total > maxBytes) return null;
    }

    const after = fs.fstatSync(fd);
    if (!after.isFile() || after.nlink !== 1 || after.size > maxBytes || !sameFileIdentity(after, confirmed.stat)) return null;
    return Buffer.concat(chunks, total);
  } catch (e) {
    return null;
  } finally {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch (e) { /* already closed */ }
    }
  }
}

function serveScreen() {
  ensureContentDir();
  const screenFile = getNewestScreen();
  if (!screenFile) return waitingPage();
  const raw = readContentFile(screenFile, MAX_SCREEN_BYTES);
  if (raw === null) {
    console.error('Failed to read screen:', screenFile);
    return waitingPage();
  }
  const html = raw.toString('utf-8');
  return isFullDocument(html) ? html : wrapInFrame(html);
}

function urlHostForHttp(host) {
  const h = String(host);
  if (h.startsWith('[') && h.endsWith(']')) return h;
  return h.includes(':') ? '[' + h + ']' : h;
}

function companionUrl() {
  return 'http://' + urlHostForHttp(URL_HOST) + ':' + PORT + '/?key=' + TOKEN;
}

function browserLauncherForPlatform(url, {
  platform = process.platform,
  osRelease = require('os').release(),
  env = process.env
} = {}) {
  const isWSL = platform === 'linux' && /microsoft/i.test(osRelease);
  if (platform === 'darwin') return { bin: 'open', args: [url] };
  if (platform === 'win32' || isWSL) {
    return { bin: 'rundll32.exe', args: ['url.dll,FileProtocolHandler', url] };
  }
  if (env.DISPLAY || env.WAYLAND_DISPLAY) return { bin: 'xdg-open', args: [url] };
  return null;
}

function isRegularFileInsideContentDir(filePath) {
  try {
    return resolveContentFile(filePath) !== null;
  } catch (e) {
    return false;
  }
}

// ========== Authentication ==========

function timingSafeEqualStr(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    out[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }
  return out;
}

// A request is authorized if it carries the session key as ?key= or as the
// session cookie. Both are compared in constant time.
function isAuthorized(req) {
  const q = req.url.indexOf('?');
  if (q >= 0) {
    const params = new URLSearchParams(req.url.slice(q + 1));
    if (params.has('key')) {
      const key = params.get('key');
      return Boolean(key && timingSafeEqualStr(key, TOKEN));
    }
  }
  const cookie = parseCookies(req.headers['cookie'])[COOKIE_NAME];
  if (cookie && timingSafeEqualStr(cookie, TOKEN)) return true;
  return false;
}

function pathnameOf(url) {
  const q = url.indexOf('?');
  return q >= 0 ? url.slice(0, q) : url;
}

function queryKey(url) {
  const q = url.indexOf('?');
  if (q < 0) return null;
  return new URLSearchParams(url.slice(q + 1)).get('key');
}

function securityHeaders(headers = {}, scriptNonce = null) {
  const scriptSource = scriptNonce ? "'nonce-" + scriptNonce + "'" : "'none'";
  return {
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-store',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; script-src " + scriptSource + "; style-src 'unsafe-inline'; img-src 'self'; connect-src 'self' ws: wss:; frame-ancestors 'none'; base-uri 'none'; object-src 'none'; form-action 'none'",
    'Cross-Origin-Resource-Policy': 'same-origin',
    ...headers
  };
}

function isAllowedWebSocketOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const host = req.headers.host;
  if (!host) return false;
  return origin === 'http://' + host;
}

// ========== HTTP Request Handler ==========

function handleRequest(req, res) {
  if (!isAuthorized(req)) {
    res.writeHead(403, securityHeaders({ 'Content-Type': 'text/html; charset=utf-8' }));
    res.end(FORBIDDEN_PAGE);
    return;
  }
  touchActivity(); // only authorized requests count as activity

  // Mirror the key into a cookie so same-origin subresources (/files/*) can
  // authenticate after bootstrap. HttpOnly keeps it away from page scripts; the
  // WebSocket Origin check below is what blocks cross-origin localhost injection.
  res.setHeader('Set-Cookie',
    COOKIE_NAME + '=' + TOKEN + '; HttpOnly; SameSite=Strict; Path=/');

  const pathname = pathnameOf(req.url);
  const keyFromQuery = queryKey(req.url);
  if (req.method === 'GET' && pathname === '/' && keyFromQuery && timingSafeEqualStr(keyFromQuery, TOKEN)) {
    res.writeHead(303, securityHeaders({ Location: '/' }));
    res.end();
  } else if (req.method === 'GET' && pathname === '/') {
    let html = serveScreen();
    const nonce = crypto.randomBytes(16).toString('base64');
    const injection = helperInjection(nonce);

    if (html.includes('</body>')) {
      html = html.replace('</body>', injection + '\n</body>');
    } else {
      html += injection;
    }

    res.writeHead(200, securityHeaders({ 'Content-Type': 'text/html; charset=utf-8' }, nonce));
    res.end(html);
  } else if (req.method === 'GET' && pathname === '/brand-logo.svg') {
    // Locally-generated brand mark; same-origin so img-src 'self' suffices.
    res.writeHead(200, securityHeaders({ 'Content-Type': 'image/svg+xml; charset=utf-8' }));
    res.end(BRAND_LOGO_SVG);
  } else if (req.method === 'GET' && pathname.startsWith('/files/')) {
    const fileName = path.basename(pathname.slice(7));
    const filePath = path.join(CONTENT_DIR, fileName);
    // Reject empty/dotfile names and anything that isn't a regular file —
    // `/files/` would otherwise resolve to CONTENT_DIR and crash readFileSync (EISDIR).
    if (!fileName || fileName.startsWith('.') || !isRegularFileInsideContentDir(filePath)) {
      res.writeHead(404, securityHeaders());
      res.end('Not found');
      return;
    }
    // Read FIRST, headers after: if the file vanished between the identity
    // check and the read, writeHead(200) was never sent and the 404 below is
    // legal. (Writing 200, then throwing and writing 404 in a catch would
    // itself throw ERR_HTTP_HEADERS_SENT and crash the process.)
    const data = readContentFile(filePath, MAX_SCREEN_BYTES);
    if (data === null) {
      res.writeHead(404, securityHeaders());
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, securityHeaders({ 'Content-Type': contentType }));
    res.end(data);
  } else {
    res.writeHead(404, securityHeaders());
    res.end('Not found');
  }
}

// ========== WebSocket Connection Handling ==========

const clients = new Set();

// RFC 6455 handshake validation: only accept genuine WebSocket upgrade
// requests, so an authenticated-but-non-WS client can't enter the frame
// parser (and so a cross-protocol request can't piggyback on the socket).
function isWebSocketUpgradeRequest(req) {
  const upgrade = String(req.headers.upgrade || '').toLowerCase();
  const connection = String(req.headers.connection || '').toLowerCase()
    .split(',').map(s => s.trim());
  const version = String(req.headers['sec-websocket-version'] || '');
  const key = String(req.headers['sec-websocket-key'] || '');
  // 16 random bytes, base64-encoded (22 chars + '==' padding).
  const validKey = /^[A-Za-z0-9+/]{22}==$/.test(key);
  return upgrade === 'websocket' &&
    connection.includes('upgrade') &&
    version === '13' &&
    validKey;
}

function handleUpgrade(req, socket) {
  if (!isAuthorized(req) || !isAllowedWebSocketOrigin(req)) { socket.destroy(); return; }
  if (!isWebSocketUpgradeRequest(req)) { socket.destroy(); return; }
  // The companion's WebSocket lives at '/' only (helper.js connects there).
  if (pathnameOf(req.url) !== '/') { socket.destroy(); return; }

  const key = req.headers['sec-websocket-key'];
  if (!key) { socket.destroy(); return; }

  // Keep the cap, but evict the oldest connection so a client cannot reserve
  // every slot indefinitely and prevent a fresh browser from connecting.
  if (clients.size >= MAX_WS_CLIENTS) {
    const oldest = clients.values().next().value;
    if (oldest) {
      clients.delete(oldest);
      try { oldest.destroy(); } catch (e) { /* already gone */ }
    }
  }

  const accept = computeAcceptKey(key);
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    'Sec-WebSocket-Accept: ' + accept + '\r\n\r\n'
  );

  let buffer = Buffer.alloc(0);
  let closed = false;
  let partialFrameTimer = null;
  clients.add(socket);

  const clearPartialFrameTimer = () => {
    if (partialFrameTimer !== null) {
      clearTimeout(partialFrameTimer);
      partialFrameTimer = null;
    }
  };
  const armPartialFrameTimer = () => {
    if (partialFrameTimer !== null) return;
    partialFrameTimer = setTimeout(() => {
      partialFrameTimer = null;
      closed = true;
      clients.delete(socket);
      socket.destroy();
    }, WS_FRAME_TIMEOUT_MS);
    partialFrameTimer.unref();
  };
  const closeSocket = (code = 1000) => {
    if (closed) return;
    closed = true;
    clients.delete(socket);
    clearPartialFrameTimer();
    const closeBuf = Buffer.alloc(code === 1000 ? 0 : 2);
    if (closeBuf.length) closeBuf.writeUInt16BE(code);
    try { socket.end(encodeFrame(OPCODES.CLOSE, closeBuf)); } catch (e) { /* best effort */ }
    socket.pause();
    socket.destroySoon();
  };

  socket.setTimeout(WS_IDLE_TIMEOUT_MS, () => closeSocket(1001));
  socket.on('data', (chunk) => {
    // RFC 6455 §5.5.1: after sending CLOSE we must not process further
    // frames — a peer could otherwise keep writing events (and extending
    // its activity influence) in the window before destruction.
    if (closed) return;
    buffer = Buffer.concat([buffer, chunk]);
    if (buffer.length > MAX_FRAME_PAYLOAD_BYTES + 14) {
      closeSocket(1009);
      return;
    }
    while (buffer.length > 0) {
      let result;
      try {
        result = decodeFrame(buffer);
      } catch (e) {
        closeSocket(1002);
        return;
      }
      if (!result) {
        armPartialFrameTimer();
        return;
      }
      buffer = buffer.slice(result.bytesConsumed);
      clearPartialFrameTimer();

      switch (result.opcode) {
        case OPCODES.TEXT:
          handleMessage(result.payload.toString());
          break;
        case OPCODES.CLOSE:
          closeSocket();
          return;
        case OPCODES.PING:
          socket.write(encodeFrame(OPCODES.PONG, result.payload));
          break;
        case OPCODES.PONG:
          break;
        default:
          closeSocket(1003);
          return;
      }
    }
  });

  socket.on('close', () => {
    clearPartialFrameTimer();
    clients.delete(socket);
  });
  socket.on('error', () => {
    clearPartialFrameTimer();
    clients.delete(socket);
  });
}

function appendEvent(event) {
  const eventsFile = path.join(STATE_DIR, 'events');
  const serialized = JSON.stringify(event);
  if (typeof serialized !== 'string') return;
  const line = serialized + '\n';
  const lineBytes = Buffer.byteLength(line, 'utf8');
  if (lineBytes > MAX_EVENTS_FILE_BYTES) {
    console.error('User event exceeds events file size limit');
    return;
  }

  const fd = openPrivateAppendFile(eventsFile);
  if (fd === null) {
    console.error('Failed to append user event: events path is not a private regular file');
    return;
  }
  try {
    const current = fs.fstatSync(fd);
    if (current.size + lineBytes > MAX_EVENTS_FILE_BYTES) {
      fs.ftruncateSync(fd, 0);
    }
    fs.writeSync(fd, line);
  } catch (e) {
    // STATE_DIR may have been deleted at runtime — never let a user event
    // crash the server.
    console.error('Failed to append user event:', e.message);
  } finally {
    try { fs.closeSync(fd); } catch (e) { /* already closed */ }
  }
}

function handleMessage(text) {
  let event;
  try {
    event = JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse WebSocket message:', e.message);
    return;
  }
  touchActivity();
  // Spread first so 'source' always wins: a client-supplied "source" field
  // must not be able to spoof the event origin in the log.
  const logLine = JSON.stringify({ ...event, source: 'user-event' });
  const logOutput = Buffer.byteLength(logLine, 'utf8') <= MAX_LOG_EVENT_BYTES
    ? logLine
    : JSON.stringify({ source: 'user-event', truncated: true });
  console.log(logOutput);
  if (event && event.choice) {
    appendEvent(event);
  }
}

function broadcast(msg) {
  const frame = encodeFrame(OPCODES.TEXT, Buffer.from(JSON.stringify(msg)));
  for (const socket of clients) {
    try { socket.write(frame); } catch (e) { clients.delete(socket); }
  }
}

// Best-effort: open the user's browser the first time a screen is actually ready
// to show. Skips when disabled, on a non-loopback (remote) bind, or when a
// browser is already connected. Override the launcher with BRAINSTORM_OPEN_CMD.
let browserOpened = false;
function maybeOpenBrowser() {
  if (browserOpened) return;
  browserOpened = true;
  if (!process.env.BRAINSTORM_OPEN) return; // opt-in: only after the user approves the companion
  if (HOST !== '127.0.0.1' && HOST !== 'localhost') return;
  if (clients.size > 0) return; // the user already opened it
  const url = companionUrl(); // must carry the key or the gate 403s it
  const cp = require('child_process');
  // Operator-provided launcher: run via execFile (no shell) so a malicious env var
  // cannot inject commands through shell metacharacters.
  if (process.env.BRAINSTORM_OPEN_CMD) {
    try { cp.execFile(process.env.BRAINSTORM_OPEN_CMD, [url], () => {}); } catch (e) { /* best effort */ }
    return;
  }
  // Platform launchers: pass the URL as an argv element via execFile (no shell),
  // so a url-host containing shell metacharacters can't inject a command.
  const launcher = browserLauncherForPlatform(url);
  if (!launcher) return; // headless: nothing to open
  try { cp.execFile(launcher.bin, launcher.args, () => {}); } catch (e) { /* best effort */ }
}

// ========== Activity Tracking ==========

// Idle timeout: shut down after this long with no activity. Default 4 hours;
// override with BRAINSTORM_IDLE_TIMEOUT_MS (start-server.sh: --idle-timeout-minutes).
const IDLE_TIMEOUT_MS = (() => {
  const ms = Number(process.env.BRAINSTORM_IDLE_TIMEOUT_MS);
  return Number.isFinite(ms) && ms > 0 ? ms : 4 * 60 * 60 * 1000;
})();
// How often the watchdog checks for owner-death / idleness. Configurable mainly
// so tests can run fast; production default is 60s.
const LIFECYCLE_CHECK_MS = (() => {
  const ms = Number(process.env.BRAINSTORM_LIFECYCLE_CHECK_MS);
  return Number.isFinite(ms) && ms > 0 ? ms : 60 * 1000;
})();
let lastActivity = Date.now();

function touchActivity() {
  lastActivity = Date.now();
}

// ========== File Watching ==========

const debounceTimers = new Map();
let watcher = null;
let watcherRetryTimer = null;
let knownFiles = new Set();
let contentDirIno = null;

// Track known files to distinguish new screens from updates.
// macOS fs.watch reports 'rename' for both new files and overwrites,
// so we can't rely on eventType alone.
function rescanKnownFiles() {
  try {
    knownFiles = new Set(
      fs.readdirSync(CONTENT_DIR).filter(f => !f.startsWith('.') && f.endsWith('.html'))
    );
  } catch (e) {
    knownFiles = new Set();
  }
}

function currentContentIno() {
  try {
    return fs.statSync(CONTENT_DIR).ino;
  } catch (e) {
    return null;
  }
}

function onContentEvent(eventType, filename) {
  // The watched directory itself was deleted. On Linux, inotify reports
  // IN_DELETE_SELF/IN_IGNORED as a plain 'rename' event carrying the dir's
  // OWN basename and NO error — so the watcher stays non-null while being
  // dead. Tear it down so ensureContentWatcher can re-arm it once the dir is
  // recreated. Guard with an inode check: a LATE delete event from an old,
  // already-replaced watcher can arrive after the new watcher is live, and
  // we must not kill the healthy new watcher.
  if (filename === path.basename(CONTENT_DIR)) {
    const ino = currentContentIno();
    if (ino === null || ino !== contentDirIno) {
      stopWatcher();
    }
    return;
  }
  if (!filename || filename.startsWith('.') || !filename.endsWith('.html')) return;

  if (debounceTimers.has(filename)) clearTimeout(debounceTimers.get(filename));
  debounceTimers.set(filename, setTimeout(() => {
    debounceTimers.delete(filename);
    const filePath = path.join(CONTENT_DIR, filename);

    if (!fs.existsSync(filePath)) return; // file was deleted
    touchActivity();

    if (!knownFiles.has(filename)) {
      knownFiles.add(filename);
      const eventsFile = path.join(STATE_DIR, 'events');
      try { fs.unlinkSync(eventsFile); } catch (e) { /* missing or raced */ }
      console.log(JSON.stringify({ type: 'screen-added', file: filePath }));
      maybeOpenBrowser();
    } else {
      console.log(JSON.stringify({ type: 'screen-updated', file: filePath }));
    }

    broadcast({ type: 'reload' });
  }, 100));
}

// (Re-)establish the content-dir watcher. The watcher dies when the content
// dir is deleted (inotify watches the inode; FSEvents the path), so it must
// be re-created after the dir comes back — otherwise new screens would never
// trigger reloads. Two detection paths:
//   1. onContentEvent sees the dir's own basename → stopWatcher() already ran;
//   2. the dir was replaced without us noticing (inode mismatch vs the inode
//      we started watching) → re-arm here.
function ensureContentWatcher() {
  if (watcher) {
    const ino = currentContentIno();
    if (ino === null || ino === contentDirIno) return;
    stopWatcher(); // watched dir was deleted and recreated; watch the new one
  }
  if (!fs.existsSync(CONTENT_DIR)) return;
  try {
    rescanKnownFiles();
    contentDirIno = currentContentIno();
    watcher = fs.watch(CONTENT_DIR, onContentEvent);
    watcher.on('error', (err) => {
      console.error('fs.watch error:', err.message);
      watcher = null;
      if (watcherRetryTimer) clearTimeout(watcherRetryTimer);
      watcherRetryTimer = setTimeout(() => {
        watcherRetryTimer = null;
        ensureContentWatcher();
      }, 1000);
    });
  } catch (e) {
    watcher = null;
  }
}

function stopWatcher() {
  if (watcherRetryTimer) { clearTimeout(watcherRetryTimer); watcherRetryTimer = null; }
  if (watcher) {
    try { watcher.close(); } catch (e) { /* already closed */ }
    watcher = null;
  }
  contentDirIno = null;
}

// ========== Server Startup ==========

function startServer() {
  if (!ensurePrivateDirectory(SESSION_DIR) ||
      !ensurePrivateDirectory(CONTENT_DIR) ||
      !ensurePrivateDirectory(STATE_DIR)) {
    throw new Error('Brainstorm session directories must be private, real directories');
  }

  const server = http.createServer(handleRequest);
  server.on('upgrade', handleUpgrade);
  ensureContentWatcher();

  function shutdown(reason) {
    console.log(JSON.stringify({ type: 'server-stopped', reason }));
    const infoFile = path.join(STATE_DIR, 'server-info');
    try { fs.unlinkSync(infoFile); } catch (e) { /* already gone or raced */ }
    writePrivateFile(
      path.join(STATE_DIR, 'server-stopped'),
      JSON.stringify({ reason, timestamp: Date.now() }) + '\n'
    );
    stopWatcher();
    clearInterval(lifecycleCheck);
    // Close any upgraded WebSocket sockets so server.close() can complete and
    // the process actually exits instead of lingering on an open connection.
    for (const socket of clients) {
      try { socket.destroy(); } catch (e) { /* already gone */ }
    }
    server.close(() => process.exit(0));
    // Safety net: an in-flight HTTP connection (e.g. a slow /files/ download)
    // must not keep a shutting-down server alive indefinitely.
    setTimeout(() => process.exit(0), 5000).unref();
  }

  function ownerAlive() {
    if (!ownerPid) return true;
    try { process.kill(ownerPid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
  }

  // Periodically exit if the owner process died or we've been idle too long.
  const lifecycleCheck = setInterval(() => {
    if (!ownerAlive()) shutdown('owner process exited');
    else if (Date.now() - lastActivity > IDLE_TIMEOUT_MS) shutdown('idle timeout');
    else ensureContentWatcher(); // self-heal the watcher if the dir was recreated
  }, LIFECYCLE_CHECK_MS);
  lifecycleCheck.unref();

  // Validate owner PID at startup. If it's already dead, the PID resolution
  // was wrong (common on WSL, Tailscale SSH, and cross-user scenarios).
  // Disable monitoring and rely on the idle timeout instead.
  if (ownerPid) {
    try { process.kill(ownerPid, 0); }
    catch (e) {
      if (e.code !== 'EPERM') {
        console.log(JSON.stringify({ type: 'owner-pid-invalid', pid: ownerPid, reason: 'dead at startup' }));
        ownerPid = null;
      }
    }
  }

  // If the preferred port is already taken (e.g. a previous server is still
  // alive), fall back to a random port once instead of failing.
  let triedFallback = false;

  function onListen() {
    // Cookie name keys on the ACTUAL bound port (may differ from the preferred
    // one after an EADDRINUSE fallback) so it can't collide with another server's
    // cookie in the shared localhost jar.
    COOKIE_NAME = 'brainstorm-key-' + PORT;
    // Record the bound port only when we got our preferred port, so a stale
    // port file from a crashed fallback can't pin a future session to a port
    // another server owns. The session key, by contrast, is persisted whenever
    // BRAINSTORM_TOKEN_FILE is set (see initialToken) — the pair is what keeps
    // an already-open tab's cookie valid across a restart.
    if (PORT_FILE && !triedFallback) {
      if (!writePrivateFile(PORT_FILE, String(PORT))) {
        console.error('Failed to write private port file');
      }
    }
    const info = JSON.stringify({
      type: 'server-started', port: Number(PORT), host: HOST,
      url_host: URL_HOST, url: companionUrl(),
      screen_dir: CONTENT_DIR, state_dir: STATE_DIR, idle_timeout_ms: IDLE_TIMEOUT_MS
    });
    console.log(info);
    // server-info embeds the key — keep it owner-only.
    if (!writePrivateFile(path.join(STATE_DIR, 'server-info'), info + '\n')) {
      throw new Error('Failed to write private server-info');
    }
  }

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && !triedFallback) {
      if (tokenSource === 'env') {
        console.error('Server failed to bind: preferred port is in use and BRAINSTORM_TOKEN is set; refusing fallback with explicit token');
        process.exit(1);
      }
      triedFallback = true;
      PORT = randomPort();
      server.listen(PORT, HOST, onListen);
    } else {
      console.error('Server failed to bind:', err.message);
      process.exit(1);
    }
  });
  server.listen(PORT, HOST, onListen);
}

if (require.main === module) {
  startServer();
}

module.exports = {
  computeAcceptKey,
  encodeFrame,
  decodeFrame,
  browserLauncherForPlatform,
  OPCODES,
  MAX_FRAME_PAYLOAD_BYTES
};
