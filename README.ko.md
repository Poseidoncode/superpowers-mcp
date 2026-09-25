# Superpowers MCP Toolpack 사용 가이드

[English](README.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

[![Version](https://img.shields.io/badge/version-6.4.2-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

이 문서는 Superpowers 스킬 라이브러리와 자율 에이전트 워크플로우를 독립적이고 고성능이며 안전한 **Model Context Protocol (MCP)** 서버로 패키징한 사용 지침을 요약한 것입니다.

---

## 🚀 설치 및 사용 방법

### 지원 환경 및 에이전트 플랫폼

- **AI 코드 편집기 & IDE**: **Antigravity (AGY)**, **Cursor**, **VSCode** (GitHub Copilot), **VSCode Insiders** (GitHub Copilot), **Devin Desktop**, **Trae**, **Cline**, **Kilo Code**, **Qoder**, **Kiro**, **MiniMax Code Desktop**, **Codex**.
- **AI 데스크톱 앱 & 에이전트 도구**: **Claude Desktop**, **Pi Desktop**, **QwenPaw**, **Hermes Desktop**, **Kimi Work**.
- **자체 호스팅 & 로컬 AI 플랫폼**: **AnythingLLM**, **LibreChat**.

### 제공되는 MCP 프로토콜 기능

| 프로토콜 기능 | 포함 항목 / 수량 | 설명 |
| :--- | :--- | :--- |
| **Tools** | `list_skills`, `read_skill` | 14개의 Superpowers 스킬을 온디맨드로 검색, 로드 및 확인합니다. |
| **Prompts** | 9개의 네이티브 Prompts | `session-start`, `feature-pipeline`, `structured-debug`, `skill-composition`, `sdd-implementer`, `sdd-task-reviewer`, `sdd-re-review`, `spec-reviewer`, `plan-reviewer` |
| **Resources** | 15개 Skill URI + 1개 가이드 | `skill://superpowers/<skill-name>` 및 `guide://superpowers/skill-compositions` |

### AI 에이전트와 대화하기 (기본 사용법)

설치 또는 구성 후 MCP 클라이언트는 Superpowers tools, prompts, resources를 탐색할 수 있습니다. MCP prompt는 사용자가 선택하여 시작하며, 이후 에이전트가 지침에 따라 `read_skill`을 호출합니다.

**기본 대화 예시:**
- **엔지니어링 규율 초기화**: "`session-start` 프롬프트 적용해줘" (Superpowers 규칙 및 환경 주입)
- **사용 가능한 스킬 목록 확인**: "모든 superpowers 스킬을 나열해줘"
- **단일 스킬 로드**: "`read_skill`로 `brainstorming` 스킬을 읽고 요구사항을 분석해줘"

---

## ⚡ 타겟 지정형 원클릭 설정 (Targeted One-Click Setup)

불필요한 환경 수정을 방지하고 필요한 클라이언트에만 안전하게 도입할 수 있도록, **명시적인 타겟 지정과 개인정보/환경 보호를 최우선**으로 하는 원클릭 설정 도구를 제공합니다.

> [!NOTE]
> **모든 디렉터리에서 바로 실행 가능**: 이 저장소를 복제(clone)하거나 특정 폴더로 이동할 필요가 없습니다. 터미널의 **어느 위치에서나** 바로 아래 명령어를 실행할 수 있습니다. 설치 도구가 사용자 홈 디렉터리(`~`)를 기준으로 전역 설정 파일을 자동 탐지하여 모든 작업 공간에서 즉시 활성화합니다.

데스크톱 빠른 설정: [LM Studio, Roo Code, ChatWise, Cherry Studio](docs/desktop-setup.md). 새 CLI 옵션은 아직 npm에 배포되지 않았습니다. 배포 전에는 가이드의 로컬 명령을 사용하세요.

> [!TIP]
> **투명성 및 환경 보호 원칙**: Superpowers MCP는 악성코드처럼 선택되지 않은 다른 에디터를 임의로 스캔하거나 일괄 수정하지 않습니다. 사용 중인 AI 클라이언트 전용 명령어를 실행하기만 하면, **원자적 쓰기(Atomic Swap) 기술**을 통해 설정을 안전하게 병합합니다 (충돌 시 손상 제로, **기본적으로 불필요한 `.bak` 쓰레기 파일을 남기지 않는 클린 사양**, 기존 다른 MCP 서버 무영향).

### 1. 사용 중인 AI Agent / 에디터 선택 (원클릭 정밀 설정)

사용 중인 클라이언트에 맞춰 터미널에서 해당 명령어를 실행하세요:

| Harness / 클라이언트 | 지원 OS | 원클릭 설정 명령어 | 기본 설정 파일 경로 |
| :--- | :--- | :--- | :--- |
| **LM Studio** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target lmstudio` | `~/.lmstudio/mcp.json` |
| **Roo Code (VS Code Desktop)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target roo` | `.../rooveterinaryinc.roo-cline/settings/mcp_settings.json` |
| **Antigravity (Google DeepMind)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target antigravity` | `~/.gemini/config/mcp_config.json` |
| **Pi Desktop / Pi Agent** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target pi-desktop` | `~/.pi/agent/mcp.json` |
| **Cursor** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target cursor` | `~/.cursor/mcp.json` |
| **GitHub Copilot (VS Code)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target copilot` | `Code/User/mcp.json` *(VS Code `servers` 형식)* |
| **GitHub Copilot (VS Code Insiders)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target copilot-insiders` | `Code - Insiders/User/mcp.json` *(VS Code `servers` 형식)* |
| **Hermes Desktop / Agent** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target hermes` | `~/.hermes/config.yaml` *(Win: `%LOCALAPPDATA%\hermes`)* |
| **Kimi Work / Kimi Code** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target kimi` | `~/.kimi-code/mcp.json` |
| **Claude Desktop** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target claude` | `Claude/claude_desktop_config.json` |
| **Devin Desktop (구 Windsurf)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target devin` | `~/.config/devin/mcp_config.json` *(또는 `windsurf`)* |
| **QwenPaw (개인 AI 워크스테이션)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target qwenpaw` | `~/.qwenpaw/config.json` *(별칭: `copaw`)* |
| **Cline (VS Code / CLI)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target cline` | `.../saoudrizwan.claude-dev/settings/cline_mcp_settings.json` |
| **Kilo Code** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target kilo` | `~/.config/kilo/kilo.jsonc` *(적응형 `mcp` 규격)* |
| **Qoder** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target qoder` | `~/.qoder/settings.json` |
| **Kiro** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target kiro` | `~/.kiro/settings/mcp.json` |
| **Trae** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target trae` | `.../Trae/User/mcp.json` *(Trae CN 지원)* |

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

여러 단계의 복잡한 작업에는 아래 **대화형 워크플로 런처**를 사용하세요. 설계, 계획 검토, 브랜치 마무리 단계에서 사용자 결정을 기다리므로 서버 측 무인 자동화가 아닙니다(상세: [`docs/skill-compositions.ko.md`](docs/skill-compositions.ko.md)).

### 1. 엔드투엔드 새 기능 개발 파이프라인 (Feature Development Pipeline)
```
brainstorming ➔ writing-plans ➔ using-git-worktrees ➔ subagent-driven-development (TDD) ➔ verification-before-completion ➔ requesting-code-review ➔ finishing-a-development-branch
```
- **시작 방법:** MCP Prompts 메뉴에서 `feature-pipeline`을 선택하고 필수 `feature_name`과 선택적 `requirements`를 입력합니다.
- **특징:** 요구사항 확인 (Spec) ➔ 작업 분해 (Plan) ➔ Worktree 격리 ➔ 독립 서브에이전트 + TDD 구현 ➔ 전체 테스트 검증 ➔ 대립 코드 리뷰 ➔ 브랜치 마무리.

### 2. 구조화된 문제 해결 파이프라인 (Structured Troubleshooting Pipeline)
```
systematic-debugging ➔ using-git-worktrees ➔ dispatching-parallel-agents ➔ test-driven-development ➔ verification-before-completion ➔ requesting-code-review ➔ finishing-a-development-branch
```
- **시작 방법:** MCP Prompts 메뉴에서 `structured-debug`를 선택하고 문제 또는 실패 테스트를 입력합니다.
- **특징:** 근본 원인 가설 분해 ➔ Worktree 격리 병렬 조사 ➔ 다중 에이전트 검증 ➔ 실패 테스트 작성 및 수정 ➔ 완전한 회귀 검증 ➔ 리뷰 지적 해결 ➔ 브랜치 마무리.

### 3. 동적 워크플로우 가이드 (Dynamic Workflow Guide)
- **시작 방법:** `skill-composition`을 선택해 리팩터링, 마이그레이션, 레거시 코드용 권장 흐름을 확인합니다. 현재 이 시나리오에는 전용 런처 prompt가 없습니다.
- **특징:** 대규모 리팩토링, 레거시 시스템 안전망 구축, 온보딩에 맞는 최적의 파이프라인을 동적으로 추천:
  - **대규모 리팩토링 및 마이그레이션 (Pipeline 3):** `brainstorming` ➔ `writing-plans (skeleton-first)` ➔ `using-git-worktrees` ➔ `subagent-driven-development` ➔ `verification-before-completion` ➔ `requesting-code-review` ➔ `finishing-a-development-branch`
  - **레거시 코드베이스 안전망 (Pipeline 4):** `brainstorming` ➔ `writing-plans` ➔ `test-driven-development (characterization)` ➔ `systematic-debugging` ➔ `verification-before-completion`


---

## 📋 지원되는 스킬 총람 (15대 핵심 스킬 및 추천 시나리오)

상황에 맞는 스킬을 신속하게 선택할 수 있도록, 15개의 스킬을 소프트웨어 개발 라이프사이클(SDLC)에 맞추어 분류하고 주요 역할과 커뮤니티 권장 시나리오를 하나로 통합했습니다:

| # | 개발 단계 (Phase) | 스킬 이름 (Skill Name) | 역할 및 핵심 가치 (Purpose & Core Value) | 추천 사용 시나리오 (Recommended Scenario) |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **🚀 계획 및 설계** | **`brainstorming`** | **요구사항 명확화 및 설계 탐색**：코드 작성 전 아키텍처 방안과 제약을 명확히 하고 스펙을 산출. Visual Companion 브라우저 UI 검토 지원. | 새 기능이나 대규모 변경을 시작하기 전, AI가 바로 코딩하는 것을 방지. |
| 2 | **🚀 계획 및 설계** | **`writing-plans`** | **구현 계획 분해**：스펙을 독립 검증 가능한 작업 목록으로 분해하고 Recommended Skill 및 파일 계약 명시. | 여러 파일 리팩토링이나 복잡한 마이그레이션 전 명확한 청사진 수립. |
| 3 | **💻 구현 및 개발** | **`executing-plans`** | **세션 내 계획 순차 실행**：현재 세션에서 모든 작업을 단계별로 실행한 뒤 마지막에 브랜치 전체를 한 번 검토. | 서브에이전트를 생성하지 않고 동일 세션 내에서 순차적으로 계획을 실행할 때. |
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
| 15 | **🤖 고급 에이전트 제어** | **`diagnosing-superpowers`** | **세션 포렌식 및 버그 리포트**：디스크의 트랜스크립트에서 문제 경위를 증거와 함께 재구성하고, 스크럽된 번들과 GitHub 이슈 초안을 작성. | 세션이 어긋난 원인을 증거로 규명하거나 Superpowers 메인테이너에게 버그를 보고할 때. |

## 🆕 최근 업데이트

### v6.4.2 (최신)

- **v6.4.2 보안 감사 및 코드 리뷰 (2026-09-24)**: MCP 서버, 설정 스크립트, 빌드 파이프라인, 테스트 하네스의 감사 지적 사항을 수정했습니다(자세한 내용은 [SECURITY.md](SECURITY.md)).
  - **경로 탐색 및 오류 위생**: 스킬 이름을 허용 목록 검증 *전*에 디코드하여 이중 인코딩된 `..%2f` / `%2e%2e` 페이로드를 `InvalidParams`로 거부합니다. 미지의 도구와 프롬프트도 `MethodNotFound` 대신 실행 가능한 `InvalidParams` 오류를 반환합니다.
  - **TOCTOU 및 파괴적 경로 방어**: 심볼릭 링크 검사 후 canonical path 재검증, 캐시 정리를 복사 매니페스트로 게이트(포크 전용 스킬은 절대 삭제되지 않음), drift/coverage 기록은 임시 파일 + rename으로 원자적으로 기록.
  - **경쟁 없는 빌드와 소프트 페일 동기화**: `out/setup.js` 빌드는 배타적 잠금 + mtime 신선도 재확인, watch 모드 출력에 chmod 적용, 업스트림 소스 누락 시 오탐 drift 없이 정상 종료.
  - **정직한 테스트 하네스**: watchdog에 ref와 서버 `exit`/`close` 핸들러로 조용한 종료 차단, drift 테스트는 네트워크 차단 하에 실행, 권한 제한 skip은 합격으로 집계되지 않음 — 회귀 기준선은 **365/365** 어서션 유지.

### v6.4.1

- **상류 obra/superpowers v6.4.1 동기화**:
  - **네이티브 인라인 실행**: 새로 작성된 `executing-plans`가 신규 `task-start` / `task-done`으로 전체 계획을 실행한 뒤 브랜치 전체를 한 번만 리뷰(중간 체크인 없음).
  - **신규 스킬 `diagnosing-superpowers`**: 디스크 기록에서 증거와 함께 세션을 감식하고 스크럽된 번들과 GitHub 이슈 초안 작성(총 15개 스킬).
  - **리뷰 동작**: 미정의 동작은 합리적 사용자 기대로 평가, `Declined to judge` 목록, `BASE_SHA`는 `git merge-base origin/main HEAD` 사용.
  - **계획 Review Focus**: 스펙이 시사하는 엣지 케이스를 담당 태스크에 연결하는 신규 템플릿 섹션과 셀프 리뷰 항목.
  - **신규 하네스 참조**: Muse 및 Claude Code 도구 매핑; Devin / OpenCode 참조 유지.
  - 스크립트는 인터프리터(`bash` / `node`) 경유 호출로 마켓플레이스 패키징의 실행 비트 손상에 내성 확보.
- **Windows 대응 및 회귀 플로어**:
  - 신규 `task-start.ps1` / `task-done.ps1`과 sh/ps1 대칭 테스트 스위트.
  - 채택된 PR 내구성 콘텐츠 전부 유지(Discoveries 원장, 리뷰 파일 계약, greenfield 스크립트, 원격 안전 경계); drift 베이스라인 재기록, 잔여 차이 없음.
- **포괄적인 보안 감사 및 자동화 회귀 테스트 기준선** ([`SECURITY.md`](SECURITY.md)):
  - 전체 스위트 **365개 자동 어서션**(Node.js: 170, Bash: 67, PowerShell: 128) 100% 통과, 취약점 0건, 기밀 유출 0건 확인.
  - 인라인 `task-done`은 운영자가 지정한 테스트를 argv로 실행(`"$@"` / `& $exe @rest`)하며 셸로 재해석하지 않음. 원장 기록은 표시 전용.
  - `diagnosing-superpowers`는 로컬 읽기만 수행하고 내보내기는 상대 승인 후. 스크럽은 최선을 다하는 수준이므로 공유 전 반드시 검토.
  - 지연 findings 내보내기는 `Final: minor (deferred):`를 포함하며 완료 줄의 parked 건수에는 일치하지 않음.
  - 로컬 Devin 설정(`.devin/`)은 gitignore됨.

### v6.3.10

- **유니버설 글로벌 설정 엔진 키 충돌 해소 및 사용자 설정 무손실 보존**:
  - 기존의 `servers`, `mcp`, `mcpServers`를 자동 감지하여 서로 다른 AI Client 환경에서 중복되거나 모순되는 설정 블록이 생성되는 것을 방지.
  - 재설치 시에도 사용자가 직접 구성한 `env`, `cwd`, `disabled`, `alwaysAllow` 등의 필드를 안전하게 병합하고 무손실 보존.
  - `disabled: true`와 `enabled: true`가 동시에 공존하는 모순 상태를 원천 차단.
  - 명령행 인수를 엄격하게 검증하여 예기치 않은 위치 인수를 거부(종료 코드 1). 프로세스 종료를 `process.exitCode`로 표준화하여 Unix 파이프라인에서 비동기 I/O 잘림 방지.
- **핵심 스킬 엔진 단일 Stat 스냅샷 검증 및 세대 격리**:
  - 단일 `fs.stat` 스냅샷 비교(`dev`, `ino`, `size`, `mtimeMs`)를 도입하여 심볼릭 링크나 파일이 교체된 경우 전체 디렉터리 재탐색 없이 즉시 캐시를 무효화.
  - `clearCache()`에서 단조 증가하는 `scanEpoch`를 전진시키고 `loadingEpoch`를 리셋하여 지연된 비동기 스캔이 캐시 리셋 후 최신 상태를 오염시키는 것을 방지.
  - 열려 있는 디스크립터의 Inode 검증(`readFileNoFollow`)을 통해 TOCTOU 디스크립터 교체 경쟁 조건 제거.
- **MCP Prompt 템플릿 견고성 및 중복 인수 추가 방어**:
  - 템플릿 파일이 비어 있거나 누락된 경우 구조화된 `stderr` 진단을 출력하고 표준 `McpError(ErrorCode.InternalError)`를 발생시킴.
  - `appliedInterpolations`를 통해 치환된 템플릿 플레이스홀더를 추적하여 불필요한 레거시 인수 중복 추가 방지.
- **포괄적인 보안 감사 및 자동화 회귀 테스트 기준선**:
  - 전체 스위트 **292개 자동 어서션**(Node.js: 163, Bash: 35, PowerShell: 94) 100% 통과, 취약점 0건, 기밀 유출 0건 확인.

### v6.3.9

- **영구적인 ReDoS 방어 (CodeQL Alert #4 해결)**:
  - YAML 파싱(`updateYamlConfig`)의 다항식 역추적 정규식을 모호하지 않은 접두사 일치와 네이티브 `String.prototype.trim()`으로 대체.
  - `extractInlineComment` 선형 스캐너($O(N)$)를 도입하여 긴 공백 입력 시의 역추적을 차단. GitHub CodeQL Alert #4(`js/polynomial-redos`) 공식 해결 확인.
  - `tests/setup_test.js`에 60,000자 공백 패딩 스트레스 테스트를 추가하여 선형 처리 시간(<1ms) 보장.
- **클라이언트 에코시스템 확장 (17개 AI Agent 클라이언트 지원)**:
  - **LM Studio**(`lmstudio`, `~/.lmstudio/mcp.json`) 및 VS Code Desktop용 **Roo Code**(`roo`, `rooveterinaryinc.roo-cline/settings/mcp_settings.json`) 설정 타깃 추가.
  - YAML 파서 강화로 `mcp_servers:` 및 `superpowers:` 선언의 인라인 주석 및 헤더 주석 보존.
- **데스크톱용 안전한 설정 내보내기 및 종료 코드 무결성**:
  - `setup --print-config`(`--bun` 지원) 옵션을 추가하여 ChatWise, Cherry Studio 등 데스크톱 클라이언트에서 부작용 없이 임포트할 수 있는 JSON 출력.
  - `src/server.ts`의 setup 위임 처리에서 `process.exitCode`를 보존하여 비정상 종료 코드가 0으로 덮어씌워지지 않도록 수정.
- **데스크톱 설정 가이드**:
  - LM Studio, Roo Code, ChatWise, Cherry Studio의 상세 설정 지침을 담은 [`docs/desktop-setup.md`](docs/desktop-setup.md) 추가.

👉 *이전 버전의 전체 릴리스 내역은 [CHANGELOG.md](CHANGELOG.md)를 참조하세요.*

---

## 🙏 감사의 말

이 프로젝트는 [obra](https://github.com/obra)의 원본 [Superpowers](https://github.com/obra/superpowers) 프로젝트의 포크 및 각색입니다. 이 MCP 서버의 기반이 되는 에이전틱 스킬 프레임워크와 소프트웨어 엔지니어링 워크플로우를 정의해 준 그들의 선구적인 작업에 감사드립니다.
