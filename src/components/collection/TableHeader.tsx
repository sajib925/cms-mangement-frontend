"use client"

import type React from "react"
import { ArrowDown, ArrowUp, EditIcon, Settings2, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import SortableColumnHeader from "./SortableColumnHeader"
import type { FieldDefinition } from "@/types"
import Button from "@/components/common/Button"

interface TableHeaderProps {
  columnOrder: string[]
  selectedIds: string[]
  paginatedItems: any[]
  sortKey: string | null
  sortOrder: "asc" | "desc"
  bulkEditColumn: string | null
  setSelectedIds: (ids: string[]) => void
  handleSort: (key: string) => void
  setBulkEditColumn: (column: string | null) => void
  setBulkEditValue: (value: string) => void
  getFieldIcon: (fieldSlug: string) => React.JSX.Element | null
  getFieldDefinition: (fieldSlug: string) => FieldDefinition | undefined
  onEditField?: (field: FieldDefinition) => void
  onDeleteField?: (fieldSlug: string) => void
}

const TableHeader = ({
  columnOrder,
  selectedIds,
  paginatedItems,
  sortKey,
  sortOrder,
  bulkEditColumn,
  setSelectedIds,
  handleSort,
  setBulkEditColumn,
  setBulkEditValue,
  getFieldIcon,
  getFieldDefinition,
  onEditField,
  onDeleteField,
}: TableHeaderProps) => {
  const hasDisplayableFields = columnOrder.some((key) => key !== "lastUpdated" && key !== "createdOn")

  if (!hasDisplayableFields) {
    return (
      <tr className="bg-muted text-muted-foreground sticky top-0 z-30">
        <th colSpan={columnOrder.length + 2} className="text-center py-4 text-xs font-normal border-b border-border">
          No collection items found
        </th>
      </tr>
    )
  }

  return (
    <tr className="bg-muted text-foreground sticky top-0 z-30 font-medium">
      <th className="border-r border-b border-border p-2 text-center w-10 bg-muted">
        <Checkbox
          checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedIds(paginatedItems.map((item) => item.id))
            } else {
              setSelectedIds([])
            }
          }}
          title="Select All"
        />
      </th>
      {columnOrder.map((key) => {
        const isSystemField = key === "lastUpdated" || key === "createdOn" || key === "status"
        const fieldDef = getFieldDefinition(key)

        return (
          <th
            key={key}
            className="border-r border-b border-border py-2 px-3 bg-muted text-foreground select-none relative"
          >
            <SortableColumnHeader id={key}>
              <div className="flex justify-between items-center gap-1.5">
                <Button
                  onClick={() => handleSort(key)}
                  variant="ghost"
                  className="flex items-center gap-1.5 text-foreground p-0 h-auto hover:bg-transparent font-semibold text-xs"
                  type="button"
                >
                  {getFieldIcon(key)}
                  <span className="block whitespace-nowrap">
                    {key === "lastUpdated"
                      ? "Last Updated"
                      : key === "createdOn"
                        ? "Created On"
                        : key === "status"
                          ? "Status"
                          : fieldDef?.displayName || key}
                  </span>
                  {sortKey === key && (sortOrder === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                </Button>

                {!isSystemField && (
                  <div className="flex items-center gap-0.5">
                    {/* Bulk Edit Button */}
                    <Button
                      onClick={() => {
                        setBulkEditColumn(bulkEditColumn === key ? null : key)
                        setBulkEditValue("")
                      }}
                      variant={bulkEditColumn === key ? "primary" : "ghost"}
                      className="text-xs p-1 h-auto text-muted-foreground hover:text-foreground"
                      type="button"
                      icon={<EditIcon size={12} />}
                      title="Bulk Edit Column"
                    />

                    {/* Edit Field Settings Button */}
                    {fieldDef && onEditField && (
                      <Button
                        onClick={() => onEditField(fieldDef)}
                        variant="ghost"
                        className="text-xs p-1 h-auto text-muted-foreground hover:text-primary"
                        type="button"
                        icon={<Settings2 size={12} />}
                        title="Edit Field Settings"
                      />
                    )}

                    {/* Delete Field Button */}
                    {onDeleteField && (
                      <Button
                        onClick={() => onDeleteField(key)}
                        variant="ghost"
                        className="text-xs p-1 h-auto text-muted-foreground hover:text-destructive"
                        type="button"
                        icon={<Trash2 size={12} />}
                        title="Delete Field"
                      />
                    )}
                  </div>
                )}
              </div>
            </SortableColumnHeader>
          </th>
        )
      })}
      <th className="border-b border-border p-2 text-center w-10 sticky right-0 bg-muted z-10 text-xs font-semibold">Copy</th>
    </tr>
  )
}

export default TableHeader