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
    private skillMap = new Map<string, SkillMeta>();
    private contentCache = new Map<string, string>();

    constructor(skillsPath: string) {
        this.skillsPath = skillsPath;
    }

    /**
     * 逐行安全解析 YAML frontmatter（支援 Windows 換行、防範 ReDoS 且相容多行 description）
     */
    private parseFrontmatter(content: string): { name: string; description: string } {
        if (!content.startsWith("---")) {
            return { name: "", description: "" };
        }

        const lines = content.split(/\r?\n/);
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
                name = nameMatch[1].replace(/^["']|["']$/g, "").trim();
                inDescription = false;
                continue;
            }

            const descStartMatch = line.match(/^description:\s*(.+?)\s*$/);
            if (descStartMatch) {
                description = descStartMatch[1].replace(/^["']|["']$/g, "").trim();
                inDescription = true;
                continue;
            }

            // 支援 YAML 跨行縮排 description 欄位
            if (inDescription && line.startsWith(" ")) {
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
     * 非同步併發列出技能，實作快取與 O(1) 雙向鍵索引
     */
    public async listSkills(forceReload = false): Promise<SkillMeta[]> {
        if (this.cachedSkills && !forceReload) {
            return this.cachedSkills;
        }

        if (!(await this.exists(this.skillsPath))) {
            return [];
        }

        const skills: SkillMeta[] = [];
        this.skillMap.clear();

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
                    } catch (fileErr) {
                        process.stderr.write(`Warning: Failed to read skill file in directory "${entry.name}"\n`);
                        return null;
                    }
                });

            const results = await Promise.all(promises);
            for (const item of results) {
                if (item) {
                    skills.push(item);
                    // O(1) 雙向大小寫不敏感匹配
                    this.skillMap.set(item.name.toLowerCase(), item);
                    const dirName = path.basename(path.dirname(item.skillPath)).toLowerCase();
                    this.skillMap.set(dirName, item);
                }
            }
        } catch (dirErr) {
            process.stderr.write(`Error reading skills directory: ${String(dirErr)}\n`);
            return [];
        }

        this.cachedSkills = skills.sort((a, b) => a.name.localeCompare(b.name));
        return this.cachedSkills;
    }

    /**
     * O(1) 快速查詢技能 (防止路徑遍歷，防範大小寫敏感)
     */
    public async findSkill(skillName: string): Promise<SkillMeta | undefined> {
        if (!/^[a-zA-Z0-9-_]+$/.test(skillName)) {
            return undefined;
        }
        if (!this.cachedSkills) {
            await this.listSkills();
        }
        return this.skillMap.get(skillName.toLowerCase());
    }

    /**
     * 讀取並去 YAML frontmatter 的 Markdown 內容 (非同步 + 快取)
     */
    public async readSkillContent(skillPath: string, forceReload = false): Promise<string> {
        if (this.contentCache.has(skillPath) && !forceReload) {
            return this.contentCache.get(skillPath)!;
        }

        try {
            const raw = await fs.readFile(skillPath, "utf-8");
            const content = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
            this.contentCache.set(skillPath, content);
            return content;
        } catch (err) {
            throw new Error(`Failed to read skill content`);
        }
    }

    public clearCache(): void {
        this.cachedSkills = null;
        this.skillMap.clear();
        this.contentCache.clear();
    }
}
