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
    const prompt = `以下の文章は、具体的な行動計画に近いですか？抽象的なアイデアに近いですか？抽象度を0.0から1.0の数値で評価してください。レスポンスは数値のみでお願いします。\n\n文章: ${text}`;
    
    const response = await genAI.models.generateContent({ model: "gemini-2.5-flash", contents: [prompt] });
    const responseText = response.text;
    
    if (responseText) {
      // レスポンスから数値部分を抽出
      const numberMatch = responseText.match(/[\d.]+/);
      if (numberMatch) {
        const score = parseFloat(numberMatch[0]);
        if (!isNaN(score)) {
          const finalScore = Math.max(0, Math.min(1, score));
          return parseFloat(finalScore.toFixed(2));
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
