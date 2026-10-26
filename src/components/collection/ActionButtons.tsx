import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils" 
import { Button } from "@/components/ui/button"

interface ActionButtonsProps {
  newItemsCount: number
  editedItemsCount: number
  selectedIdsCount: number
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  isPublishing: boolean
  handleSaveNewItems: () => void
  handleSaveAll: () => void
  handleDeleteSelected: () => void
  handlePublishSelected: () => void
  selectedItems: any[]
}

const ActionButtons = ({
  newItemsCount,
  editedItemsCount,
  selectedIdsCount,
  isCreating,
  isUpdating,
  isDeleting,
  isPublishing,
  handleSaveNewItems,
  handleSaveAll,
  handleDeleteSelected,
  handlePublishSelected,
  selectedItems,
}: ActionButtonsProps) => {
  const hasAnyDraft = selectedItems.some(
    (item) => item.isDraft === true,
  )

  const buttonClass =
    "h-7 rounded-md px-2.5 text-xs font-medium flex items-center gap-1.5 shadow-none"

  const iconClass = "size-3.5 shrink-0"

  const loadingIcon = (
    <Loader2 className={cn(iconClass, "animate-spin")} />
  )

  // 🎯 cn() ফাংশন ব্যবহার করে প্রাইমারি ক্লাসের স্টাইল ফিক্স করা হলো
  const primaryButtonClass = cn(
    buttonClass,
    "bg-primary text-primary-foreground hover:bg-primary/90"
  )

  return (
    <div className="flex items-center gap-2">
      {/* Save New Items */}
      {newItemsCount > 0 && (
        <Button
          type="button"
          onClick={handleSaveNewItems}
          disabled={isCreating}
          className={primaryButtonClass}
        >
          {isCreating ? loadingIcon : "Save New Items"}
          <span>({newItemsCount})</span>
        </Button>
      )}

      {/* Save Edited Items */}
      {editedItemsCount > 0 && (
        <Button
          type="button"
          onClick={handleSaveAll}
          disabled={isUpdating}
          className={primaryButtonClass}
        >
          {isUpdating ? loadingIcon : "Save All Changes"}
          <span>({editedItemsCount})</span>
        </Button>
      )}

      {/* Delete & Publish */}
      {selectedIdsCount > 0 && (
        <div className="flex items-center gap-2">
          {/* Delete Selected */}
          <Button
            type="button"
            onClick={handleDeleteSelected}
            disabled={isDeleting || isPublishing}
            className={cn(
              buttonClass,
              isDeleting
                ? "cursor-not-allowed bg-muted text-muted-foreground"
                : "bg-red-500 text-white hover:bg-red-600"
            )}
          >
            {isDeleting ? loadingIcon : <span>Delete Selected</span>}
            <span>({selectedIdsCount})</span>
          </Button>

          {/* Publish Selected */}
          {hasAnyDraft && (
            <Button
              type="button"
              onClick={handlePublishSelected}
              disabled={isPublishing || isDeleting}
              className={primaryButtonClass}
            >
              {isPublishing ? loadingIcon : <span>Publish Selected</span>}
              <span>({selectedIdsCount})</span>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default ActionButtons