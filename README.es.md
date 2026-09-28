# Guía de uso del Toolpack Superpowers MCP

[English](README.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Português (BR)](README.pt-BR.md) | [हिन्दी](README.hi.md)

[![Versión](https://img.shields.io/badge/version-6.4.4-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
[![Licencia](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Este documento resume la información y las instrucciones de uso para empaquetar las habilidades (skills) de Superpowers y el sistema de flujos de trabajo autónomos en un servidor **Model Context Protocol (MCP)** independiente, de alto rendimiento y seguro.

---

## 🚀 Cómo instalar y usar

### Entornos y plataformas compatibles

- **Editores de código e IDE con IA**: **Antigravity (AGY)**, **Cursor**, **VSCode** (GitHub Copilot), **VSCode Insiders** (GitHub Copilot), **Devin Desktop**, **Trae**, **Cline**, **Kilo Code**, **Qoder**, **Kiro**, **MiniMax Code Desktop** (configuración manual), **Codex**.
- **Aplicaciones de escritorio y plataformas de agentes IA**: **Claude Desktop**, **Pi Desktop**, **QwenPaw**, **Hermes Desktop**, **Kimi Work**, **Goose**, **OpenClaw**.
- **Plataformas de IA locales y autoalojadas**: **AnythingLLM**, **LibreChat**.

### Funcionalidades MCP incluidas

| Función del protocolo | Elementos / Cantidad | Descripción |
| :--- | :--- | :--- |
| **Tools** | `list_skills`, `read_skill` | Descubre, busca y carga las instrucciones completas y listas de verificación de cada skill bajo demanda. |
| **Prompts** | 9 Native Prompts | `session-start`, `feature-pipeline`, `structured-debug`, `skill-composition`, `sdd-implementer`, `sdd-task-reviewer`, `sdd-re-review`, `spec-reviewer`, `plan-reviewer` |
| **Resources** | 15 Skill URIs + 1 Guide | `skill://superpowers/<skill-name>` además de `guide://superpowers/skill-compositions` |

### Conversar con el agente de IA (uso básico)

Una vez instalado o configurado, tu cliente MCP puede descubrir las herramientas, prompts y recursos de Superpowers. Los prompts MCP los invoca el usuario; selecciónalos desde el menú de MCP Prompts de tu cliente. Después, la carga de skills depende de que el agente siga el prompt seleccionado y llame a `read_skill`.

**Ejemplos básicos de interacción:**
- **Inicializar la disciplina de ingeniería:** «Aplica el prompt `session-start`» (inyecta las reglas y el contexto de Superpowers)
- **Descubrir los skills disponibles:** «Lista todos los skills de superpowers»
- **Cargar un skill atómico:** «Usa `read_skill` para cargar el skill `brainstorming` y ayúdame a explorar los requisitos»

---

## ⚡ Configuración dirigida con un clic

Para empezar a usar Superpowers al instante, sin modificaciones intrusivas en segundo plano, utiliza nuestra herramienta de configuración con un clic, **dirigida y respetuosa con la privacidad**.

> [!NOTE]
> **Ejecútalo desde cualquier directorio**: NO necesitas clonar este repositorio ni navegar a una carpeta específica. Puedes ejecutar estos comandos directamente desde **cualquier directorio** de tu terminal. El instalador apunta automáticamente a los archivos de configuración globales en tu directorio personal (`~`), habilitando Superpowers en todos tus espacios de trabajo al instante.

ChatWise y Cherry Studio requieren importación manual, consulta la [guía de importación de escritorio](docs/desktop-setup.md).

### 1. Elige tu agente / editor de IA (comando dirigido)

Selecciona tu cliente y ejecuta el comando correspondiente en tu terminal:

| Plataforma / Cliente | SO compatibles | Comando de configuración con un clic | Ubicación de la configuración global |
| :--- | :--- | :--- | :--- |
| **LM Studio** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target lmstudio` | `~/.lmstudio/mcp.json` |
| **Roo Code (VS Code Desktop)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target roo` | `.../rooveterinaryinc.roo-cline/settings/mcp_settings.json` |
| **Antigravity (Google DeepMind)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target antigravity` | `~/.gemini/config/mcp_config.json` |
| **Pi Desktop / Pi Agent** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target pi-desktop` | `~/.pi/agent/mcp.json` |
| **Cursor** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target cursor` | `~/.cursor/mcp.json` |
| **GitHub Copilot (VS Code)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target copilot` | `Code/User/mcp.json` *(esquema `servers` de VS Code)* |
| **GitHub Copilot (VS Code Insiders)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target copilot-insiders` | `Code - Insiders/User/mcp.json` *(esquema `servers` de VS Code)* |
| **Hermes Desktop / Agent** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target hermes` | `~/.hermes/config.yaml` *(Win: `%LOCALAPPDATA%\hermes`)* |
| **Kimi Work / Kimi Code** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target kimi` | `~/.kimi-code/mcp.json` |
| **Claude Desktop** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target claude` | `Claude/claude_desktop_config.json` |
| **Devin Desktop (antes Windsurf)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target devin` | `~/.config/devin/mcp_config.json` *(o `windsurf`)* |
| **QwenPaw (estación de trabajo personal)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target qwenpaw` | `~/.qwenpaw/config.json` *(alias: `copaw`)* |
| **Cline (VS Code / CLI)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target cline` | `.../saoudrizwan.claude-dev/settings/cline_mcp_settings.json` |
| **Kilo Code** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target kilo` | `~/.config/kilo/kilo.jsonc` *(esquema nativo `mcp`)* |
| **Qoder** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target qoder` | `~/.qoder/settings.json` |
| **Kiro** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target kiro` | `~/.kiro/settings/mcp.json` |
| **Trae** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target trae` | `.../Trae/User/mcp.json` *(compatible con Trae CN)* |
| **Codex** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target codex` | `~/.codex/config.toml` *(TOML `[mcp_servers]`)* |
| **OpenClaw** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target openclaw` | `~/.openclaw/openclaw.json` *(JSON5 `mcp.servers`)* |
| **Goose** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target goose` | `~/.config/goose/config.yaml` *(Win: `%APPDATA%\Block\goose\config\config.yaml`)* |

*(Si usas Bun, añade `--bun` para un arranque más rápido, p. ej. `npx -y superpowers-mcp setup --target cursor --bun`)*

---

### 2. Configuración con Curl o PowerShell

- **macOS / Linux (con Curl y objetivo explícito):**
  ```bash
  curl -fsSL https://raw.githubusercontent.com/Poseidoncode/superpowers-mcp/main/scripts/install.sh | bash -s -- --target cursor
  ```

- **Windows (con PowerShell y objetivo explícito):**
  ```powershell
  & ([scriptblock]::Create((irm https://raw.githubusercontent.com/Poseidoncode/superpowers-mcp/main/scripts/install.ps1))) -Target cursor
  ```

#### Opciones avanzadas:
- `--dry-run`: Muestra los cambios sin escribir en disco.
- `--remove`: Elimina de forma segura la configuración de Superpowers del cliente seleccionado.
- `--backup`: Crea una copia de seguridad `.bak` con marca de tiempo antes de modificar (por defecto: desactivado, cero contaminación).
- `--bun`: Usa `bunx` en lugar de `npx` en la configuración generada.
- `--target <name>`: Nombre explícito del objetivo (se admiten alias, p. ej. `code`, `vscode`, `kimi-code`).

---

## 🛠️ Configuración manual de MCP

Si prefieres configurar manualmente, añade los siguientes ajustes a tu IDE o cliente MCP (p. ej. Cursor, Antigravity, VSCode, AnythingLLM, etc.).

### Método: NPX / BUNX (recomendado)

Es la forma más sencilla, ya que resuelve las rutas automáticamente.

#### Con Bun (más rápido)
```json
{
  "superpowers": {
    "command": "bunx",
    "args": ["-y", "superpowers-mcp"]
  }
}
```

#### Con Node/NPM
```json
{
  "superpowers": {
    "command": "npx",
    "args": ["-y", "superpowers-mcp"]
  }
}
```

---

## 🔄 Composición de skills y flujos de trabajo

Para tareas de ingeniería complejas, usa estos **lanzadores de flujo de trabajo interactivos**. Inician un proceso guiado por el agente y se detienen en las decisiones de diseño, revisión del plan y finalización de la rama; no se ejecutan en el servidor ni de forma desatendida. Consulta la [`Guía de composición de skills`](docs/skill-compositions.es.md) publicada, también disponible como recurso MCP `guide://superpowers/skill-compositions`.

### 1. Flujo de desarrollo de nuevas funcionalidades
```
brainstorming ➔ writing-plans ➔ using-git-worktrees ➔ subagent-driven-development (TDD) ➔ verification-before-completion ➔ requesting-code-review ➔ finishing-a-development-branch
```
- **Cómo iniciarlo:** Selecciona `feature-pipeline` en el menú de MCP Prompts de tu cliente e indica `feature_name` y, opcionalmente, `requirements`.
- **Flujo:** Aclara los requisitos (Spec) ➔ espera la aprobación del diseño ➔ crea un plan revisable ➔ espera la aprobación del plan ➔ aísla un worktree ➔ implementa con SDD o la alternativa integrada y TDD ➔ verifica ➔ revisa ➔ pregunta cómo finalizar la rama.
- **Alternativa:** Si el host no dispone de herramientas multiagente, el flujo usa `executing-plans` en lugar de afirmar que despacha subagentes.

### 2. Flujo estructurado de resolución de problemas
```
systematic-debugging ➔ using-git-worktrees ➔ dispatching-parallel-agents ➔ test-driven-development ➔ verification-before-completion ➔ requesting-code-review ➔ finishing-a-development-branch
```
- **Cómo iniciarlo:** Selecciona `structured-debug` en el menú de MCP Prompts de tu cliente e indica el problema o las pruebas que fallan.
- **Flujo:** Formula hipótesis de causa raíz ➔ aísla worktrees para agentes en paralelo ➔ crea pruebas de reproducción que fallan ➔ aplica la corrección específica ➔ confirma cero regresiones ➔ revisa la corrección ➔ finaliza la rama.

### 3. Guía dinámica de flujos de trabajo
- **Cómo iniciarla:** Selecciona `skill-composition` para obtener un flujo recomendado para refactorización, migración o un código heredado. Estos escenarios no tienen actualmente prompts lanzadores dedicados.
- **Flujo:** Recomienda dinámicamente la composición óptima de varios skills para grandes refactorizaciones, redes de seguridad de migración o incorporación:
  - **Refactorización y migración grandes:** `brainstorming` ➔ `writing-plans (skeleton-first)` ➔ `using-git-worktrees` ➔ `subagent-driven-development` ➔ `verification-before-completion` ➔ `requesting-code-review` ➔ `finishing-a-development-branch`
  - **Red de seguridad para código heredado:** `brainstorming` ➔ `writing-plans` ➔ `test-driven-development (characterization)` ➔ `systematic-debugging` ➔ `verification-before-completion`


---

## 📋 Resumen de skills compatibles (15 skills principales y escenarios)

Para ayudarte a elegir el skill adecuado, hemos estructurado los 15 skills a lo largo del ciclo de vida del desarrollo de software (SDLC), combinando capacidades principales y escenarios recomendados por la comunidad:

| # | Fase del SDLC | Nombre del skill | Qué hace (propósito y valor principal) | Escenario recomendado |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **🚀 Planificación y diseño** | **`brainstorming`** | **Requisitos y diseño de arquitectura**: Explora opciones y restricciones antes de programar; produce especificaciones de diseño; incluye revisión de IU en el navegador con Visual Companion. | Antes de empezar cualquier funcionalidad nueva o cambio importante; evita saltar directamente al código. |
| 2 | **🚀 Planificación y diseño** | **`writing-plans`** | **Planificación de la implementación**: Descompone las especificaciones en tareas pequeñas y verificables, con skills recomendados y contratos de archivos. | Antes de refactorizaciones multifichero, migraciones complejas o implementaciones grandes. |
| 3 | **💻 Implementación** | **`executing-plans`** | **Ejecución del plan en la sesión**: Ejecuta cada tarea paso a paso en la sesión actual y luego hace una revisión de toda la rama al final. | Ejecución de planes por lotes dentro de la misma sesión sin crear subagentes. |
| 4 | **💻 Implementación** | **`subagent-driven-development`** | **Desarrollo dirigido por subagentes (SDD)**: Despacha subagentes nuevos y aislados por tarea, con revisiones adversariales de doble capa. | Modelo de ejecución recomendado para planes complejos, sin contaminación de contexto. |
| 5 | **💻 Implementación** | **`test-driven-development`** | **Desarrollo guiado por pruebas (TDD)**: Aplica ciclos estrictos de Rojo ➔ Verde ➔ Refactorización para una cobertura sólida. | Al implementar funcionalidades lógicamente difíciles o algoritmos críticos. |
| 6 | **🔍 Depuración** | **`systematic-debugging`** | **Depuración sistemática de causa raíz**: Descompone errores complejos en hipótesis verificables con experimentos de validación. | Ante cualquier error inesperado, fallo de pruebas o bug intermitente. |
| 7 | **🛡️ Calidad y revisión** | **`verification-before-completion`** | **Verificación basada en evidencia**: Exige ejecutar toda la suite de pruebas, el linter y las comprobaciones de tipos. | Antes de afirmar «funciona» o «está listo»; aporta pruebas tangibles de finalización. |
| 8 | **🛡️ Calidad y revisión** | **`requesting-code-review`** | **Inicio de revisiones de código**: Empaqueta diffs e informes para revisiones multidimensionales de arquitectura y calidad. | Antes de fusionar ramas o finalizar tareas, para garantizar la integridad arquitectónica. |
| 9 | **🛡️ Calidad y revisión** | **`receiving-code-review`** | **Gestión de comentarios de revisión**: Evalúa sistemáticamente los comentarios, aplica correcciones y registra las decisiones. | Al abordar hallazgos de revisión de forma sistemática y sin perder contexto. |
| 10 | **🛡️ Calidad y revisión** | **`finishing-a-development-branch`** | **Integración y limpieza de la rama**: Gestiona el PR/merge, limpia los worktrees de Git y elimina ramas temporales. | Cuando pasan todas las verificaciones, para integrar la funcionalidad en la rama principal. |
| 11 | **🌿 Control de versiones** | **`using-git-worktrees`** | **Aislamiento físico con Git**: Crea directorios worktree aislados para funcionalidades o depuración, evitando condiciones de carrera. | Al trabajar en tareas concurrentes o investigaciones paralelas con varios agentes. |
| 12 | **🤖 Agentes avanzados** | **`dispatching-parallel-agents`** | **Orquestación de agentes en paralelo**: Despacha subagentes concurrentes en espacios aislados para investigar varias hipótesis a la vez. | Cuando fallan varias pruebas o se investigan teorías independientes en paralelo. |
| 13 | **🤖 Agentes avanzados** | **`using-superpowers`** | **Fundamentos y disciplina de Superpowers**: Establece la disciplina obligatoria de descubrimiento y carga de skills y las reglas de prioridad. | Se carga automáticamente al iniciar la sesión para imponer los estándares de ingeniería. |
| 14 | **🤖 Agentes avanzados** | **`writing-skills`** | **Creación y mantenimiento de skills**: Guía la creación, prueba y empaquetado de nuevos skills de Superpowers. | Al crear skills personalizados o mejorar las instrucciones existentes. |
| 15 | **🤖 Agentes avanzados** | **`diagnosing-superpowers`** | **Forense de sesiones e informes**: Reconstruye qué falló en una sesión a partir de transcripciones en disco con evidencia citada; prepara paquetes depurados e issues de GitHub. | Cuando una sesión se desvió y necesitas evidencia del porqué, o un informe para los mantenedores. |

## 🆕 Novedades recientes

### v6.4.4 (versión actual)

- **Corrección CodeQL y parche de seguridad (2026-09-28)**:
  - El análisis de código queda en **0 abiertos / 7 corregidos**: se cerraron las 3 alertas reportadas contra v6.4.3 en `src/setup-runner.ts` (detalles en [SECURITY.md](SECURITY.md)).
  - **Corrección ReDoS en TOML**: las regex de detección de tablas entrecomilladas se sustituyeron por escáneres lineales — las líneas de configuración adversas ya no provocan backtracking polinómico; el comportamiento fail-closed no cambia.
  - **Guardia contra prototype pollution**: los segmentos `serverPath` del JSON anidado (los usa el target `openclaw`) ahora rechazan `__proto__` / `constructor` / `prototype` y claves no identificadoras antes de escribir.
  - Sin cambios para configuraciones válidas; verificación: `npm test` en verde (base **389/389**), `tsc` limpio, `npm audit` 0 vulnerabilidades.

### v6.4.3

- **Target Codex y limpieza de docs (2026-09-28)**:
  - Nuevo target `codex`: `setup --target codex` escribe `~/.codex/config.toml` (`[mcp_servers.superpowers]`) con fusión TOML sin dependencias; soporta `--dry-run` / `--backup` / `--bun` / `--remove`.
  - Nuevos targets `openclaw` / `goose`: el primero escribe `~/.openclaw/openclaw.json` (`mcp.servers`); el segundo el bloque `extensions` del `config.yaml` de goose (se preservan `enabled`/`timeout`/`envs` del usuario).
  - Eliminado el bloque TIP redundante de transparencia del setup (duplicaba el encabezado); los detalles de seguridad quedan en Advanced Flags y SECURITY.md.
  - `docs/desktop-setup.md` ahora es la guía de importación en inglés para ChatWise y Cherry Studio (`setup --print-config`); LM Studio / Roo Code siguen en la tabla de un clic. Eliminada la nota obsoleta de "opciones sin publicar" (`lmstudio`, `roo` y `--print-config` se publicaron en v6.3.9).
  - Publicados la navegación en 7 idiomas (nuevos README ES / PT-BR / HI), las guías de skill-composition ES / PT-BR / HI y la corrección de negritas adyacentes a CJK.
  - MiniMax Code Desktop figura como (configuración manual) (ruta sin verificar).
  - Verificación: `npm test` en verde, base ahora 389/389 (+17 casos setup-target), `npm audit` 0 vulnerabilidades.

### v6.4.2

- **Auditoría de seguridad y revisión de código v6.4.2 (2026-09-24)**: se cerraron los hallazgos de auditoría en el servidor MCP, los scripts de configuración, el pipeline de compilación y el arnés de pruebas (detalles en [SECURITY.md](SECURITY.md)).
  - **Recorrido de rutas e higiene de errores**: los nombres de skill se decodifican *antes* de la validación contra la lista permitida, por lo que cargas con doble codificación `..%2f` / `%2e%2e` se rechazan con `InvalidParams`; las herramientas y prompts desconocidos ahora devuelven errores `InvalidParams` accionables en lugar de `MethodNotFound`.
  - **Defensa TOCTOU y contra rutas destructivas**: las rutas canónicas se verifican de nuevo tras comprobar symlinks, la limpieza de caché está protegida por el manifiesto de copia (los skills propios del fork nunca se eliminan) y los registros de drift/coverage se escriben de forma atómica con archivo temporal + rename.
  - **Compilaciones sin carreras y sincronización tolerante**: la compilación de `out/setup.js` usa bloqueo exclusivo con revalidación de staleness por mtime, la salida en modo watch recibe chmod ejecutable y las fuentes upstream faltantes terminan limpiamente en lugar de generar falsos drifts.
  - **Arnés de pruebas honesto**: un watchdog con ref más manejadores `exit`/`close` del servidor terminan los bloqueos silenciosos, las pruebas de drift se ejecutan con protección de red y los saltos por privilegios limitados ya no cuentan como aprobados — el piso de regresión se mantiene en **365/365** aserciones.

### v6.4.1

- **Sincronización upstream con obra/superpowers v6.4.1**:
  - **Ejecución nativa del plan en línea**: el `executing-plans` reescrito ejecuta todo el plan con los nuevos ayudantes `task-start` / `task-done` y luego hace una sola revisión de toda la rama, sin check-ins intermedios.
  - **Nuevo skill: `diagnosing-superpowers`**: forense de sesiones desde transcripciones en disco con evidencia citada, además de paquetes depurados y borradores de GitHub issues (15 skills en total).
  - **Comportamiento de revisión**: califica el comportamiento no especificado según la expectativa razonable del usuario, lista `Declined to judge`, `BASE_SHA` vía `git merge-base origin/main HEAD`.
  - **Foco de revisión del plan**: nueva sección de plantilla y elemento de autorrevisión que vinculan los casos borde implícitos en la spec con sus tareas responsables.
  - **Nuevas referencias de plataformas**: asignaciones de herramientas de Muse y Claude Code; se conservan las refs de Devin/OpenCode.
  - Los scripts se invocan a través de su intérprete (`bash` / `node`) para que el empaquetado del marketplace no los rompa.
- **Paridad en Windows y piso de regresión**:
  - Nuevos ports `task-start.ps1` / `task-done.ps1` con suites de simetría sh/ps1.
  - Se conserva todo el contenido durable de los PR adoptados (libro Discoveries, contrato de archivos de revisión, scripts greenfield, seguridad remota); baseline de drift regrabada con cero drift.
- **Auditoría de seguridad integral y piso de regresión automatizado** ([`SECURITY.md`](SECURITY.md)):
  - 100 % verificado en **365 aserciones de pruebas automatizadas** (Node.js 170, Bash 67, PowerShell 128), 0 vulnerabilidades, 0 secretos hardcodeados.
  - El `task-done` en línea ejecuta las pruebas elegidas por el operador como argv (`"$@"` / `& $exe @rest`), no como shell; el texto del libro es solo informativo.
  - `diagnosing-superpowers` es de solo lectura local y exportación controlada; la redacción es best-effort — revisa cada archivo antes de compartirlo.
  - La exportación de hallazgos diferidos ahora incluye `Final: minor (deferred):` sin contar parked de líneas de finalización.
  - La configuración local de Devin (`.devin/`) está en gitignore.

### v6.3.10

- **Resolución de conflictos de claves de configuración universales y preservación sin pérdidas**:
  - Descubre automáticamente declaraciones existentes en claves reconocidas (`servers`, `mcp`, `mcpServers`), evitando configuraciones duplicadas en conflicto.
  - Fusiona y preserva con seguridad los campos creados por el usuario (`env`, `cwd`, `disabled`, `alwaysAllow`, `args`) al reinstalar.
  - Elimina estados contradictorios entre flags opuestas (`disabled: true` frente a `enabled: true`).
  - Rechaza flags desconocidas y argumentos posicionales inesperados con código de salida 1; estandariza en `process.exitCode` para no truncar la salida en pipes Unix.
- **Verificación de caché del motor de skills con stat rápido y protección de época de escaneo**:
  - Implementa verificación rápida con un solo stat (`dev`, `ino`, `size`, `mtimeMs`) en rutas cacheadas, invalidando al instante si los symlinks redirigen sin reescanear todo el árbol.
  - El `scanEpoch` monotónico creciente y el reinicio de `loadingEpoch` en `clearCache()` impiden que escaneos async pendientes repueblen cachés vaciadas.
  - La verificación con descriptor de archivo autoritativo (`readFileNoFollow`) evita intercambios de descriptor TOCTOU.
- **Robustez y deduplicación de plantillas de prompts MCP**:
  - Se detiene con `McpError(ErrorCode.InternalError)` y diagnóstico estructurado en stderr cuando faltan plantillas o están vacías.
  - Rastrea sustituciones aplicadas con `appliedInterpolations`, evitando anexos redundantes de argumentos.
- **Auditoría de seguridad integral y piso de regresión automatizado**:
  - 100 % verificado en **292 aserciones de pruebas automatizadas** (Node.js 163, Bash 35, PowerShell 94), 0 vulnerabilidades, 0 secretos hardcodeados.

### v6.3.9

- **Defensa permanente contra ReDoS (CodeQL Alert #4 resuelto)**:
  - Reemplazó el backtracking ambiguo de regex en el parseo YAML (`updateYamlConfig`) con coincidencia de prefijo sin ambigüedad y `String.prototype.trim()` nativo.
  - Añadió escaneo lineal `extractInlineComment` ($O(N)$), evitando backtracking polinómico con entradas rellenas de espacios largos. CodeQL Alert #4 (`js/polynomial-redos`) formalmente cerrado.
  - Añadida suite de regresión en `tests/setup_test.js` que valida procesamiento lineal (<1 ms) contra 60 000 espacios.
- **Expansión de clientes (17 clientes de agentes IA)**:
  - Añadidos objetivos para **LM Studio** (`lmstudio`, `~/.lmstudio/mcp.json`) y **Roo Code** en VS Code Desktop (`roo`, `rooveterinaryinc.roo-cline/settings/mcp_settings.json`) en macOS, Windows y Linux.
  - Parser YAML mejorado para preservar comentarios en línea en `mcp_servers:` y `superpowers:`.
- **Herramientas de importación de escritorio e integridad del exit code**:
  - Añadido `setup --print-config` (opcional `--bun`) para salida JSON limpia para importación en clientes de escritorio (ChatWise, Cherry Studio, etc.) sin escribir archivos.
  - La delegación de setup en `src/server.ts` ahora preserva el `process.exitCode` de los comandos CLI.
- **Guía de configuración de escritorio**:
  - Añadida la guía completa [`docs/desktop-setup.md`](docs/desktop-setup.md) para LM Studio, Roo Code, ChatWise y Cherry Studio.

👉 *Para el historial completo de versiones, consulta [CHANGELOG.md](CHANGELOG.md).*

---

## 🙏 Agradecimientos

Este proyecto es un fork y adaptación del proyecto original [Superpowers](https://github.com/obra/superpowers) de [obra](https://github.com/obra). Agradecemos su trabajo pionero en la definición del framework de skills agénticas y la metodología de desarrollo que impulsa este servidor MCP.
