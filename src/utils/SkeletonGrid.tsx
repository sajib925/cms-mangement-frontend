import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-2xs">
          <div className="relative aspect-4/3 w-full overflow-hidden bg-muted/40">
            <Skeleton className="h-full w-full rounded-none" />
          </div>
          <div className="flex flex-col gap-1 p-2">
            <Skeleton className="h-3 w-3/4 rounded" />
            <Skeleton className="h-2.5 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}