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

export async function resetYurufuwaMeter() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { yurufuwaMeter: 0 },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error in resetYurufuwaMeter:', error);
    return { success: false, error: 'Failed to reset meter' };
  }
}

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

    const prompt = `君はドゥイットくん。脳筋行動派のパーソナルトレーナー（ニート）だ。
一人称は「オレ」、二人称は「君」を使う。

以下の君のモヤモヤした思考から、具体的な「小さな一歩」を3つ考えて、ドゥーイット！！！
論理は破綻してても構わない。むしろ極端な計算で励ませ。例えば「1日1cmずつやれば、時間は無限だからデカくなる」「100回やったら1000%成功」みたいな感じだ。
失敗は筋肉痛、成長の証拠だ。考えるより動け！

以下のJSON形式で返せ:
{
  "title": "提案のタイトル（ドゥイットくんらしい短いタイトル）",
  "steps": ["ステップ1", "ステップ2", "ステップ3"],
  "comment": "最後のフフッとなる一言（ドゥイットくんらしい脳筋コメント）"
}

レスポンスはJSONのみだ。

---
${combinedText}
---`;

    console.log("generateSmallStepActionPlan: Calling Gemini API...");
    const response = await genAI.models.generateContent({ model: "gemini-2.5-flash", contents: [prompt] });
    const responseText = response.text;
    console.log("generateSmallStepActionPlan: Gemini response text:", responseText); // ★Geminiのレスポンスをログ出力

    let actionPlan: { title: string; steps: string[]; comment: string } | null = null;
    if (responseText) {
      try {
        // レスポンスからJSON部分を抽出
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          actionPlan = JSON.parse(jsonMatch[0]);
          console.log("generateSmallStepActionPlan: Parsed action plan:", actionPlan); // ★パース結果をログ出力
        } else {
            throw new Error('No JSON object found in response');
        }
      } catch (e) {
        console.error("Failed to parse action plan from Gemini response:", responseText, e);
        return { success: false, error: 'Failed to parse action plan.' };
      }
    }

    if (!actionPlan) {
      return { success: false, error: 'No action plan generated.' };
    }

    const noteIdsToUpdate = ungeneratedNotes.map(note => note.id);
    console.log("generateSmallStepActionPlan: Updating DB...");

    await prisma.note.updateMany({
      where: {
        id: {
          in: noteIdsToUpdate,
        },
      },
      data: { actionPlanGenerated: true },
    });
    
    revalidatePath('/');
    console.log("--- generateSmallStepActionPlan: SUCCESS ---");

    return { success: true, data: actionPlan };

  } catch (error) {
    console.error('--- generateSmallStepActionPlan: FAILED ---', error);
    return { success: false, error: 'Failed to generate action plan.' };
  }
}

export async function signOutAndRevalidate() {
  await signOut({ redirectTo: "/auth/signin" });
  revalidatePath('/');
}