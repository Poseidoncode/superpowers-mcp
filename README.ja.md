# Superpowers MCP Toolpack 使用ガイド

[English](README.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

[![バージョン](https://img.shields.io/badge/version-6.3.10-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
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
| **Resources** | 14 個の Skill URI + 1 ガイド | `skill://superpowers/<skill-name>` と `guide://superpowers/skill-compositions` |

### AI エージェントとの対話（基本操作）

インストールまたは設定後、MCP クライアントは Superpowers の tools、prompts、resources を検出できます。MCP prompt はユーザーが選択して起動し、その後エージェントが指示に従って `read_skill` を呼び出します。

**基本的な対話例：**
- **エンジニアリング規律の初期化**：「`session-start` プロンプトを適用して」（Superpowers のルールとコンテキストを注入）
- **利用可能なスキルの確認**：「すべての superpowers スキルを一覧表示して」
- **単一スキルの読み込み**：「`read_skill` で `brainstorming` スキルを読み込んで要件を分析して」

---

## ⚡ ターゲット指定型・ワンクリック設定 (Targeted One-Click Setup)

環境への不要な変更を避け、必要な環境だけに導入できるよう、**明示的なターゲット指定とプライバシーを尊重**したワンクリック設定を提供しています。

> [!NOTE]
> **任意のディレクトリから実行可能**: 本リポジトリを事前にクローンしたり、特定のフォルダに移動したりする必要はありません。ターミナルの**任意の場所**から以下のコマンドを直接実行できます。インストーラーがユーザーホームディレクトリ（`~`）を基準にグローバル設定ファイルを自動検出し、すべてのワークスペースで即座に有効化します。

デスクトップ向け設定：[LM Studio、Roo Code、ChatWise、Cherry Studio](docs/desktop-setup.md)。新しい CLI オプションは npm 未公開です。公開まではガイドのローカルコマンドを使用してください。

> [!TIP]
> **透明性と環境保護の原則**: Superpowers は、選択されていない他のエディタを勝手にスキャンしたり一括変更したりすることは決してありません。使用する AI ツールに合わせて専用コマンドを実行するだけで、**アトミック書き込み技術**により設定を安全に統合します（クラッシュ時破損ゼロ、**デフォルトで `.bak` ファイル等のゴミを残さない完全クリーン仕様**、既存の他 MCP サーバーには影響なし）。

### 1. お使いの AI Agent / エディタを選択（一発設定）

ご利用の環境に合わせて、以下のコマンドをターミナルで実行してください：

| Harness / クライアント | 対応 OS | ワンクリック設定コマンド | 設定ファイルの場所 |
| :--- | :--- | :--- | :--- |
| **LM Studio** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target lmstudio` | `~/.lmstudio/mcp.json` |
| **Roo Code (VS Code Desktop)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target roo` | `.../rooveterinaryinc.roo-cline/settings/mcp_settings.json` |
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

複数ステップの複雑なタスクには、以下の**対話型ワークフローランチャー**を使用してください。設計、計画レビュー、ブランチ完了時にはユーザーの判断を待つため、サーバー側の無人自動化ではありません（詳細：[`docs/skill-compositions.ja.md`](docs/skill-compositions.ja.md)）。

### 1. エンドツーエンド新機能開発パイプライン (Feature Development Pipeline)
```
brainstorming ➔ writing-plans ➔ using-git-worktrees ➔ subagent-driven-development (TDD) ➔ verification-before-completion ➔ requesting-code-review ➔ finishing-a-development-branch
```
- **起動方法：**MCP Prompts メニューから `feature-pipeline` を選択し、必須の `feature_name` と任意の `requirements` を入力します。
- **特徴：** 要件明確化 (Spec) ➔ 計画分解 (Plan) ➔ Worktree 分離 ➔ 独立サブエージェント＋TDD 実装 ➔ フルテスト検証 ➔ 敵対的コードレビュー ➔ ブランチ完了。

### 2. 構造化トラブルシューティングパイプライン (Structured Troubleshooting Pipeline)
```
systematic-debugging ➔ using-git-worktrees ➔ dispatching-parallel-agents ➔ test-driven-development ➔ verification-before-completion ➔ requesting-code-review ➔ finishing-a-development-branch
```
- **起動方法：**MCP Prompts メニューから `structured-debug` を選択し、問題または失敗テストを入力します。
- **特徴：** 根本原因の仮説分解 ➔ Worktree 隔離並行調査 ➔ 複数エージェント検証 ➔ 失敗テスト作成・修正 ➔ 完全な回帰検証 ➔ レビュー指摘解決 ➔ ブランチ完了。

### 3. 動的ワークフローガイド (Dynamic Workflow Guide)
- **起動方法：**`skill-composition` を選択してリファクタリング、移行、レガシーコード向けの推奨手順を取得します。これらには現在、専用ランチャー prompt はありません。
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

### v6.3.10（最新）

- **ユニバーサルセットアップエンジンのキー名衝突解消とユーザー設定の無損失保持**：
  - 既存の `servers`、`mcp`、`mcpServers` を自動探索し、異なる AI Client 間で競合する重複設定ブロックが作成されるのを防止。
  - 再インストール時にもユーザー独自の `env`、`cwd`、`disabled`、`alwaysAllow` 等のフィールドを安全にマージし無損失で保持。
  - `disabled: true` と `enabled: true` が矛盾して併存する不正状態を確実に排除。
  - コマンドライン引数を厳格に検証し、未定義の位置引数を拒絶（終了コード 1）。唐突なプロセス終了を `process.exitCode` に統一し、パイプラインでの非同期 I/O 切り捨てを防止。
- **コアスキルエンジンの単一 Stat スナップショット検証と世代シールド**：
  - キャッシュ検証に単一 `fs.stat` スナップショット比較（`dev`, `ino`, `size`, `mtimeMs`）を採用。シンボリックリンクやファイルが差し替えられた場合は即座にキャッシュを無効化（全ディレクトリ走査不要）。
  - `clearCache()` で単調増加の `scanEpoch` を進め `loadingEpoch` をリセットすることで、非同期遅延スキャンによるキャッシュリセット後の上書き汚染を防止。
  - オープン済み記述子の Inode 検証（`readFileNoFollow`）により TOCTOU 記述子差し替えを排除。
- **MCP Prompt テンプレートの堅牢性と重複展開排除**：
  - テンプレートファイルが空または存在しない場合、構造化 `stderr` 診断を出力し標準 `McpError(ErrorCode.InternalError)` をスロー。
  - `appliedInterpolations` により置換済みプレースホルダーを追跡し、多重の引数末尾追加を防止。
- **包括的セキュリティ監査と回帰テスト基盤**：
  - 全テストスイート **292 件の自動化アサーション**（Node.js: 163、Bash: 35、PowerShell: 94）が 100% 合格、脆弱性ゼロ・機密漏洩ゼロを確認。

### v6.3.9

- **完全な ReDoS 防御（CodeQL Alert #4 の解決）**：
  - YAML 解析（`updateYamlConfig`）の多項式バックトラック正規表現を明確なプレフィックス一致とネイティブ `String.prototype.trim()` に置換。
  - `extractInlineComment` 線形スキャナー（$O(N)$）を導入し、長大な空白入力時のバックトラックを防止。GitHub CodeQL Alert #4（`js/polynomial-redos`）の解決を遠隔解析で確認。
  - `tests/setup_test.js` に 60,000 文字の空白パディングストレステストを追加し、線形時間（<1ms）での処理を保証。
- **クライアント対応の拡張（17 種類の AI Agent クライアントをサポート）**：
  - **LM Studio**（`lmstudio`、`~/.lmstudio/mcp.json`）および VS Code Desktop 版 **Roo Code**（`roo`、`rooveterinaryinc.roo-cline/settings/mcp_settings.json`）のターゲットを追加。
  - YAML パーサーを強化し、`mcp_servers:` および `superpowers:` 宣言のインラインコメントやファイルヘッダーコメントを保持。
- **デスクトップ向け設定エクスポートと終了コードの整合性**：
  - `setup --print-config`（`--bun` 対応）を追加し、ChatWise や Cherry Studio などのデスクトップクライアントへ無変更でインポート可能な JSON を出力。
  - `src/server.ts` の setup 委任において `process.exitCode` を保持し、非ゼロ終了コードの握りつぶしを防止。
- **デスクトップセットアップガイド**：
  - LM Studio、Roo Code、ChatWise、Cherry Studio の設定手順を解説した [`docs/desktop-setup.md`](docs/desktop-setup.md) を追加。

### v6.3.8

- **実行可能な対話型ワークフローランチャー**：
  - `feature-pipeline` と `structured-debug` は、ステージごとに明示的な `read_skill` 呼び出しを示し、必要なユーザー承認ゲートを保持し、実行が MCP サーバー内ではなくクライアント Agent 側で行われることを明記します。
  - マルチ Agent 対応 Host では Subagent を使い、非対応 Host では利用できない機能を称することなくインラインまたは逐次実行にフォールバックします。
  - `read_skill` はスキル名単体と、文書化された `superpowers:` プレフィックスの両方を受け付けます。
  - Skill Compositions ガイドを npm パッケージに含め、`guide://superpowers/skill-compositions` からも参照できます。
- **ユニバーサルセットアップエンジンの並行安全性・Inode 防御・シンボリックリンク脱出防止**：
  - **Allowed Roots 境界隔離**：設定の書き込み先を明示的な許可ルート（`homeDir`、`appData`、`localAppData`）内に限定し、親ディレクトリシンボリックリンク経由の脱出攻撃を遮断。
  - **楽観的並行競合検知**：アトミックな `fs.renameSync` の直前にディスク内容と `expectedContent` を照合し、マルチプロセス競合による新しい設定の上書きを防止。
  - **ディレクトリ Inode & Dev TOCTOU 防御**：一時ファイル書き込み前後でディレクトリのデバイス ID と inode を検証し、ディレクトリ差し替え攻撃を無効化。
  - **Fail-Closed 厳格構文検証**：JSON のルートまたはサーバー項目が Plain Object でない場合は即座に拒絶し、プロトタイプ汚染を防止。
- **コアスキルエンジンの確定性ソートと動的キャッシュ再検証**：
  - **確定性ディレクトリ走査と衝突防止**：ディレクトリをアルファベット順に確定ソートし、競合キーを即座に検知して重複を安全にスキップ。
  - **自動キャッシュ再検証 (`CACHE_REVALIDATE_MS = 1000`)**：ディスクの変更を 1 秒以内に自動検知・同期し、サーバー再起動なしで編集を反映。
  - **大文字小文字フォールディングと正規パス防御**：`src/server.ts` が darwin/win32 で大文字小文字フォールディングと `fs.realpathSync` を実行し、システム保護ディレクトリを確実に遮断。
- **RFC 6455 WebSocket プロトコル強化と弾力性ログ圧縮**：
  - `CONTINUATION` (0x00) 分割メッセージの再構築を完全サポートし、制御フレームの分割禁止（`opcode >= 0x8 && !fin`）と非標準 RSV 拡張の排除を徹底。
  - 末尾弾力性ログ圧縮：イベントログが 1 MB 上限に達した際、改行区切りの直近レコードを保持したままローテーションし、履歴の全損を回避。
  - 秘密ファイル記述子を `O_RDWR | O_APPEND | O_CREAT | O_NOFOLLOW` で安全にオープン。
- **Shell および PowerShell スクリプトのコマンドインジェクション防御**：
  - `find-polluter.sh` および `find-polluter.ps1`：配列展開引数受け渡し (`"${TEST_COMMAND[@]}"`、`& $testCommand @testCommandArgs`) と空白セーフな読み込みループにより、シェルインジェクションを根絶。
  - `sdd-workspace`：`cd` 実行前に `CDPATH=''` をリセットし、環境変数によるディレクトリハイジャックを防止。
  - `sdd-workspace.ps1`：BOM なし UTF-8 (`[System.Text.UTF8Encoding]::new($false)`) でプランマーカーを保存し、Unicode パスの完全性を保護。
- **全自動回帰テストの基盤**：
  - テストスイートを **274 の全自動アサーション**（Node.js: 145、Bash: 35、PowerShell: 94）に拡張し、100% の合格率を維持。

👉 *これまでの詳細なリリース履歴については、完全な [CHANGELOG.md](CHANGELOG.md) を参照してください。*

---

## 🙏 謝辞

このプロジェクトは、[obra](https://github.com/obra) によるオリジナルの [Superpowers](https://github.com/obra/superpowers) プロジェクトのフォークおよび適応です。この MCP サーバーの基盤となるエージェンティックスキルフレームワークとソフトウェアエンジニアリングワークフローを定義してくれた彼らの先駆的な仕事に感謝します。
