"use client"

import type React from "react"
import type { ReactElement } from "react"
import { useState, useEffect, useRef } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import RichTextField from "./RichTextField"
import { format } from "date-fns"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogTrigger } from "../ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, X, Undo2, Redo2 } from "lucide-react"
import { Button } from "../ui/button"
import CustomButton from "@/components/common/Button"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import type { ExtendedItem, FieldDefinition, Item } from "@/types"
import { stripHtml } from "@/lib/helper"
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "../ui/dialog"

type DialogType = "Reference" | "MultiReference" | "PlainText" | "RichText"

interface RenderFieldInputProps {
  item: ExtendedItem | { id: string; fieldData: Record<string, any> }
  fieldKey: string
  isNewItem?: boolean
  editedItemsCount: number
  isUpdating: boolean
  fieldDefinition?: FieldDefinition
  fieldData: any
  referenceItems: Item[]
  referenceItemName: string
  handleSaveAll: () => void
  onUpdate: (id: string, key: string, value: any) => void
  getReferenceItemName?: (refId: string, fieldSlug: string) => string
  onFillHandleMouseDown?: (itemId: string, fieldKey: string, event: React.MouseEvent) => void
  onFillHandleMouseEnter?: (itemId: string, fieldKey: string) => void
  isSelectedForFill?: boolean
  activeDialog: { itemId: string; fieldKey: string; type: DialogType } | null
  setActiveDialog: React.Dispatch<React.SetStateAction<{ itemId: string; fieldKey: string; type: DialogType } | null>>
}

export default function RenderFieldInput({
  item,
  fieldKey,
  fieldDefinition,
  fieldData,
  referenceItems = [],
  referenceItemName,
  handleSaveAll,
  editedItemsCount,
  isUpdating,
  onUpdate,
  getReferenceItemName,
  onFillHandleMouseDown,
  onFillHandleMouseEnter,
  isSelectedForFill,
  activeDialog,
  setActiveDialog,
}: RenderFieldInputProps): ReactElement {
  const id = item.id
  const [value, setValue] = useState(fieldData)
  const [isFocused, setIsFocused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement>(null)
  const [history, setHistory] = useState<any[]>([])
  const [redoStack, setRedoStack] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const ignoreNextFieldDataUpdateRef = useRef(false)
  const originalVideoValue = useRef<string>("")

  const isSystemField = ["status", "lastUpdated", "createdOn"].includes(fieldKey)

  useEffect(() => {
    if (ignoreNextFieldDataUpdateRef.current) {
      ignoreNextFieldDataUpdateRef.current = false
      return
    }

    setValue(fieldData)
    setHistory([])
    setRedoStack([])
    originalVideoValue.current = typeof fieldData === "object" && fieldData !== null ? fieldData?.url || "" : fieldData || ""
  }, [fieldData, id, fieldKey])

  const formatDate = (dateVal: any) => {
    if (!dateVal) return "—"
    try {
      const parsed = new Date(dateVal)
      if (isNaN(parsed.getTime())) return String(dateVal)
      return format(parsed, "MMM d, yyyy HH:mm")
    } catch {
      return String(dateVal)
    }
  }

  const updateValueAndHistory = (newValue: any) => {
    setHistory((prev) => [...prev, value])
    setValue(newValue)
    ignoreNextFieldDataUpdateRef.current = true
    onUpdate(id, fieldKey, newValue)
    setRedoStack([])
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value
    updateValueAndHistory(newValue)
  }

  const handleCheckboxChange = (checked: boolean) => {
    updateValueAndHistory(checked)
  }

  const handleSelectChange = (newValue: string) => {
    const finalValue = newValue === "none" ? "" : newValue
    updateValueAndHistory(finalValue)
  }

  const handleDateChange = (date: Date | undefined) => {
    const newDateValue = date ? date.toISOString() : ""
    updateValueAndHistory(newDateValue)
  }

  const handleMultiReferenceChange = (selectedIds: string[]) => {
    updateValueAndHistory(selectedIds)
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = e.target.value === "" ? "" : Number(e.target.value)
    updateValueAndHistory(numValue)
  }

  const handleUndo = () => {
    if (history.length === 0) return
    const previousValue = history[history.length - 1]
    setHistory((prev) => prev.slice(0, prev.length - 1))
    setRedoStack((prev) => [value, ...prev])
    setValue(previousValue)
    ignoreNextFieldDataUpdateRef.current = true
    onUpdate(id, fieldKey, previousValue)
  }

  const handleRedo = () => {
    if (redoStack.length === 0) return
    const nextValue = redoStack[0]
    setRedoStack((prev) => prev.slice(1))
    setHistory((prev) => [...prev, value])
    setValue(nextValue)
    ignoreNextFieldDataUpdateRef.current = true
    onUpdate(id, fieldKey, nextValue)
  }

  const handleFileOrUrl = async (file?: File) => {
    const webflow = (window as any).webflow
    setIsUploading(true)

    try {
      let asset
      if (file) {
        const uploaded = await webflow.createAsset(file)
        const uploadedId = uploaded?.id || uploaded?.[0]?.id

        if (!uploadedId) {
          webflow?.notify?.({ type: "Error", message: "Asset ID not found after upload!" })
          return
        }

        const allAssets = await webflow.getAllAssets()
        asset = allAssets.find((a: any) => a.id === uploadedId)
      }

      const finalUrl = asset?.url || (await asset?.getUrl?.())
      updateValueAndHistory({ id: asset?.id, url: finalUrl || "" })
      await webflow?.notify?.({ type: "Success", message: "File linked successfully!" })
    } catch (error) {
      const webflow = (window as any).webflow
      webflow?.notify?.({ type: "Error", message: "Error uploading or linking file" })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    handleFileOrUrl(files[0])
  }

  const handleMultiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return

    const file = fileList[0]
    const webflow = (window as any).webflow
    setIsUploading(true)

    try {
      const uploaded = await webflow?.createAsset(file)
      const uploadedId = uploaded?.id || uploaded?.[0]?.id

      if (!uploadedId) {
        webflow?.notify?.({ type: "Error", message: "Image upload failed!" })
        return
      }

      const allAssets = await webflow?.getAllAssets()
      const asset = allAssets?.find((a: any) => a.id === uploadedId)

      const finalUrl = asset?.url || (await asset?.getUrl?.()) || ""
      const currentFiles = Array.isArray(value) ? value.filter(Boolean) : []
      const newFiles = [...currentFiles, { id: asset?.id || uploadedId, url: finalUrl }]

      updateValueAndHistory(newFiles)
      await webflow?.notify?.({ type: "Success", message: "Multi-image item added!" })
    } catch (error) {
      const webflow = (window as any).webflow
      webflow?.notify?.({ type: "Error", message: "Error uploading multi-image" })
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

  const handleUrlBlur = async (index: number) => {
    if (!Array.isArray(value)) return
    const file = value[index]
    if (file?.id) {
      const webflow = (window as any).webflow
      const allAssets = await webflow?.getAllAssets()
      const asset = allAssets?.find((a: any) => a.id === file.id)
      if (asset) {
        const finalUrl = asset.url || (await asset.getUrl?.())
        const updatedFiles = [...value]
        updatedFiles[index] = { id: asset.id, url: finalUrl }
        updateValueAndHistory(updatedFiles)
      }
    }
  }

  const removeMultiImageItem = (index: number) => {
    if (!Array.isArray(value)) return
    const updatedFiles = value.filter((_: any, i: number) => i !== index)
    updateValueAndHistory(updatedFiles)
  }

  const isImageFile = (file: File | string) => {
    if (typeof file === "string") {
      return /\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i.test(file)
    } else if (file && typeof file === "object" && "type" in file) {
      return (file as File).type.startsWith("image/")
    }
    return false
  }

  const renderInputContent = () => {
    if (fieldKey === "status") {
      const extItem = item as ExtendedItem
      const isArchived = extItem?.isArchived
      const isDraft = extItem?.isDraft

      let statusLabel = "Published"
      let statusBadgeClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"

      if (isArchived) {
        statusLabel = "Archived"
        statusBadgeClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
      } else if (isDraft) {
        statusLabel = "Draft"
        statusBadgeClass = "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
      }

      return (
        <div className="flex h-full items-center px-3 select-none">
          <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", statusBadgeClass)}>
            {statusLabel}
          </span>
        </div>
      )
    }

    if (fieldKey === "lastUpdated") {
      const rawDate = (item as ExtendedItem)?.lastUpdated || fieldData
      return (
        <div className="flex h-full items-center px-3 text-xs text-muted-foreground font-mono select-none truncate">
          {formatDate(rawDate)}
        </div>
      )
    }

    if (fieldKey === "createdOn") {
      const rawDate = (item as ExtendedItem)?.createdOn || fieldData
      return (
        <div className="flex h-full items-center px-3 text-xs text-muted-foreground font-mono select-none truncate">
          {formatDate(rawDate)}
        </div>
      )
    }

    if (!fieldDefinition) {
      return (
        <input
          className="w-full rounded-none bg-transparent px-3 py-2 text-xs text-foreground focus-visible:outline-none"
          type="text"
          value={typeof value === "object" && value !== null ? JSON.stringify(value) : String(value || "")}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          ref={inputRef as React.RefObject<HTMLInputElement>}
          disabled={isUpdating}
        />
      )
    }

    switch (fieldDefinition.type) {
      case "Reference": {
        const selectedId =
          typeof value === "object" && value !== null
            ? String(value.id || value._id || value.itemId || "")
            : String(value || "")

        const selectedRefName =
          selectedId && selectedId !== "none"
            ? getReferenceItemName
              ? getReferenceItemName(selectedId, fieldKey)
              : referenceItems.find((r: any) => String(r.id) === selectedId)?.fieldData?.name || referenceItemName || selectedId
            : null

        return (
          <div className="flex flex-col min-w-[180px]">
            <Select
              value={selectedId && selectedId !== "none" ? selectedId : "none"}
              onValueChange={handleSelectChange}
              onOpenChange={(open) => setIsFocused(open)}
              disabled={isUpdating}
            >
              <SelectTrigger
                className="h-auto w-full border-0 bg-transparent px-3 py-2 text-xs text-foreground focus:ring-0"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                ref={inputRef as React.RefObject<HTMLButtonElement>}
              >
                <SelectValue placeholder="Select reference...">
                  {selectedRefName || <span className="text-muted-foreground">Select reference...</span>}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[220px] rounded-md border border-border bg-popover text-popover-foreground shadow-md z-50">
                <SelectItem value="none" className="text-xs text-muted-foreground">
                  None (Clear)
                </SelectItem>
                {referenceItems && referenceItems.length > 0 ? (
                  referenceItems.map((refItem: any) => {
                    const itemIdStr = String(refItem.id)
                    const itemName = refItem.fieldData?.name || refItem.fieldData?.title || refItem.id
                    return (
                      <SelectItem key={refItem.id} value={itemIdStr} className="text-xs">
                        {itemName}
                      </SelectItem>
                    )
                  })
                ) : (
                  <div className="p-2 text-xs text-muted-foreground text-center">
                    No references found
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        )
      }

      case "MultiReference": {
        const rawArray = Array.isArray(value) ? value : value ? [value] : []
        const normalizedFieldData: string[] = rawArray
          .map((ref: any) => (typeof ref === "object" && ref !== null ? String(ref.id || ref._id || ref.itemId || "") : String(ref)))
          .filter(Boolean)

        return (
          <div className="flex w-[260px] flex-col px-3 py-2">
            <Dialog
              open={
                activeDialog?.type === "MultiReference" &&
                activeDialog?.itemId === id &&
                activeDialog?.fieldKey === fieldKey
              }
              onOpenChange={(isOpen) => {
                if (isOpen) {
                  setActiveDialog({ itemId: id, fieldKey, type: "MultiReference" })
                  setIsFocused(true)
                } else {
                  setActiveDialog(null)
                  setIsFocused(false)
                }
              }}
            >
              <DialogTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "w-full rounded border bg-transparent px-3 py-1.5 text-left text-xs transition-colors focus:outline-none",
                    normalizedFieldData.length > 0
                      ? "border-primary text-primary hover:bg-primary/5"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                  disabled={isUpdating}
                >
                  {normalizedFieldData.length > 0 ? (
                    <span className="font-medium text-primary">Manage {normalizedFieldData.length} References</span>
                  ) : (
                    "Select references..."
                  )}
                </button>
              </DialogTrigger>

              <DialogContent className="max-w-md rounded-lg border border-border bg-card p-0 text-card-foreground shadow-lg sm:max-w-[425px]">
                <div className="border-b border-border bg-muted/40 p-4">
                  <h2 className="text-lg font-semibold text-foreground">Select References</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Choose one or more items</p>
                </div>

                {normalizedFieldData.length > 0 && (
                  <div className="border-b border-border p-4">
                    <div className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Selected Items ({normalizedFieldData.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {normalizedFieldData.map((refId: string) => {
                        let refName = refId
                        if (getReferenceItemName) {
                          refName = getReferenceItemName(refId, fieldKey)
                        } else {
                          refName = referenceItems?.find((r: any) => String(r.id) === refId)?.fieldData?.name || refId
                        }

                        return (
                          <div
                            key={`selected-${refId}`}
                            className="group flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 pl-2.5 pr-1.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20 hover:border-primary/30"
                          >
                            <span className="truncate max-w-[150px]">{refName}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                const nextVal = normalizedFieldData.filter((i: string) => i !== refId)
                                handleMultiReferenceChange(nextVal)
                              }}
                              className="rounded-full p-0.5 text-primary/60 hover:bg-primary/20 hover:text-primary transition-colors focus:outline-none"
                              aria-label={`Remove ${refName}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                  {referenceItems && referenceItems.length > 0 ? (
                    <div className="grid gap-1">
                      {referenceItems.map((refItem: any) => {
                        const refId = String(refItem.id)
                        const refName = refItem.fieldData?.name || refItem.fieldData?.title || refId
                        const isChecked = normalizedFieldData.includes(refId)
                        const checkboxId = `multi-ref-${id}-${fieldKey}-${refId}`

                        return (
                          <div
                            key={refId}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-md px-3 py-2.5 transition-colors",
                              isChecked ? "bg-accent text-accent-foreground" : "hover:bg-muted/50",
                            )}
                            onClick={() => {
                              const nextVal = isChecked
                                ? normalizedFieldData.filter((i: string) => i !== refId)
                                : [...normalizedFieldData, refId]
                              handleMultiReferenceChange(nextVal)
                            }}
                          >
                            <Checkbox
                              id={checkboxId}
                              checked={isChecked}
                              className="mt-0.5"
                              onCheckedChange={(checked) => {
                                const nextVal = checked
                                  ? [...normalizedFieldData, refId]
                                  : normalizedFieldData.filter((i: string) => i !== refId)
                                handleMultiReferenceChange(nextVal)
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1 space-y-0.5">
                              <label htmlFor={checkboxId} className="cursor-pointer text-sm font-medium leading-none">
                                {refName}
                              </label>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No reference items available.
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-border p-4 bg-muted/20">
                  <div className="text-xs text-muted-foreground">
                    {normalizedFieldData.length} item{normalizedFieldData.length !== 1 ? "s" : ""} selected
                  </div>
                  <DialogClose asChild>
                    <Button variant="secondary" className="h-8 px-4 text-xs">
                      Done
                    </Button>
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )
      }

      case "DateTime": {
        const dateValue = typeof value === "string" || typeof value === "number" ? new Date(value) : value instanceof Date ? value : undefined

        return (
          <div className="flex min-w-[200px] flex-col justify-center px-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full justify-start border-transparent bg-transparent px-2 text-left font-normal text-xs text-foreground hover:border-border hover:bg-accent",
                    !dateValue && "text-muted-foreground",
                  )}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  disabled={isUpdating}
                  ref={inputRef as React.RefObject<HTMLButtonElement>}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {dateValue ? format(dateValue, "MMM d, yyyy HH:mm") : <span>Pick date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateValue}
                  onSelect={handleDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )
      }

      case "Color":
        return (
          <div className="flex min-w-[120px] items-center gap-2 px-3 py-1">
            <input
              type="color"
              value={String(value || "#000000")}
              onChange={(e) => updateValueAndHistory(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="h-6 w-6 cursor-pointer border-none bg-transparent p-0 outline-none"
              disabled={isUpdating}
            />
            <input
              type="text"
              className="w-16 flex-1 rounded bg-transparent px-1 py-0.5 text-xs text-foreground border-transparent focus:border-border focus:ring-1 focus:ring-ring focus:outline-none uppercase font-mono"
              value={String(value || "")}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              ref={inputRef as React.RefObject<HTMLInputElement>}
              disabled={isUpdating}
              placeholder="#000000"
            />
          </div>
        )

      case "Number":
        return (
          <input
            className="w-[120px] border-0 bg-transparent px-3 py-2 text-xs text-foreground focus-visible:outline-none"
            type="number"
            value={value === undefined || value === null ? "" : value}
            onChange={handleNumberChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            ref={inputRef as React.RefObject<HTMLInputElement>}
            disabled={isUpdating}
          />
        )

      case "RichText":
        return (
          <div className="flex w-[250px] flex-col px-3 py-2">
            <Dialog
              open={
                activeDialog?.type === "RichText" &&
                activeDialog?.itemId === id &&
                activeDialog?.fieldKey === fieldKey
              }
              onOpenChange={(isOpen) => {
                if (isOpen) {
                  setActiveDialog({ itemId: id, fieldKey, type: "RichText" })
                  setIsFocused(true)
                } else {
                  setActiveDialog(null)
                  setIsFocused(false)
                }
              }}
            >
              <DialogTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "w-full rounded border bg-transparent px-3 py-1.5 text-left text-xs transition-colors focus:outline-none truncate",
                    value
                      ? "border-primary/20 text-foreground hover:border-primary/40 hover:bg-accent"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                  disabled={isUpdating}
                >
                  {value ? stripHtml(String(value)).substring(0, 30) + "..." : "Add rich text..."}
                </button>
              </DialogTrigger>

              <DialogContent className="min-w-[750px] gap-0 rounded-lg border border-border bg-card p-0 text-card-foreground shadow-xl">
                <div className="border-b border-border bg-muted/40 p-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    Edit {fieldDefinition.slug || "Rich Text"}
                  </h2>
                </div>

                <div className="p-0">
                  <RichTextField
                    id={id}
                    fieldData={value || ""}
                    fieldKey={fieldKey}
                    onUpdate={(_id, _key, updatedVal) => {
                      updateValueAndHistory(updatedVal)
                    }}
                  />
                </div>

                <DialogFooter className="flex items-center justify-between border-t border-border bg-muted/20 p-4">
                  <div className="text-xs text-muted-foreground">Changes are saved automatically.</div>
                  <DialogClose asChild>
                    <Button variant="secondary" className="h-8 px-5 text-sm">
                      Done
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )

      case "File":
      case "Image": {
        const fileData = typeof value === "object" && value !== null ? value : { url: value || "" }
        return (
          <div className="flex w-[320px] items-center gap-1 px-3 py-1">
            <input
              type="text"
              className="flex-1 rounded-md border border-transparent bg-transparent px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-border focus:bg-background focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
              value={fileData.url || ""}
              onChange={(e) => {
                const newValue = { ...fileData, url: e.target.value }
                updateValueAndHistory(newValue)
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false)
                if (fileData.id && fileData.url !== originalVideoValue.current) {
                  handleFileOrUrl()
                  originalVideoValue.current = fileData.url
                }
              }}
              placeholder={fieldDefinition.type === "Image" ? "Image URL or Upload..." : "File URL or Upload..."}
              disabled={isUpdating || isUploading}
              ref={inputRef as React.RefObject<HTMLInputElement>}
            />

            <label className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border bg-accent text-accent-foreground hover:bg-accent/80 transition-colors">
              <span className="sr-only">Upload {fieldDefinition.type}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUpdating || isUploading}
                accept={fieldDefinition.type === "Image" ? "image/*" : undefined}
              />
            </label>

            {fileData.url && fieldDefinition.type === "Image" && isImageFile(fileData.url) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowPreview(true)
                  setPreviewIndex(0)
                }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                title="Preview image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            )}

            {showPreview && fileData.url && previewIndex === 0 && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={() => {
                  setShowPreview(false)
                  setPreviewIndex(null)
                }}
              >
                <div
                  className="relative flex flex-col items-center justify-center bg-transparent rounded-lg p-2 max-w-4xl w-full max-h-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative group w-full h-full flex items-center justify-center bg-card/20 rounded-md border border-border/40 overflow-hidden shadow-2xl p-4">
                    <img
                      src={fileData.url}
                      alt="Preview"
                      className="max-h-[80vh] max-w-full object-contain rounded drop-shadow-lg"
                    />
                    <button
                      onClick={() => {
                        setShowPreview(false)
                        setPreviewIndex(null)
                      }}
                      className="absolute top-4 right-4 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors backdrop-blur-md border border-white/10"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="mt-4 text-white/80 text-sm font-medium bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">
                    {fieldDefinition.slug} Preview
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      }

      case "MultiImage": {
        const filesArray = Array.isArray(value) ? value : value ? [value] : []

        return (
          <div className="flex w-[260px] flex-col px-3 py-2">
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "w-full rounded border bg-transparent px-3 py-1.5 text-left text-xs transition-colors focus:outline-none",
                    filesArray.length > 0
                      ? "border-primary text-primary hover:bg-primary/5"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                  disabled={isUpdating || isUploading}
                >
                  {filesArray.length > 0 ? (
                    <span className="font-medium text-primary">Manage {filesArray.length} Images</span>
                  ) : (
                    "Add Images..."
                  )}
                </button>
              </DialogTrigger>

              <DialogContent className="max-w-xl rounded-lg border border-border bg-card p-0 text-card-foreground shadow-lg">
                <div className="border-b border-border bg-muted/40 p-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Manage Multiple Images</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Add, remove, or upload images</p>
                  </div>
                </div>

                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
                  {filesArray.map((fileObj: any, index: number) => {
                    const url = typeof fileObj === "object" && fileObj !== null ? fileObj.url : fileObj
                    return (
                      <div key={index} className="group relative flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3 transition-colors hover:bg-muted/40">
                        {url && isImageFile(url) ? (
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border/50 bg-background/50 flex items-center justify-center cursor-pointer hover:border-primary/50"
                               onClick={() => { setShowPreview(true); setPreviewIndex(index); }}>
                            <img src={url} alt={`Preview ${index}`} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-16 w-16 shrink-0 rounded-md border border-dashed border-border/50 bg-background/50 flex items-center justify-center text-muted-foreground/50">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                              <circle cx="9" cy="9" r="2"></circle>
                              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                            </svg>
                          </div>
                        )}

                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            value={url || ""}
                            onChange={(e) => {
                              const updatedFiles = [...filesArray]
                              updatedFiles[index] = typeof fileObj === "object" && fileObj !== null
                                ? { ...fileObj, url: e.target.value }
                                : e.target.value
                              updateValueAndHistory(updatedFiles)
                            }}
                            onBlur={() => handleUrlBlur(index)}
                            placeholder="Enter image URL..."
                            disabled={isUpdating || isUploading}
                          />
                          <button
                            type="button"
                            onClick={() => removeMultiImageItem(index)}
                            className="flex items-center gap-1.5 text-xs font-medium text-destructive/80 hover:text-destructive transition-colors"
                            disabled={isUpdating || isUploading}
                          >
                            <X className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const updatedFiles = [...filesArray, { url: "" }]
                        updateValueAndHistory(updatedFiles)
                      }}
                      className="flex-1 flex items-center justify-center gap-2 rounded-md border border-dashed border-border py-3 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                      disabled={isUpdating || isUploading}
                    >
                      <Plus className="h-4 w-4" />
                      Add Empty URL
                    </button>
                    
                    <label className="flex-1 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border py-3 text-sm font-medium text-muted-foreground hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-500/5 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      {isUploading ? "Uploading..." : "Upload New File"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleMultiImageUpload}
                        disabled={isUploading || isUpdating}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end border-t border-border p-4 bg-muted/20">
                  <DialogClose asChild>
                    <Button variant="secondary" className="px-6 h-9">
                      Done
                    </Button>
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>

            {showPreview && filesArray[previewIndex!] && (
              <div
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={() => {
                  setShowPreview(false)
                  setPreviewIndex(null)
                }}
              >
                <div className="relative flex flex-col items-center justify-center bg-transparent max-w-5xl w-full max-h-full" onClick={(e) => e.stopPropagation()}>
                  <div className="relative w-full h-full flex items-center justify-center overflow-hidden p-4">
                     <img
                      src={typeof filesArray[previewIndex!] === "object" ? filesArray[previewIndex!].url : filesArray[previewIndex!]}
                      alt={`Preview ${previewIndex}`}
                      className="max-h-[85vh] max-w-full object-contain drop-shadow-2xl"
                    />
                    <button
                      onClick={() => {
                        setShowPreview(false)
                        setPreviewIndex(null)
                      }}
                      className="absolute top-4 right-4 rounded-full bg-black/50 p-2.5 text-white/90 hover:bg-black/80 hover:text-white transition-all backdrop-blur-md"
                    >
                      <X size={20} />
                    </button>
                    
                    {filesArray.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setPreviewIndex(prev => (prev! > 0 ? prev! - 1 : filesArray.length - 1)) }}
                          className="text-white/70 hover:text-white p-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        </button>
                        <span className="text-white/90 text-sm font-medium tabular-nums">{previewIndex! + 1} / {filesArray.length}</span>
                        <button 
                           onClick={(e) => { e.stopPropagation(); setPreviewIndex(prev => (prev! < filesArray.length - 1 ? prev! + 1 : 0)) }}
                          className="text-white/70 hover:text-white p-1"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      }

      case "VideoLink": {
        const linkData = typeof value === "object" && value !== null ? value : { url: value || "" }
        return (
          <div className="flex w-[260px] flex-col px-3 py-1">
            <input
              className="w-full rounded border border-transparent bg-transparent px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-border focus:bg-background focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
              type="text"
              value={linkData.url || ""}
              onChange={(e) => {
                const newValue = { ...linkData, url: e.target.value }
                updateValueAndHistory(newValue)
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              ref={inputRef as React.RefObject<HTMLInputElement>}
              disabled={isUpdating}
              placeholder="https://video.com/..."
            />
          </div>
        )
      }

      case "Option": {
        const options = fieldDefinition.validations?.options || []
        const currentValStr = String(value || "")
        return (
          <div className="flex flex-col min-w-[150px]">
            <Select
              value={currentValStr && currentValStr !== "none" ? currentValStr : "none"}
              onValueChange={handleSelectChange}
              onOpenChange={(open) => setIsFocused(open)}
              disabled={isUpdating}
            >
              <SelectTrigger
                className="h-auto w-full border-0 bg-transparent px-3 py-2 text-xs text-foreground focus:ring-0"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                ref={inputRef as React.RefObject<HTMLButtonElement>}
              >
                <SelectValue placeholder="Select option..." />
              </SelectTrigger>
              <SelectContent className="max-h-[220px] rounded-md border border-border bg-popover text-popover-foreground shadow-md">
                <SelectItem value="none" className="text-xs text-muted-foreground">None (Clear)</SelectItem>
                {options.map((opt: any) => (
                  <SelectItem key={opt.id} value={opt.id} className="text-xs">
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      }

      case "Phone":
        return (
          <input
            className="w-[180px] border-0 bg-transparent px-3 py-2 text-xs text-foreground focus-visible:outline-none"
            type="tel"
            value={typeof value === "object" && value !== null ? JSON.stringify(value) : String(value || "")}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            ref={inputRef as React.RefObject<HTMLInputElement>}
            disabled={isUpdating}
            placeholder="+1 234 567 890"
          />
        )

      case "Email":
        return (
          <input
            className="w-[200px] border-0 bg-transparent px-3 py-2 text-xs text-foreground focus-visible:outline-none"
            type="email"
            value={typeof value === "object" && value !== null ? JSON.stringify(value) : String(value || "")}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            ref={inputRef as React.RefObject<HTMLInputElement>}
            disabled={isUpdating}
            placeholder="user@example.com"
          />
        )

      case "Link": {
        const linkData = typeof value === "object" && value !== null ? value : { url: value || "" }
        return (
          <div className="flex w-[260px] flex-col px-3 py-1">
            <input
              className="w-full rounded border border-transparent bg-transparent px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-border focus:bg-background focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
              type="url"
              value={linkData.url || ""}
              onChange={(e) => {
                const newValue = { ...linkData, url: e.target.value }
                updateValueAndHistory(newValue)
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              ref={inputRef as React.RefObject<HTMLInputElement>}
              disabled={isUpdating}
              placeholder="https://link.com/..."
            />
          </div>
        )
      }

      case "Switch":
        return (
          <div className="flex h-full min-w-[100px] items-center justify-center gap-2 px-3">
            <Switch
              checked={Boolean(value)}
              onCheckedChange={handleCheckboxChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={isUpdating}
            />
            <span className="text-xs text-foreground font-medium w-6 text-center">{value ? "Yes" : "No"}</span>
          </div>
        )

      case "PlainText":
      default:
        if (fieldDefinition?.validations?.singleLine === false) {
          return (
            <div className="flex w-[250px] flex-col px-3 py-2">
              <Dialog
                open={
                  activeDialog?.type === "PlainText" &&
                  activeDialog?.itemId === id &&
                  activeDialog?.fieldKey === fieldKey
                }
                onOpenChange={(isOpen) => {
                  if (isOpen) {
                    setActiveDialog({ itemId: id, fieldKey, type: "PlainText" })
                    setIsFocused(true)
                  } else {
                    setActiveDialog(null)
                    setIsFocused(false)
                  }
                }}
              >
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "w-full rounded border bg-transparent px-3 py-1.5 text-left text-xs transition-colors focus:outline-none truncate",
                      value
                        ? "border-primary/20 text-foreground hover:border-primary/40 hover:bg-accent"
                        : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                    disabled={isUpdating}
                  >
                    {value ? String(value).substring(0, 30) + "..." : "Add text..."}
                  </button>
                </DialogTrigger>

                <DialogContent className="max-w-xl rounded-lg border border-border bg-card p-0 text-card-foreground shadow-xl">
                  <div className="border-b border-border bg-muted/40 p-4">
                    <h2 className="text-lg font-semibold text-foreground">Edit {fieldDefinition.slug || "Text"}</h2>
                  </div>

                  <div className="p-4">
                    <textarea
                      value={String(value || "")}
                      onChange={handleChange}
                      placeholder={`Enter ${fieldDefinition.slug}...`}
                      className="min-h-[250px] w-full resize-y rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      disabled={isUpdating}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/20 p-4">
                    <DialogClose asChild>
                      <Button variant="secondary" className="h-9 px-6">
                        Done
                      </Button>
                    </DialogClose>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )
        }
        return (
          <input
            className="w-full min-w-[200px] border-0 bg-transparent px-3 py-2 text-xs text-foreground focus-visible:outline-none placeholder:text-muted-foreground/50"
            type="text"
            value={typeof value === "object" && value !== null ? JSON.stringify(value) : String(value || "")}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            ref={inputRef as React.RefObject<HTMLInputElement>}
            disabled={isUpdating}
            placeholder={`Enter ${fieldDefinition?.slug || "value"}...`}
          />
        )
    }
  }

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center min-h-[36px] transition-colors duration-150",
        isSelectedForFill && "ring-2 ring-inset ring-primary bg-primary/10",
      )}
      onMouseEnter={() => {
        setIsHovered(true)
        if (onFillHandleMouseEnter) {
          onFillHandleMouseEnter(item.id, fieldKey)
        }
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      {renderInputContent()}

      {!isSystemField && (isFocused || isHovered || isSelectedForFill) && (
        <div
          className="absolute bottom-[-1px] right-[-1px] z-20 h-2.5 w-2.5 cursor-crosshair border border-white bg-primary transition-all hover:h-3.5 hover:w-3.5 shadow-sm rounded-tl-sm"
          onMouseDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
            if (onFillHandleMouseDown) {
              onFillHandleMouseDown(item.id, fieldKey, e)
            }
          }}
          title="Drag to select multiple, or Cmd/Ctrl+Click"
        />
      )}

      {/* Undo/Redo */}
      {!isSystemField && (history.length > 0 || redoStack.length > 0) && (
        <div className="absolute -top-6 right-0 z-30 flex gap-1 rounded-bl-md bg-card border border-border p-0.5 shadow-sm">
          {history.length > 0 && (
            <CustomButton
              onClick={() => {
                if (history.length === 0) return
                const previousValue = history[history.length - 1]
                setHistory((prev) => prev.slice(0, prev.length - 1))
                setRedoStack((prev) => [value, ...prev])
                setValue(previousValue)
                
                ignoreNextFieldDataUpdateRef.current = true 
                onUpdate(id, fieldKey, previousValue)
              }}
              disabled={isUpdating}
              variant={!isUpdating ? "warning" : "ghost"}
              className="p-1 h-auto"
              title="Undo"
              icon={<Undo2 size={11} />}
            />
          )}

          {redoStack.length > 0 && (
            <CustomButton
              onClick={() => {
                if (redoStack.length === 0) return
                const nextValue = redoStack[0]
                setRedoStack((prev) => prev.slice(1))
                setHistory((prev) => [...prev, value])
                setValue(nextValue)
                
                ignoreNextFieldDataUpdateRef.current = true 
                onUpdate(id, fieldKey, nextValue)
              }}
              disabled={isUpdating}
              variant={!isUpdating ? "success" : "ghost"}
              className="p-1 h-auto"
              title="Redo"
              icon={<Redo2 size={11} />}
            />
          )}
        </div>
      )}
    </div>
  )
}