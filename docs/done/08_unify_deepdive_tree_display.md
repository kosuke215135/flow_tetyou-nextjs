# 目的
ドゥイットくんエリアの深堀りツリー表示を、NoteList側のツリー表示と統一し、視認性を向上させる。

現在、NoteList側のツリー表示（`NoteCard.tsx`の`ChildNoteCard`）では以下の機能が実装されているが、ドゥイットくんエリアの深堀り中表示（`DeepDiveTree.tsx`の`QAItem`）には実装されていない：
- 深堀りツリーごとの色分け（緑/紫/オレンジ/ピンク/青）
- 深さバッジ（Q1, Q2...の丸いバッジ）
- 進捗バー（何問目/5問のプログレスバー）
- 最後の質問（Q5）での特別な絵文字表示（🎯）

# ゴール
- ドゥイットくんエリアの`DeepDiveTree.tsx`のツリー表示を、`NoteCard.tsx`と同じスタイルに統一
- 深堀り中のリアルタイムツリー表示でも、色分け・深さバッジ・進捗バーが表示される
- ユーザーがどちらのエリアでも一貫したUIでツリーを確認できる

# データベース関連の変更
なし

# 編集するファイル名
- `src/app/components/DeepDiveTree.tsx` - ツリー表示を`ChildNoteCard`と同じスタイルに変更
- `src/lib/treeColors.ts` - 色定義を確認（既存）

# 新たに導入するライブラリ
なし（既存の`treeColors.ts`を使用）

# タスク
- [x] `DeepDiveTree.tsx`の`QAItem`コンポーネントを、`NoteCard.tsx`の`ChildNoteCard`と同じスタイルに修正
  - [x] `getTreeColor()`を使ってツリーの色分けを追加（各子ノートにindexで色分け）
  - [x] 深さバッジ（Q1, Q2...の丸いバッジ）を追加
  - [x] 進捗バー（depth/5のプログレスバー）を追加
  - [x] 最後の質問（depth=5）での特別な絵文字（🎯）を追加
  - [x] 質問エリアのボーダー・背景色を色分けに合わせる
- [x] `DeepDiveTree`内で各子ノートに対して`getTreeColor(index)`を使用して色分け
- [x] ラッパーdivに背景色とボーダー色を適用
- [x] 動作確認：深堀り中のツリー表示がNoteList側と同じスタイルで色分けされて表示される
- [x] ユーザーにチェックをもらう(必須)

# 実装結果サマリー

## 修正したファイル
- `src/app/components/DeepDiveTree.tsx` - QAItemコンポーネントのスタイル統一、色分け実装
- `src/app/components/DoitKunArea.tsx` - 不要なimport削除

## 特に報告したい内容

### 1. ツリー表示の統一
- `QAItem`コンポーネントを`ChildNoteCard`と完全に同じスタイルに統一
- 深さバッジ（Q1, Q2...）、進捗バー、絵文字表示を実装
- 最後の質問（depth=5）で🎯絵文字を表示

### 2. 色分けの実装
- `DeepDiveTree`内で各子ノート（深堀り履歴）ごとに`getTreeColor(index)`を使用
- 1つ目: 青色、2つ目: 緑色、3つ目: 紫色...と自動的に色分け
- ラッパーdivに`${treeColor.bg}`（背景色）と`${treeColor.border}`（ボーダー色）を適用

### 3. コードのクリーンアップ
- 不要な`treeColor` propsを削除
- 各コンポーネント内で直接`getTreeColor`を使用する設計に変更

## 処理の流れ
1. `DeepDiveTree`が親ノートと子ノート（深堀り履歴）を受け取る
2. 各子ノートに対して`getTreeColor(index)`で色を割り当て
3. ラッパーdivに背景色とボーダー色を適用
4. `QAItem`内で質問カード、回答カード、進捗バーに色を反映
5. NoteList側と完全に同じUIで表示される
