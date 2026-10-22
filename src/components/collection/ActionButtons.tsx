import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

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

  const hasAnyDraft = selectedItems.some((item) => item.isDraft === true)

  return (
    <div className="flex items-center gap-2">
      {/* Save New Items */}
      {newItemsCount > 0 && (
        <Button
          onClick={handleSaveNewItems}
          disabled={isCreating}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded"
        >
          {isCreating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Save New Items"
          )}{" "}
          ({newItemsCount})
        </Button>
      )}

      {/* Save Edited Items */}
      {editedItemsCount > 0 && (
        <Button
          onClick={handleSaveAll}
          disabled={isUpdating}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded"
        >
          {isUpdating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Save All Changes"
          )}{" "}
          ({editedItemsCount})
        </Button>
      )}

      {/* Delete & Publish Buttons */}
      {selectedIdsCount > 0 && (
        <div className="flex items-center gap-2">
          {/* Delete Button */}
          <Button
            onClick={handleDeleteSelected}
            disabled={isDeleting || isPublishing}
            className={`px-4 py-1 rounded ${
              isDeleting
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            }`}
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Delete Selected"
            )}{" "}
            ({selectedIdsCount})
          </Button>

          {/* Publish Button — show if at least one draft */}
          {hasAnyDraft && (
            <Button
              onClick={handlePublishSelected}
              disabled={isPublishing || isDeleting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded"
            >
              {isPublishing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Publish Selected"
              )}{" "}
              ({selectedIdsCount})
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default ActionButtons