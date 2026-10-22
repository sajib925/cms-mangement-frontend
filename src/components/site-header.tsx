"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Moon, Sun, Plus, Search, FolderPlus, Save, Trash2, Send, PlusCircle } from "lucide-react"
import { useLocation } from "react-router"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import {
  setSearchQuery,
  setSelectedCollectionId,
  setLastUpdatedFilter,
} from "@/redux/collectionSlice"
import { useListCollectionsQuery, useListItemsQuery } from "@/redux/api/dataApi"
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

type SiteHeaderProps = {
  isDarkMode: boolean
  onThemeToggle: () => void
  onVariableReload?: () => void | Promise<void>
}

export function SiteHeader({ isDarkMode, onThemeToggle }: SiteHeaderProps) {
  const location = useLocation()
  const dispatch = useAppDispatch()

  const {
    selectedCollectionId,
    searchQuery,
    lastUpdatedFilter,
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
        if (window.webflow?.getSiteInfo) {
          const info = await window.webflow.getSiteInfo()
          setSiteId(info.siteId)
        }
      } catch (e) {
        console.error("Failed to fetch site info", e)
      }
    }
    getSiteId()
  }, [])

  const { data: collectionsData } = useListCollectionsQuery(siteId, { skip: !siteId })
  const collections = (collectionsData as any)?.data?.collections || (collectionsData as any)?.collections || []

  const { data: itemsData } = useListItemsQuery(
    { siteId, collectionId: selectedCollectionId },
    { skip: !selectedCollectionId || !siteId }
  )
  const items = (itemsData as any)?.data?.items || (itemsData as any)?.items || []

  const dispatchEventAction = (eventName: string, detail?: any) => {
    window.dispatchEvent(new CustomEvent(eventName, { detail }))
  }

  const handleThemeToggleInstant = () => {
    document.documentElement.classList.add("[&_*]:!transition-none")
    onThemeToggle()
    setTimeout(() => {
      document.documentElement.classList.remove("[&_*]:!transition-none")
    }, 50)
  }

  const currentPath = location.pathname.toLowerCase().replace(/\/$/, "") || "/"
  const isTablePage = currentPath === "/table" || currentPath === "/collections" || currentPath === "/"

  const newItemsCount = Object.keys(newItems).length
  const editedItemsCount = Object.keys(editedItems).length
  const selectedIdsCount = selectedIds.length

  // Dynamically scale icon & button sizes based on header extension state
  const iconSize = isMax ? "size-3.5" : "size-3"
  const btnSizeClass = isMax ? "h-7 w-7" : "h-6.5 w-6.5"

  return (
    <header className="relative flex h-11 shrink-0 items-center border-b select-none bg-card px-2">
      <div className="flex w-full items-center justify-between gap-1">
        {/* Left Area: Sidebar Trigger */}
        <div className="flex items-center gap-1.5 shrink-0">
          <SidebarTrigger className="-ml-1 cursor-pointer" />
          <div className="h-4 w-px bg-border shrink-0" />
        </div>

        {/* Middle Controls for Table/Collections View */}
        {isTablePage && (
          <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
            {/* Responsive Collection Selector */}
            <CollectionSelector
              siteId={siteId}
              collections={collections}
              selectedCollectionId={selectedCollectionId}
              searchQuery={searchQuery}
              setSelectedCollectionId={(id) => dispatch(setSelectedCollectionId(id))}
              setSearchQuery={(query) => dispatch(setSearchQuery(query))}
              handleAddNewItem={() => dispatchEventAction("trigger-add-new-item")}
              lastUpdatedFilter={lastUpdatedFilter}
              setLastUpdatedFilter={(filter) => dispatch(setLastUpdatedFilter(filter))}
              items={items}
              onEditCollection={(col) => dispatchEventAction("trigger-open-edit-collection", col)}
              onDeleteCollection={(colId) => dispatchEventAction("trigger-delete-collection", colId)}
              isMax={isMax}
            />

            {/* Time Filter */}
            <Select
              value={lastUpdatedFilter}
              onValueChange={(val) => dispatch(setLastUpdatedFilter(val))}
            >
              <SelectTrigger className={cn("text-[11px] font-medium px-1.5 bg-card border-border cursor-pointer shrink-0", isMax ? "h-7 w-20" : "h-6.5 w-18")}>
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-card border-border">
                <SelectItem value="all" className="text-xs cursor-pointer">All time</SelectItem>
                <SelectItem value="today" className="text-xs cursor-pointer">Today</SelectItem>
                <SelectItem value="this_week" className="text-xs cursor-pointer">This Week</SelectItem>
                <SelectItem value="this_month" className="text-xs cursor-pointer">This Month</SelectItem>
              </SelectContent>
            </Select>

            {/* Compact Search Input */}
            <div className="relative flex items-center shrink-0">
              <Search className={cn("absolute left-2 text-muted-foreground pointer-events-none", iconSize)} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                className={cn(
                  "rounded-md border border-border bg-background pl-6.5 pr-1.5 text-[11px] text-foreground outline-none focus:border-primary transition-all",
                  isMax ? "h-7 w-28 focus:w-36" : "h-6.5 w-22 focus:w-28"
                )}
              />
            </div>

            {/* Add New Item Button */}
            <Button
              type="button"
              size="icon"
              onClick={() => dispatchEventAction("trigger-add-new-item")}
              title="Add New Item"
              className={cn(btnSizeClass, "bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 cursor-pointer")}
            >
              <Plus className={iconSize} />
            </Button>

            {/* Add New Collection Button */}
            <Button
              type="button"
              size="icon"
              onClick={() => dispatchEventAction("trigger-open-create-collection-modal")}
              title="Create New Collection"
              className={cn(btnSizeClass, "bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 cursor-pointer")}
            >
              <FolderPlus className={iconSize} />
            </Button>

            {/* Add New Field Button */}
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => dispatchEventAction("trigger-open-create-field-modal")}
              title="Create Custom Field"
              className={cn(btnSizeClass, "border-border text-foreground hover:bg-accent shrink-0 cursor-pointer")}
            >
              <PlusCircle className={iconSize} />
            </Button>

            {/* Dynamic Bulk Action Buttons */}
            {(newItemsCount > 0 || editedItemsCount > 0 || selectedIdsCount > 0) && (
              <div className="flex items-center gap-1.5 border-l border-border pl-1.5 shrink-0">
                {/* Save New Items */}
                {newItemsCount > 0 && (
                  <div className="relative shrink-0">
                    <Button
                      type="button"
                      size="icon"
                      onClick={() => dispatchEventAction("trigger-save-new-items")}
                      title={`Save ${newItemsCount} New Item(s)`}
                      className={cn(btnSizeClass, "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer")}
                    >
                      <Save className={iconSize} />
                    </Button>
                    <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 px-1 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow-xs pointer-events-none">
                      {newItemsCount}
                    </span>
                  </div>
                )}

                {/* Save All Edited Items */}
                {editedItemsCount > 0 && (
                  <div className="relative shrink-0">
                    <Button
                      type="button"
                      size="icon"
                      onClick={() => dispatchEventAction("trigger-save-all-items")}
                      title={`Save ${editedItemsCount} Edited Item(s)`}
                      className={cn(btnSizeClass, "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer")}
                    >
                      <Save className={iconSize} />
                    </Button>
                    <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 px-1 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow-xs pointer-events-none">
                      {editedItemsCount}
                    </span>
                  </div>
                )}

                {/* Selected Items Delete & Publish */}
                {selectedIdsCount > 0 && (
                  <>
                    <div className="relative shrink-0">
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        onClick={() => dispatchEventAction("trigger-delete-selected-items")}
                        title={`Delete ${selectedIdsCount} Selected Item(s)`}
                        className={cn(btnSizeClass, "bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer")}
                      >
                        <Trash2 className={iconSize} />
                      </Button>
                      <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 px-1 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground shadow-xs pointer-events-none">
                        {selectedIdsCount}
                      </span>
                    </div>

                    <div className="relative shrink-0">
                      <Button
                        type="button"
                        size="icon"
                        onClick={() => dispatchEventAction("trigger-publish-selected-items")}
                        title={`Publish ${selectedIdsCount} Selected Item(s)`}
                        className={cn(btnSizeClass, "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer")}
                      >
                        <Send className={iconSize} />
                      </Button>
                      <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 px-1 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow-xs pointer-events-none">
                        {selectedIdsCount}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Right Tools: Size Selector & Theme Toggle */}
        <div className="flex items-center gap-1 shrink-0">
          <ResizeSelector />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleThemeToggleInstant}
            aria-label={isDarkMode ? "Switch to light theme" : "Switch to dark theme"}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className={cn(btnSizeClass, "cursor-pointer")}
          >
            {isDarkMode ? <Sun className={iconSize} /> : <Moon className={iconSize} />}
          </Button>
        </div>
      </div>
    </header>
  )
}