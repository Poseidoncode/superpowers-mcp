# Superpowers MCP Toolpack 使用ガイド

[English](README.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

[![バージョン](https://img.shields.io/badge/version-6.3.4-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

このドキュメントは、Superpowers スキルライブラリと自律型ワークフローを、独立した高パフォーマンスかつ安全な **Model Context Protocol (MCP)** サーバーにパッケージ化した使用説明書です。

---

## 🚀 インストールと使用方法

### サポート環境とエージェントプラットフォーム

- **MCP ネイティブ AI エディター & IDE**: **Antigravity (AGY)**、**Cursor**、**VSCode**、**Windsurf**、**Claude Desktop / Claude Code**。

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
systematic-debugging ➔ using-git-worktrees ➔ dispatching-parallel-agents ➔ test-driven-development ➔ verification-before-completion ➔ requesting-code-review
```
- **ワンクリック指示：**「`structured-debug` を適用して、次のエラーを調査・修正してください：[エラーログ]」
- **特徴：** 根本原因の仮説分解 ➔ Worktree 隔離並行調査 ➔ 複数エージェント検証 ➔ 失敗テスト作成・修正 ➔ 完全な回帰検証。

### 3. 動的ワークフローガイド (Dynamic Workflow Guide)
- **ワンクリック指示：**「`skill-composition` を適用して、現在の状況 [リファクタリング/移行/レガシーコード保護] の手順を提示してください」
- **特徴：** 大規模リファクタリング、レガシーシステムの安全網構築、オンボーディングに最適なパイプラインを動的に提案。


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

