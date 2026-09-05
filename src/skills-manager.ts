import * as fs from "fs/promises";
import type { Stats } from "fs";
import * as path from "path";

export interface SkillMeta {
    name: string;
    description: string;
    skillPath: string;
}

const MAX_SKILL_FILE_BYTES = 10 * 1024 * 1024;

export class SkillsManager {
    private skillsPath: string;
    private cachedSkills: SkillMeta[] | null = null;
    private loadingPromise: Promise<SkillMeta[]> | null = null;
    private skillMap = new Map<string, SkillMeta>();
    private contentCache = new Map<string, string>();
    private canonicalPathMap = new Map<string, string>();
    private scanEpoch = 0;

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
     */
    public async listSkills(forceReload = false): Promise<SkillMeta[]> {
        if (this.cachedSkills && !forceReload) {
            return this.cachedSkills;
        }

        if (this.loadingPromise && !forceReload) {
            return this.loadingPromise;
        }

        if (forceReload) {
            this.contentCache.clear();
            this.canonicalPathMap.clear();
        }

        const epoch = ++this.scanEpoch;
        const currentPromise = this.internalListSkills(epoch);
        this.loadingPromise = currentPromise;
        try {
            return await currentPromise;
        } finally {
            if (this.loadingPromise === currentPromise) {
                this.loadingPromise = null;
            }
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

        const skills: SkillMeta[] = [];
        const newSkillMap = new Map<string, SkillMeta>();
        const newContentCache = new Map<string, string>();
        const newCanonicalMap = new Map<string, string>();
        let scanned = false;

        try {
            const entries = await fs.readdir(this.skillsPath, { withFileTypes: true });
            const skillCandidates = entries.filter((entry) => entry.isDirectory() || entry.isSymbolicLink());

            await Promise.all(
                skillCandidates.map(async (entry) => {
                    const skillDir = path.join(this.skillsPath, entry.name);
                    const skillFile = path.join(skillDir, "SKILL.md");

                    try {
                        const { content, realFilePath } = await this.readFileNoFollow(
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
                        skills.push(item);
                        // O(1) 雙向大小寫不敏感匹配
                        newSkillMap.set(item.name.toLowerCase(), item);
                        const dirName = path.basename(path.dirname(item.skillPath)).toLowerCase();
                        newSkillMap.set(dirName, item);

                        // 預熱 canonical 快取，杜絕別名快取漂移
                        const resolvedPath = path.resolve(skillFile);
                        newContentCache.set(realFilePath, body);
                        newCanonicalMap.set(resolvedPath, realFilePath);
                        newCanonicalMap.set(realFilePath, realFilePath);
                    } catch (err: unknown) {
                        const isEnoent =
                            err &&
                            typeof err === "object" &&
                            "code" in err &&
                            (err as { code?: string }).code === "ENOENT";
                        if (!isEnoent) {
                            process.stderr.write(`Warning: Failed to read skill file in directory "${entry.name}"\n`);
                        }
                    }
                })
            );
            scanned = true;
        } catch (_dirErr) {
            process.stderr.write(`Error reading skills directory: ${String(_dirErr)}\n`);
        }

        // 只在掃描成功且本輪次依然是最新的 scan 時更新快取，防止舊 scan 覆寫新快取
        if (scanned && epoch === this.scanEpoch) {
            this.skillMap = newSkillMap;
            this.cachedSkills = skills.sort((a, b) => a.name.localeCompare(b.name));
            for (const [k, v] of newContentCache.entries()) {
                this.contentCache.set(k, v);
            }
            for (const [k, v] of newCanonicalMap.entries()) {
                this.canonicalPathMap.set(k, v);
            }
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
     * 以檔案描述元讀取檔案，並在開檔前後比對 canonical path 與 inode，
     * 防止 realpath 檢查與 readFile 之間的 symlink/rename TOCTOU。
     * POSIX 額外使用 O_NOFOLLOW；Windows 以開啟後的檔案識別比對防止
     * reparse point 在檢查後被替換。
     * 支援預解析 rootStat，消除對根目錄重複的 realpath/stat 磁碟調用。
     */
    private async readFileNoFollow(
        filePath: string,
        rootPath: string,
        preResolvedRoot?: { realRootPath: string; rootStat: Stats }
    ): Promise<{ content: string; realFilePath: string }> {
        const resolvedFilePath = path.resolve(filePath);
        const resolvedRootPath = path.resolve(rootPath);
        const resolveAndStat = async () => {
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
            return { realFilePath, stat };
        };

        const expected = await resolveAndStat();
        const confirmed = await resolveAndStat();
        if (
            expected.realFilePath !== confirmed.realFilePath ||
            expected.stat.dev !== confirmed.stat.dev ||
            expected.stat.ino !== confirmed.stat.ino
        ) {
            throw new Error("File changed while validating its path");
        }

        const noFollow = process.platform === "win32" ? 0 : fs.constants.O_NOFOLLOW;
        const fd = await fs.open(confirmed.realFilePath, fs.constants.O_RDONLY | noFollow);
        try {
            const actual = await fd.stat();
            if (
                !actual.isFile() ||
                actual.nlink < 1 ||
                actual.dev !== confirmed.stat.dev ||
                actual.ino !== confirmed.stat.ino ||
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
            if (after.size > MAX_SKILL_FILE_BYTES || after.dev !== confirmed.stat.dev || after.ino !== confirmed.stat.ino) {
                throw new Error("File changed while reading");
            }
            return { content: fileBuffer.toString("utf-8"), realFilePath: confirmed.realFilePath };
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

        // 高速命中路徑：以 Canonical 映射查詢記憶體快取，零磁碟 I/O 且杜絕快取漂移
        const canonicalKey = this.canonicalPathMap.get(resolvedSkillPath);
        if (!forceReload && canonicalKey && this.contentCache.has(canonicalKey)) {
            return this.contentCache.get(canonicalKey)!;
        }

        const resolvedRoot = path.resolve(this.skillsPath);
        let realSkillPath = resolvedSkillPath;
        let realRoot = resolvedRoot;

        try {
            realSkillPath = await fs.realpath(resolvedSkillPath);
            realRoot = await fs.realpath(resolvedRoot);
        } catch (_realpathErr: unknown) {
            // 若檔案不存在或 realpath 失敗，回退至 resolvedPath 檢查
        }

        const relative = path.relative(realRoot, realSkillPath);

        if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
            throw new Error(`Access denied: path "${skillPath}" is outside skills directory`);
        }

        if (!forceReload && this.contentCache.has(realSkillPath)) {
            const cached = this.contentCache.get(realSkillPath)!;
            this.canonicalPathMap.set(resolvedSkillPath, realSkillPath);
            return cached;
        }

        try {
            const { content: raw, realFilePath } = await this.readFileNoFollow(skillPath, this.skillsPath);
            const { body } = this.parseFrontmatter(raw);
            this.contentCache.set(realFilePath, body);
            this.canonicalPathMap.set(resolvedSkillPath, realFilePath);
            this.canonicalPathMap.set(realFilePath, realFilePath);
            return body;
        } catch (err) {
            throw new Error(`Failed to read skill content: ${err instanceof Error ? err.message : String(err)}`);
        }
    }

    public clearCache(): void {
        this.cachedSkills = null;
        this.loadingPromise = null;
        this.skillMap.clear();
        this.contentCache.clear();
        this.canonicalPathMap.clear();
    }
}
