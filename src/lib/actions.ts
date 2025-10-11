'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NoteFormData } from '@/types/note'
import { revalidatePath } from 'next/cache'

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