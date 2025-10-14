# 目的
深堀り機能のUX改善 Phase 1として、基本的で効果的な改善を実装する。

## 背景
- 現在、ドロップゾーンが画面上部に固定されており、下の方のノートをドラッグするためにスクロールが必要
- 深堀りを途中で辞める手段がなく、5回すべて答える必要がある
- 不要なノートやツリーを削除する機能がない

# ゴール
1. ドロップゾーンをスクロールに追従させる（sticky化）
2. 深堀り中に中断できるボタンを追加
3. ノートの削除機能を実装

# データベース関連の変更
- なし（既存のスキーマで対応可能）

# 編集するファイル名
- `src/app/page.tsx` - サイドバーのsticky化、handleDragEndでゴミ箱削除処理追加
- `src/app/components/DoitKunArea.tsx` - 中断ボタン追加、ゴミ箱ドロップゾーン追加
- `src/app/components/NoteCard.tsx` - ドラッグパフォーマンス改善
- `src/app/components/NotesList.tsx` - NoteCardにindexプロップを渡すように修正
- `src/lib/actions.ts` - deleteNote()サーバーアクション追加

# 新たに導入するライブラリ
- なし

# タスク

## Task 1: ドロップゾーンのsticky化
- [x] `page.tsx`のサイドバーに`sticky top-0`、`height: '100vh'`、`overflow-y-auto`を追加
- [x] レイアウトを調整してstickyが正しく動作するか確認
- [x] スクロール時の挙動をテスト

## Task 2: 深堀り中断機能
- [x] `DoitKunArea.tsx`に「中断する」ボタンを追加
  - [x] 深堀りモード中のみ表示
  - [x] クリック時に確認ダイアログを表示
  - [x] 中断時は現在の状態を保持（途中まで保存済み）
  - [x] 待機状態に戻る
- [x] 中断後の挙動をテスト

## Task 3: ノート削除機能（ドラッグ&ドロップ方式）
- [x] `src/lib/actions.ts`に`deleteNote(noteId)`サーバーアクション追加
  - [x] 認証チェック
  - [x] ノートの所有者確認
  - [x] Prismaで削除（onDelete: Cascadeで子ノートも自動削除）
  - [x] revalidatePath('/')
- [x] `DoitKunArea.tsx`にゴミ箱ドロップゾーンを追加
  - [x] ドゥイットくんエリアの下部に配置
  - [x] スペーサーで視覚的に分離
  - [x] ドラッグオーバー時に色が変わる
  - [x] ドロップ時に確認ダイアログ表示
  - [x] 削除後にSWRで自動更新
- [x] `page.tsx`のhandleDragEndでゴミ箱への削除処理を実装
- [x] `NoteCard.tsx`のドラッグパフォーマンス改善（cursor-grabをclassNameに移動）
- [x] 削除機能のテスト
  - [x] 親ノートを削除すると子ノートも削除されるか確認
  - [x] 削除後のUI更新を確認

## Task 4: 動作確認
- [x] ドロップゾーンがスクロールに追従することを確認
- [x] 深堀りを途中で中断できることを確認
- [x] ノートをゴミ箱にドロップして削除できることを確認
- [x] 削除時に子ノートもカスケード削除されることを確認
- [x] ドラッグの重さが改善されたことを確認

## Task 5: ユーザーにチェックをもらう(必須)
- [x] 全機能の動作確認

# 実装詳細

## 1. ドロップゾーンのsticky化

### 実装内容
`page.tsx`のサイドバー（asideタグ）に以下を追加：
```tsx
<aside
  ref={sidebarRef}
  style={{ width: `${sidebarWidth}px`, height: '100vh' }}
  className="sticky top-0 relative p-8 bg-gray-50 border-l border-gray-200 overflow-y-auto"
>
```

### ポイント
- `sticky top-0`: 画面上部に固定
- `height: '100vh'`: ビューポート全体の高さ
- `overflow-y-auto`: サイドバー内でスクロール可能
- スクロール時にドロップゾーンが常に見える状態を維持

## 2. 深堀り中断機能

### UI追加
`DoitKunArea.tsx`の深堀りモード中に中断ボタンを追加：
```tsx
{/* 中断ボタン */}
<div className="mt-4 flex justify-center">
  <button
    onClick={handleAbort}
    disabled={deepDiveState.isLoading}
    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  >
    中断する
  </button>
</div>
```

### 中断処理
```tsx
const handleAbort = () => {
  if (confirm('深堀りを中断しますか？これまでの回答は保存されています。')) {
    setDeepDiveState(null);
    mutate('deepdive-notes'); // ツリー表示を更新
  }
};
```

### ポイント
- 深堀り中のみ表示
- ローディング中は無効化
- 確認ダイアログで誤操作を防止
- これまでの回答は保存されたまま

## 3. ノート削除機能（ドラッグ&ドロップ方式）

### サーバーアクション
`src/lib/actions.ts`に追加：
```tsx
export async function deleteNote(noteId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // ノートの所有者確認
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note || note.userId !== session.user.id) {
      return { success: false, error: 'Note not found or unauthorized' };
    }

    // 削除（子ノートもonDelete: Cascadeで自動削除）
    await prisma.note.delete({
      where: { id: noteId },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteNote:', error);
    return { success: false, error: 'Failed to delete note' };
  }
}
```

### ゴミ箱ドロップゾーンの追加
`DoitKunArea.tsx`の待機モード（待機中の表示）にゴミ箱エリアを追加：
```tsx
const { isOver: isOverTrash, setNodeRef: setTrashNodeRef } = useDroppable({
  id: 'trash-drop-zone',
});

// ...待機中の表示の中に追加

{/* スペーサー */}
<div className="my-12 border-t-2 border-gray-300"></div>

{/* ゴミ箱エリア */}
<div className="mt-8">
  <h3 className="text-sm font-bold text-gray-700 mb-4 text-center">🗑️ ゴミ箱</h3>
  <div
    ref={setTrashNodeRef}
    className={`
      min-h-[150px]
      border-4 border-dashed rounded-lg
      flex flex-col items-center justify-center
      transition-all duration-200
      ${isOverTrash
        ? 'border-red-500 bg-red-50'
        : 'border-gray-300 bg-gray-50'
      }
    `}
  >
    <div className="flex flex-col items-center gap-2">
      <div className="text-5xl">🗑️</div>
      <p className="text-sm font-semibold text-gray-700">
        {isOverTrash ? 'ここでドロップして削除' : 'ノートをここにドロップして削除'}
      </p>
    </div>
  </div>
</div>
```

### ドラッグ&ドロップ処理
`page.tsx`の`handleDragEnd`で削除処理：
```tsx
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;

  if (over && over.id === 'doitkun-drop-zone') {
    console.log('Dropped note:', active.id);
    setDroppedNoteId(String(active.id));
  } else if (over && over.id === 'trash-drop-zone') {
    // ゴミ箱へドロップされた
    if (confirm('このノートを削除しますか？深堀り履歴も一緒に削除されます。')) {
      const result = await deleteNote(String(active.id));
      if (result.success) {
        mutate('notes'); // SWRで再検証
      } else {
        alert('削除に失敗しました: ' + result.error);
      }
    }
  }
};
```

### ドラッグパフォーマンス改善
`NoteCard.tsx`でカーソルスタイルをclassNameに移動：
```tsx
// Before
const style = {
  transform: CSS.Translate.toString(transform),
  opacity: isDragging ? 0.5 : 1,
  cursor: 'grab',  // これを削除
};

// After
const style = {
  transform: CSS.Translate.toString(transform),
  opacity: isDragging ? 0.5 : 1,
};

// classNameに追加
className="... cursor-grab active:cursor-grabbing"
```

### ポイント
- ボタン方式からドラッグ&ドロップ方式に変更（直感的な操作）
- ゴミ箱エリアはドゥイットくんエリアの下部に配置
- スペーサーで視覚的に分離し、誤操作を防止
- ドラッグオーバー時に色が変わり、視覚的フィードバックを提供
- カーソルスタイルの最適化でドラッグが軽快に

# 期待される効果
- ドロップゾーンが常に見える状態になり、ドラッグ&ドロップがしやすくなる
- 深堀りを途中で辞められるため、ユーザーの自由度が向上
- 不要なノートを削除できるため、ノートリストが整理しやすくなる

# 注意事項
- 削除は元に戻せないため、確認ダイアログを必ず表示する
- 子ノートはカスケード削除されるため、ユーザーに明示的に伝える
- sticky化により、画面の高さによってはコンテンツが隠れる可能性があるため、レイアウトに注意
