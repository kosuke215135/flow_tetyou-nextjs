'use client';

import NoteCard, { NoteCardSkeleton } from './NoteCard';
import { OptimisticNote } from '@/types/note';

interface NotesListProps {
  notes: OptimisticNote[];
  className?: string;
}

export default function NotesList({ notes, className = '' }: NotesListProps) {
  // 楽観的更新でないノートの数をカウント
  const noteCount = notes.filter(note => !note.isOptimistic).length;

  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        保存されたノート ({noteCount})
      </h2>
      {notes.map((note, index) =>
        note.isOptimistic ? (
          <NoteCardSkeleton key={note.id} />
        ) : (
          <NoteCard key={note.id} note={note} index={index} />
        )
      )}
    </div>
  );
}