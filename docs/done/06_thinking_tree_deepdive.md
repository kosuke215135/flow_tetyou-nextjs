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
- [x] `prisma/schema.prisma`を編集
  - [x] `User.yurufuwaMeter`を削除
  - [x] `Note.yurufuwaScore`を削除
  - [x] `Note.actionPlanGenerated`を削除
  - [x] `Note.parentNoteId`を追加
  - [x] `Note.depth`を追加
  - [x] `Note.question`を追加
  - [x] 親子リレーション`NoteTree`を追加
- [x] マイグレーションファイル生成（`npx prisma migrate dev`）
- [x] Prisma Client再生成（`npx prisma generate`）

## Phase 2: 不要な機能の削除
- [x] `src/app/api/update-score/route.ts`を削除
- [x] `src/lib/actions.ts`から不要な関数を削除
  - [x] `resetYurufuwaMeter()`削除
  - [x] `generateSmallStepActionPlan()`削除
- [x] `src/app/components/YurufuwaMeter.tsx`を削除
- [x] `src/app/components/Header.tsx`からYurufuwaMeter関連コードを削除
- [x] `src/app/components/DoitKunArea.tsx`から古いゆるふわメーター機能を削除

## Phase 3: ドラッグ&ドロップ実装
- [x] `@dnd-kit/core`をインストール（`pnpm add @dnd-kit/core @dnd-kit/utilities`）
- [x] `NoteCard.tsx`にドラッグ可能なノートカードを実装
  - [x] 各ノートに`useDraggable`を適用
  - [x] ドラッグ中の視覚的フィードバック（opacity 0.5）
- [x] `DoitKunArea.tsx`にドロップエリアを実装
  - [x] `useDroppable`でドロップゾーンを作成
  - [x] ドロップ時のハイライト表示（青背景）
  - [x] ドロップ検知とノートIDの取得
- [x] `src/app/page.tsx`にDndContextを配置

## Phase 4: 深堀りモード実装
- [x] `src/lib/actions.ts`に`generateDeepDiveQuestion()`サーバーアクション追加
  - [x] 親ノートIDとdepthを受け取る
  - [x] Gemini APIで「なぜ？」の質問を生成（ドゥイットくん風）
  - [x] 深さに応じてプロンプトを調整（最後は「で、どうしたいんだ？」）
  - [x] 質問を返す
- [x] `DoitKunArea.tsx`に深堀りUIを実装
  - [x] ノートドロップ時に深堀りモード起動（useEffectでdroppedNoteIdを監視）
  - [x] 質問を表示（ドゥイットくんのアイコン付き）
  - [x] ユーザーが回答を入力（TipTapエディタ）
  - [x] 回答を子ノートとして保存
  - [x] 次の質問を生成（最大5回、depth 0-4）
  - [x] 深堀り完了後は待機状態に戻る
  - [x] 進捗表示（1/5, 2/5, ...）
- [x] `src/lib/actions.ts`に`createChildNote()`サーバーアクション追加
  - [x] parentNoteId、depth、question、contentを受け取る
  - [x] 子ノートをDBに保存
- [x] `src/app/components/Editor.tsx`にsubmitButtonTextとdisabledプロパティ追加

## Phase 5: ツリー表示実装
- [x] `src/lib/actions.ts`のgetNotes()を修正
  - [x] 親ノート（depth=0）のみを取得
  - [x] childrenを再帰的に含める（depth=5まで）
- [x] `NoteCard.tsx`にツリー構造表示を実装
  - [x] 親ノートはドラッグ可能
  - [x] 子ノートを再帰的に表示（ChildNoteCardコンポーネント）
  - [x] インデント表示（depth に応じて）
- [x] ツリーの視覚的デザイン
  - [x] 親子関係を示す線（border-left）
  - [x] 質問と回答の区別（質問=青背景、回答=灰色背景）
  - [x] 質問には💪アイコン、回答にはA:ラベル

## Phase 6: 動作確認
- [x] ノートをドラッグ&ドロップして深堀りモード起動を確認
- [x] 「なぜ？」が5回繰り返されることを確認
- [x] 子ノートが正しく保存されることを確認
- [x] ツリー構造が正しく表示されることを確認
- [x] ドゥイットくんのキャラクター性が反映されているか確認

## Phase 7: 仕上げ
- [ ] 古いlocalStorageデータのクリーンアップ処理追加（`doitkun_action_plans`）
- [x] エラーハンドリング（DoitKunAreaでエラー表示）
- [x] ローディング表示（深堀り中のスピナー）
- [x] ユーザーにチェックをもらう(必須) ✅ 動作確認完了

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

# 実装結果まとめ

## 実装したファイル
- `prisma/schema.prisma` - スキーマ変更
- `prisma/migrations/20251012083014_thinking_tree_schema/migration.sql` - マイグレーション
- `src/lib/actions.ts` - generateDeepDiveQuestion(), createChildNote(), getNotes()修正
- `src/app/page.tsx` - DndContext配置
- `src/app/components/DoitKunArea.tsx` - 深堀りUI（全面書き換え）
- `src/app/components/NoteCard.tsx` - ツリー表示、ChildNoteCard追加
- `src/app/components/Editor.tsx` - submitButtonText, disabledプロパティ追加
- `src/app/components/Header.tsx` - YurufuwaMeter削除

## 削除したファイル
- `src/app/api/update-score/route.ts`
- `src/app/components/YurufuwaMeter.tsx`

## 主要な機能
1. **ドラッグ&ドロップ**: ノートを右側のドゥイットくんエリアにドラッグ
2. **深堀りモード**: 「なぜ？」を5回繰り返して思考を深堀り
3. **ツリー表示**: 親ノートと子ノートを階層構造で表示
4. **質問生成**: Gemini AIでドゥイットくん風の質問を生成
5. **折りたたみ機能**: 深堀り履歴を折りたたみ/展開できるインデックスシール風ボタン

## コミット履歴
1. `refactor: データベーススキーマを思考ツリー対応に変更`
2. `migrate: 思考ツリー対応のマイグレーション実行`
3. `remove: ゆるふわメーター関連の機能を削除`
4. `add: ドラッグ&ドロップライブラリを導入`
5. `add: 深堀り用サーバーアクションを実装`
6. `add: ノートのドラッグ機能を実装`
7. `add: DoitKunAreaにドロップゾーンを実装`
8. `remove: HeaderからYurufuwaMeterを削除`
9. `refactor: DndContextをpage.tsxに移動`
10. `add: 深堀りモードUIを実装`
11. `add: ツリー表示機能を実装`
12. `fix: NoteWithChildren型にquestionとdepthを追加`
13. `add: ノートに折りたたみ機能を追加` (bfbdcc9)

**合計コミット数: 14件**
**ブランチ: feature/thinking-tree-deepdive**

---

# 修正タスク

## ノートの折りたたみ機能
親ノートの子ノート（深堀り履歴）を折りたたみ/展開できるようにする。

### 要件
- [x] 親ノートに折りたたみボタンを追加
- [x] 折りたたみ状態を管理（useState）
- [x] 折りたたみ時は子ノートを非表示
- [x] 展開時は子ノートを表示
- [x] アイコンで状態を表示（▼展開中 / ▶折りたたみ中）
- [x] 子ノートがある場合のみボタンを表示

### 実装ファイル
- `src/app/components/NoteCard.tsx` - 折りたたみ機能追加

### 実装内容
1. **折りたたみボタン**: ノート下部左側にインデックスシール風のボタンを配置
   - 位置: `absolute bottom-0 left-4 translate-y-full`（ノートの外側に配置）
   - デザイン: 青背景、ホバーで濃い青、角丸
   - テキスト: "深堀りN" （Nは子ノート数）
   - アイコン: ▼（展開中）/ ▶（折りたたみ中）

2. **状態管理**: `useState(true)`でデフォルト展開状態

3. **動的マージン**: 子ノートがある場合、親ノートに`marginBottom: '3rem'`を設定し、次のノートと重ならないよう調整

4. **子ノート表示**: `isExpanded && hasChildren`の条件で表示/非表示を切り替え

5. **ゆるふわ度表示削除**: 思考ツリー機能への完全移行のため、星評価表示を削除

### UI例
```
[親ノート]
└─ [深堀り3 ▼]  ← ノート下部左側に配置

  ├─ Q: なぜ〇〇？
  │  A: △△だから
  ├─ Q: なぜ△△？
  ...

↓ クリック

[親ノート]
└─ [深堀り3 ▶]  ← 折りたたみ状態
```

### コミット
- `add: ノートに折りたたみ機能を追加` (bfbdcc9)

- [x] ユーザーにチェックをもらう(必須) ✅ 動作確認完了

---

## ドキュメント更新タスク
機能実装により、アプリの性質が大きく変わったため、関連ドキュメントを更新する。

### 要件
- [x] CLAUDE.mdのプロジェクト概要とコアコンセプトを更新
- [x] CLAUDE.mdのディレクトリ構造セクションを更新
- [x] CLAUDE.mdのデータフローセクションを更新
- [x] CLAUDE.mdのAI統合セクションを更新
- [x] アプリ仕様書を全面的に書き直し（思考ツリー機能に対応）
- [x] ユーザーにチェックをもらう(必須)

### 更新内容
- CLAUDE.md: プロジェクト概要、コアコンセプト、技術スタック、ディレクトリ構造、データフロー、AI統合セクションを思考ツリー機能に対応
- docs/アプリ仕様書.md: 全面的に書き直し、思考ツリー機能の詳細仕様を追加

### コミット
- `update: CLAUDE.mdとアプリ仕様書を思考ツリー機能に対応`