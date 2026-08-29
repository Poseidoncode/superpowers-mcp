# Superpowers MCP Toolpack 사용 가이드

[English](README.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

[![Version](https://img.shields.io/badge/version-6.3.2-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
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

### v6.3.2 (최신)

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

### v6.3.1

- **SDD 워크스페이스 소유권 마커 및 물리 경로 정규화**: `sdd-workspace`(Bash) 및 `sdd-workspace.ps1`(PowerShell)은 `plan-path` 마커와 물리 경로 정규화(`pwd -P` 및 동적 `pwd` 감지)를 사용. 동일한 이름의 계획 파일(`docs/alpha/plan.md` 및 `docs/beta/plan.md` 등)이 충돌 없이 별도의 `.superpowers/sdd/` 워크스페이스로 격리됩니다.
- **SDD 리뷰 패키지 범위 가드**: `review-package` 및 `review-package.ps1`은 `git merge-base --is-ancestor BASE HEAD`와 커밋 수를 검증하여 비어 있거나 역전된 범위로 인한 오탐(false-pass)을 방지합니다.
- **실행 권한 상실에 대한 복원력**: `task-brief`와 `review-package`는 `"${BASH:-bash}"`로 명시적 호출하여 아카이브 압축 해제 등으로 `+x` 권限이 손실되어도 정상 동작합니다.
- **TDD 프로젝트 스위트 검증 하한선**: `skills/test-driven-development/SKILL.md`는 작업 완료 선언 전 프로젝트 전체 테스트 명령(`npm test`, `pytest` 등) 실행을 의무화합니다.
- **Code Review 유령 변경 방지**: `skills/requesting-code-review/SKILL.md`에서 다중 커밋의 리뷰 기준점을 `git merge-base origin/main HEAD`로 고정합니다.
- **Brainstorming 툴체인 결정 게이트**: `skills/brainstorming/SKILL.md`의 설계 제시 단계에서 툴체인 설정을 사전에 확인하고 `Global Constraints`에 기록합니다.
- **테스트 확장**: `tests/sdd/test-sdd-workspace.sh`(11개 어서션) 추가 및 PowerShell 스위트(70개 어서션) 확장.

### v6.3.0

- **상류 obra/superpowers v6.3.0 동기화** — 적용 가능한 개선 사항을 모두 채택하고, 포크 고유의 보안 강화와 PowerShell 지원은 유지.
  - **brainstorming — 3경로 라우터**: 모든 요청을 사전에 `spike` / `bounded` / `architectural`로 분류하며, 절차의 양은 작업 규모에 맞춰 조정됩니다. 단 승인 게이트는 모든 경로에 동일하게 적용됩니다. 실행 중 숨은 복잡성이 발견되면 경로를 업그레이드 — 다운그레이드는 없습니다.
  - **subagent-driven-development — 멈추지 않고 재결정(rulings, not stalls)**: 충돌·모호성·계획 결함은 컨트롤러가 직접 재결정하고 레저에 기록(`Ruling: ...`). 명시된 4가지 조건에서만 실행을 중지합니다. Pre-flight 충돌 스캔은 레저 테이블을 산출하고, 같은 형태의 소규모 작업은 단일 디스패치로 배치되며, 서브에이전트 대기는 경계 있는 구간(bounded stretches)을 사용합니다. 세 프롬프트 모두 no-subagents 계약 추가.
  - **Hermes Agent 지원**: 새 `hermes-tools.md` 참조 파일이 스킬 액션을 Hermes 도구(`delegate_task`, `skill_view` 등)에 매핑.
  - **Codex**: V1/V2 멀티에이전트 차이, `followup_task` 수정 라운드 재개, 이벤트 구독형 `wait_agent` 가이드.
  - **writing-plans**: 계획 템플릿에 `Spec:` 필드 추가.
  - **finishing-a-development-branch**: worktree 제거 거부 시 절차 — 임의로 `--force`하지 않음.
- **이중 에이전트 code review 수정**: 병합 경로에서 "Commit them to \<branch\>"를 선택해도 파일이 베이스 브랜치 밖에 남지 않음(finishing-a-development-branch). `sdd-workspace.ps1`의 슬러그 도출은 모든 플랫폼에서 `basename`과 일치(`PLAN.MD`는 `PLAN.MD` 유지).
- **의도적으로 미채택**: 상류 v6.3.0의 서버 단순화(loopback-only 바인딩, `O_NOFOLLOW` 읽기, nonce CSP, 로컬 브랜드 SVG 제거) — 본 패키지는 강화된 서버를 유지합니다. 상류의 `.ps1` 삭제와 plugin-only 재구성도 이 MCP 서버 구성에는 적용되지 않습니다.
- **테스트**: MCP 플로우, render-graphs(8개 어서션), PowerShell 전체 스위트(64개 어서션) 모두 통과.

### v6.2.4

- **업스트림 정렬 — brainstorm 세션 영속화**: `--project-dir` 사용 시 companion이 세션 키를 `.superpowers/brainstorm/.last-token`(소유자 전용, .gitignore 적용)에 저장하고 `.last-port`와 함께 재시작 후에도 재사용합니다 — 이미 열린 브라우저 탭은 재시작 후에도 연결이 유지되며 URL을 다시 공유할 필요가 없습니다. 임시 `/tmp` 세션은 기존처럼 호출마다 키를 교체하며, 명시적 `BRAINSTORM_TOKEN` 환경 변수는 항상 우선하고 파일에 기록되지 않습니다. 강제 교체를 원하면 서버 중지 후 `.last-token`을 삭제하세요.
- **토큰 파일 읽기 경로 강화** (`readPrivateFile`): 심볼릭 링크 또는 다중 링크 `.last-token`은 거부되어 세션 키로 채택되지 않습니다. 읽기는 `O_NOFOLLOW` fd를 통해 수행되고 identity를 재검증하며 0600으로 강화됩니다 — 이미 강화된 쓰기 경로와의 비대칭을 해소했습니다(독립 보안 리뷰에서 발견).
- **진단 가능성**: 토큰 파일 쓰기 실패 시 `Failed to write private token file:`을 로그로 남겨 조용한 키 교체로의 퇴화를 방지합니다.
- **start-server.ps1 환경 위생**: `--project-dir` 없는 임시 실행에서 호출한 pwsh 세션의 잔여 프로젝트 키/포트를 상속하지 않습니다.
- **테스트**: companion 스위트가 31개 assertion으로 — 재시작 간 키 영속화, 사전 시드 파일 준수, 심볼릭 링크 토큰 파일 거부, 토큰 파일 없이도 키 교체 유지. 테스트 정리는 실패 안전(try/finally). PowerShell 스위트는 `.last-token`이 제공된 키와 일치함을 검증합니다.

### v6.2.3 (최신)

- **Brainstorm Visual Companion 강화 (`server.cjs`)**：로컬 loopback 전용 HTTP+WebSocket 서버가 파일시스템 레이스에 안전하게 대응합니다（content 디렉터리 삭제 또는 화면 파일 소실 시 대기 페이지 / 404로 폴백）。watcher는 디렉터리 삭제·재생성 후 자가 치유됩니다（Linux inotify + macOS FSEvents）。WebSocket 핸드셰이크는 RFC 6455로 검증하고, 제어 프레임은 125바이트, idle/partial-frame deadline을 적용하며, 상한 도달 시 가장 오래된 연결을 제거합니다. nonce CSP, 시작별 키 로테이션, 화면·스킬·이벤트 크기 제한, private state 파일을 적용했습니다.
- **`/files/` 이중 `writeHead` 크래시 수정**（subagent 리뷰에서 발견）：헤더 전송 전에 파일을 읽고, `O_NOFOLLOW` + fd 기반 `fstat` + 크기 상한으로 check-then-read TOCTOU 차단.
- **프로세스 수명주기 안전**：`start-server.sh/.ps1`은 시그널 전에 PID가 실제로 이 세션의 brainstorm 서버인지 검증（server-instance-id + cmdline 확인, stop-server와 동일）；`stop-server.sh`는 임시 세션 삭제 전 경로를 정규화하여 `/tmp/../` 트릭으로 임시 루트를 벗어날 수 없음；상대 `--project-dir`는 사전에 절대 경로로 변환；`server-instance-id`는 BOM 없이 기록되어 Windows PowerShell 5.1에서도 셸 간 ID 확인이 동작.
- **SkillsManager 강화**：POSIX에서 `O_NOFOLLOW`로 스킬 파일 읽기（심링크 교체 TOCTOU 차단）；재스캔 실패 시 마지막 양호 캐시 반환（빈 목록으로 오염되지 않음）；연속 점이 포함된 스킬 이름（예: `a..b`）도 검색 가능 — 조회는 Map 전용이며 파일시스템에 닿지 않음.
- **MCP 프로토콜 개선**：리소스 URI의 잘못된 퍼센트 인코딩은 `InvalidRequest` (-32600)를 반환하며 내부 오류를 노출하지 않음.
- **의존성**：검증된 exact override로 `hono` 4.13.0、`@hono/node-server` 2.0.11、`fast-uri` 4.1.2를 고정（관련 권고 해결）。`npm audit`：**0 취약점**.
- **테스트 스위트**：`npm test`는 빌드 후 JavaScript 엣지/보안, MCP 플로우, companion 회귀 스위트를 실행합니다. 63개 assertion PowerShell 스위트는 `tests/powershell/run-tests.sh`로 별도 실행하며 `pwsh`가 없으면 건너뜁니다.
- **독립 리뷰**：시작별 인증 키 로테이션, loopback 전용 HTTP, nonce CSP, bounded read, private state 쓰기, 결정적 크로스플랫폼 테스트로 보안·정확성 지적을 모두 반영했습니다.

### v6.2.2

- **심볼릭 링크 트래버설 방지**: `SkillsManager.readSkillContent()`가 `fs.realpath`로 경로를 정규화한 뒤 경계를 확인하여 심볼릭 링크를 통한 임의 파일 읽기를 방지합니다. `getSafeSkillsPath`도 위험한 시스템 디렉터리 접두사를 차단합니다.
- **호환성 및 프로토콜**: frontmatter와 스킬 콘텐츠의 UTF-8 BOM을 지원하고, 공백이나 특수 문자가 포함된 resource URI에 RFC 3986 인코딩/디코딩을 적용합니다.
- **정확성 및 테스트**: 강제 reload 시 콘텐츠 캐시를 무효화하고 동시 reload 잠금을 안전하게 했습니다. 여러 줄 YAML 설명에서 탭과 공백 들여쓰기를 모두 허용하며, `tests/edge_cases_test.js`가 이러한 보안 및 캐시 동작을 검증합니다.

### v6.2.1

- **PowerShell 스크립트 테스트 스위트**: `sdd-workspace.ps1`, `task-brief.ps1`, `review-package.ps1`, `find-polluter.ps1`, brainstorm `start-server.ps1`/`stop-server.ps1` 수명주기를 대상으로 63개 assertion의 5개 스위트를 `tests/powershell/`에 추가했습니다. `tests/powershell/run-tests.sh`로 실행하며 `pwsh`가 없으면 자동으로 건너뜁니다.
- **`stop-server.ps1` 크로스 플랫폼 수정**: `Get-CimInstance Win32_Process`는 Windows 전용이므로 Unix에서는 `ps`를 사용해 server-id를 올바르게 확인합니다.
- **정리**: 업스트림에서 이미 제거되었고 로컬에서도 참조되지 않던 고아 `skills/using-superpowers/references/copilot-tools.md`를 제거했습니다.

### v6.2.0
- **업스트림 obra/superpowers v6.2.0 동기화**: 로컬 보안 강화와 PowerShell 헬퍼를 유지하면서 모든 스킬에 업스트림 개선 사항을 동기화했습니다.
  - **subagent-driven-development 재구성**: 플랜 단위 워크스페이스(`.superpowers/sdd/<plan>/`)를 도입하여 동시에 실행되는 플랜 간 산출물이 서로를 읽거나 덮어쓰지 않도록 구조적으로 방지합니다. 재개 가능한 review-fix 루프에 5회 서킷 브레이커를 내장하고, 수정 후 재검토 전용 `re-review-prompt.md`를 추가했습니다.
  - **test-driven-development**: `testing-anti-patterns.md`가 업스트림의 `writing-good-tests.md`로 대체되었습니다.
  - **finishing-a-development-branch**: 업스트림 재작성 버전 채택(로컬에서 먼저 패치했던 worktree 경로 캡처 수정과 동일한 내용 포함, 브랜치 삭제는 명시적 요청 시에만 수행).
  - **스킬 전반 압축**: 여러 `SKILL.md`에서 요약(recap) 및 설득 문구를 제거하여 프롬프트 토큰 사용량 절감.
  - **gemini-tools.md**: 업스트림 업데이트 버전으로 복원, `visual-companion.md`에 Gemini CLI 실행 섹션 추가.
- **PowerShell 패리티 수정**:
  - 모든 SDD `.ps1` 스크립트를 새로운 플랜 단위 `PLAN_FILE` 인터페이스로 이식, `find-polluter.ps1`에 bash 버전의 `./` 접두사 및 `**/` 축소 수정 사항 이식.
  - **종료 코드 일치**: `$ErrorActionPreference = "Stop"` 환경에서 `Write-Error`가 종료 오류가 되어 의도한 종료 코드가 삼켜지던 문제 수정 — 검증 실패 시 정확히 2, 작업을 찾지 못하면 3을 반환하여 bash 스크립트와 일치.
  - **`sdd-workspace.ps1` 슬러그 도출**: 임의의 확장자가 아닌 끝의 `.md`만 제거(bash `basename`과 일치).
- **버전 정렬**: `package.json`, `package-lock.json`, MCP 서버 핸드셰이크 버전을 6.2.0으로 통일.

### v6.0.3
- **명령 삽입 수정**: `server.cjs`의 `BRAINSTORM_OPEN_CMD` 실행 경로를 `cp.exec()`에서 `cp.execFile()`로 변경. 이전 코드는 환경 변수와 URL을 셸을 통해 연결했지만, 새 코드는 argv 배열로 인수를 전달하여 환경 변수 내용에 관계없이 셸 메타문자 삽입을 제거합니다.
- **의존성 보안 (overrides)**: `package.json`에 `overrides` 블록을 추가하여 전이적 의존성의 최소 버전을 강제:
  - `@hono/node-server`: 1.19.14 → **2.0.11** — 인코딩된 백슬래시를 통한 serve-static의 Windows 경로 탐색 수정 ([GHSA-frvp-7c67-39w9](https://github.com/advisories/GHSA-frvp-7c67-39w9))
  - `fast-uri`: 3.1.2 → **4.1.1** — IDN 정규화를 통한 호스트 혼동 ([GHSA-4c8g-83qw-93j6](https://github.com/advisories/GHSA-4c8g-83qw-93j6)) 및 리터럴 백슬래시 권한 구분자 ([GHSA-v2hh-gcrm-f6hx](https://github.com/advisories/GHSA-v2hh-gcrm-f6hx)) 수정
  - `body-parser`: 2.2.2 → **2.3.0** — 잘못된 limit 값이 크기 제한을 자동으로 비활성화하는 DoS 수정 ([GHSA-v422-hmwv-36x6](https://github.com/advisories/GHSA-v422-hmwv-36x6))
- **업스트림 버그 수정**:
  - `find-polluter.sh`: `./` 접두사 경로를 허용하고, 패턴에서 `**/`를 축소하여 최상위 테스트 파일 지원
  - `finishing-a-development-branch/SKILL.md`: Step 5가 디렉토리를 변경하기 전에 `WORKTREE_PATH`를 캡처하여 정리 회귀 수정. Option 2에 detached HEAD 푸시 변형 추가

### v6.0.2
- **모듈 리팩토링 및 성능 향상**:
  - **분리된 아키텍처**: 파일 시스템 액세스, 메타데이터 캐싱 및 구문 분석 로직을 전용 [`src/skills-manager.ts`](src/skills-manager.ts)로 추출하고 [`src/server.ts`](src/server.ts)는 MCP 프로토콜 처리에 집중
  - **O(1) 맵 기반 캐시**: $O(N)$ 이중 배열 스캔을 대소문자 구분 없는 이중 키(이름 및 디렉토리 이름) 메모리 캐시로 대체하여 빠른 $O(1)$ 조회 구현
  - **비동기 I/O 파이프라인**: 동기 파일 API 호출을 Promise 및 `Promise.all` 병렬 실행으로 전환하여 높은 처리량 구현
  - **Markdown 캐시**: 메모리에서 스트리핑된 스킬 콘텐츠를 캐시하여 도구가 자주 호출될 때 반복적인 디스크 읽기 방지
- **보안 강화**:
  - **ReDoS 방지**: 정규식 기반 frontmatter 파서를 안전한 줄 단위 상태 머신 파서로 대체하여 CPU 고갈 위험을 완전히 제거하고 여러 줄 YAML 설명 지원
  - **경로 탐색 차단**: 스킬 이름 입력에 엄격한 영숫자 화이트리스트(`/^[a-zA-Z0-9-_]+$/`) 추가
  - **디렉토리 삽입 검사**: `SKILLS_PATH`를 검증하여 잠재적으로 적대적인 시스템 루트 폴더를 적극적으로 거부
  - **경로 및 사용자 이름 누출 방지**: 네이티브 파일 시스템 오류를 포착하여 경로가 없는 일반 `McpError`로 마스킹
  - **Windows 빌드 및 스크립트 안전성**: `esbuild.js`에서 Windows `chmodSync` 플랫폼 검사 처리, `copy-skills.js`에서 심볼릭 링크 건너뛰기

- **업스트림 보안 체리픽**: obra/superpowers v6.1.1의 보안 강화 적용:
  - **WebSocket 프레임 크기 검증**: `decodeFrame()`에 `MAX_FRAME_PAYLOAD_BYTES(10MB)` 검사 추가 (CWE-789)
  - **하드링크 차단**: `isRegularFileInsideContentDir()`에 `stat.nlink !== 1` 검사 추가
  - **`escapeHtmlText()` 추출**: 인라인 `escHtml` 클로저를 재사용 가능한 명명된 함수로 추출
  - **URL 구문 분석 리팩토링**: `pathnameOf()` 및 `queryKey()` 헬퍼 추출
- **`review-package` 경로 해결 수정**: `sdd-workspace` 호출을 절대 경로 해결로 수정
- **Windows 네이티브 헬퍼 스크립트**: Visual Companion, SDD review/task, systematic-debugging용 PowerShell 래퍼 추가
- **스킬 문서 개선**:
  - `subagent-driven-development`: 계획 충돌 처리를 위한 `plan-mandated` 리뷰 가이던스 추가
  - `writing-skills`: 표현 테스트의 실증적 증거로 금지 대 레시피 가이던스 강화
  - `test-driven-development`: 테이블 서식 수정
  - `writing-skills/anthropic-best-practices`: 이미지 CDN URL 업데이트
- **`helper.js` 주석 정렬**: 동작 변경 없이 4개의 인라인 주석 추가
- **정리**: 사용되지 않는 `walkthrough.md` 제거

### v6.0.1
- **보안 수정 — Reflected XSS (#2)**: `server.cjs`의 서버 측 반사형 XSS 수정. `bootstrapPage()`가 사용자 제공 `keyFromQuery` 매개변수를 사용하던 것을 서버 측 `TOKEN` 상수를 사용하도록 변경

### v6.0.0
- **obra/superpowers v6.1.1과의 업스트림 동기화**: 모든 스킬에 걸친 대규모 동기화
- **subagent-driven-development 재설계**: 2단계 리뷰를 통합된 "작업 리뷰어"로 변경, 전체 브랜치 최종 리뷰 추가, Pre-Flight Plan Review 신설
- **using-superpowers 단순화**: 플랫폼별 섹션 제거, 플랫폼별 참조 파일 도입
- **brainstorming Visual Companion**: 적시 제공으로 변경
- **타입 안전성 및 코드 품질**: `Record<string,string>` 캐스트 수정, 남은 `innerHTML`을 안전한 DOM 메서드로 대체

### v5.1.2
- **보안 강화**: `helper.js`의 마지막 `innerHTML` 사용을 안전한 DOM 생성 메서드로 대체
- **의존성 보안**: hono를 `4.12.23`에서 `4.12.26`으로 업그레이드

### v5.1.1
- **보안 감사 및 강화**: 전체 보안 감사 수행, `.gitignore` 규칙 업데이트
- **취약점 패치**: `helper.js`의 XSS 수정, `path-to-regexp`를 `8.4.2`로 업그레이드

### v5.1.0
- **인라인 셀프 리뷰**: 서브에이전트 리뷰 루프를 가벼운 인라인 셀프 리뷰 체크리스트로 대체
- **Git Worktree 재설계**: `detect-and-defer` 메커니즘으로 재작성
- **토큰 최적화**: 모든 스킬에서 `Integration` 섹션 제거
- **통합**: 독립적인 `code-reviewer` 에이전트를 `requesting-code-review`로 통합

### v4.3.2
- **보안**: brainstorming Visual Companion의 XSS 취약점 수정
- **문서**: 정확한 버전 정보로 README 및 SECURITY 업데이트

### v4.3.0
- 초기 MCP 서버 구현
- 원본 Superpowers에서 14개의 핵심 스킬 마이그레이션

---

## 🙏 감사의 말

이 프로젝트는 [obra](https://github.com/obra)의 원본 [Superpowers](https://github.com/obra/superpowers) 프로젝트의 포크 및 각색입니다. 이 MCP 서버의 기반이 되는 에이전틱 스킬 프레임워크와 소프트웨어 개발 방법론을 정의해 준 그들의 작업에 감사드립니다.
