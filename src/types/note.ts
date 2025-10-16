import { JSONContent } from '@tiptap/react';

// フォームから送信されるデータの型定義
interface NoteFormData {
  content: JSONContent;
}

// DBに保存されるデータの型定義
interface NoteModel {
  id: string;
  userId: string;
  text: string;
  parentNoteId: string | null;
  depth: number;
  question: string | null;
  character: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// APIレスポンスの型定義
interface NoteResponse extends NoteModel {
  user: {
    name: string;
  };
}

// 子ノートを再帰的に含むNote型（コンポーネント間で共通利用）
export type NoteWithChildren = NoteModel & {
  user: {
    name: string | null;
  };
  children?: NoteWithChildren[];
};

// 楽観的更新用の型定義
export type OptimisticNote = NoteResponse & {
  isOptimistic?: boolean;
  children: OptimisticNote[];
};

export type { NoteFormData, NoteModel, NoteResponse };
