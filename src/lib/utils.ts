import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type JSONContent } from '@tiptap/react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractTextFromContent(content: JSONContent): string {
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
 * ゆるふわメーター値（0.0-1.0）を星の数（1-5）に変換
 * @param meterValue - メーター値（0.0-1.0）
 * @returns 星の数（1-5）
 */
export function convertMeterToStars(meterValue: number): number {
  // メーター値を0.0-1.0の範囲にクランプ
  const clampedValue = Math.max(0, Math.min(1, meterValue));

  // 0.0-1.0を1-5に変換
  // 0.0-0.2 → 1, 0.2-0.4 → 2, 0.4-0.6 → 3, 0.6-0.8 → 4, 0.8-1.0 → 5
  const stars = Math.ceil(clampedValue * 5);

  // 最小値を1にする（0にならないように）
  return Math.max(1, stars);
}
