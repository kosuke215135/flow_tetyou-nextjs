import { useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { all, createLowlight } from 'lowlight';
import { FaStar, FaRegStar, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { NoteModel } from '@/types/note';
import { Skeleton } from "@/app/components/ui/skeleton";
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { getTreeColor, type TreeColor } from '@/lib/treeColors';

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
  index?: number; // リスト内のインデックス（色分け用）
}

export default function NoteCard({ note, index = 0 }: NoteCardProps) {
  const parsedContent = JSON.parse(note.text);
  const [isExpanded, setIsExpanded] = useState(true);

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
  const hasChildren = note.children && note.children.length > 0;
  const childrenCount = note.children?.length || 0;

  return (
    <div className="relative" style={{ marginBottom: hasChildren ? '3rem' : '1rem' }}>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className="bg-white rounded-lg shadow-md border border-gray-200 p-4 transition-all hover:shadow-lg hover:-translate-y-1 duration-200"
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
      </div>

      {/* 本のインデックスシール風タブ（下側左、ノートに接して外側） */}
      {hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="absolute bottom-0 left-4 translate-y-full bg-blue-500 text-white px-3 py-2 rounded-b-md shadow-md hover:bg-blue-600 transition-all"
          style={{
            zIndex: 10,
          }}
        >
          <div className="flex items-center gap-1">
            {isExpanded ? (
              <FaChevronDown className="text-[10px]" />
            ) : (
              <FaChevronRight className="text-[10px]" />
            )}
            <span className="text-[11px] font-bold">
              深堀り{childrenCount}
            </span>
          </div>
        </button>
      )}

      {/* 子ノート（深堀り履歴）を表示 - 各深堀りツリーごとに色分け */}
      {hasChildren && isExpanded && (
        <div className="ml-8 mt-4 space-y-6">
          {note.children!.map((child, childIndex) => {
            const treeColor = getTreeColor(childIndex);
            return (
              <div key={child.id} className={`border-l-2 ${treeColor.border} pl-4 ${treeColor.bg} rounded-lg p-4`}>
                <ChildNoteCard note={child} treeColor={treeColor} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 子ノート用のカード（ドラッグ不可、質問付き）
function ChildNoteCard({ note, treeColor }: { note: NoteWithChildren; treeColor: TreeColor }) {
  const parsedContent = JSON.parse(note.text);
  const depth = note.depth || 1;
  const isLastQuestion = depth === 5;

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
    <div className="mb-6">
      {/* ドゥイットくんの質問 */}
      {note.question && (
        <div className={`bg-white ${treeColor.border} border-l-4 border-t border-r border-b p-4 mb-2 rounded-lg relative shadow-md`}>
          {/* 深さバッジ */}
          <div className={`absolute -left-3 -top-3 w-8 h-8 rounded-full ${treeColor.accent} flex items-center justify-center text-white text-xs font-bold shadow-md`}>
            Q{depth}
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xl">{isLastQuestion ? '🎯' : '💪'}</span>
            <div className="flex-1">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {isLastQuestion ? 'ドゥイットくんの最後の質問' : 'ドゥイットくんの質問'}
              </div>
              <p className="text-sm font-medium text-gray-800">{note.question}</p>
            </div>
          </div>
        </div>
      )}

      {/* 回答 */}
      <div className="ml-6 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-gray-500">あなたの回答:</span>
        </div>
        <div className="note-content">
          <EditorContent editor={editor} />
        </div>
        <div className="text-xs text-gray-400 mt-2">
          {new Date(note.createdAt).toLocaleString('ja-JP')}
        </div>
      </div>

      {/* 進捗バー */}
      <div className="ml-6 mt-2 flex items-center gap-2">
        <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${treeColor.accent} transition-all duration-300`}
            style={{ width: `${(depth / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-500">{depth}/5</span>
      </div>

      {/* 子ノート（さらに深い階層）を再帰的に表示 */}
      {note.children && note.children.length > 0 && (
        <div className="ml-6 mt-4">
          {note.children.map((child) => (
            <ChildNoteCard key={child.id} note={child} treeColor={treeColor} />
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