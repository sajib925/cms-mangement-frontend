"use client"

import { Check, ChevronsUpDown, Edit2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useState } from "react"

interface CollectionSelectorProps {
  siteId?: string
  collections: any[]
  selectedCollectionId: string
  searchQuery?: string
  setSelectedCollectionId: (id: string) => void
  setSearchQuery?: (query: string) => void
  handleAddNewItem?: () => void
  lastUpdatedFilter?: string
  setLastUpdatedFilter?: (filter: string) => void
  items?: any[]
  onEditCollection?: (collection: any) => void
  onDeleteCollection?: (collectionId: string) => void
  isMax?: boolean
}

export default function CollectionSelector({
  collections,
  selectedCollectionId,
  setSelectedCollectionId,
  onEditCollection,
  onDeleteCollection,
  isMax = false,
}: CollectionSelectorProps) {
  const [open, setOpen] = useState(false)

  const selectedCollection = collections.find((col) => col.id === selectedCollectionId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-6 shrink justify-between bg-card text-[11px] font-medium border-border hover:bg-accent hover:text-accent-foreground px-2 transition-all",
            isMax ? "min-w-35 max-w-50" : "min-w-22.5 max-w-32.5"
          )}
        >
          <span className="truncate">
            {selectedCollection ? (selectedCollection.displayName || selectedCollection.name) : "Select..."}
          </span>
          <ChevronsUpDown className="ml-1 size-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0 z-50 bg-card border-border shadow-md">
        <Command>
          <CommandInput placeholder="Search collection..." className="h-8 text-xs" />
          <CommandList>
            <CommandEmpty className="py-2 text-center text-xs text-muted-foreground">
              No collection found.
            </CommandEmpty>
            <CommandGroup>
              {collections.map((col) => (
                <CommandItem
                  key={col.id}
                  value={col.displayName || col.name}
                  onSelect={() => {
                    setSelectedCollectionId(col.id)
                    setOpen(false)
                  }}
                  className="flex items-center justify-between text-xs cursor-pointer group py-1.5"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Check
                      className={cn(
                        "size-3.5",
                        selectedCollectionId === col.id ? "opacity-100 text-primary" : "opacity-0"
                      )}
                    />
                    <span className="truncate font-medium">{col.displayName || col.name}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    {onEditCollection && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpen(false)
                          onEditCollection(col)
                        }}
                        className="p-1 text-muted-foreground hover:text-primary rounded-xs transition-colors"
                        title="Edit Collection"
                      >
                        <Edit2 className="size-3" />
                      </button>
                    )}
                    {onDeleteCollection && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpen(false)
                          onDeleteCollection(col.id)
                        }}
                        className="p-1 text-muted-foreground hover:text-destructive rounded-xs transition-colors"
                        title="Delete Collection"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}