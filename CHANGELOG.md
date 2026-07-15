# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [6.0.2] - 2026-07-16

### Added
- Windows PowerShell helper wrappers for Visual Companion startup/shutdown, subagent-driven-development task/review package generation, and systematic-debugging polluter detection.
- `SkillsManager` module for async skill discovery, metadata lookup, and content caching.
- MCP smoke test script for initialize, `list_skills`, and `read_skill` behavior.

### Security
- **WebSocket frame size validation**: Added `MAX_FRAME_PAYLOAD_BYTES (10 MB)` bound check in `decodeFrame()` — dual protection at BigInt extended-length and general post-resolution stages. Prevents oversized frame OOM attacks (CWE-789).
- **Hardlink containment**: Added `stat.nlink !== 1` check in `isRegularFileInsideContentDir()` — blocks path traversal via hardlinked files with links outside `CONTENT_DIR`.
- **`escapeHtmlText()` extraction**: Extracted inline `escHtml` closure into a reusable named function for consistent HTML escaping across the codebase.
- **URL parsing refactor**: Extracted `pathnameOf()` and `queryKey()` helpers; refactored `handleRequest()` to use them, reducing duplicate inline URL logic.

### Changed
- Refactored MCP server skill loading into `SkillsManager`, with map-based lookups and generic error masking for skill content reads.
- Updated package metadata, README, security notes, and verification logs for v6.0.2.
- Added `.superpowers/` to `.gitignore` for generated Superpowers runtime workspace files.
- `subagent-driven-development/SKILL.md`: Added `plan-mandated` review guidance for plan conflict adjudication.
- `writing-skills/SKILL.md`: Strengthened prohibition vs. recipe guidance with empirical evidence from wording tests.
- `test-driven-development/SKILL.md`: Fixed table formatting for readability.
- `writing-skills/anthropic-best-practices.md`: Updated image CDN URLs.
- `skills/brainstorming/scripts/helper.js`: Added 4 clarifying inline comments to align with upstream documentation. DOM-safe `showTombstone()` preserved (no `innerHTML` regression).

### Fixed
- Synced `package-lock.json` root version with `package.json`.
- Replaced repository documentation links that used local `file:///Users/...` paths with portable relative links.
- Improved Windows helper parity for encoding, pid files, package inclusion, and companion state-file permissions.
- **`review-package` path resolution**: Fixed `sdd-workspace` invocation to use absolute path (`$(cd "$(dirname "$0")" && pwd)`) instead of relative path, fixing failures when invoked from a different working directory.

### Removed
- `walkthrough.md` — obsolete v5.1.0 upgrade guide.

## [6.0.0] - 2026-07-04

### Major
- **Upstream Sync with obra/superpowers v6.1.1**: Synchronized upstream improvements across all skills.

### Changed
- **subagent-driven-development Redesign**: Consolidated two-stage review (spec → code quality) into a single "task reviewer" sub-agent. Added whole-branch final review at completion. Added Pre-Flight Plan Review for conflict detection before execution begins. Added Model Selection Guidance for cost-optimized sub-agent dispatch.
- **using-superpowers Simplified**: Removed platform-specific sections and Graphviz diagram. Added per-platform reference files (`antigravity-tools.md`, `pi-tools.md`) and updated `codex-tools.md` for cleaner multi-environment support.
- **brainstorming Visual Companion**: Changed to just-in-time offering — no longer offered upfront, only when a visual question actually arises.
- **Type Safety**: Fixed `Record<string,string>` cast in `src/server.ts` with proper `typeof` guard for the `skill_name` parameter.
- **Code Quality**: Replaced remaining `innerHTML` usage with safe DOM methods. Removed redundant checks, verbose comments, and inlined single-use helpers.

### Added
- `skills/subagent-driven-development/task-reviewer-prompt.md` — consolidated reviewer prompt replacing separate spec and code-quality prompts.
- `skills/subagent-driven-development/scripts/review-package` — script for packaging review context.
- `skills/subagent-driven-development/scripts/sdd-workspace` — subagent workspace setup.
- `skills/subagent-driven-development/scripts/task-brief` — task briefing script.
- `skills/using-superpowers/references/antigravity-tools.md` — Antigravity CLI tool mapping.
- `skills/using-superpowers/references/pi-tools.md` — Pi CLI tool mapping.
- `.pi-subagents/` to `.gitignore`.

### Removed
- `skills/subagent-driven-development/spec-reviewer-prompt.md` (consolidated into task-reviewer).
- `skills/subagent-driven-development/code-quality-reviewer-prompt.md` (consolidated into task-reviewer).

## [5.1.2] - 2026-06-20

### Security
- Upgraded `hono` from `4.12.23` to `4.12.26` to address 5 high/medium severity advisories including CORS origin reflection, Lambda body-limit bypass, and Set-Cookie header merging.

### Changed
- Resolved all outstanding Dependabot alerts — 37 total advisories now fully patched.

## [5.1.1] - 2026-06-15

### Security
- Fixed DOM XSS vulnerability (DOM text reinterpreted as HTML) in `skills/brainstorming/scripts/helper.js` by replacing direct `innerHTML` usage with safe `textContent` + DOM creation methods.
- Upgraded `path-to-regexp` to version `8.4.2` to resolve high-severity Regular Expression Denial of Service (ReDoS) vulnerability.
- Updated `.gitignore` to prevent committing sensitive environment and private key files.
- Completed full-scale project security audit and updated `tests/security_audit_report.md` with new findings.

### Changed
- Upgraded devDependencies `esbuild` from `0.25.12` to `0.28.1`.

## [5.1.0] - 2026-06-11

### Added
- Added standard MCP protocol initialization response metadata matching `v5.1.0` server capabilities.

### Changed
- **Inline Self-Review**: Replaced heavyweight subagent review loops (Spec Review, Plan Review) in `brainstorming` and `writing-plans` with lightweight inline self-review checklists, reducing execution time overhead.
- **Git Worktree Redesign**: Rewrote `using-git-worktrees` and `finishing-a-development-branch` with a `detect-and-defer` mechanism, prioritizing native AI editor tools (such as Claude Code's `EnterWorktree`) and safely falling back to git CLI commands.
- **Token Footprint Optimization**: Removed obsolete `Integration` sections from all skills, reducing prompt token usage during agent execution.
- **Agent Consolidation**: Merged the independent `code-reviewer` agent directly into `requesting-code-review` skill templates.

### Removed
- Removed legacy slash commands (`/brainstorm`, `/execute-plan`, `/write-plan`) in favor of standard MCP tool invocation.
