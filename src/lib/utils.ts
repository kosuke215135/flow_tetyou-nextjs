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
