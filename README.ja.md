# Superpowers MCP Toolpack 使用ガイド

[English](README.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

[![Version](https://img.shields.io/badge/version-6.2.2-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

このドキュメントは、オリジナルの Superpowers スキルライブラリを独立した MCP Toolpack にパッケージ化するための情報と使用手順をまとめたものです。

---

## 🚀 インストールと使用方法

### サポート環境

**Antigravity**、**Cursor**、**VSCode**、および MCP ツールチェーンをサポートするその他の AI エディター。

### AI エージェントとの対話

インストールまたは設定が完了すると、AI エージェント（Copilot や Antigravity Cascade など）が `Superpowers Skills` を認識できるようになります。

**次のように質問できます：**

- 「すべての superpowers スキルを一覧表示して」
- 「read_skill で brainstorming スキルを読み込んで、この機能の実装を分析して」
- 「session-start プロンプトを適用して」（元の起動注入メカニズムをシミュレート）

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
  - **使用方法**: 定義済みの計画をタスクごとに実行します。システムはタスクごとに新しい「実装」サブエージェントを生成し、その後、統合された **タスクレビューアー**（仕様準拠 + コード品質）サブエージェントと、最後に **全ブランチ最終レビュー** を実行します。**Pre-Flight Plan Review** は、実行開始前のタスク競合をスキャンします。
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

### v6.2.0（最新）
- **上流 obra/superpowers v6.2.0 との同期**：ローカルのセキュリティ強化と PowerShell ヘルパーを保持したまま、全スキルに上流の改善を同期しました。
  - **subagent-driven-development 再構築**：プラン単位のワークスペース（`.superpowers/sdd/<plan>/`）を採用し、並行プラン間で成果物の読み書きが干渉しない構造になりました。再開可能な review-fix ループに 5 ラウンドのサーキットブレーカーを内蔵し、修正後の再レビュー専用の `re-review-prompt.md` を追加。
  - **test-driven-development**：`testing-anti-patterns.md` が上流の `writing-good-tests.md` に置き換わりました。
  - **finishing-a-development-branch**：上流の書き直し版を採用（ローカルで先行適用していた worktree パス取得の修正と同等の内容を含む。ブランチ破棄は明示的な要求がある場合のみ実行）。
  - **スキル全体の圧縮**：多くの `SKILL.md` から recap セクションや説得文を削除し、プロンプトのトークン使用量を削減。
  - **gemini-tools.md**：上流の更新版に復元。`visual-companion.md` に Gemini CLI 起動セクションを追加。
- **PowerShell パリティ修正**：
  - すべての SDD `.ps1` スクリプトを新しいプラン単位の `PLAN_FILE` インターフェースに移植。`find-polluter.ps1` に bash 版の `./` プレフィックス対応と `**/` 折りたたみ修正を移植。
  - **終了コードの一致**：`$ErrorActionPreference = "Stop"` 下で `Write-Error` が終了エラー化し、意図した終了コードが飲み込まれる問題を修正 — 検証失敗は正しく 2、タスク未検出は 3 を返し、bash スクリプトと一致。
  - **`sdd-workspace.ps1` のスラッグ導出**：任意の拡張子ではなく末尾の `.md` のみを除去（bash の `basename` と一致）。
- **バージョン統一**：`package.json`、`package-lock.json`、MCP サーバーのハンドシェイクバージョンを 6.2.0 に統一。

### v6.0.3
- **コマンドインジェクション修正**: `server.cjs` の `BRAINSTORM_OPEN_CMD` 起動パスを `cp.exec()` から `cp.execFile()` に変更。旧コードは環境変数と URL をシェル経由で連結していましたが、新しいコードは argv 配列として引数を渡し、環境変数の内容に関係なくシェルメタキャラクタインジェクションを排除します。
- **依存関係のセキュリティ（overrides）**: `package.json` に `overrides` ブロックを追加し、推移的依存関係の最低バージョンを強制：
  - `@hono/node-server`: 1.19.14 → **2.0.11** — エンコードされたバックスラッシュを介した serve-static の Windows パストラバーサルを修正（[GHSA-frvp-7c67-39w9](https://github.com/advisories/GHSA-frvp-7c67-39w9)）
  - `fast-uri`: 3.1.2 → **4.1.1** — IDN 正規化によるホスト混乱（[GHSA-4c8g-83qw-93j6](https://github.com/advisories/GHSA-4c8g-83qw-93j6)）とリテラルバックスラッシュオーソリティデリミタ（[GHSA-v2hh-gcrm-f6hx](https://github.com/advisories/GHSA-v2hh-gcrm-f6hx)）を修正
  - `body-parser`: 2.2.2 → **2.3.0** — 無効な limit 値がサイズ制限を静かに無効にする DoS を修正（[GHSA-v422-hmwv-36x6](https://github.com/advisories/GHSA-v422-hmwv-36x6)）
- **アップストリームバグ修正**:
  - `find-polluter.sh`: `./` プレフィックス付きパスを受け入れ、パターン内の `**/` を折りたたむことでトップレベルのテストファイルをサポート
  - `finishing-a-development-branch/SKILL.md`: Step 5 がディレクトリを変更する前に `WORKTREE_PATH` をキャプチャし、クリーンアップのリグレッションを修正。Option 2 に detached HEAD プッシュバリアントを追加

### v6.0.2
- **モジュールリファクタリングとパフォーマンス向上**:
  - **疎結合アーキテクチャ**: ファイルシステムアクセス、メタデータキャッシュ、解析ロジックを専用の [`src/skills-manager.ts`](src/skills-manager.ts) に抽出し、[`src/server.ts`](src/server.ts) は MCP プロトコル処理に専念
  - **O(1) マップベースキャッシュ**: $O(N)$ の二重配列スキャンを、大文字小文字を区別しないデュアルキー（名前とディレクトリ名）のメモリキャッシュに置き換え、高速な $O(1)$ ルックアップを実現
  - **非同期 I/O パイプライン**: 同期ファイル API 呼び出しを Promise と `Promise.all` の並行実行に置き換え、高スループットを実現
  - **Markdown キャッシュ**: メモリ内でストリップ済みスキルコンテンツをキャッシュし、ツールが頻繁に呼び出されたときの反復ディスク読み取りを回避
- **セキュリティ強化**:
  - **ReDoS 防止**: 正規表現ベースの frontmatter パーサーを安全な行単位ステートマシンパーサーに置き換え、CPU 枯渇リスクを完全に排除し、複数行の YAML 説明をサポート
  - **パストラバーサルシールド**: スキル名入力に厳格な英数字ホワイトリスト（`/^[a-zA-Z0-9-_]+$/`）を追加
  - **ディレクトリインジェクションチェック**: `SKILLS_PATH` を検証し、潜在的に敵対的なシステムルートフォルダを積極的に拒否
  - **パスとユーザー名漏洩防止**: ネイティブファイルシステムエラーをキャッチし、パスを含まない汎用の `McpError` にマスク
  - **Windows ビルドとスクリプトの安全性**: `esbuild.js` で Windows `chmodSync` プラットフォームチェックを処理し、`copy-skills.js` でシンボリックリンクをスキップして再帰的ファイルコピーループを防止

- **アップストリームセキュリティ適用**: obra/superpowers v6.1.1 からのセキュリティ強化を適用：
  - **WebSocket フレームサイズ検証**: `decodeFrame()` に `MAX_FRAME_PAYLOAD_BYTES（10 MB）` チェックを追加（CWE-789）
  - **ハードリンク封じ込め**: `isRegularFileInsideContentDir()` に `stat.nlink !== 1` チェックを追加
  - **`escapeHtmlText()` の抽出**: インラインの `escHtml` クロージャを再利用可能な名前付き関数として抽出
  - **URL 解析のリファクタリング**: `pathnameOf()` と `queryKey()` ヘルパーを抽出
- **`review-package` パス解決修正**: `sdd-workspace` の呼び出しを絶対パス解決に修正
- **Windows ネイティブヘルパースクリプト**: Visual Companion、SDD review/task、systematic-debugging の PowerShell ラッパーを追加
- **スキルドキュメント拡張**:
  - `subagent-driven-development`: 計画競合処理のための `plan-mandated` レビューガイダンスを追加
  - `writing-skills`: 言葉遣いテストの実証的証拠で禁止対レシピガイダンスを強化
  - `test-driven-development`: テーブル書式を修正
  - `writing-skills/anthropic-best-practices`: 画像 CDN URL を更新
- **`helper.js` コメント調整**: 動作を変更せずに 4 つのインラインコメントを追加
- **クリーンアップ**: 廃止された `walkthrough.md` を削除

### v6.0.1
- **セキュリティ修正 — Reflected XSS (#2)**: `server.cjs` のサーバー側反射型 XSS を修正。`bootstrapPage()` がユーザー指定の `keyFromQuery` パラメータを使用していたのを、サーバー側の `TOKEN` 定数を使用するよう変更

### v6.0.0
- **obra/superpowers v6.1.1 とのアップストリーム同期**: 全スキルにわたるアップストリームの改善を大規模同期
- **subagent-driven-development 再設計**: 2 段階レビューを統合した「タスクレビューアー」に変更、全ブランチ最終レビューを追加、Pre-Flight Plan Review を新設
- **using-superpowers 簡素化**: プラットフォーム固有のセクションを削除し、プラットフォーム別リファレンスファイルを導入
- **brainstorming Visual Companion**: ジャストインタイム提供に変更
- **型安全性とコード品質**: `Record<string,string>` キャストを修正、残りの `innerHTML` を安全な DOM メソッドに置き換え

### v5.1.2
- **セキュリティ強化**: `helper.js` の最後の `innerHTML` 使用を安全な DOM 作成メソッドに置き換え
- **依存関係セキュリティ**: hono を `4.12.23` から `4.12.26` にアップグレード

### v5.1.1
- **セキュリティ監査と強化**: 本格的なセキュリティ監査を実施、`.gitignore` ルールを更新
- **脆弱性修正**: `helper.js` の XSS を修正、`path-to-regexp` を `8.4.2` にアップグレード

### v5.1.0
- **インラインセルフレビュー**: サブエージェントレビューループを軽量なインラインセルフレビューチェックリストに置き換え
- **Git Worktree 再設計**: `detect-and-defer` メカニズムで書き換え
- **トークン最適化**: すべてのスキルから `Integration` セクションを削除
- **統合**: 独立した `code-reviewer` エージェントを `requesting-code-review` に統合

### v4.3.2
- **セキュリティ**: brainstorming Visual Companion の XSS 脆弱性を修正
- **ドキュメント**: README と SECURITY を正確なバージョン情報で更新

### v4.3.0
- 初期 MCP サーバー実装
- オリジナルの Superpowers から 14 のコアスキルを移行

---

## 🙏 謝辞

このプロジェクトは、[obra](https://github.com/obra) によるオリジナルの [Superpowers](https://github.com/obra/superpowers) プロジェクトのフォークおよび適応です。この MCP サーバーの基盤となるエージェンティックスキルフレームワークとソフトウェア開発方法論を定義してくれた彼らの仕事に感謝します。
