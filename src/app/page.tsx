'use client';

import NotesPage from "@/app/components/NotesPage";
import DoitKunArea from '@/app/components/DoitKunArea';
import { DndContext, DragEndEvent } from '@dnd-kit/core';

export default function Home() {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && over.id === 'doitkun-drop-zone') {
      console.log('Dropped note:', active.id);
      // TODO: 深堀りモード起動（次のフェーズで実装）
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <main className="flex min-h-screen">
        <div className="flex-1">
          <NotesPage />
        </div>
        <aside className="w-96 p-8 bg-gray-50 border-l border-gray-200">
          <DoitKunArea />
        </aside>
      </main>
    </DndContext>
  );
}