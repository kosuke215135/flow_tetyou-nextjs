'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NoteFormData } from '@/types/note'
import { revalidatePath } from 'next/cache'
import { GoogleGenAI } from "@google/genai";
import { type JSONContent } from '@tiptap/react';
import { extractTextFromContent } from '@/lib/utils';

export async function createNote(data: NoteFormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' }
    }

    const jsonContent = JSON.stringify(data.content);

    const note = await prisma.note.create({
      data: {
        userId: session.user.id,
        text: jsonContent,
        // yurufuwaScoreはバックグラウンドで計算・更新する
      },
    })

    revalidatePath('/') // パスの再検証
    return { success: true, note: note }
  } catch (error) {
    console.error('Error in createNote:', error)
    return { success: false, error: 'Failed to create note' }
  }
}

export async function getNotes() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' }
    }

    const notes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    })

    return { success: true, data: notes }
  } catch (error) {
    console.error('Error in getNotes:', error)
    return { success: false, error: 'Failed to fetch notes' }
  }
}

// Geminiクライアントの初期化
const genAI = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY!});

export async function generateSmallStepActionPlan() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    const ungeneratedNotes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
        actionPlanGenerated: false,
      },
    });

    if (ungeneratedNotes.length === 0) {
      return { success: false, error: 'No notes to generate action plan from.' };
    }

    const combinedText = ungeneratedNotes
      .map(note => extractTextFromContent(JSON.parse(note.text)))
      .join('\n\n---\n\n');

    if (combinedText.trim().length === 0) {
        return { success: false, error: 'Note content is empty.' };
    }

    const prompt = `以下の思考の断片から、日常のモヤモヤを解消するための具体的な「小さな一歩」を3つ、JSON形式の文字列配列（例: ["プラン1", "プラン2", "プラン3"]）として提案してください。レスポンスはJSON配列のみでお願いします。\n\n---
${combinedText}
---`;

    const response = await genAI.models.generateContent({ model: "gemini-2.5-flash", contents: [prompt] });
    const responseText = response.text;

    let actionPlans: string[] = [];
    if (responseText) {
      try {
        // レスポンスから配列部分を抽出
        const arrayMatch = responseText.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          actionPlans = JSON.parse(arrayMatch[0]);
        } else {
            throw new Error('No JSON array found in response');
        }
      } catch (e) {
        console.error("Failed to parse action plans from Gemini response:", responseText, e);
        return { success: false, error: 'Failed to parse action plans.' };
      }
    }

    const noteIdsToUpdate = ungeneratedNotes.map(note => note.id);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { yurufuwaMeter: 0 },
      }),
      prisma.note.updateMany({
        where: {
          id: {
            in: noteIdsToUpdate,
          },
        },
        data: { actionPlanGenerated: true },
      }),
    ]);
    
    revalidatePath('/');

    return { success: true, data: actionPlans };

  } catch (error) {
    console.error('Error in generateSmallStepActionPlan:', error);
    return { success: false, error: 'Failed to generate action plan.' };
  }
}