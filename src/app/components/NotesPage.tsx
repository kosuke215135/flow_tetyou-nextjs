'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import NoteEditor from '@/app/components/Editor';
import NotesList from '@/app/components/NotesList';

export default function NotesPage() {
  const { status } = useSession();
  const [refresh, setRefreshKey] = useState<number>(0);

  // 認証状態の変更を監視し、サインアウト時にノートデータをクリア
  useEffect(() => {
    if (status === 'unauthenticated') {
      localStorage.removeItem('notes');
      setRefreshKey(prev => prev + 1); // リストを強制リフレッシュ
    }
  }, [status]);

  // ノートリフレッシュ用のコールバック関数
  const handleNoteRefresh = (): void => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* エディタセクション */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              新しいノートを作成
            </h1>
            <NoteEditor onNoteRefresh={handleNoteRefresh} />
          </div>

          {/* ノート一覧セクション */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <NotesList 
              refresh={refresh}
              className="w-full" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
