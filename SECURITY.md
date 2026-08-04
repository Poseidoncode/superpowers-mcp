# Security Policy

## Supported Versions

The following versions of Superpowers MCP are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 6.2.x   | :white_check_mark: |
| 6.0.x   | :white_check_mark: |
| 5.1.x   | :white_check_mark: |
| 5.0.x   | :x:                |
| 4.3.x   | :x:                |
| < 4.3   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in Superpowers MCP, please report it responsibly:

1. **Email**: Send details to [posidomhu@gmail.com](mailto:posidomhu@gmail.com)
2. **Subject**: Use "[Security] Superpowers MCP - Brief Description"
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Fix Released**: Within 30 days (depending on severity)

## v6.2.2 Security & Quality Hardening Notes

- **Symlink Traversal Protection**: Integrated `fs.realpath` in `readSkillContent` before executing relative boundary checks, neutralizing symlink-based arbitrary file read attempts targeting system files outside `SKILLS_PATH`.
- **UTF-8 BOM Compatibility**: Implemented byte-order-mark (`\uFEFF`) detection and stripping in `parseFrontmatter` and `readSkillContent`, preventing frontmatter parsing failures or unstripped YAML headers on files created/saved with UTF-8 BOM on Windows or VS Code.
- **System Directory Prefix Filtering**: Upgraded `getSafeSkillsPath` in `src/server.ts` from exact string matching to prefix-based filtering (`unsafePrefixes`), preventing `SKILLS_PATH` injection attacks aimed at system subdirectories like `/etc/ssh` or `C:\Windows\System32`.
- **Concurrency Lock Safety**: Reinforced `loadingPromise` release logic in `SkillsManager.listSkills()` with strict instance reference comparison (`if (this.loadingPromise === currentPromise)`), eliminating race condition lock clearing when concurrent `forceReload = true` calls occur.
- **RFC 3986 Resource URI Compliance**: Applied `encodeURIComponent` for generated resource URIs in `ListResourcesRequestSchema` and `decodeURIComponent` in `ReadResourceRequestSchema`, avoiding client-side URI parsing failures for skill names containing spaces or special characters.
- **Edge-Case Unit Test Suite**: Added `tests/edge_cases_test.js` to continuously validate UTF-8 BOM parsing, path traversal, symlink resolution, concurrency lock behavior, and cache invalidation.

## Current Security Status (v6.2.2)

| Check | Status |
| ----- | ------ |
| npm audit vulnerabilities | :zero: Zero — all prior advisories resolved |
| `innerHTML` usage | :zero: Zero — entire codebase uses safe DOM APIs |
| `eval` / `new Function` / `document.write` | :zero: Zero occurrences |
| Hardcoded secrets in tracked files | :zero: Zero — `.gitignore` covers `.env*`, `*.pem`, `*.key`, `*.token`, `credentials*` |
| World-writable files | :zero: Zero |
| Symlink / Path Traversal Defense | :white_check_mark: Secured — skill name validation & canonical `fs.realpath` verification in v6.2.2 |
| UTF-8 BOM & Frontmatter Parser | :white_check_mark: Secured — `\uFEFF` stripping & line-by-line parser in v6.2.2 |
| Environment Path Injection (`SKILLS_PATH`) | :white_check_mark: Secured — system root & subdirectory prefix check in v6.2.2 |
| Concurrency & Cache Safety | :white_check_mark: Secured — instance-checked promise lock & cache invalidation in v6.2.2 |
| XSS vectors (brainstorming Visual Companion & server) | :white_check_mark: Patched — DOM XSS fixed in v5.1.1, remaining `innerHTML` eliminated in v6.0.0, reflected server-side XSS fixed in v6.0.1 |
| Shell Command Injection (`BRAINSTORM_OPEN_CMD`) | :white_check_mark: Patched — `cp.exec` with string concatenation replaced by `cp.execFile` with argv array in v6.0.3 |
| CORS / Lambda / Set-Cookie (`hono`) | :white_check_mark: Patched — upgraded to v4.12.32 in v6.0.3 (body-parser also upgraded to v2.3.0) |

## Security Best Practices

When using Superpowers MCP:

- Keep the package updated to the latest version (`npm update -g superpowers-mcp` or `npx superpowers-mcp@latest`)
- Review skill files before execution in sensitive environments
- Report any suspicious behavior immediately
- The brainstorming Visual Companion starts a local HTTP server on an ephemeral port — only accessible from localhost
