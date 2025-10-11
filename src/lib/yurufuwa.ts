import { GoogleGenAI } from "@google/genai";
import { type JSONContent } from '@tiptap/react';

// APIキーを環境変数から取得
const genAI = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY!});

/**
 * TipTapのJSONコンテンツからプレーンテキストを再帰的に抽出する
 * @param content TipTapのJSONオブジェクト
 * @returns プレーンテキスト
 */
function extractTextFromContent(content: JSONContent): string {
  let text = '';

  if (content.text) {
    text += content.text;
  }

  if (content.content) {
    content.content.forEach(childContent => {
      text += ' ' + extractTextFromContent(childContent);
    });
  }

  return text;
}

/**
 * メモの内容から、Geminiを使って「ゆるふわ度」を計算する
 * @param jsonContent メモの内容 (JSON文字列)
 * @returns ゆるふわ度スコア (0.0 〜 1.0)
 */
export async function calculateYurufuwaScore(jsonContent: string): Promise<number> {
  if (!jsonContent) {
    return 0;
  }
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set.");
    return 0; // APIキーがなければ0を返す
  }

  let content: JSONContent;
  try {
    content = JSON.parse(jsonContent);
  } catch (error) {
    // パースに失敗した場合は、ただの文字列として扱う
    content = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: jsonContent }] }] };
  }

  const text = extractTextFromContent(content).trim();

  if (text.length < 10) { // 短すぎるテキストはAPIに送らない
    return 0.1;
  }

  try {
    const prompt = `
以下の文章の「ゆるふわ度」を0.0から1.0の数値で評価してください。
ゆるふわ度とは、アイデアが具体的でなく、抽象的で、まだ行動計画に落とし込める段階にない度合いを指します。
例えば、「なんかすごいサービスを作りたい」はゆるふわ度が高く、「顧客管理機能を持つWebアプリをNext.jsとPrismaで開発する」はゆるふわ度が低いです。
評価理由と最終的なスコアをJSON形式で {"reason": "評価理由", "score": 0.8} のように返してください。レスポンスはJSONのみとし、他のテキストは含めないでください。

文章:
---
${text}
---
`;
    const response = await genAI.models.generateContent({ model: "gemini-2.5-flash", contents: [prompt] });
    const responseText = response.text;
    
    // レスポンスからJSON部分を抽出
    if (responseText) {
      const jsonMatch = responseText.match(/{[\s\S]*}/);
      if (jsonMatch) {
        const jsonResponse = JSON.parse(jsonMatch[0]);
        if (typeof jsonResponse.score === 'number') {
          const score = Math.max(0, Math.min(1, jsonResponse.score));
          return parseFloat(score.toFixed(2));
        }
      }
    }
    
    console.error("Failed to parse score from Gemini response:", responseText);
    return 0; // パース失敗

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return 0; // APIエラー
  }
}
