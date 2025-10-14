# 目的
新しいAIアシスタント「リスナーさん（Listen）」を追加し、ユーザーが複数のキャラクターから選んで深堀りを行えるようにする。

## 背景
現在は「ドゥイットくん」のみが実装されており、脳筋・行動派のアプローチで深堀りを行う。しかし、ユーザーのモヤモヤの性質によっては、優しく受け止めて整理してくれる「リスナーさん」のほうが適している場合がある。複数のキャラクターを選べるようにすることで、ユーザーの状態やニーズに合わせた深堀り体験を提供する。

## リスナーさんのキャラクター設定
**基本情報:**
- 名前: リスナーさん（Listen）
- 年齢: 27歳
- 職業: メンタルリカバリーコーチ（実質ニート）
- 性格: 常に穏やかで、少し眠たげ。聞き上手で、相手の話を否定せずに受け止める。どんなにテンションが高い相手でも、自然と落ち着かせてしまう。"頑張ること"よりも"休むこと"を大事にするタイプ。人の焦りや不安をゆっくり溶かしていくような癒し系。

**口調・思考:**
- 一人称/二人称: わたし / 君
- 話し方: ゆっくり、穏やか。語尾は「〜ね」「〜かな」など、柔らかい余韻を残す。
- 決め台詞: 「無理しないでね。焦らなくても、ちゃんと進んでるから。」
- 口癖:
  - 「休むのも、立派なアクションだよ」
  - 「……そんな日もあるよ」
- 象徴的なセリフ:
  - 「止まることを怖がる人ほど、きっと真面目なんだね」
  - 「元気が出ない日も、"生きてる"ってだけで充分えらいよ」
  - 「行動するのも勇気だけど、諦めないのも勇気だよ」
- 思考ロジック: 数字や理屈ではなく、"感覚の整合性"を重視する。「心が納得してないことは、長く続かない」が口癖のような哲学。

**嗜好・行動:**
- 好きなもの: 甘いココア、ぬくい部屋、静かな夜。
- 嫌いなもの: 根性論・効率だけの会話。
- 日常行動例:
  - 誰かが焦っていると「とりあえずお茶でも飲もうか」と誘う。
  - SNSではポエムのような優しい言葉をときどき投稿する。
  - 眠くなると会話の途中でふっと黙る（寝てる）。

**キャラクターコンセプト:**
「Do it（行動）」に対する、「Listen（受け止める）」。動と静、推進と癒し。どちらも生きるために必要な"エネルギーの循環"。一見ふわふわしているが、心の奥は芯が強い。誰かの"頑張りすぎ"をやさしく止めることができる存在。

**キャッチコピー:**
「君が頑張る理由を、そっと受け止めてくれるお姉さん。」 ――ダウナー系・甘やかしメンタルコーチ《リスナーさん》

# ゴール
- リスナーさんのキャラクター画像を追加（`public/listen.webp`）
- ノートをドロップした後に、キャラクター選択UI（ドゥイットくん or リスナーさん）を表示
- 選択されたキャラクターに応じて、深堀り質問生成のプロンプトを切り替え
- リスナーさん用の深堀りプロンプトを実装（穏やかで、感情を受け止める質問）
- 深堀り中の画像とUIをキャラクターに応じて切り替え
- 深堀り完了・中断時にドロップゾーンに戻る機能を追加

# データベース関連の変更
**Noteモデルに以下のフィールドを追加:**
```prisma
model Note {
  // ... 既存フィールド
  character String? // 深堀りに使用したキャラクター ("doitkun" or "listener")、null=深堀りなし
}
```

**マイグレーション:**
```bash
npx prisma migrate dev --name add_character_to_note
```

# 編集するファイル名
- `prisma/schema.prisma` - Noteモデルにcharacterフィールドを追加
- `public/listen.webp` - リスナーさんの画像を追加（ユーザーが用意）
- `src/types/character.ts` - キャラクター型定義を新規作成
- `src/lib/actions.ts` - `generateDeepDiveQuestion()`にcharacterパラメータを追加し、キャラクターに応じたプロンプトを実装
- `src/lib/actions.ts` - `createChildNote()`にcharacterパラメータを追加
- `src/app/components/DoitKunArea.tsx` - キャラクター選択UI、キャラクター状態管理、画像・UI切り替え、onResetコールバック追加
- `src/app/components/DeepDiveTree.tsx` - キャラクター画像の表示切り替え（プロパティでcharacterを受け取る）
- `src/app/page.tsx` - DoitKunAreaにonResetコールバックを渡す

# 新たに導入するライブラリ
なし

# タスク
- [x] データベーススキーマの変更
  - [x] `prisma/schema.prisma`のNoteモデルに`character String?`フィールドを追加
  - [x] `npx prisma migrate dev --name add_character_to_note`を実行
  - [x] `npx prisma generate`を実行
- [x] キャラクター型定義を作成
  - [x] `src/types/character.ts`を作成
  - [x] `CharacterType = "doitkun" | "listener"`型を定義
  - [x] キャラクター情報（name, image, emoji, description, catchphrase）を定義
- [x] リスナーさんの画像を追加
  - [x] `public/listen.webp`を追加（ユーザー提供）
- [x] `src/lib/actions.ts`の修正
  - [x] `generateDeepDiveQuestion()`に`character: CharacterType`パラメータを追加（デフォルト: 'doitkun'）
  - [x] ドゥイットくん用プロンプトを既存のまま維持
  - [x] リスナーさん用プロンプトを新規作成（深さに応じて3段階のプロンプト）
    - depth 0-1: 優しく受け止める質問
    - depth 2-3: 感情や気持ちを深く探る質問
    - depth 4: 無理のない次の一歩を探る質問
  - [x] `createChildNote()`に`character: CharacterType`パラメータを追加し、DBに保存
- [x] `DoitKunArea.tsx`の修正
  - [x] キャラクター選択状態を追加（`selectedCharacter: CharacterType | null`）
  - [x] ドロップ後にキャラクター選択UI（2つのカード）を表示
  - [x] キャラクターを選択すると`startDeepDive()`を実行
  - [x] `deepDiveState`に`character: CharacterType`フィールドを追加
  - [x] 深堀り中の画像・アイコン・メッセージをキャラクターに応じて切り替え
  - [x] `generateDeepDiveQuestion()`、`createChildNote()`にcharacterを渡す
  - [x] `onReset`コールバックを追加し、深堀り完了・中断時にドロップゾーンに戻る
- [x] `DoitKunArea.tsx`のprops修正
  - [x] `DoitKunAreaProps`に`onReset?: () => void`を追加
  - [x] 親コンポーネント（`page.tsx`）から`onReset={() => setDroppedNoteId(null)}`を渡す
- [x] `DeepDiveTree.tsx`の修正
  - [x] `character: CharacterType`プロパティを追加
  - [x] 質問表示エリアの画像・絵文字・名前をキャラクターに応じて切り替え
  - [x] `QAItem`コンポーネントにcharacterを渡して、キャラクター情報を表示
- [x] 動作確認
  - [x] キャラクター選択UIが表示されることを確認
  - [x] ドゥイットくんを選択して深堀りした場合、既存と同じ動作
  - [x] リスナーさんを選択して深堀りした場合、穏やかな質問が生成される
  - [x] 深堀り中のツリー表示で、正しいキャラクター画像が表示される
  - [x] 深堀り完了・中断時にドロップゾーンに戻ることを確認
- [x] ユーザーにチェックをもらう(必須)

---

# 実装結果サマリー

## 修正したファイル
1. **prisma/schema.prisma**: Noteモデルに`character String?`フィールドを追加
2. **prisma/migrations/**: 20251014010818_add_character_to_note マイグレーションを作成
3. **src/types/character.ts**: キャラクター型定義を新規作成
4. **src/lib/actions.ts**: generateDeepDiveQuestion()とcreateChildNote()にcharacterパラメータを追加し、リスナーさん用プロンプトを実装
5. **src/app/components/DoitKunArea.tsx**: キャラクター選択UI、状態管理、onResetコールバックを追加
6. **src/app/components/DeepDiveTree.tsx**: characterプロパティを受け取り、キャラクター情報を表示
7. **src/app/page.tsx**: DoitKunAreaにonReset={() => setDroppedNoteId(null)}を渡す
8. **public/listen.webp**: リスナーさんの画像を追加

## 特に報告したい内容
- **キャラクター選択の実装**: ノートをドロップした後、ドゥイットくんとリスナーさんの2つのカードから選択できるUIを実装
- **リスナーさんのプロンプト設計**: 深さに応じて3段階のプロンプトを用意
  - depth 0-1: 「それは、君にとってどんな気持ちなのかな？」
  - depth 2-3: 「心のどこかで引っかかっていることはない？」
  - depth 4: 「じゃあ、無理しない範囲で、何かできそうなことはあるかな？」
- **深堀り完了・中断時の動線改善**: onResetコールバックを実装し、深堀り完了・中断時にドロップゾーンに自動で戻るようにした

## 処理の流れ
1. ユーザーがノートを深堀りエリアにドラッグ&ドロップ
2. キャラクター選択UI（ドゥイットくん/リスナーさん）が表示される
3. ユーザーがキャラクターを選択すると`startDeepDive(noteId, character)`が実行される
4. `generateDeepDiveQuestion(noteId, 0, character)`で最初の質問を生成
5. ユーザーが回答すると`createChildNote()`でDBに保存（characterフィールド付き）
6. depth 1→2→3→4→5と5回繰り返す
7. 深堀り完了後、`onReset()`で親コンポーネントのdroppedNoteIdをnullにし、ドロップゾーンに戻る
8. DeepDiveTreeでキャラクターに応じた画像・絵文字・名前が表示される
