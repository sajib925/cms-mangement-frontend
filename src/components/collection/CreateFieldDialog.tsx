"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { FieldDefinition, FieldType, Collection } from "@/types"
import { Type, Hash, Mail, Calendar, Palette, LinkIcon, Phone, ToggleLeft, List, File, ImageIcon, Video, X, LucideRockingChair } from "lucide-react"
import { Alert, AlertDescription } from "../ui/alert"

// RTK Query Hooks Import
import { useListCollectionsQuery, useCreateFieldMutation } from "@/redux/api/dataApi"

interface CreateFieldDialogProps {
  isOpen: boolean
  onClose: () => void
  siteId: string
  collectionId: string
  initialDisplayName?: string
  onFieldCreated: (field: FieldDefinition) => void
}

const fieldTypeOptions: { value: FieldType; label: string; icon: React.ElementType }[] = [
  { value: "PlainText", label: "Plain Text", icon: Type },
  { value: "RichText", label: "Rich Text", icon: LucideRockingChair },
  { value: "Image", label: "Image", icon: ImageIcon },
  { value: "VideoLink", label: "Video", icon: Video },
  { value: "Link", label: "Link", icon: LinkIcon },
  { value: "Email", label: "Email", icon: Mail },
  { value: "Phone", label: "Phone", icon: Phone },
  { value: "Number", label: "Number", icon: Hash },
  { value: "DateTime", label: "Date/Time", icon: Calendar },
  { value: "Switch", label: "Switch", icon: ToggleLeft },
  { value: "Color", label: "Color", icon: Palette },
  { value: "File", label: "File", icon: File },
  { value: "Reference", label: "Reference", icon: LinkIcon },
  { value: "MultiReference", label: "Multi-Reference", icon: LinkIcon },
  { value: "MultiImage", label: "Multi-Image", icon: ImageIcon },
  { value: "Option", label: "Option", icon: List },
]

export default function CreateFieldDialog({
  isOpen,
  onClose,
  siteId,
  collectionId,
  initialDisplayName = "",
  onFieldCreated,
}: CreateFieldDialogProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [type, setType] = useState<FieldType>("PlainText")
  const [isRequired, setIsRequired] = useState(false)
  const [helpText, setHelpText] = useState("")
  const [options, setOptions] = useState<string[]>([])
  const [newOption, setNewOption] = useState("")
  const [referenceCollectionId, setReferenceCollectionId] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  // RTK Query Hook for fetching Collections
  const { data: collectionsResponse } = useListCollectionsQuery(siteId, {
    skip: !(isOpen && (type === "Reference" || type === "MultiReference")),
  })

  const collections: Collection[] =
    (collectionsResponse as any)?.data?.collections ||
    (collectionsResponse as any)?.collections ||
    []

  // RTK Query Mutation Hook for Creating Field
  const [createFieldMutation, { isLoading: isCreating }] = useCreateFieldMutation()

  useEffect(() => {
    if (isOpen) {
      setDisplayName(initialDisplayName)
      setType("PlainText")
      setIsRequired(false)
      setHelpText("")
      setOptions([])
      setNewOption("")
      setReferenceCollectionId("")
      setError(null)
    }
  }, [isOpen, initialDisplayName])

  const handleAddOption = useCallback(() => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions((prev) => [...prev, newOption.trim()])
      setNewOption("")
    }
  }, [newOption, options])

  const handleRemoveOption = useCallback(
    (optionToRemove: string) => {
      setOptions((prev) => prev.filter((opt) => opt !== optionToRemove))
    },
    [],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!displayName.trim()) {
      setError("Display Name is required.")
      return
    }

    const payload: any = {
      type,
      displayName: displayName.trim(),
      helpText: helpText.trim(),
      isRequired,
    }

    if (type === "Option") {
      if (options.length === 0) {
        setError("Option fields must have at least one option.")
        return
      }

      payload.metadata = {
        options: options.map((opt) => ({ name: opt })),
      }
    }

    if ((type === "Reference" || type === "MultiReference") && !referenceCollectionId) {
      setError("Reference fields require a target collection.")
      return
    }

    if (type === "Reference" || type === "MultiReference") {
      payload.metadata = {
        referenceCollectionId: referenceCollectionId,
      }
    }

    try {
      const result = await createFieldMutation({
        siteId,
        collectionId,
        body: payload,
      }).unwrap()

      const createdField = (result as any)?.data?.field || (result as any)?.field || result
      onFieldCreated(createdField as FieldDefinition)
      onClose()
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Failed to create field.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card text-card-foreground p-5 max-w-[500px] gap-0 rounded-lg border border-border z-[99]">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle className="text-base font-medium text-foreground">Create New Field</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="displayName" className="text-sm text-foreground">
              Display Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-2 bg-background border-input text-foreground rounded text-sm h-9 focus-visible:ring-1 focus-visible:ring-primary"
              placeholder="e.g., Product Name"
              required
            />
          </div>

          <div>
            <Label htmlFor="fieldType" className="text-sm text-foreground">
              Field Type <span className="text-destructive">*</span>
            </Label>
            <Select value={type} onValueChange={(value: FieldType) => setType(value)}>
              <SelectTrigger className="w-full mt-2 text-sm h-9 py-1 bg-background border border-input text-foreground rounded">
                <SelectValue placeholder="Select Field Type" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border border-border rounded-md">
                {fieldTypeOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
                        {option.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {(type === "Reference" || type === "MultiReference") && (
            <div>
              <Label htmlFor="referenceCollection" className="text-sm text-foreground">
                Reference Collection <span className="text-destructive">*</span>
              </Label>
              <Select value={referenceCollectionId} onValueChange={setReferenceCollectionId}>
                <SelectTrigger className="w-full mt-2 text-sm h-9 py-1 bg-background border border-input text-foreground rounded">
                  <SelectValue placeholder="Select a collection" />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground border border-border rounded-md">
                  {collections.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "Option" && (
            <div className="space-y-2">
              <Label className="text-sm text-foreground">
                Options <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Add new option"
                  className="bg-background border-input text-foreground rounded text-sm h-9 flex-grow focus-visible:ring-1 focus-visible:ring-primary"
                />
                <Button
                  type="button"
                  onClick={handleAddOption}
                  variant="outline"
                  className="bg-secondary text-secondary-foreground border-border rounded text-xs font-semibold px-3 h-9"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {options.map((option, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 bg-muted border border-border text-foreground text-xs px-2.5 py-1 rounded-full"
                  >
                    {option}
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(option)}
                      className="ml-1 text-muted-foreground hover:text-destructive flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="helpText" className="text-sm text-foreground">
              Help Text (Optional)
            </Label>
            <Input
              id="helpText"
              value={helpText}
              onChange={(e) => setHelpText(e.target.value)}
              className="mt-2 bg-background border-input text-foreground rounded text-sm focus-visible:ring-1 focus-visible:ring-primary"
              placeholder="A short description for this field"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <Checkbox
              id="isRequired"
              checked={isRequired}
              onCheckedChange={(checked) => setIsRequired(Boolean(checked))}
              className="border-input data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <Label htmlFor="isRequired" className="text-sm text-foreground font-normal">
              Required Field
            </Label>
          </div>

          {error && (
            <Alert className="bg-destructive/15 border-destructive text-destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="flex justify-end gap-2 pt-4 border-t border-border">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="bg-secondary text-secondary-foreground border-border rounded text-xs font-medium px-3 h-8"
                disabled={isCreating}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 h-8 text-xs font-medium rounded"
              disabled={isCreating}
            >
              {isCreating ? "Creating..." : "Create Field"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}