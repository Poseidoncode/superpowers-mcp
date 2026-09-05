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

## 🛠️ MCP 구성

다음 설정을 IDE 또는 MCP 클라이언트(예: Cursor, Antigravity, VSCode, AnythingLLM 등)의 MCP 설정에 추가하세요.

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

## 🙏 감사의 말

이 프로젝트는 [obra](https://github.com/obra)의 원본 [Superpowers](https://github.com/obra/superpowers) 프로젝트의 포크 및 각색입니다. 이 MCP 서버의 기반이 되는 에이전틱 스킬 프레임워크와 소프트웨어 엔지니어링 워크플로우를 정의해 준 그들의 선구적인 작업에 감사드립니다.
