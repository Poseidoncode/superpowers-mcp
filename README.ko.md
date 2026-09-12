# Superpowers MCP Toolpack 사용 가이드

[English](README.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

[![Version](https://img.shields.io/badge/version-6.3.8-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
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

## 프로젝트 계보

이 프로젝트는 [`obra/superpowers`](https://github.com/obra/superpowers)의 스킬 콘텐츠를 검토한 후 가져옵니다. 동기화 절차는 유지관리자용 [업스트림 동기화 가이드](docs/maintainers/upstream-sync.md)를 참조하세요.

## 🆕 최근 업데이트

### v6.3.8 (최신)

- **유니버설 글로벌 설정 엔진 동시성 안전, Inode 방어 및 심볼릭 링크 탈출 격리**:
  - **Allowed Roots 경계 격리**: 설정 파일 대상을 사용자가 명시한 허용 루트(`homeDir`, `appData`, `localAppData`) 내부로 제한하여 상위 디렉터리 심볼릭 링크 탈출 공격 차단.
  - **낙관적 동시성 충돌 감지**: 원자적 `fs.renameSync` 직전에 디스크 내용과 `expectedContent`를 대조하여 다중 프로세스 경쟁으로 인한 최신 설정 덮어쓰기 방지.
  - **디렉터리 Inode & Dev TOCTOU 방어**: 임시 파일 작성 전후로 디렉터리의 디바이스 ID와 inode를 검증하여 디렉터리 교체 공격 차단.
  - **Fail-Closed 엄격 구문 분석**: JSON 루트 또는 서버 필드가 Plain Object가 아닐 경우 즉시 거부하여 프로토타입 오염 방지.
- **핵심 스킬 엔진 결정론적 정렬 및 동적 캐시 재검증**:
  - **결정론적 디렉터리 색인 및 충돌 방어**: 디렉터리를 알파벳순으로 정렬하고 충돌 키를 즉시 감지하여 안전하게 중복 건너뛰기.
  - **자동 캐시 재검증 (`CACHE_REVALIDATE_MS = 1000`)**: 디스크 변경 사항을 1초 내에 자동 감지하여 서버 재시작 없이 편집 내용 반영.
  - **대소문자 폴딩 및 정규 경로 방어**: `src/server.ts`가 darwin/win32에서 대소문자 폴딩과 `fs.realpathSync`를 수행하여 시스템 보호 디렉터리 접근 원천 차단.
- **RFC 6455 WebSocket 프로토콜 강화 및 복원력 있는 로그 압축**:
  - `CONTINUATION` (0x00) 분할 메시지 재조합 완전 지원, 제어 프레임 분할 금지(`opcode >= 0x8 && !fin`) 및 비표준 RSV 확장 엄격 차단.
  - 후미 탄력적 로그 압축: 이벤트 로그가 1 MB 한도에 도달하면 개행 정렬된 최근 레코드를 보존하여 전체 손실 방지.
  - 비공개 파일 디스크립터를 `O_RDWR | O_APPEND | O_CREAT | O_NOFOLLOW`로 안전하게 열기.
- **Shell 및 PowerShell 스크립트 명령 주입 방어**:
  - `find-polluter.sh` 및 `find-polluter.ps1`: 배열 전개 인자 전달 (`"${TEST_COMMAND[@]}"`, `& $testCommand @testCommandArgs`)과 공백 안전 읽기 루프로 셸 주입 원천 차단.
  - `sdd-workspace`: `cd` 실행 전 `CDPATH=''`를 재설정하여 환경 변수를 통한 디렉터리 탈취 차단.
  - `sdd-workspace.ps1`: BOM 없는 UTF-8(`[System.Text.UTF8Encoding]::new($false)`)로 플랜 마커를 저장하여 Unicode 경로 정합성 유지.
- **프로젝트 계보 및 유지관리자 지침 분리**:
  - 업스트림 동기화 절차를 [`docs/maintainers/upstream-sync.md`](docs/maintainers/upstream-sync.md)로 분리하여 루트 문서 정리.
- **전체 자동 회귀 테스트 기준선**:
  - 테스트 스위트를 **274개 자동 어서션**(Node.js: 145, Bash: 35, PowerShell: 94)으로 확장하고 100% 통과율 유지.

### v6.3.7

- **업스트림 동기화 — 배치 1~3 (obra/superpowers)**:
  - **스킬 자동 라우팅**: `systematic-debugging`과 `test-driven-development` 설명에 트리거 문구(`"tdd"`, `"systematic debug"` 등)와 상호 크로스 라우트를 추가하여 MCP 클라이언트의 스킬 선택 정확도를 향상.
  - **테스트 명령이 없을 때의 증거 규율**: `verification-before-completion`에 "When There Is No Test Command" 섹션 추가. 보고서, 연구, 감사, 서신 작업은 산출물을 다시 열어 증명 가능한 것을 증명하고 미완료 항목을 명시해야 하며, "완전함"만 주장할 수 있고 "정확함"은 주장할 수 없음.
  - **브레인스토밍 의도 게이트**: "Establish Shared Understanding"(의도 탐색 → 이해 되쓰기 → 설계 반영) 신설 및 HARD-GATE를 경로별 전제 조건 목록으로 재작성. 한 번의 승인을 나머지 단계 생략 허가로 해석하는 것을 금지.
  - **플래닝 핸드오프 리뷰**: brainstorming의 스펙 셀프 리뷰를 0.0–9.9 평가 + burden ledger + 단일 유계 개선 패스 + 읽기 전용 재평가로 승격. 실패 시 초안을 복원하는 안전 규칙 포함.
  - **저장된 계획 검토 및 상황별 핸드오프**: `writing-plans`는 실행 전에 사람이 저장된 계획을 검토하도록 요구하며, 실행 방식이 지정되지 않은 경우 고정 기본값 대신 이 계획에 맞는 추천을 제시.
  - **계획 체크박스 기록**: `executing-plans`와 `subagent-driven-development`가 완료 메시지와 동시에 계획 파일의 단계를 체크.
  - **원격 안전 경계**: `using-git-worktrees`는 공유 ref에서 분기할 때 `--no-track`을 필수로 요구하고 `git branch -vv` 추적 점검(첫 커밋 전 `--unset-upstream`)을 수행한다. `executing-plans`는 커밋을 로컬로 유지하고 공유 브랜치 재작성을 금지하며, implementer는 작업 중 push 요구를 BLOCKED로 컨트롤러에 보고한다.
  - **Discoveries 원장**: SDD 진행 원장에 `## Discoveries` 섹션을 추가하여 태스크 간 발견이 compaction을 넘어 다음 디스패치의 인터페이스 조항으로 이어진다.
  - **보류 발견 내보내기**: 플랜 워크스페이스 삭제 전에 `Ruling:`／`minor (deferred)`／`parked` 줄을 PR의 "Deferred items" 체크리스트 또는 커밋된 `docs/superpowers/follow-ups/<plan>.md`로 내보낸다.
  - **Greenfield SDD 스크립트**: 리포지토리가 아직 없으면 `sdd-workspace`가 현재 디렉터리로 폴백하고(`.ps1` 동일), `review-package`는 비리포지토리 환경에서 실행 가능한 오류를 반환한다.
  - **TDD 특성화 가드**: 동작 보존 리팩터링을 위한 5단계 절차(변이 → 실패 확인 → VCS 복원 → 그린 유지)를 추가하고 경계·변이 점검 섹션에서 상호 참조한다.
- **업스트림 콘텐츠 동기화 — 배치 4**: brainstorm 시작 스크립트가 `BRAINSTORM_HOST`/`BRAINSTORM_URL_HOST`에서 호스트 기본값을 가져오고(`--host`/`--url-host` 우선), `writing-skills`에 콘텐츠 이동 시 링크 재해석 절차를 추가했으며, SDD 리뷰어가 전체 보고서를 `…/task-N-review.md`에 쓰고 15줄 미만 요약만 반환합니다 — MCP에 `review_file` 인자(요청 경로가 정규화 후 보고서나 brief 파일과 일치하면 파생된 `-review.md`로 대체)와 `[FIX_BASE_SHA]`를 실제로 치환하는 `fix_base_sha` 별칭을 추가.
- **업스트림 드리프트 리포트**: `npm run drift`가 커밋된 베이스라인과 `obra/superpowers`를 비교해 채택된 파일 변경, 로컬에 없는 가져오기, 포크 전용 추가를 나열합니다. `npm run drift:record -- --ignore <skill>`로 검토된 동기화 후 갱신하며, 쓰기 전에 잘린 API tree를 거부합니다.
- **MCP 표면 커버리지 테스트**: 디스크의 모든 스킬은 자신의 콘텐츠를 제공하는 MCP 리소스로 노출되어야 하며, 프롬프트 목록은 4개 README와 정확히 일치해야 합니다.
- **MCP 설명 정합성**: 업스트림의 이스케이프 따옴표 형식을 인용 없는 YAML plain scalar로 적응하여 `SkillsManager`가 MCP로 리터럴 백슬래시를 내보내지 않도록 함.
- **회귀 가드**: `tests/upstream_sync_test.js`를 배치 1~4를 포괄하는 22개 라벨 체크로 확장. 전체 스위트 통과(npm 8개 스위트 139개 체크, PowerShell 90개 어서션, SDD 16 + 호스트 기본 11 + render-graph 8개 bash 어서션).
- **릴리스 준비 강화**: Bash와 PowerShell brainstorm host 테스트가 background 모드를 명시적으로 강제하여 전체 264개 검증이 `CODEX_CI=1`에서도 완료됩니다. `package-lock.json`을 v6.3.7 및 Node `>=18`과 동기화하고 npm repository와 CLI `bin` 메타데이터를 정규화했으며, `npm publish --dry-run`과 패키지 설치 smoke test로 검증했습니다.

### v6.3.6

- **극한의 성능 최적화 (2배~8.1배 가속)**:
  - **스킬 병렬 인덱싱 및 사전 캐싱**: `SkillsManager.listSkills`를 비동기 병렬 디렉토리 탐색(`Promise.all`)과 루트 경로 사전 확인 캐싱으로 업그레이드하여 콜드 스타트 인덱싱 지연 시간을 4.79ms에서 2.35ms로 단축(**2.04배 속도 향상**).
  - **초고속 인메모리 Canonical 캐시**: `readSkillContent`에 물리 실제 경로 기반 Canonical 캐시 및 별칭 매핑을 도입하여 동일 스킬의 반복 읽기 시간을 0.013ms에서 1.6µs로 단축(**8.1배 속도 향상**).
  - **Frontmatter 슬라이싱 및 ReDoS 방어**: `parseFrontmatter`에서 전체 파일 정규식 스캔을 64 KB 접두사 버퍼 슬라이싱으로 대체하여 대용량 파일에서의 GC 일시 중단 및 2차 ReDoS 위험을 원천 차단.
  - **JSON 파싱 초고속 직통 경로**: `stripJsonComments` (`src/setup-runner.ts`)에 네이티브 JSON 파싱 시도를 도입하여 주석 없는 설정 파일 읽기 속도를 0.55µs로 단축(**5.1배 속도 향상**).
  - **멀티 타깃 병렬 번들러**: `esbuild.js`에서 4개 독립 결과물을 `Promise.all`로 병렬 빌드하여 빌드 시간을 ~50ms로 단축(**~42% 속도 향상**).
- **듀얼 Subagent 심층 코드 리뷰 및 결함 전면 보강 (FIX ALL)**:
  - **Partial-Read 버퍼 잘림 방어**: `SkillsManager.readFileNoFollow`에 누적 읽기 루프(`while (totalRead < fileSize)`)를 구현하여 높은 디스크 I/O 또는 가상 파일 시스템 환경에서의 무음 Markdown 잘림 방지.
  - **Scan Epoch 동시성 경쟁 쉴드**: `listSkills`에 단조 증가 `scanEpoch` 카운터를 도입하여 비동기 백그라운드 스캔이 최신 캐시 상태를 덮어쓰는 경쟁 조건 제거.
  - **Canonical 캐시 정합성 보장**: 물리 실제 경로(`realFilePath`)를 마스터 키로 사용하고 `canonicalPathMap`으로 별칭을 추적하여 강제 리로드 시 심볼릭 링크 캐시 드리프트(Cache Drift) 완벽 해결.
  - **시스템 디렉토리 블랙리스트 확장**: `getSafeSkillsPath`에 macOS 고유의 `/private/etc` 및 `/private/var`를 추가하여 특권 디렉토리 경로 탈출 공격 방지.
  - **설정 파일 쓰기 시 심볼릭 링크 대상 검증**: `safeWriteConfig`에서 `fs.lstat` 및 실제 경로 해석을 수행하여 민감한 시스템 영역을 가리키는 심볼릭 링크 쓰기 차단.
  - **엄격한 TypeScript 및 Rule 7 무결점 준수**: 미사용 사장 코드(`exists`)를 완전히 제거하여 `--noUnusedLocals --noUnusedParameters` 통과, 모든 타입 미지정/빈 catch 블록 제거.
- **자동화 회귀 테스트 스위트 확장 및 검증**:
  - 85개 핵심 단위/통합 테스트 및 174개 회귀 어서션 100% 통과(`setup_test.js` 33개 테스트 전체 통과). [`SECURITY.md`](SECURITY.md), [`tests/code_review_report.md`](tests/code_review_report.md), 그리고 [`tests/performance_optimization_report.md`](tests/performance_optimization_report.md) 정비.
- **다국어 문서 동기화**:
  - 모든 언어의 README([`README.md`](README.md), [`README.zh-TW.md`](README.zh-TW.md), [`README.ja.md`](README.ja.md), [`README.ko.md`](README.ko.md))에서 지원 환경 목록, 성능 지표, 원클릭 명령 표 동기화.

👉 *이전 버전의 전체 릴리스 내역은 [CHANGELOG.md](CHANGELOG.md)를 참조하세요.*

---

## 🙏 감사의 말

이 프로젝트는 [obra](https://github.com/obra)의 원본 [Superpowers](https://github.com/obra/superpowers) 프로젝트의 포크 및 각색입니다. 이 MCP 서버의 기반이 되는 에이전틱 스킬 프레임워크와 소프트웨어 엔지니어링 워크플로우를 정의해 준 그들의 선구적인 작업에 감사드립니다.
