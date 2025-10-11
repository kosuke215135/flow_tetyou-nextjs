'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import NoteEditor from '@/app/components/Editor';
import NotesList from '@/app/components/NotesList';
import { getNotes, createNote } from '@/lib/actions';
import { NoteFormData, OptimisticNote } from '@/types/note';

export default function NotesPage() {
  const { data: session, status } = useSession();
  const [notes, setNotes] = useState<OptimisticNote[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (status !== 'authenticated') return;
    try {
      const response = await getNotes();
      if (response.success && response.data) {
        setNotes(response.data);
        setError(null);
      } else {
        setError(response.error || 'Failed to fetch notes');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotes();
    } else if (status === 'unauthenticated') {
      setNotes([]);
      setError(null);
    }
  }, [status, fetchNotes]);

  const handleNoteSubmit = async (data: NoteFormData) => {
    if (!session?.user) return;

    const optimisticNote: OptimisticNote = {
      id: `optimistic-${Date.now()}`,
      text: JSON.stringify(data.content),
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      yurufuwaScore: null,
      user: {
        name: session.user.name || 'Unknown User',
      },
      isOptimistic: true,
    };

    setNotes(prevNotes => [optimisticNote, ...prevNotes]);

    try {
      const response = await createNote(data);
      if (!response.success) {
        setError(response.error || 'Failed to create note');
        setNotes(prevNotes => prevNotes.filter(note => note.id !== optimisticNote.id));
      } else {
        await fetchNotes();
      }
    } catch (err) {
      setError('An unexpected error occurred while creating the note');
      setNotes(prevNotes => prevNotes.filter(note => note.id !== optimisticNote.id));
    }
  };

  const renderContent = () => {
    if (status === 'loading') {
      return <div className="text-gray-500">読み込み中...</div>;
    }
    if (status === 'unauthenticated') {
      return (
        <div className="text-center">
          <div className="text-gray-500 mb-2">ノートを表示するにはサインインが必要です</div>
          <div className="text-sm text-gray-400">右上のサインインボタンからログインしてください</div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={fetchNotes}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      );
    }
    return <NotesList notes={notes} className="w-full" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              新しいノートを作成
            </h1>
            <NoteEditor onNoteSubmit={handleNoteSubmit} />
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
