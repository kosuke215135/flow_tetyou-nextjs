import { JSONContent } from '@tiptap/react'

// フォームから送信されるデータの型定義
interface NoteFormData {
  content: JSONContent
}

// DBに保存されるデータの型定義
interface NoteModel {
  id: string
  userId: string
  text: string
  yurufuwaScore: number | null
  createdAt: Date
  updatedAt: Date
}

// APIレスポンスの型定義
interface NoteResponse extends NoteModel {
  user: {
    name: string | null
  }
}

export type { NoteFormData, NoteModel, NoteResponse }
