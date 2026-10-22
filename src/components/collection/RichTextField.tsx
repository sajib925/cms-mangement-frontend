"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
import { useEffect, useState } from "react"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Pilcrow,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  X,
} from "lucide-react"
import { Button } from "../ui/button"

type RichTextFieldProps = {
  fieldData: string
  id: string | number
  fieldKey: string
  onUpdate: (id: string, fieldKey: string, html: string) => void
}

export default function RichTextField({ fieldData, id, fieldKey, onUpdate }: RichTextFieldProps) {
  // Modal states for Link and Image
  const [modalType, setModalType] = useState<"link" | "image" | null>(null)
  const [inputValue, setInputValue] = useState("")

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full rounded-md my-2 object-cover border border-border",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: fieldData || "",
    editorProps: {
      attributes: {
        class: "h-[320px] m-3 p-3 overflow-auto outline-none bg-background text-foreground border border-input rounded-md focus:border-primary text-xs prose prose-invert max-w-none",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onUpdate(String(id), fieldKey, html)
    },
  })

  // Synchronize external fieldData changes if any
  useEffect(() => {
    if (editor && fieldData !== editor.getHTML()) {
      if (!editor.isFocused) {
        editor.commands.setContent(fieldData || "")
      }
    }
  }, [fieldData, editor])

  if (!editor) {
    return null
  }

  // Open modal handlers
  const handleOpenLinkModal = () => {
    const previousUrl = editor.getAttributes("link").href || ""
    setInputValue(previousUrl)
    setModalType("link")
  }

  const handleOpenImageModal = () => {
    setInputValue("")
    setModalType("image")
  }

  // Confirm modal action
  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) {
      if (modalType === "link") {
        editor.chain().focus().extendMarkRange("link").unsetLink().run()
      }
    } else {
      if (modalType === "link") {
        editor.chain().focus().extendMarkRange("link").setLink({ href: inputValue }).run()
      } else if (modalType === "image") {
        editor.chain().focus().setImage({ src: inputValue }).run()
      }
    }
    setModalType(null)
    setInputValue("")
  }

  const getButtonClass = (isActive: boolean) => {
    return `p-1.5 rounded transition-colors ${
      isActive
        ? "bg-primary text-primary-foreground font-semibold"
        : "text-muted-foreground hover:bg-accent hover:text-foreground"
    }`
  }

  return (
    <div className="relative h-[425px] flex flex-col bg-card text-card-foreground rounded-lg border border-border">
      {/* --- Toolbar --- */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-card items-center">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground rounded disabled:opacity-40"
          title="Undo"
        >
          <Undo size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground rounded disabled:opacity-40"
          title="Redo"
        >
          <Redo size={14} />
        </button>

        <div className="w-px h-5 bg-border mx-1 my-auto" />

        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={getButtonClass(editor.isActive("bold"))}
          title="Bold"
        >
          <Bold size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={getButtonClass(editor.isActive("italic"))}
          title="Italic"
        >
          <Italic size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={getButtonClass(editor.isActive("strike"))}
          title="Strikethrough"
        >
          <span className="text-xs font-bold line-through">S</span>
        </button>

        <div className="w-px h-5 bg-border mx-1 my-auto" />

        {/* Headings & Paragraph */}
        <button
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={getButtonClass(editor.isActive("paragraph"))}
          title="Paragraph (<p>)"
        >
          <Pilcrow size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={getButtonClass(editor.isActive("heading", { level: 1 }))}
          title="Heading 1"
        >
          <Heading1 size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={getButtonClass(editor.isActive("heading", { level: 2 }))}
          title="Heading 2"
        >
          <Heading2 size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={getButtonClass(editor.isActive("heading", { level: 3 }))}
          title="Heading 3"
        >
          <Heading3 size={14} />
        </button>

        <div className="w-px h-5 bg-border mx-1 my-auto" />

        {/* Lists & Quotes */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={getButtonClass(editor.isActive("bulletList"))}
          title="Bullet List"
        >
          <List size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={getButtonClass(editor.isActive("orderedList"))}
          title="Numbered List"
        >
          <ListOrdered size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={getButtonClass(editor.isActive("blockquote"))}
          title="Quote"
        >
          <Quote size={14} />
        </button>

        <div className="w-px h-5 bg-border mx-1 my-auto" />

        {/* Custom Modal Triggers for Link & Image */}
        <button
          onClick={handleOpenLinkModal}
          className={getButtonClass(editor.isActive("link"))}
          title="Insert Link"
        >
          <LinkIcon size={14} />
        </button>
        <button
          onClick={handleOpenImageModal}
          className="p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground rounded"
          title="Insert Image URL"
        >
          <ImageIcon size={14} />
        </button>

        <div className="w-px h-5 bg-border mx-1 my-auto" />

        {/* Text Alignment */}
        <button
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={getButtonClass(editor.isActive({ textAlign: "left" }))}
          title="Align Left"
        >
          <AlignLeft size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={getButtonClass(editor.isActive({ textAlign: "center" }))}
          title="Align Center"
        >
          <AlignCenter size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={getButtonClass(editor.isActive({ textAlign: "right" }))}
          title="Align Right"
        >
          <AlignRight size={14} />
        </button>
      </div>

      {/* --- Editor Content Area --- */}
      <EditorContent editor={editor} />

      {/* --- Modern Custom Popup Modal for Link / Image --- */}
      {modalType && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border p-5 rounded-lg w-full max-w-md shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                {modalType === "link" ? "Insert Link" : "Insert Image URL"}
              </h3>
              <button
                onClick={() => setModalType(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={modalType === "link" ? "https://example.com" : "https://example.com/image.jpg"}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setModalType(null)}
                  className="h-8 px-3 text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" className="h-8 px-4 text-xs font-medium">
                  Confirm
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}