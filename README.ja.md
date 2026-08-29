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

### v6.3.2（最新）

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

### v6.3.1

- **SDD ワークスペース所有権マーカーと物理パス正規化**：`sdd-workspace`（Bash）と `sdd-workspace.ps1`（PowerShell）は `plan-path` マーカーと物理パス正規化（`pwd -P` および動的 `pwd` 検出）を使用。同名のプラン（`docs/alpha/plan.md` と `docs/beta/plan.md` など）が衝突せず個別の `.superpowers/sdd/` ワークスペースに分離されます。
- **SDD レビューパッケージ範囲ガード**：`review-package` および `review-package.ps1` は `git merge-base --is-ancestor BASE HEAD` とコミット数を検証し、空や逆転した範囲による誤判定（false-pass）を防止。
- **実行権限喪失への耐性**：`task-brief` と `review-package` は `"${BASH:-bash}"` で明示的に呼び出し、アーカイブ解凍等で `+x` 権限が失われても安定して動作。
- **TDD プロジェクトスイート検証フロア**：`skills/test-driven-development/SKILL.md` はタスク完了前にプロジェクト全体のテストコマンド（`npm test`、`pytest` 等）の実行を義務化。
- **Code Review ゴースト変更防止**：`skills/requesting-code-review/SKILL.md` で複数コミットのレビュー起点を `git merge-base origin/main HEAD` に固定。
- **Brainstorming ツールチェーン決定ゲート**：`skills/brainstorming/SKILL.md` の設計提示フェーズでツールチェーン設定を事前に確認し、`Global Constraints` に記録。
- **テスト拡充**：`tests/sdd/test-sdd-workspace.sh`（11 アサーション）を追加、PowerShell スイート（70 アサーション）を拡張。

### v6.3.0

- **上流 obra/superpowers v6.3.0 との同期** — 適用可能な改善をすべて採用し、フォーク固有のセキュリティ強化と PowerShell サポートは維持。
  - **brainstorming — 3 パスルーター**: すべてのリクエストを事前に `spike` / `bounded` / `architectural` に分類し、プロセス量をタスクに合わせて調整。ただし承認ゲートは常に全パスに適用されます。実行中に隠れた複雑さが判明した場合はパスをアップグレード — ダウングレードはありません。
  - **subagent-driven-development — 裁定、停止しない（rulings, not stalls）**: 衝突・曖昧さ・計画の欠陥はコントローラーが直接裁定しレジャーに記録（`Ruling: ...`）。停止するのは明示された 4 条件のみ。Pre-flight 競合スキャンはレジャー表を出力し、同形状の小タスクは単一ディスパッチにバッチ化され、子エージェント待機は境界付きストレッチを使用。3 つのプロンプトすべてに no-subagents 契約を追加。
  - **Hermes Agent サポート**: 新しい `hermes-tools.md` リファレンスがスキルアクションを Hermes ツール（`delegate_task`、`skill_view` など）にマッピング。
  - **Codex**: V1/V2 マルチエージェントの違い、`followup_task` による修正ラウンド再開、イベント購読型 `wait_agent` のガイダンス。
  - **writing-plans**: プランテンプレートに `Spec:` フィールドを追加。
  - **finishing-a-development-branch**: worktree 削除拒否時の手順 — 自分の判断で `--force` しない。
- **デュアルエージェント code review による修正**: merged パスで「Commit them to \<branch\>」を選んでもファイルがベースブランチの外に取り残されない（finishing-a-development-branch）。`sdd-workspace.ps1` のスラッグ導出は全プラットフォームで `basename` と一致（`PLAN.MD` は `PLAN.MD` のまま）。
- **意図的に未採用**: 上流 v6.3.0 のサーバー簡素化（loopback-only バインド、`O_NOFOLLOW` 読み取り、nonce CSP、ローカルブランド SVG の削除）— 本パッケージは強化版サーバーを維持。上流の `.ps1` 削除と plugin-only 再構成もこの MCP サーバー構成には適用されません。
- **テスト**: MCP フロー、render-graphs（8 アサーション）、PowerShell 完全スイート（64 アサーション）すべて合格。

### v6.2.4

- **上流に合わせた brainstorm セッションの永続化**：`--project-dir` 指定時、companion はセッションキーを `.superpowers/brainstorm/.last-token`（オーナーのみ読み取り可、.gitignore 済み）に保存し、`.last-port` と並んで再起動後も再利用します——開いたままのブラウザタブは再起動後も接続を維持し、URL の再共有は不要です。一時 `/tmp` セッションでは従来どおり起動ごとにキーをローテーションします。明示的な `BRAINSTORM_TOKEN` 環境変数は常に優先され、ファイルには書き込まれません。強制的にローテーションするには、サーバー停止後に `.last-token` を削除してください。
- **トークンファイル読み取り経路の強化**（`readPrivateFile`）：シンボリックリンクや複数リンクの `.last-token` は拒否され、セッションキーとして採用されなくなります。読み取りは `O_NOFOLLOW` 付き fd 経由で行い、identity を再検証し 0600 に締め付けます——既に強化済みの書き込み経路との非対称性を解消しました（独立したセキュリティレビューで発見）。
- **診断性**：トークンファイルの書き込み失敗時に `Failed to write private token file:` をログ出力し、起動ごとのローテーションへの静かな縮退を防ぎます。
- **start-server.ps1 の環境衛生**：`--project-dir` なしの一時起動で、呼び出し元 pwsh セッションに残ったプロジェクトキー/ポートを継承しなくなります。
- **テスト**：companion スイートは 31 アサーションに——再起動をまたぐキー永続化、事前シード済みファイルの尊重、シンボリックリンクされたトークンファイルの拒否、トークンファイルなしでのローテーション維持。テスト後処理は障害安全（try/finally）。PowerShell スイートは `.last-token` が提供キーと一致することを検証します。

### v6.2.3（最新）

- **Brainstorm Visual Companion の強化（`server.cjs`）**：ローカル loopback 限定の HTTP+WebSocket サーバーがファイルシステムのレースに耐性を持つようになりました（content ディレクトリの削除や画面ファイルの読み取り中の消失は待機ページ / 404 へフォールバック）。watcher はディレクトリの削除・再作成後に自己修復します（Linux inotify + macOS FSEvents）。WebSocket ハンドシェイクは RFC 6455 に基づき検証され、制御フレームは 125 バイト、idle/partial-frame に期限を設定し、接続上限時は最古の接続を破棄します。nonce CSP、起動ごとのキー更新、画面・スキル・イベントのサイズ上限、private state ファイルを適用しました。
- **`/files/` の二重 `writeHead` クラッシュ修正**（subagent レビューで発見）：ヘッダー送信の前にファイルを読み取り、`O_NOFOLLOW` + fd ベースの `fstat` + サイズ上限で check-then-read の TOCTOU を閉鎖。
- **プロセスライフサイクルの安全性**：`start-server.sh/.ps1` はシグナル送信前に PID が本当にこのセッションの brainstorm サーバーであることを検証（server-instance-id + cmdline チェック、stop-server と同一）；`stop-server.sh` は一時セッション削除前にパスを正規化し、`/tmp/../` による一時ルート外への脱出を防止；相対 `--project-dir` は事前に絶対パスへ解決；`server-instance-id` は BOM なしで書き込み、Windows PowerShell 5.1 でもシェル間の ID チェックが機能。
- **SkillsManager の強化**：POSIX では `O_NOFOLLOW` でスキルファイルを読み取り（シンボリックリンク置換の TOCTOU を閉鎖）；再スキャン失敗時は最後の正常キャッシュを返し、空リストで汚染しない；連続ドットを含むスキル名（例 `a..b`）も検索可能に — ルックアップは Map のみでファイルシステムには触れません。
- **MCP プロトコルの改善**：リソース URI の不正なパーセントエンコーディングは `InvalidRequest` (-32600) を返し、内部エラーを漏らしません。
- **依存関係**：検証済みの exact override により `hono` 4.13.0、`@hono/node-server` 2.0.11、`fast-uri` 4.1.2 を固定（関連する勧告を解決）。`npm audit`：**0 脆弱性**。
- **テストスイート**：`npm test` はビルド後に JavaScript のエッジケース/セキュリティ、MCP フロー、companion 回帰スイートを実行します。63 アサーションの PowerShell スイートは `tests/powershell/run-tests.sh` で別途実行し、`pwsh` がない場合はスキップします。
- **独立レビュー**：セキュリティと正確性の指摘に対し、起動ごとの認証ローテーション、loopback 限定 HTTP、nonce CSP、上限付き読み取り、private state 書き込み、決定的なクロスプラットフォームテストで対応しました。

### v6.2.2

- **シンボリックリンクトラバーサル防止**：`SkillsManager.readSkillContent()` は `fs.realpath` でパスを正規化してから境界を確認するようになり、シンボリックリンクを利用した任意ファイル読み取りを防止します。`getSafeSkillsPath` も危険なシステムディレクトリのプレフィックスをブロックします。
- **互換性とプロトコル**：frontmatter とスキルコンテンツで UTF-8 BOM をサポートし、空白や特殊文字を含む resource URI に RFC 3986 準拠のエンコード/デコードを適用します。
- **正確性とテスト**：強制リロード時にコンテンツキャッシュを無効化し、並行リロードのロックを安全にしました。複数行 YAML の説明ではタブとスペースのインデントを受け付け、`tests/edge_cases_test.js` でこれらのセキュリティとキャッシュ動作を検証します。

### v6.2.1

- **PowerShell スクリプトテストスイート**：`sdd-workspace.ps1`、`task-brief.ps1`、`review-package.ps1`、`find-polluter.ps1`、brainstorm の `start-server.ps1`/`stop-server.ps1` のライフサイクルを対象とする 63 アサーションの 5 スイートを `tests/powershell/` に追加。`tests/powershell/run-tests.sh` で実行でき、`pwsh` がない場合はスキップします。
- **`stop-server.ps1` のクロスプラットフォーム修正**：`Get-CimInstance Win32_Process` は Windows 専用のため、Unix では `ps` を使って server-id を正しく確認するようにしました。
- **クリーンアップ**：上流ですでに削除され、ローカルでも参照されていなかった孤立した `skills/using-superpowers/references/copilot-tools.md` を削除しました。

### v6.2.0
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
