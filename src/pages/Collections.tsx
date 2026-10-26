"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import type { WebflowGlobal } from "@/types/webflow" 
import { X, Copy, FolderPlus, Edit2, PlusCircle, AlertTriangle, Plus, Trash2 } from "lucide-react"

// Redux Hooks & Slice Actions
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import {
  setBulkEditColumn,
  setBulkEditValue,
  setCurrentPage,
  setPageSize,
  setSortKey,
  setSortOrder,
  setSelectedCollectionId,
  setSelectedIds,
  setEditedItems,
  setNewItems,
  setReferenceCollections,
} from "@/redux/collectionSlice"

// RTK Query Hooks - IMPORTING BOTH LIVE AND STAGING APIS
import {
  useListCollectionsQuery,
  useGetCollectionDetailsQuery,
  
  // Staging
  useListItemsQuery,
  useLazyListItemsQuery,
  useInsertItemsMutation,
  useUpdateItemsMutation,
  useDeleteItemsMutation,
  usePublishItemsMutation,
  
  // Live
  useListItemsLiveQuery,
  useCreateItemLiveMutation,
  useUpdateItemsLiveMutation,
  useDeleteItemsLiveMutation,

  // Collection/Field Mutations
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  useCreateFieldMutation,
  useUpdateFieldMutation,
  useDeleteFieldMutation,
} from "@/redux/api/dataApi"

import TableHeader from "@/components/collection/TableHeader"
import Pagination from "@/components/collection/Pagination"
import BulkEditField from "@/components/collection/BulkEditField"
import RenderFieldInput from "@/components/collection/RenderFieldInput"
import FillHandleBulkEditBar from "@/components/collection/FillHandleBulkEditBar"
import { Checkbox } from "@/components/ui/checkbox"
import { cleanEmptyFields, generateSlug, handleDuplicateItem, useDynamicItems } from "@/lib/helper"
import type { ExtendedItem, FieldDefinition } from "@/types"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable"
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers"
import type { Modifier } from "@dnd-kit/core"
import { FieldIcon } from "@/components/collection/FieldIcon"
import Skeleton, { SkeletonTheme } from "react-loading-skeleton"
import { Button } from "@/components/ui/button"
import CustomButton from "@/components/common/Button"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"

// Import the new CSV Import Modal
import CsvImportModal from "@/components/collection/CsvImportModal"

interface ReferenceItem {
  id: string
  fieldData: {
    name: string
    slug?: string 
  }
}

interface CollectionsProps {
  onNavigateToLicense?: () => void
}

const EMPTY_ARRAY: any[] = []

const SUPPORTED_FIELD_TYPES = [
  { label: "Plain Text", value: "PlainText" },
  { label: "Rich Text", value: "RichText" },
  { label: "Image", value: "Image" },
  { label: "Multi-Image", value: "MultiImage" },
  { label: "Video Link", value: "VideoLink" },
  { label: "Link", value: "Link" },
  { label: "Email", value: "Email" },
  { label: "Phone", value: "Phone" },
  { label: "Number", value: "Number" },
  { label: "Date / Time", value: "DateTime" },
  { label: "Color", value: "Color" },
  { label: "Switch", value: "Switch" },
  { label: "File", value: "File" },
  { label: "Option", value: "Option" },
  { label: "Reference", value: "Reference" },
  { label: "Multi-Reference", value: "MultiReference" },
]

const parseWebflowError = (err: any): string => {
  const msg = err?.data?.message || err?.message || err?.error || "";
  const lowerMsg = msg.toLowerCase();

  if (lowerMsg.includes("publish") && lowerMsg.includes("queue")) {
    return "Action blocked. Your site has structural changes waiting in the queue. Please open the Webflow Designer and publish your site first.";
  }
  if (lowerMsg.includes("structure changed") || err?.status === 409) {
    return "Collection structure changed. Please publish your site from the Webflow Designer before updating items.";
  }
  if (lowerMsg.includes("validation")) {
    return "Validation failed. Please check if required fields are filled correctly.";
  }
  if (lowerMsg.includes("rate limit")) {
    return "Too many requests. Please wait a moment and try again.";
  }
  
  return msg || "An unexpected error occurred. Please try again.";
}

export default function Collections({ onNavigateToLicense }: CollectionsProps) {
  const dispatch = useAppDispatch()

  const {
    searchQuery,
    bulkEditColumn,
    bulkEditValue,
    currentPage,
    editedItems,
    newItems,
    pageSize,
    referenceCollections,
    selectedCollectionId,
    selectedIds,
    sortKey,
    sortOrder,
    lastUpdatedFilter,
    environmentMode,
  } = useAppSelector((state) => state.collection)

  const isLiveMode = environmentMode === "live";

  const [siteId, setSiteId] = useState("")
  const [activeDialog, setActiveDialog] = useState<null | {
    itemId: string
    fieldKey: string
    type: "Reference" | "MultiReference" | "PlainText" | "RichText"
  }>(null)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditCollectionModalOpen, setIsEditCollectionModalOpen] = useState(false)
  const [editingCollectionData, setEditingCollectionData] = useState<{ id: string; name: string; singularName: string; slug: string } | null>(null)
  const [newCollectionName, setNewCollectionName] = useState("")
  const [newCollectionSlug, setNewCollectionSlug] = useState("")
  const [singularName, setSingularName] = useState("")

  const [isCreateFieldModalOpen, setIsCreateFieldModalOpen] = useState(false)
  const [fieldDisplayName, setFieldDisplayName] = useState("")
  const [fieldHelpText, setFieldHelpText] = useState("")
  const [fieldIsRequired, setFieldIsRequired] = useState(false)
  const [fieldType, setFieldType] = useState<string>("PlainText")
  const [referencedCollectionId, setReferencedCollectionId] = useState("")
  const [fieldOptions, setFieldOptions] = useState<string[]>(["Option 1", "Option 2"])

  const [isEditFieldModalOpen, setIsEditFieldModalOpen] = useState(false)
  const [editingFieldData, setEditingFieldData] = useState<{
    id: string
    slug: string
    displayName: string
    helpText: string
    isRequired: boolean
    type: string
    referencedCollectionId: string
    options: Array<{ id?: string; name: string }>
  } | null>(null)

  const [fieldToDelete, setFieldToDelete] = useState<{ id: string; slug: string; displayName: string } | null>(null)

  // ---------------------------------------------------------
  // CSV IMPORT STATE
  // ---------------------------------------------------------
  const [isCsvImportModalOpen, setIsCsvImportModalOpen] = useState(false)

  // ---------------------------------------------------------
  // FILL HANDLE STATE & VERTICAL MULTI-row DRAG SELECTION
  // ---------------------------------------------------------
  const [fillColumnKey, setFillColumnKey] = useState<string | null>(null);
  const [fillSelectedIds, setFillSelectedIds] = useState<string[]>([]);
  const [fillHandleValue, setFillHandleValue] = useState<any>(null);

  // Drag Tracking States
  const [fillDragStartId, setFillDragStartId] = useState<string | null>(null);
  const [fillDragCurrentId, setFillDragCurrentId] = useState<string | null>(null);

  const tableRef = useRef<HTMLTableElement>(null)

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

  const { data: collectionsData, isLoading: isCollectionsLoading } = useListCollectionsQuery(siteId, { skip: !siteId })
  const collections = (collectionsData as any)?.data?.collections || (collectionsData as any)?.collections || EMPTY_ARRAY

  useEffect(() => {
    if (collections.length > 0 && !selectedCollectionId) {
      dispatch(setSelectedCollectionId(collections[0].id))
    }
  }, [collections, selectedCollectionId, dispatch])

  const { data: schemaData } = useGetCollectionDetailsQuery(
    { siteId, collectionId: selectedCollectionId },
    { skip: !selectedCollectionId || !siteId }
  )
  
  const collectionSchema: FieldDefinition[] = (schemaData as any)?.data?.fields || (schemaData as any)?.fields || EMPTY_ARRAY

  const { data: stagingItemsData, isLoading: isStagingLoading } = useListItemsQuery(
    { siteId, collectionId: selectedCollectionId },
    { skip: !selectedCollectionId || !siteId || isLiveMode }
  )
  const { data: liveItemsData, isLoading: isLiveLoading } = useListItemsLiveQuery(
    { siteId, collectionId: selectedCollectionId },
    { skip: !selectedCollectionId || !siteId || !isLiveMode }
  )

  const isItemsLoading = isStagingLoading || isLiveLoading;
  const activeItemsData = isLiveMode ? liveItemsData : stagingItemsData;
  const items: ExtendedItem[] = (activeItemsData as any)?.data?.items || (activeItemsData as any)?.items || EMPTY_ARRAY

  const [updateStagingItems, { isLoading: isUpdatingStaging }] = useUpdateItemsMutation()
  const [updateLiveItems, { isLoading: isUpdatingLive }] = useUpdateItemsLiveMutation()
  const isUpdating = isUpdatingStaging || isUpdatingLive;

  const [deleteStagingItems] = useDeleteItemsMutation()
  const [deleteLiveItems] = useDeleteItemsLiveMutation()
  const [insertStagingItems] = useInsertItemsMutation()
  const [insertLiveItems] = useCreateItemLiveMutation()
  const [publishItemsMutation] = usePublishItemsMutation()

  const [createCollection, { isLoading: isCreatingCollection }] = useCreateCollectionMutation()
  const [updateCollection, { isLoading: isUpdatingCollection }] = useUpdateCollectionMutation()
  const [deleteCollection] = useDeleteCollectionMutation()
  const [createField, { isLoading: isCreatingField }] = useCreateFieldMutation()
  const [updateField, { isLoading: isUpdatingField }] = useUpdateFieldMutation()
  const [deleteField] = useDeleteFieldMutation()

  const [triggerFetchReferenceItems] = useLazyListItemsQuery()

  // ---------------------------------------------------------
  // CSV EXPORT HANDLER
  // ---------------------------------------------------------
  const handleExportCsv = () => {
    if (!items || items.length === 0) {
      toast.error("No items available to export.");
      return;
    }

    try {
      // 🔍 সিলেক্টেড কালেকশনের অবজেক্ট খুঁজে বের করা যাতে নাম পাওয়া যায়
      const currentCollection = collections.find((col: any) => col.id === selectedCollectionId);
      const rawCollectionName = currentCollection?.displayName || currentCollection?.name || "collection";
      
      // ফাইলের নামের জন্য একটি ক্লিন স্লাগ বা ফরম্যাট তৈরি (যেমন: "Blog Posts" -> "blog-posts")
      const collectionSlugName = rawCollectionName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const headers = columnOrder.filter(key => !["status", "lastUpdated", "createdOn"].includes(key));
      
      const csvRows = [];
      csvRows.push(headers.join(","));

      items.forEach(item => {
        const rowValues = headers.map(header => {
          let val = item.fieldData?.[header] ?? "";
          if (typeof val === "object") val = JSON.stringify(val);
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        });
        csvRows.push(rowValues.join(","));
      });

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      
      // 🎯 এখন থেকে ফাইলনেমে কালেকশনের নাম দেখাবে (যেমন: blog-posts-export.csv)
      link.setAttribute("download", `${collectionSlugName}-export.csv`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export CSV.");
    }
  };

  useEffect(() => {
    const handleAddNewItemEvent = () => handleAddNewItem()
    const handleSaveNewEvent = () => handleSaveNewItems()
    const handleSaveAllEvent = () => handleSaveAll()
    const handleDeleteSelectedEvent = () => handleDeleteSelected()
    const handlePublishSelectedEvent = () => handlePublishSelected()
    const handleOpenCreateModal = () => setIsCreateModalOpen(true)
    const handleOpenCreateField = () => setIsCreateFieldModalOpen(true)
    const handleOpenEditCol = (e: any) => {
      if (e.detail) {
        setEditingCollectionData({
          id: e.detail.id,
          name: e.detail.displayName || e.detail.name || "",
          singularName: e.detail.singularName || e.detail.displayName || e.detail.name || "",
          slug: e.detail.slug || "",
        })
        setIsEditCollectionModalOpen(true)
      }
    }
    const handleDeleteCol = (e: any) => {
      if (e.detail) handleDeleteCollectionSubmit(e.detail)
    }
    const handleOpenCsvImport = () => setIsCsvImportModalOpen(true)
    const handleExportCsvEvent = () => handleExportCsv()

    window.addEventListener("trigger-add-new-item", handleAddNewItemEvent)
    window.addEventListener("trigger-save-new-items", handleSaveNewEvent)
    window.addEventListener("trigger-save-all-items", handleSaveAllEvent)
    window.addEventListener("trigger-delete-selected-items", handleDeleteSelectedEvent)
    window.addEventListener("trigger-publish-selected-items", handlePublishSelectedEvent)
    window.addEventListener("trigger-open-create-collection-modal", handleOpenCreateModal)
    window.addEventListener("trigger-open-create-field-modal", handleOpenCreateField)
    window.addEventListener("trigger-open-edit-collection", handleOpenEditCol)
    window.addEventListener("trigger-delete-collection", handleDeleteCol)
    window.addEventListener("trigger-open-csv-import", handleOpenCsvImport)
    window.addEventListener("trigger-export-csv", handleExportCsvEvent)

    return () => {
      window.removeEventListener("trigger-add-new-item", handleAddNewItemEvent)
      window.removeEventListener("trigger-save-new-items", handleSaveNewEvent)
      window.removeEventListener("trigger-save-all-items", handleSaveAllEvent)
      window.removeEventListener("trigger-delete-selected-items", handleDeleteSelectedEvent)
      window.removeEventListener("trigger-publish-selected-items", handlePublishSelectedEvent)
      window.removeEventListener("trigger-open-create-collection-modal", handleOpenCreateModal)
      window.removeEventListener("trigger-open-create-field-modal", handleOpenCreateField)
      window.removeEventListener("trigger-open-edit-collection", handleOpenEditCol)
      window.removeEventListener("trigger-delete-collection", handleDeleteCol)
      window.removeEventListener("trigger-open-csv-import", handleOpenCsvImport)
      window.removeEventListener("trigger-export-csv", handleExportCsvEvent)
    }
  }, [newItems, editedItems, selectedIds, siteId, selectedCollectionId, collectionSchema, isLiveMode, items])

  const handleAddCreateOption = () => setFieldOptions((prev) => [...prev, `Option ${prev.length + 1}`])
  const handleUpdateCreateOption = (index: number, val: string) => {
    setFieldOptions((prev) => {
      const copy = [...prev]
      copy[index] = val
      return copy
    })
  }
  const handleRemoveCreateOption = (index: number) => setFieldOptions((prev) => prev.filter((_, i) => i !== index))

  const handleCreateFieldSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fieldDisplayName.trim() || !selectedCollectionId || !siteId) return

    if ((fieldType === "Reference" || fieldType === "MultiReference") && !referencedCollectionId) {
      toast.error("Please select a referenced CMS Collection.")
      return
    }

    if (fieldType === "Option") {
      const validOptions = fieldOptions.map((opt) => opt.trim()).filter(Boolean)
      if (validOptions.length === 0) {
        toast.error("Please add at least one option for the Option field.")
        return
      }
    }

    const bodyPayload: any = {
      displayName: fieldDisplayName,
      helpText: fieldHelpText,
      isRequired: fieldIsRequired,
      type: fieldType,
    }

    if (fieldType === "Reference" || fieldType === "MultiReference") {
      bodyPayload.metadata = { collectionId: referencedCollectionId }
    } else if (fieldType === "Option") {
      bodyPayload.metadata = {
        options: fieldOptions.map((opt) => ({ name: opt.trim() })).filter((opt) => opt.name),
      }
    }

    try {
      await createField({
        siteId,
        collectionId: selectedCollectionId,
        body: bodyPayload,
      }).unwrap()

      toast.success("Field created successfully! (Publish site to sync)")
      setIsCreateFieldModalOpen(false)
      setFieldDisplayName("")
      setFieldHelpText("")
      setFieldIsRequired(false)
      setFieldType("PlainText")
      setReferencedCollectionId("")
      setFieldOptions(["Option 1", "Option 2"])
    } catch (err: any) {
      toast.error(parseWebflowError(err))
    }
  }

  const handleOpenEditField = (field: FieldDefinition) => {
    const defaultRefCol = collections.length > 0 ? collections[0].id : ""
    const targetRefCol =
      field.validations?.collectionId ||
      (field as any)?.metadata?.collectionId ||
      (field as any)?.collectionId ||
      (field as any)?.validations?.singleReference?.collectionId ||
      (field as any)?.validations?.multiReference?.collectionId ||
      defaultRefCol

    const rawOptions = field.validations?.options || (field as any)?.metadata?.options || []
    const formattedOptions = rawOptions.map((opt: any) => ({
      id: opt.id,
      name: opt.name || "",
    }))

    setEditingFieldData({
      id: field.id,
      slug: field.slug,
      displayName: field.displayName || field.slug,
      helpText: field.helpText || "",
      isRequired: !!field.isRequired,
      type: field.type || "PlainText",
      referencedCollectionId: targetRefCol,
      options: formattedOptions.length > 0 ? formattedOptions : [{ name: "Option 1" }, { name: "Option 2" }],
    })
    setIsEditFieldModalOpen(true)
  }

  const handleAddEditOption = () => {
    if (!editingFieldData) return
    setEditingFieldData({
      ...editingFieldData,
      options: [...editingFieldData.options, { name: `Option ${editingFieldData.options.length + 1}` }],
    })
  }

  const handleUpdateEditOption = (index: number, val: string) => {
    if (!editingFieldData) return
    const newOpts = [...editingFieldData.options]
    newOpts[index] = { ...newOpts[index], name: val }
    setEditingFieldData({ ...editingFieldData, options: newOpts })
  }

  const handleRemoveEditOption = (index: number) => {
    if (!editingFieldData) return
    setEditingFieldData({
      ...editingFieldData,
      options: editingFieldData.options.filter((_, i) => i !== index),
    })
  }

  const handleUpdateFieldSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingFieldData || !selectedCollectionId || !siteId) return

    if (
      (editingFieldData.type === "Reference" || editingFieldData.type === "MultiReference") &&
      !editingFieldData.referencedCollectionId
    ) {
      toast.error("Please select a referenced CMS Collection.")
      return
    }

    if (editingFieldData.type === "Option") {
      const validOptions = editingFieldData.options.map((opt: any) => opt.name.trim()).filter(Boolean)
      if (validOptions.length === 0) {
        toast.error("Please add at least one option.")
        return
      }
    }

    const bodyPayload: any = {
      displayName: editingFieldData.displayName,
      helpText: editingFieldData.helpText,
      isRequired: editingFieldData.isRequired,
      type: editingFieldData.type,
    }

    if (editingFieldData.type === "Reference" || editingFieldData.type === "MultiReference") {
      bodyPayload.metadata = { collectionId: editingFieldData.referencedCollectionId }
    } else if (editingFieldData.type === "Option") {
      bodyPayload.metadata = {
        options: editingFieldData.options
          .filter((opt: any) => opt.name.trim())
          .map((opt: any) => (opt.id ? { id: opt.id, name: opt.name.trim() } : { name: opt.name.trim() })),
      }
    }

    try {
      await updateField({
        siteId,
        collectionId: selectedCollectionId,
        fieldId: editingFieldData.id,
        body: bodyPayload,
      }).unwrap()

      toast.success("Field updated successfully! (Publish site to sync)")
      setIsEditFieldModalOpen(false)
      setEditingFieldData(null)
    } catch (err: any) {
      toast.error(parseWebflowError(err))
    }
  }

  const handleDeleteFieldSubmit = (fieldSlugOrId: string) => {
    const fieldDef = collectionSchema.find((f) => f.id === fieldSlugOrId || f.slug === fieldSlugOrId)
    if (fieldDef) {
      setFieldToDelete({
        id: fieldDef.id,
        slug: fieldDef.slug,
        displayName: fieldDef.displayName || fieldDef.slug,
      })
    }
  }

  const confirmDeleteField = async () => {
    if (!fieldToDelete || !selectedCollectionId || !siteId) return
    try {
      await deleteField({
        siteId,
        collectionId: selectedCollectionId,
        fieldId: fieldToDelete.id,
      }).unwrap()

      toast.success("Field deleted successfully!")
      setFieldToDelete(null)
    } catch (err: any) {
      toast.error(parseWebflowError(err))
    }
  }

  const handleUpdateCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCollectionData || !siteId) return
    try {
      await updateCollection({
        siteId,
        collectionId: editingCollectionData.id,
        body: {
          displayName: editingCollectionData.name,
          singularName: editingCollectionData.singularName || editingCollectionData.name,
          slug: editingCollectionData.slug || generateSlug(editingCollectionData.name),
        },
      }).unwrap()

      toast.success("Collection updated successfully!")
      setIsEditCollectionModalOpen(false)
      setEditingCollectionData(null)
    } catch (err: any) {
      toast.error(parseWebflowError(err))
    }
  }

  const handleDeleteCollectionSubmit = async (collectionId: string) => {
    if (!confirm("Are you sure you want to delete this collection?")) return
    if (!siteId) return

    try {
      await deleteCollection({ siteId, collectionId }).unwrap()
      toast.success("Collection deleted successfully!")
      if (selectedCollectionId === collectionId) {
        dispatch(setSelectedCollectionId(""))
      }
    } catch (err: any) {
      toast.error(parseWebflowError(err))
    }
  }

  const referenceFields = useMemo(() => {
    return collectionSchema
      .filter((field) => field.type === "Reference" || field.type === "MultiReference")
      .map((field) => ({
        slug: field.slug,
        collectionId: field.validations?.collectionId,
        isMulti: field.type === "MultiReference",
      }))
      .filter((field) => field.collectionId)
  }, [collectionSchema])
  
  useEffect(() => {
    const fetchReferenceItems = async () => {
      const newReferenceCollections: Record<string, ReferenceItem[]> = {}

      for (const field of referenceFields) {
        if (field.collectionId) {
          try {
            const res: any = await triggerFetchReferenceItems({ siteId, collectionId: field.collectionId }, true).unwrap()
            const itemsArray: any[] = res?.data?.items || res?.items || []
            
            const validReferenceItems: ReferenceItem[] = itemsArray
              .filter((item) => item?.fieldData && typeof item.fieldData.name === "string")
              .map((item) => ({
                id: String(item.id),
                fieldData: {
                  name: item.fieldData.name,
                  slug: item.fieldData.slug,
                },
              }))
            
            newReferenceCollections[field.slug] = validReferenceItems
          } catch (error) {
             console.error("Error fetching reference items:", error)
          }
        }
      }
      
      dispatch(setReferenceCollections(newReferenceCollections))
    }

    if (referenceFields.length > 0) {
      fetchReferenceItems()
    }
  }, [referenceFields, siteId, triggerFetchReferenceItems, dispatch]) 

  const handleCreateCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCollectionName.trim()) return

    try {
      const res = await createCollection({
        siteId,
        body: {
          displayName: newCollectionName,
          singularName: singularName || newCollectionName,
          slug: newCollectionSlug || generateSlug(newCollectionName),
        },
      }).unwrap()

      const createdId = (res as any)?.data?.id || (res as any)?.id
      toast.success("Collection created successfully!")

      if (createdId) {
        dispatch(setSelectedCollectionId(createdId))
      }

      setIsCreateModalOpen(false)
      setNewCollectionName("")
      setNewCollectionSlug("")
      setSingularName("")
    } catch (err: any) {
      toast.error(parseWebflowError(err))
    }
  }

  const allFieldKeys = useMemo(() => {
    const keySet = new Set<string>()
    if (collectionSchema?.length) {
      collectionSchema.forEach((field) => keySet.add(field.slug))
    }
    ;["status", "lastUpdated", "createdOn"].forEach((key) => keySet.add(key))
    return Array.from(keySet)
  }, [collectionSchema])

  const prioritizeFields = useMemo(() => ["name", "slug", "status"], [])

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    const defaultOrder = [
      ...prioritizeFields.filter((key) => allFieldKeys.includes(key)),
      ...allFieldKeys.filter((key) => !prioritizeFields.includes(key)),
    ];
    
    if (typeof window !== "undefined" && selectedCollectionId) {
      const savedOrder = localStorage.getItem(`col-order-${selectedCollectionId}`);
      if (savedOrder) {
        try {
          const parsed = JSON.parse(savedOrder);
          const filteredSaved = parsed.filter((key: string) => allFieldKeys.includes(key));
          const missingKeys = defaultOrder.filter((key) => !filteredSaved.includes(key));
          return [...filteredSaved, ...missingKeys];
        } catch (e) {
          console.error("Failed to parse saved column order", e);
        }
      }
    }
    return defaultOrder;
  })

  useEffect(() => {
    const defaultReordered = [
      ...prioritizeFields.filter((key) => allFieldKeys.includes(key)),
      ...allFieldKeys.filter((key) => !prioritizeFields.includes(key)),
    ];

    if (selectedCollectionId) {
      const savedOrder = localStorage.getItem(`col-order-${selectedCollectionId}`);
      if (savedOrder) {
        try {
          const parsed = JSON.parse(savedOrder);
          const filteredSaved = parsed.filter((key: string) => allFieldKeys.includes(key));
          const missingKeys = defaultReordered.filter((key) => !filteredSaved.includes(key));
          
          setColumnOrder((prev) => {
            const newOrder = [...filteredSaved, ...missingKeys];
            if (prev.length === newOrder.length && prev.every((val, index) => val === newOrder[index])) return prev;
            return newOrder;
          });
          return;
        } catch (e) {
          console.error("Error loading column order", e);
        }
      }
    }

    setColumnOrder((prev) => {
      if (prev.length === defaultReordered.length && prev.every((val, index) => val === defaultReordered[index])) {
        return prev;
      }
      return defaultReordered;
    });
  }, [allFieldKeys, prioritizeFields, selectedCollectionId]) 

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const restrictToTableRow: Modifier = ({ transform, draggingNodeRect, active }) => {
    if (!draggingNodeRect || !active) return transform
    const activeElement = document.querySelector(`[data-id="${active.id}"]`)
    if (!activeElement) return transform
    const trElement = activeElement.closest("tr")
    if (!trElement) return transform

    const trRect = trElement.getBoundingClientRect()
    const draggingRect = draggingNodeRect
    return {
      ...transform,
      x: Math.max(trRect.left - draggingRect.left, Math.min(transform.x, trRect.right - draggingRect.right)),
      y: 0,
    }
  }

  function handleDragEnd(event: any) {
    const { active, over } = event
    if (active.id !== over.id) {
      const oldIndex = columnOrder.indexOf(active.id)
      const newIndex = columnOrder.indexOf(over.id)
      const newOrder = arrayMove(columnOrder, oldIndex, newIndex)
      
      setColumnOrder(newOrder)

      // 🎯 ড্র্যাগ করা শেষ হলে লোকাল স্টোরেজে নতুন অর্ডারটি সেভ করা
      if (selectedCollectionId) {
        localStorage.setItem(`col-order-${selectedCollectionId}`, JSON.stringify(newOrder))
      }
    }
  }

  const getFieldDefinition = (slug: string): FieldDefinition | undefined => {
    return collectionSchema.find((field) => field.slug === slug)
  }

  const getReferenceItemName = (referenceId: any, fieldSlug: string): string => {
    if (!referenceId) return ""
    const targetId =
      typeof referenceId === "object" && referenceId !== null
        ? String(referenceId.id || referenceId._id || referenceId.itemId || "")
        : String(referenceId)

    if (!targetId || targetId === "none") return ""

    const items = referenceCollections[fieldSlug] || []
    const referenceItem = items.find((item) => String(item.id) === targetId)
    return referenceItem ? referenceItem.fieldData.name : targetId
  }

  const getReferenceItems = (fieldSlug: string) => {
    const items = (referenceCollections[fieldSlug] as ReferenceItem[]) || []
    return items
  }

  const { filteredItems, paginatedItems, isLoading: isFilterLoading } = useDynamicItems({
    items,
    searchQuery,
    lastUpdatedFilter,
    sortKey,
    sortOrder,
    currentPage,
    pageSize,
    getFieldDefinition,
    getReferenceItemName,
  })

  const effectiveFillIds = useMemo(() => {
    const baseSet = new Set(fillSelectedIds);
    
    if (fillDragStartId && fillDragCurrentId && fillColumnKey) {
      const allIds = paginatedItems.map(i => i.id);
      const startIdx = allIds.indexOf(fillDragStartId);
      const endIdx = allIds.indexOf(fillDragCurrentId);
      
      if (startIdx !== -1 && endIdx !== -1) {
        const min = Math.min(startIdx, endIdx);
        const max = Math.max(startIdx, endIdx);
        for (let i = min; i <= max; i++) {
          baseSet.add(allIds[i]);
        }
      }
    }
    return Array.from(baseSet);
  }, [fillSelectedIds, fillDragStartId, fillDragCurrentId, fillColumnKey, paginatedItems]);

  const handleFillMouseDown = (id: string, columnKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); 

    if (fillColumnKey !== columnKey) {
      setFillColumnKey(columnKey);
      if (e.ctrlKey || e.metaKey) {
        setFillSelectedIds([id]);
      } else {
        setFillSelectedIds([]);
        setFillDragStartId(id);
        setFillDragCurrentId(id);
      }
      setFillHandleValue(null);
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      setFillSelectedIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    } else {
      setFillSelectedIds([]);
      setFillDragStartId(id);
      setFillDragCurrentId(id);
    }
  };

  const handleFillMouseEnter = (id: string, columnKey: string) => {
    if (fillDragStartId && fillColumnKey === columnKey) {
      setFillDragCurrentId(id);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (fillDragStartId) {
        setFillSelectedIds(effectiveFillIds);
        setFillDragStartId(null);
        setFillDragCurrentId(null);
      }
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [fillDragStartId, effectiveFillIds]);

  const toggleSelectedId = (id: string) => {
    const updated = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id]
    dispatch(setSelectedIds(updated))
  }

  const handleUpdateEditedItem = (id: string, key: string, value: any) => {
    const originalItem = items.find((i) => i.id === id)
    const originalValue = originalItem?.fieldData?.[key]
    const isSame = JSON.stringify(originalValue || null) === JSON.stringify(value || null)

    const prevEdited = { ...(editedItems[id] || {}) }

    if (isSame) {
      delete prevEdited[key]
    } else {
      prevEdited[key] = value
    }

    const updatedEditedItems = { ...editedItems }

    if (Object.keys(prevEdited).length === 0) {
      delete updatedEditedItems[id]
    } else {
      updatedEditedItems[id] = prevEdited
    }
    dispatch(setEditedItems(updatedEditedItems))
  }

  const handleBulkColumnUpdate = async () => {
    if (!bulkEditColumn || bulkEditValue == null) return
    const updatedItems = { ...editedItems }
    const itemsToUpdate: Array<{ id: string; fieldData: Record<string, any> }> = []

    filteredItems.forEach((item) => {
      if (["lastUpdated", "createdOn", "status"].includes(bulkEditColumn)) return
      updatedItems[item.id] = { ...(updatedItems[item.id] || {}), [bulkEditColumn]: bulkEditValue }
      itemsToUpdate.push({ id: item.id, fieldData: { [bulkEditColumn]: bulkEditValue } })
    })

    dispatch(setEditedItems(updatedItems))

    if (itemsToUpdate.length > 0) {
      try {
        if (isLiveMode) {
          await updateLiveItems({ siteId, collectionId: selectedCollectionId, body: { items: itemsToUpdate } }).unwrap()
        } else {
          await updateStagingItems({ siteId, collectionId: selectedCollectionId, body: { items: itemsToUpdate } }).unwrap()
        }
        toast.success(`Items updated successfully in ${isLiveMode ? 'Live' : 'Staging'}!`)
        dispatch(setEditedItems({}))
      } catch (err: any) {
        toast.error(parseWebflowError(err))
      }
    }

    dispatch(setBulkEditColumn(null))
    dispatch(setBulkEditValue(""))
  }

  const handlePartialBulkUpdate = async () => {
    if (!fillColumnKey || effectiveFillIds.length === 0) return;
    
    const updatedItems = { ...editedItems };
    const itemsToUpdate: Array<{ id: string; fieldData: Record<string, any> }> = [];

    effectiveFillIds.forEach((id) => {
      if (["lastUpdated", "createdOn", "status"].includes(fillColumnKey)) return;
      updatedItems[id] = { ...(updatedItems[id] || {}), [fillColumnKey]: fillHandleValue };
      itemsToUpdate.push({ id, fieldData: { [fillColumnKey]: fillHandleValue } });
    });

    dispatch(setEditedItems(updatedItems));

    if (itemsToUpdate.length > 0) {
      try {
        if (isLiveMode) {
          await updateLiveItems({ siteId, collectionId: selectedCollectionId, body: { items: itemsToUpdate } }).unwrap();
        } else {
          await updateStagingItems({ siteId, collectionId: selectedCollectionId, body: { items: itemsToUpdate } }).unwrap();
        }
        toast.success(`Successfully updated ${itemsToUpdate.length} selected items!`);
        dispatch(setEditedItems({})); 
      } catch (err: any) {
        toast.error(parseWebflowError(err));
      }
    }
    
    setFillColumnKey(null);
    setFillSelectedIds([]);
    setFillHandleValue(null);
  };

  const handleSaveAll = async () => {
    const payload = {
      items: Object.entries(editedItems).map(([id, fields]) => ({ id, fieldData: cleanEmptyFields(fields) })),
    }

    try {
      if (isLiveMode) {
        await updateLiveItems({ siteId, collectionId: selectedCollectionId, body: payload }).unwrap()
      } else {
        await updateStagingItems({ siteId, collectionId: selectedCollectionId, body: payload }).unwrap()
      }
      toast.success(`Items updated successfully in ${isLiveMode ? 'Live' : 'Staging'}!`)
      dispatch(setEditedItems({}))
    } catch (err: any) {
      toast.error(parseWebflowError(err))
    }
  }

  const handleDeleteSelected = async () => {
    try {
      const payload = { items: selectedIds.map((id) => ({ id })) }
      if (isLiveMode) {
        await deleteLiveItems({ siteId, collectionId: selectedCollectionId, body: payload }).unwrap()
      } else {
        await deleteStagingItems({ siteId, collectionId: selectedCollectionId, body: payload }).unwrap()
      }
      toast.success(`Items deleted successfully from ${isLiveMode ? 'Live' : 'Staging'}!`)
      dispatch(setSelectedIds([]))
    } catch (err: any) {
      toast.error(parseWebflowError(err))
    }
  }

  const handlePublishSelected = async () => {
    if (selectedIds.length === 0 || isLiveMode) return
    try {
      await publishItemsMutation({ siteId, collectionId: selectedCollectionId, body: { itemIds: selectedIds } }).unwrap()
      toast.success("Items published successfully!")
      dispatch(setSelectedIds([]))
    } catch (err: any) {
      toast.error(parseWebflowError(err))
    }
  }

  const handleSort = (key: string) => {
    if (sortKey === key) {
      dispatch(setSortOrder(sortOrder === "asc" ? "desc" : "asc"))
    } else {
      dispatch(setSortKey(key))
      dispatch(setSortOrder("asc"))
    }
  }

  const handleAddNewItem = () => {
    const tempId = `new-${Date.now()}`
    const emptyFields: Record<string, any> = {}
    collectionSchema.forEach((field) => {
      if (field.type === "MultiReference") emptyFields[field.slug] = []
      else if (field.type === "Switch") emptyFields[field.slug] = false
      else emptyFields[field.slug] = ""
    })
    dispatch(setNewItems({ ...newItems, [tempId]: emptyFields }))
  }

  const handleUpdateNewItem = (id: string, key: string, value: any) => {
    const prevItem = newItems[id] || {}
    dispatch(setNewItems({ ...newItems, [id]: { ...prevItem, [key]: value } }))
  }

  const handleSaveNewItems = async () => {
    const payload = {
      items: Object.values(newItems).map((fields) => ({ fieldData: cleanEmptyFields(fields) })),
    }

    try {
      if (isLiveMode) {
        await insertLiveItems({ siteId, collectionId: selectedCollectionId, body: payload }).unwrap()
      } else {
        await insertStagingItems({ siteId, collectionId: selectedCollectionId, body: payload }).unwrap()
      }
      toast.success(`Items created successfully in ${isLiveMode ? 'Live' : 'Staging'}!`)
      dispatch(setNewItems({}))
    } catch (err: any) {
      toast.error(parseWebflowError(err))
    }
  }

  const getFieldIcon = (fieldSlug: string) => {
    const fieldDef = getFieldDefinition(fieldSlug)
    if (!fieldDef) return null
    return <FieldIcon type={fieldDef.type} />
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-background text-foreground">
      {isCollectionsLoading || isItemsLoading || isFilterLoading ? (
        <div className="flex-1 w-full p-4 bg-background">
          <SkeletonTheme baseColor="var(--muted)" highlightColor="var(--accent)">
            <Skeleton height={40} count={6} className="rounded-md space-y-3" />
          </SkeletonTheme>
        </div>
      ) : collections.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center bg-background">
          <FolderPlus className="size-10 text-primary mb-3" />
          <h3 className="text-base font-semibold">No Collections Found</h3>
          <Button onClick={() => setIsCreateModalOpen(true)} className="mt-4 bg-primary text-primary-foreground">
            Create Collection
          </Button>
        </div>
      ) : (
        <div className="flex-1 w-full min-h-0 overflow-hidden bg-background">
          <div className="h-full w-full overflow-auto border border-border bg-card shadow-sm">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToHorizontalAxis, restrictToTableRow]}>
              <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                <table ref={tableRef} className="w-full border-collapse text-xs">
                  <thead className="sticky top-0 z-20 bg-muted/90 backdrop-blur-md">
                    <TableHeader
                      columnOrder={columnOrder}
                      selectedIds={selectedIds}
                      paginatedItems={paginatedItems}
                      sortKey={sortKey}
                      sortOrder={sortOrder}
                      bulkEditColumn={bulkEditColumn}
                      setSelectedIds={(ids: string[] | ((prev: string[]) => string[])) => {
                        const nextIds = typeof ids === "function" ? ids(selectedIds) : ids
                        dispatch(setSelectedIds(nextIds))
                      }}
                      handleSort={handleSort}
                      setBulkEditColumn={(column) => dispatch(setBulkEditColumn(column))}
                      setBulkEditValue={(val) => dispatch(setBulkEditValue(val))}
                      getFieldIcon={getFieldIcon}
                      getFieldDefinition={getFieldDefinition}
                      onEditField={handleOpenEditField}
                      onDeleteField={handleDeleteFieldSubmit}
                    />
                  </thead>

                  <tbody className="divide-y divide-border/60 bg-card">
                    {Object.entries(newItems).length === 0 && paginatedItems.length === 0 ? (
                      <tr>
                        <td colSpan={columnOrder.length + 2} className="p-8 text-center text-muted-foreground">
                          This collection is currently empty.
                        </td>
                      </tr>
                    ) : (
                      <>
                        {Object.entries(newItems).map(([tempId, fieldData]) => (
                          <tr key={tempId} className="bg-accent/40 hover:bg-accent/60 transition-colors">
                            <td className="border-b border-r border-border text-center p-1">
                              <CustomButton
                                onClick={() => {
                                  const updated = { ...newItems }
                                  delete updated[tempId]
                                  dispatch(setNewItems(updated))
                                }}
                                variant="ghost"
                                className="p-1 text-destructive hover:bg-destructive/10"
                                icon={<X size={14} />}
                              />
                            </td>
                            {columnOrder.map((key) => (
                              <td key={key} className="border-b border-r border-border">
                                <RenderFieldInput
                                  item={{ id: tempId, fieldData }}
                                  fieldKey={key}
                                  isNewItem={true}
                                  fieldDefinition={getFieldDefinition(key)}
                                  fieldData={fieldData[key]}
                                  referenceItems={getReferenceItems(key)}
                                  referenceItemName="Select..."
                                  isUpdating={isUpdating}
                                  handleSaveAll={handleSaveAll}
                                  editedItemsCount={Object.keys(editedItems).length}
                                  onUpdate={handleUpdateNewItem}
                                  getReferenceItemName={getReferenceItemName}
                                  
                                  isSelectedForFill={false}
                                  activeDialog={activeDialog}
                                  setActiveDialog={setActiveDialog}
                                />
                              </td>
                            ))}
                            <td className="sticky right-0 z-10 border-b border-border bg-card px-2 text-center">
                              <CustomButton
                                onClick={() =>
                                  handleDuplicateItem({ id: tempId, fieldData }, (updatedFn) => {
                                    const updated = typeof updatedFn === "function" ? updatedFn(newItems) : updatedFn
                                    dispatch(setNewItems(updated))
                                  })
                                }
                                variant="ghost"
                                className="p-1 text-foreground hover:bg-accent"
                                title="Duplicate"
                                icon={<Copy size={14} />}
                              />
                            </td>
                          </tr>
                        ))}

                        {paginatedItems.map((item) => {
                          const { id } = item
                          return (
                            <tr
                              key={id}
                              className={cn("hover:bg-accent/30 transition-colors")}
                            >
                              <td className="border-b border-r border-border px-2 text-center">
                                <Checkbox
                                  checked={selectedIds.includes(id)}
                                  onCheckedChange={() => toggleSelectedId(id)}
                                  title="Select Item"
                                />
                              </td>
                              {columnOrder.map((key) => (
                                <td key={key} className="border-b border-r border-border p-0">
                                  <RenderFieldInput
                                    item={item}
                                    fieldKey={key}
                                    handleSaveAll={handleSaveAll}
                                    editedItemsCount={Object.keys(editedItems).length}
                                    fieldDefinition={getFieldDefinition(key)}
                                    fieldData={editedItems[id]?.[key] ?? item.fieldData[key]}
                                    referenceItems={getReferenceItems(key)}
                                    isUpdating={isUpdating}
                                    referenceItemName="Select..."
                                    onUpdate={handleUpdateEditedItem}
                                    getReferenceItemName={getReferenceItemName}
                                    
                                    isSelectedForFill={fillColumnKey === key && effectiveFillIds.includes(id)}
                                    onFillHandleMouseDown={(itemId, fieldKey, e) => handleFillMouseDown(itemId, fieldKey, e)}
                                    onFillHandleMouseEnter={(itemId, fieldKey) => handleFillMouseEnter(itemId, fieldKey)}

                                    activeDialog={activeDialog}
                                    setActiveDialog={setActiveDialog}
                                  />
                                </td>
                              ))}
                              <td className="sticky right-0 z-10 border-b border-border bg-card px-2 text-center">
                                <CustomButton
                                  onClick={() =>
                                    handleDuplicateItem(item, (updatedFn) => {
                                      const updated = typeof updatedFn === "function" ? updatedFn(newItems) : updatedFn
                                      dispatch(setNewItems(updated))
                                    })
                                  }
                                  variant="ghost"
                                  className="p-1 text-muted-foreground hover:text-foreground"
                                  title="Duplicate"
                                  icon={<Copy size={14} />}
                                />
                              </td>
                            </tr>
                          )
                        })}
                      </>
                    )}
                  </tbody>
                </table>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      )}

      {/* Floating Full Bulk Edit Bar */}
      {bulkEditColumn && (
        <div className="absolute bottom-12 left-0 right-0 z-50 flex items-center justify-between gap-3 border border-border bg-card p-2.5">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
            <span>Bulk Edit:</span>
            <span className="rounded bg-accent px-1.5 py-0.5 font-mono text-primary">{bulkEditColumn}</span>
          </div>

          <div className="flex items-center gap-2">
            <BulkEditField
              fieldDefinition={getFieldDefinition(bulkEditColumn)}
              bulkEditValue={bulkEditValue}
              handleBulkColumnUpdate={handleBulkColumnUpdate}
              isUpdating={isUpdating}
              setBulkEditValue={(val) => dispatch(setBulkEditValue(val))}
              referenceItems={getReferenceItems(bulkEditColumn)}
            />

            <CustomButton onClick={handleBulkColumnUpdate} disabled={isUpdating} variant="primary" className="px-3 py-1 text-xs">
              Save
            </CustomButton>
            <CustomButton onClick={() => dispatch(setBulkEditColumn(null))} variant="secondary" className="px-3 py-1 text-xs">
              Cancel
            </CustomButton>
          </div>
        </div>
      )}

      {/* FLOATING PARTIAL (FILL HANDLE) BULK EDIT BAR */}
      {fillColumnKey && effectiveFillIds.length > 0 && (
        <FillHandleBulkEditBar
          selectedCount={effectiveFillIds.length}
          fieldDefinition={getFieldDefinition(fillColumnKey)}
          isLoading={isUpdating}
          bulkEditValue={fillHandleValue}
          onChange={(val) => setFillHandleValue(val)}
          onApply={handlePartialBulkUpdate}
          onCancel={() => { 
            setFillColumnKey(null); 
            setFillSelectedIds([]);
            setFillHandleValue(null);
          }}
          referenceItems={getReferenceItems(fillColumnKey)}
        />
      )}

      {/* Footer Pagination */}
      <div className="shrink-0 flex w-full items-center justify-end border-t border-border bg-card py-2 px-3">
        <Pagination
          pageSize={pageSize}
          currentPage={currentPage}
          totalItems={filteredItems.length}
          setPageSize={(size) => dispatch(setPageSize(size))}
          setCurrentPage={(page) => dispatch(setCurrentPage(page))}
        />
      </div>

      {/* Create New Collection Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FolderPlus className="size-4 text-primary" />
                Create New CMS Collection
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-muted-foreground p-1 rounded-md">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCollectionSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Collection Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blog Posts"
                  value={newCollectionName}
                  onChange={(e) => {
                    const val = e.target.value
                    setNewCollectionName(val)
                    setNewCollectionSlug(generateSlug(val))
                    setSingularName(val.endsWith("s") ? val.slice(0, -1) : val)
                  }}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Singular Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blog Post"
                  value={singularName}
                  onChange={(e) => setSingularName(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Collection Slug *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. blog-posts"
                  value={newCollectionSlug}
                  onChange={(e) => setNewCollectionSlug(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isCreatingCollection} className="bg-primary text-primary-foreground">
                  {isCreatingCollection ? "Creating..." : "Create Collection"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Field Modal */}
      {isCreateFieldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <PlusCircle className="size-4 text-primary" />
                Create Custom Field
              </h3>
              <button onClick={() => setIsCreateFieldModalOpen(false)} className="text-muted-foreground p-1 rounded-md">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateFieldSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Field Label / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Product Summary"
                  value={fieldDisplayName}
                  onChange={(e) => setFieldDisplayName(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Help Text</label>
                <input
                  type="text"
                  placeholder="e.g. Brief description for this item"
                  value={fieldHelpText}
                  onChange={(e) => setFieldHelpText(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Field Type *</label>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary cursor-pointer"
                >
                  {SUPPORTED_FIELD_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {fieldType === "Option" && (
                <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-primary">Options List *</label>
                    <button
                      type="button"
                      onClick={handleAddCreateOption}
                      className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer"
                    >
                      <Plus size={12} /> Add Option
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {fieldOptions.map((option, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          placeholder={`Option ${idx + 1}`}
                          value={option}
                          onChange={(e) => handleUpdateCreateOption(idx, e.target.value)}
                          className="flex-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-primary"
                        />
                        {fieldOptions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCreateOption(idx)}
                            className="p-1 text-muted-foreground hover:text-destructive rounded-xs transition-colors"
                            title="Remove Option"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(fieldType === "Reference" || fieldType === "MultiReference") && (
                <div className="space-y-1 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <label className="text-xs font-medium text-primary">Referenced CMS Collection *</label>
                  <select
                    value={referencedCollectionId}
                    onChange={(e) => setReferencedCollectionId(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary cursor-pointer"
                  >
                    {collections.map((col: any) => (
                      <option key={col.id} value={col.id}>
                        {col.displayName || col.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Select the target CMS collection to link with this field.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="fieldIsRequired"
                  checked={fieldIsRequired}
                  onChange={(e) => setFieldIsRequired(e.target.checked)}
                  className="size-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="fieldIsRequired" className="text-xs font-medium text-foreground cursor-pointer select-none">
                  Make this field required
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateFieldModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isCreatingField} className="bg-primary text-primary-foreground">
                  {isCreatingField ? "Creating Field..." : "Create Field"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Field Modal */}
      {isEditFieldModalOpen && editingFieldData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Edit2 className="size-4 text-primary" />
                Edit Custom Field: <span className="font-mono text-xs text-primary">{editingFieldData.slug}</span>
              </h3>
              <button onClick={() => setIsEditFieldModalOpen(false)} className="text-muted-foreground p-1 rounded-md">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateFieldSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Field Label / Name *</label>
                <input
                  type="text"
                  required
                  value={editingFieldData.displayName}
                  onChange={(e) => setEditingFieldData({ ...editingFieldData, displayName: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Help Text</label>
                <input
                  type="text"
                  placeholder="e.g. Additional text to guide users"
                  value={editingFieldData.helpText}
                  onChange={(e) => setEditingFieldData({ ...editingFieldData, helpText: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Field Type *</label>
                <select
                  value={editingFieldData.type}
                  onChange={(e) => setEditingFieldData({ ...editingFieldData, type: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary cursor-pointer"
                >
                  {SUPPORTED_FIELD_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {editingFieldData.type === "Option" && (
                <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-primary">Options List *</label>
                    <button
                      type="button"
                      onClick={handleAddEditOption}
                      className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer"
                    >
                      <Plus size={12} /> Add Option
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {editingFieldData.options.map((option: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          placeholder={`Option ${idx + 1}`}
                          value={option.name}
                          onChange={(e) => handleUpdateEditOption(idx, e.target.value)}
                          className="flex-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-primary"
                        />
                        {editingFieldData.options.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEditOption(idx)}
                            className="p-1 text-muted-foreground hover:text-destructive rounded-xs transition-colors"
                            title="Remove Option"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(editingFieldData.type === "Reference" || editingFieldData.type === "MultiReference") && (
                <div className="space-y-1 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <label className="text-xs font-medium text-primary">Referenced CMS Collection *</label>
                  <select
                    value={editingFieldData.referencedCollectionId}
                    onChange={(e) => setEditingFieldData({ ...editingFieldData, referencedCollectionId: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary cursor-pointer"
                  >
                    {collections.map((col: any) => (
                      <option key={col.id} value={col.id}>
                        {col.displayName || col.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Select the target CMS collection to link with this field.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editFieldIsRequired"
                  checked={editingFieldData.isRequired}
                  onChange={(e) => setEditingFieldData({ ...editingFieldData, isRequired: e.target.checked })}
                  className="size-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="editFieldIsRequired" className="text-xs font-medium text-foreground cursor-pointer select-none">
                  Make this field required
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditFieldModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isUpdatingField} className="bg-primary text-primary-foreground">
                  {isUpdatingField ? "Updating Field..." : "Update Field"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Field Confirmation Modal */}
      {fieldToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border pb-3 text-destructive">
              <AlertTriangle className="size-5 shrink-0" />
              <h3 className="text-sm font-semibold">Delete Custom Field</h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete the field{" "}
              <span className="font-semibold text-foreground">"{fieldToDelete.displayName}"</span> ({fieldToDelete.slug})?
              This action cannot be undone and will permanently remove this field data across all items.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={() => setFieldToDelete(null)}>
                Cancel
              </Button>
              <Button type="button" size="sm" variant="destructive" onClick={confirmDeleteField}>
                Delete Field
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Collection Modal */}
      {isEditCollectionModalOpen && editingCollectionData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Edit2 className="size-4 text-primary" />
                Edit Collection Settings
              </h3>
              <button onClick={() => setIsEditCollectionModalOpen(false)} className="text-muted-foreground p-1 rounded-md">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateCollectionSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Collection Name *</label>
                <input
                  type="text"
                  required
                  value={editingCollectionData.name}
                  onChange={(e) => setEditingCollectionData({ ...editingCollectionData, name: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Singular Name *</label>
                <input
                  type="text"
                  required
                  value={editingCollectionData.singularName}
                  onChange={(e) => setEditingCollectionData({ ...editingCollectionData, singularName: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Collection Slug *</label>
                <input
                  type="text"
                  required
                  value={editingCollectionData.slug}
                  onChange={(e) => setEditingCollectionData({ ...editingCollectionData, slug: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditCollectionModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isUpdatingCollection} className="bg-primary text-primary-foreground">
                  {isUpdatingCollection ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      <CsvImportModal 
        isOpen={isCsvImportModalOpen}
        onClose={() => setIsCsvImportModalOpen(false)}
        siteId={siteId}
        collectionId={selectedCollectionId}
        collectionSchema={collectionSchema}
        collections={collections}
        referenceCollections={referenceCollections}
        isLiveMode={isLiveMode}
        onComplete={() => {}}
      />
    </div>
  )
}