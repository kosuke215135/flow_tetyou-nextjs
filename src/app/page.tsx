'use client';

import { useState } from 'react';
import NotesPage from "@/app/components/NotesPage";
import DoitKunArea from '@/app/components/DoitKunArea';
import { DndContext, DragEndEvent } from '@dnd-kit/core';

export default function Home() {
  const [droppedNoteId, setDroppedNoteId] = useState<string | null>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && over.id === 'doitkun-drop-zone') {
      console.log('Dropped note:', active.id);
      setDroppedNoteId(String(active.id));
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <main className="flex min-h-screen">
        <div className="flex-1">
          <NotesPage />
        </div>
        <aside className="w-96 p-8 bg-gray-50 border-l border-gray-200">
          <DoitKunArea droppedNoteId={droppedNoteId} />
        </aside>
      </main>
    </DndContext>
  );
}