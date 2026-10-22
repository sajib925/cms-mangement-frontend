"use client"

import type { FieldDefinition, Item } from "@/types"
import { CalendarIcon, ClosedCaptionIcon, Plus } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Calendar } from "../ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import RichTextField from "./RichTextField"
import { Checkbox } from "../ui/checkbox"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogTrigger } from "../ui/alert-dialog"
import CustomButton from "@/components/common/Button"
import { useState } from "react"
import { Switch } from "../ui/switch"

interface BulkEditFieldProps {
  fieldDefinition: FieldDefinition | undefined
  bulkEditValue: any
  isUpdating: boolean | undefined
  setBulkEditValue: (value: any) => void
  handleBulkColumnUpdate: (value: any) => void
  referenceItems: Item[]
}

const BulkEditField = ({
  fieldDefinition,
  bulkEditValue,
  setBulkEditValue,
  referenceItems,
  isUpdating,
  handleBulkColumnUpdate,
}: BulkEditFieldProps) => {
  if (!fieldDefinition) return null

  const toggleReference = (refId: string) => {
    const selectedValues = Array.isArray(bulkEditValue) ? bulkEditValue : bulkEditValue ? [bulkEditValue] : []
    if (selectedValues.includes(refId)) {
      setBulkEditValue(selectedValues.filter((id: string) => id !== refId))
    } else {
      setBulkEditValue([...selectedValues, refId])
    }
  }

  switch (fieldDefinition.type) {
    case "Reference":
      return (
        <div className="flex-1">
          <div className="flex items-center gap-2 text-foreground">
            <label className="block whitespace-nowrap text-sm font-medium">Select a reference</label>
            <Select
              value={bulkEditValue === "" ? "none" : bulkEditValue}
              onValueChange={(val) => setBulkEditValue(val === "none" ? "" : val)}
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
        </div>
      )

    case "MultiReference":
      return (
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start bg-accent/40 text-foreground">
                  {bulkEditValue.length > 0 ? `Selected (${bulkEditValue.length})` : "Select references to apply"}
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-lg border border-border bg-card p-0 text-card-foreground">
                <DialogHeader className="border-b border-border px-5 pb-5 pt-8">
                  <DialogTitle className="mb-4 text-foreground">Select References</DialogTitle>
                  {bulkEditValue.length > 0 && (
                    <div className="!mt-0 flex flex-wrap gap-1">
                      {bulkEditValue.map((refId: string) => {
                        const refItem = referenceItems.find((item) => item.id === refId)
                        return (
                          <div
                            key={refId}
                            className="flex items-center justify-center gap-1 rounded-full border border-border bg-accent/50 px-2 py-1 text-xs font-medium text-foreground"
                          >
                            {refItem?.fieldData.name || refId}
                            <CustomButton
                              onClick={() => toggleReference(refId)}
                              variant="ghost"
                              className="h-auto p-0 text-muted-foreground hover:text-foreground"
                              icon={<ClosedCaptionIcon />}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </DialogHeader>
                <div className="px-5 text-sm font-medium text-foreground">Available References:</div>
                <div className="max-h-[300px] overflow-y-auto px-5">
                  {referenceItems.map((refItem) => {
                    const isChecked = bulkEditValue.includes(refItem.id)
                    const checkboxId = `multiref-${refItem.id}`
                    return (
                      <div
                        key={refItem.id}
                        id={checkboxId}
                        className={`flex cursor-pointer items-center gap-2 px-2 py-2 hover:bg-accent/40 ${isChecked ? "bg-accent/40" : ""}`}
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
                  <CustomButton
                    onClick={handleBulkColumnUpdate}
                    variant="primary"
                    className="px-2.5 py-1"
                    loading={isUpdating}
                    loadingText="Applying..."
                  >
                    Apply to All
                  </CustomButton>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )

    case "Option":
      const options = fieldDefinition.validations?.options || []
      const selectedOption = options.find((opt: any) => opt.id === bulkEditValue)
      const displayValue = selectedOption ? selectedOption.name : "Select..."

      return (
        <div className="flex-1">
          <div className="flex items-center gap-2 text-foreground">
            <label className="block whitespace-nowrap text-sm font-medium">Select an option</label>
            <Select
              value={String(bulkEditValue || "")}
              onValueChange={(val) => setBulkEditValue(val === "none" ? "" : val)}
            >
              <SelectTrigger className="border border-input bg-background text-foreground">
                <SelectValue placeholder="Select option...">{displayValue}</SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground">
                <SelectItem value="none">None</SelectItem>
                {options.map((option: any) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )

    case "File":
    case "Image": {
      const fileData =
        typeof bulkEditValue === "object" ? bulkEditValue : { url: bulkEditValue }

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
              message: "Asset not found!",
            })
            return
          }

          const finalUrl = asset.url || (await asset.getUrl?.())

          setBulkEditValue({ id: asset.id, url: finalUrl || "" })
          setShowPreview(true)

          await webflow.notify({
            type: "Success",
            message: "Asset linked successfully!",
          })
        } catch (error) {
          console.error("Bulk File/Image Error:", error)

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
        const f = e.target.files?.[0]
        if (f) handleFileOrUrl(f)
      }

      const handleUrlBlur = () => {
        if (fileData.id) handleFileOrUrl()
      }

      return (
        <>
          <div className="flex items-center gap-2 w-[350px] text-foreground">
            <input
              type="text"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              value={fileData.url || ""}
              onChange={(e) =>
                setBulkEditValue({ ...fileData, url: e.target.value })
              }
              onBlur={handleUrlBlur}
              placeholder="Click Upload or paste an image link here"
              disabled={isUploading}
            />

            <label className="inline-flex items-center px-2.5 py-1.5 border border-primary text-primary-foreground bg-primary hover:bg-primary/90 rounded cursor-pointer text-xs font-medium transition-colors">
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

      const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const selectedFiles = e.target.files
        if (!selectedFiles || selectedFiles.length === 0) return

        const file = selectedFiles[0]
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

          const updatedFiles = [...files]
          updatedFiles[index] = { id: asset.id, url: finalUrl }
          setBulkEditValue(updatedFiles)

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

      return (
        <div className="flex-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="w-full rounded border border-border bg-background px-3 py-2 text-left text-sm text-foreground hover:bg-accent"
                disabled={isUpdating || isUploading}
              >
                <span>{files.length > 0 ? `Manage Images (${files.length})` : "Add Images..."}</span>
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent className="w-full max-w-[600px] gap-0 rounded-lg border border-border bg-card p-0 text-card-foreground">
              <div className="flex flex-col gap-3 border-b border-border p-5">
                <h2 className="font-inter text-lg font-semibold text-foreground">Manage Multiple Images</h2>
                <p className="text-sm text-muted-foreground">Add, remove, or upload images</p>
              </div>

              <div className="m-5 max-h-[400px] overflow-y-auto">
                <div className="flex flex-col gap-3">
                  {files.map((file: any, index: number) => {
                    const url = typeof file === "object" ? file.url : file
                    const hasInternalId = typeof file === "object" && file.id

                    return (
                      <div key={index} className="flex flex-col gap-2 rounded bg-muted/40 p-3 border border-border">
                        <input
                          type="text"
                          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-none"
                          value={url || ""}
                          onChange={(e) => {
                            const updatedFiles = [...files]
                            updatedFiles[index] =
                              typeof file === "object" ? { ...file, url: e.target.value } : e.target.value
                            setBulkEditValue(updatedFiles)
                          }}
                          placeholder="Enter internal Webflow asset link"
                          disabled={isUpdating || isUploading}
                        />

                        {!hasInternalId && (
                          <label className="flex cursor-pointer items-center justify-center rounded-md border border-dashed border-border px-3 py-2 text-sm text-primary hover:border-primary">
                            {isUploading ? "Uploading..." : "Upload Local File"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, index)}
                              disabled={isUploading || isUpdating}
                            />
                          </label>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            const updatedFiles = files.filter((_: any, i: number) => i !== index)
                            setBulkEditValue(updatedFiles)
                          }}
                          className="mt-1 flex items-center gap-2 text-xs font-medium text-destructive hover:text-destructive/80"
                          disabled={isUpdating || isUploading}
                        >
                          Remove
                        </button>
                      </div>
                    )
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      const updatedFiles = [...files, { url: "" }]
                      setBulkEditValue(updatedFiles)
                    }}
                    className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-primary hover:border-primary transition-colors"
                    disabled={isUpdating || isUploading}
                  >
                    <Plus className="h-4 w-4" />
                    Add Image
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 p-5 pt-0">
                <AlertDialogAction
                  type="button"
                  className="h-8 rounded border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-1"
                >
                  Close
                </AlertDialogAction>

                <CustomButton
                  onClick={handleBulkColumnUpdate}
                  variant="primary"
                  className="h-8 py-1 px-4"
                  loading={isUpdating}
                  loadingText="Applying..."
                >
                  Apply to All
                </CustomButton>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )
    }
    case "VideoLink": {
      const linkData = typeof bulkEditValue === "object" ? bulkEditValue : { url: bulkEditValue }
      return (
        <div className="flex-1">
          <input
            className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
            type="text"
            value={linkData.url || ""}
            onChange={(e) => {
              const newValue = { ...linkData, url: e.target.value }
              setBulkEditValue(newValue)
            }}
            placeholder="https://video.com/..."
          />
        </div>
      )
    }
    case "Link": {
      const linkData = typeof bulkEditValue === "object" ? bulkEditValue : { url: bulkEditValue }
      return (
        <div className="flex-1">
          <input
            className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
            type="text"
            value={linkData.url || ""}
            onChange={(e) => {
              const newValue = { ...linkData, url: e.target.value }
              setBulkEditValue(newValue)
            }}
            placeholder="https://link.com/..."
          />
        </div>
      )
    }

    case "Switch":
      const switchValue = typeof bulkEditValue === "boolean" ? bulkEditValue : false
      return (
        <div className="flex-1">
          <div className="flex items-center gap-3 rounded border border-border bg-muted/40 p-2 text-foreground">
            <label className="text-sm">Toggle switch:</label>
            <Switch checked={switchValue} onCheckedChange={(checked) => setBulkEditValue(checked)} />
            <span className="text-sm font-medium">{switchValue ? "Yes" : "No"}</span>
          </div>
        </div>
      )
    case "RichText":
      return (
        <Dialog>
          <DialogTrigger>
            <button className="w-full rounded border border-border bg-accent/40 px-3 py-2 text-left text-sm text-foreground hover:bg-accent/60">
              Update All Rich Text Fields
            </button>
          </DialogTrigger>
          <DialogContent className="min-w-[750px] gap-0 rounded-lg border border-border bg-card p-0 text-card-foreground">
            <RichTextField
              id={fieldDefinition.slug}
              fieldData={bulkEditValue || ""}
              fieldKey={fieldDefinition.slug}
              onUpdate={(_id, _key, value) => {
                setBulkEditValue(value)
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
              <CustomButton
                onClick={handleBulkColumnUpdate}
                variant="primary"
                className="px-3 py-1"
                loading={isUpdating}
                loadingText="Applying...."
              >
                Apply to All
              </CustomButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )
    case "DateTime":
      return (
        <div className="flex-1">
          <div className="relative w-full max-w-[250px]">
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
                  selected={
                    bulkEditValue
                      ? typeof bulkEditValue === "string" || typeof bulkEditValue === "number"
                        ? new Date(bulkEditValue)
                        : bulkEditValue instanceof Date
                          ? bulkEditValue
                          : undefined
                      : undefined
                  }
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
                    setBulkEditValue(updatedDate.toISOString())
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )
    case "Color":
      return (
        <div className="flex-1">
          <div className="flex items-center justify-center gap-2 rounded border border-border bg-muted/40 p-2 text-foreground">
            <label className="block font-medium text-sm">Pick a color:</label>
            <input
              type="color"
              value={bulkEditValue || "#000000"}
              onChange={(e) => setBulkEditValue(e.target.value)}
              className="h-6 w-6 cursor-pointer border-none bg-transparent p-0 outline-none"
            />
            <input
              type="text"
              value={bulkEditValue || "#000000"}
              onChange={(e) => setBulkEditValue(e.target.value)}
              className="w-28 rounded border border-input bg-background px-2 py-1 text-sm text-foreground"
              placeholder="#000000"
            />
          </div>
        </div>
      )
    default:
      if (fieldDefinition.validations?.singleLine === false) {
        return (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="w-[280px] rounded border border-border bg-background px-3 py-2 text-left text-sm text-foreground hover:bg-accent"
                disabled={isUpdating}
              >
                <span>Add Description...</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="w-full max-w-[600px] gap-0 rounded-lg border border-border bg-card p-0 text-card-foreground">
              <div className="flex flex-col gap-3 border-b border-border p-5">
                <h2 className="font-inter text-lg font-semibold text-foreground">Update All Descriptions</h2>
              </div>
              <div className="m-5">
                <textarea
                  value={String(bulkEditValue || "")}
                  onChange={(e) => setBulkEditValue(e.target.value)}
                  placeholder={`Enter value for all ${fieldDefinition.slug} fields`}
                  className="h-[300px] w-full flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-none"
                  disabled={isUpdating}
                />
              </div>
              <div className="flex items-center justify-end gap-2 p-5 pt-0">
                <AlertDialogAction
                  type="button"
                  className="h-8 rounded border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-1"
                >
                  Close
                </AlertDialogAction>
                <CustomButton
                  onClick={handleBulkColumnUpdate}
                  variant="primary"
                  className="h-8 py-1 px-4"
                  loading={isUpdating}
                  loadingText="Applying..."
                >
                  Apply to All
                </CustomButton>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        )
      } else {
        return (
          <input
            type="text"
            value={String(bulkEditValue || "")}
            onChange={(e) => setBulkEditValue(e.target.value)}
            placeholder={`Enter value for all ${fieldDefinition.slug} fields`}
            className="flex-1 rounded border border-input bg-background px-3 py-1 text-foreground"
          />
        )
      }
  }
}

export default BulkEditField