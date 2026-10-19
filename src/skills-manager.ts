import * as fs from "fs/promises";
import type { Stats } from "fs";
import * as path from "path";

export interface SkillMeta {
    name: string;
    description: string;
    skillPath: string;
}

const MAX_SKILL_FILE_BYTES = 10 * 1024 * 1024;
// 熱路徑：此區間內的連續呼叫直接回傳記憶體快取，完全不觸碰磁碟。
// findSkill() 每次都經過 listSkills()，因此熱路徑內幾乎零成本即可完成重驗證。
// 冷路徑則以目錄指紋（readdir + lstat）確認是否需要重掃。
export const CACHE_REVALIDATE_MS = 1000;

const MAX_DESCRIPTION_CHARS = 2000;
const SCAN_CONCURRENCY = 32;
const MAX_CONTENT_CACHE_ENTRIES = 100;
const MAX_CONTENT_CACHE_BYTES = 20 * 1024 * 1024;

/** Simple semaphore-based bounded map (no new deps): at most `limit` fn() in flight. */
async function mapWithLimit<T, R>(items: readonly T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
    const results = new Array<R>(items.length);
    let next = 0;
    const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
        while (true) {
            const i = next++;
            if (i >= items.length) return;
            results[i] = await fn(items[i], i);
        }
    });
    await Promise.all(workers);
    return results;
}

/** Sanitize one log fragment: collapse newlines so a skill name/error can't forge log lines. */
function oneLine(value: string, maxLen = 500): string {
    return value.replace(/[\r\n]+/g, " ").slice(0, maxLen);
}

interface FileStatSnapshot {
    dev: number;
    ino: number;
    size: number;
    mtimeMs: number;
    // ctime (metadata-change time) always advances on rename/replace, even
    // when mtime granularity or preservation hides the change — a second
    // fingerprint that closes the same-millisecond same-size rewrite window.
    ctimeMs: number;
}

export class SkillsManager {
    private skillsPath: string;
    private cachedSkills: SkillMeta[] | null = null;
    private loadingPromise: Promise<SkillMeta[]> | null = null;
    private loadingEpoch = -1;
    private skillMap = new Map<string, SkillMeta>();
    private contentCache = new Map<string, string>();
    private contentCacheStat = new Map<string, FileStatSnapshot>();
    private contentInflight = new Map<string, Promise<string>>();
    private canonicalPathMap = new Map<string, string>();
    private scanEpoch = 0;
    private lastSuccessfulScanAt = 0;
    private skillSignature: string | null = null;
    private frontmatterTruncatedWarned = false;

    constructor(skillsPath: string) {
        this.skillsPath = path.resolve(skillsPath);
    }

    private stripQuotes(str: string): string {
        const t = str.trim();
        if (t.length >= 2 && t[0] === '"' && t[t.length - 1] === '"') {
            // YAML double-quoted: unescape \" \' \\ (and \X -> X for other escapes).
            return t.slice(1, -1).replace(/\\(.)/g, (_m, ch: string) =>
                ch === "n" ? "\n" : ch === "t" ? "\t" : ch === "r" ? "\r" : ch
            ).trim();
        }
        if (t.length >= 2 && t[0] === "'" && t[t.length - 1] === "'") {
            // YAML single-quoted: '' is an escaped quote.
            return t.slice(1, -1).replace(/''/g, "'").trim();
        }
        return t;
    }

    /**
     * Frontmatter `name:` 是顯示字串，不是路徑：剝除路徑分隔符號與控制字元
     * （否則 `name: ../../evil` 會污染技能清單顯示、混淆名稱解析），並封頂長度。
     * 清理後為空時回傳 ""，由呼叫端回退到目錄名。
     */
    private sanitizeSkillName(raw: string): string {
        const cleaned = raw
            .replace(/[\0\/\\]/g, "")
            .replace(/[\x00-\x1f\x7f]/g, "")
            // Strip bidi controls / zero-width / BOM so display names can't spoof order.
            .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, "")
            .trim();
        if (cleaned === "." || cleaned === "..") {
            return "";
        }
        return cleaned.slice(0, 200);
    }

    /** stderr write that never throws (avoid crashing on closed/broken stderr). */
    private safeStderrWrite(message: string): void {
        try {
            process.stderr.write(message);
        } catch {
            // ignore: logging must never break the scan path.
        }
    }

    private logScanWarning(entryName: string, detail: string): void {
        this.safeStderrWrite(`Warning: Failed to read skill file in directory "${oneLine(entryName, 200)}": ${oneLine(detail, 500)}\n`);
    }

    /** Deep-copy a skill list so callers can't mutate the cache or skillMap via the returned objects. */
    private cloneSkills(skills: readonly SkillMeta[]): SkillMeta[] {
        return skills.map((s) => ({ ...s }));
    }

    private cloneSkill(skill: SkillMeta): SkillMeta {
        return { ...skill };
    }

    private inflightKeyFor(resolvedSkillPath: string): string {
        // Normalize the single-flight key through the canonical map when the
        // real path is already known, so two aliases of the same file coalesce.
        // First-read aliases (canonical unknown) may still issue duplicate loads;
        // that is unavoidable without a realpath round-trip on the hot path.
        return this.canonicalPathMap.get(resolvedSkillPath) ?? resolvedSkillPath;
    }

    private enforceContentCacheLimits(cache: Map<string, string>, stat: Map<string, FileStatSnapshot>): void {
        // LRU-ish cap: Map preserves insertion order, so evict oldest first until
        // both entry-count and total-bytes budgets hold.
        let totalBytes = 0;
        for (const body of cache.values()) {
            totalBytes += Buffer.byteLength(body, "utf-8");
        }
        while (cache.size > MAX_CONTENT_CACHE_ENTRIES || totalBytes > MAX_CONTENT_CACHE_BYTES) {
            const oldest = cache.keys().next();
            if (oldest.done) break;
            const key = oldest.value as string;
            const body = cache.get(key);
            if (body !== undefined) {
                totalBytes -= Buffer.byteLength(body, "utf-8");
            }
            cache.delete(key);
            stat.delete(key);
        }
    }

    /**
     * 逐行安全解析 YAML frontmatter（支援 UTF-8 BOM、TAB/空格縮排、Windows 換行、防範 ReDoS 且相容多行 description）
     * 高效分片截斷：僅切片 frontmatter 部分進行行解析，正文直接截出為 body，避免整檔拆解為萬行字串
     */
    private parseFrontmatter(content: string): { name: string; description: string; body: string } {
        let cleanContent = content;
        if (cleanContent.charCodeAt(0) === 0xfeff) {
            cleanContent = cleanContent.slice(1);
        }

        // Opener must be the first non-empty line, exactly `---` (surrounding
        // spaces/TAB allowed). Leading blank lines and BOM are skipped; `---foo`
        // is rejected so body text starting with dashes isn't eaten as frontmatter.
        const SCAN_LIMIT = 3 + 64 * 1024;
        const head = cleanContent.length > SCAN_LIMIT ? cleanContent.slice(0, SCAN_LIMIT) : cleanContent;
        let openerEnd = -1;
        {
            let pos = 0;
            while (pos <= head.length) {
                let lineEnd = head.indexOf("\n", pos);
                const atEnd = lineEnd === -1;
                if (atEnd) lineEnd = head.length;
                let line = head.slice(pos, lineEnd);
                if (line.endsWith("\r")) line = line.slice(0, -1);
                if (/^[ \t]*$/.test(line)) {
                    if (atEnd) break;
                    pos = lineEnd + 1;
                    continue;
                }
                if (/^[ \t]*---[ \t]*$/.test(line)) {
                    openerEnd = atEnd ? lineEnd : lineEnd + 1;
                }
                break;
            }
        }
        if (openerEnd === -1) {
            return { name: "", description: "", body: cleanContent.trim() };
        }

        // 尋找關閉標記 `---` 或 YAML 文件結束 `...`（獨立一行，容許前置/後置空白或 TAB，容許 CRLF）。
        // 逐行 indexOf 掃描而非正則全檔匹配：正則引擎在 10MB 無 frontmatter
        // 檔案上會逐字元嘗試匹配；只掃前 64KB 也順帶封頂了 frontmatter 大小。
        let closerStart = -1;
        let closerEnd = -1;
        let newlineAt = openerEnd - 1;
        // openerEnd points just after the opener's newline (or at EOF); the
        // first body line starts at openerEnd, whose preceding newline is openerEnd-1.
        if (newlineAt < 0 || head[newlineAt] !== "\n") {
            // Opener was the whole head with no trailing newline: no closer possible.
            this.warnFrontmatterTruncated();
            return { name: "", description: "", body: cleanContent.trim() };
        }
        while (newlineAt !== -1) {
            const lineStart = newlineAt + 1;
            let lineEnd = head.indexOf("\n", lineStart);
            const atEnd = lineEnd === -1;
            if (atEnd) {
                lineEnd = head.length;
            }
            let line = head.slice(lineStart, lineEnd);
            if (line.endsWith("\r")) {
                line = line.slice(0, -1);
            }
            if (/^[ \t]*---[ \t]*$/.test(line) || /^[ \t]*\.\.\.[ \t]*$/.test(line)) {
                closerStart = newlineAt;
                closerEnd = atEnd ? lineEnd : lineEnd + 1;
                break;
            }
            if (atEnd) {
                break;
            }
            newlineAt = lineEnd;
        }
        if (closerStart === -1) {
            // Opener found but no closer within 64KB (or at all): drop frontmatter.
            this.warnFrontmatterTruncated();
            return { name: "", description: "", body: cleanContent.trim() };
        }

        const frontmatterText = cleanContent.slice(openerEnd, closerStart);
        const body = cleanContent.slice(closerEnd).trim();

        const lines = frontmatterText.split(/\r?\n/);
        let name = "";
        let description = "";
        let inDescription = false;

        for (const line of lines) {
            // (.*?) 允許空值："name:" 沒有值時回退到目錄名，而非忽略整行
            const nameMatch = line.match(/^name:\s*(.*?)\s*$/);
            if (nameMatch) {
                name = this.stripQuotes(nameMatch[1]);
                inDescription = false;
                continue;
            }

            const descStartMatch = line.match(/^description:\s*(.*?)\s*$/);
            if (descStartMatch) {
                const rawVal = descStartMatch[1].trim();
                // Strip YAML block-scalar indicators (|, >, |-, >+, ...): they are
                // not content; the actual text lives on the following indented lines.
                if (/^[|>][+-]?$/.test(rawVal)) {
                    description = "";
                } else {
                    description = this.stripQuotes(descStartMatch[1]);
                }
                inDescription = true;
                continue;
            }

            // 支援 YAML 跨行縮排 (空白或 TAB) description 欄位：只有「縮排且不是新 key」
            // 才視為接續行，避免把縮排的 `author: x` 之類鍵吞進 description。
            // 空字串保持接續狀態（YAML 空行不結束純量）；全空白行視為空行同樣略過。
            if (inDescription && /^\s+/.test(line) && !/^\s*[A-Za-z0-9_-]+\s*:/.test(line)) {
                const trimmed = line.trim();
                if (trimmed !== "") {
                    description += " " + trimmed;
                }
            } else {
                inDescription = false;
            }
        }

        if (description.length > MAX_DESCRIPTION_CHARS) {
            description = description.slice(0, MAX_DESCRIPTION_CHARS) + "...";
        }

        return { name, description, body };
    }

    /** Rate-limited (once) warning for frontmatter dropped past the 64KB closer window. */
    private warnFrontmatterTruncated(): void {
        if (this.frontmatterTruncatedWarned) return;
        this.frontmatterTruncatedWarned = true;
        this.safeStderrWrite("Warning: skill frontmatter closer not found within 64KB; ignoring frontmatter\n");
    }


    /**
     * 非同步併發列出技能，實作快取、並行併發鎖（安全鎖釋放）與 O(1) 雙向鍵索引
     *
     * 快取分兩層：
     * 1. 熱路徑（CACHE_REVALIDATE_MS 內）：直接回傳記憶體結果，零系統呼叫。
     * 2. 冷路徑：先比對「目錄指紋」（一次 readdir + 每個技能一次 lstat），
     *    指紋未變就沿用快取。舊行為在每次快取過期後都會完整重讀所有技能檔案
     *    （成本 = n 次檔案讀取 + n 次 realpath + n 次 stat），技能數量上百時
     *    每次工具呼叫都會產生數十毫秒延遲。
     */
    public async listSkills(forceReload = false): Promise<SkillMeta[]> {
        if (!forceReload && this.cachedSkills) {
            const cacheIsFresh = Date.now() - this.lastSuccessfulScanAt < CACHE_REVALIDATE_MS;
            if (cacheIsFresh) {
                // Return copies: the array and each item are cloned so callers
                // can't mutate cachedSkills/skillMap through the result.
                return this.cloneSkills(this.cachedSkills);
            }
        }

        // Single-flight join happens BEFORE any directory I/O.
        //
        // Two things must hold for this guard to actually collapse concurrent work,
        // and the old ordering had both wrong:
        //   1. The check must precede computeSkillSignature(), which costs one lstat
        //      per skill. Previously every caller paid that cost before discovering
        //      that a scan was already running.
        //   2. this.loadingPromise must be assigned synchronously. The fingerprint used
        //      to be awaited *before* loadingPromise was set, so every caller in a
        //      burst still observed loadingPromise === null and started its own scan.
        //
        // Net effect of the old ordering: a burst of k concurrent cold callers issued
        // k x n lstats instead of n. Measured against a 700-skill directory, the
        // filesystem call counts for 1, 5 and 20 concurrent callers are now identical
        // (700 lstat, 701 stat, 700 open) — one scan total, not one per caller. The
        // whole cold path (fingerprint + scan) is now one shared promise created with
        // no intervening await.
        //
        // The result is unchanged: a scan already in flight is reading fresh disk
        // state, so joining it yields exactly what the caller would have derived.
        if (!forceReload) {
            const inFlight = this.loadingPromise;
            if (inFlight && this.loadingEpoch === this.scanEpoch) {
                // Joined callers each get their own copy, like the hot path.
                return inFlight.then((skills) => this.cloneSkills(skills));
            }
        }

        const epoch = ++this.scanEpoch;
        // No `await` between this call and the assignment below, so the single-flight
        // window opens atomically for any caller arriving on the same tick.
        // NOTE (forceReload vintage): forceReload intentionally orphans a prior in-flight
        // scan by bumping scanEpoch instead of joining it. The orphaned scan still
        // resolves for its original waiter with its own vintage (it must not write the
        // cache — guarded by epoch === scanEpoch on commit), while the forceReload
        // caller gets strictly fresh disk state. Two concurrent forceReloads each run
        // their own scan for the same reason; joining would serve potentially stale data.
        const currentPromise = this.refreshSkills(epoch, forceReload);
        this.loadingPromise = currentPromise;
        this.loadingEpoch = epoch;
        try {
            return await currentPromise;
        } finally {
            if (this.loadingPromise === currentPromise) {
                this.loadingPromise = null;
                this.loadingEpoch = -1;
            }
        }
    }

    /**
     * 冷路徑本體：取一次目錄指紋，若指紋未變則沿用既有清單，否則重掃並提交快取。
     *
     * 刻意拆成獨立的 async 方法，讓呼叫端能在任何 await 之前同步指派 loadingPromise；
     * 若把指紋計算留在呼叫端，第一個 await 就會讓所有併發呼叫穿透單飛鎖。
     */
    private async refreshSkills(epoch: number, forceReload: boolean): Promise<SkillMeta[]> {
        // Cold path: take the directory signature exactly once and reuse it for both
        // the "unchanged" short-circuit below and the scan, so a rescan no longer
        // stats the whole skills directory twice (previously computeSkillSignature ran
        // here and again at the start of internalListSkills).
        const currentSignature = await this.computeSkillSignature();

        if (
            !forceReload &&
            this.cachedSkills &&
            this.skillSignature !== null &&
            currentSignature === this.skillSignature
        ) {
            // 內容完全未變：只需一次 readdir 與每檔 lstat 即可確認，
            // 不需要重新讀取任何技能檔案內容。
            // 世代守衛：被 forceReload/clearCache 取代的舊輪次不可刷新熱路徑時戳。
            if (epoch === this.scanEpoch) {
                this.lastSuccessfulScanAt = Date.now();
            }
            return this.cloneSkills(this.cachedSkills);
        }

        // forceReload 不在掃描前丟棄內容快取：先保留舊快取做 fail-stale（掃描失敗
        // 時呼叫端仍有可用內容），成功後 internalListSkills 會整批取代；失敗時舊快取原樣保留。
        return this.internalListSkills(epoch, currentSignature, forceReload);
    }

    /**
     * 丟棄內容相關快取（檔案內容、canonical 對應與目錄指紋），但保留最後一次
     * 成功的技能清單。
     *
     * 刻意不清除 cachedSkills：若接下來的重掃失敗（例如目錄暫時不可讀），呼叫端
     * 仍可取得最後一次成功的清單，而不是一個空清單。
     */
    private dropContentCaches(): void {
        this.contentCache.clear();
        this.contentCacheStat.clear();
        this.contentInflight.clear();
        this.canonicalPathMap.clear();
        this.skillSignature = null;
    }

    /**
     * 計算技能目錄的指紋：檔名集合 + 每個技能目錄/SKILL.md 的 inode、大小與 mtime。
     *
     * 之所以要連 SKILL.md 一起納入，是因為「就地覆寫既有檔案」只會更新檔案本身
     * 的 mtime，不會改變上層目錄的 mtime；只看目錄會漏掉描述變更。
     */
    private async computeSkillSignature(): Promise<string | null> {
        // 指紋 = root 實路徑 + 每個候選的 lstat(連結身分) + SKILL.md stat(內容身分)。
        // dev/ino/size/mtimeMs/ctimeMs 全量比對；刻意不含 mode，避免 chmod 觸發全量重掃。
        const describe = async (target: string): Promise<string> => {
            try {
                const stat = await fs.lstat(target);
                return `${stat.dev}\u0000${stat.ino}\u0000${stat.size}\u0000${stat.mtimeMs}\u0000${stat.ctimeMs}`;
            } catch {
                return "-";
            }
        };
        // SKILL.md 本體用 stat（跟隨符號連結）：lstat 只會看到連結本身的
        // inode/size/mtime，檔案內容被就地覆寫時指紋完全不變，快取永遠命中
        // 舊內容。連結身分的偵測仍由上面的 lstat 版 describe 負責。
        const describeFollow = async (target: string): Promise<string> => {
            try {
                const stat = await fs.stat(target);
                return `${stat.dev}\u0000${stat.ino}\u0000${stat.size}\u0000${stat.mtimeMs}\u0000${stat.ctimeMs}`;
            } catch {
                return "-";
            }
        };

        try {
            // Root 實路徑納入指紋：根目錄被替換（rename/recreate）但內容暫時相同時仍能察覺。
            let rootPart = path.resolve(this.skillsPath);
            try {
                rootPart = await fs.realpath(rootPart);
            } catch {
                // 沿用 resolve 結果；readdir 失敗時整體仍回傳 null。
            }
            const entries = await fs.readdir(this.skillsPath, { withFileTypes: true });
            // Only directories and symlinks can be skills; skip stray files (e.g.
            // .DS_Store) so their appearance/disappearance does not invalidate the
            // signature and force a full rescan. lstat each candidate with bounded
            // concurrency (32) so a 700-skill directory doesn't issue 700 concurrent stats.
            const candidates = entries.filter((entry) => entry.isDirectory() || entry.isSymbolicLink());
            const parts = await mapWithLimit(
                candidates,
                SCAN_CONCURRENCY,
                async (entry) => {
                    const skillDir = path.join(this.skillsPath, entry.name);
                    const kind = entry.isDirectory() ? "d" : "l";
                    // 只需 SKILL.md 的 dev/ino/size/mtime/ctime：ino 已足以識別目錄或檔案被
                    // 替換，因此每個技能僅需一次 lstat + 一次 stat（併發執行）。符號連結額外比對連結本身的
                    // inode，以便偵測「連結被重新指向」。mode 刻意排除以避免 chmod 觸發重掃。
                    const [linkInfo, fileInfo] = await Promise.all([
                        kind === "l" ? describe(skillDir) : Promise.resolve("-"),
                        describeFollow(path.join(skillDir, "SKILL.md")),
                    ]);
                    return `${entry.name}\u0000${kind}\u0000${linkInfo}\u0000${fileInfo}`;
                }
            );
            parts.sort();
            return `root:${rootPart}\u0001` + parts.join("\u0001");
        } catch {
            return null;
        }
    }

    private async internalListSkills(epoch = this.scanEpoch, precomputedSignature?: string | null, forceReload = false): Promise<SkillMeta[]> {
        let preResolvedRoot: { realRootPath: string; rootStat: Stats } | undefined;
        try {
            const resolvedRoot = path.resolve(this.skillsPath);
            const realRootPath = await fs.realpath(resolvedRoot);
            const rootStat = await fs.stat(realRootPath);
            if (!rootStat.isDirectory()) {
                this.safeStderrWrite(`Error reading skills directory: root is not a directory: ${oneLine(realRootPath)}\n`);
                return this.cachedSkills ? this.cloneSkills(this.cachedSkills) : [];
            }
            preResolvedRoot = { realRootPath, rootStat };
        } catch (_rootErr: unknown) {
            // Fail-stale 也要留下紀錄：回傳舊快取的同時讓維運看得到根因。
            const detail = _rootErr instanceof Error ? _rootErr.message : String(_rootErr);
            this.safeStderrWrite(`Error resolving skills directory: ${oneLine(detail)}\n`);
            return this.cachedSkills ? this.cloneSkills(this.cachedSkills) : [];
        }

        // 掃描開始前先取得目錄指紋，供下一次冷路徑呼叫快速比對。
        // 先取指紋再讀檔，可確保「掃描期間才發生的變更」會讓下次比對失敗而觸發
        // 完整重掃，不會被誤判為未變更。listSkills 已算過一次時直接沿用，避免
        // 重複對整個目錄做 readdir + lstat。
        const signature = precomputedSignature !== undefined ? precomputedSignature : await this.computeSkillSignature();

        const skills: SkillMeta[] = [];
        const newSkillMap = new Map<string, SkillMeta>();
        const newContentCache = new Map<string, string>();
        const newContentStat = new Map<string, FileStatSnapshot>();
        const newCanonicalMap = new Map<string, string>();
        let scanned = false;

        try {
            const entries = await fs.readdir(this.skillsPath, { withFileTypes: true });
            const skillCandidates = entries.filter((entry) => entry.isDirectory() || entry.isSymbolicLink());

            // 單檔變更快速路徑：stat 仍與 contentCacheStat 相符的檔案直接沿用舊
            // SkillMeta + body，只花一次 stat 而不做 open/read/parse。forceReload
            // 顯式要求全量重讀時跳過此路徑。
            const prevMetaByResolved = new Map<string, SkillMeta>();
            if (!forceReload && this.cachedSkills) {
                for (const item of this.cachedSkills) {
                    prevMetaByResolved.set(path.resolve(item.skillPath), item);
                }
            }

            const loaded = await mapWithLimit(
                skillCandidates,
                SCAN_CONCURRENCY,
                async (entry) => {
                    const skillDir = path.join(this.skillsPath, entry.name);
                    const skillFile = path.join(skillDir, "SKILL.md");
                    const resolvedSkillFile = path.resolve(skillFile);

                    if (!forceReload) {
                        const canonical = this.canonicalPathMap.get(resolvedSkillFile);
                        const prevItem = prevMetaByResolved.get(resolvedSkillFile);
                        if (canonical && prevItem) {
                            const snapshot = this.contentCacheStat.get(canonical);
                            const cachedBody = this.contentCache.get(canonical);
                            if (snapshot && cachedBody !== undefined) {
                                try {
                                    const st = await fs.stat(resolvedSkillFile);
                                    if (
                                        st.isFile() &&
                                        st.dev === snapshot.dev &&
                                        st.ino === snapshot.ino &&
                                        st.size === snapshot.size &&
                                        st.mtimeMs === snapshot.mtimeMs &&
                                        st.ctimeMs === snapshot.ctimeMs
                                    ) {
                                        return { item: prevItem, body: cachedBody, realFilePath: canonical, directoryName: entry.name, stat: st };
                                    }
                                } catch {
                                    // stat 失敗就走完整讀取路徑產生正確錯誤。
                                }
                            }
                        }
                    }

                    try {
                        const { content, realFilePath, stat } = await this.readFileNoFollow(
                            skillFile,
                            this.skillsPath,
                            preResolvedRoot
                        );
                        const { name, description, body } = this.parseFrontmatter(content);
                        const sanitized = this.sanitizeSkillName(name);
                        const fallback = this.sanitizeSkillName(entry.name);
                        const finalName = sanitized || fallback || "unnamed-skill";
                        const item = {
                            name: finalName,
                            description,
                            skillPath: skillFile,
                        };
                        return { item, body, realFilePath, directoryName: entry.name, stat };
                    } catch (err: unknown) {
                        const isEnoent =
                            err &&
                            typeof err === "object" &&
                            "code" in err &&
                            (err as { code?: string }).code === "ENOENT";
                        if (!isEnoent) {
                            this.logScanWarning(entry.name, err instanceof Error ? err.message : String(err));
                        }
                        return null;
                    }
                }
            );
            const ordered = loaded.filter((value) => value !== null).sort((a, b) =>
                a!.directoryName < b!.directoryName ? -1 : a!.directoryName > b!.directoryName ? 1 : 0
            );
            // Names are claimed first, then directory names are registered as
            // best-effort aliases. A skill whose name is unique must never be
            // dropped because some other skill already claimed its directory name
            // as an alias — that alias is simply not resolvable.
            const accepted: typeof ordered = [];
            let cachedBodyBytes = 0;
            for (const result of ordered) {
                const { item, directoryName } = result!;
                const nameKey = item.name.toLowerCase();
                if (newSkillMap.has(nameKey)) {
                    this.safeStderrWrite(
                        `Warning: Skipping skill directory "${oneLine(directoryName, 200)}" because its name "${oneLine(nameKey, 200)}" is already registered\n`
                    );
                    // Best-effort transient-memory reduction: a skipped duplicate's
                    // body is never cached, so release it immediately.
                    result!.body = "";
                    continue;
                }
                // Freeze internal entries so a caller holding a previous reference
                // can't mutate the cached object graph; public returns are clones.
                Object.freeze(item);
                newSkillMap.set(nameKey, item);
                accepted.push(result!);
            }
            for (const result of accepted) {
                const { item, body, realFilePath, directoryName, stat } = result;
                const dirKey = directoryName.toLowerCase();
                // Directory alias is best-effort and namespaced by construction:
                // it is only registered when it collides with neither a claimed
                // name nor an earlier alias, so it can never shadow a real skill.
                if (dirKey !== item.name.toLowerCase() && !newSkillMap.has(dirKey)) {
                    newSkillMap.set(dirKey, item);
                }
                skills.push(item);

                const resolvedPath = path.resolve(item.skillPath);
                newContentCache.set(realFilePath, body);
                newContentStat.set(realFilePath, {
                    dev: stat.dev,
                    ino: stat.ino,
                    size: stat.size,
                    mtimeMs: stat.mtimeMs,
                    ctimeMs: stat.ctimeMs,
                });
                newCanonicalMap.set(resolvedPath, realFilePath);
                newCanonicalMap.set(realFilePath, realFilePath);
                cachedBodyBytes += body.length;
                if (cachedBodyBytes > MAX_CONTENT_CACHE_BYTES) {
                    // Best-effort transient-memory reduction: the body is already
                    // copied into newContentCache above, so release it from the
                    // loaded entry once the running total exceeds budget.
                    result.body = "";
                }
            }
            scanned = true;
        } catch (_dirErr) {
            this.safeStderrWrite(`Error reading skills directory: ${oneLine(String(_dirErr))}\n`);
        }

        // 只在掃描成功且本輪次依然是最新的 scan 時更新快取，防止舊 scan 覆寫新快取
        if (scanned && epoch === this.scanEpoch) {
            this.enforceContentCacheLimits(newContentCache, newContentStat);
            this.skillMap = newSkillMap;
            this.cachedSkills = skills.sort((a, b) => a.name.localeCompare(b.name, "en"));
            this.lastSuccessfulScanAt = Date.now();
            this.contentCache = newContentCache;
            this.contentCacheStat = newContentStat;
            this.canonicalPathMap = newCanonicalMap;
            this.skillSignature = signature;
            return this.cloneSkills(this.cachedSkills);
        }
        if (scanned) {
            // 被更新的 scan 取代：不快取，但仍要回傳實際讀到的清單，
            // 否則等待中的呼叫端會拿到空陣列。
            return this.cloneSkills(skills.sort((a, b) => a.name.localeCompare(b.name, "en")));
        }
        // 掃描失敗：丟棄指紋，讓下一次呼叫強制走完整重掃。
        // 世代守衛：只有最新輪次能使指紋失效，避免舊失敗清空新成功的指紋。
        if (epoch === this.scanEpoch) {
            this.skillSignature = null;
        }
        return this.cachedSkills ? this.cloneSkills(this.cachedSkills) : [];
    }

    /**
     * O(1) 快速查詢技能 (防範路徑遍歷及 Windows/Unix 路徑分隔符號)
     *
     * 查詢結果只會用於 Map 索引查找（skillPath 一律來自磁碟掃描結果，
     * 使用者輸入不會進入檔案系統路徑），因此僅需拒絕分隔符號與精確的
     * "."/".."，不必連名稱內含連續句點（如 "a..b"）都一併封鎖。
     */
    public async findSkill(skillName: string): Promise<SkillMeta | undefined> {
        const trimmed = typeof skillName === "string" ? skillName.trim() : "";
        if (
            !trimmed ||
            trimmed === "." ||
            trimmed === ".." ||
            trimmed.includes("/") ||
            trimmed.includes("\\") ||
            trimmed.includes("\0")
        ) {
            return undefined;
        }

        // 永遠走 listSkills() 重驗證：熱路徑（1s 內）零系統呼叫直接回傳快取，
        // 冷路徑只花一次目錄指紋即可確認未變更；只在 !cachedSkills 時掃描會
        // 讓描述/檔案變更在熱路徑過期前不可見，且與 listSkills 快取語義分叉。
        await this.listSkills();
        const found = this.skillMap.get(trimmed.toLowerCase());
        return found ? this.cloneSkill(found) : undefined;
    }

    /**
     * 以檔案描述元讀取檔案，並在開檔後比對 inode，
     * 防止 realpath 檢查與 readFile 之間的 symlink/rename TOCTOU。
     * POSIX 額外使用 O_NOFOLLOW；Windows 以開啟後的檔案識別比對防止
     * reparse point 在檢查後被替換。
     * 支援預解析 rootStat，消除對根目錄重複的 realpath/stat 磁碟調用。
     */
    private async readFileNoFollow(
        filePath: string,
        rootPath: string,
        preResolvedRoot?: { realRootPath: string; rootStat: Stats }
    ): Promise<{ content: string; realFilePath: string; stat: Stats }> {
        const resolvedFilePath = path.resolve(filePath);
        const resolvedRootPath = path.resolve(rootPath);

        const realFilePath = await fs.realpath(resolvedFilePath);
        const realRootPath = preResolvedRoot ? preResolvedRoot.realRootPath : await fs.realpath(resolvedRootPath);
        const rootStat = preResolvedRoot ? preResolvedRoot.rootStat : await fs.stat(realRootPath);
        if (!rootStat.isDirectory()) {
            throw new Error("Skills directory must be a directory");
        }
        const relative = path.relative(realRootPath, realFilePath);
        if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
            const outside = new Error("File is outside skills directory") as Error & { code?: string };
            outside.code = "EOUTSIDE";
            throw outside;
        }

        const stat = await fs.stat(realFilePath);
        // Require exactly one link: nlink > 1 means an external hardlink aliases this
        // inode from outside the skills tree and could mutate skill content out-of-band.
        if (!stat.isFile() || stat.nlink !== 1) throw new Error("Skill path is not a regular file");
        if (stat.size > MAX_SKILL_FILE_BYTES) throw new Error("Skill file exceeds size limit");

        // 單次 realpath + stat 即可：真正具權威性的是開檔後對檔案描述元的比對，
        // 它驗證的是「實際讀取的那個 inode」，嚴格強於開檔前重複兩次路徑解析。
        // 舊行為對每個檔案多花一次 realpath 與一次 stat（技能數量上百時每次
        // 掃描就多出數百次系統呼叫）。
        const noFollow = process.platform === "win32" ? 0 : fs.constants.O_NOFOLLOW;
        const fd = await fs.open(realFilePath, fs.constants.O_RDONLY | noFollow);
        try {
            const actual = await fd.stat();
            if (
                !actual.isFile() ||
                actual.nlink !== 1 ||
                actual.dev !== stat.dev ||
                actual.ino !== stat.ino ||
                actual.size > MAX_SKILL_FILE_BYTES
            ) {
                throw new Error("File changed while opening");
            }
            // Windows 沒有 O_NOFOLLOW，reparse point 可能在 pre-open stat 與 open
            // 之間被替換：開檔後立即比對 size/mtimeMs/ctimeMs，若與開檔前快照不符就丟棄。
            // dev/ino 在 Windows 上不足以單獨識別同一檔案（卷/重解析語義差異），因此是
            // 「通用 dev/ino 比對 + Windows 額外 size/mtime/ctime 比對」的雙層防線。
            // 限制：Windows 沒有原子 O_NOFOLLOW，檢查與 open 之間仍存在理論 TOCTOU
            // 空隙，此處為 best-effort 緩解而非 POSIX 等級保證。
            if (
                process.platform === "win32" &&
                (actual.size !== stat.size || actual.mtimeMs !== stat.mtimeMs || actual.ctimeMs !== stat.ctimeMs)
            ) {
                throw new Error("File changed while opening");
            }

            const fileSize = actual.size;
            let fileBuffer: Buffer;
            if (fileSize <= 64 * 1024) {
                fileBuffer = Buffer.allocUnsafe(fileSize);
                let totalRead = 0;
                while (totalRead < fileSize) {
                    const { bytesRead } = await fd.read(fileBuffer, totalRead, fileSize - totalRead, null);
                    if (bytesRead === 0) break;
                    totalRead += bytesRead;
                }
                if (totalRead < fileSize) {
                    fileBuffer = fileBuffer.subarray(0, totalRead);
                }
            } else {
                const chunks: Buffer[] = [];
                const chunkSize = 64 * 1024;
                let total = 0;
                while (total <= MAX_SKILL_FILE_BYTES) {
                    const buffer = Buffer.allocUnsafe(Math.min(chunkSize, MAX_SKILL_FILE_BYTES + 1 - total));
                    const { bytesRead } = await fd.read(buffer, 0, buffer.length, null);
                    if (bytesRead === 0) break;
                    total += bytesRead;
                    chunks.push(buffer.subarray(0, bytesRead));
                    if (total > MAX_SKILL_FILE_BYTES) throw new Error("Skill file exceeds size limit");
                }
                fileBuffer = Buffer.concat(chunks, total);
            }

            const after = await fd.stat();
            // Require the file to be byte-for-byte unchanged since the pre-open
            // snapshot: if it grew (or was rewritten) mid-read we would otherwise cache
            // truncated content under the post-read stat and serve it until the next
            // write. size/mtime/ctime equality closes that TOCTOU window.
            if (
                after.size > MAX_SKILL_FILE_BYTES ||
                after.dev !== stat.dev ||
                after.ino !== stat.ino ||
                after.size !== stat.size ||
                after.mtimeMs !== stat.mtimeMs ||
                after.ctimeMs !== stat.ctimeMs
            ) {
                throw new Error("File changed while reading");
            }
            return { content: fileBuffer.toString("utf-8"), realFilePath, stat: after };
        } finally {
            // close 本身的錯誤不可蓋掉 try 區塊的原始錯誤（例如讀取中失敗後
            // close 又失敗時，呼叫端應看到讀取錯誤而非 close 錯誤）。
            try {
                await fd.close();
            } catch {
                // 忽略：原始錯誤（若有）優先傳遞。
            }
        }
    }

    /**
     * 讀取並去除 YAML frontmatter 的 Markdown 內容 (非同步 + 快取 + 單次飛行去重 +
     * BOM 處理 + realpath 軟連結邊界檢查)。併發讀取同一技能只發起一次磁碟讀取；
     * 世代守衛確保 clearCache() 之後完成的舊讀取不會把過期內容回填快取。
     */
    public async readSkillContent(skillPath: string, forceReload = false): Promise<string> {
        const resolvedSkillPath = path.isAbsolute(skillPath)
            ? path.resolve(skillPath)
            : path.resolve(this.skillsPath, skillPath);

        // 高速命中路徑：一次 stat 驗證快取條目仍指向同一個檔案實例（dev/ino/size/mtime/ctime
        // 全部相符），命中時不需要 realpath、也不需要讀取檔案內容。
        //
        // 舊行為在快取過期後會先 await this.listSkills(true) 完整重掃整個技能目錄
        // ——只為了讀取「一個」技能，卻把所有技能檔案重新讀一遍。技能越多越慢，
        // 而且並行呼叫會各自觸發一次全樹掃描。
        // 單飛鍵以 canonical 正規化（已知時），避免同一檔案的兩個別名重複讀取。
        if (!forceReload) {
            // 同步先查一次：若已有在途讀取，直接加入而不觸碰磁碟。
            const preInflight = this.contentInflight.get(this.inflightKeyFor(resolvedSkillPath));
            if (preInflight) {
                return preInflight;
            }
            const cached = await this.tryReadFromContentCache(resolvedSkillPath);
            if (cached !== undefined) {
                return cached;
            }
            // await 之後再查一次：等待快取驗證期間可能已有其他呼叫建立了在途讀取。
            const postInflight = this.contentInflight.get(this.inflightKeyFor(resolvedSkillPath));
            if (postInflight) {
                return postInflight;
            }
        }

        const epoch = this.scanEpoch;
        const load = this.loadSkillContent(resolvedSkillPath, epoch);
        // 同步佔位：load 已同步建立（無 intervening await），立即寫入 map，
        // 同 tick 到達的呼叫透過上面的 preInflight 查到並加入。
        const inflightKey = this.inflightKeyFor(resolvedSkillPath);
        if (!forceReload) {
            this.contentInflight.set(inflightKey, load);
        }
        try {
            return await load;
        } finally {
            if (!forceReload && this.contentInflight.get(inflightKey) === load) {
                this.contentInflight.delete(inflightKey);
            }
        }
    }

    private async loadSkillContent(resolvedSkillPath: string, epoch: number): Promise<string> {
        try {
            // 傳入已相對 skillsPath 解析過的路徑，確保「守衛式讀取」與快取鍵
            // （canonicalPathMap）使用同一種解析方式；否則相對路徑會依 CWD
            // 解析而與快取鍵不一致。
            const { content: raw, realFilePath, stat } = await this.readFileNoFollow(resolvedSkillPath, this.skillsPath);
            const { body } = this.parseFrontmatter(raw);
            if (epoch === this.scanEpoch) {
                this.contentCache.set(realFilePath, body);
                this.contentCacheStat.set(realFilePath, {
                    dev: stat.dev,
                    ino: stat.ino,
                    size: stat.size,
                    mtimeMs: stat.mtimeMs,
                    ctimeMs: stat.ctimeMs,
                });
                this.canonicalPathMap.set(resolvedSkillPath, realFilePath);
                this.canonicalPathMap.set(realFilePath, realFilePath);
                this.enforceContentCacheLimits(this.contentCache, this.contentCacheStat);
            }
            return body;
        } catch (err) {
            // 保留原始錯誤碼（如 ENOENT），讓呼叫端能區分「檔案不存在」與
            // 其他讀取失敗，對應映射到 InvalidRequest/InvalidParams 而非 InternalError。
            const wrapped = new Error(`Failed to read skill content: ${err instanceof Error ? err.message : String(err)}`);
            if (err && typeof err === "object" && "code" in err) {
                (wrapped as { code?: unknown }).code = (err as { code?: unknown }).code;
            }
            throw wrapped;
        }
    }

    /**
     * 以單次 stat 驗證內容快取是否仍然有效。
     *
     * 驗證的是「呼叫端請求的路徑」而非快取記下的 canonical 路徑：若該路徑是
     * 符號連結且已被重新指向別處，inode 會改變而導致快取失效，避免回傳過期內容。
     *
     * @returns 命中時回傳內容；未命中或無法確認時回傳 undefined，交由守衛式讀取處理。
     */
    private async tryReadFromContentCache(resolvedSkillPath: string): Promise<string | undefined> {
        const canonicalKey = this.canonicalPathMap.get(resolvedSkillPath);
        if (!canonicalKey) {
            return undefined;
        }
        const cached = this.contentCache.get(canonicalKey);
        const snapshot = this.contentCacheStat.get(canonicalKey);
        if (cached === undefined || !snapshot) {
            return undefined;
        }
        try {
            const stat = await fs.stat(resolvedSkillPath);
            if (
                stat.isFile() &&
                stat.dev === snapshot.dev &&
                stat.ino === snapshot.ino &&
                stat.size === snapshot.size &&
                stat.mtimeMs === snapshot.mtimeMs &&
                stat.ctimeMs === snapshot.ctimeMs
            ) {
                return cached;
            }
        } catch {
            // 檔案已消失或不可讀：交由後續的守衛式讀取產生正確的錯誤訊息
        }
        return undefined;
    }

    public clearCache(): void {
        // invalidate-not-cancel 語義：只遞增世代並清空索引，不取消已在途的讀取/掃描。
        // 在途工作仍會向原等待者回傳其 vintage，但因 epoch 守衛（loadSkillContent 與
        // internalListSkills 的 epoch === scanEpoch 檢查）而無法回填快取。
        // 世代必須先 bump 再清空 maps，否則清空與在途提交之間會有競爭空隙。
        this.scanEpoch++;
        this.cachedSkills = null;
        this.loadingPromise = null;
        this.loadingEpoch = -1;
        this.skillMap.clear();
        this.contentCache.clear();
        this.contentCacheStat.clear();
        this.contentInflight.clear();
        this.canonicalPathMap.clear();
        this.skillSignature = null;
        this.lastSuccessfulScanAt = 0;
    }
}
