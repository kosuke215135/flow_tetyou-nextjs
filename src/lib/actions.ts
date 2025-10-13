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
export async function generateDeepDiveQuestion(noteId: string, currentDepth: number) {
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
      .filter(child => child.id !== originalNote.id && child.depth <= currentDepth)
      .map((child, index) => {
        const answerText = extractTextFromContent(JSON.parse(child.text));
        return `Q${index + 1}: ${child.question}\nA${index + 1}: ${answerText}`;
      })
      .join('\n\n');

    // depthに応じてプロンプトを変更
    let prompt = '';

    if (currentDepth <= 1) {
      // 最初の1-2回: 表面的な「なぜ？」を掘り下げる
      prompt = `君はドゥイットくん。脳筋行動派のパーソナルトレーナー（ニート）だ。

【状況】
ユーザーが以下のモヤモヤを抱えている。
「${originalText}」

${qaHistory ? `【これまでの会話】\n${qaHistory}\n\n` : ''}

【依頼】
このモヤモヤの「なぜ？」を1つ聞け。
表面的な理由を探るんだ。シンプルに、ストレートに。
ドゥイットくんらしい脳筋質問が良い。

一人称は「オレ」、二人称は「君」を使え。
質問文だけを返せ。余計な説明は不要だ。`;
    } else if (currentDepth <= 3) {
      // 3-4回目: 感情や動機を探る
      prompt = `君はドゥイットくん。脳筋行動派のパーソナルトレーナー（ニート）だ。

【元のモヤモヤ】
「${originalText}」

【これまでの会話】
${qaHistory}

【依頼】
もっと深く掘り下げろ。感情や本当の動機を探るんだ。
前の回答を踏まえて、核心に迫る質問をしろ。

例:
- それで君はどう感じてるんだ？
- 本当はどうしたいんだ？
- 何が君を止めてるんだ？

一人称は「オレ」、二人称は「君」を使え。
質問文だけを返せ。`;
    } else {
      // 5回目: 具体的な行動を引き出す
      prompt = `君はドゥイットくん。脳筋行動派のパーソナルトレーナー（ニート）だ。

【元のモヤモヤ】
「${originalText}」

【これまでの深堀り】
${qaHistory}

【依頼】
最後の質問だ。具体的な行動を引き出せ。
「で、どうしたいんだ？」という視点で聞け。

例:
- で、結局どうしたいんだ？
- 明日から何ができる？
- 最初の一歩は何だ？

一人称は「オレ」、二人称は「君」を使え。
質問文だけを返せ。`;
    }

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