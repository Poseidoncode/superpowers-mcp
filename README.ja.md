# Superpowers MCP Toolpack 使用ガイド

[English](README.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

[![バージョン](https://img.shields.io/badge/version-6.3.5-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

このドキュメントは、Superpowers スキルライブラリと自律型ワークフローを、独立した高パフォーマンスかつ安全な **Model Context Protocol (MCP)** サーバーにパッケージ化した使用説明書です。

---

## 🚀 インストールと使用方法

### サポート環境とエージェントプラットフォーム

- **AI コードエディター & IDE**: **Antigravity (AGY)**、**Cursor**、**VSCode** (GitHub Copilot)、**VSCode Insiders** (GitHub Copilot)、**Devin Desktop**、**Trae**、**Cline**、**Kilo Code**、**Qoder**、**Kiro**、**MiniMax Code Desktop**、**Codex**。
- **AI デスクトップアプリ & ハーネス**: **Claude Desktop**、**Pi Desktop**、**QwenPaw**、**Hermes Desktop**、**Kimi Work**。
- **セルフホスト & ローカル AI プラットフォーム**: **AnythingLLM**、**LibreChat**。

### 提供される MCP 機能

| プロトコル機能 | 項目 / 数量 | 説明 |
| :--- | :--- | :--- |
| **Tools** | `list_skills`, `read_skill` | 14 種類の Superpowers スキルをオンデマンドで検索・読み込み。 |
| **Prompts** | 9 個のネイティブ Prompts | `session-start`, `feature-pipeline`, `structured-debug`, `skill-composition`, `sdd-implementer`, `sdd-task-reviewer`, `sdd-re-review`, `spec-reviewer`, `plan-reviewer` |
| **Resources** | 14 個の Direct URI | `skill://superpowers/<skill-name>` (MCP 規格に準拠した直接アクセス) |

### AI エージェントとの対話（基本操作）

インストールまたは設定が完了すると、AI エージェントが自動的に `Superpowers Skills` および `Prompts` を認識して呼び出せるようになります。

**基本的な対話例：**
- **エンジニアリング規律の初期化**：「`session-start` プロンプトを適用して」（Superpowers のルールとコンテキストを注入）
- **利用可能なスキルの確認**：「すべての superpowers スキルを一覧表示して」
- **単一スキルの読み込み**：「`read_skill` で `brainstorming` スキルを読み込んで要件を分析して」

---

## ⚡ ターゲット指定型・ワンクリック設定 (Targeted One-Click Setup)

環境への不要な変更を避け、必要な環境だけに導入できるよう、**明示的なターゲット指定とプライバシーを尊重**したワンクリック設定を提供しています。

> [!NOTE]
> **任意のディレクトリから実行可能**: 本リポジトリを事前にクローンしたり、特定のフォルダに移動したりする必要はありません。ターミナルの**任意の場所**から以下のコマンドを直接実行できます。インストーラーがユーザーホームディレクトリ（`~`）を基準にグローバル設定ファイルを自動検出し、すべてのワークスペースで即座に有効化します。

> [!TIP]
> **透明性と環境保護の原則**: Superpowers は、選択されていない他のエディタを勝手にスキャンしたり一括変更したりすることは決してありません。使用する AI ツールに合わせて専用コマンドを実行するだけで、**アトミック書き込み技術**により設定を安全に統合します（クラッシュ時破損ゼロ、**デフォルトで `.bak` ファイル等のゴミを残さない完全クリーン仕様**、既存の他 MCP サーバーには影響なし）。

### 1. お使いの AI Agent / エディタを選択（一発設定）

ご利用の環境に合わせて、以下のコマンドをターミナルで実行してください：

| Harness / クライアント | 対応 OS | ワンクリック設定コマンド | 設定ファイルの場所 |
| :--- | :--- | :--- | :--- |
| **Antigravity (Google DeepMind)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target antigravity` | `~/.gemini/config/mcp_config.json` |
| **Pi Desktop / Pi Agent** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target pi-desktop` | `~/.pi/agent/mcp.json` |
| **Cursor** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target cursor` | `~/.cursor/mcp.json` |
| **GitHub Copilot (VS Code)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target copilot` | `Code/User/mcp.json` *(VS Code `servers` 形式)* |
| **GitHub Copilot (VS Code Insiders)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target copilot-insiders` | `Code - Insiders/User/mcp.json` *(VS Code `servers` 形式)* |
| **Hermes Desktop / Agent** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target hermes` | `~/.hermes/config.yaml` *(Win: `%LOCALAPPDATA%\hermes`)* |
| **Kimi Work / Kimi Code** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target kimi` | `~/.kimi-code/mcp.json` |
| **Claude Desktop** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target claude` | `Claude/claude_desktop_config.json` |
| **Devin Desktop (旧 Windsurf)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target devin` | `~/.config/devin/mcp_config.json` *(または `windsurf`)* |
| **QwenPaw (パーソナル AI ワークステーション)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target qwenpaw` | `~/.qwenpaw/config.json` *(別名: `copaw`)* |
| **Cline (VS Code / CLI)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target cline` | `.../saoudrizwan.claude-dev/settings/cline_mcp_settings.json` |
| **Kilo Code** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target kilo` | `~/.config/kilo/kilo.jsonc` *(自適応 `mcp` 規格)* |
| **Qoder** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target qoder` | `~/.qoder/settings.json` |
| **Kiro** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target kiro` | `~/.kiro/settings/mcp.json` |
| **Trae** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target trae` | `.../Trae/User/mcp.json` *(Trae CN 対応)* |

*(Bun を使用する場合は `--bun` を追加可能、例: `npx -y superpowers-mcp setup --target cursor --bun`)*

---

### 2. Curl または PowerShell 経由での設定

- **macOS / Linux（Curl 経由でターゲット指定）：**
  ```bash
  curl -fsSL https://raw.githubusercontent.com/Poseidoncode/superpowers-mcp/main/scripts/install.sh | bash -s -- --target cursor
  ```

- **Windows（PowerShell 経由でターゲット指定）：**
  ```powershell
  & ([scriptblock]::Create((irm https://raw.githubusercontent.com/Poseidoncode/superpowers-mcp/main/scripts/install.ps1))) -Target cursor
  ```

#### 主な高度なオプション：
- `--dry-run`：ディスクに書き込まず、変更内容をプレビューします。
- `--remove`：指定ターゲットから Superpowers 設定を安全に削除します。
- `--backup`：変更前にタイムスタンプ付き `.bak` バックアップを作成（デフォルトはオフ、クリーン環境を維持）。
- `--bun`：生成されるコマンドで `bunx` を使用します。
- `--target <name>`：対象クライアントの指定（エイリアス対応、例: `code`, `vscode`, `kimi-code`）。

---

## 🛠️ 手動 MCP 設定 (Manual Configuration)

手動で設定を行う場合は、以下の設定を IDE や MCP クライアント（Cursor、Antigravity、VSCode、AnythingLLM など）の設定に追加してください。

### 方法：NPX / BUNX（推奨）

パス解決を自動的に処理するため、最も簡単な方法です。

#### Bun を使用（高速）
```json
{
  "superpowers": {
    "command": "bunx",
    "args": ["-y", "superpowers-mcp"]
  }
}
```

#### Node/NPM を使用
```json
{
  "superpowers": {
    "command": "npx",
    "args": ["-y", "superpowers-mcp"]
  }
}
```

---

## 🔄 スキル構成 & ワークフローパイプライン (Skill Compositions & Pipelines)

複数ステップの複雑なタスクを実行する際は、以下の**ワンクリック・エンドツーエンドパイプライン**を使用してください（詳細ガイド：[`docs/skill-compositions.ja.md`](docs/skill-compositions.ja.md)）：

### 1. エンドツーエンド新機能開発パイプライン (Feature Development Pipeline)
```
brainstorming ➔ writing-plans ➔ using-git-worktrees ➔ subagent-driven-development (TDD) ➔ verification-before-completion ➔ requesting-code-review ➔ finishing-a-development-branch
```
- **ワンクリック指示：**「`feature-pipeline` を適用して、[機能名] の開発を進めてください」
- **特徴：** 要件明確化 (Spec) ➔ 計画分解 (Plan) ➔ Worktree 分離 ➔ 独立サブエージェント＋TDD 実装 ➔ フルテスト検証 ➔ 敵対的コードレビュー ➔ ブランチ完了。

### 2. 構造化トラブルシューティングパイプライン (Structured Troubleshooting Pipeline)
```
systematic-debugging ➔ using-git-worktrees ➔ dispatching-parallel-agents ➔ test-driven-development ➔ verification-before-completion ➔ requesting-code-review ➔ finishing-a-development-branch
```
- **ワンクリック指示：**「`structured-debug` を適用して、次のエラーを調査・修正してください：[エラーログ]」
- **特徴：** 根本原因の仮説分解 ➔ Worktree 隔離並行調査 ➔ 複数エージェント検証 ➔ 失敗テスト作成・修正 ➔ 完全な回帰検証 ➔ レビュー指摘解決 ➔ ブランチ完了。

### 3. 動的ワークフローガイド (Dynamic Workflow Guide)
- **ワンクリック指示：**「`skill-composition` を適用して、現在の状況 [リファクタリング/移行/レガシーコード保護] の手順を提示してください」
- **特徴：** 大規模リファクタリング、レガシーシステムの安全網構築、オンボーディングに最適なパイプラインを動的に提案：
  - **大規模リファクタリング＆移行 (Pipeline 3)：** `brainstorming` ➔ `writing-plans (skeleton-first)` ➔ `using-git-worktrees` ➔ `subagent-driven-development` ➔ `verification-before-completion` ➔ `requesting-code-review` ➔ `finishing-a-development-branch`
  - **レガシーコード安全網 (Pipeline 4)：** `brainstorming` ➔ `writing-plans` ➔ `test-driven-development (characterization)` ➔ `systematic-debugging` ➔ `verification-before-completion`


---

## 📋 サポートされているスキル総覧 (14 のコアスキルと推奨シナリオ)

適切なスキルを迅速に選択できるように、14 のスキルをソフトウェア開発ライフサイクル (SDLC) に沿って分類し、主要な役割と推奨シナリオを統合しました：

| # | 開発フェーズ (Phase) | スキル名 (Skill Name) | 役割とコアバリュー (Purpose & Core Value) | 推奨利用シナリオ (Recommended Scenario) |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **🚀 計画と設計** | **`brainstorming`** | **要件定義と設計探索**：コードを書く前に設計案や制約を明確化し仕様書を作成。Visual Companion による画面レビューも提供。 | 新機能や大幅な改修の開始前。AI がいきなりコードを書き始めるのを防止。 |
| 2 | **🚀 計画と設計** | **`writing-plans`** | **実装計画の作成**：仕様書を独立検証可能なタスク一覧に分解し、Recommended Skill と変更対象を明記。 | 複数ファイルのリファクタリングや複雑な移行作業の前に実行計画を確立。 |
| 3 | **💻 実装と開発** | **`executing-plans`** | **計画の順次実行**：現在のセッションでタスクをステップバイステップで実行し、チェックポイントで検証。 | サブエージェントを起動せず、同一セッション内で計画を順次実行したい時。 |
| 4 | **💻 実装と開発** | **`subagent-driven-development`** | **サブエージェント駆動開発 (SDD)**：タスクごとにクリーンなコンテキストのサブエージェントを起動し、2 段階の対抗的レビューを実施。 | 複雑な計画を実行する際の推奨方式。コンテキスト汚染を防ぎ精度を向上。 |
| 5 | **💻 実装と開発** | **`test-driven-development`** | **テスト駆動開発 (TDD)**：Red ➔ Green ➔ Refactor サイクルを厳格に適用し、テストを伴う高品質なコードを実装。 | ロジックの複雑な機能やコアアルゴリズムの実装時。 |
| 6 | **🔍 デバッグと調査** | **`systematic-debugging`** | **体系的根本原因デバッグ**：エラーを検証可能な仮説に分解し、推測を排して体系的にバグを特定・修正。 | エラー、予期しない動作、再現困難なバグが発生した時。 |
| 7 | **🛡️ 品質とレビュー** | **`verification-before-completion`** | **完了前の証拠検証**：リポジトリ全体のテストスイート、Linter、型チェックを実行して回帰ゼロを確認。 | 「直した」「完了した」と主張する前に、客観的な証拠を提示。 |
| 8 | **🛡️ 品質とレビュー** | **`requesting-code-review`** | **コードレビューの要求**：差分とレポートをパッケージ化し、アーキテクチャと品質の多角的なレビューを依頼。 | ブランチのマージやタスク完了前に、多面的なコード品質検査を実施。 |
| 9 | **🛡️ 品質とレビュー** | **`receiving-code-review`** | **レビュー指摘の処理**：レビューの指摘事項を体系的に評価・修正し、すべての Finding を確実に解決。 | コードレビューのフィードバックを受け、構造的に修正と記録を行う時。 |
| 10 | **🛡️ 品質とレビュー** | **`finishing-a-development-branch`** | **ブランチ完了と整理**：PR/マージ、Worktree の整理、一時ブランチの安全な削除を行いクリーンに完了。 | 機能開発完了後、メインブランチへ安全に統合し作業環境をクリーンアップ。 |
| 11 | **🌿 バージョン管理** | **`using-git-worktrees`** | **Git Worktree の物理的分離**：開発や並行調査用に分離ディレクトリを作成し、ファイル競合や環境汚染を防止。 | 複数タスクを同時に進める場合や、マルチエージェントでの並行デバッグ時。 |
| 12 | **🤖 高度なエージェント制御** | **`dispatching-parallel-agents`** | **並行エージェントディスパッチ**：隔離環境で複数のサブエージェントを並行稼働させ、複数の仮説を同時に検証。 | 複数のテストが同時に失敗し、並行調査で原因特定を加速したい時。 |
| 13 | **🤖 高度なエージェント制御** | **`using-superpowers`** | **基本規律とスキル導入**：適切なスキルを必ず検索・適用するための Superpowers の基本規律を確立。 | セッション開始時に自動読み込みされ、AI の行動規範を規定。 |
| 14 | **🤖 高度なエージェント制御** | **`writing-skills`** | **スキルの作成と管理**：新しい Superpowers スキルの作成、テスト、パッケージ化の標準手順。 | チーム独自の新しいスキルを作成または拡張したい時。 |

---

## 🆕 最近の更新

### v6.3.5（最新）

- **7 つの新しい AI エージェント・エディタ環境のワンクリックインストール対応 (`src/setup-runner.ts`, `scripts/install.sh`)**：
  - 構成エンジンを拡張し、合計 15 種類の AI 開発環境に対応：
    - **GitHub Copilot (VS Code Insiders)**：`Code - Insiders/User/mcp.json`（安定版 VS Code との競合を防ぐ物理パス完全分離、エイリアス: `copilot-insiders`, `vscode-insiders`, `code-insiders`, `insiders`, `insider`）
    - **QwenPaw (パーソナル AI アシスタントワークステーション)**：`~/.qwenpaw/config.json`（`copaw` 互換、エイリアス: `qwenpaw`, `copaw`）
    - **Cline (VS Code / CLI)**：`.../saoudrizwan.claude-dev/settings/cline_mcp_settings.json`（エイリアス: `cline`, `claude-dev`）
    - **Kilo Code**：`~/.config/kilo/kilo.jsonc`（自適応 `"mcp"` ルート仕様、エイリアス: `kilo`, `kilocode`）
    - **Qoder**：`~/.qoder/settings.json`（エイリアス: `qoder`）
    - **Kiro**：`~/.kiro/settings/mcp.json`（エイリアス: `kiro`, `kiro-code`）
    - **Trae**：`.../Trae/User/mcp.json`（macOS、Windows、Linux、Trae CN をクロスプラットフォームでサポート）
  - Kilo Code 固有の辞書形式を適応する `"json-mcp"` フォーマットタイプを追加。
  - `runSetup` を介して `harness.defaultConfig` からテンプレートを注入し、Single Source of Truth (SSOT) を確立。
- **デュアル Subagent によるアーキテクチャおよびコード品質レビュー**：
  - 「アーキテクチャ・セキュリティレビュアー」と「品質・エッジケースレビュアー」の 2 人のエージェントによるレビューを実施。
  - アトミック書き込み（`crypto.randomBytes(8)` + `flag: "wx"`）、シンボリックリンク防御、最小権限（`0o700`/`0o600`）、デフォルトのゼロディスク汚染を完全検証。
  - プロジェクト全体のセキュリティ監査を完了し、[`SECURITY.md`](SECURITY.md) を更新（173 件の自動化アサーション 100% 合格）。
- **テストスイートの大幅拡充 (`tests/setup_test.js`)**：
  - 単元テストを 21 件から 32 件に拡充（100% 合格）。Claude Desktop、Kimi Work、Hermes Desktop のエンドツーエンドサンドボックステストを追加。
- **多言語ドキュメントの同期**：
  - 4 言語すべての README（[`README.md`](README.md)、[`README.zh-TW.md`](README.zh-TW.md)、[`README.ja.md`](README.ja.md)、[`README.ko.md`](README.ko.md)）でサポート環境一覧とコマンドテーブルを同期。
  - [`tests/global_setup_verification.md`](tests/global_setup_verification.md) の残存データを整理。

### v6.3.4

- **Universal One-Click グローバルセットアップエンジン (`src/setup-runner.ts`, `scripts/`)**：
  - 8 大主要 AI 環境（Antigravity、Pi Desktop / Pi Agent、Cursor、GitHub Copilot (VS Code)、Hermes Desktop / Agent、Kimi Work / Kimi Code、Claude Desktop、Devin Desktop）向けの依存関係ゼロのワンクリック自動構成。
  - CLI コマンド `superpowers-setup` および `superpowers-mcp setup` を提供し、クロスプラットフォームのインストーラスクリプト（[`install.sh`](scripts/install.sh) および [`install.ps1`](scripts/install.ps1)）を開発。
  - **明示的同意とアンチウイルス設計 (Explicit Consent & Anti-Virus Design)**：`--target <client>` を必須とし、未承認のディスク自動スキャンや全環境の一括変更を根絶（`--all` を削除）。
  - **アトミック書き込み防御 (`safeWriteConfig`)**：ランダム 8 バイト nonce 一時ファイル、`flag: "wx"`、`renameSync` によるアトミック操作で、ファイル競合や破損を防止。
  - **シンボリックリンク保護と最小特権権限**：`realpathSync` でリンク先を安全に解決。新規ディレクトリは `0o700`、設定ファイルは `0o600` に制限し、バックアップは元のパーミッションを継承。
  - **パラメータインジェクション防御と JSONC 解析**：`JSON.stringify` で安全にエスケープ。コメントや末尾カンマを許容し、`isPlainObject` でプロトタイプ汚染を防御。
  - **CLI Stdio 分離**：`src/server.ts` で setup 引数を事前インターセプトし、MCP プロトコルの stdio 汚染を防止。
  - **自動化テストスイート**：[`tests/setup_test.js`](tests/setup_test.js) を追加（21 テスト 100% 合格）。
- **Skill Compositions スキル合成とエンドツーエンドパイプライン (`src/server.ts`, `docs/`)**：
  - 3 つの新しい MCP ワークフロープロンプトを追加：`feature-pipeline`、`structured-debug`、`skill-composition`。
  - 4 言語による包括的なドキュメント（[`docs/skill-compositions.ja.md`](docs/skill-compositions.ja.md)）と横型 Mermaid フローチャート、ASCII 図を追加。
  - [`skills/using-superpowers/SKILL.md`](skills/using-superpowers/SKILL.md) および [`skills/writing-plans/SKILL.md`](skills/writing-plans/SKILL.md) に `Recommended Skill` メタデータ標準とコントローラー・サブエージェント間プロトコルを追加。
  - [`tests/prompts_compositions_test.js`](tests/prompts_compositions_test.js) を追加（7 テスト 100% 合格）。
- **プロンプトセキュリティ強化とライフサイクルの完結 (`src/server.ts`)**：
  - `interpolateTemplate` を 1 パス正規表現置換にアップグレードし、連鎖的なプレースホルダー展開攻撃を根絶。
  - 全 9 プロンプトに 32 KB 長さクランプと `hasOwnProperty` 検証を適用。
  - `structured-debug` に Stage 6（レビュー修正）と Stage 7（ブランチ整理・完了）を追加。
- **包括的なセキュリティ監査と検証**：
  - `npm audit` で脆弱性 0 を確認。全 5 テストスイート（100+ アサーション）が 100% 合格。[`SECURITY.md`](SECURITY.md) を更新。

### v6.3.3

- **MCP 標準プロンプトサポート (`src/server.ts`)**：
  - 標準プロンプトハンドラーを実装し、IDE プロンプトピッカーで利用可能な 6 つのプロンプト（`session-start`、`sdd-implementer`、`sdd-task-reviewer`、`sdd-re-review`、`spec-reviewer`、`plan-reviewer`）を登録。
- **マルチハーネスリファレンスマッピング**：
  - Devin CLI（[`references/devin-tools.md`](skills/using-superpowers/references/devin-tools.md)）および OpenCode（[`references/opencode-tools.md`](skills/using-superpowers/references/opencode-tools.md)）向けのネイティブツールマッピングを追加。
- **多言語ドキュメントの同期**：
  - 全言語の README で MCP 機能対応表（Tools / Prompts / Resources）およびマルチハーネス対応マトリックスを統一。
- **テストスイートの拡張**：
  - `prompts/list` および `prompts/get` パラメータ注入の自動化テストアサーションを追加。

👉 *これまでの詳細なリリース履歴については、完全な [CHANGELOG.md](CHANGELOG.md) を参照してください。*

---

## 🙏 謝辞

このプロジェクトは、[obra](https://github.com/obra) によるオリジナルの [Superpowers](https://github.com/obra/superpowers) プロジェクトのフォークおよび適応です。この MCP サーバーの基盤となるエージェンティックスキルフレームワークとソフトウェアエンジニアリングワークフローを定義してくれた彼らの先駆的な仕事に感謝します。
