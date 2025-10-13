'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { all, createLowlight } from 'lowlight';
import { NoteModel } from '@/types/note';

const lowlight = createLowlight(all);

type NoteWithChildren = NoteModel & {
  user: {
    name: string | null;
  };
  children?: NoteWithChildren[];
  question?: string | null;
  depth?: number;
};

interface DeepDiveTreeProps {
  parentNote: NoteWithChildren;
  currentDepth: number;
  currentQuestion: string;
}

export default function DeepDiveTree({ parentNote, currentDepth, currentQuestion }: DeepDiveTreeProps) {
  const parsedContent = JSON.parse(parentNote.text);

  const parentEditor = useEditor({
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

  if (!parentEditor) {
    return null;
  }

  return (
    <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2">
      {/* 親ノート */}
      <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
        <div className="text-xs text-blue-600 font-semibold mb-2">📝 元のメモ</div>
        <div className="prose prose-sm max-w-none">
          <EditorContent editor={parentEditor} />
        </div>
        <div className="text-xs text-gray-400 mt-2">
          {new Date(parentNote.createdAt).toLocaleString('ja-JP')}
        </div>
      </div>

      {/* 既存の質問と回答 */}
      {parentNote.children && parentNote.children.length > 0 && (
        <div className="ml-4 space-y-4">
          {parentNote.children.map((child, index) => (
            <QAItem key={child.id} note={child} index={index} />
          ))}
        </div>
      )}

      {/* 現在の質問（ハイライト表示） */}
      {currentQuestion && (
        <div className="ml-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-400 animate-pulse">
          <div className="flex items-start gap-2">
            <span className="text-green-700 font-semibold text-sm">💪 Q{currentDepth + 1}:</span>
            <div>
              <p className="text-sm text-green-800 font-medium">{currentQuestion}</p>
              <p className="text-xs text-green-600 mt-2">
                👉 右側で回答を入力してください
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 質問と回答のペアを表示するコンポーネント
function QAItem({ note, index }: { note: NoteWithChildren; index: number }) {
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
    <div className="space-y-2">
      {/* 質問 */}
      {note.question && (
        <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
          <div className="flex items-start gap-2">
            <span className="text-yellow-700 font-semibold text-sm">💪 Q{index + 1}:</span>
            <p className="text-sm text-yellow-800">{note.question}</p>
          </div>
        </div>
      )}

      {/* 回答 */}
      <div className="ml-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-xs text-gray-600 font-semibold mb-2">A{index + 1}:</div>
        <div className="prose prose-sm max-w-none">
          <EditorContent editor={editor} />
        </div>
        <div className="text-xs text-gray-400 mt-2">
          {new Date(note.createdAt).toLocaleString('ja-JP')}
        </div>
      </div>

      {/* 再帰的に子ノードを表示 */}
      {note.children && note.children.length > 0 && (
        <div className="ml-6 mt-3 space-y-4">
          {note.children.map((child, childIndex) => (
            <QAItem key={child.id} note={child} index={index + childIndex + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
