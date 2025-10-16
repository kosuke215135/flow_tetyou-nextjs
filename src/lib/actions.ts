'use server'

import { prisma } from '@/lib/prisma'
import { auth, signOut } from '@/lib/auth'
import { NoteFormData } from '@/types/note'
import { revalidatePath } from 'next/cache'
import { GoogleGenAI } from "@google/genai";
import { type JSONContent } from '@tiptap/react';
import { extractTextFromContent } from '@/lib/utils';
import { type CharacterType } from '@/types/character';
import { generatePrompt } from '@/lib/prompts';

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

    // 親ノート（depth=0）のみを取得し、子ノートを再帰的に含める
    const notes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
        depth: 0, // 親ノートのみ
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
        children: {
          include: {
            children: {
              include: {
                children: {
                  include: {
                    children: {
                      include: {
                        children: true, // depth=5まで
                      },
                    },
                  },
                },
              },
            },
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
export async function generateDeepDiveQuestion(noteId: string, currentDepth: number, character: CharacterType = 'doitkun') {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // 深堀り対象のノートを取得（親ノートまたは前の子ノート）
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        children: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!note || note.userId !== session.user.id) {
      return { success: false, error: 'Note not found' };
    }

    // 元の親ノートを取得（深堀りの起点）
    let originalNote = note;
    if (note.depth > 0) {
      // 子ノートの場合は親を辿って元のノートを取得
      let current = note;
      while (current.parentNoteId) {
        const parent = await prisma.note.findUnique({
          where: { id: current.parentNoteId },
          include: {
            children: {
              orderBy: { createdAt: 'asc' },
            },
          },
        });
        if (!parent) break;
        current = parent;
        if (current.depth === 0) {
          originalNote = current;
          break;
        }
      }
    }

    const originalText = extractTextFromContent(JSON.parse(originalNote.text));

    // これまでの質問と回答を取得（親ノートの全子孫）
    const allChildren = await prisma.note.findMany({
      where: {
        OR: [
          { parentNoteId: originalNote.id },
          { id: originalNote.id },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    const qaHistory = allChildren
      .filter((child: { id: string; depth: number }) => child.id !== originalNote.id && child.depth <= currentDepth)
      .map((child: { text: string; question: string | null }, index: number) => {
        const answerText = extractTextFromContent(JSON.parse(child.text));
        return `Q${index + 1}: ${child.question}\nA${index + 1}: ${answerText}`;
      })
      .join('\n\n');

    // 直前の質問と回答を取得（depth > 0の場合のみ）
    let previousQuestion: string | undefined;
    let previousAnswer: string | undefined;

    if (currentDepth > 0) {
      const previousChildren = allChildren.filter(
        (child: { id: string; depth: number }) =>
          child.id !== originalNote.id && child.depth === currentDepth
      );

      if (previousChildren.length > 0) {
        const lastChild = previousChildren[previousChildren.length - 1];
        previousQuestion = lastChild.question || undefined;
        previousAnswer = extractTextFromContent(JSON.parse(lastChild.text));
      }
    }

    // プロンプトを生成
    const prompt = generatePrompt(character, {
      originalText,
      qaHistory,
      currentDepth,
      previousQuestion,
      previousAnswer,
    });

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [prompt],
    });

    const question = response.text?.trim() || '';

    if (!question) {
      return { success: false, error: 'Failed to generate question from AI' };
    }

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
  character: CharacterType;
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
        character: data.character,
      },
    });

    revalidatePath('/');
    return { success: true, data: childNote };
  } catch (error) {
    console.error('Error in createChildNote:', error);
    return { success: false, error: 'Failed to create child note' };
  }
}

// ノート削除
export async function deleteNote(noteId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // ノートの所有者確認
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note || note.userId !== session.user.id) {
      return { success: false, error: 'Note not found or unauthorized' };
    }

    // 削除（子ノートもonDelete: Cascadeで自動削除）
    await prisma.note.delete({
      where: { id: noteId },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteNote:', error);
    return { success: false, error: 'Failed to delete note' };
  }
}

export async function signOutAndRevalidate() {
  await signOut({ redirectTo: "/auth/signin" });
  revalidatePath('/');
}