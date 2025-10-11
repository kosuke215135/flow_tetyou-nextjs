import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { all, createLowlight } from 'lowlight';
import { NoteModel } from '@/types/note';
import { Skeleton } from "@/app/components/ui/skeleton";

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

  const score = note.yurufuwaScore;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-4">
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
          <>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-gray-600">ゆるふわ度</span>
              <span className="text-xs font-bold text-blue-600">{(score * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${score * 100}%` }}
              ></div>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-2 w-full" />
          </>
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