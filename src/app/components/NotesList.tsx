'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { getNotes } from '@/lib/actions'
import NoteCard from './NoteCard'
import { NoteModel } from '@/types/note'


interface NotesListProps {
  refresh: number
  className?: string
}

interface NoteWithUser extends NoteModel {
  user: {
    name: string | null
  }
}

export default function NotesList({ refresh, className = '' }: NotesListProps) {
  const { data: session, status } = useSession()
  const [notes, setNotes] = useState<NoteWithUser[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchNotes = async () => {
    try {
      const response = await getNotes()
      
      if (response.success && response.data) {
        setNotes(response.data)
        setError(null)
      } else {
        setError(response.error || 'Failed to fetch notes')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchNotes()
    } else if (status === 'unauthenticated') {
      setNotes([])
      setError(null)
    }
    console.log(session, status)
  }, [refresh, status, session?.user?.id])

  if (status === 'loading') {
    return (
      <div className={`flex justify-center items-center py-8 ${className}`}>
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-500 mb-2">ノートを表示するにはサインインが必要です</div>
        <div className="text-sm text-gray-400">右上のサインインボタンからログインしてください</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={fetchNotes}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          再試行
        </button>
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-500">まだノートがありません</div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        保存されたノート ({notes.length})
      </h2>
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  )
}