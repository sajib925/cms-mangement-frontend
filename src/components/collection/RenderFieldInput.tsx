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
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "../ui/dialog"

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
  isSelectedForFill?: boolean
  isFillHandleActive?: boolean
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
    // ---------------- SYSTEM FIELDS (READ ONLY) ----------------
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
      // ---------------- REFERENCE FIELD ----------------
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

      // ---------------- MULTI-REFERENCE FIELD ----------------
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
                activeDialog?.itemId === item.id &&
                activeDialog?.fieldKey === fieldKey
              }
              onOpenChange={(open) => {
                if (open) {
                  setActiveDialog({ itemId: item.id, fieldKey, type: "MultiReference" })
                } else {
                  setActiveDialog(null)
                }
              }}
            >
              <DialogTrigger asChild>
                <CustomButton
                  variant="ghost"
                  className="h-auto w-full justify-start p-0 text-left text-xs text-foreground hover:bg-transparent"
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  ref={inputRef as React.RefObject<HTMLButtonElement>}
                  disabled={isUpdating}
                >
                  {normalizedFieldData.length > 0 ? (
                    <div className="flex max-h-[100px] flex-wrap items-center gap-1.5 overflow-y-auto">
                      {normalizedFieldData.map((refId: string) => {
                        const refName = getReferenceItemName
                          ? getReferenceItemName(refId, fieldKey)
                          : referenceItems.find((item: any) => String(item.id) === String(refId))?.fieldData?.name || refId
                        return (
                          <div
                            key={refId}
                            className="whitespace-nowrap rounded border border-border bg-muted/60 px-2 py-0.5 text-xs text-foreground"
                          >
                            {refName}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Select multi-references...</span>
                  )}
                </CustomButton>
              </DialogTrigger>
              <DialogContent className="rounded-lg border border-border bg-card p-5 text-card-foreground">
                <div className="space-y-3">
                  <div className="text-sm font-medium text-foreground">Selected References:</div>
                  <div className="flex flex-wrap gap-1">
                    {normalizedFieldData.length > 0 ? (
                      normalizedFieldData.map((refId: string) => {
                        const refName = getReferenceItemName
                          ? getReferenceItemName(refId, fieldKey)
                          : referenceItems.find((item: any) => String(item.id) === String(refId))?.fieldData?.name || refId
                        return (
                          <div
                            key={refId}
                            className="flex items-center gap-1 rounded-full border border-border bg-accent/50 px-2 py-1 text-xs text-foreground"
                          >
                            <CustomButton
                              onClick={() => {
                                const newValue = normalizedFieldData.filter((id: string) => id !== refId)
                                handleMultiReferenceChange(newValue)
                              }}
                              variant="ghost"
                              className="h-auto p-0 text-muted-foreground hover:text-foreground"
                              icon={<X className="h-3 w-3" />}
                            />
                            {refName}
                          </div>
                        )
                      })
                    ) : (
                      <span className="text-xs text-muted-foreground">No items selected</span>
                    )}
                  </div>
                </div>
                <div className="border-b border-border my-2"></div>
                <div>
                  <div className="mb-2 text-xs font-medium text-foreground">Available References:</div>
                  <div className="max-h-[200px] overflow-y-auto space-y-1">
                    {referenceItems && referenceItems.length > 0 ? (
                      referenceItems.map((refItem: any) => {
                        const refItemIdStr = String(refItem.id)
                        const isSelected = normalizedFieldData.includes(refItemIdStr)
                        const itemName = refItem.fieldData?.name || refItem.fieldData?.title || refItem.id
                        return (
                          <div
                            key={refItem.id}
                            className={cn(
                              "flex cursor-pointer items-center gap-2 px-2 py-1.5 hover:bg-accent/40 rounded transition-colors",
                              isSelected ? "bg-accent/40" : "",
                            )}
                            onClick={() => {
                              let newValue
                              if (isSelected) {
                                newValue = normalizedFieldData.filter((id: string) => id !== refItemIdStr)
                              } else {
                                newValue = [...normalizedFieldData, refItemIdStr]
                              }
                              handleMultiReferenceChange(newValue)
                            }}
                          >
                            <Checkbox checked={isSelected} onCheckedChange={() => {}} />
                            <span className="text-xs text-foreground">{itemName}</span>
                          </div>
                        )
                      })
                    ) : (
                      <div className="py-4 text-center text-xs text-muted-foreground">
                        No items found in this referenced collection.
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="secondary" className="h-8 rounded border border-border px-3 text-xs">
                        Close
                      </Button>
                    </DialogClose>
                    <Button
                      onClick={handleSaveAll}
                      disabled={editedItemsCount === 0 || isUpdating}
                      className="h-8 bg-primary text-primary-foreground hover:bg-primary/90 px-4 text-xs font-medium rounded"
                    >
                      {isUpdating ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )
      }

      case "DateTime":
        return (
          <div className="relative w-[200px]">
            <Popover onOpenChange={(open) => setIsFocused(open)}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start border-0 bg-transparent px-3 text-left text-xs font-normal text-foreground",
                    !value && "text-muted-foreground",
                  )}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  ref={inputRef as React.RefObject<HTMLButtonElement>}
                  disabled={isUpdating}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  {value ? format(new Date(value), "yyyy-MM-dd HH:mm") : "Pick a date & time"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto space-y-2 rounded-md border border-border bg-popover p-4 text-popover-foreground">
                <Calendar
                  mode="single"
                  selected={
                    value
                      ? typeof value === "string" || typeof value === "number"
                        ? new Date(value)
                        : value instanceof Date
                          ? value
                          : undefined
                      : undefined
                  }
                  onSelect={handleDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )

      case "Switch":
        return (
          <div className="flex h-full items-center justify-center gap-2 px-3">
            <Switch
              checked={Boolean(value)}
              onCheckedChange={handleCheckboxChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={isUpdating}
            />
            <span className="text-xs text-foreground font-medium">{value ? "Yes" : "No"}</span>
          </div>
        )

      case "Color":
        return (
          <div className="flex h-full items-center px-2">
            <input
              type="color"
              value={value || "#000000"}
              onChange={handleChange}
              className="h-5 w-5 cursor-pointer rounded-full bg-transparent border-none p-0"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              ref={inputRef as React.RefObject<HTMLInputElement>}
              disabled={isUpdating}
            />
            <input
              className="w-[100px] flex-1 border-0 bg-transparent px-2 py-1 text-xs text-foreground focus-visible:outline-none"
              type="text"
              value={value || ""}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={isUpdating}
            />
          </div>
        )

      case "Number":
        return (
          <input
            className="w-full border-0 bg-transparent px-3 py-2 text-xs text-foreground focus-visible:outline-none"
            type="number"
            value={value || ""}
            onChange={handleNumberChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            ref={inputRef as React.RefObject<HTMLInputElement>}
            disabled={isUpdating}
          />
        )

      case "RichText":
        return (
          <AlertDialog
            open={
              activeDialog?.type === "RichText" &&
              activeDialog?.itemId === item.id &&
              activeDialog?.fieldKey === fieldKey
            }
            onOpenChange={(open) => {
              if (open) {
                setActiveDialog({ itemId: item.id, fieldKey, type: "RichText" })
              } else {
                setActiveDialog(null)
              }
            }}
          >
            <AlertDialogTrigger asChild>
              <CustomButton
                variant="ghost"
                className="h-auto w-[280px] justify-start rounded-none bg-transparent px-3 py-2 text-left text-xs text-foreground hover:bg-transparent"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                ref={inputRef as React.RefObject<HTMLButtonElement>}
                disabled={isUpdating}
              >
                {value ? (
                  <div>
                    {typeof value === "string" ? stripHtml(value).substring(0, 30) : "Rich content..."}
                  </div>
                ) : (
                  <span className="text-muted-foreground">Edit content...</span>
                )}
              </CustomButton>
            </AlertDialogTrigger>
            <AlertDialogContent className="min-w-[750px] gap-0 rounded-lg border border-border bg-card p-0 text-card-foreground">
              <div className="relative">
                <RichTextField id={id} fieldData={value || ""} fieldKey={fieldKey} onUpdate={onUpdate} key={fieldKey} />
              </div>
              <div className="flex items-center justify-end gap-2 p-3 border-t border-border">
                <AlertDialogAction
                  type="button"
                  className="h-8 rounded border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 text-xs"
                >
                  Close
                </AlertDialogAction>
                <Button
                  onClick={handleSaveAll}
                  disabled={editedItemsCount === 0 || isUpdating}
                  className="h-8 bg-primary text-primary-foreground hover:bg-primary/90 px-4 text-xs font-medium rounded"
                >
                  {isUpdating ? "Saving...." : "Save"}
                </Button>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        )

      // ---------------- FILE FIELD ----------------
      case "File": {
        const fileData = typeof value === "object" && value !== null ? value : { url: value || "" }
        return (
          <div className="flex items-center gap-2 w-[350px] px-2 py-1">
            <input
              type="text"
              className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              value={fileData.url || ""}
              onChange={(e) => updateValueAndHistory({ ...fileData, url: e.target.value })}
              placeholder="Click Upload or paste file link here"
              disabled={isUpdating || isUploading}
            />

            <label className="inline-flex items-center px-2.5 py-1 border border-primary text-primary-foreground bg-primary hover:bg-primary/90 rounded cursor-pointer text-xs font-medium">
              {isUploading ? "Uploading" : "Upload"}
              <input type="file" className="hidden" onChange={handleFileChange} disabled={isUpdating || isUploading} />
            </label>
          </div>
        )
      }

      // ---------------- IMAGE FIELD ----------------
      case "Image": {
        const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

            const finalUrl = asset?.url || (await asset?.getUrl?.())
            updateValueAndHistory({ id: asset?.id || uploadedId, url: finalUrl || "" })
            await webflow?.notify?.({ type: "Success", message: "Image uploaded successfully!" })
            setShowPreview(isImageFile(finalUrl || ""))
          } catch (error) {
            const webflow = (window as any).webflow
            webflow?.notify?.({ type: "Error", message: "Error uploading image" })
          } finally {
            setIsUploading(false)
            e.target.value = ""
          }
        }

        const imageFileData = typeof value === "object" && value !== null ? value : { url: value || "" }

        return (
          <>
            <div className="flex items-center gap-2 w-[350px] px-2 py-1">
              {imageFileData.url && (
                <img
                  src={imageFileData.url}
                  alt="Thumbnail"
                  className="size-7 rounded object-cover border border-border shrink-0 cursor-pointer"
                  onClick={() => setShowPreview(true)}
                />
              )}
              <input
                type="text"
                className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                value={imageFileData.url || ""}
                onChange={(e) => {
                  const newValue = { ...imageFileData, url: e.target.value }
                  updateValueAndHistory(newValue)
                  setShowPreview(isImageFile(e.target.value))
                }}
                placeholder="Click Upload or paste image link here"
                onFocus={() => setIsFocused(true)}
                ref={inputRef as React.RefObject<HTMLInputElement>}
                disabled={isUpdating || isUploading}
              />

              <label className="inline-flex items-center px-2.5 py-1 border border-primary text-primary-foreground bg-primary hover:bg-primary/90 rounded cursor-pointer text-xs font-medium shrink-0">
                {isUploading ? "Uploading" : "Upload"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isUpdating || isUploading}
                />
              </label>
            </div>

            {showPreview && imageFileData.url && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className="bg-card border border-border p-4 rounded-lg max-w-[90%] max-h-[80%] flex flex-col items-center shadow-xl">
                  <img
                    src={imageFileData.url || "/placeholder.svg"}
                    alt="Preview"
                    className="max-h-[60vh] max-w-[80vw] object-contain mb-4 rounded border border-border"
                  />
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-xs font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </>
        )
      }

      // ---------------- MULTI-IMAGE FIELD ----------------
      case "MultiImage": {
        const files = Array.isArray(value) ? value.filter(Boolean) : []

        return (
          <div className="flex flex-col gap-2 px-3 py-2 min-w-[320px]">
            {files.map((file: any, index: number) => {
              const imageUrl = typeof file === "string" ? file : file?.url || ""
              return (
                <div key={index} className="flex items-center gap-2">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={`Multi-image ${index}`}
                      className="size-7 rounded object-cover border border-border shrink-0 cursor-pointer"
                      onClick={() => setPreviewIndex(index)}
                    />
                  )}
                  <input
                    type="text"
                    className="flex-1 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                    value={imageUrl}
                    onChange={(e) => {
                      const updatedFiles = [...files]
                      updatedFiles[index] = typeof file === "object" && file !== null ? { ...file, url: e.target.value } : e.target.value
                      updateValueAndHistory(updatedFiles)
                    }}
                    onBlur={() => handleUrlBlur(index)}
                    placeholder="Asset URL"
                    onFocus={() => setIsFocused(true)}
                    disabled={isUpdating || isUploading}
                  />

                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewIndex(index)}
                      className="text-xs text-primary underline shrink-0"
                    >
                      View
                    </button>
                  )}

                  <CustomButton
                    type="button"
                    onClick={() => removeMultiImageItem(index)}
                    variant="ghost"
                    className="h-auto p-1 text-xs text-destructive hover:text-destructive/80 shrink-0"
                    disabled={isUpdating}
                    icon={<X className="h-3.5 w-3.5" />}
                  />
                </div>
              )
            })}

            <div className="flex items-center gap-2 pt-1">
              <label className="inline-flex items-center px-2.5 py-1 border border-primary text-primary-foreground bg-primary hover:bg-primary/90 rounded cursor-pointer text-xs font-medium shrink-0">
                {isUploading ? "Uploading..." : "Upload Image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleMultiImageUpload}
                  disabled={isUpdating || isUploading}
                />
              </label>

              <CustomButton
                type="button"
                onClick={() => updateValueAndHistory([...files, { url: "" }])}
                variant="ghost"
                className="flex h-auto items-center justify-end gap-1 py-1 px-2 text-xs text-primary whitespace-nowrap"
                disabled={isUpdating}
                icon={<Plus className="h-3.5 w-3.5" />}
                iconPosition="left"
              >
                Add URL Box
              </CustomButton>
            </div>

            {previewIndex !== null && files[previewIndex] && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className="bg-card border border-border p-4 rounded-lg max-w-[90%] max-h-[80%] flex flex-col items-center shadow-xl">
                  <img
                    src={typeof files[previewIndex] === "string" ? files[previewIndex] : files[previewIndex]?.url || "/placeholder.svg"}
                    alt="Preview"
                    className="max-h-[60vh] max-w-[80vw] object-contain mb-4 rounded border border-border"
                  />
                  <button
                    onClick={() => setPreviewIndex(null)}
                    className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-xs font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      }

      // ---------------- VIDEO LINK FIELD ----------------
      case "VideoLink": {
        const linkData = typeof value === "object" && value !== null ? value : { url: value || "" }

        return (
          <input
            className="w-[320px] border-0 bg-transparent px-3 py-2 text-xs text-foreground focus-visible:outline-none"
            type="text"
            value={linkData.url || ""}
            placeholder="https://www.youtube.com/watch?v=..."
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            ref={inputRef as React.RefObject<HTMLInputElement>}
            disabled={isUpdating}
          />
        )
      }

      case "Option": {
        const options = fieldDefinition.validations?.options || []
        const selectedOption = options.find((opt: any) => opt.id === value)
        const displayValue = selectedOption ? selectedOption.name : "Select..."
        return (
          <div className="flex flex-col">
            <Select
              value={value && value !== "none" ? String(value) : "none"}
              onValueChange={handleSelectChange}
              onOpenChange={(open) => setIsFocused(open)}
              disabled={isUpdating}
            >
              <SelectTrigger
                className="h-auto w-[200px] border-0 bg-transparent px-3 py-2 text-xs text-foreground"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                ref={inputRef as React.RefObject<HTMLButtonElement>}
              >
                <SelectValue placeholder="Select an option">{displayValue}</SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[200px] rounded-md border border-border bg-popover text-popover-foreground">
                <SelectItem value="none">None</SelectItem>
                {options.map((option: any) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      }

      case "Phone":
      case "Email":
        return (
          <input
            className="w-[200px] border-0 bg-transparent px-3 py-2 text-xs text-foreground focus-visible:outline-none"
            type="text"
            value={typeof value === "object" && value !== null ? JSON.stringify(value) : String(value || "")}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            ref={inputRef as React.RefObject<HTMLInputElement>}
            disabled={isUpdating}
          />
        )

      // ---------------- LINK FIELD ----------------
      case "Link": {
        const linkDataValue = typeof value === "object" && value !== null ? value : { url: value || "" }

        return (
          <input
            className="w-[320px] border-0 bg-transparent px-3 py-2 text-xs text-foreground focus-visible:outline-none"
            type="text"
            value={linkDataValue.url || ""}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            ref={inputRef as React.RefObject<HTMLInputElement>}
            disabled={isUpdating}
          />
        )
      }

      case "PlainText":
        if (fieldDefinition.validations?.singleLine === false) {
          return (
            <Dialog
              open={
                activeDialog?.type === "PlainText" &&
                activeDialog?.itemId === item.id &&
                activeDialog?.fieldKey === fieldKey
              }
              onOpenChange={(open) => {
                if (open) {
                  setActiveDialog({ itemId: item.id, fieldKey, type: "PlainText" })
                } else {
                  setActiveDialog(null)
                }
              }}
            >
              <DialogTrigger asChild>
                <CustomButton
                  variant="ghost"
                  className="h-auto w-[280px] justify-start rounded-none bg-transparent px-3 py-2 text-left text-xs text-foreground hover:bg-transparent"
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  ref={inputRef as React.RefObject<HTMLButtonElement>}
                  disabled={isUpdating}
                >
                  {value ? (
                    <div>
                      {typeof value === "object" && value !== null
                        ? JSON.stringify(value).slice(0, 30)
                        : String(value || "").slice(0, 30)}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Add Description...</span>
                  )}
                </CustomButton>
              </DialogTrigger>
              <DialogContent className="w-full max-w-[600px] gap-0 rounded-lg border border-border bg-card p-0 text-card-foreground">
                <div className="flex flex-col gap-3 border-b border-border p-5">
                  <h2 className="font-inter text-lg font-semibold text-foreground">Selected Description</h2>
                </div>
                <div className="m-5">
                  <textarea
                    value={typeof value === "object" && value !== null ? JSON.stringify(value) : String(value || "")}
                    onChange={handleChange}
                    placeholder={`Enter value for ${fieldDefinition.slug}`}
                    className="h-[300px] w-full flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus-visible:outline-none"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    disabled={isUpdating}
                  />
                </div>
                <div className="flex items-center justify-end gap-2 p-3 border-t border-border">
                  <DialogClose asChild>
                    <Button type="button" variant="secondary" className="h-8 rounded border border-border px-3 text-xs">
                      Close
                    </Button>
                  </DialogClose>
                  <Button
                    onClick={handleSaveAll}
                    disabled={editedItemsCount === 0 || isUpdating}
                    className="h-8 bg-primary text-primary-foreground hover:bg-primary/90 px-4 text-xs font-medium rounded"
                  >
                    {isUpdating ? "Saving..." : "Save"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )
        } else {
          return (
            <input
              type="text"
              value={typeof value === "object" && value !== null ? JSON.stringify(value) : String(value || "")}
              onChange={handleChange}
              placeholder={`Enter value`}
              className="flex-1 border-0 bg-transparent px-3 py-1 text-xs text-foreground focus-visible:outline-none"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              ref={inputRef as React.RefObject<HTMLInputElement>}
              disabled={isUpdating}
            />
          )
        }
      default:
        return (
          <input
            className="w-full border-0 bg-transparent px-3 py-2 text-xs text-foreground focus-visible:outline-none"
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
  }

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center min-h-[36px]",
        isSelectedForFill && "ring-2 ring-primary bg-primary/10",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {renderInputContent()}

      {!isSystemField && (isFocused || isHovered) && onFillHandleMouseDown && (
        <div
          className="absolute bottom-0 right-0 z-20 h-2 w-2 cursor-crosshair bg-primary transition-all hover:h-3 hover:w-3"
          onMouseDown={(e) => onFillHandleMouseDown(item.id, fieldKey, e)}
          title="Drag to fill"
        />
      )}

      {!isSystemField && (history.length > 0 || redoStack.length > 0) && (
        <div className="absolute -top-6 right-0 z-30 flex gap-1 rounded-bl-md bg-card border border-border p-0.5 shadow-sm">
          <CustomButton
            onClick={handleUndo}
            disabled={history.length === 0 || isUpdating}
            variant={history.length > 0 && !isUpdating ? "warning" : "ghost"}
            className="p-1 h-auto"
            title="Undo"
            icon={<Undo2 size={11} />}
          />
          <CustomButton
            onClick={handleRedo}
            disabled={redoStack.length === 0 || isUpdating}
            variant={redoStack.length > 0 && !isUpdating ? "success" : "ghost"}
            className="p-1 h-auto"
            title="Redo"
            icon={<Redo2 size={11} />}
          />
        </div>
      )}
    </div>
  )
}