import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Button from "@/components/common/Button"

interface PaginationProps {
  pageSize: number
  currentPage: number
  totalItems: number
  setPageSize: (size: number) => void
  setCurrentPage: (page: number) => void
}

const Pagination = ({ pageSize, currentPage, totalItems, setPageSize, setCurrentPage }: PaginationProps) => {
  const totalPages = Math.ceil(totalItems / pageSize)

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Items per page:</span>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => {
            setPageSize(Number(value))
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-17.5 border-input bg-background text-foreground rounded h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="15">15</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {totalItems > pageSize && (
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: totalPages }).map((_, i) => (
            <Button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              variant={currentPage === i + 1 ? "primary" : "secondary"}
              className="px-2.5 py-1 text-xs"
            >
              {i + 1}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Pagination