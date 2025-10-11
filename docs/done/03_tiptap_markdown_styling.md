# 目的
TipTapエディタでマークダウン記法（見出し、太字、リストなど）を使って入力できるが、CSSが適用されていないため、書式が反映されているかどうか分からない。エディタと表示部分の両方に適切なスタイリングを適用し、マークダウンの書式が視覚的に分かるようにする。

## 背景
- TipTapエディタはマークダウン記法をサポートしているが、デフォルトではスタイルが適用されない
- ユーザーが見出しや太字を書いても、通常のテキストと区別がつかない
- ノートの表示部分（`NoteCard.tsx`）でも同様にスタイルが適用されていない
- 可読性とユーザー体験が低下している

# ゴール
- TipTapエディタ内で入力中にマークダウンの書式が視覚的に分かる
- 保存されたノートの表示時もマークダウンの書式が適切に表示される
- 以下の要素に対してスタイルを適用:
  - 見出し（H1, H2, H3, H4, H5, H6）
  - 太字、斜体
  - リスト（順序あり・なし）
  - タスクリスト
  - コードブロック（既にlowlightで対応済みだが確認）
  - リンク
  - 引用

# データベース関連の変更
なし

# 編集するファイル名
- `src/app/globals.css` - TipTap用のグローバルスタイルを追加
- `src/app/components/Editor.tsx` - エディタにスタイル用のクラス名を追加
- `src/app/components/NoteCard.tsx` - 表示部分にTipTapのHTML出力を適切にスタイリング

# 新たに導入するライブラリ
- `@tailwindcss/typography` (v0.5.19) - Tailwind CSS Typography プラグイン

# タスク
- [x] TipTapの推奨スタイリング方法を調査
  - Tailwind CSS v4 で `@tailwindcss/typography` が使用可能であることを確認
  - `@plugin` ディレクティブで統合する方法を採用
- [x] `@tailwindcss/typography` をインストール
- [x] `globals.css`にプラグインを追加し、prose スタイルをカスタマイズ
  - [x] 文字サイズ: 1rem、行間: 1.6 に設定
  - [x] 段落・見出しの間隔を調整（0.5em〜0.75em）
  - [x] タスクリストのスタイル（チェックボックスとテキストの位置を揃える）
  - [x] コードブロックのスタイル（背景色、パディング、シンタックスハイライト）
  - [x] リンクのスタイル（青色、下線、ホバー効果）
- [x] `Editor.tsx`に`prose`クラスを適用
  - `prose-sm` から `prose` に変更
  - `onSelectionUpdate` を追加してツールバーの再レンダリングをトリガー
- [x] `NoteCard.tsx`のスタイルを確認・調整
  - `prose-sm` から `prose` に変更
- [x] `RichEditorToolbar.tsx`のUI/UX改善
  - アイコンサイズを24px (w-6 h-6) に拡大
  - ボタンにパディング (p-2) を追加
  - アクティブ状態を青色背景 (bg-blue-600) で視覚化
  - useEffect でエディタの update/selectionUpdate イベントをリッスンし、リアルタイム更新を実現
- [x] 各種マークダウン記法を実際に入力してスタイルを確認
- [x] ユーザーにチェックをもらう(必須)

---

## 実装結果

### 修正したファイル
1. **package.json** - `@tailwindcss/typography` (v0.5.19) を追加
2. **src/app/globals.css**
   - `@plugin "@tailwindcss/typography"` を追加
   - `.prose` のフォントサイズ・行間をカスタマイズ
   - タスクリスト、コードブロック、リンクのスタイルを追加
3. **src/app/components/Editor.tsx**
   - `editorProps.attributes.class` に `prose` クラスを適用
   - `onSelectionUpdate` を追加してツールバーの状態更新をトリガー
4. **src/app/components/NoteCard.tsx**
   - `prose-sm` を `prose` に変更
5. **src/app/components/RichEditorToolbar.tsx**
   - アイコンサイズを `w-6 h-6` (24px) に拡大
   - アクティブ状態を `bg-blue-600 text-white` で視覚化
   - `useEffect` でエディタの `update`/`selectionUpdate` イベントをリッスン

### 技術的なポイント
- **Tailwind CSS v4 対応**: `@plugin` ディレクティブを使用してプラグインを統合
- **完全Tailwind化**: カスタムCSSは最小限に抑え、主にTailwindクラスで実装
- **リアルタイム更新**: useEffect + editor.on() でツールバーのアクティブ状態を即座に反映
- **アクセシビリティ**: チェックボックスとテキストの垂直位置を `align-items: center` で揃える

### 処理の流れ
1. ユーザーがエディタでマークダウンを入力 → `prose` クラスによりリアルタイムでスタイリング
2. ツールバーのボタンをクリック → アクティブ時は青色背景、非アクティブ時はグレー背景
3. カーソル移動・テキスト選択 → `editor.on('selectionUpdate')` でツールバーが再レンダリング
4. ノート保存後 → `NoteCard.tsx` の `prose` クラスにより表示時も同じスタイル

### ユーザー体験の改善
- マークダウンの書式が視覚的に分かりやすくなった
- ツールバーが大きく、タッチ操作でも使いやすい
- アクティブなツールが一目で分かる
- 読みやすいフォントサイズと行間
