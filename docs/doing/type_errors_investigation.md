# 目的

Vercelデプロイ時に発生する型エラーを全般的に調査・修正する。

## 背景

現在、以下のような型エラーが繰り返し発生している:

### エラー1: DoitKunArea.tsx:370 - DeepDiveTreeへのprops渡し漏れ
```
Type error: Type '{ parentNote: any; character: CharacterType; }' is missing the following properties from type 'DeepDiveTreeProps': currentDepth, currentQuestion
```

`DeepDiveTree`コンポーネントは以下のpropsを要求しているが、`DoitKunArea.tsx:370`では`currentDepth`と`currentQuestion`が渡されていない:
```typescript
interface DeepDiveTreeProps {
  parentNote: DeepDiveNote;
  currentDepth: number;
  currentQuestion: string;
  character: CharacterType;
}
```

### エラー2: DoitKunArea.tsx:75 - Note型の不整合
```
Type error: No overload matches this call.
Property 'user' is missing in type '{ children: ... }' but required in type 'Note'.
```

`DoitKunArea.tsx`内のローカルNote型と、Prismaから返される実際のデータ型（ネストした`children`の型）が一致していない。

### 根本原因

1. **型定義の分散**: 各コンポーネントファイル内でNote型が独自に定義されている
   - `DoitKunArea.tsx`: `interface Note { ... }`
   - `DeepDiveTree.tsx`: `type DeepDiveNote = { ... }`
   - `NoteCard.tsx`: `type NoteWithChildren = { ... }`
   - `src/types/note.ts`: `interface NoteResponse`

2. **Prismaの型との不一致**: `getNotes()`で返されるネストしたchildren構造の型が、各コンポーネントの型定義と完全に一致していない

3. **props定義の問題**: `DeepDiveTree`コンポーネントのprops定義で使われていないパラメータ（`currentDepth`, `currentQuestion`）がインターフェースに含まれている

# ゴール

- [ ] Vercelビルドが成功する（型エラー0件）
- [ ] 全コンポーネントで共通のNote型定義を使用
- [ ] Prismaから返される型と完全に一致
- [ ] 不要なprops定義を削除

# データベース関連の変更

なし（型定義の整理のみ）

# 編集するファイル名

1. `src/types/note.ts` - 共通のNote型定義を作成・エクスポート
2. `src/app/components/DoitKunArea.tsx` - ローカルNote型を削除し、共通型をimport。DeepDiveTreeへのprops修正
3. `src/app/components/DeepDiveTree.tsx` - ローカル型を削除し、共通型をimport。propsインターフェース修正
4. `src/app/components/NoteCard.tsx` - ローカル型を削除し、共通型をimport（既にNoteModelをimportしているが再確認）
5. `src/lib/actions.ts` - 型のexport確認

# 新たに導入するライブラリ

なし

# タスク

- [x] src/types/note.tsに共通のNote型を定義
  - NoteResponseをベースに、再帰的なchildren構造を持つ型を作成
  - `NoteWithChildren`のような名前でexport
- [x] src/app/components/DeepDiveTree.tsxの修正
  - DeepDiveTreePropsから`currentDepth`と`currentQuestion`を削除（実装で使われていない）
  - ローカルのDeepDiveNote型を削除し、共通型をimport
- [x] src/app/components/DoitKunArea.tsxの修正
  - ローカルのNote型を削除し、共通型をimport
  - DeepDiveTreeコンポーネント呼び出し時はすでに正しいpropsのみ渡されている
  - findParentNote関数の型アノテーションを修正し、型アサーションを追加
- [x] src/app/components/NoteCard.tsxの確認
  - ローカルのNoteWithChildren型を削除し、共通型をimport
- [x] src/app/components/NotesPage.tsxの型エラー修正
  - notesの型アサーションを追加（`as OptimisticNote[]`）
- [x] ビルドを実行して型エラーがないことを確認
  - **ビルド成功！型エラー0件**
- [ ] ユーザーにチェックをもらう(必須)

# 修正内容

## 1. src/types/note.ts
共通のNote型定義を追加:
```typescript
export type NoteWithChildren = NoteModel & {
  user: {
    name: string | null;
  };
  children?: NoteWithChildren[];
};
```

## 2. src/app/components/DeepDiveTree.tsx
- ローカルの`DeepDiveNote`型を削除
- `DeepDiveTreeProps`から不要な`currentDepth`と`currentQuestion`を削除
- 共通の`NoteWithChildren`型をimport

## 3. src/app/components/DoitKunArea.tsx
- ローカルの`Note`型を削除
- 共通の`NoteWithChildren`型をimport
- `findParentNote`関数で型アサーションを使用（Prismaの型との互換性確保）

## 4. src/app/components/NoteCard.tsx
- ローカルの`NoteWithChildren`型定義を削除
- 共通の`NoteWithChildren`型をimport

## 5. src/app/components/NotesPage.tsx
- `notes`を`OptimisticNote[]`として型アサーション

# ビルド結果

```
✓ Compiled successfully in 2.8s
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (8/8)
✓ Finalizing page optimization
```

型エラー: **0件**
警告(Warning): 9件（img要素、未使用変数など - 機能に影響なし）
