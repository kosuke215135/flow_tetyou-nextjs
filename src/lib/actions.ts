'use server'

import { prisma } from '@/lib/prisma'
import { auth, signOut } from '@/lib/auth'
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
  console.log("--- generateSmallStepActionPlan: START ---");
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.error("generateSmallStepActionPlan: Authentication failed.");
      return { success: false, error: 'Authentication required' };
    }
    console.log(`generateSmallStepActionPlan: Authenticated for user ${session.user.id}`);

    const ungeneratedNotes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
        actionPlanGenerated: false,
      },
    });
    console.log(`generateSmallStepActionPlan: Found ${ungeneratedNotes.length} notes to process.`);

    if (ungeneratedNotes.length === 0) {
      return { success: false, error: 'No notes to generate action plan from.' };
    }

    const combinedText = ungeneratedNotes
      .map(note => extractTextFromContent(JSON.parse(note.text)))
      .join('\n\n---\n\n');

    if (combinedText.trim().length === 0) {
        return { success: false, error: 'Note content is empty.' };
    }
    console.log("generateSmallStepActionPlan: Combined text length:", combinedText.length);

    const prompt = `以下の思考の断片から、日常のモヤモヤを解消するための具体的な「小さな一歩」を3つ、JSON形式の文字列配列（例: ["プラン1", "プラン2", "プラン3"]）として提案してください。レスポンスはJSON配列のみでお願いします。\n\n---
${combinedText}
---`;

    console.log("generateSmallStepActionPlan: Calling Gemini API...");
    const response = await genAI.models.generateContent({ model: "gemini-2.5-flash", contents: [prompt] });
    const responseText = response.text;
    console.log("generateSmallStepActionPlan: Gemini response text:", responseText); // ★Geminiのレスポンスをログ出力

    let actionPlans: string[] = [];
    if (responseText) {
      try {
        // レスポンスから配列部分を抽出
        const arrayMatch = responseText.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          actionPlans = JSON.parse(arrayMatch[0]);
          console.log("generateSmallStepActionPlan: Parsed action plans:", actionPlans); // ★パース結果をログ出力
        } else {
            throw new Error('No JSON array found in response');
        }
      } catch (e) {
        console.error("Failed to parse action plans from Gemini response:", responseText, e);
        return { success: false, error: 'Failed to parse action plans.' };
      }
    }

    const noteIdsToUpdate = ungeneratedNotes.map(note => note.id);
    console.log("generateSmallStepActionPlan: Updating DB...");

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
    console.log("--- generateSmallStepActionPlan: SUCCESS ---");

    return { success: true, data: actionPlans };

  } catch (error) {
    console.error('--- generateSmallStepActionPlan: FAILED ---', error);
    return { success: false, error: 'Failed to generate action plan.' };
  }
}

export async function signOutAndRevalidate() {
  await signOut({ redirectTo: "/auth/signin" });
  revalidatePath('/');
}