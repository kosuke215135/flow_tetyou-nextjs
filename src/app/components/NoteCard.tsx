import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import Link from '@tiptap/extension-link'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { all, createLowlight } from 'lowlight'
import { NoteModel } from '@/types/note'

const lowlight = createLowlight(all)

interface NoteCardProps {
  note: NoteModel & {
    user: {
      name: string | null
    }
  }
}

export default function NoteCard({ note }: NoteCardProps) {
  const parsedContent = JSON.parse(note.text)
  
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
  })

  if (!editor) {
    return null
  }

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
    </div>
  )
}