'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { all, createLowlight } from 'lowlight';
import { getTreeColor, type TreeColor } from '@/lib/treeColors';
import { CHARACTERS, type CharacterType } from '@/types/character';
const lowlight = createLowlight(all);

// DeepDiveTree用のNote型
type DeepDiveNote = {
  id: string;
  userId: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
  parentNoteId?: string | null;
  depth?: number;
  question?: string | null;
  user: {
    name: string | null;
  };
  children?: DeepDiveNote[];
};

interface DeepDiveTreeProps {
  parentNote: DeepDiveNote;
  currentDepth: number;
  currentQuestion: string;
  character: CharacterType;
}

export default function DeepDiveTree({ parentNote, currentDepth, currentQuestion, character }: DeepDiveTreeProps) {
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
          {parentNote.children.map((child, index) => {
            const childTreeColor = getTreeColor(index);
            return (
              <div key={child.id} className={`border-l-2 ${childTreeColor.border} pl-4 ${childTreeColor.bg} rounded-lg p-4`}>
                <QAItem note={child} index={index} treeColor={childTreeColor} character={character} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 質問と回答のペアを表示するコンポーネント
function QAItem({ note, index, treeColor, character }: { note: DeepDiveNote; index: number; treeColor: TreeColor; character: CharacterType }) {
  const parsedContent = JSON.parse(note.text);
  const depth = note.depth || 1;
  const isLastQuestion = depth === 5;
  const currentCharacter = CHARACTERS[character];

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
            <span className="text-xl">{isLastQuestion ? '🎯' : currentCharacter.emoji}</span>
            <div className="flex-1">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {isLastQuestion ? `${currentCharacter.name}の最後の質問` : `${currentCharacter.name}の質問`}
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
            <QAItem key={child.id} note={child} index={index + 1} treeColor={treeColor} character={character} />
          ))}
        </div>
      )}
    </div>
  );
}
