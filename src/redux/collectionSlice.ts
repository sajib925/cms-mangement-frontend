import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { Item, LicenseInfo } from "@/types"

const sizeMap = {
  large: { width: 800, height: 600 },
  max: { width: 1200, height: 800 },
}

export type ExtensionSize = "large" | "max"

export interface CollectionState {
  extensionWidth: number
  extensionHeight: number
  extensionSize: ExtensionSize
  licenseInfo: LicenseInfo
  selectedCollectionId: string
  searchQuery: string
  bulkEditColumn: string | null
  bulkEditValue: any
  currentPage: number
  pageSize: number
  sortKey: string | null
  sortOrder: "asc" | "desc"
  lastUpdatedFilter: string
  selectedIds: string[]
  editedItems: Record<string, Record<string, any>>
  newItems: Record<string, Record<string, any>>
  referenceCollections: Record<string, Item[]>
}

const initialState: CollectionState = {
  extensionSize: "large",
  extensionWidth: sizeMap.large.width,
  extensionHeight: sizeMap.large.height,
  licenseInfo: {
    appName: "",
    siteId: "",
    valid: false,
    createdAt: "",
    expireAt: "",
    key: "",
  },
  selectedCollectionId: "",
  searchQuery: "",
  bulkEditColumn: null,
  bulkEditValue: "",
  currentPage: 1,
  pageSize: 15,
  sortKey: null,
  sortOrder: "asc",
  lastUpdatedFilter: "all",
  selectedIds: [],
  editedItems: {},
  newItems: {},
  referenceCollections: {},
}

export const collectionSlice = createSlice({
  name: "collection",
  initialState,
  reducers: {
    setExtensionSize: (state, action: PayloadAction<ExtensionSize>) => {
      const size = action.payload
      const { width, height } = sizeMap[size]
      state.extensionSize = size
      state.extensionWidth = width
      state.extensionHeight = height
    },
    setExtensionDimensions: (
      state,
      action: PayloadAction<{ width: number; height: number }>
    ) => {
      state.extensionWidth = action.payload.width
      state.extensionHeight = action.payload.height
    },
    setLicenseInfo: (state, action: PayloadAction<LicenseInfo>) => {
      state.licenseInfo = action.payload
    },
    setSelectedCollectionId: (state, action: PayloadAction<string>) => {
      state.selectedCollectionId = action.payload
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },
    setBulkEditColumn: (state, action: PayloadAction<string | null>) => {
      state.bulkEditColumn = action.payload
    },
    setBulkEditValue: (state, action: PayloadAction<any>) => {
      state.bulkEditValue = action.payload
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload
    },
    setSortKey: (state, action: PayloadAction<string | null>) => {
      state.sortKey = action.payload
    },
    setSortOrder: (state, action: PayloadAction<"asc" | "desc">) => {
      state.sortOrder = action.payload
    },
    setLastUpdatedFilter: (state, action: PayloadAction<string>) => {
      state.lastUpdatedFilter = action.payload
    },
    setSelectedIds: (state, action: PayloadAction<string[]>) => {
      state.selectedIds = action.payload
    },
    setEditedItems: (
      state,
      action: PayloadAction<Record<string, Record<string, any>>>
    ) => {
      state.editedItems = action.payload
    },
    setNewItems: (
      state,
      action: PayloadAction<Record<string, Record<string, any>>>
    ) => {
      state.newItems = action.payload
    },
    setReferenceCollections: (
      state,
      action: PayloadAction<Record<string, Item[]>>
    ) => {
      state.referenceCollections = action.payload
    },
  },
})

export const {
  setExtensionSize,
  setExtensionDimensions,
  setLicenseInfo,
  setSelectedCollectionId,
  setSearchQuery,
  setBulkEditColumn,
  setBulkEditValue,
  setCurrentPage,
  setPageSize,
  setSortKey,
  setSortOrder,
  setLastUpdatedFilter,
  setSelectedIds,
  setEditedItems,
  setNewItems,
  setReferenceCollections,
} = collectionSlice.actions

export default collectionSlice.reducer