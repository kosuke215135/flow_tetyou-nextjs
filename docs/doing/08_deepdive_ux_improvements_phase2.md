# 目的
深堀り機能のUX改善 Phase 2として、深堀り体験の質を向上させる。

## 背景
- 現在の深堀りUIは質問と回答入力欄だけで、どの親ノートの深堀りなのか、これまでの質問・回答がどうだったかが見えない
- ドゥイットくんの質問があまり役に立たない（抽象的すぎる、文脈を考慮していない、など）
- 深堀り中の体験が単調で、思考の流れが見えづらい

# ゴール
1. 深堀りUI改善: 入力時にツリー形式で親ノートと過去の質問・回答を表示
2. ドゥイットくんの質問の質を改善: より役立つ、文脈を考慮した質問を生成

# データベース関連の変更
- なし（既存のスキーマで対応可能）

# 編集するファイル名
- `src/app/components/DoitKunArea.tsx` - UIを大幅に改善
- `src/lib/actions.ts` - generateDeepDiveQuestion()のプロンプトを改善
- `src/app/components/DeepDiveTree.tsx` - 新規作成（深堀り中のツリー表示コンポーネント）

# 新たに導入するライブラリ
- なし

# タスク

## Task 1: 深堀りUIの改善
- [ ] `DeepDiveTree.tsx`コンポーネントを新規作成
  - [ ] 親ノートの内容を表示
  - [ ] これまでの質問と回答を時系列で表示
  - [ ] 現在の質問をハイライト表示
  - [ ] インデント付きのツリー形式で視覚的にわかりやすく
- [ ] `DoitKunArea.tsx`のレイアウトを変更
  - [ ] 左側: DeepDiveTreeコンポーネント
  - [ ] 右側: 現在の質問 + 回答入力エディタ
  - [ ] 2カラムレイアウトで表示
- [ ] 深堀り中のデータ取得
  - [ ] droppedNoteIdから親ノートと既存の子ノートを取得
  - [ ] リアルタイムで更新されるよう、SWRで管理
- [ ] レスポンシブ対応
  - [ ] スマホでは1カラム（ツリーは折りたたみ可能）

## Task 2: ドゥイットくんの質問の質改善
- [ ] `generateDeepDiveQuestion()`のプロンプトを改善
  - [ ] これまでの全質問・回答を文脈として渡す
  - [ ] depthに応じてより具体的な指示を出す
  - [ ] 「なぜ？」だけでなく、「具体的には？」「それで何が起きた？」など多様な質問形式
- [ ] depth別のプロンプト戦略
  - [ ] depth 0-1: 表面的な「なぜ？」を掘り下げる
  - [ ] depth 2-3: 感情や動機を探る
  - [ ] depth 4: 具体的な行動を引き出す
- [ ] 質問生成のロジック改善
  - [ ] 同じような質問を繰り返さない
  - [ ] 前の回答を踏まえた質問にする
  - [ ] ドゥイットくんのキャラクターを活かしつつ、実用的に

## Task 3: 動作確認
- [ ] 深堀り中にツリー表示が正しく表示されるか確認
- [ ] 親ノートと過去の質問・回答が見やすいか確認
- [ ] ドゥイットくんの質問が改善されているか確認
- [ ] レスポンシブデザインが正しく動作するか確認

## Task 4: ユーザーにチェックをもらう(必須)
- [ ] 全機能の動作確認
- [ ] 質問の質が実際に役立つか確認

# 実装詳細

## 1. 深堀りUIの改善

### DeepDiveTree.tsx コンポーネント
```tsx
interface DeepDiveTreeProps {
  parentNote: NoteWithChildren;
  currentDepth: number;
  currentQuestion: string;
}

export function DeepDiveTree({ parentNote, currentDepth, currentQuestion }: DeepDiveTreeProps) {
  return (
    <div className="space-y-4">
      {/* 親ノート */}
      <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
        <div className="text-xs text-blue-600 font-semibold mb-2">📝 元のメモ</div>
        <div className="prose prose-sm">
          {/* TipTap content rendering */}
        </div>
      </div>

      {/* 既存の質問と回答 */}
      {parentNote.children?.map((child, index) => (
        <div key={child.id} className="ml-4 space-y-2">
          {/* 質問 */}
          <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
            <div className="text-xs text-yellow-700 font-semibold mb-1">
              💪 Q{index + 1}: {child.question}
            </div>
          </div>
          {/* 回答 */}
          <div className="ml-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 font-semibold mb-1">A{index + 1}:</div>
            <div className="prose prose-sm">
              {/* TipTap content rendering */}
            </div>
          </div>
        </div>
      ))}

      {/* 現在の質問 */}
      {currentQuestion && (
        <div className="ml-4 p-3 bg-green-50 rounded-lg border-l-4 border-green-400 animate-pulse">
          <div className="text-xs text-green-700 font-semibold mb-1">
            💪 Q{currentDepth + 1}: {currentQuestion}
          </div>
          <div className="text-xs text-green-600 mt-2">
            👉 右側で回答を入力してください
          </div>
        </div>
      )}
    </div>
  );
}
```

### DoitKunArea.tsx のレイアウト変更
```tsx
// 深堀りモード中
{deepDiveState === 'questioning' && droppedNoteId && currentQuestion && (
  <div className="flex flex-col lg:flex-row gap-4 h-full">
    {/* 左側: ツリー表示 */}
    <div className="w-full lg:w-1/2 overflow-y-auto max-h-[600px] border-r pr-4">
      <DeepDiveTree
        parentNote={parentNote}
        currentDepth={currentDepth}
        currentQuestion={currentQuestion}
      />
    </div>

    {/* 右側: 回答入力 */}
    <div className="w-full lg:w-1/2">
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">
          💬 ドゥイットくん: {currentQuestion}
        </div>
        <div className="text-xs text-gray-500">
          進捗: {currentDepth + 1}/5
        </div>
      </div>

      {/* TipTapエディタ */}
      <Editor
        content={editorContent}
        onUpdate={setEditorContent}
        onSubmit={handleAnswerSubmit}
        submitButtonText="次へ →"
      />

      {/* ボタン */}
      <div className="mt-4 flex gap-2">
        <button onClick={handleAbort}>中断する</button>
      </div>
    </div>
  </div>
)}
```

## 2. ドゥイットくんの質問の質改善

### プロンプト改善戦略

#### depth 0-1: 表面を掘り下げる
```
君はドゥイットくん。脳筋行動派のパーソナルトレーナー（ニート）だ。

【状況】
ユーザーが以下のモヤモヤを抱えている。
「${noteText}」

【依頼】
このモヤモヤの「なぜ？」を1つ聞け。
表面的な理由を探るんだ。シンプルに、ストレートに。

例:
- なぜそう思うんだ？
- なぜそれが気になるんだ？
- なぜ今なんだ？

質問文だけを返せ。余計な説明は不要だ。
```

#### depth 2-3: 感情や動機を探る
```
君はドゥイットくん。脳筋行動派のパーソナルトレーナー（ニート）だ。

【これまでの流れ】
元のモヤモヤ: 「${originalNote}」
Q1: ${question1} → A1: ${answer1}
Q2: ${question2} → A2: ${answer2}

【依頼】
もっと深く掘り下げろ。感情や本当の動機を探るんだ。

例:
- それで君はどう感じてるんだ？
- 本当はどうしたいんだ？
- 何が君を止めてるんだ？

質問文だけを返せ。
```

#### depth 4: 行動を引き出す
```
君はドゥイットくん。脳筋行動派のパーソナルトレーナー（ニート）だ。

【これまでの深堀り】
${allQuestionsAndAnswers}

【依頼】
最後の質問だ。具体的な行動を引き出せ。

例:
- で、どうしたいんだ？
- 明日から何ができる？
- 最初の一歩は何だ？

質問文だけを返せ。
```

### 実装例
```tsx
export async function generateDeepDiveQuestion(noteId: string, currentDepth: number) {
  // ... (認証チェック等)

  // 親ノートと既存の子ノートを取得
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: {
      children: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  const originalText = extractTextFromContent(JSON.parse(note.text));

  // これまでの質問と回答を構築
  const qaHistory = note.children.map((child, index) => {
    const answerText = extractTextFromContent(JSON.parse(child.text));
    return `Q${index + 1}: ${child.question}\nA${index + 1}: ${answerText}`;
  }).join('\n\n');

  // depthに応じてプロンプトを切り替え
  let prompt = '';
  if (currentDepth <= 1) {
    prompt = `君はドゥイットくん。脳筋行動派のパーソナルトレーナー（ニート）だ。

【状況】
ユーザーが以下のモヤモヤを抱えている。
「${originalText}」

${qaHistory ? `【これまでの会話】\n${qaHistory}\n\n` : ''}

【依頼】
このモヤモヤの「なぜ？」を1つ聞け。
表面的な理由を探るんだ。シンプルに、ストレートに。

質問文だけを返せ。余計な説明は不要だ。`;
  } else if (currentDepth <= 3) {
    prompt = `君はドゥイットくん。脳筋行動派のパーソナルトレーナー（ニート）だ。

【元のモヤモヤ】
「${originalText}」

【これまでの会話】
${qaHistory}

【依頼】
もっと深く掘り下げろ。感情や本当の動機を探るんだ。
前の回答を踏まえて、核心に迫る質問をしろ。

質問文だけを返せ。`;
  } else {
    prompt = `君はドゥイットくん。脳筋行動派のパーソナルトレーナー（ニート）だ。

【元のモヤモヤ】
「${originalText}」

【これまでの深堀り】
${qaHistory}

【依頼】
最後の質問だ。具体的な行動を引き出せ。
「で、どうしたいんだ？」という視点で聞け。

質問文だけを返せ。`;
  }

  // Gemini APIで質問生成
  const response = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [prompt],
  });

  const question = response.text?.trim() || '';

  if (!question) {
    return { success: false, error: 'Failed to generate question from AI' };
  }

  return { success: true, data: question };
}
```

# 期待される効果
- 深堀り中に思考の流れが可視化され、ユーザーが自分の考えを整理しやすくなる
- 文脈を考慮した質問により、より深い気づきが得られる
- ドゥイットくんとの対話がより価値のあるものになる

# 注意事項
- ツリー表示が長くなりすぎないよう、スクロール可能な領域を設ける
- Gemini APIのトークン数制限に注意（長い会話履歴を送る場合）
- 質問の質は実際にユーザーに試してもらってフィードバックを得る必要がある
