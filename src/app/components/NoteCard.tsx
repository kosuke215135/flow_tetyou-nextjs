import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { all, createLowlight } from 'lowlight';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { NoteModel } from '@/types/note';
import { Skeleton } from "@/app/components/ui/skeleton";
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const lowlight = createLowlight(all);

interface NoteCardProps {
  note: NoteModel & {
    user: {
      name: string | null;
    };
  };
}

export default function NoteCard({ note }: NoteCardProps) {
  const parsedContent = JSON.parse(note.text);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: note.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskItem.configure({ nested: true }),
      TaskList,
      Link.configure({ openOnClick: true }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: parsedContent,
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none',
      },
    },
    immediatelyRender: false,
  });

  if (!editor) {
    return null;
  }

  const score = note.yurufuwaScore;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-4 transition-opacity"
    >
      <div className="mb-3">
        <div className="flex justify-between items-start">
          <div className="text-sm text-gray-500">
            {note.user.name || 'Unknown User'}
          </div>
          <div className="text-xs text-gray-400">
            {new Date(note.createdAt).toLocaleString('ja-JP')}
          </div>
        </div>
      </div>
      
      <div className="note-content">
        <EditorContent editor={editor} />
      </div>

      <div className="mt-4">
        {score !== null ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">ゆるふわ度:</span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((starIndex) => (
                <div key={starIndex}>
                  {starIndex <= score ? (
                    <FaStar className="text-yellow-400 text-sm" />
                  ) : (
                    <FaRegStar className="text-gray-300 text-sm" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        )}
      </div>
    </div>
  );
}

export function NoteCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-4">
      <div className="mb-3">
        <div className="flex justify-between items-start">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      
      <div className="note-content space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      <div className="mt-4">
        <div className="flex justify-between items-center mb-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-2 w-full" />
      </div>
    </div>
  );
}