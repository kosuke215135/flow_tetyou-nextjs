'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import NotesPage from "@/app/components/NotesPage";
import DoitKunArea from '@/app/components/DoitKunArea';
import { DndContext, DragEndEvent, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { deleteNote } from '@/lib/actions';
import { mutate } from 'swr';

export default function Home() {
  const [droppedNoteId, setDroppedNoteId] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // @dnd-kit sensors設定（パフォーマンス改善）
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && over.id === 'doitkun-drop-zone') {
      console.log('Dropped note:', active.id);
      setDroppedNoteId(String(active.id));
    } else if (over && over.id === 'trash-drop-zone') {
      // ゴミ箱へドロップされた
      if (confirm('このノートを削除しますか？深堀り履歴も一緒に削除されます。')) {
        const result = await deleteNote(String(active.id));
        if (result.success) {
          mutate('notes'); // SWRで再検証
        } else {
          alert('削除に失敗しました: ' + result.error);
        }
      }
    }
  }, []);

  const handleMouseDown = useCallback(() => {
    setIsResizing(true);
  }, []);

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
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <main className="flex min-h-screen">
        <div className="flex-1">
          <NotesPage />
        </div>
        <aside
          ref={sidebarRef}
          style={{
            width: `${sidebarWidth}px`,
            height: '100vh',
          }}
          className="sticky top-0 p-8 bg-gray-50 border-l border-gray-200 overflow-y-auto"
        >
          <div
            onMouseDown={handleMouseDown}
            className={`absolute left-0 top-0 bottom-0 w-1 hover:w-2 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-all ${
              isResizing ? 'w-2 bg-blue-500' : ''
            }`}
          />
          <DoitKunArea
            droppedNoteId={droppedNoteId}
            onReset={() => setDroppedNoteId(null)}
          />
        </aside>
      </main>
    </DndContext>
  );
}