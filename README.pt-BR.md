# Guia de Uso do Toolpack Superpowers MCP

[English](README.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Português (BR)](README.pt-BR.md) | [हिन्दी](README.hi.md)

[![Versão](https://img.shields.io/badge/version-6.4.5-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
[![Licença](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Este documento resume as informações e instruções de uso para empacotar as skills do Superpowers e o sistema de fluxos de trabalho autônomos em um servidor **Model Context Protocol (MCP)** independente, de alta performance e seguro.

---

## 🚀 Como instalar e usar

### Ambientes e plataformas compatíveis

- **Editores de código e IDEs com IA**: **Antigravity (AGY)**, **Cursor**, **VSCode** (GitHub Copilot), **VSCode Insiders** (GitHub Copilot), **Devin Desktop**, **Trae**, **Cline**, **Kilo Code**, **Qoder**, **Kiro**, **MiniMax Code Desktop** (configuração manual), **Codex**.
- **Aplicativos de desktop e plataformas de agentes IA**: **Claude Desktop**, **Pi Desktop**, **QwenPaw**, **Hermes Desktop**, **Kimi Work**, **Goose**, **OpenClaw**.
- **Plataformas de IA locais e auto-hospedadas**: **AnythingLLM**, **LibreChat**.

### Recursos MCP fornecidos

| Recurso do protocolo | Itens / Quantidade | Descrição |
| :--- | :--- | :--- |
| **Tools** | `list_skills`, `read_skill` | Descubra, pesquise e carregue as instruções completas e checklists de cada skill sob demanda. |
| **Prompts** | 9 Native Prompts | `session-start`, `feature-pipeline`, `structured-debug`, `skill-composition`, `sdd-implementer`, `sdd-task-reviewer`, `sdd-re-review`, `spec-reviewer`, `plan-reviewer` |
| **Resources** | 15 Skill URIs + 1 Guide | `skill://superpowers/<skill-name>` além de `guide://superpowers/skill-compositions` |

### Conversando com o agente de IA (uso básico)

Depois de instalado ou configurado, seu cliente MCP consegue descobrir as tools, prompts e resources do Superpowers. Os prompts MCP são invocados pelo usuário; selecione um no menu de MCP Prompts do seu cliente. O carregamento das skills depende então do agente seguir o prompt selecionado e chamar `read_skill`.

**Exemplos básicos de interação:**
- **Inicializar a disciplina de engenharia:** "Aplique o prompt `session-start`" (injeta as regras e o contexto do Superpowers)
- **Descobrir as skills disponíveis:** "Liste todas as skills do superpowers"
- **Carregar uma skill atômica:** "Use o `read_skill` para carregar a skill `brainstorming` e me ajude a explorar os requisitos"

---

## ⚡ Configuração direcionada com um clique

Para começar a usar o Superpowers na hora, sem modificações intrusivas em segundo plano, use nossa ferramenta de configuração com um clique, **direcionada e respeitosa com a privacidade**.

> [!NOTE]
> **Execute de qualquer diretório**: você NÃO precisa clonar este repositório nem navegar até uma pasta específica. Você pode executar estes comandos diretamente de **qualquer diretório** no seu terminal. O instalador mira automaticamente os arquivos de configuração globais no seu diretório home (`~`), ativando o Superpowers em todos os seus workspaces na hora.

ChatWise e Cherry Studio exigem importação manual, consulte o [guia de importação para desktop](docs/desktop-setup.md).

### 1. Escolha seu agente / editor de IA (comando direcionado)

Selecione seu cliente e execute o comando correspondente no terminal:

| Plataforma / Cliente | SOs suportados | Comando de configuração com um clique | Local da configuração global |
| :--- | :--- | :--- | :--- |
| **LM Studio** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target lmstudio` | `~/.lmstudio/mcp.json` |
| **Roo Code (VS Code Desktop)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target roo` | `.../rooveterinaryinc.roo-cline/settings/mcp_settings.json` |
| **Antigravity (Google DeepMind)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target antigravity` | `~/.gemini/config/mcp_config.json` |
| **Pi Desktop / Pi Agent** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target pi-desktop` | `~/.pi/agent/mcp.json` |
| **Cursor** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target cursor` | `~/.cursor/mcp.json` |
| **GitHub Copilot (VS Code)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target copilot` | `Code/User/mcp.json` *(esquema `servers` do VS Code)* |
| **GitHub Copilot (VS Code Insiders)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target copilot-insiders` | `Code - Insiders/User/mcp.json` *(esquema `servers` do VS Code)* |
| **Hermes Desktop / Agent** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target hermes` | `~/.hermes/config.yaml` *(Win: `%LOCALAPPDATA%\hermes`)* |
| **Kimi Work / Kimi Code** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target kimi` | `~/.kimi-code/mcp.json` |
| **Claude Desktop** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target claude` | `Claude/claude_desktop_config.json` |
| **Devin Desktop (antes Windsurf)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target devin` | `~/.config/devin/mcp_config.json` *(ou `windsurf`)* |
| **QwenPaw (estação pessoal de agentes)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target qwenpaw` | `~/.qwenpaw/config.json` *(apelidos: `copaw`)* |
| **Cline (VS Code / CLI)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target cline` | `.../saoudrizwan.claude-dev/settings/cline_mcp_settings.json` |
| **Kilo Code** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target kilo` | `~/.config/kilo/kilo.jsonc` *(esquema nativo `mcp`)* |
| **Qoder** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target qoder` | `~/.qoder/settings.json` |
| **Kiro** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target kiro` | `~/.kiro/settings/mcp.json` |
| **Trae** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target trae` | `.../Trae/User/mcp.json` *(compatível com Trae CN)* |
| **Codex** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target codex` | `~/.codex/config.toml` *(TOML `[mcp_servers]`)* |
| **OpenClaw** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target openclaw` | `~/.openclaw/openclaw.json` *(JSON5 `mcp.servers`)* |
| **Goose** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target goose` | `~/.config/goose/config.yaml` *(Win: `%APPDATA%\Block\goose\config\config.yaml`)* |

*(Se você usa Bun, adicione `--bun` para inicialização mais rápida, ex. `npx -y superpowers-mcp setup --target cursor --bun`)*

---

### 2. Configuração via Curl ou PowerShell

- **macOS / Linux (via Curl com target explícito):**
  ```bash
  curl -fsSL https://raw.githubusercontent.com/Poseidoncode/superpowers-mcp/main/scripts/install.sh | bash -s -- --target cursor
  ```

- **Windows (via PowerShell com target explícito):**
  ```powershell
  & ([scriptblock]::Create((irm https://raw.githubusercontent.com/Poseidoncode/superpowers-mcp/main/scripts/install.ps1))) -Target cursor
  ```

#### Flags avançadas:
- `--dry-run`: Mostra as mudanças sem gravar no disco.
- `--remove`: Remove com segurança a configuração do Superpowers do cliente selecionado.
- `--backup`: Cria um backup `.bak` com timestamp antes de modificar (padrão: desativado, poluição zero).
- `--bun`: Usa `bunx` em vez de `npx` na configuração gerada.
- `--target <name>`: Nome explícito do alvo (apelidos suportados, ex. `code`, `vscode`, `kimi-code`).

---

## 🛠️ Configuração manual do MCP

Se preferir configurar manualmente, adicione as configurações abaixo ao seu IDE ou cliente MCP (ex. Cursor, Antigravity, VSCode, AnythingLLM, etc.).

### Método: NPX / BUNX (recomendado)

É a forma mais fácil, pois resolve os caminhos automaticamente.

#### Usando Bun (mais rápido)
```json
{
  "superpowers": {
    "command": "bunx",
    "args": ["-y", "superpowers-mcp"]
  }
}
```

#### Usando Node/NPM
```json
{
  "superpowers": {
    "command": "npx",
    "args": ["-y", "superpowers-mcp"]
  }
}
```

---

## 🔄 Composição de skills e pipelines de workflow

Para tarefas complexas de engenharia, use estes **lançadores interativos de workflow**. Eles iniciam um processo guiado pelo agente e pausam nas decisões de design, revisão do plano e finalização do branch; não executam no servidor nem de forma autônoma. Veja o [`Guia de Composição de Skills`](docs/skill-compositions.pt-BR.md) publicado, também disponível como resource MCP `guide://superpowers/skill-compositions`.

### 1. Pipeline de desenvolvimento de novas features
```
brainstorming ➔ writing-plans ➔ using-git-worktrees ➔ subagent-driven-development (TDD) ➔ verification-before-completion ➔ requesting-code-review ➔ finishing-a-development-branch
```
- **Como iniciar:** Selecione `feature-pipeline` no menu de MCP Prompts do seu cliente e informe `feature_name` mais `requirements` opcional.
- **Fluxo:** Esclarece requisitos (Spec) ➔ aguarda aprovação do design ➔ cria um plano revisável ➔ aguarda aprovação do plano ➔ isola um worktree ➔ implementa com SDD ou o fallback inline e TDD ➔ verifica ➔ revisa ➔ pergunta como finalizar o branch.
- **Fallback:** Se o host não tiver ferramentas multiagente, o workflow usa `executing-plans` em vez de dizer que despacha subagentes.

### 2. Pipeline estruturada de troubleshooting
```
systematic-debugging ➔ using-git-worktrees ➔ dispatching-parallel-agents ➔ test-driven-development ➔ verification-before-completion ➔ requesting-code-review ➔ finishing-a-development-branch
```
- **Como iniciar:** Selecione `structured-debug` no menu de MCP Prompts do seu cliente e informe o problema ou os testes que falham.
- **Fluxo:** Levanta hipóteses de causa raiz ➔ isola worktrees para agentes paralelos ➔ cria testes de reprodução que falham ➔ aplica a correção pontual ➔ confirma zero regressões ➔ revisa a correção ➔ finaliza o branch.

### 3. Guia dinâmico de workflows
- **Como iniciar:** Selecione `skill-composition` para obter um workflow recomendado para refatoração, migração ou codebase legado. Esses cenários não têm prompts lançadores dedicados no momento.
- **Fluxo:** Recomenda dinamicamente a composição ideal de múltiplas skills para grandes refatorações, redes de segurança de migração ou onboarding:
  - **Refatoração e migração grandes:** `brainstorming` ➔ `writing-plans (skeleton-first)` ➔ `using-git-worktrees` ➔ `subagent-driven-development` ➔ `verification-before-completion` ➔ `requesting-code-review` ➔ `finishing-a-development-branch`
  - **Rede de segurança para código legado:** `brainstorming` ➔ `writing-plans` ➔ `test-driven-development (characterization)` ➔ `systematic-debugging` ➔ `verification-before-completion`


---

## 📋 Visão geral das skills (15 skills principais e cenários)

Para ajudar você a escolher a skill certa, estruturamos as 15 skills ao longo do ciclo de vida do software (SDLC), combinando capacidades principais e cenários recomendados pela comunidade:

| # | Fase do SDLC | Nome da skill | O que faz (propósito e valor principal) | Cenário recomendado |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **🚀 Planejamento e design** | **`brainstorming`** | **Requisitos e design de arquitetura**: Explora opções e restrições antes de codar; gera specs de design; inclui revisão de UI no navegador com Visual Companion. | Antes de começar qualquer feature nova ou grande mudança; evita pular direto para o código. |
| 2 | **🚀 Planejamento e design** | **`writing-plans`** | **Planejamento da implementação**: Decompõe specs em tarefas pequenas e testáveis, com skills recomendadas e referências exatas de arquivos. | Antes de refatorações multiarquivo, migrações complexas ou implementações grandes. |
| 3 | **💻 Implementação** | **`executing-plans`** | **Execução do plano na sessão**: Executa cada tarefa passo a passo na sessão atual e depois faz uma revisão do branch inteiro no final. | Execução de planos em lote dentro da mesma sessão, sem criar subagentes. |
| 4 | **💻 Implementação** | **`subagent-driven-development`** | **Desenvolvimento dirigido por subagentes (SDD)**: Despacha subagentes novos e isolados por tarefa, com revisões adversariais em duas camadas. | Modelo de execução recomendado para planos complexos, sem poluição de contexto. |
| 5 | **💻 Implementação** | **`test-driven-development`** | **Desenvolvimento guiado por testes (TDD)**: Aplica ciclos rigorosos de Vermelho ➔ Verde ➔ Refatoração, garantindo cobertura robusta. | Ao implementar features logicamente desafiadoras ou algoritmos críticos. |
| 6 | **🔍 Debugging** | **`systematic-debugging`** | **Debugging sistemático de causa raiz**: Decompõe erros complexos em hipóteses testáveis com experimentos de validação. | Diante de qualquer erro inesperado, falha de teste ou bug intermitente. |
| 7 | **🛡️ Qualidade e revisão** | **`verification-before-completion`** | **Verificação baseada em evidências**: Exige rodar toda a suíte de testes, linter e checagens de tipos. | Antes de dizer "funciona" ou "está pronto"; traz prova tangível de conclusão. |
| 8 | **🛡️ Qualidade e revisão** | **`requesting-code-review`** | **Início de code reviews**: Empacota diffs e relatórios para revisões multidimensionais de arquitetura e qualidade. | Antes de fazer merge de branches ou finalizar tarefas, para garantir integridade arquitetural. |
| 9 | **🛡️ Qualidade e revisão** | **`receiving-code-review`** | **Tratamento de feedback de revisão**: Avalia sistematicamente os comentários, aplica correções e registra as decisões. | Ao tratar findings de revisão de forma sistemática, sem perder contexto. |
| 10 | **🛡️ Qualidade e revisão** | **`finishing-a-development-branch`** | **Integração e limpeza do branch**: Gerencia PR/merge, limpa os worktrees do Git e remove branches temporários. | Quando todas as verificações passam, para integrar a feature no branch principal. |
| 11 | **🌿 Versionamento** | **`using-git-worktrees`** | **Isolamento físico com Git**: Cria diretórios worktree isolados para features ou debugging, evitando race conditions. | Ao trabalhar em tarefas concorrentes ou investigações paralelas multiagente. |
| 12 | **🤖 Agentes avançados** | **`dispatching-parallel-agents`** | **Orquestração de agentes em paralelo**: Despacha subagentes concorrentes em workspaces isolados para investigar várias hipóteses ao mesmo tempo. | Quando vários testes falham ou é preciso investigar teorias independentes em paralelo. |
| 13 | **🤖 Agentes avançados** | **`using-superpowers`** | **Fundamentos e disciplina do Superpowers**: Estabelece a disciplina obrigatória de descoberta e carregamento de skills e as regras de prioridade. | Carregado automaticamente no início da sessão para impor os padrões de engenharia. |
| 14 | **🤖 Agentes avançados** | **`writing-skills`** | **Criação e manutenção de skills**: Guia a criação, teste e empacotamento de novas skills do Superpowers. | Ao criar skills personalizadas ou melhorar instruções existentes. |
| 15 | **🤖 Agentes avançados** | **`diagnosing-superpowers`** | **Forense de sessão e relatórios**: Reconstrói o que deu errado na sessão a partir de transcrições em disco com evidências citadas; prepara pacotes anonimizados e issues do GitHub. | Quando uma sessão saiu do trilho e você precisa de evidência do porquê, ou de um relatório para os mantenedores. |

## 🆕 Novidades recentes

### v6.4.5 (atual)

- **Sincronização com `obra/superpowers@8ca22db` (v6.4.2, 2026-09-25, PR #2384 "leaner plans")**: `writing-plans` agora registra as decisões que o implementador precisa (assinaturas, asserções de teste, valores do spec) em vez de transcrever código: novo cabeçalho de plano centrado no spec com `Spec:` explícito, nova plantilha `## What a Step Contains`, `## Bite-Sized Task Granularity` renomeado para `## Step Granularity` e `## Self-Review` com sete verificações.
- **Conteúdo do fork preservado no merge**: a seção própria `## Two Plan Shapes` e `skeleton-first-plans.md` permanecem intactos; `plan-document-reviewer-prompt.md` fica no fork porque `src/server.ts` o renderiza como prompt MCP `plan-reviewer`.
- **Baseline de drift regravada em `8ca22db`** (74/74 arquivos de skills upstream, `npm run drift` limpo); novo teste de regressão `Test 19 (v6.4.2)` em `tests/upstream_sync_test.js`.
- **Documentação e higiene do scan**: a matriz de skills deste README e os exemplos de `docs/skill-compositions.*` seguem o template atual do `writing-plans` (referências exatas de arquivos, não os "contratos de arquivos" já removidos); `npm run drift` ignora arquivos do sistema (`.DS_Store`).

### v6.4.4

- **Correção CodeQL e patch de segurança (2026-09-28)**:
  - O code scanning fica em **0 abertos / 7 corrigidos**: fechados os 3 alertas reportados contra a v6.4.3 em `src/setup-runner.ts` (detalhes em [SECURITY.md](SECURITY.md)).
  - **Correção ReDoS no TOML**: as regex de detecção de tabelas entre aspas foram trocadas por scanners lineares — linhas de configuração adversas não causam mais backtracking polinomial; o comportamento fail-closed não muda.
  - **Guarda contra prototype pollution**: os segmentos `serverPath` do JSON aninhado (usados pelo target `openclaw`) agora rejeitam `__proto__` / `constructor` / `prototype` e chaves não identificadoras antes de gravar.
  - Sem mudança para configurações válidas; verificação: `npm test` verde (base **389/389**), `tsc` limpo, `npm audit` 0 vulnerabilidades.

### v6.4.3

- **Target Codex e limpeza de docs (2026-09-28)**:
  - Novo target `codex`: `setup --target codex` grava `~/.codex/config.toml` (`[mcp_servers.superpowers]`) com merge TOML sem dependências; suporta `--dry-run` / `--backup` / `--bun` / `--remove`.
  - Novos targets `openclaw` / `goose`: o primeiro grava `~/.openclaw/openclaw.json` (`mcp.servers`); o segundo o bloco `extensions` do `config.yaml` do goose (preserva `enabled`/`timeout`/`envs` do usuário).
  - Removido o bloco TIP redundante de transparência do setup (duplicava o cabeçalho); detalhes de segurança ficam em Advanced Flags e SECURITY.md.
  - `docs/desktop-setup.md` agora é o guia de importação em inglês para ChatWise e Cherry Studio (`setup --print-config`); LM Studio / Roo Code seguem na tabela de um clique. Removida a nota obsoleta de "opções não publicadas" (`lmstudio`, `roo` e `--print-config` saíram na v6.3.9).
  - Publicadas a navegação em 7 idiomas (novos README ES / PT-BR / HI), os guias de skill-composition ES / PT-BR / HI e a correção de negrito adjacente a CJK.
  - MiniMax Code Desktop consta como (configuração manual) (caminho não verificado).
  - Verificação: `npm test` verde, base agora 389/389 (+17 casos setup-target), `npm audit` 0 vulnerabilidades.

### v6.4.2

- **Auditoria de segurança e code review v6.4.2 (2026-09-24)**: fechou os achados de auditoria no servidor MCP, scripts de setup, pipeline de build e harness de testes (detalhes em [SECURITY.md](SECURITY.md)).
  - **Traversal e higiene de erros**: nomes de skill são decodificados *antes* da validação contra a allowlist, então payloads com dupla codificação `..%2f` / `%2e%2e` são rejeitados com `InvalidParams`; tools e prompts desconhecidos agora retornam erros `InvalidParams` acionáveis em vez de `MethodNotFound`.
  - **Defesa TOCTOU e contra paths destrutivos**: paths canônicos são reverificados após checagem de symlinks, limpeza de cache é protegida pelo manifesto de cópia (skills próprias do fork nunca são apagadas) e registros de drift/coverage são gravados atomicamente via arquivo temp + rename.
  - **Builds sem race e sync tolerante**: o build de `out/setup.js` usa lock exclusivo com rechecagem de staleness por mtime, a saída do modo watch recebe chmod executável e fontes upstream ausentes terminam de forma limpa em vez de gerar drift falso.
  - **Harness de testes honesto**: watchdog com ref mais handlers `exit`/`close` do servidor encerram hangs silenciosos, testes de drift rodam com proteção de rede e skips por privilégio limitado não contam mais como passe — o piso de regressão segue em **365/365** assertions.

### v6.4.1

- **Sync upstream com obra/superpowers v6.4.1**:
  - **Execução nativa inline do plano**: o `executing-plans` reescrito roda o plano inteiro com os novos helpers `task-start` / `task-done` e depois faz uma única revisão do branch inteiro — sem check-ins no meio.
  - **Nova skill: `diagnosing-superpowers`**: forense de sessão a partir de transcrições em disco com evidências citadas, além de pacotes anonimizados e rascunhos de GitHub issues (15 skills no total).
  - **Comportamento de revisão**: avalia comportamento não especificado pela expectativa razoável do usuário, lista `Declined to judge`, `BASE_SHA` via `git merge-base origin/main HEAD`.
  - **Foco de revisão do plano**: nova seção de template e item de autorrevisão que amarram edge cases implícitos na spec às tarefas responsáveis.
  - **Novas refs de plataformas**: mapeamentos de ferramentas do Muse e Claude Code; refs de Devin/OpenCode mantidas.
  - Scripts invocados via seu interpretador (`bash` / `node`) para que o empacotamento do marketplace não os quebre.
- **Paridade Windows e piso de regressão**:
  - Novos ports `task-start.ps1` / `task-done.ps1` com suítes de simetria sh/ps1.
  - Todo o conteúdo durável dos PRs adotados preservado (ledger Discoveries, contrato de arquivos de revisão, scripts greenfield, segurança remota); baseline de drift regravada com zero drift.
- **Auditoria de segurança completa e piso de regressão automatizado** ([`SECURITY.md`](SECURITY.md)):
  - 100% verificado em **365 assertions de testes automatizados** (Node.js 170, Bash 67, PowerShell 128), 0 vulnerabilidades, 0 segredos hardcoded.
  - O `task-done` inline executa os testes escolhidos pelo operador como argv (`"$@"` / `& $exe @rest`), não como shell; o texto do ledger é só informativo.
  - `diagnosing-superpowers` é só leitura local e exportação controlada; a anonimização é best-effort — revise cada arquivo antes de compartilhar.
  - A exportação de achados diferidos agora inclui `Final: minor (deferred):` sem contar parked de linhas de conclusão.
  - A config local do Devin (`.devin/`) está no gitignore.

### v6.3.10

- **Resolução de conflitos de chaves de setup universal e preservação sem perdas**:
  - Descobre automaticamente declarações existentes nas chaves reconhecidas (`servers`, `mcp`, `mcpServers`), evitando configurações duplicadas em conflito.
  - Faz merge e preserva com segurança campos criados pelo usuário (`env`, `cwd`, `disabled`, `alwaysAllow`, `args`) na reinstalação.
  - Elimina estados contraditórios entre flags opostas (`disabled: true` vs `enabled: true`).
  - Rejeita flags desconhecidas e argumentos posicionais inesperados com exit code 1; padroniza em `process.exitCode` para não truncar saída em pipes Unix.
- **Verificação de cache do motor de skills com stat rápido e proteção de época de scan**:
  - Implementa verificação rápida com um único stat (`dev`, `ino`, `size`, `mtimeMs`) em paths cacheados, invalidando na hora se symlinks redirecionarem, sem revarrer a árvore toda.
  - O `scanEpoch` monotônico crescente e o reset de `loadingEpoch` no `clearCache()` impedem que scans async pendentes repovoem caches esvaziados.
  - A verificação com descritor autoritativo (`readFileNoFollow`) evita trocas de descritor TOCTOU.
- **Robustez e deduplicação de templates de prompts MCP**:
  - Para com `McpError(ErrorCode.InternalError)` e diagnóstico estruturado em stderr quando templates estão ausentes ou vazios.
  - Rastreia substituições aplicadas via `appliedInterpolations`, evitando anexos redundantes de argumentos.
- **Auditoria de segurança completa e piso de regressão automatizado**:
  - 100% verificado em **292 assertions de testes automatizados** (Node.js 163, Bash 35, PowerShell 94), 0 vulnerabilidades, 0 segredos hardcoded.

### v6.3.9

- **Defesa permanente contra ReDoS (CodeQL Alert #4 resolvido)**:
  - Trocou o backtracking ambíguo de regex no parsing YAML (`updateYamlConfig`) por matching de prefixo sem ambiguidade e `String.prototype.trim()` nativo.
  - Adicionou scan linear `extractInlineComment` ($O(N)$), evitando backtracking polinomial em entradas com longos paddings de espaços. CodeQL Alert #4 (`js/polynomial-redos`) formalmente encerrado.
  - Adicionada suíte de regressão em `tests/setup_test.js` validando processamento linear (<1ms) contra 60.000 espaços.
- **Expansão de clientes (17 clientes de agentes IA)**:
  - Adicionados targets para **LM Studio** (`lmstudio`, `~/.lmstudio/mcp.json`) e **Roo Code** no VS Code Desktop (`roo`, `rooveterinaryinc.roo-cline/settings/mcp_settings.json`) em macOS, Windows e Linux.
  - Parser YAML aprimorado para preservar comentários inline em `mcp_servers:` e `superpowers:`.
- **Ferramentas de importação desktop e integridade do exit code**:
  - Adicionado `setup --print-config` (opcional `--bun`) para saída JSON limpa para importação em clientes desktop (ChatWise, Cherry Studio, etc.) sem gravar arquivos.
  - A delegação de setup em `src/server.ts` agora preserva o `process.exitCode` dos comandos CLI.
- **Guia de configuração desktop**:
  - Adicionado o guia completo [`docs/desktop-setup.md`](docs/desktop-setup.md) para LM Studio, Roo Code, ChatWise e Cherry Studio.

👉 *Para o histórico completo de releases, veja [CHANGELOG.md](CHANGELOG.md).*

---

## 🙏 Agradecimentos

Este projeto é um fork e adaptação do projeto original [Superpowers](https://github.com/obra/superpowers) de [obra](https://github.com/obra). Somos gratos pelo trabalho pioneiro deles na definição do framework de skills agênticas e da metodologia de desenvolvimento que sustenta este servidor MCP.
