# Superpowers MCP Toolpack 使用ガイド

[English](README.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

[![バージョン](https://img.shields.io/badge/version-6.3.3-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

このドキュメントは、Superpowers スキルライブラリと自律型ワークフローを、独立した高パフォーマンスかつ安全な **Model Context Protocol (MCP)** サーバーにパッケージ化した使用説明書です。

---

## 🚀 インストールと使用方法

### サポート環境とエージェントプラットフォーム

- **MCP ネイティブ AI エディター & IDE**: **Antigravity (AGY)**、**Cursor**、**VSCode**、**Windsurf**、**Claude Desktop / Claude Code**。
- **CLI ツール & 自律型エージェント**: **Devin CLI**、**Hermes Agent**、**OpenCode**、**Kimi CLI**、**Pi CLI**、**Gemini CLI**。

### 提供される MCP 機能

| プロトコル機能 | 項目 | 説明 |
| :--- | :--- | :--- |
| **Tools** | `list_skills`, `read_skill` | 14 種類の Superpowers スキルをオンデマンドで検索・読み込み。 |
| **Prompts** | `session-start`, `sdd-implementer`, `sdd-task-reviewer`, `sdd-re-review`, `spec-reviewer`, `plan-reviewer` | IDE のプロンプト一覧から即座に使用可能なレビュー・サブエージェント協調プロンプト。 |
| **Resources** | `skill://superpowers/<skill-name>` | MCP 規格に準拠した URI ベースのスキルアクセス。 |

### AI エージェントとの対話

インストールまたは設定が完了すると、AI エージェントが自動的に `Superpowers Skills` および `Prompts` を認識して呼び出せるようになります。

**質問例：**

- 「すべての superpowers スキルを一覧表示して」
- 「read_skill で brainstorming スキルを読み込んで、この機能の実装を分析して」
- 「session-start プロンプトを適用して」（Superpowers のコンテキストをセッションに注入）
- 「subagent-driven-development で docs/plans/feature-plan.md の計画を実行して」

---

## 🛠️ MCP 設定

以下の設定を IDE（Cursor、Antigravity、VSCode の MCP 設定など）に追加してください。

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

## 💡 一般的なスキルとシナリオ

| スキル名 | 推奨シナリオ | コアバリュー |
| :--- | :--- | :--- |
| `brainstorming` | 新機能の開始前、要件と設計の探索 | AI が即座にコードを書き始めるのを防ぐ |
| `writing-plans` | 複数ファイルのリファクタリングや複雑な移行の前 | 明確な実行計画を確立 |
| `systematic-debugging` | エラーや異常な動作に遭遇したとき | 推測ではなく「根本原因分析」を強制 |
| `test-driven-development` | 論理的に難しい機能の実装時 | コードにテストが伴うことを保証（Red-Green-Refactor） |
| `verification-before-completion` | 「直した」「完了した」と主張する前 | 証拠に基づく完了確認 |

---

## 🔄 推奨プロンプトシーケンス

### 1. 新機能開発シーケンス
1. 「read_skill で brainstorming スキルを読み込み、要件とアーキテクチャを確認して」
2. 「read_skill で writing-plans スキルを読み込み、具体的なステップを含む実行計画を作成して」
3. 「read_skill で test-driven-development スキルを読み込み、テストを含む機能を実装して」
4. 「read_skill で verification-before-completion スキルを読み込み、テストスイートを実行してすべてが機能することを確認して」

### 2. 緊急ホットフィックスシーケンス
1. 「read_skill で systematic-debugging スキルを読み込み、現在の問題の根本原因を特定して」
2. 「read_skill で test-driven-development スキルを読み込み、バグの失敗テストを作成して修正して」
3. 「read_skill で verification-before-completion スキルを読み込み、適用した修正を検証して」

---

## 📋 サポートされているスキル概要（全 14 個）

適切なスキルを選択しやすくするために、ソフトウェア開発の 6 つの論理フェーズに分類しています。

### 🚀 1. 計画と設計
- `brainstorming`: ソフトウェア設計と要件分析プロセス
  - ブラウザベースのモックアップとデザインレビューのための Visual Companion（ジャストインタイム）
- `writing-plans`: 詳細な実装計画の作成

### 💻 2. 実装とデバッグ
- `executing-plans`: 作成した実装計画の実行
- `test-driven-development`: TDD（テスト駆動開発）ワークフロー
- `systematic-debugging`: 体系的なデバッグと根本原因分析

### 🛡️ 3. 品質とレビュー
- `verification-before-completion`: 完了前の証拠に基づく検証
- `requesting-code-review`: コードレビューの事前チェック開始
- `receiving-code-review`: コードレビューフィードバックの受信と対応
- `finishing-a-development-branch`: 機能ブランチの最終化と統合

### 🌿 4. バージョン管理
- `using-git-worktrees`: Git Worktrees を使用した複数ブランチの管理

### 🤖 5. 高度なエージェント制御

これらのスキルは、サポートされている IDE（Antigravity や Cursor など）内で複雑なメタ実行パターンをオーケストレーションするために設計されています。

- **`subagent-driven-development`**: サブエージェントを駆動してタスクを実行
  - **使用方法**: 定義済みの計画をタスクごとに実行します。システムはタスクごとに新しい「実装」サブエージェントを生成し、その後、統合された **タスクレビューアー**（仕様準拠 + コード品質）サブエージェントと、最後に **全ブランチ最終レビュー** を実行します。**Pre-Flight Plan Review** は、実行開始前のタスク競合をスキャンします。計画は plan-scoped ワークスペース（`.superpowers/sdd/<plan>/`）で実行され、コントローラーは停止せずに衝突を裁定してレジャーに記録（rulings）し、同じ形の小タスクは 1 回のディスパッチにまとめられます。
  - **モデル選択**: タスクの複雑さに基づいてサブエージェントモデルを選択 — 機械的な作業には低コストモデル、アーキテクチャや微妙な並行性変更には高性能モデル。
  - **例**: 「subagent-driven-development スキルを読み込んで、docs/plans/feature-plan.md にリストされているタスクを 1 つずつ実行して」
- **`dispatching-parallel-agents`**: タスクを並列エージェントに派遣
  - **使用方法**: 複数の *独立した* 問題（例：3 つの無関係な失敗テストや 3 つの別々の Web 調査トピック）に取り組むために使用します。AI は並列実行の考え方を採用し、状態を横断したりコンテキスト汚染を経験することなく各タスクに独立して取り組み、出力生成を大幅に高速化します。
  - **デバッグ例**: 「dispatching-parallel-agents スキルを読み込んで、3 つの並列エージェントを派遣して独立して失敗しているテスト A、B、C を調査して」
  - **調査例**: 「dispatching-parallel-agents スキルを読み込んで、React 19 の機能、Vue 3.5 の更新、Svelte 5 の Runes について Web を並列検索して — それぞれ独立して要約して」

### ⚙️ 6. カスタマイズとメタ
- `using-superpowers`: Superpowers 使用のためのガイドラインとセルフチェック
- `writing-skills`: 新しいカスタムスキルの作成と拡張

---

## 🆕 最近の更新

### v6.3.3（最新）

- **MCP 標準プロンプトサポート (`src/server.ts`)**：
  - 標準プロンプトハンドラーを実装し、IDE プロンプトピッカーで利用可能な 6 つのプロンプト（`session-start`、`sdd-implementer`、`sdd-task-reviewer`、`sdd-re-review`、`spec-reviewer`、`plan-reviewer`）を登録。
- **マルチハーネスリファレンスマッピング**：
  - Devin CLI（[`references/devin-tools.md`](skills/using-superpowers/references/devin-tools.md)）および OpenCode（[`references/opencode-tools.md`](skills/using-superpowers/references/opencode-tools.md)）向けのネイティブツールマッピングを追加。
- **多言語ドキュメントの同期**：
  - 全言語の README で MCP 機能対応表（Tools / Prompts / Resources）およびマルチハーネス対応マトリックスを統一。
- **テストスイートの拡張**：
  - `prompts/list` および `prompts/get` パラメータ注入の自動化テストアサーションを追加。

### v6.3.2

- **writing-plans — 2 つのプラン形状（Two Plan Shapes）と骨格優先（Skeleton-First）**：
  - `skills/writing-plans/SKILL.md` に **Two Plan Shapes** ルーターを追加（`task-by-task` デフォルト vs `skeleton-first` 代替案）。
  - 新規 [`skills/writing-plans/skeleton-first-plans.md`](skills/writing-plans/skeleton-first-plans.md) で Walking Skeleton（Task 1 で全サブシステムを貫通する最小稼働スライスを作成）、契約型タスク（Task Contracts、コードを直接書かずに厳密な Consumes/Produces インターフェースと観察可能な検証基準を定義）、`Tier: mechanical | judgment` タグを定義。
- **subagent-driven-development (SDD) — ウェーブディスパッチ（Wave Dispatch）と並列 Worktree プロトコル**：
  - skeleton-first プランに対して **DISPATCH PLAN** を生成し、ファイルの競合がないタスクをウェーブとして並列ディスパッチ。
  - **並列 Worktree プロトコル（Parallel Worktree Protocol）**：独立した `.worktrees/task-<N>` で並行タスクを実行し、プラン順序で順次統合。競合時は自動 rebase と implementer 再開で修正。
  - Step 5 に完了後の `Plan holds` / `Amendment:` チェック行を追加し、進行中タスクの整合性を保ちながら後続タスクに更新された契約を伝播。
- **SDD — Tier 駆動モデルディスパッチ**：
  - SDD ディスパッチャーと `implementer-prompt.md` が `Tier:` 指定（`mechanical` → 経済的な軽量モデル、`judgment` → 標準モデル）を直接適用し、トークンを節約。
- **writing-skills — バイナリ実行セキュリティ強化（`render-graphs.js`）**：
  - `execSync` から `execFileSync('dot', ['-Tsvg'], ...)` に移行してシェルインジェクションを根絶。10MB バッファ上限、Windows CRLF 対応（`\r?\n`）、`winget` インストール案内を追加。
- **テストと検証**：MCP プロトコル、セキュリティ、SDD Bash（11 アサーション）、PowerShell（70 アサーション）、Graphviz レンダリングテストのすべてが 100% 合格。

👉 *これまでの詳細なリリース履歴については、完全な [CHANGELOG.md](CHANGELOG.md) を参照してください。*

---

## 🙏 謝辞

このプロジェクトは、[obra](https://github.com/obra) によるオリジナルの [Superpowers](https://github.com/obra/superpowers) プロジェクトのフォークおよび適応です。この MCP サーバーの基盤となるエージェンティックスキルフレームワークとソフトウェア開発方法論を定義してくれた彼らの仕事に感謝します。
