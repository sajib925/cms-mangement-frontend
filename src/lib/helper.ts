import type { ExtendedItem, FieldType } from "@/types"
import { useEffect, useMemo, useState } from "react"


interface FieldDefinition {
  type: FieldType
}

interface UseDynamicItemsProps {
  items: ExtendedItem[]
  searchQuery: string
  lastUpdatedFilter: any
  sortKey: any
  sortOrder: "asc" | "desc"
  currentPage: number
  pageSize: number
  getFieldDefinition: (key: string) => FieldDefinition | undefined
  getReferenceItemName: (id: string, key: string) => string
}

export const useDynamicItems = ({
  items,
  searchQuery,
  lastUpdatedFilter,
  sortKey,
  sortOrder,
  currentPage,
  pageSize,
  getFieldDefinition,
  getReferenceItemName
}: UseDynamicItemsProps) => {
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 500) 
    return () => clearTimeout(timer)
  }, [lastUpdatedFilter])

  const filteredItems = useMemo(() => {
    if (isLoading) return [] 

    const now = new Date()

    return items.filter((item) => {
      
     if (lastUpdatedFilter !== "all" && item.createdOn) {
        const updatedDate = new Date(item.createdOn)

        switch (lastUpdatedFilter) {
          case "2d": {
            const thresholdDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
            if (updatedDate <= thresholdDate) return false
            break
          }
          case "10d": {
            const thresholdDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
            if (updatedDate <= thresholdDate) return false
            break
          }
          case "30d": {
            const thresholdDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            if (updatedDate <= thresholdDate) return false
            break
          }
          case "1m": {
            const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            firstDayPrevMonth.setHours(0, 0, 0, 0) 

            const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
            lastDayPrevMonth.setHours(23, 59, 59, 999) 

            if (updatedDate < firstDayPrevMonth || updatedDate > lastDayPrevMonth) {
              return false
            }
            break
          }
          default: {
            const thresholdDate = new Date(0)
            if (updatedDate <= thresholdDate) return false
            break
          }
        }
      }



      const fieldDataMatch = Object.entries(item.fieldData).some(([key, val]) => {
        if (typeof val === "string") {
          return val.toLowerCase().includes(searchQuery.toLowerCase())
        }

        const fieldDef = getFieldDefinition(key)
        if (fieldDef?.type === "Reference") {
          const referenceName = getReferenceItemName(val as string, key)
          return referenceName.toLowerCase().includes(searchQuery.toLowerCase())
        } else if (fieldDef?.type === "MultiReference" && Array.isArray(val)) {
          return val.some((refId) => {
            const referenceName = getReferenceItemName(refId, key)
            return referenceName.toLowerCase().includes(searchQuery.toLowerCase())
          })
        }

        return false
      })

      const createdOnMatch = item.createdOn
        ? new Date(item.createdOn).toLocaleString().toLowerCase().includes(searchQuery.toLowerCase())
        : false

      return fieldDataMatch || createdOnMatch 
    })

  }, [items, searchQuery, lastUpdatedFilter, getFieldDefinition, getReferenceItemName, isLoading])

  const sortedItems = useMemo(() => {
    if (!sortKey) return filteredItems

    const sorted = [...filteredItems].sort((a, b) => {
      if (sortKey === "lastUpdated" || sortKey === "createdOn") {
        const toValidDate = (value: unknown): Date => {
          if (value instanceof Date) return value
          if (typeof value === "string" || typeof value === "number") {
            const date = new Date(value)
            if (!isNaN(date.getTime())) return date
          }
          return new Date()
        }

        const aDate = toValidDate(a[sortKey as keyof ExtendedItem]).getTime()
        const bDate = toValidDate(b[sortKey as keyof ExtendedItem]).getTime()
        return sortOrder === "asc" ? aDate - bDate : bDate - aDate
      }

      if (sortKey === "status") {
        const getStatusValue = (item: ExtendedItem): string => {
          if (item.lastPublished) return "Published"
          if (item.isDraft) return "Draft"
          return "Queued to Publish"
        }

        const aStatus = getStatusValue(a)
        const bStatus = getStatusValue(b)
        return sortOrder === "asc"
          ? aStatus.localeCompare(bStatus)
          : bStatus.localeCompare(aStatus)
      }

      const fieldDef = getFieldDefinition(sortKey)
      if (fieldDef?.type === "Reference") {
        const aVal = a.fieldData[sortKey] as string
        const bVal = b.fieldData[sortKey] as string

        const aName = aVal ? getReferenceItemName(aVal, sortKey) : ""
        const bName = bVal ? getReferenceItemName(bVal, sortKey) : ""
        return sortOrder === "asc" ? aName.localeCompare(bName) : bName.localeCompare(aName)
      } else if (fieldDef?.type === "MultiReference") {
        const aVal = (a.fieldData[sortKey] as string[]) || []
        const bVal = (b.fieldData[sortKey] as string[]) || []

        if (aVal.length !== bVal.length) {
          return sortOrder === "asc" ? aVal.length - bVal.length : bVal.length - aVal.length
        }

        if (aVal.length > 0 && bVal.length > 0) {
          const aName = getReferenceItemName(aVal[0], sortKey)
          const bName = getReferenceItemName(bVal[0], sortKey)
          return sortOrder === "asc" ? aName.localeCompare(bName) : bName.localeCompare(aName)
        }

        return 0
      }

      const aVal = a.fieldData[sortKey] || ""
      const bVal = b.fieldData[sortKey] || ""

      return sortOrder === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal))
    })

    return sorted
  }, [filteredItems, sortKey, sortOrder, getFieldDefinition, getReferenceItemName])

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedItems.slice(start, start + pageSize)
  }, [sortedItems, currentPage, pageSize])

  return { filteredItems, sortedItems, paginatedItems, isLoading }
}



export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") 
    .replace(/\s+/g, "-") 
    .replace(/-+/g, "-") 
    .trim() 
}

export const cleanEmptyFields = (fields: Record<string, any>): Record<string, any> => {
  return Object.fromEntries(
    Object.entries(fields).filter(([_, value]) => {
      if (Array.isArray(value)) return true
      if (typeof value === "boolean") return true
      if (typeof value === "number") return true
      return value !== "" && value !== null && value !== undefined
    }),
  )
}

export const stripHtml = (html: string): string => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
};

type SetNewItemsType = React.Dispatch<React.SetStateAction<Record<string, any>>>;

export const handleDuplicateItem = ( item: ExtendedItem, setNewItems: SetNewItemsType ) => {

  const tempId = `temp-${Date.now()}`

  const clonedFieldData = { ...item.fieldData }

  setNewItems((prev) => ({
    ...prev,
    [tempId]: clonedFieldData,
  }))

};




