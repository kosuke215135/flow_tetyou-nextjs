'use client';

import { useState, useRef, useEffect } from 'react';
import NotesPage from "@/app/components/NotesPage";
import DoitKunArea from '@/app/components/DoitKunArea';
import { DndContext, DragEndEvent } from '@dnd-kit/core';

export default function Home() {
  const [droppedNoteId, setDroppedNoteId] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && over.id === 'doitkun-drop-zone') {
      console.log('Dropped note:', active.id);
      setDroppedNoteId(String(active.id));
    }
  };

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= 800) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <main className="flex min-h-screen">
        <div className="flex-1">
          <NotesPage />
        </div>
        <aside
          ref={sidebarRef}
          style={{ width: `${sidebarWidth}px` }}
          className="relative p-8 bg-gray-50 border-l border-gray-200"
        >
          <div
            onMouseDown={handleMouseDown}
            className={`absolute left-0 top-0 bottom-0 w-1 hover:w-2 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-all ${
              isResizing ? 'w-2 bg-blue-500' : ''
            }`}
          />
          <DoitKunArea droppedNoteId={droppedNoteId} />
        </aside>
      </main>
    </DndContext>
  );
}