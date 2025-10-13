'use client';

import { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { generateDeepDiveQuestion, createChildNote, getNotes } from '@/lib/actions';
import { type JSONContent } from '@tiptap/react';
import Editor from './Editor';
import DeepDiveTree from './DeepDiveTree';
import useSWR, { mutate } from 'swr';

interface DeepDiveState {
  parentNoteId: string;
  originalParentNoteId: string; // 最初にドロップされた親ノートのID
  currentDepth: number;
  question: string;
  isLoading: boolean;
}

interface DoitKunAreaProps {
  droppedNoteId?: string | null;
}

export default function DoitKunArea({ droppedNoteId }: DoitKunAreaProps = {}) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'doitkun-drop-zone',
  });

  const [deepDiveState, setDeepDiveState] = useState<DeepDiveState | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 親ノートのデータを取得（深堀り中のみ）
  const { data: notesData } = useSWR(
    deepDiveState ? 'deepdive-notes' : null,
    async () => {
      const res = await getNotes();
      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch notes');
      }
      return res.data || [];
    },
    {
      refreshInterval: 1000, // 1秒ごとに更新（深堀り中のリアルタイム更新）
    }
  );

  // 親ノートを見つける（最初にドロップされたノート）
  const findParentNote = (noteId: string) => {
    if (!notesData) return null;

    // まず親ノートとして探す
    const parentNote = notesData.find((n: any) => n.id === noteId);
    if (parentNote) return parentNote;

    // 子ノートの場合は親を辿る
    for (const note of notesData) {
      const found = findNoteInChildren(note, noteId);
      if (found) {
        // 最上位の親ノートを返す
        return note;
      }
    }
    return null;
  };

  const findNoteInChildren = (note: any, targetId: string): any => {
    if (note.id === targetId) return note;
    if (note.children) {
      for (const child of note.children) {
        const found = findNoteInChildren(child, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const parentNote = deepDiveState ? findParentNote(deepDiveState.originalParentNoteId) : null;

  // デバッグログ
  useEffect(() => {
    if (deepDiveState) {
      console.log('deepDiveState:', deepDiveState);
      console.log('notesData:', notesData);
      console.log('parentNote:', parentNote);
    }
  }, [deepDiveState, notesData, parentNote]);

  // ノートがドロップされたら深堀りモードを開始
  useEffect(() => {
    if (droppedNoteId && !deepDiveState) {
      startDeepDive(droppedNoteId);
    }
  }, [droppedNoteId]);

  const startDeepDive = async (noteId: string) => {
    setError(null);
    setDeepDiveState({
      parentNoteId: noteId,
      originalParentNoteId: noteId, // 最初の親ノートIDを保存
      currentDepth: -1,
      question: '',
      isLoading: true,
    });

    try {
      const questionResult = await generateDeepDiveQuestion(noteId, 0);

      if (!questionResult.success || !questionResult.data) {
        setError(questionResult.error || 'Failed to generate question');
        setDeepDiveState(null);
        return;
      }

      setDeepDiveState({
        parentNoteId: noteId,
        originalParentNoteId: noteId, // 最初の親ノートIDを保持
        currentDepth: 0,
        question: questionResult.data,
        isLoading: false,
      });
    } catch (err) {
      console.error('Error in startDeepDive:', err);
      setError('Unexpected error occurred');
      setDeepDiveState(null);
    }
  };

  const handleAnswer = async (data: { content: JSONContent }) => {
    if (!deepDiveState) return;

    setError(null);
    setDeepDiveState({ ...deepDiveState, isLoading: true });

    try {
      // 回答を子ノートとして保存
      const createResult = await createChildNote({
        parentNoteId: deepDiveState.parentNoteId,
        content: data.content,
        question: deepDiveState.question,
        depth: deepDiveState.currentDepth + 1,
      });

      if (!createResult.success || !createResult.data) {
        setError(createResult.error || 'Failed to save answer');
        setDeepDiveState({ ...deepDiveState, isLoading: false });
        return;
      }

      // 次の質問を生成（最大depth=4まで、5回繰り返し）
      if (deepDiveState.currentDepth < 4) {
        const questionResult = await generateDeepDiveQuestion(
          createResult.data.id,
          deepDiveState.currentDepth + 1
        );

        if (!questionResult.success || !questionResult.data) {
          setError(questionResult.error || 'Failed to generate next question');
          setDeepDiveState(null);
          return;
        }

        // 次の質問を表示
        setDeepDiveState({
          parentNoteId: createResult.data.id,
          originalParentNoteId: deepDiveState.originalParentNoteId, // 元の親ノートIDを維持
          currentDepth: deepDiveState.currentDepth + 1,
          question: questionResult.data,
          isLoading: false,
        });
      } else {
        // 深堀り完了
        setDeepDiveState(null);
        // ツリー表示を更新
        mutate('deepdive-notes');
      }
    } catch (err) {
      console.error('Error in handleAnswer:', err);
      setError('Unexpected error occurred');
      setDeepDiveState({ ...deepDiveState, isLoading: false });
    }
  };

  // 待機中の表示
  if (!deepDiveState) {
    return (
      <div>
        <h2 className="text-lg font-bold mb-4 text-center">💪 ドゥイットくんエリア</h2>

        <div
          ref={setNodeRef}
          className={`
            min-h-[300px]
            border-4 border-dashed rounded-lg
            flex flex-col items-center justify-center
            transition-all duration-200
            ${isOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50'
            }
          `}
        >
          <div className="flex flex-col items-center gap-4">
            <img
              src="/doitkun.webp"
              alt="ドゥイットくん"
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-300 shadow-md"
            />
            <div className="text-center px-4">
              <p className="text-base font-semibold text-gray-700 mb-2">
                ここにノートをドロップして深堀りを始めよう！
              </p>
              <p className="text-sm text-gray-500">
                オレが「なぜ？」を繰り返して、君の思考を深堀りしてやるぜ
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 深堀り中の表示
  return (
    <div>
      <h2 className="text-lg font-bold mb-4 text-center">
        🔍 深堀り中... ({deepDiveState.currentDepth + 1}/5)
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 縦に流れるレイアウト: ツリー → 現在の質問 → 入力エリア */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* これまでのツリー表示 */}
        {parentNote ? (
          <div className="mb-6">
            <DeepDiveTree
              parentNote={parentNote as any}
              currentDepth={deepDiveState.currentDepth}
              currentQuestion={deepDiveState.question}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 mb-6">
            <p className="text-sm text-gray-500">ノート情報を読み込み中...</p>
          </div>
        )}

        {/* 現在の質問と入力エリア（ツリーの続きとして） */}
        <div className="ml-4 pl-4 border-l-2 border-blue-200">
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <img
                src="/doitkun.webp"
                alt="ドゥイットくん"
                className="w-12 h-12 rounded-full object-cover border-2 border-blue-400"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-600 mb-1">ドゥイットくん</p>
                <p className="text-base text-gray-800">{deepDiveState.question}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">あなたの回答:</p>
              <Editor
                onNoteSubmit={handleAnswer}
                submitButtonText={deepDiveState.isLoading ? '保存中...' : '回答する'}
                disabled={deepDiveState.isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
