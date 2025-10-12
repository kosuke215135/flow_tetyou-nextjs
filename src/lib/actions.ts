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

// 深堀り用: Geminiで「なぜ？」の質問を生成
export async function generateDeepDiveQuestion(noteId: string, currentDepth: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // ノートを取得
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        parent: true, // 親ノートも取得（文脈のため）
      },
    });

    if (!note || note.userId !== session.user.id) {
      return { success: false, error: 'Note not found' };
    }

    const noteText = extractTextFromContent(JSON.parse(note.text));
    const parentText = note.parent ? extractTextFromContent(JSON.parse(note.parent.text)) : '';

    // 深堀りの深さに応じてプロンプトを調整
    const depthContext = currentDepth === 0
      ? '最初の「なぜ？」'
      : currentDepth === 4
        ? '最後の質問。「で、どうしたいんだ？」と聞け。'
        : `${currentDepth + 1}回目の「なぜ？」`;

    const prompt = `君はドゥイットくん。脳筋行動派のパーソナルトレーナー（ニート）だ。

【基本情報】
一人称: オレ / 二人称: 君
性格: フフッとなる脳筋行動派。論理が破綻しているが、なぜか説得力がある。

【状況】
${depthContext}

${parentText ? `前の質問への回答: 「${parentText}」` : ''}
ユーザーの今の回答: 「${noteText}」

【依頼】
この回答に対して、核心を突く「なぜ？」の質問を1つ考えろ。
短く、シンプルに。ドゥイットくんらしい脳筋質問が良い。
質問文だけを返せ。余計な説明は不要だ。`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [prompt],
    });

    const question = response.text.trim();

    return { success: true, data: question };
  } catch (error) {
    console.error('Error in generateDeepDiveQuestion:', error);
    return { success: false, error: 'Failed to generate question' };
  }
}

// 深堀り用: 子ノートを作成
export async function createChildNote(data: {
  parentNoteId: string;
  content: JSONContent;
  question: string;
  depth: number;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // 親ノートが存在するか確認
    const parentNote = await prisma.note.findUnique({
      where: { id: data.parentNoteId },
    });

    if (!parentNote || parentNote.userId !== session.user.id) {
      return { success: false, error: 'Parent note not found' };
    }

    const jsonContent = JSON.stringify(data.content);

    const childNote = await prisma.note.create({
      data: {
        userId: session.user.id,
        text: jsonContent,
        parentNoteId: data.parentNoteId,
        depth: data.depth,
        question: data.question,
      },
    });

    revalidatePath('/');
    return { success: true, data: childNote };
  } catch (error) {
    console.error('Error in createChildNote:', error);
    return { success: false, error: 'Failed to create child note' };
  }
}

export async function signOutAndRevalidate() {
  await signOut({ redirectTo: "/auth/signin" });
  revalidatePath('/');
}