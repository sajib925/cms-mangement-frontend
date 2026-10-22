import type React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface SortableColumnHeaderProps {
  id: string
  children: React.ReactNode
}

const SortableColumnHeader = ({ id, children }: SortableColumnHeaderProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isDragging ? "grabbing" : "grab",
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} data-id={id} className="w-full h-full relative">
      {children}
    </div>
  )
}

export default SortableColumnHeader