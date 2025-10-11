# 目的
保存されたメモの内容を分析し、「ゆるふわ度」という指標を測定・可視化する機能を追加します。これにより、ユーザーは自分の思考の具体性を客観的に把握できます。

# ゴール
- メモが保存されるたびに、その内容から「ゆるふわ度」が自動的に計算される。
- 計算された「ゆるふわ度」がデータベースに保存される。
- メモの一覧画面や詳細画面で、「ゆるふわ度」が分かりやすく表示される。

# 編集するファイル名
- `prisma/schema.prisma`
- `src/lib/actions.ts`
- `src/lib/yurufuwa.ts` (新規作成)
- `src/app/components/NoteCard.tsx`

# タスク
- [x] `prisma/schema.prisma` の `Note` モデルに `yurufuwaScore` フィールド (`Float`型) を追加する。
- [x] `pnpm prisma migrate dev` を実行してデータベーススキーマを更新する。
- [x] `src/lib/yurufuwa.ts` に、メモのテキストを受け取り、ゆるふわ度（0から1の間の数値）を返す関数 `calculateYurufuwaScore` を作成する。
- [x] `src/lib/actions.ts` の `createNote` 関数を修正し、`calculateYurufuwaScore` を呼び出して結果を `yurufuwaScore` フィールドに保存するようにする。
- [x] `src/lib/actions.ts` の `getNotes` 関数を修正し、取得するデータに `yurufuwaScore` を含める。
- [x] `src/app/components/NoteCard.tsx` にプログレスバーなどを追加し、`yurufuwaScore` を可視化する。
- [x] ユーザーにチェックをもらう(必須)