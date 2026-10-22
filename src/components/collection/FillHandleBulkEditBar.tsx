"use client"

import type React from "react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import CustomButton from "@/components/common/Button"
import { CalendarIcon, Plus, Redo2, Undo2, X } from "lucide-react"
import RichTextField from "./RichTextField"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogTrigger } from "../ui/alert-dialog"

interface ReferenceItem {
  id: string
  fieldData: {
    name: string
  }
}

interface OptionItem {
  id: string
  name: string
}

interface FieldDefinition {
  slug: string
  type: string
  validations?: {
    options?: OptionItem[]
    collectionId?: string
    singleLine: boolean
  }
}

interface FillHandleBulkEditBarProps {
  selectedCount: number
  fieldDefinition: FieldDefinition | undefined
  isLoading: boolean
  bulkEditValue: any
  onChange: (value: any) => void
  onApply: () => void
  onCancel: () => void
  referenceItems: ReferenceItem[]
}

const FillHandleBulkEditBar: React.FC<FillHandleBulkEditBarProps> = ({
  selectedCount,
  fieldDefinition,
  isLoading,
  bulkEditValue,
  onChange,
  onApply,
  onCancel,
  referenceItems,
}) => {
  const [history, setHistory] = useState<any[]>([])
  const [redoStack, setRedoStack] = useState<any[]>([])

  const updateValue = (newValue: any) => {
    setHistory((prev) => [...prev, bulkEditValue])
    setRedoStack([])
    onChange(newValue)
  }

  const undo = () => {
    if (history.length === 0) return
    const lastValue = history[history.length - 1]
    setHistory((prev) => prev.slice(0, prev.length - 1))
    setRedoStack((prev) => [bulkEditValue, ...prev])
    onChange(lastValue)
  }

  const redo = () => {
    if (redoStack.length === 0) return
    const nextValue = redoStack[0]
    setRedoStack((prev) => prev.slice(1))
    setHistory((prev) => [...prev, bulkEditValue])
    onChange(nextValue)
  }

  const toggleReference = (refId: string) => {
    const selectedValues = Array.isArray(bulkEditValue) ? bulkEditValue : bulkEditValue ? [bulkEditValue] : []
    let newSelectedValues: any[]
    if (selectedValues.includes(refId)) {
      newSelectedValues = selectedValues.filter((id: string) => id !== refId)
    } else {
      newSelectedValues = [...selectedValues, refId]
    }
    updateValue(newSelectedValues)
  }

  const renderInputField = () => {
    if (!fieldDefinition) return null
    switch (fieldDefinition.type) {
      case "Switch":
        return (
          <div className="flex items-center gap-3 rounded border border-border bg-muted/40 p-2 text-foreground">
            <label className="text-sm">Toggle switch:</label>
            <Switch checked={!!bulkEditValue} onCheckedChange={(checked) => updateValue(checked)} />
            <span className="text-sm font-medium">{bulkEditValue ? "Yes" : "No"}</span>
          </div>
        )
      case "Reference":
        return (
          <div className="flex items-center gap-2 text-foreground">
            <label className="block whitespace-nowrap text-sm font-medium">Select a reference: </label>
            <Select
              value={bulkEditValue === "" ? "none" : bulkEditValue}
              onValueChange={(val) => updateValue(val === "none" ? "" : val)} 
            >
              <SelectTrigger className="border border-input bg-background text-foreground">
                <SelectValue placeholder="Select reference..." />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground">
                <SelectItem value="none">None</SelectItem>
                {referenceItems.map((refItem) => (
                  <SelectItem key={refItem.id} value={refItem.id}>
                    {refItem.fieldData.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case "MultiReference":
        return (
          <div className="flex items-center gap-2 text-foreground">
            <label className="block whitespace-nowrap text-sm font-medium">Selected References:</label>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start border-input bg-accent/40 text-foreground"
                >
                  {Array.isArray(bulkEditValue) && bulkEditValue.length > 0
                    ? `Selected (${bulkEditValue.length})`
                    : "Select references to apply"}
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-lg border border-border bg-card p-0 text-card-foreground">
                <DialogHeader className="border-b border-border px-5 pb-5 pt-8">
                  <DialogTitle className="mb-4 text-foreground">Select References</DialogTitle>
                  {Array.isArray(bulkEditValue) && bulkEditValue.length > 0 && (
                    <div className="!mt-0 flex flex-wrap gap-1">
                      {bulkEditValue.map((refId: string) => {
                        const refItem = referenceItems.find((item) => item.id === refId)
                        return (
                          <div
                            key={refId}
                            className="flex items-center justify-center gap-1 rounded-full border border-border bg-accent/50 px-2 py-1 text-xs font-medium text-foreground"
                          >
                            {refItem?.fieldData.name || refId}
                            <button onClick={() => toggleReference(refId)} className="text-muted-foreground hover:text-foreground">
                              <X size={12} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </DialogHeader>
                <div className="px-5 text-sm font-medium text-foreground">Available References:</div>
                <div className="max-h-[300px] overflow-y-auto px-5">
                  {referenceItems.map((refItem) => {
                    const isChecked = Array.isArray(bulkEditValue) && bulkEditValue.includes(refItem.id)
                    return (
                      <div
                        key={refItem.id}
                        className={`flex cursor-pointer items-center gap-2 px-2 py-2 hover:bg-accent/40 ${
                          isChecked ? "bg-accent/40" : ""
                        }`}
                        onClick={() => toggleReference(refItem.id)}
                      >
                        <Checkbox checked={isChecked} onCheckedChange={() => toggleReference(refItem.id)} />
                        <span className="text-sm font-medium leading-none text-foreground">{refItem.fieldData.name}</span>
                      </div>
                    )
                  })}
                </div>
                <DialogFooter className="flex items-center justify-end gap-2 rounded-b border-t border-border px-3 pb-2 pt-3">
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-8 rounded border border-border bg-secondary text-secondary-foreground"
                    >
                      Close
                    </Button>
                  </DialogClose>
                  <button
                    onClick={onApply}
                    className="rounded bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-1 text-sm font-medium"
                  >
                    {isLoading ? "Applying..." : "Apply to All"}
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )
      case "Option":
        const options = fieldDefinition.validations?.options || []
        const selectedOption = options.find((opt) => opt.id === bulkEditValue)
        const displayValue = selectedOption ? selectedOption.name : "Select..."
        return (
          <div className="flex items-center gap-2 text-foreground">
            <label className="block whitespace-nowrap text-sm font-medium">Select an option:</label>
            <Select value={String(bulkEditValue || "")} onValueChange={(val) => updateValue(val === "none" ? "" : val)}>
              <SelectTrigger className="border border-input bg-background text-foreground">
                <SelectValue placeholder="Select option...">{displayValue}</SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground">
                <SelectItem value="none">None</SelectItem>
                {options.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case "RichText":
        return (
          <div className="flex items-center gap-3 text-foreground">
            <label className="block whitespace-nowrap text-sm font-medium">Update Rich Text Field:</label>
            <Dialog>
              <DialogTrigger>
                <button className="w-full rounded border border-border bg-accent/40 px-3 py-2 text-left text-sm text-foreground hover:bg-accent">
                  Open Rich Text Editor
                </button>
              </DialogTrigger>
              <DialogContent className="min-w-[750px] gap-0 rounded-lg border border-border bg-card p-0 text-card-foreground">
                <RichTextField
                  id={fieldDefinition.slug}
                  fieldData={bulkEditValue || ""}
                  fieldKey={fieldDefinition.slug}
                  onUpdate={(_id, _key, value) => {
                    updateValue(value)
                  }}
                  key={fieldDefinition.slug}
                />
                <DialogFooter className="flex items-center justify-end gap-2 rounded-b bg-card p-3 border-t border-border">
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-8 rounded border border-border bg-secondary text-secondary-foreground"
                    >
                      Close
                    </Button>
                  </DialogClose>
                  <button
                    onClick={onApply}
                    className="rounded bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-1 text-sm font-medium"
                  >
                    {isLoading ? "Applying..." : "Apply to All"}
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )
      case "Color":
        return (
          <div className="flex w-full max-w-[300px] items-center gap-3 rounded border border-border bg-muted/40 p-2 text-foreground">
            <label className="block text-sm font-medium">Pick a color</label>
            <input
              type="color"
              value={bulkEditValue || "#000000"}
              onChange={(e) => updateValue(e.target.value)}
              className="h-6 w-6 cursor-pointer border-none bg-transparent p-0 outline-none"
            />
          </div>
        )
      case "File":
      case "Image": {
        const fileData = typeof bulkEditValue === "object" ? bulkEditValue : { url: bulkEditValue }
        const [isUploading, setIsUploading] = useState(false)
        const [showPreview, setShowPreview] = useState(false)

        const handleFileOrUrl = async (file?: File) => {
          const webflow = (window as any).webflow
          setIsUploading(true)

          try {
            let asset

            if (file) {
              const uploaded = await webflow.createAsset(file)
              const uploadedId = uploaded?.id || uploaded?.[0]?.id

              if (!uploadedId) {
                await webflow.notify({
                  type: "Error",
                  message: "Asset ID not found after upload!",
                })
                return
              }

              const allAssets = await webflow.getAllAssets()
              asset = allAssets.find((a: any) => a.id === uploadedId)
            } else if (fileData.id) {
              const allAssets = await webflow.getAllAssets()
              asset = allAssets.find((a: any) => a.id === fileData.id)
            }

            if (!asset) {
              await webflow.notify({
                type: "Error",
                message: "Asset not found or upload failed!",
              })
              return
            }

            const finalUrl = asset.url || (await asset.getUrl?.())
            updateValue({ id: asset.id, url: finalUrl || "" })

            setShowPreview(true)

            await webflow.notify({
              type: "Success",
              message: "Asset linked successfully!",
            })
          } catch (error) {
            console.error(" Error in bulk handleFileOrUrl:", error)
            const webflow = (window as any).webflow
            await webflow.notify({
              type: "Error",
              message: "Error uploading or linking asset",
            })
          } finally {
            setIsUploading(false)
          }
        }

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const files = e.target.files
          if (!files || files.length === 0) return
          handleFileOrUrl(files[0])
        }

        const handleUrlBlur = async () => {
          if (fileData.id) await handleFileOrUrl()
        }

        return (
          <>
            <div className="flex items-center gap-2 w-[350px] text-foreground">
              <input
                type="text"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                value={fileData.url || ""}
                onChange={(e) => {
                  const newValue = { ...fileData, url: e.target.value }
                  updateValue(newValue)
                }}
                onBlur={handleUrlBlur}
                placeholder="Click Upload or paste an image link here"
                disabled={isUploading}
              />

              <label className="inline-flex items-center mr-3 px-2.5 py-1.5 border border-primary text-primary-foreground bg-primary hover:bg-primary/90 rounded cursor-pointer text-xs font-medium">
                {isUploading ? "Uploading" : "Upload"}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
            </div>

            {showPreview && fileData.url && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className="bg-card border border-border p-4 rounded-lg max-w-[90%] max-h-[80%] flex flex-col items-center shadow-xl">
                  <img
                    src={fileData.url}
                    alt="Preview"
                    className="max-h-[60vh] max-w-[80vw] object-contain mb-4 rounded border border-border"
                  />
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 rounded text-primary-foreground text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </>
        )
      }
      case "MultiImage": {
        const files = Array.isArray(bulkEditValue) ? bulkEditValue : []
        const [isUploading, setIsUploading] = useState(false)

        const handleFileUpload = async (file: File) => {
          setIsUploading(true)
          try {
            const webflow = (window as any).webflow
            const uploaded = await webflow.createAsset(file)
            const uploadedId = uploaded?.id || uploaded?.[0]?.id

            if (!uploadedId) {
              await webflow.notify({
                type: "Error",
                message: "Asset ID not found after upload!",
              })
              return
            }

            const allAssets = await webflow.getAllAssets()
            const asset = allAssets.find((a: any) => a.id === uploadedId)
            if (!asset) {
              await webflow.notify({
                type: "Error",
                message: "Uploaded asset not found!",
              })
              return
            }

            const finalUrl = asset.url || (await asset.getUrl?.())
            const updatedFiles = [...files, { id: asset.id, url: finalUrl }]
            updateValue(updatedFiles)

            await webflow.notify({
              type: "Success",
              message: "Image uploaded successfully!",
            })
          } catch (error) {
            console.error("Upload error:", error)
            const webflow = (window as any).webflow
            await webflow.notify({
              type: "Error",
              message: "Error uploading image",
            })
          } finally {
            setIsUploading(false)
          }
        }

        const handleUrlBlur = async (index: number) => {
          const file = files[index]
          if (file?.id) {
            const webflow = (window as any).webflow
            const allAssets = await webflow.getAllAssets()
            const asset = allAssets.find((a: any) => a.id === file.id)
            if (asset) {
              const finalUrl = asset.url || (await asset.getUrl?.())
              const updatedFiles = [...files]
              updatedFiles[index] = { id: asset.id, url: finalUrl }
              updateValue(updatedFiles)
            }
          }
        }

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0]
          if (file) handleFileUpload(file)
        }

        const removeImage = (index: number) => {
          const updatedFiles = files.filter((_, i) => i !== index)
          updateValue(updatedFiles)
        }

        return (
          <div className="flex items-center gap-3 rounded border border-border bg-muted/40 p-2 text-foreground">
            <label className="block whitespace-nowrap text-sm font-medium">
              Update Multi Image Field:
            </label>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-full rounded border border-border bg-background px-3 py-2 text-left text-sm text-foreground hover:bg-accent">
                  {files.length > 0 ? `Manage Images (${files.length})` : "Add Images"}
                </button>
              </AlertDialogTrigger>

              <AlertDialogContent className="w-full max-w-[600px] gap-0 rounded-lg border border-border bg-card p-0 text-card-foreground">
                <div className="flex flex-col gap-3 border-b border-border p-5">
                  <h2 className="font-inter text-lg font-semibold text-foreground">
                    Manage Multiple Images
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Add, link, or upload images to update this field.
                  </p>
                </div>

                <div className="m-5 max-h-[400px] overflow-y-auto">
                  <div className="flex flex-col gap-3">
                    {files.map((file: any, index: number) => {
                      const url = typeof file === "object" ? file.url : file
                      return (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-none"
                            value={url || ""}
                            onChange={(e) => {
                              const updatedFiles = [...files]
                              updatedFiles[index] =
                                typeof file === "object"
                                  ? { ...file, url: e.target.value }
                                  : e.target.value
                              updateValue(updatedFiles)
                            }}
                            onBlur={() => handleUrlBlur(index)}
                            placeholder="Enter internal asset URL..."
                            disabled={isLoading || isUploading}
                          />

                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="p-1 text-destructive hover:text-destructive/80"
                            disabled={isLoading || isUploading}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )
                    })}

                    <button
                      type="button"
                      onClick={() => updateValue([...files, { url: "" }])}
                      className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-primary hover:border-primary transition-colors"
                      disabled={isLoading || isUploading}
                    >
                      <Plus className="h-4 w-4" />
                      Add Image URL
                    </button>

                    <label className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm cursor-pointer text-emerald-600 dark:text-emerald-400 hover:bg-accent">
                      {isUploading ? "Uploading..." : "Upload New Image"}
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isLoading || isUploading}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 p-5 pt-0">
                  <AlertDialogAction
                    type="button"
                    className="h-8 rounded border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-1"
                  >
                    Close
                  </AlertDialogAction>
                  <button
                    onClick={onApply}
                    className="h-8 rounded bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-1 text-sm font-medium"
                  >
                    {isLoading ? "Applying..." : "Apply to All"}
                  </button>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      }

      case "VideoLink": {
        const linkData = typeof bulkEditValue === "object" ? bulkEditValue : { url: bulkEditValue }
        return (
          <div className="flex w-[500px] items-center gap-3 rounded border border-border bg-muted/40 p-2 text-foreground">
            <label className="block whitespace-nowrap text-sm font-medium">Update Video Link Field:</label>
            <Input
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none"
              type="text"
              value={linkData.url || ""}
              onChange={(e) => {
                const newValue = { ...linkData, url: e.target.value }
                updateValue(newValue)
              }}
              placeholder="https://video.com/..."
            />
          </div>
        )
      }
      case "Link": {
        const linkData = typeof bulkEditValue === "object" ? bulkEditValue : { url: bulkEditValue }
        return (
          <div className="flex w-[500px] items-center gap-3 rounded border border-border bg-muted/40 p-2 text-foreground">
            <label className="block whitespace-nowrap text-sm font-medium">Update Link Field:</label>
            <Input
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none"
              type="text"
              value={linkData.url || ""}
              onChange={(e) => {
                const newValue = { ...linkData, url: e.target.value }
                updateValue(newValue)
              }}
              placeholder="https://link.com/..."
            />
          </div>
        )
      }

      case "DateTime":
        return (
          <div className="flex w-full items-center gap-2 text-foreground">
            <label className="text-nowrap text-sm font-medium">Pick a date & time</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start border-input bg-background text-left font-normal text-foreground",
                    !bulkEditValue && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {bulkEditValue ? format(new Date(bulkEditValue), "yyyy-MM-dd HH:mm") : "Pick a date & time"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto space-y-2 border border-border bg-popover p-4 text-popover-foreground">
                <Calendar
                  mode="single"
                  selected={bulkEditValue ? new Date(bulkEditValue) : undefined}
                  onSelect={(selectedDate) => {
                    if (!selectedDate) return
                    const currentTime = bulkEditValue ? new Date(bulkEditValue) : new Date()
                    const updatedDate = new Date(
                      selectedDate.getFullYear(),
                      selectedDate.getMonth(),
                      selectedDate.getDate(),
                      currentTime.getHours(),
                      currentTime.getMinutes(),
                    )
                    updateValue(updatedDate.toISOString())
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )
      case "PlainText":
        if (fieldDefinition.validations?.singleLine === false) {
          return (
            <div className="flex items-center gap-3 rounded border border-border bg-muted/40 p-2 text-foreground">
              <label className="block whitespace-nowrap text-sm font-medium">Update Multi Line Text Field:</label>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="w-full rounded border border-border bg-background px-3 py-2 text-left text-sm text-foreground hover:bg-accent">
                    Add Description
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-full max-w-[600px] gap-0 rounded-lg border border-border bg-card p-0 text-card-foreground">
                  <div className="flex flex-col gap-3 border-b border-border p-5">
                    <h2 className="font-inter text-lg font-semibold text-foreground">Selected Description</h2>
                  </div>
                  <div className="m-5">
                    <textarea
                      value={bulkEditValue}
                      onChange={(e) => updateValue(e.target.value)}
                      placeholder={`Enter value for all ${fieldDefinition.slug} fields`}
                      className="h-[300px] w-full flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-none"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 p-5 pt-0">
                    <AlertDialogAction
                      type="button"
                      className="h-8 rounded border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-1"
                    >
                      Close
                    </AlertDialogAction>
                    <button
                      onClick={onApply}
                      className="h-8 rounded bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-1 text-sm font-medium"
                    >
                      {isLoading ? "Applying..." : "Apply to All"}
                    </button>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )
        } else {
          return (
            <Input
              type="text"
              placeholder="Enter value to apply"
              value={bulkEditValue}
              onChange={(e) => updateValue(e.target.value)}
              className="w-64 border-input bg-background text-foreground"
            />
          )
        }
      default:
        return (
          <div className="flex items-center gap-3 text-foreground">
            <label className="block whitespace-nowrap text-sm font-medium">Update Items</label>
            <Input
              type="text"
              placeholder="Enter value to apply"
              value={bulkEditValue}
              onChange={(e) => updateValue(e.target.value)}
              className="w-64 border-input bg-background text-foreground"
            />
          </div>
        )
    }
  }

  return (
    <div className="absolute bottom-[56px] z-50 flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-card-foreground">
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-foreground">
          You’ve selected <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedCount}</span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        {renderInputField()}
        <CustomButton
          onClick={undo}
          disabled={history.length === 0}
          variant={history.length > 0 ? "warning" : "ghost"}
          className="p-1"
          title="Undo"
          icon={<Undo2 size={12} />}
        />
        <CustomButton
          onClick={redo}
          disabled={redoStack.length === 0}
          variant={redoStack.length > 0 ? "success" : "ghost"}
          className="p-1"
          title="Redo"
          icon={<Redo2 size={12} />}
        />
        <CustomButton
          onClick={onApply}
          disabled={isLoading}
          variant="primary"
          className="px-4 py-1"
          loading={isLoading}
          loadingText="Saving..."
        >
          Apply
        </CustomButton>
        <CustomButton onClick={onCancel} variant="secondary" className="px-4 py-1">
          Cancel
        </CustomButton>
      </div>
    </div>
  )
}

export default FillHandleBulkEditBar