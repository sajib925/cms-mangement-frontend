"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Moon,
  Sun,
  Plus,
  Search,
  FolderPlus,
  Save,
  Trash2,
  Send,
  PlusCircle,
  Globe,
  Edit3,
  FileUp,
  FileDown,
} from "lucide-react"
import { useLocation } from "react-router"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import {
  useListCollectionsQuery,
  useListItemsQuery,
} from "@/redux/api/dataApi"
import CollectionSelector from "@/components/collection/CollectionSelector"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ResizeSelector } from "./common/SizeSelection"
import { cn } from "@/lib/utils"
import {
  setEnvironmentMode,
  setLastUpdatedFilter,
  setSearchQuery,
  setSelectedCollectionId,
} from "@/redux/collectionSlice"
import type { WebflowGlobal } from "@/types/webflow"

type SiteHeaderProps = {
  isDarkMode: boolean
  onThemeToggle: () => void
  onVariableReload?: () => void | Promise<void>
}

export function SiteHeader({
  isDarkMode,
  onThemeToggle,
}: SiteHeaderProps) {
  const location = useLocation()
  const dispatch = useAppDispatch()

  const {
    selectedCollectionId,
    searchQuery,
    lastUpdatedFilter,
    environmentMode,
    newItems,
    editedItems,
    selectedIds,
    extensionSize,
  } = useAppSelector((state) => state.collection)

  const isMax = extensionSize === "max"
  const [siteId, setSiteId] = useState("")

  useEffect(() => {
    const getSiteId = async () => {
      try {
        const wf = window.webflow as WebflowGlobal | undefined;

        if (wf?.getSiteInfo) {
          const { siteId } = await wf.getSiteInfo()
          setSiteId(siteId)
        }
      } catch (e) {
        console.error("Failed to fetch site info", e)
      }
    }
    getSiteId()
  }, [])

  const { data: collectionsData } = useListCollectionsQuery(siteId, {
    skip: !siteId,
  })

  const collections =
    (collectionsData as any)?.data?.collections ??
    (collectionsData as any)?.collections ??
    []

  const { data: itemsData } = useListItemsQuery(
    { siteId, collectionId: selectedCollectionId },
    { skip: !selectedCollectionId || !siteId },
  )

  const items =
    (itemsData as any)?.data?.items ??
    (itemsData as any)?.items ??
    []

  const dispatchEventAction = (eventName: string, detail?: any) => {
    window.dispatchEvent(new CustomEvent(eventName, { detail }))
  }

  const handleThemeToggleInstant = () => {
    document.documentElement.classList.add(
      "[&_*]:!transition-none",
    )

    onThemeToggle()

    setTimeout(() => {
      document.documentElement.classList.remove(
        "[&_*]:!transition-none",
      )
    }, 50)
  }

  const currentPath =
    location.pathname.toLowerCase().replace(/\/+$/, "") || "/"

  const isTablePage = currentPath === "/table"

  const newItemsCount = Object.keys(newItems).length
  const editedItemsCount = Object.keys(editedItems).length
  const selectedIdsCount = selectedIds.length

  const iconSize = "size-3.5"
  const iconButtonClass =
    "h-6! w-6! max-w-6! shrink-0 rounded-md! p-0!"

  const selectClass =
    "h-6! px-1.5! text-[11px] font-medium rounded-md! border-border bg-card cursor-pointer shrink-0"

  const iconClass = "size-3.5 shrink-0"

  return (
    <header className="relative flex h-11 shrink-0 items-center border-b border-border bg-card px-2 select-none">
      <div className="flex w-full items-center justify-between gap-1">
        {/* Left: Sidebar */}
        <div className="flex shrink-0 items-center gap-1.5">
          <SidebarTrigger className="-ml-1 h-6! w-6! rounded-md! cursor-pointer" />
          <div className="h-4 w-px shrink-0 bg-border" />
        </div>

        {/* Table Controls */}
        {isTablePage && (
          <div className="flex shrink-0 flex-nowrap items-center gap-1.5">
            <CollectionSelector
              siteId={siteId}
              collections={collections}
              selectedCollectionId={selectedCollectionId}
              searchQuery={searchQuery}
              setSelectedCollectionId={(id) =>
                dispatch(setSelectedCollectionId(id))
              }
              setSearchQuery={(query) =>
                dispatch(setSearchQuery(query))
              }
              handleAddNewItem={() =>
                dispatchEventAction("trigger-add-new-item")
              }
              lastUpdatedFilter={lastUpdatedFilter}
              setLastUpdatedFilter={(filter) =>
                dispatch(setLastUpdatedFilter(filter))
              }
              items={items}
              onEditCollection={(col) =>
                dispatchEventAction("trigger-open-edit-collection", col)
              }
              onDeleteCollection={(colId) =>
                dispatchEventAction("trigger-delete-collection", colId)
              }
              isMax={isMax}
            />

            {/* Environment */}
            <Select
              value={environmentMode || "staging"}
              onValueChange={(val: any) =>
                dispatch(setEnvironmentMode(val))
              }
            >
              <SelectTrigger
                className={cn(
                  selectClass,
                  environmentMode === "live"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 w-20 dark:text-emerald-400"
                    : "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                )}
              >
                <SelectValue placeholder="Mode" />
              </SelectTrigger>

              <SelectContent className={cn("z-50 border-border bg-card w-20!")}>
                <SelectItem value="staging" className="cursor-pointer text-xs">
                  <span className="flex items-center gap-1.5">
                    Staging
                  </span>
                </SelectItem>

                <SelectItem value="live" className="cursor-pointer text-xs">
                  <span className="flex items-center gap-1.5">
                    Live
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Time Filter */}
            <Select
              value={lastUpdatedFilter}
              onValueChange={(val) =>
                dispatch(setLastUpdatedFilter(val))
              }
            >
              <SelectTrigger
                className={cn(
                  selectClass,
                  isMax ? "w-20" : "w-18",
                )}
              >
                <SelectValue placeholder="Filter" />
              </SelectTrigger>

              <SelectContent className="z-50 border-border bg-card">
                <SelectItem value="all" className="cursor-pointer text-xs">
                  All time
                </SelectItem>
                <SelectItem value="today" className="cursor-pointer text-xs">
                  Today
                </SelectItem>
                <SelectItem value="this_week" className="cursor-pointer text-xs">
                  This Week
                </SelectItem>
                <SelectItem value="this_month" className="cursor-pointer text-xs">
                  This Month
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative flex shrink-0 items-center">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(event) =>
                  dispatch(setSearchQuery(event.target.value))
                }
                className={cn(
                  "h-6! rounded-md! border border-border bg-background px-1.5! text-[11px] text-foreground outline-none focus:border-none",
                  isMax ? "w-42 focus:w-48" : "w-22 focus:w-28",
                )}
              />
            </div>

            {/* Add Item */}
            <Button
              type="button"
              size="icon"
              onClick={() =>
                dispatchEventAction("trigger-add-new-item")
              }
              title="Add New Item"
              className={cn(
                iconButtonClass,
                "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              <Plus className={iconClass} />
            </Button>

            {/* Add Collection */}
            <Button
              type="button"
              size="icon"
              onClick={() =>
                dispatchEventAction("trigger-open-create-collection-modal")
              }
              title="Create New Collection"
              className={cn(
                iconButtonClass,
                "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              <FolderPlus className={iconClass} />
            </Button>

            {/* Add Field */}
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() =>
                dispatchEventAction("trigger-open-create-field-modal")
              }
              title="Create Custom Field"
              className={cn(
                iconButtonClass,
                "border-border bg-card text-foreground hover:bg-accent",
              )}
            >
              <PlusCircle className={iconClass} />
            </Button>
            {/* CSV Import */}
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() =>
                dispatchEventAction("trigger-open-csv-import")
              }
              title="Import CSV"
              className={cn(
                iconButtonClass,
                "border-border bg-card text-foreground hover:bg-accent",
              )}
            >
              <FileUp className={iconClass} />
            </Button>

            {/* CSV Export */}
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() =>
                dispatchEventAction("trigger-export-csv")
              }
              title="Export CSV"
              className={cn(
                iconButtonClass,
                "border-border bg-card text-foreground hover:bg-accent",
              )}
            >
              <FileDown className={iconClass} />
            </Button>

            {/* Bulk Actions */}
            {(newItemsCount > 0 ||
              editedItemsCount > 0 ||
              selectedIdsCount > 0) && (
              <div className="flex shrink-0 items-center gap-1.5 border-l border-border pl-1.5">
                {/* Save New Items */}
                {newItemsCount > 0 && (
                  <div className="relative shrink-0">
                    <Button
                      type="button"
                      size="icon"
                      onClick={() =>
                        dispatchEventAction("trigger-save-new-items")
                      }
                      title={`Save ${newItemsCount} New Item(s)`}
                      className={cn(
                        iconButtonClass,
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                      )}
                    >
                      <Save className={iconClass} />
                    </Button>

                    <span className="pointer-events-none absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-xs">
                      {newItemsCount}
                    </span>
                  </div>
                )}

                {/* Save Edited Items */}
                {editedItemsCount > 0 && (
                  <div className="relative shrink-0">
                    <Button
                      type="button"
                      size="icon"
                      onClick={() =>
                        dispatchEventAction("trigger-save-all-items")
                      }
                      title={`Save ${editedItemsCount} Edited Item(s)`}
                      className={cn(
                        iconButtonClass,
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                      )}
                    >
                      <Save className={iconClass} />
                    </Button>

                    <span className="pointer-events-none absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-xs">
                      {editedItemsCount}
                    </span>
                  </div>
                )}

                {/* Delete Selected */}
                {selectedIdsCount > 0 && (
                  <>
                    <div className="relative shrink-0">
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        onClick={() =>
                          dispatchEventAction("trigger-delete-selected-items")
                        }
                        title={`Delete ${selectedIdsCount} Selected Item(s)`}
                        className={cn(
                          iconButtonClass,
                          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                        )}
                      >
                        <Trash2 className={iconClass} />
                      </Button>

                      <span className="pointer-events-none absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground shadow-xs">
                        {selectedIdsCount}
                      </span>
                    </div>

                    {/* Publish only in Staging */}
                    {environmentMode !== "live" && (
                      <div className="relative shrink-0">
                        <Button
                          type="button"
                          size="icon"
                          onClick={() =>
                            dispatchEventAction("trigger-publish-selected-items")
                          }
                          title={`Publish ${selectedIdsCount} Selected Item(s)`}
                          className={cn(
                            iconButtonClass,
                            "bg-primary text-primary-foreground hover:bg-primary/90",
                          )}
                        >
                          <Send className={iconClass} />
                        </Button>

                        <span className="pointer-events-none absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-xs">
                          {selectedIdsCount}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Right: Size Selector & Theme */}
        <div className="flex shrink-0 items-center gap-1">
          <ResizeSelector />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleThemeToggleInstant}
            aria-label={
              isDarkMode
                ? "Switch to light theme"
                : "Switch to dark theme"
            }
            title={
              isDarkMode
                ? "Switch to Light Mode"
                : "Switch to Dark Mode"
            }
            className={cn(
              iconButtonClass,
              "bg-transparent text-foreground hover:bg-accent",
            )}
          >
            {isDarkMode ? (
              <Sun className={iconClass} />
            ) : (
              <Moon className={iconClass} />
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}