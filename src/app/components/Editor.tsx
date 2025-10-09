'use client';

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Link from "@tiptap/extension-link";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { all, createLowlight } from "lowlight";
import Placeholder from "@tiptap/extension-placeholder";
import { RichEditorToolbar } from "@/app/components/RichEditorToolbar";
import { useForm } from "react-hook-form";
import { createNote } from '@/lib/actions';
import { Editor } from "@tiptap/core";
import { NoteFormData } from "@/types/note";


const lowlight = createLowlight(all);

interface Note {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface NoteEditorProps {
  onNoteRefresh: () => void;
}

export default function NoteEditor({ onNoteRefresh }: NoteEditorProps) {
    const { setValue, handleSubmit } = useForm<NoteFormData>();
    
    const onSubmit = async (data: NoteFormData) => {
      const response = await createNote(data);
      if (response.success) {
        editor?.commands.clearContent();
        // 記録成功後にノート一覧をリフレッシュ
        onNoteRefresh();
      }
    };

    const editor: Editor | null = useEditor({
      extensions: [
        StarterKit,
        TaskItem.configure({ nested: true }),
        TaskList,
        Link.configure({ openOnClick: true }),
        CodeBlockLowlight.configure({ lowlight }),
        Placeholder.configure({ placeholder: "Write something …" }),
      ],
      content: "",
      editorProps: {
        attributes: {
          class: "textbox",
        },
      },
      immediatelyRender: false,
      onUpdate: ({ editor }) => {
        // JSONに変換
        const json = editor.getJSON();
        setValue("content", json);
      },
    });

    if (!editor) {
      return null;
    }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="editor-wrapper">
        <EditorContent editor={editor} className="editor" />
        <div className="editor-footer flex items-center gap-2 mt-2">
          <RichEditorToolbar editor={editor} />
          <button
            type="submit"
            className="submit-button bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            記録
          </button>
        </div>
      </div>
    </form>
  );
};