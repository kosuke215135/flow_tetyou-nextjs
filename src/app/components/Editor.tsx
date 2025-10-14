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
import { Editor } from "@tiptap/core";
import { NoteFormData } from "@/types/note";

const lowlight = createLowlight(all);

interface NoteEditorProps {
  onNoteSubmit: (data: NoteFormData) => Promise<void>;
  submitButtonText?: string;
  disabled?: boolean;
}

export default function NoteEditor({ onNoteSubmit, submitButtonText = '記録', disabled = false }: NoteEditorProps) {
    const { setValue, handleSubmit, formState: { isSubmitting } } = useForm<NoteFormData>();
    
    const onSubmit = async (data: NoteFormData) => {
      await onNoteSubmit(data);
      editor?.commands.clearContent();
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
          class: "prose max-w-none focus:outline-none min-h-[120px] p-4",
        },
      },
      immediatelyRender: false,
      onUpdate: ({ editor }) => {
        const json = editor.getJSON();
        setValue("content", json);
      },
      onSelectionUpdate: () => {
        // Force re-render of toolbar when selection changes
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
            className="submit-button bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            disabled={isSubmitting || disabled}
          >
            {isSubmitting ? '保存中...' : submitButtonText}
          </button>
        </div>
      </div>
    </form>
  );
};