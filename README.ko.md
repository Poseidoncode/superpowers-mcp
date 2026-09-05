# Superpowers MCP Toolpack 사용 가이드

[English](README.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

[![Version](https://img.shields.io/badge/version-6.3.4-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

이 문서는 Superpowers 스킬 라이브러리와 자율 에이전트 워크플로우를 독립적이고 고성능이며 안전한 **Model Context Protocol (MCP)** 서버로 패키징한 사용 지침을 요약한 것입니다.

---

## 🚀 설치 및 사용 방법

### 지원 환경 및 에이전트 플랫폼

- **AI 코드 편집기 & IDE**: **Antigravity (AGY)**, **Cursor**, **VSCode** (GitHub Copilot), **Devin Desktop**, **MiniMax Code Desktop**, **Codex**.
- **AI 데스크톱 앱 & 에이전트 도구**: **Hermes Desktop**, **Kimi Work**.
- **자체 호스팅 & 로컬 AI 플랫폼**: **AnythingLLM**, **LibreChat**.

### 제공되는 MCP 프로토콜 기능

| 프로토콜 기능 | 포함 항목 / 수량 | 설명 |
| :--- | :--- | :--- |
| **Tools** | `list_skills`, `read_skill` | 14개의 Superpowers 스킬을 온디맨드로 검색, 로드 및 확인합니다. |
| **Prompts** | 9개의 네이티브 Prompts | `session-start`, `feature-pipeline`, `structured-debug`, `skill-composition`, `sdd-implementer`, `sdd-task-reviewer`, `sdd-re-review`, `spec-reviewer`, `plan-reviewer` |
| **Resources** | 14개의 Direct Skill URIs | `skill://superpowers/<skill-name>` (MCP 표준 기반 직접 접근) |

### AI 에이전트와 대화하기 (기본 사용법)

설치 또는 구성이 완료되면 AI 에이전트가 `Superpowers Skills` 및 `Prompts`를 자동으로 인식하고 호출할 수 있습니다.

**기본 대화 예시:**
- **엔지니어링 규율 초기화**: "`session-start` 프롬프트 적용해줘" (Superpowers 규칙 및 환경 주입)
- **사용 가능한 스킬 목록 확인**: "모든 superpowers 스킬을 나열해줘"
- **단일 스킬 로드**: "`read_skill`로 `brainstorming` 스킬을 읽고 요구사항을 분석해줘"

---

## ⚡ 타겟 지정형 원클릭 설정 (Targeted One-Click Setup)

불필요한 환경 수정을 방지하고 필요한 클라이언트에만 안전하게 도입할 수 있도록, **명시적인 타겟 지정과 개인정보/환경 보호를 최우선**으로 하는 원클릭 설정 도구를 제공합니다.

> [!NOTE]
> **모든 디렉터리에서 바로 실행 가능**: 이 저장소를 복제(clone)하거나 특정 폴더로 이동할 필요가 없습니다. 터미널의 **어느 위치에서나** 바로 아래 명령어를 실행할 수 있습니다. 설치 도구가 사용자 홈 디렉터리(`~`)를 기준으로 전역 설정 파일을 자동 탐지하여 모든 작업 공간에서 즉시 활성화합니다.

> [!TIP]
> **투명성 및 환경 보호 원칙**: Superpowers MCP는 악성코드처럼 선택되지 않은 다른 에디터를 임의로 스캔하거나 일괄 수정하지 않습니다. 사용 중인 AI 클라이언트 전용 명령어를 실행하기만 하면, **원자적 쓰기(Atomic Swap) 기술**을 통해 설정을 안전하게 병합합니다 (충돌 시 손상 제로, **기본적으로 불필요한 `.bak` 쓰레기 파일을 남기지 않는 클린 사양**, 기존 다른 MCP 서버 무영향).

### 1. 사용 중인 AI Agent / 에디터 선택 (원클릭 정밀 설정)

사용 중인 클라이언트에 맞춰 터미널에서 해당 명령어를 실행하세요:

| Harness / 클라이언트 | 지원 OS | 원클릭 설정 명령어 | 기본 설정 파일 경로 |
| :--- | :--- | :--- | :--- |
| **Antigravity (Google DeepMind)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target antigravity` | `~/.gemini/config/mcp_config.json` |
| **Pi Desktop / Pi Agent** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target pi-desktop` | `~/.pi/agent/mcp.json` |
| **Cursor** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target cursor` | `~/.cursor/mcp.json` |
| **GitHub Copilot (VS Code)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target copilot` | `Code/User/mcp.json` *(VS Code `servers` 형식)* |
| **Hermes Desktop / Agent** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target hermes` | `~/.hermes/config.yaml` *(Win: `%LOCALAPPDATA%\hermes`)* |
| **Kimi Work / Kimi Code** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target kimi` | `~/.kimi-code/mcp.json` |
| **Claude Desktop** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target claude` | `Claude/claude_desktop_config.json` |
| **Devin Desktop (구 Windsurf)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target devin` | `~/.config/devin/mcp_config.json` *(또는 `windsurf`)* |

*(Bun을 선호하는 경우 `--bun`을 추가할 수 있습니다, 예: `npx -y superpowers-mcp setup --target cursor --bun`)*

---

### 2. Curl 또는 PowerShell을 통한 설정

- **macOS / Linux (Curl 이용 타겟 지정):**
  ```bash
  curl -fsSL https://raw.githubusercontent.com/Poseidoncode/superpowers-mcp/main/scripts/install.sh | bash -s -- --target cursor
  ```

- **Windows (PowerShell 이용 타겟 지정):**
  ```powershell
  & ([scriptblock]::Create((irm https://raw.githubusercontent.com/Poseidoncode/superpowers-mcp/main/scripts/install.ps1))) -Target cursor
  ```

#### 유용한 고급 옵션:
- `--dry-run`: 디스크에 쓰지 않고 변경될 파일과 내용을 미리 확인합니다.
- `--remove`: 지정된 대상 Harness에서 Superpowers 설정을 안전하게 제거합니다.
- `--backup`: 변경 전 타임스탬프가 포함된 `.bak` 백업 파일을 생성 (기본값은 해제, 클린 환경 유지).
- `--bun`: 생성되는 명령어에서 `bunx`를 사용합니다.
- `--target <name>`: 특정 대상을 지정 (별칭 지원, 예: `code`, `vscode`, `kimi-code`).

---

## 🛠️ 수동 MCP 구성 (Manual Configuration)

수동으로 설정하려는 경우, 다음 설정을 IDE 또는 MCP 클라이언트(예: Cursor, Antigravity, VSCode, AnythingLLM 등)의 MCP 설정에 추가하세요.

### 방법: NPX / BUNX (권장)

경로 해결을 자동으로 처리하므로 가장 쉬운 방법입니다.

#### Bun 사용 (더 빠름)
```json
{
  "superpowers": {
    "command": "bunx",
    "args": ["-y", "superpowers-mcp"]
  }
}
```

#### Node/NPM 사용
```json
{
  "superpowers": {
    "command": "npx",
    "args": ["-y", "superpowers-mcp"]
  }
}
```

---

## 🔄 스킬 조합 및 워크플로우 파이프라인 (Skill Compositions & Pipelines)

여러 단계의 복잡한 엔지니어링 작업을 수행할 때는 아래의 **원클릭 엔드투엔드 파이프라인**을 사용하세요(상세 가이드: [`docs/skill-compositions.ko.md`](docs/skill-compositions.ko.md)):

### 1. 엔드투엔드 새 기능 개발 파이프라인 (Feature Development Pipeline)
```
brainstorming ➔ writing-plans ➔ using-git-worktrees ➔ subagent-driven-development (TDD) ➔ verification-before-completion ➔ requesting-code-review ➔ finishing-a-development-branch
```
- **원클릭 명령어:** "`feature-pipeline`을 적용하여 [기능 이름] 개발을 진행해줘"
- **특징:** 요구사항 확인 (Spec) ➔ 작업 분해 (Plan) ➔ Worktree 격리 ➔ 독립 서브에이전트 + TDD 구현 ➔ 전체 테스트 검증 ➔ 대립 코드 리뷰 ➔ 브랜치 마무리.

### 2. 구조화된 문제 해결 파이프라인 (Structured Troubleshooting Pipeline)
```
systematic-debugging ➔ using-git-worktrees ➔ dispatching-parallel-agents ➔ test-driven-development ➔ verification-before-completion ➔ requesting-code-review ➔ finishing-a-development-branch
```
- **원클릭 명령어:** "`structured-debug`를 적용하여 다음 오류를 분석하고 수정해줘: [오류 로그]"
- **특징:** 근본 원인 가설 분해 ➔ Worktree 격리 병렬 조사 ➔ 다중 에이전트 검증 ➔ 실패 테스트 작성 및 수정 ➔ 완전한 회귀 검증 ➔ 리뷰 지적 해결 ➔ 브랜치 마무리.

### 3. 동적 워크플로우 가이드 (Dynamic Workflow Guide)
- **원클릭 명령어:** "`skill-composition`을 적용하여 현재 상황 [리팩토링/마이그레이션/레거시 코드 보호]에 맞는 절차를 안내해줘"
- **특징:** 대규모 리팩토링, 레거시 시스템 안전망 구축, 온보딩에 맞는 최적의 파이프라인을 동적으로 추천:
  - **대규모 리팩토링 및 마이그레이션 (Pipeline 3):** `brainstorming` ➔ `writing-plans (skeleton-first)` ➔ `using-git-worktrees` ➔ `subagent-driven-development` ➔ `verification-before-completion` ➔ `requesting-code-review` ➔ `finishing-a-development-branch`
  - **레거시 코드베이스 안전망 (Pipeline 4):** `brainstorming` ➔ `writing-plans` ➔ `test-driven-development (characterization)` ➔ `systematic-debugging` ➔ `verification-before-completion`


---

## 📋 지원되는 스킬 총람 (14대 핵심 스킬 및 추천 시나리오)

상황에 맞는 스킬을 신속하게 선택할 수 있도록, 14개의 스킬을 소프트웨어 개발 라이프사이클(SDLC)에 맞추어 분류하고 주요 역할과 커뮤니티 권장 시나리오를 하나로 통합했습니다:

| # | 개발 단계 (Phase) | 스킬 이름 (Skill Name) | 역할 및 핵심 가치 (Purpose & Core Value) | 추천 사용 시나리오 (Recommended Scenario) |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **🚀 계획 및 설계** | **`brainstorming`** | **요구사항 명확화 및 설계 탐색**：코드 작성 전 아키텍처 방안과 제약을 명확히 하고 스펙을 산출. Visual Companion 브라우저 UI 검토 지원. | 새 기능이나 대규모 변경을 시작하기 전, AI가 바로 코딩하는 것을 방지. |
| 2 | **🚀 계획 및 설계** | **`writing-plans`** | **구현 계획 분해**：스펙을 독립 검증 가능한 작업 목록으로 분해하고 Recommended Skill 및 파일 계약 명시. | 여러 파일 리팩토링이나 복잡한 마이그레이션 전 명확한 청사진 수립. |
| 3 | **💻 구현 및 개발** | **`executing-plans`** | **세션 내 계획 순차 실행**：현재 세션에서 계획에 따라 단계별로 작업을 실행하고 체크포인트 검토 수행. | 서브에이전트를 생성하지 않고 동일 세션 내에서 순차적으로 계획을 실행할 때. |
| 4 | **💻 구현 및 개발** | **`subagent-driven-development`** | **서브에이전트 주도 개발 (SDD)**：작업별로 깨끗한 컨텍스트의 서브에이전트를 디스패치하고 이중 대립 코드 리뷰 수행. | 복잡한 계획 실행 시 컨텍스트 오염을 방지하고 정확도를 높이는 권장 방식. |
| 5 | **💻 구현 및 개발** | **`test-driven-development`** | **테스트 주도 개발 (TDD)**：Red ➔ Green ➔ Refactor 주기를 엄격히 준수하여 견고한 테스트를 갖춘 코드 구현. | 논리적으로 복잡한 기능이나 핵심 알고리즘을 구현할 때. |
| 6 | **🔍 디버깅 및 조사** | **`systematic-debugging`** | **체계적 근본 원인 디버깅**：오류를 검증 가능한 가설로 분해하고 체계적으로 원인을 추적하여 임의 수정을 방지. | 오류, 비정상 동작 또는 재현하기 어려운 버그가 발생했을 때. |
| 7 | **🛡️ 품질 및 리뷰** | **`verification-before-completion`** | **완료 전 증거 기반 검증**：전체 테스트 스위트, Linter, 타입 검사를 실행하여 회귀가 없음을 입증. | "고쳤다" 또는 "완료했다"고 말하기 전, 객관적인 완료 증거 제시. |
| 8 | **🛡️ 품질 및 리뷰** | **`requesting-code-review`** | **코드 리뷰 요청**：Diff와 리포트를 패키징하여 다각적인 아키텍처 및 코드 품질 검토 요청. | 브랜치 병합이나 작업 완료 전, 다차원 아키텍처 및 품질 검사 수행. |
| 9 | **🛡️ 품질 및 리뷰** | **`receiving-code-review`** | **리뷰 피드백 반영**：리뷰 지적사항을 체계적으로 평가 및 수정하고 모든 Finding에 대한 조치를 기록. | 코드 리뷰 피드백을 받아 체계적으로 수정하고 기록할 때. |
| 10 | **🛡️ 품질 및 리뷰** | **`finishing-a-development-branch`** | **브랜치 마무리 및 정리**：PR/병합, Git Worktree 정리, 임시 브랜치 안전 삭제를 통해 깔끔하게 마무리. | 기능 개발 완료 후 메인 브랜치에 안전하게 통합하고 작업 환경 정리. |
| 11 | **🌿 버전 관리** | **`using-git-worktrees`** | **Git Worktree 물리적 격리**：기능 개발이나 병렬 조사를 위한 독립 디렉토리를 생성하여 파일 충돌 및 환경 오염 방지. | 여러 작업을 동시에 진행하거나 다중 에이전트 병렬 디버깅 시. |
| 12 | **🤖 고급 에이전트 제어** | **`dispatching-parallel-agents`** | **병렬 에이전트 조율**：격리된 환경에서 여러 서브에이전트를 병렬 디스패치하여 복수 가설을 동시에 검증. | 여러 테스트가 동시에 실패하여 병렬 조사로 원인 규명을 가속화할 때. |
| 13 | **🤖 고급 에이전트 제어** | **`using-superpowers`** | **기본 규율 및 스킬 로드**：작업 전 적절한 스킬을 탐색하고 적용하도록 안내하는 Superpowers 기본 규율. | 세션 시작 시 자동으로 로드되어 AI의 행동 규범을 설정. |
| 14 | **🤖 고급 에이전트 제어** | **`writing-skills`** | **스킬 작성 및 관리**：새로운 Superpowers 스킬을 생성, 테스트 및 패키징하는 표준 가이드. | 팀 전용 새 스킬을 작성하거나 기존 스킬을 확장할 때. |

---

## 🆕 최근 업데이트

### v6.3.4 (최신)

- **Universal One-Click 글로벌 설정 엔진 (`src/setup-runner.ts`, `scripts/`)**:
  - 8대 주요 AI 개발 환경(Antigravity, Pi Desktop / Pi Agent, Cursor, GitHub Copilot (VS Code), Hermes Desktop / Agent, Kimi Work / Kimi Code, Claude Desktop, Devin Desktop)에 대한 무의존성 원클릭 자동 구성 지원.
  - CLI 명령어 `superpowers-setup` 및 `superpowers-mcp setup`을 제공하며, 크로스 플랫폼 설치 스크립트([`install.sh`](scripts/install.sh) 및 [`install.ps1`](scripts/install.ps1)) 개발.
  - **명시적 동의 및 안티바이러스 설계 (Explicit Consent & Anti-Virus Design)**: `--target <client>`를 필수로 요구하여 무단 디스크 스캔 및 전체 환경 임의 수정을 원천 차단(`--all` 제거).
  - **원자적 쓰기 방어 (`safeWriteConfig`)**: 무작위 8바이트 nonce 임시 파일, `flag: "wx"`, `renameSync`를 통한 원자적 조작으로 파일 충돌 및 손상 방지.
  - **심볼릭 링크 보호 및 최소 권한**: `realpathSync`로 링크 대상을 안전하게 확인하며, 새 디렉토리는 `0o700`, 설정 파일은 `0o600`으로 제한하고 백업 파일은 원본 권한을 보존.
  - **매개변수 인젝션 방어 및 JSONC 파싱**: `JSON.stringify`를 통한 안전한 이스케이프, 주석/후행 쉼표 허용 및 `isPlainObject` 프로토타입 오염 방어.
  - **CLI Stdio 격리**: `src/server.ts`에서 setup 인자를 사전 분기하여 MCP Stdio 프로토콜 오염 방지.
  - **자동화 테스트 스위트**: [`tests/setup_test.js`](tests/setup_test.js) 추가(21개 테스트 100% 통과).
- **Skill Compositions 스킬 구성 및 엔드투엔드 파이프라인 (`src/server.ts`, `docs/`)**:
  - 3개의 새로운 MCP 워크플로우 프롬프트 추가: `feature-pipeline`, `structured-debug`, `skill-composition`.
  - 4개 국어 현지화 가이드([`docs/skill-compositions.ko.md`](docs/skill-compositions.ko.md)), 가로형 Mermaid 플로우차트 및 ASCII 워크플로우 다이어그램 추가.
  - [`skills/using-superpowers/SKILL.md`](skills/using-superpowers/SKILL.md) 및 [`skills/writing-plans/SKILL.md`](skills/writing-plans/SKILL.md)에 `Recommended Skill` 메타데이터 표준 및 컨트롤러-서브에이전트 간 프로토콜 추가.
  - [`tests/prompts_compositions_test.js`](tests/prompts_compositions_test.js) 추가(7개 테스트 100% 통과).
- **프롬프트 보안 강화 및 라이프사이클 완성 (`src/server.ts`)**:
  - `interpolateTemplate`을 단일 패스 정규식 치환으로 업그레이드하여 연쇄적 플레이스홀더 인젝션 위험 제거.
  - 전체 9개 프롬프트에 32 KB 길이 제한 및 `hasOwnProperty` 검증 적용.
  - `structured-debug`에 Stage 6(리뷰 조치) 및 Stage 7(브랜치 정리/마무리) 추가.
- **포괄적 보안 감사 및 검증**:
  - `npm audit` 취약점 0건 확인, 전체 5대 테스트 스위트(100+ 어서션) 100% 통과, [`SECURITY.md`](SECURITY.md) 갱신.

### v6.3.3

- **MCP 표준 프롬프트 지원 (`src/server.ts`)**:
  - 표준 프롬프트 핸들러를 구현하여 IDE 프롬프트 선택기에서 사용할 수 있는 6개의 프롬프트(`session-start`, `sdd-implementer`, `sdd-task-reviewer`, `sdd-re-review`, `spec-reviewer`, `plan-reviewer`) 등록.
- **멀티 하네스 참조 매핑**:
  - Devin CLI([`references/devin-tools.md`](skills/using-superpowers/references/devin-tools.md)) 및 OpenCode([`references/opencode-tools.md`](skills/using-superpowers/references/opencode-tools.md))용 네이티브 도구 매핑 추가.
- **다국어 문서 동기화**:
  - 모든 언어의 README에서 MCP 기능 지원 표(Tools / Prompts / Resources) 및 멀티 하네스 지원 매트릭스 통일.
- **테스트 스위트 확장**:
  - `prompts/list` 및 `prompts/get` 매개변수 주입에 대한 자동화 테스트 어서션 추가.

👉 *이전 버전의 전체 릴리스 내역은 [CHANGELOG.md](CHANGELOG.md)를 참조하세요.*

---

## 🙏 감사의 말

이 프로젝트는 [obra](https://github.com/obra)의 원본 [Superpowers](https://github.com/obra/superpowers) 프로젝트의 포크 및 각색입니다. 이 MCP 서버의 기반이 되는 에이전틱 스킬 프레임워크와 소프트웨어 엔지니어링 워크플로우를 정의해 준 그들의 선구적인 작업에 감사드립니다.
