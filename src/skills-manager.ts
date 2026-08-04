import * as fs from "fs/promises";
import * as path from "path";

export interface SkillMeta {
    name: string;
    description: string;
    skillPath: string;
}

export class SkillsManager {
    private skillsPath: string;
    private cachedSkills: SkillMeta[] | null = null;
    private loadingPromise: Promise<SkillMeta[]> | null = null;
    private skillMap = new Map<string, SkillMeta>();
    private contentCache = new Map<string, string>();

    constructor(skillsPath: string) {
        this.skillsPath = skillsPath;
    }

    private stripQuotes(str: string): string {
        return str.replace(/^"(.*)"$|^'(.*)'$/, "$1$2").trim();
    }

    /**
     * 逐行安全解析 YAML frontmatter（支援 UTF-8 BOM、TAB/空格縮排、Windows 換行、防範 ReDoS 且相容多行 description）
     */
    private parseFrontmatter(content: string): { name: string; description: string } {
        let cleanContent = content;
        if (cleanContent.charCodeAt(0) === 0xfeff) {
            cleanContent = cleanContent.slice(1);
        }

        if (!cleanContent.startsWith("---")) {
            return { name: "", description: "" };
        }

        const lines = cleanContent.split(/\r?\n/);
        const yamlLines: string[] = [];
        let foundEnd = false;

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === "---") {
                foundEnd = true;
                break;
            }
            yamlLines.push(lines[i]);
        }

        if (!foundEnd) {
            return { name: "", description: "" };
        }

        let name = "";
        let description = "";
        let inDescription = false;

        for (const line of yamlLines) {
            const nameMatch = line.match(/^name:\s*(.+?)\s*$/);
            if (nameMatch) {
                name = this.stripQuotes(nameMatch[1]);
                inDescription = false;
                continue;
            }

            const descStartMatch = line.match(/^description:\s*(.+?)\s*$/);
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

        return { name, description };
    }

    private async exists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
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
        }

        const currentPromise = this.internalListSkills();
        this.loadingPromise = currentPromise;
        try {
            return await currentPromise;
        } finally {
            if (this.loadingPromise === currentPromise) {
                this.loadingPromise = null;
            }
        }
    }

    private async internalListSkills(): Promise<SkillMeta[]> {
        if (!(await this.exists(this.skillsPath))) {
            return [];
        }

        const skills: SkillMeta[] = [];
        const newSkillMap = new Map<string, SkillMeta>();

        try {
            const entries = await fs.readdir(this.skillsPath, { withFileTypes: true });

            const promises = entries
                .filter((entry) => entry.isDirectory())
                .map(async (entry) => {
                    const skillDir = path.join(this.skillsPath, entry.name);
                    const skillFile = path.join(skillDir, "SKILL.md");

                    if (!(await this.exists(skillFile))) {
                        return null;
                    }

                    try {
                        const content = await fs.readFile(skillFile, "utf-8");
                        const { name, description } = this.parseFrontmatter(content);
                        const finalName = name || entry.name;

                        return {
                            name: finalName,
                            description,
                            skillPath: skillFile,
                        };
                    } catch (_fileErr) {
                        process.stderr.write(`Warning: Failed to read skill file in directory "${entry.name}"\n`);
                        return null;
                    }
                });

            const results = await Promise.all(promises);
            for (const item of results) {
                if (item) {
                    skills.push(item);
                    // O(1) 雙向大小寫不敏感匹配
                    newSkillMap.set(item.name.toLowerCase(), item);
                    const dirName = path.basename(path.dirname(item.skillPath)).toLowerCase();
                    newSkillMap.set(dirName, item);
                }
            }
        } catch (_dirErr) {
            process.stderr.write(`Error reading skills directory: ${String(_dirErr)}\n`);
            return [];
        }

        this.skillMap = newSkillMap;
        this.cachedSkills = skills.sort((a, b) => a.name.localeCompare(b.name));
        return this.cachedSkills;
    }

    /**
     * O(1) 快速查詢技能 (防範路徑遍歷及 Windows/Unix 路徑分隔符號)
     */
    public async findSkill(skillName: string): Promise<SkillMeta | undefined> {
        if (
            typeof skillName !== "string" ||
            !skillName.trim() ||
            skillName.includes("/") ||
            skillName.includes("\\") ||
            skillName.includes("..") ||
            skillName.includes("\0")
        ) {
            return undefined;
        }

        if (!this.cachedSkills) {
            await this.listSkills();
        }
        return this.skillMap.get(skillName.trim().toLowerCase());
    }

    /**
     * 讀取並去除 YAML frontmatter 的 Markdown 內容 (非同步 + 快取 + BOM 處理 + realpath 軟連結邊界檢查)
     */
    public async readSkillContent(skillPath: string, forceReload = false): Promise<string> {
        const resolvedSkillPath = path.resolve(skillPath);
        const resolvedRoot = path.resolve(this.skillsPath);

        let realSkillPath = resolvedSkillPath;
        let realRoot = resolvedRoot;

        try {
            realSkillPath = await fs.realpath(resolvedSkillPath);
            realRoot = await fs.realpath(resolvedRoot);
        } catch {
            // 若檔案不存在或 realpath 失敗，回退至 resolvedPath 檢查
        }

        const relative = path.relative(realRoot, realSkillPath);

        if (relative.startsWith("..") || path.isAbsolute(relative)) {
            throw new Error(`Access denied: path "${skillPath}" is outside skills directory`);
        }

        if (this.contentCache.has(realSkillPath) && !forceReload) {
            return this.contentCache.get(realSkillPath)!;
        }

        try {
            let raw = await fs.readFile(realSkillPath, "utf-8");
            if (raw.charCodeAt(0) === 0xfeff) {
                raw = raw.slice(1);
            }
            const content = raw.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n?/, "").trim();
            this.contentCache.set(realSkillPath, content);
            return content;
        } catch (err) {
            throw new Error(`Failed to read skill content: ${err instanceof Error ? err.message : String(err)}`);
        }
    }

    public clearCache(): void {
        this.cachedSkills = null;
        this.loadingPromise = null;
        this.skillMap.clear();
        this.contentCache.clear();
    }
}
