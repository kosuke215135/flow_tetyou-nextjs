import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { GoogleGenAI } from "@google/genai";
import { type JSONContent } from '@tiptap/react';
import { extractTextFromContent } from "@/lib/utils";

// Geminiクライアントの初期化
const genAI = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY!});

// calculateYurufuwaScore関数をここに移動
async function calculateYurufuwaScore(jsonContent: string): Promise<number> {
  if (!jsonContent) {
    return 1;
  }
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set.");
    return 1;
  }

  let content: JSONContent;
  try {
    content = JSON.parse(jsonContent);
  } catch (error) {
    content = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: jsonContent }] }] };
  }

  const text = extractTextFromContent(content).trim();

  if (text.length < 10) {
    return 1;
  }

  try {
    const prompt = `以下の文章は、具体的な行動計画に近いですか？抽象的なアイデアに近いですか？抽象度を1から5の整数で評価してください（1: 具体的、5: 抽象的）。レスポンスは整数のみでお願いします。\n\n文章: ${text}`;

    const response = await genAI.models.generateContent({ model: "gemini-2.5-flash", contents: [prompt] });
    const responseText = response.text;

    if (responseText) {
      const numberMatch = responseText.match(/\d+/);
      if (numberMatch) {
        const score = parseInt(numberMatch[0], 10);
        if (!isNaN(score)) {
          const finalScore = Math.max(1, Math.min(5, score));
          return finalScore;
        }
      }
    }

    console.error("Failed to parse score from Gemini response:", responseText);
    return 1;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return 1;
  }
}


async function updateScore(noteId: string) {
  try {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note || !note.userId) {
      console.error(`Note with id ${noteId} or its user not found.`);
      return;
    }

    const score = await calculateYurufuwaScore(note.text);

    await prisma.$transaction([
      prisma.note.update({
        where: { id: noteId },
        data: { yurufuwaScore: score },
      }),
      prisma.user.update({
        where: { id: note.userId },
        data: {
          yurufuwaMeter: {
            increment: score * 0.1,
          },
        },
      }),
    ]);

    revalidatePath('/');
    console.log(`Successfully updated score and meter for note ${noteId}`);

  } catch (error) {
    console.error(`Failed to update score for note ${noteId}:`, error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { noteId } = body;

    if (!noteId) {
      return NextResponse.json({ error: 'noteId is required' }, { status: 400 });
    }

    updateScore(noteId);

    return NextResponse.json(
      { message: 'Score update process started.' },
      { status: 202 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
