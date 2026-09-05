# Superpowers MCP Toolpack 사용 가이드

[English](README.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

[![Version](https://img.shields.io/badge/version-6.3.3-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

이 문서는 Superpowers 스킬 라이브러리와 자율 에이전트 워크플로우를 독립적이고 고성능이며 안전한 **Model Context Protocol (MCP)** 서버로 패키징한 사용 지침을 요약한 것입니다.

---

## 🚀 설치 및 사용 방법

### 지원 환경 및 에이전트 플랫폼

- **MCP 네이티브 AI 편집기 & IDE**: **Antigravity (AGY)**, **Cursor**, **VSCode**, **Windsurf**, **Claude Desktop / Claude Code**.
- **CLI 도구 & 자율 에이전트**: **Devin CLI**, **Hermes Agent**, **OpenCode**, **Kimi CLI**, **Pi CLI**, **Gemini CLI**.

### 제공되는 MCP 프로토콜 기능

| 프로토콜 기능 | 포함 항목 | 설명 |
| :--- | :--- | :--- |
| **Tools** | `list_skills`, `read_skill` | 14개의 Superpowers 스킬을 온디맨드로 검색 및 로드합니다. |
| **Prompts** | `session-start`, `sdd-implementer`, `sdd-task-reviewer`, `sdd-re-review`, `spec-reviewer`, `plan-reviewer` | IDE 프롬프트 목록에서 즉시 사용할 수 있는 대립 검토 및 서브에이전트 조율 프롬프트. |
| **Resources** | `skill://superpowers/<skill-name>` | MCP 규격에 맞는 URI 기반 스킬 직접 접근. |

### AI 에이전트와 대화하기

설치 또는 구성이 완료되면 AI 에이전트가 `Superpowers Skills` 및 `Prompts`를 자동으로 인식하고 호출할 수 있습니다.

**질문 예시:**

- "모든 superpowers 스킬을 나열해줘"
- "read_skill을 사용하여 brainstorming 스킬을 읽고, 이 기능의 구현을 분석해줘"
- "session-start 프롬프트를 적용해줘" (Superpowers 전체 워크플로우 컨텍스트 초기화)
- "subagent-driven-development로 docs/plans/feature-plan.md 계획을 실행해줘"

---

## 🛠️ MCP 구성

다음 설정을 IDE(Cursor, Antigravity 또는 VSCode MCP 설정 등)에 추가하세요.

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

## 💡 일반적인 스킬 및 시나리오

| 스킬 이름 | 권장 시나리오 | 핵심 가치 |
| :--- | :--- | :--- |
| `brainstorming` | 새 기능을 시작하기 전, 요구사항 및 설계 탐색 | AI가 바로 코드를 작성하기 시작하는 것을 방지 |
| `writing-plans` | 여러 파일 리팩토링이나 복잡한 마이그레이션 전 | 명확한 실행 청사진 수립 |
| `systematic-debugging` | 오류나 비정상 동작을 발견했을 때 | 추측 대신 "근본 원인 분석" 강제 |
| `test-driven-development` | 논리적으로 어려운 기능을 구현할 때 | 코드에 테스트가 수반되도록 보장 (Red-Green-Refactor) |
| `verification-before-completion` | "고쳤다" 또는 "완료했다"고 말하기 전 | 증거 기반 완료 확인 |

---

## 🔄 권장 프롬프트 시퀀스

### 1. 새 기능 개발 시퀀스
1. "read_skill로 brainstorming 스킬을 읽고 요구사항과 아키텍처를 확인해줘"
2. "read_skill로 writing-plans 스킬을 읽고 구체적인 단계가 있는 실행 계획을 만들어줘"
3. "read_skill로 test-driven-development 스킬을 읽고 테스트와 함께 기능을 구현해줘"
4. "read_skill로 verification-before-completion 스킬을 읽고 테스트 스위트를 실행하여 모든 것이 작동하는지 확인해줘"

### 2. 긴급 핫픽스 시퀀스
1. "read_skill로 systematic-debugging 스킬을 읽고 현재 문제의 근본 원인을 찾아줘"
2. "read_skill로 test-driven-development 스킬을 읽고 버그에 대한 실패 테스트를 작성하고 수정해줘"
3. "read_skill로 verification-before-completion 스킬을 읽고 적용된 핫픽스를 검증해줘"

---

## 📋 지원되는 스킬 개요 (총 14개)

올바른 스킬을 선택할 수 있도록 소프트웨어 개발의 6가지 논리적 단계로 분류했습니다.

### 🚀 1. 계획 및 설계
- `brainstorming`: 소프트웨어 설계 및 요구사항 분석 프로세스
  - 브라우저 기반 목업 및 디자인 리뷰를 위한 Visual Companion (적시 제공)
- `writing-plans`: 상세한 구현 계획 수립

### 💻 2. 구현 및 디버깅
- `executing-plans`: 생성된 구현 계획 실행
- `test-driven-development`: TDD(테스트 주도 개발) 워크플로우
- `systematic-debugging`: 체계적인 디버깅 및 근본 원인 분석

### 🛡️ 3. 품질 및 리뷰
- `verification-before-completion`: 완료 전 증거 기반 검증
- `requesting-code-review`: 코드 리뷰를 위한 사전 점검 시작
- `receiving-code-review`: 코드 리뷰 피드백 수신 및 대응
- `finishing-a-development-branch`: 기능 브랜치 마무리 및 통합

### 🌿 4. 버전 관리
- `using-git-worktrees`: Git Worktrees를 사용한 여러 브랜치 관리

### 🤖 5. 고급 에이전트 제어

이러한 스킬은 지원되는 IDE(Antigravity 또는 Cursor 등) 내에서 복잡한 메타 실행 패턴을 오케스트레이션하기 위해 설계되었습니다.

- **`subagent-driven-development`**: 서브에이전트를 구동하여 작업 실행
  - **사용법**: 미리 정의된 계획을 작업별로 실행합니다. 시스템은 각 작업마다 새로운 "구현" 서브에이전트를 생성한 후, 통합된 **작업 리뷰어**(명세 준수 + 코드 품질) 서브에이전트와 마지막에 **전체 브랜치 최종 리뷰**를 실행합니다. **Pre-Flight Plan Review**는 실행 시작 전 작업 충돌을 스캔합니다. 계획은 plan-scoped 워크스페이스(`.superpowers/sdd/<plan>/`)에서 실행되며, 컨트롤러는 멈추지 않고 충돌을 재결정하여 레저(ledger)에 기록(rulings)하고, 같은 형태의 작은 작업은 단일 디스패치로 배치 처리됩니다.
  - **모델 선택**: 작업 복잡성에 따라 서브에이전트 모델 선택 — 기계적인 작업에는 저비용 모델, 아키텍처 및 미묘한 동시성 변경에는 고성능 모델
  - **예시**: "subagent-driven-development 스킬을 읽고 docs/plans/feature-plan.md에 나열된 작업을 하나씩 실행해줘"
- **`dispatching-parallel-agents`**: 작업을 병렬 에이전트에 할당
  - **사용법**: 여러 *독립적인* 문제(예: 3개의 관련 없는 실패 테스트 또는 3개의 별도 웹 연구 주제)를 처리하는 데 사용됩니다. AI는 병렬 실행 마인드셋을 채택하여 상태를 교차하거나 컨텍스트 오염을 겪지 않고 각 작업을 독립적으로 처리하여 출력 생성을 크게 가속화합니다.
  - **디버깅 예시**: "dispatching-parallel-agents 스킬을 읽고 3개의 병렬 에이전트를 할당하여 독립적으로 실패하는 테스트 A, B, C를 각각 조사해줘"
  - **연구 예시**: "dispatching-parallel-agents 스킬을 읽고 React 19 기능, Vue 3.5 업데이트, Svelte 5 Runes에 대해 웹을 병렬 검색하고 — 각각 독립적으로 요약해줘"

### ⚙️ 6. 사용자 정의 및 메타
- `using-superpowers`: Superpowers 사용을 위한 지침 및 자체 점검
- `writing-skills`: 새로운 사용자 정의 스킬 작성 및 확장

---

## 🆕 최근 업데이트

### v6.3.3 (최신)

- **MCP 표준 프롬프트 지원 (`src/server.ts`)**:
  - 표준 프롬프트 핸들러를 구현하여 IDE 프롬프트 선택기에서 사용할 수 있는 6개의 프롬프트(`session-start`, `sdd-implementer`, `sdd-task-reviewer`, `sdd-re-review`, `spec-reviewer`, `plan-reviewer`) 등록.
- **멀티 하네스 참조 매핑**:
  - Devin CLI([`references/devin-tools.md`](skills/using-superpowers/references/devin-tools.md)) 및 OpenCode([`references/opencode-tools.md`](skills/using-superpowers/references/opencode-tools.md))용 네이티브 도구 매핑 추가.
- **다국어 문서 동기화**:
  - 모든 언어의 README에서 MCP 기능 지원 표(Tools / Prompts / Resources) 및 멀티 하네스 지원 매트릭스 통일.
- **테스트 스위트 확장**:
  - `prompts/list` 및 `prompts/get` 매개변수 주입에 대한 자동화 테스트 어서션 추가.

### v6.3.2

- **writing-plans — 2가지 계획 형태(Two Plan Shapes)와 스켈레톤 우선(Skeleton-First)**:
  - `skills/writing-plans/SKILL.md`에 **Two Plan Shapes** 라우터를 추가(`task-by-task` 기본값 vs `skeleton-first` 대안).
  - 새 [`skills/writing-plans/skeleton-first-plans.md`](skills/writing-plans/skeleton-first-plans.md)에서 Walking Skeleton(Task 1에서 전체 하위 시스템을 얇게 관통하는 실행 슬라이스 구축), 계약 기반 작업(Task Contracts, 코드 스크립트 대신 엄격한 Consumes/Produces 인터페이스 및 관찰 가능한 성공 기준 명시), `Tier: mechanical | judgment` 태그 정의.
- **subagent-driven-development (SDD) — 웨이브 디스패치(Wave Dispatch) 및 병렬 Worktree 프로토콜**:
  - skeleton-first 계획에 대해 **DISPATCH PLAN**을 생성하여 파일 충돌이 없는 작업을 웨이브 단위로 병렬 디스패치.
  - **병렬 Worktree 프로토콜(Parallel Worktree Protocol)**: 독립된 `.worktrees/task-<N>`에서 동시 작업을 실행하고 계획 순서대로 순차 병합. 충돌 시 자동 rebase 후 implementer를 재개하여 자체 해결.
  - Step 5에 완료 후 `Plan holds` / `Amendment:` 점검 라인을 추가하여 진행 중인 작업의 무결성을 유지하면서 후속 작업에 변경된 계약 전파.
- **SDD — Tier 기반 모델 디스패치**:
  - SDD 디스패처 및 `implementer-prompt.md`가 `Tier:` 지정(`mechanical` → 경제적인 경량 모델, `judgment` → 표준 모델)을 즉시 적용하여 토큰 낭비 방지.
- **writing-skills — 바이너리 실행 보안 강화(`render-graphs.js`)**:
  - `execSync` 대신 `execFileSync('dot', ['-Tsvg'], ...)`로 전환하여 쉘 인젝션 위험 근절. 10MB 버퍼 제한, Windows CRLF(`\r?\n`) 호환 및 `winget` 설치 안내 추가.
- **테스트 및 검증**: MCP 프로토콜, 보안, SDD Bash(11개 어서션), PowerShell(70개 어서션), Graphviz 렌더링 테스트 100% 통과.

👉 *이전 버전의 전체 릴리스 내역은 [CHANGELOG.md](CHANGELOG.md)를 참조하세요.*

---

## 🙏 감사의 말

이 프로젝트는 [obra](https://github.com/obra)의 원본 [Superpowers](https://github.com/obra/superpowers) 프로젝트의 포크 및 각색입니다. 이 MCP 서버의 기반이 되는 에이전틱 스킬 프레임워크와 소프트웨어 개발 방법론을 정의해 준 그들의 작업에 감사드립니다.
