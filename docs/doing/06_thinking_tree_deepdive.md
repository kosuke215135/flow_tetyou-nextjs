# 目的
ゆるふわメーター機能を削除し、ノートのドラッグ&ドロップによる深堀りモードに作り変える。ドゥイットくんが「なぜ？」を繰り返すことで、思考を深堀りし、親子関係のツリー構造でノートを整理できるようにする。

## 背景
- 現在のゆるふわメーター機能は「抽象度を測ってアクション提案」という仕組みだが、AIのアドバイス自体があまり役に立たない
- ユーザーが自分で答えを見つける仕組みの方が価値がある
- 「なぜ？」を繰り返して思考を深堀りし、モヤモヤを整理する方向に転換
- ノートをドラッグ&ドロップで深堀りモードを起動する直感的なUXにする

## 新しいコンセプト
**「思考を深堀りして、モヤモヤを整理する手帳」**

- モヤモヤメモを書く
- ドゥイットくんエリアにドラッグ&ドロップ
- ドゥイットくんが「なぜ？」を5回繰り返す
- 回答が子ノートとして追加され、ツリー構造になる
- 思考が可視化され、自分で答えが見えてくる

# ゴール
- ゆるふわメーター関連機能を完全削除
- ノートのドラッグ&ドロップUIを実装
- 深堀りモード（「なぜ？」を5回繰り返す）を実装
- 親子関係のツリー構造でノートを表示
- ドゥイットくんのキャラクター性を活かした質問生成

# データベース関連の変更

## 削除するフィールド
```prisma
model User {
  yurufuwaMeter Float @default(0) // ❌ 削除
}

model Note {
  yurufuwaScore Float? // ❌ 削除
  actionPlanGenerated Boolean @default(false) // ❌ 削除
}
```

## 追加するフィールド
```prisma
model Note {
  parentNoteId String? // 親ノートのID（深堀りの場合）
  depth Int @default(0) // 深堀りの深さ（0=元メモ、1-5=深堀り）
  question String? // ドゥイットくんからの質問（深堀りノートの場合）

  // リレーション
  parent Note? @relation("NoteTree", fields: [parentNoteId], references: [id], onDelete: Cascade)
  children Note[] @relation("NoteTree")
}
```

# 編集するファイル名
- `prisma/schema.prisma` - スキーマ変更、マイグレーション
- `src/app/components/DoitKunArea.tsx` - ドロップエリア実装、深堀りモード
- `src/app/components/NotesList.tsx` - ドラッグ可能なノートカード、ツリー表示
- `src/app/components/NotesPage.tsx` - メーター表示削除
- `src/lib/actions.ts` - 深堀り用サーバーアクション追加、不要な関数削除
- `src/app/api/update-score/route.ts` - ❌ 削除
- `src/app/api/user/route.ts` - yurufuwaMeter削除
- `src/app/components/YurufuwaMeter.tsx` - ❌ 削除（または大幅変更）

# 新たに導入するライブラリ
- `@dnd-kit/core` - ドラッグ&ドロップ実装
- `@dnd-kit/sortable` - （オプション）並び替え
- `@dnd-kit/utilities` - ユーティリティ

# タスク

## Phase 1: データベース変更
- [ ] `prisma/schema.prisma`を編集
  - [ ] `User.yurufuwaMeter`を削除
  - [ ] `Note.yurufuwaScore`を削除
  - [ ] `Note.actionPlanGenerated`を削除
  - [ ] `Note.parentNoteId`を追加
  - [ ] `Note.depth`を追加
  - [ ] `Note.question`を追加
  - [ ] 親子リレーション`NoteTree`を追加
- [ ] マイグレーションファイル生成（`npx prisma migrate dev`）
- [ ] Prisma Client再生成（`npx prisma generate`）

## Phase 2: 不要な機能の削除
- [ ] `src/app/api/update-score/route.ts`を削除
- [ ] `src/lib/actions.ts`から不要な関数を削除
  - [ ] `resetYurufuwaMeter()`削除
  - [ ] `generateSmallStepActionPlan()`削除（またはリネーム）
- [ ] `src/app/components/YurufuwaMeter.tsx`の表示を削除または変更
- [ ] `src/app/components/NotesPage.tsx`からメーター関連UIを削除
- [ ] `src/app/api/user/route.ts`から`yurufuwaMeter`を削除

## Phase 3: ドラッグ&ドロップ実装
- [ ] `@dnd-kit/core`をインストール（`pnpm add @dnd-kit/core @dnd-kit/utilities`）
- [ ] `NotesList.tsx`にドラッグ可能なノートカードを実装
  - [ ] 各ノートに`useDraggable`を適用
  - [ ] ドラッグ中の視覚的フィードバック
- [ ] `DoitKunArea.tsx`にドロップエリアを実装
  - [ ] `useDroppable`でドロップゾーンを作成
  - [ ] ドロップ時のハイライト表示
  - [ ] ドロップ検知とノートIDの取得

## Phase 4: 深堀りモード実装
- [ ] `src/lib/actions.ts`に`startDeepDive()`サーバーアクション追加
  - [ ] 親ノートIDを受け取る
  - [ ] Gemini APIで「なぜ？」の質問を生成（ドゥイットくん風）
  - [ ] 質問を返す
- [ ] `DoitKunArea.tsx`に深堀りUIを実装
  - [ ] ノートドロップ時に深堀りモード起動
  - [ ] 質問を表示
  - [ ] ユーザーが回答を入力（TipTapエディタ）
  - [ ] 回答を子ノートとして保存
  - [ ] 次の質問を生成（最大5回）
  - [ ] 深堀り完了後の表示
- [ ] `src/lib/actions.ts`に`createChildNote()`サーバーアクション追加
  - [ ] parentNoteId、depth、question、contentを受け取る
  - [ ] 子ノートをDBに保存

## Phase 5: ツリー表示実装
- [ ] `NotesList.tsx`にツリー構造表示を実装
  - [ ] 親ノート（depth=0）を取得
  - [ ] 子ノートを再帰的に表示
  - [ ] インデント表示（depth に応じて）
  - [ ] 折りたたみ/展開機能（オプション）
- [ ] ツリーの視覚的デザイン
  - [ ] 親子関係を示す線
  - [ ] 質問と回答の区別
  - [ ] depth に応じた色分け（オプション）

## Phase 6: 動作確認
- [ ] ノートをドラッグ&ドロップして深堀りモード起動を確認
- [ ] 「なぜ？」が5回繰り返されることを確認
- [ ] 子ノートが正しく保存されることを確認
- [ ] ツリー構造が正しく表示されることを確認
- [ ] ドゥイットくんのキャラクター性が反映されているか確認

## Phase 7: 仕上げ
- [ ] 古いlocalStorageデータのクリーンアップ処理追加（`doitkun_action_plans`）
- [ ] エラーハンドリング
- [ ] ローディング表示
- [ ] ユーザーにチェックをもらう(必須)

# 深堀りモードの仕様詳細

## 質問生成のプロンプト例
```
君はドゥイットくん。脳筋行動派のパーソナルトレーナー（ニート）だ。

ユーザーの以下のモヤモヤメモに対して、核心を突く「なぜ？」の質問を1つ考えろ。
論理は破綻してても構わない。むしろドゥイットくんらしい脳筋質問が良い。

メモ: 「${noteContent}」

一人称は「オレ」、二人称は「君」を使え。
短く、シンプルに。質問文だけを返せ。
```

## 深堀りフロー
1. ユーザーがノートをドゥイットくんエリアにドロップ
2. 深堀りモード起動（`depth=1`の質問生成）
3. ドゥイットくん「なぜ〇〇なんだ？」
4. ユーザーが回答を入力
5. 回答を子ノートとして保存（parentNoteId、depth=1、question）
6. 次の質問生成（`depth=2`）
7. 3-6を5回繰り返す（depth=5まで）
8. 最後に「で、どうしたいんだ？」と聞く
9. 深堀り完了、ツリー表示

## UI例
```
┌─────────────────────────────────┐
│ 💪 ドゥイットくんエリア           │
│                                  │
│ ここにノートをドロップして        │
│ 深堀りを始めよう！                │
│                                  │
│ [ドロップゾーン]                  │
└─────────────────────────────────┘

↓ ノートをドロップ

┌─────────────────────────────────┐
│ 🔍 深堀り中... (1/5)              │
│                                  │
│ 💬 ドゥイットくん:                │
│ 「なぜ転職したいんだ？」          │
│                                  │
│ あなたの回答:                     │
│ [TipTapエディタ]                  │
│                                  │
│ [次へ →]                         │
└─────────────────────────────────┘
```
