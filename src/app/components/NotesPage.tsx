'use client';

import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import NoteEditor from '@/app/components/Editor';
import NotesList from '@/app/components/NotesList';
import { getNotes, createNote } from '@/lib/actions';
import { NoteFormData, OptimisticNote } from '@/types/note';

// SWRのfetcher関数
const fetcher = () => getNotes().then(res => {
  if (!res.success) {
    throw new Error(res.error || 'Failed to fetch notes');
  }
  return res.data || [];
});

export default function NotesPage() {
  const { data: session, status } = useSession();

  const { data: notes, error, isLoading, mutate } = useSWR(
    status === 'authenticated' ? 'notes' : null,
    fetcher,
    {
      refreshInterval: 5000, // 5秒ごとに再検証
    }
  );

  const handleNoteSubmit = async (data: NoteFormData) => {
    if (!session?.user || !notes) return;

    const optimisticNote: OptimisticNote = {
      id: `optimistic-${Date.now()}`,
      text: JSON.stringify(data.content),
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      parentNoteId: null,
      depth: 0,
      question: null,
      character: null,
      user: {
        name: session.user.name ?? 'Unknown',
      },
      children: [],
      isOptimistic: true,
    };

    await mutate([optimisticNote, ...notes], false);

    try {
      const response = await createNote(data);

      if (!response.success || !response.note) {
        console.error('Failed to create note:', response.error);
        await mutate(notes, false);
        return;
      }

      try {
        const scoreResponse = await fetch('/api/update-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ noteId: response.note.id }),
        });

        if (!scoreResponse.ok) {
          console.error('Failed to update score:', await scoreResponse.text());
        }
      } catch (scoreError) {
        console.error('Error updating score:', scoreError);
      } finally {
        await mutate();
      }
    } catch (err) {
      console.error('Error in handleNoteSubmit:', err);
      await mutate(notes, false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
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
          <div className="text-red-500 mb-4">{error.message}</div>
          <button
            onClick={() => mutate()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      );
    }
    if (!notes) {
      return (
        <div className={`text-center py-8`}>
          <div className="text-gray-500">まだノートがありません</div>
        </div>
      )
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
