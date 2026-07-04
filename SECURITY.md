# Security Policy

## Supported Versions

The following versions of Superpowers MCP are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
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

## Current Security Status (v6.0.0)

| Check | Status |
| ----- | ------ |
| npm audit vulnerabilities | :zero: Zero — all 37 prior advisories resolved |
| `innerHTML` usage | :zero: Zero — entire codebase uses safe DOM APIs |
| `eval` / `new Function` / `document.write` | :zero: Zero occurrences |
| Hardcoded secrets in tracked files | :zero: Zero — `.gitignore` covers `.env*`, `*.pem`, `*.key`, `*.token`, `credentials*` |
| World-writable files | :zero: Zero |
| XSS vectors (brainstorming Visual Companion) | :white_check_mark: Patched — DOM XSS fixed in v5.1.1, remaining `innerHTML` eliminated in v6.0.0 |
| ReDoS (`path-to-regexp`) | :white_check_mark: Patched — upgraded to v8.4.2 in v5.1.1 |
| CORS / Lambda / Set-Cookie (`hono`) | :white_check_mark: Patched — upgraded to v4.12.26 in v5.1.2 |

## Security Best Practices

When using Superpowers MCP:

- Keep the package updated to the latest version (`npm update -g superpowers-mcp`)
- Review skill files before execution in sensitive environments
- Report any suspicious behavior immediately
- The brainstorming Visual Companion starts a local HTTP server on an ephemeral port — only accessible from localhost
