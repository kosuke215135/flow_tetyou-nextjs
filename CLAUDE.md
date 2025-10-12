# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**Flow Tetyou (フロー手帳)** は、AIアシスタント機能を持つNext.jsベースのメモアプリです。ユーザーの抽象的な思考（「ふわふわした思考」）を、「ドゥイットくん」というAIアシスタントが具体的なアクションプランに変換します。

### コアコンセプト
ユーザーが曖昧な・抽象的なメモを書くと:
1. Gemini AIが「ゆるふわスコア」（抽象度スコア 0.0-1.0）を計算
2. スコアが「ゆるふわメーター」に蓄積される
3. メーターが閾値（≥1.0）に達すると「ドゥイットくん」が召喚される
4. 蓄積されたメモから3つの具体的な「小さな一歩」を生成
5. メーターをリセットし、メモを処理済みにマーク

## コマンド

### 開発
```bash
pnpm dev              # 開発サーバー起動 (Turbopack使用)
pnpm build            # 本番ビルド (Turbopack使用)
pnpm start            # 本番サーバー起動
pnpm lint             # ESLint実行
```

### データベース
```bash
npx prisma generate   # Prisma Client生成
npx prisma migrate dev # マイグレーション実行
npx prisma studio     # Prisma Studio GUI起動
```

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **データベース**: PostgreSQL + Prisma ORM
- **認証**: NextAuth.js v5 (beta) with Google OAuth
- **AI**: Google Gemini API (gemini-2.5-flash model)
- **スタイリング**: Tailwind CSS v4
- **リッチテキスト**: TipTap editor (タスクリスト、コードブロック、リンク対応)
- **状態管理**: SWR (データフェッチとキャッシュ)
- **パッケージマネージャー**: pnpm

## アーキテクチャ

### ディレクトリ構造

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # APIルート
│   │   ├── auth/[...nextauth]/ # NextAuthハンドラー
│   │   ├── update-score/     # バックグラウンドスコア計算
│   │   └── user/             # ユーザーデータエンドポイント
│   ├── auth/                 # 認証ページ (signin, error)
│   ├── components/           # Reactコンポーネント
│   │   ├── ui/               # 再利用可能UIコンポーネント
│   │   ├── Editor.tsx        # TipTapリッチテキストエディタ
│   │   ├── NotesPage.tsx     # メインノートページ (SWR使用)
│   │   ├── NotesList.tsx     # ノートリスト表示
│   │   ├── YurufuwaMeter.tsx # メーター進捗バー
│   │   ├── DoitKunArea.tsx   # AIアシスタントUI
│   │   └── Header.tsx        # アプリヘッダー
│   ├── page.tsx              # ホームページ (NotesPageへリダイレクト)
│   └── layout.tsx            # ルートレイアウト (プロバイダー含む)
├── lib/
│   ├── actions.ts            # サーバーアクション (createNote, getNotes, generateSmallStepActionPlan)
│   ├── auth.ts               # NextAuth設定
│   ├── prisma.ts             # Prismaクライアントシングルトン
│   └── utils.ts              # ユーティリティ関数 (extractTextFromContent等)
├── types/
│   ├── note.ts               # Note型定義
│   └── next-auth.d.ts        # NextAuth型拡張
└── components/
    └── providers/
        └── session-provider.tsx # NextAuth SessionProviderラッパー

prisma/
└── schema.prisma             # データベーススキーマ

docs/                         # プロジェクトドキュメント
├── todo/                     # 未着手の仕様書
├── doing/                    # 作業中の仕様書
└── done/                     # 完了した仕様書
```

### データフロー

**ノート作成フロー:**
1. ユーザーがTipTapエディタで入力 → `Editor.tsx`
2. `handleNoteSubmit()`がSWRでOptimistic UIを更新
3. `createNote()`サーバーアクションがDBに保存
4. クライアントが`/api/update-score`を非同期で呼び出し
5. APIがGemini AIでゆるふわスコアを計算
6. トランザクションで`note.yurufuwaScore`と`user.yurufuwaMeter`を更新
7. SWRが5秒ごとに自動再検証

**アクションプラン生成フロー:**
1. `DoitKunArea.tsx`がSWRで`/api/user`を5秒ごとにポーリング
2. `yurufuwaMeter >= 1.0`になると`generateSmallStepActionPlan()`を起動
3. サーバーアクションが`actionPlanGenerated = false`の全ノートを取得
4. ノートのテキストを結合 → Geminiに送信して3つのアクションプランを生成
5. プランをlocalStorageに保存、メーターを0にリセット、ノートを処理済みにマーク
6. プランはメーターリセット後もUI上に残る

### 重要なファイル

- **src/lib/actions.ts**: Gemini AI統合を含むコアサーバーアクション
- **src/app/api/update-score/route.ts**: 非同期ゆるふわスコア計算 (即座に202を返す)
- **src/app/components/NotesPage.tsx**: 5秒ポーリングのSWRを使用するメインページ
- **src/app/components/DoitKunArea.tsx**: localStorage永続化を持つAIアシスタントUI
- **prisma/schema.prisma**: データベーススキーマ (User, Note, NextAuthテーブル)

### 重要なパターン

**サーバーアクション (src/lib/actions.ts):**
- 全て`'use server'`でマーク
- `{ success: boolean, data?: T, error?: string }`形式を返す
- 変更後に`revalidatePath('/')`を実行
- `await auth()`で認証を検証

**Gemini AI統合:**
- モデル: `gemini-2.5-flash`
- ゆるふわスコアリング: 0.0-1.0の抽象度スコアを返す
- アクションプラン生成: 3つの文字列のJSON配列を返す
- どちらもレスポンステキストから正規表現で結果を抽出

**SWR設定:**
- 5秒ポーリング (`refreshInterval: 5000`)
- ノート作成時のOptimistic Update
- 認証状態に基づく条件付きフェッチ

**データベーストランザクション:**
- ゆるふわメーター更新は`prisma.$transaction()`を使用
- ノートスコアとユーザーメーターのアトミックな更新を保証

## ワークフロープロセス (GEMINI.md準拠)

このプロジェクトはGEMINI.mdと.github/copilot-instructions.mdで定義された構造化ワークフローに従います:

### 0. 作業開始時
- まず`/docs/doing/`以下を確認して進行中の仕様書があるかチェック
- ない場合、ユーザーに確認: 新規todoを作成するか、既存todoを消化するか
- 新規todoの場合、実装前に要件を確認

### 1. 計画フェーズ
`/docs/todo/`以下に以下のテンプレートで仕様書を作成:
```md
# 目的
(背景を含めて記載)

# ゴール

# データベース関連の変更
(新規テーブル作成やテーブル構造の更新があれば記載。データ構造は重要なので慎重に)

# 編集するファイル名

# 新たに導入するライブラリ

# タスク
- [ ] タスク1
- [ ] タスク2
...
- [ ] ユーザーにチェックをもらう(必須)
```

ユーザーの承認後、仕様書を`/docs/doing/`に移動

### 2. 実装
- 仕様書のタスクを一つずつ実行
- 完了したタスクは仕様書内でチェック
- ファイル移動時は`git mv`を使用
- 絶対パスでimport: `@/app/components/Header`

### 3. 動作確認
- ユーザーに機能をテストしてもらう
- 修正が必要な場合、仕様書に追記:
```md
# 修正タスク
- [ ] 修正タスク1
- [ ] 修正タスク2
...
- [ ] ユーザーにチェックをもらう(必須)
```

### 4. コード変更の報告
機能確認後、変更内容のサマリーを提供:
```
# 修正したファイル
# 特に報告したい内容
# 処理の流れ
```
コード変更の修正が必要な場合、上記のように仕様書にタスクを追加

### 5. 完了
- 仕様書を更新・整理する
- 仕様書を`/docs/doing/`から`/docs/done/`に移動
- コミットメッセージを作成 (下記Gitルール参照)
- ステップ0に戻る

## 開発ルール

### コードスタイル
- TypeScriptを使用 (`type`より`interface`を優先)
- セミコロンを付ける
- 意味のある変数名・関数名を使用
- マジックナンバーを避け、定数として定義
- コードの可読性を重視
- コメントは簡潔かつ具体的に

### ファイル操作
- **複数ファイルの同時編集は絶対にしない** (破損の原因)
- `@/`プレフィックスで絶対パスimportを使用
- ファイル移動時は`git mv`を使用

### テスト
- コード変更は常にテストを伴う
- 実装ではなく、ユーザーの操作や見た目の振る舞いをテスト

### Gitルール

**ブランチ命名:**
```
feature/#<issue番号>_<説明>   # 新機能開発
hotfix/#<issue番号>_<説明>    # バグ修正
```

**コミットメッセージプレフィックス (絵文字なし):**
- `add`: 新規機能・ファイル追加
- `fix`: バグやタイポの修正
- `refactor`: リファクタリング
- `update`: バグではない機能の改善、バージョンアップ等
- `rename`: ファイル名の変更
- `remove`: ファイルの削除
- `move`: ファイルの移動

**コミット対象ファイルの選定:**
- コミットメッセージに関連するファイルのみ含める
- **絶対に使わない**: `git add -A`

## 環境変数

`.env`に必要:
```
DATABASE_URL=              # PostgreSQL接続文字列
GOOGLE_CLIENT_ID=          # Google OAuth クライアントID
GOOGLE_CLIENT_SECRET=      # Google OAuth クライアントシークレット
GEMINI_API_KEY=            # Google Gemini APIキー
NEXTAUTH_URL=              # NextAuthベースURL
NEXTAUTH_SECRET=           # NextAuthシークレットキー
```

## AI統合に関する注意点

**ゆるふわスコア計算:**
- ノート作成後に非同期でトリガー
- 非常に短いテキスト（< 10文字）の場合はスコア < 0.1
- プロンプト: "以下の文章は、具体的な行動計画に近いですか？抽象的なアイデアに近いですか？抽象度を0.0から1.0の数値で評価してください。"
- Geminiレスポンスから正規表現で数値を抽出

**アクションプラン生成:**
- yurufuwaMeter >= 1.0のときにトリガー
- 未処理の全ノートを結合
- プロンプト: "以下の思考の断片から、日常のモヤモヤを解消するための具体的な「小さな一歩」を3つ、JSON形式の文字列配列として提案してください。"
- JSON配列形式のレスポンスを期待: `["プラン1", "プラン2", "プラン3"]`
- プランはlocalStorageに保存され、メーターリセット後も残る

## トラブルシューティング

**Prisma Client関連:**
- 生成されたクライアントは`src/generated/prisma/`にある
- `npx prisma generate`で再生成

**NextAuthセッション関連:**
- データベースセッション戦略を使用（JWTではない）
- セッションは`sessions`テーブルに保存
- セッションコールバックでuser.idが適切に渡されているか確認

**SWRが更新されない:**
- 5秒ポーリングがアクティブか確認
- サーバーアクションで`revalidatePath('/')`が呼ばれているか確認
- 条件付きフェッチの条件を確認

**Gemini APIエラー:**
- GEMINI_API_KEYが設定されているか確認
- モデル名: `gemini-2.5-flash`
- 期待される形式に対するレスポンステキストの解析ロジックを確認
