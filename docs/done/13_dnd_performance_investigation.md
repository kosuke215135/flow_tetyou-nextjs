# 目的

ドラッグ&ドロップ操作が重い原因を調査し、パフォーマンスを改善する。

## 背景
- ドラッグ&ドロップ操作がかなり重く、UXが悪化している
- 原因が特定されていない（再レンダリング、コンポーネント構造、@dnd-kit設定など）
- スムーズな操作感の実現が必要

# ゴール

ドラッグ&ドロップのパフォーマンス問題を特定し、改善策を実装する

# データベース関連の変更

なし

# 編集するファイル名

- `src/app/page.tsx` または `src/app/components/NotesPage.tsx`
- `src/app/components/NoteCard.tsx`
- 必要に応じて他のコンポーネント

# 新たに導入するライブラリ

なし（調査結果次第で検討）

# タスク

## Phase 1: 調査
- [x] React DevTools Profilerで再レンダリングを分析
- [x] ドラッグ中の不要な再レンダリングを特定
- [x] @dnd-kitの設定を確認（sensors, collision detection等）
- [x] コンポーネントの構造とメモ化の状況を確認

**調査結果:**
1. @dnd-kit sensors未設定 → 不要なイベントが多い
2. handleDragEnd、handleMouseDownが毎レンダリングで再生成
3. NoteCardがメモ化されておらず、notes変更時に全て再レンダリング
4. SWRの5秒ポーリングで不要な再レンダリング
5. **stickyポジション + スクロールが最大の原因** → スクロール毎にレイアウト再計算

## Phase 2: 改善
- [x] 特定された問題に対する改善策を実装
  - page.tsx: PointerSensorとKeyboardSensorを明示的に設定
  - page.tsx: handleDragEndとhandleMouseDownをuseCallbackでメモ化
  - NoteCard.tsx: React.memoでコンポーネント全体をメモ化
  - NoteCard.tsx: 未使用のindex propsとscore変数を削除
  - NoteCard.tsx: 未使用のFaStar, FaRegStarインポートを削除
  - NotesList.tsx: index引数を削除
- [x] @dnd-kitの設定を最適化
- [x] 改善前後のパフォーマンス比較
  - ユーザー確認により改善を確認

## Phase 3: 動作確認
- [x] ユーザーにチェックをもらう(必須)
