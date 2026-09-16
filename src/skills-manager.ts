import * as fs from "fs/promises";
import type { Stats } from "fs";
import * as path from "path";

export interface SkillMeta {
    name: string;
    description: string;
    skillPath: string;
}

const MAX_SKILL_FILE_BYTES = 10 * 1024 * 1024;
// 熱路徑：此區間內的連續呼叫直接回傳記憶體快取，完全不觸碰磁碟
const CACHE_REVALIDATE_MS = 1000;

interface FileStatSnapshot {
    dev: number;
    ino: number;
    size: number;
    mtimeMs: number;
}

export class SkillsManager {
    private skillsPath: string;
    private cachedSkills: SkillMeta[] | null = null;
    private loadingPromise: Promise<SkillMeta[]> | null = null;
    private loadingEpoch = -1;
    private skillMap = new Map<string, SkillMeta>();
    private contentCache = new Map<string, string>();
    private contentCacheStat = new Map<string, FileStatSnapshot>();
    private canonicalPathMap = new Map<string, string>();
    private scanEpoch = 0;
    private lastSuccessfulScanAt = 0;
    private skillSignature: string | null = null;

    constructor(skillsPath: string) {
        this.skillsPath = path.resolve(skillsPath);
    }

    private stripQuotes(str: string): string {
        return str.replace(/^"(.*)"$|^'(.*)'$/, "$1$2").trim();
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

        if (!cleanContent.startsWith("---")) {
            return { name: "", description: "", body: cleanContent.trim() };
        }

        // 尋找關閉標記 `---` (位於行首或換行後，容許前置/後置空白或 TAB)
        const closingMatch = cleanContent.slice(3).match(/\r?\n[ \t]*---[ \t]*(?:\r?\n|$)/);
        if (!closingMatch || closingMatch.index === undefined) {
            return { name: "", description: "", body: cleanContent.trim() };
        }

        const frontmatterText = cleanContent.slice(3, 3 + closingMatch.index);
        const body = cleanContent.slice(3 + closingMatch.index + closingMatch[0].length).trim();

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
                description = this.stripQuotes(descStartMatch[1]);
                inDescription = true;
                continue;
            }

            // 支援 YAML 跨行縮排 (空白或 TAB) description 欄位
            if (inDescription && /^\s+/.test(line)) {
                description += " " + line.trim();
            } else {
                inDescription = false;
            }
        }

        return { name, description, body };
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
                return this.cachedSkills;
            }

            if (
                this.skillSignature !== null &&
                (await this.computeSkillSignature()) === this.skillSignature
            ) {
                // 內容完全未變：只需一次 readdir 與每檔 lstat 即可確認，
                // 不需要重新讀取任何技能檔案內容。
                this.lastSuccessfulScanAt = Date.now();
                return this.cachedSkills;
            }
        }

        if (forceReload) {
            this.dropContentCaches();
        }

        const inFlight = this.loadingPromise;
        if (inFlight && this.loadingEpoch === this.scanEpoch) {
            // 單飛（single-flight）：尚未失效的進行中掃描直接共用，它正在讀取的就是
            // 最新磁碟狀態。舊行為讓每個強制重載各自啟動一趟完整掃描，並行的
            // subagent 會把磁碟 I/O 放大為好幾倍。
            return inFlight;
        }

        const epoch = ++this.scanEpoch;
        const currentPromise = this.internalListSkills(epoch);
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
     * 丟棄內容相關快取（檔案內容、canonical 對應與目錄指紋），但保留最後一次
     * 成功的技能清單。
     *
     * 刻意不清除 cachedSkills：若接下來的重掃失敗（例如目錄暫時不可讀），呼叫端
     * 仍可取得最後一次成功的清單，而不是一個空清單。
     */
    private dropContentCaches(): void {
        this.contentCache.clear();
        this.contentCacheStat.clear();
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
        const describe = async (target: string): Promise<string> => {
            try {
                const stat = await fs.lstat(target);
                return `${stat.mode}\u0000${stat.ino}\u0000${stat.size}\u0000${stat.mtimeMs}`;
            } catch {
                return "-";
            }
        };

        try {
            const entries = await fs.readdir(this.skillsPath, { withFileTypes: true });
            const parts: string[] = [];
            for (const entry of entries) {
                const skillDir = path.join(this.skillsPath, entry.name);
                const kind = entry.isDirectory() ? "d" : entry.isSymbolicLink() ? "l" : "f";
                // 只需 SKILL.md 的 mode/ino/size/mtime：ino 已足以識別目錄或檔案被
                // 替換，因此每個技能僅需一次 lstat。符號連結額外比對連結本身的
                // inode，以便偵測「連結被重新指向」。
                const linkInfo = kind === "l" ? await describe(skillDir) : "-";
                const fileInfo = await describe(path.join(skillDir, "SKILL.md"));
                parts.push(`${entry.name}\u0000${kind}\u0000${linkInfo}\u0000${fileInfo}`);
            }
            parts.sort();
            return parts.join("\u0001");
        } catch {
            return null;
        }
    }

    private async internalListSkills(epoch = this.scanEpoch): Promise<SkillMeta[]> {
        let preResolvedRoot: { realRootPath: string; rootStat: Stats } | undefined;
        try {
            const resolvedRoot = path.resolve(this.skillsPath);
            const realRootPath = await fs.realpath(resolvedRoot);
            const rootStat = await fs.stat(realRootPath);
            if (!rootStat.isDirectory()) {
                return this.cachedSkills ?? [];
            }
            preResolvedRoot = { realRootPath, rootStat };
        } catch (_rootErr: unknown) {
            return this.cachedSkills ?? [];
        }

        // 掃描開始前先取得目錄指紋，供下一次冷路徑呼叫快速比對。
        // 先取指紋再讀檔，可確保「掃描期間才發生的變更」會讓下次比對失敗而觸發
        // 完整重掃，不會被誤判為未變更。
        const signature = await this.computeSkillSignature();

        const skills: SkillMeta[] = [];
        const newSkillMap = new Map<string, SkillMeta>();
        const newContentCache = new Map<string, string>();
        const newContentStat = new Map<string, FileStatSnapshot>();
        const newCanonicalMap = new Map<string, string>();
        let scanned = false;

        try {
            const entries = await fs.readdir(this.skillsPath, { withFileTypes: true });
            const skillCandidates = entries.filter((entry) => entry.isDirectory() || entry.isSymbolicLink());

            const loaded = await Promise.all(
                skillCandidates.map(async (entry) => {
                    const skillDir = path.join(this.skillsPath, entry.name);
                    const skillFile = path.join(skillDir, "SKILL.md");

                    try {
                        const { content, realFilePath, stat } = await this.readFileNoFollow(
                            skillFile,
                            this.skillsPath,
                            preResolvedRoot
                        );
                        const { name, description, body } = this.parseFrontmatter(content);
                        const finalName = name || entry.name;
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
                            process.stderr.write(`Warning: Failed to read skill file in directory "${entry.name}"\n`);
                        }
                        return null;
                    }
                })
            );
            for (const result of loaded.filter((value) => value !== null).sort((a, b) =>
                a!.directoryName < b!.directoryName ? -1 : a!.directoryName > b!.directoryName ? 1 : 0
            )) {
                const { item, body, realFilePath, directoryName, stat } = result!;
                const keys = new Set([item.name.toLowerCase(), directoryName.toLowerCase()]);
                const conflict = [...keys].find((key) => newSkillMap.has(key));
                if (conflict) {
                    process.stderr.write(
                        `Warning: Skipping skill directory "${directoryName}" because name or alias "${conflict}" is already registered\n`
                    );
                    continue;
                }
                skills.push(item);
                for (const key of keys) newSkillMap.set(key, item);

                const resolvedPath = path.resolve(item.skillPath);
                newContentCache.set(realFilePath, body);
                newContentStat.set(realFilePath, {
                    dev: stat.dev,
                    ino: stat.ino,
                    size: stat.size,
                    mtimeMs: stat.mtimeMs,
                });
                newCanonicalMap.set(resolvedPath, realFilePath);
                newCanonicalMap.set(realFilePath, realFilePath);
            }
            scanned = true;
        } catch (_dirErr) {
            process.stderr.write(`Error reading skills directory: ${String(_dirErr)}\n`);
        }

        // 只在掃描成功且本輪次依然是最新的 scan 時更新快取，防止舊 scan 覆寫新快取
        if (scanned && epoch === this.scanEpoch) {
            this.skillMap = newSkillMap;
            this.cachedSkills = skills.sort((a, b) => a.name.localeCompare(b.name));
            this.lastSuccessfulScanAt = Date.now();
            this.contentCache = newContentCache;
            this.contentCacheStat = newContentStat;
            this.canonicalPathMap = newCanonicalMap;
            this.skillSignature = signature;
        } else if (!scanned) {
            // 掃描失敗：丟棄指紋，讓下一次呼叫強制走完整重掃。
            this.skillSignature = null;
        }
        return this.cachedSkills ?? [];
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

        if (!this.cachedSkills) {
            await this.listSkills();
        }
        return this.skillMap.get(trimmed.toLowerCase());
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
            throw new Error("File is outside skills directory");
        }

        const stat = await fs.stat(realFilePath);
        if (!stat.isFile() || stat.nlink < 1) throw new Error("Skill path is not a regular file");
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
                actual.nlink < 1 ||
                actual.dev !== stat.dev ||
                actual.ino !== stat.ino ||
                actual.size > MAX_SKILL_FILE_BYTES
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
            if (after.size > MAX_SKILL_FILE_BYTES || after.dev !== stat.dev || after.ino !== stat.ino) {
                throw new Error("File changed while reading");
            }
            return { content: fileBuffer.toString("utf-8"), realFilePath, stat: after };
        } finally {
            await fd.close();
        }
    }

    /**
     * 讀取並去除 YAML frontmatter 的 Markdown 內容 (非同步 + 快取 + BOM 處理 + realpath 軟連結邊界檢查)
     */
    public async readSkillContent(skillPath: string, forceReload = false): Promise<string> {
        const resolvedSkillPath = path.isAbsolute(skillPath)
            ? path.resolve(skillPath)
            : path.resolve(this.skillsPath, skillPath);

        // 高速命中路徑：一次 stat 驗證快取條目仍指向同一個檔案實例（dev/ino/size/mtime
        // 全部相符），命中時不需要 realpath、也不需要讀取檔案內容。
        //
        // 舊行為在快取過期後會先 await this.listSkills(true) 完整重掃整個技能目錄
        // ——只為了讀取「一個」技能，卻把所有技能檔案重新讀一遍。技能越多越慢，
        // 而且並行呼叫會各自觸發一次全樹掃描。
        if (!forceReload) {
            const cached = await this.tryReadFromContentCache(resolvedSkillPath);
            if (cached !== undefined) {
                return cached;
            }
        }

        try {
            // 傳入已相對 skillsPath 解析過的路徑，確保「守衛式讀取」與快取鍵
            // （canonicalPathMap）使用同一種解析方式；否則相對路徑會依 CWD
            // 解析而與快取鍵不一致。
            const { content: raw, realFilePath, stat } = await this.readFileNoFollow(resolvedSkillPath, this.skillsPath);
            const { body } = this.parseFrontmatter(raw);
            this.contentCache.set(realFilePath, body);
            this.contentCacheStat.set(realFilePath, {
                dev: stat.dev,
                ino: stat.ino,
                size: stat.size,
                mtimeMs: stat.mtimeMs,
            });
            this.canonicalPathMap.set(resolvedSkillPath, realFilePath);
            this.canonicalPathMap.set(realFilePath, realFilePath);
            return body;
        } catch (err) {
            throw new Error(`Failed to read skill content: ${err instanceof Error ? err.message : String(err)}`);
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
                stat.mtimeMs === snapshot.mtimeMs
            ) {
                return cached;
            }
        } catch {
            // 檔案已消失或不可讀：交由後續的守衛式讀取產生正確的錯誤訊息
        }
        return undefined;
    }

    public clearCache(): void {
        // 遞增世代，讓「清空當下仍在進行中」的掃描無法在完成後回填快取。
        this.scanEpoch++;
        this.cachedSkills = null;
        this.loadingPromise = null;
        this.loadingEpoch = -1;
        this.skillMap.clear();
        this.contentCache.clear();
        this.contentCacheStat.clear();
        this.canonicalPathMap.clear();
        this.skillSignature = null;
        this.lastSuccessfulScanAt = 0;
    }
}
