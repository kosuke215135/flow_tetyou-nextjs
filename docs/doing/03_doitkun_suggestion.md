# 目的
日常の思考の断片（モヤモヤ）を書き溜めることで、AIアシスタント「ドゥイットくん」が自動的に現れ、思考を整理し、次への「小さな一歩」となるアクションを提案することで、ユーザーに新たな気づきを与える。

# ゴール
- ヘッダー中央に、ユーザーの「ゆるふわメーター」が大きく表示される。
- ノートが作成されるたび、そのノートの`yurufuwaScore`がユーザーの「ゆるふわメーター」に加算される。
- メーターが閾値（例: 1.0）に達すると、ノート一覧の右側にドゥイットくんが魔法陣と共に自動的に出現する。
- ドゥイットくんは、「まだアクションプランの対象になっていないノート群」を元に、日常のモヤモヤを解消するための「小さなアクションプラン」を3つ提案する。
- アクションプランが表示されると、メーターは0にリセットされる。
- アクションプランの生成対象となったノートには、「処理済み」のフラグが立てられる。

# 編集するファイル名
- `prisma/schema.prisma`
- `src/lib/actions.ts`
- `src/app/components/Header.tsx`
- `src/app/components/YurufuwaMeter.tsx` (新規作成)
- `src/app/page.tsx`
- `src/app/components/DoitKunArea.tsx` (新規作成)
- `src/app/api/user/route.ts` (新規作成)

# タスク
- [x] `prisma/schema.prisma` の `User` モデルに `yurufuwaMeter` (Float, default 0) を、`Note` モデルに `actionPlanGenerated` (Boolean, default false) を追加する。
- [x] `pnpm prisma migrate dev` を実行してデータベーススキーマを更新する。
- [x] `src/lib/actions.ts` の `createNote` アクションを修正し、ノート保存後にユーザーの `yurufuwaMeter` を加算更新する処理を追加する。
- [x] `src/app/components/YurufuwaMeter.tsx` を新規作成する。これはメーターのUIコンポーネント。
- [x] `src/app/components/Header.tsx` を修正し、`YurufuwaMeter` を表示するようにする。
- [x] `src/app/page.tsx` のレイアウトを修正し、ノート一覧とドゥイットくん表示エリアが左右に並ぶようにする。
- [x] `src/app/components/DoitKunArea.tsx` を新規作成する。
    - [x] ユーザーの `yurufuwaMeter` の値をpropsで受け取る。
    - [x] メーターが閾値を超えたら、魔法陣アニメーション（まずはシンプルなものでOK）を表示し、その後ドゥイットくんとアクションプランを表示する。
- [x] `src/lib/actions.ts` に `generateSmallStepActionPlan` サーバーアクションを新規作成する。
    - [x] `actionPlanGenerated: false` のノートを全て取得する。
    - [x] 取得したノート群の内容を元に、LLM APIを呼び出して「小さな一歩」となるアクションプランを生成する。
    - [x] ユーザーの `yurufuwaMeter` を0にリセットする。
    - [x] 対象となったノートの `actionPlanGenerated` フラグを `true` に更新する。
- [x] `DoitKunArea.tsx` から `generateSmallStepActionPlan` を呼び出し、取得したアクションプランを表示する。
- [ ] ユーザーにチェックをもらう(必須)

# 修正タスク
- [x] ヘッダーのゆるふわメーターの配色を変更し、視認性を向上させる。
- [x] **設計変更:** ユーザー情報（ゆるふわメーター）をSWRでグローバルに状態管理し、UIが自動更新されるようにする。
    - [x] ユーザー情報を返す`/api/user`エンドポイントを新規作成する。
    - [x] `Header`コンポーネントをクライアントコンポーネント化し、SWRでメーターの値を取得・表示するように修正する。
    - [x] `DoitKunArea`コンポーネントが、SWRで取得した最新のメーターの値を参照するように修正する。
- [ ] アクションプランの表示形式を、カードを重ねて表示するUIに変更する。