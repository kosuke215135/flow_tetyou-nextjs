# 目的

NoteModel型にcharacterプロパティを追加し、TypeScriptの型エラーを解消する。

## 背景
- Prismaスキーマには`character`フィールドが定義されている
- `src/types/note.ts`の`NoteModel`型には`character`プロパティが定義されていない
- `NoteCard.tsx`と`actions.ts`で型エラーが発生している
- `DeepDiveTree.tsx`では`DeepDiveNote`型に`character`を定義済みで問題なし

## 型エラーの箇所
1. `src/app/components/NoteCard.tsx:147` - `note.character`へのアクセス時にエラー
2. `src/lib/actions.ts:336` - Prismaへのデータ作成時に`character`プロパティが型定義にないエラー

# ゴール

`NoteModel`型に`character?: string | null`を追加し、TypeScriptの型エラーを解消する

# データベース関連の変更

なし（Prismaスキーマには既に`character`フィールドが存在）

# 編集するファイル名

- `src/types/note.ts`

# 新たに導入するライブラリ

なし

# タスク

- [x] `src/types/note.ts`の`NoteModel`インターフェースに`character?: string | null`を追加
- [x] TypeScriptの型エラーが解消されたことを確認
- [ ] ユーザーにチェックをもらう(必須)
