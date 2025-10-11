'use client';

import { Editor } from "@tiptap/react";
import { useCallback, useEffect, useState } from "react";
import { AiOutlineLink } from "react-icons/ai";
import {
  MdCode,
  MdFormatBold,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatQuote,
  MdFormatStrikethrough,
  MdRedo,
  MdTaskAlt,
  MdTitle,
  MdUndo,
} from "react-icons/md";

export function RichEditorToolbar({ editor }: { editor: Editor }) {
  const [, setUpdateCounter] = useState(0);

  useEffect(() => {
    const updateHandler = () => {
      setUpdateCounter(prev => prev + 1);
    };

    editor.on('update', updateHandler);
    editor.on('selectionUpdate', updateHandler);

    return () => {
      editor.off('update', updateHandler);
      editor.off('selectionUpdate', updateHandler);
    };
  }, [editor]);
  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    // cancelled
    if (url === null) {
      return;
    }
    // empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();

      return;
    }
    // update link
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded transition-colors ${
          editor.isActive("heading", { level: 1 })
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <MdTitle className="w-6 h-6" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded transition-colors ${
          editor.isActive("bold")
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <MdFormatBold className="w-6 h-6" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-2 rounded transition-colors ${
          editor.isActive("strike")
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <MdFormatStrikethrough className="w-6 h-6" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={`p-2 rounded transition-colors ${
          editor.isActive("taskList")
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <MdTaskAlt className="w-6 h-6" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-2 rounded transition-colors ${
          editor.isActive("codeBlock")
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <MdCode className="w-6 h-6" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded transition-colors ${
          editor.isActive("bulletList")
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <MdFormatListBulleted className="w-6 h-6" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded transition-colors ${
          editor.isActive("orderedList")
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <MdFormatListNumbered className="w-6 h-6" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded transition-colors ${
          editor.isActive("blockquote")
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <MdFormatQuote className="w-6 h-6" />
      </button>
      <button
        type="button"
        onClick={setLink}
        className={`p-2 rounded transition-colors ${
          editor.isActive("link")
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <AiOutlineLink className="w-6 h-6" />
      </button>

      <div className="w-px h-8 bg-gray-300 self-center mx-1"></div>

      <button
        onClick={() => editor.chain().focus().undo().run()}
        type="button"
        className="p-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
      >
        <MdUndo className="w-6 h-6" />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        type="button"
        className="p-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
      >
        <MdRedo className="w-6 h-6" />
      </button>
    </div>
  );
};