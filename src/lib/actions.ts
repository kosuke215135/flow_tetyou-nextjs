'use server'

import { prisma } from '@/lib/prisma'
import { NoteFormData } from '@/types/note'
import { revalidatePath } from 'next/cache'

export async function createNote(data: NoteFormData) {
  try {
    // テスト用ユーザーの作成または取得
    const tempUserId = 'temp-user-id'
    
    // ユーザーが存在しない場合は作成
    await prisma.user.upsert({
      where: { id: tempUserId },
      update: {},
      create: {
        id: tempUserId,
        email: 'temp@example.com',
        name: 'テストユーザー',
      }
    })

    const note = await prisma.note.create({
      data: {
        userId: tempUserId,
        text: JSON.stringify(data.content),
      },
    })

    revalidatePath('/')
    return { success: true, data: note }
  } catch (error) {
    console.error('Failed to create note:', error)
    return { success: false, error: 'Failed to create note' }
  }
}