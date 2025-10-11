'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NoteFormData } from '@/types/note'
import { revalidatePath } from 'next/cache'
import { calculateYurufuwaScore } from '@/lib/yurufuwa'

export async function createNote(data: NoteFormData) {
  try {
    // セッション情報を取得
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' }
    }

    const jsonContent = JSON.stringify(data.content);
    const yurufuwaScore = await calculateYurufuwaScore(jsonContent); // スコアを計算

    const note = await prisma.note.create({
      data: {
        userId: session.user.id,
        text: jsonContent,
        yurufuwaScore: yurufuwaScore, // スコアを保存
      },
    })

    revalidatePath('/')
    return { success: true, data: note }
  } catch (error) {
    console.error('Failed to create note:', error)
    return { success: false, error: 'Failed to create note' }
  }
}

export async function getNotes() {
  try {
    // セッション情報を取得
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' }
    }

    const notes = await prisma.note.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        user: {
          select: {
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return { success: true, data: notes }
  } catch (error) {
    console.error('Failed to fetch notes:', error)
    return { success: false, error: 'Failed to fetch notes' }
  }
}