# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**Flow Tetyou (フロー手帳)** は、AIアシスタント機能を持つNext.jsベースのメモアプリです。ユーザーのモヤモヤしたメモを「ドゥイットくん」というAIアシスタントが「なぜ？」と繰り返し問いかけることで、思考を深堀りし、ツリー構造で可視化します。

### コアコンセプト
ユーザーがモヤモヤしたメモを書くと:
1. ノートを「ドゥイットくんエリア」にドラッグ&ドロップ
2. ドゥイットくんが「なぜ？」の質問を生成（Gemini AI）
3. ユーザーが質問に答えて、子ノートとして保存
4. 2-3を5回繰り返して思考を深堀り（depth 1-5）
5. 親ノートと子ノートがツリー構造で表示される
6. 深堀り履歴は折りたたみ/展開が可能

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
- **ドラッグ&ドロップ**: @dnd-kit/core, @dnd-kit/utilities
- **状態管理**: SWR (データフェッチとキャッシュ)
- **パッケージマネージャー**: pnpm

## アーキテクチャ

### ディレクトリ構造

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # APIルート
│   │   └── auth/[...nextauth]/ # NextAuthハンドラー
│   ├── auth/                 # 認証ページ (signin, error)
│   ├── components/           # Reactコンポーネント
│   │   ├── ui/               # 再利用可能UIコンポーネント
│   │   ├── Editor.tsx        # TipTapリッチテキストエディタ
│   │   ├── NotesPage.tsx     # メインノートページ (DndContext含む)
│   │   ├── NoteCard.tsx      # ドラッグ可能なノートカード + ツリー表示
│   │   ├── DoitKunArea.tsx   # AIアシスタントUI (ドロップゾーン + 深堀りモード)
│   │   └── Header.tsx        # アプリヘッダー
│   ├── page.tsx              # ホームページ (DndContextプロバイダー)
│   └── layout.tsx            # ルートレイアウト (プロバイダー含む)
├── lib/
│   ├── actions.ts            # サーバーアクション (createNote, getNotes, generateDeepDiveQuestion, createChildNote)
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
3. `createNote()`サーバーアクションがDBに保存（depth=0の親ノートとして）
4. SWRが自動再検証でノートリストを更新

**深堀りフロー（ドラッグ&ドロップ）:**
1. ユーザーが親ノートを`DoitKunArea.tsx`にドラッグ&ドロップ
2. `DoitKunArea`が深堀りモードを起動
3. `generateDeepDiveQuestion()`サーバーアクションがGemini AIで質問を生成
4. 質問を表示（例: 「なぜ〇〇なんだ？」）
5. ユーザーがTipTapエディタで回答を入力
6. `createChildNote()`サーバーアクションが子ノートとして保存（parentNoteId、depth、question付き）
7. 次の質問を生成（depth 1→2→...→5）
8. 5回繰り返して深堀り完了
9. SWRが再検証し、ツリー構造で表示

**ツリー表示フロー:**
1. `getNotes()`が親ノート（depth=0）のみを取得
2. 各親ノートは`children`リレーションで子ノートを再帰的に含む（depth=5まで）
3. `NoteCard.tsx`が親ノートを表示し、折りたたみ可能な子ノートを表示
4. 子ノートには質問（Q:）と回答（A:）が表示される

### 重要なファイル

- **src/lib/actions.ts**: Gemini AI統合を含むコアサーバーアクション（generateDeepDiveQuestion, createChildNote）
- **src/app/page.tsx**: DndContextプロバイダーを配置するメインページ
- **src/app/components/DoitKunArea.tsx**: ドロップゾーン + 深堀りモードを持つAIアシスタントUI
- **src/app/components/NoteCard.tsx**: ドラッグ可能なノートカード + ツリー表示 + 折りたたみ機能
- **prisma/schema.prisma**: データベーススキーマ (User, Note with tree structure, NextAuthテーブル)

### 重要なパターン

**サーバーアクション (src/lib/actions.ts):**
- 全て`'use server'`でマーク
- `{ success: boolean, data?: T, error?: string }`形式を返す
- 変更後に`revalidatePath('/')`を実行
- `await auth()`で認証を検証

**Gemini AI統合:**
- モデル: `gemini-2.5-flash`
- 深堀り質問生成: ドゥイットくん風の「なぜ？」質問を生成
- depthに応じてプロンプトを調整（depth 4では「で、どうしたいんだ？」）
- レスポンステキストから質問を抽出

**ドラッグ&ドロップ:**
- `@dnd-kit/core`を使用
- `useDraggable`でノートをドラッグ可能に
- `useDroppable`でドゥイットくんエリアをドロップゾーンに
- ドロップ時にノートIDを取得して深堀りモードを起動

**SWR設定:**
- ノート作成時のOptimistic Update
- 認証状態に基づく条件付きフェッチ
- 深堀り完了後の自動再検証

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

**深堀り質問生成:**
- ノートがドロップされたときにトリガー
- `generateDeepDiveQuestion(parentNoteId, currentDepth)`を呼び出す
- プロンプト例（depth 0-3の場合）:
  ```
  君はドゥイットくん。脳筋行動派のパーソナルトレーナー（ニート）だ。

  ユーザーの以下のモヤモヤメモに対して、核心を突く「なぜ？」の質問を1つ考えろ。
  論理は破綻してても構わない。むしろドゥイットくんらしい脳筋質問が良い。

  メモ: 「${noteContent}」

  一人称は「オレ」、二人称は「君」を使え。
  短く、シンプルに。質問文だけを返せ。
  ```
- depth 4の場合は「で、どうしたいんだ？」という行動を促すプロンプトに変更
- Geminiレスポンスから質問テキストを抽出し返す

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
