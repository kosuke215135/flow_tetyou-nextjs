# 目的

現在、AIキャラクター（ドゥイットくんとリスナーさん）のプロンプトがactions.ts内にハードコーディングされており、プロンプトの改善や調整が困難な状態になっています。プロンプトを外部ファイルに分離して管理しやすくし、今後の改善作業をスムーズに行えるようにします。

# ゴール

- プロンプト定義を専用の設定ファイル（`src/lib/prompts.ts`）に分離
- キャラクター（doitkun/listener）と深度（depth）に応じたプロンプトを関数として提供
- actions.tsからプロンプト生成ロジックを呼び出すように修正
- 既存の動作を維持しつつ、プロンプトの修正・追加が容易になる

# データベース関連の変更

なし（既存のスキーマを使用）

# 編集するファイル名

- `src/lib/prompts.ts`（新規作成）
- `src/lib/actions.ts`（修正）

# 新たに導入するライブラリ

なし

# タスク

- [x] `src/lib/prompts.ts`を作成
  - [x] `PromptContext`インターフェースを定義（originalText, qaHistory, currentDepth）
  - [x] `generatePrompt()`関数を実装（キャラクターとコンテキストから適切なプロンプトを返す）
  - [x] `generateListenerPrompt()`関数を実装（リスナーさん用のプロンプト生成）
  - [x] `generateDoitkunPrompt()`関数を実装（ドゥイットくん用のプロンプト生成）
- [x] `src/lib/actions.ts`を修正
  - [x] `generatePrompt`をインポート
  - [x] `generateDeepDiveQuestion()`内のハードコーディングされたプロンプト生成ロジックを削除
  - [x] `generatePrompt()`を呼び出すように変更
- [ ] 動作確認
  - [ ] ドゥイットくんでノートをドラッグ&ドロップして深堀りが正常に動作するか確認
  - [ ] リスナーさんでノートをドラッグ&ドロップして深堀りが正常に動作するか確認
  - [ ] 各深度（depth 0-4）でプロンプトが適切に変化するか確認
- [ ] ユーザーにチェックをもらう（必須）
