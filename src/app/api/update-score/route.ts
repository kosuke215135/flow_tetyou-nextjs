import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateYurufuwaScore } from '@/lib/yurufuwa';
import { revalidatePath } from 'next/cache';

async function updateScore(noteId: string) {
  try {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      console.error(`Note with id ${noteId} not found.`);
      return;
    }

    const score = await calculateYurufuwaScore(note.text);

    await prisma.note.update({
      where: { id: noteId },
      data: { yurufuwaScore: score },
    });

    revalidatePath('/');
    console.log(`Successfully updated score for note ${noteId}`);

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

    // 非同期処理を開始し、完了を待たずにレスポンスを返す
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
