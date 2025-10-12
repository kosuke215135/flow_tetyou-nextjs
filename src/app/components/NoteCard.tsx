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

type NoteWithChildren = NoteModel & {
  user: {
    name: string | null;
  };
  children?: NoteWithChildren[];
  question?: string | null;
  depth?: number;
};

interface NoteCardProps {
  note: NoteWithChildren;
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
    <div>
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

      {/* 子ノート（深堀り履歴）を表示 */}
      {note.children && note.children.length > 0 && (
        <div className="ml-8 border-l-2 border-blue-200 pl-4">
          {note.children.map((child) => (
            <ChildNoteCard key={child.id} note={child} />
          ))}
        </div>
      )}
    </div>
  );
}

// 子ノート用のカード（ドラッグ不可、質問付き）
function ChildNoteCard({ note }: { note: NoteWithChildren }) {
  const parsedContent = JSON.parse(note.text);

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
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
    },
    immediatelyRender: false,
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="mb-4">
      {/* ドゥイットくんの質問 */}
      {note.question && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-2 rounded">
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-semibold text-xs">💪 Q:</span>
            <p className="text-sm text-blue-800">{note.question}</p>
          </div>
        </div>
      )}

      {/* 回答 */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
        <div className="flex items-start gap-2 mb-2">
          <span className="text-gray-600 font-semibold text-xs">A:</span>
        </div>
        <div className="note-content">
          <EditorContent editor={editor} />
        </div>
        <div className="text-xs text-gray-400 mt-2">
          {new Date(note.createdAt).toLocaleString('ja-JP')}
        </div>
      </div>

      {/* 子ノート（さらに深い階層）を再帰的に表示 */}
      {note.children && note.children.length > 0 && (
        <div className="ml-6 mt-3 border-l-2 border-blue-100 pl-4">
          {note.children.map((child) => (
            <ChildNoteCard key={child.id} note={child} />
          ))}
        </div>
      )}
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