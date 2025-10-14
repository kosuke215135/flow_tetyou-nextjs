# 目的
ツリー表示の視認性を向上させ、複数の深堀りがある場合でも区別しやすくする。

## 背景
- 現在のツリー表示は、複数の深堀りがある場合にどちらのツリーなのか視認しづらい
- インデントと線だけでは、深堀りの流れが分かりにくい
- 親ノートと子ノートの関係性が一目で分かりにくい

# ゴール
1. 複数の深堀りツリーを視覚的に区別しやすくする
2. 親子関係を明確に表現する
3. 深堀りの深さを視覚的に理解しやすくする
4. 全体的な見た目を洗練させる

# データベース関連の変更
- なし（既存のスキーマで対応可能）

# 編集するファイル名
- `src/app/components/NoteCard.tsx` - ツリー表示のデザイン改善
- `src/app/components/ChildNoteCard.tsx` - 子ノートのデザイン改善（または統合）
- `src/app/globals.css` - 必要に応じてカスタムスタイル追加

# 新たに導入するライブラリ
- なし

# タスク

## Task 1: ツリーの視覚的区別
- [x] 各深堀りツリーに色分けを導入
  - [x] ツリーごとに異なるアクセントカラーを自動割り当て
  - [x] パステルカラーで目に優しく
  - [x] 色はツリーのインデックスから決定的に生成
- [x] ツリー全体を囲むコンテナを追加
  - [x] 左側に色付きのボーダー
  - [x] 背景色を薄く付ける
  - [x] ホバー時にハイライト（親ノートカード）

## Task 2: 親子関係の明確化
- [x] コネクターライン（connecting line）の改善
  - [x] 親ノードから子ノードへの視覚的な線を強化
  - [x] 実線で表示
  - [x] 色を各ツリーのアクセントカラーに合わせる
- [x] 階層構造の視覚化
  - [x] インデントを維持
  - [x] depth表示を追加（Q1, Q2...のバッジ）

## Task 3: 深堀りの深さの視覚化
- [x] 深さインジケーターを追加
  - [x] 各質問に「Q1」「Q2」...「Q5」のバッジを表示
  - [x] 進捗バー形式で深さを表示
  - [x] 進捗バーの色は各ツリーのアクセントカラーに統一
- [x] 質問タイプの視覚的区別
  - [x] 質問カードは白背景＋左側の太い色付きボーダー
  - [x] 最後の質問（Q5）は🎯アイコンで区別
  - [x] 通常の質問は💪アイコン

## Task 4: 全体的なデザイン改善
- [x] カード形式の洗練
  - [x] シャドウの調整
  - [x] 角丸の調整
  - [x] パディングとマージンの最適化
- [x] アニメーション追加
  - [x] ホバー時の軽微なアニメーション（親ノートカード）
  - [x] 進捗バーのトランジション効果

## Task 5: 動作確認
- [x] 複数の深堀りツリーがある場合の視認性を確認
- [x] 色分けが適切に機能しているか確認
- [x] 質問カードの視認性を確認

## Task 6: ユーザーにチェックをもらう(必須)
- [x] 見やすさが改善されているか確認
- [x] 複数ツリーの区別がしやすいか確認

# 実装詳細

## 1. ツリーの色分け

### 色生成関数
```tsx
// utils/colors.ts
const TREE_COLORS = [
  { border: 'border-blue-300', bg: 'bg-blue-50', accent: 'bg-blue-500' },
  { border: 'border-green-300', bg: 'bg-green-50', accent: 'bg-green-500' },
  { border: 'border-purple-300', bg: 'bg-purple-50', accent: 'bg-purple-500' },
  { border: 'border-pink-300', bg: 'bg-pink-50', accent: 'bg-pink-500' },
  { border: 'border-orange-300', bg: 'bg-orange-50', accent: 'bg-orange-500' },
  { border: 'border-teal-300', bg: 'bg-teal-50', accent: 'bg-teal-500' },
];

export function getTreeColor(index: number) {
  return TREE_COLORS[index % TREE_COLORS.length];
}
```

### NoteCard.tsx での適用
```tsx
interface NoteCardProps {
  note: NoteWithChildren;
  index: number; // リスト内のインデックス
}

export function NoteCard({ note, index }: NoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = note.children && note.children.length > 0;
  const treeColor = getTreeColor(index);

  return (
    <div className="relative mb-12">
      {/* 親ノート */}
      <div
        className={`
          bg-white rounded-lg shadow-md p-6 border-l-4 ${treeColor.border}
          hover:shadow-lg transition-shadow duration-200
        `}
      >
        {/* ノート内容 */}
        <div className="prose prose-sm max-w-none">
          <EditorContent editor={editor} />
        </div>

        {/* タイムスタンプ、削除ボタンなど */}
      </div>

      {/* 子ノートツリー */}
      {hasChildren && isExpanded && (
        <div className={`mt-4 ml-8 pl-6 border-l-2 ${treeColor.border} ${treeColor.bg} rounded-lg p-4`}>
          {note.children.map((child, childIndex) => (
            <ChildNoteCard
              key={child.id}
              note={child}
              depth={child.depth}
              treeColor={treeColor}
            />
          ))}
        </div>
      )}

      {/* 折りたたみボタン */}
      {hasChildren && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            absolute bottom-0 left-4 translate-y-full mt-2
            px-4 py-2 ${treeColor.accent} text-white rounded-b-lg text-sm
            hover:opacity-90 transition-opacity
            flex items-center gap-2
          `}
        >
          <span>{isExpanded ? '▼' : '▶'}</span>
          <span>深堀り{note.children.length}</span>
        </button>
      )}
    </div>
  );
}
```

## 2. 子ノートの改善

### ChildNoteCard.tsx
```tsx
interface ChildNoteCardProps {
  note: NoteWithChildren;
  depth: number;
  treeColor: TreeColor;
}

export function ChildNoteCard({ note, depth, treeColor }: ChildNoteCardProps) {
  const isLastQuestion = depth === 5;
  const depthColor = isLastQuestion ? 'bg-green-100 border-green-400' : 'bg-yellow-100 border-yellow-400';

  return (
    <div className="mb-6 space-y-2">
      {/* 質問 */}
      <div className={`p-4 rounded-lg border-l-4 ${depthColor} relative`}>
        {/* 深さバッジ */}
        <div className={`
          absolute -left-3 -top-3 w-8 h-8 rounded-full ${treeColor.accent}
          flex items-center justify-center text-white text-xs font-bold
          shadow-md
        `}>
          Q{depth}
        </div>

        {/* 質問アイコン */}
        <div className="flex items-start gap-2">
          <span className="text-xl">{isLastQuestion ? '🎯' : '💪'}</span>
          <div className="flex-1">
            <div className="text-xs font-semibold text-gray-600 mb-1">
              {isLastQuestion ? 'ドゥイットくんの最後の質問' : 'ドゥイットくんの質問'}
            </div>
            <div className="text-sm font-medium text-gray-800">
              {note.question}
            </div>
          </div>
        </div>
      </div>

      {/* 回答 */}
      <div className="ml-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-gray-500">あなたの回答:</span>
        </div>
        <div className="prose prose-sm max-w-none">
          {/* TipTap content */}
        </div>
        <div className="text-xs text-gray-400 mt-2">
          {new Date(note.createdAt).toLocaleString('ja-JP')}
        </div>
      </div>

      {/* 進捗バー（オプション） */}
      <div className="ml-6 flex items-center gap-2">
        <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${treeColor.accent} transition-all duration-300`}
            style={{ width: `${(depth / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-500">{depth}/5</span>
      </div>

      {/* 再帰的に子ノードを表示 */}
      {note.children && note.children.length > 0 && (
        <div className="ml-6 mt-4">
          {note.children.map((child) => (
            <ChildNoteCard
              key={child.id}
              note={child}
              depth={child.depth}
              treeColor={treeColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

## 3. アニメーション

### globals.css or Tailwind config
```css
/* 折りたたみアニメーション */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}

.tree-expand {
  animation: slideDown 0.3s ease-out;
}

.tree-collapse {
  animation: slideUp 0.3s ease-out;
}

/* ホバーアニメーション */
.note-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.note-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}
```

## 4. レスポンシブデザイン

### スマホ対応
```tsx
// NoteCard.tsx
<div className="relative mb-12">
  <div className={`
    bg-white rounded-lg shadow-md p-4 md:p-6
    border-l-4 ${treeColor.border}
  `}>
    {/* ... */}
  </div>

  {hasChildren && isExpanded && (
    <div className={`
      mt-4 ml-4 md:ml-8 pl-4 md:pl-6
      border-l-2 ${treeColor.border}
    `}>
      {/* ... */}
    </div>
  )}
</div>
```

# 期待される効果
- 複数の深堀りツリーが一目で区別できる
- 思考の流れが視覚的に理解しやすくなる
- アプリ全体の洗練度が向上する
- ユーザーが自分の思考整理をより楽しめる

# 注意事項
- 色の使いすぎに注意（アクセシビリティ）
- アニメーションは控えめに（パフォーマンス）
- レスポンシブデザインで崩れないように十分テスト
- カラーブラインドのユーザーにも配慮（色だけに依存しない）
