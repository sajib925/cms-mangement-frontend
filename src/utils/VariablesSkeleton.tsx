export function VariablesSkeleton() {
  return (
    <div className="space-y-6 pr-1 animate-in fade-in-50 duration-300">
      <style>{`
        @keyframes shimmer-glow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .skeleton-shimmer-box {
          position: relative;
          overflow: hidden;
          background-color: hsl(var(--muted) / 0.4);
        }
        .skeleton-shimmer-box::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            transparent 0%,
            hsl(var(--foreground) / 0.08) 50%,
            transparent 100%
          );
          animation: shimmer-glow 1.6s infinite ease-in-out;
        }
      `}</style>
      {Array.from({ length: 2 }).map((_, collectionIndex) => (
        <div key={collectionIndex} className="space-y-3">
          {/* Collection Header Skeleton */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <div className="skeleton-shimmer-box h-4 w-28 rounded-md" />
              <div className="skeleton-shimmer-box h-3.5 w-8 rounded-full" />
            </div>
            <div className="flex items-center gap-1">
              <div className="skeleton-shimmer-box size-6 rounded-lg" />
              <div className="skeleton-shimmer-box size-6 rounded-lg" />
              <div className="skeleton-shimmer-box size-6 rounded-lg" />
            </div>
          </div>

          {/* Collection Card Skeleton Body */}
          <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden divide-y divide-border/40">
            {Array.from({ length: 3 }).map((_, variableIndex) => (
              <div
                key={variableIndex}
                className="flex flex-wrap items-center justify-between p-3 gap-3"
              >
                {/* Left side: Checkbox, Name, Badge */}
                <div className="flex items-center gap-2.5">
                  <div className="skeleton-shimmer-box size-3.5 rounded" />
                  <div className="skeleton-shimmer-box h-4 w-24 rounded-md" />
                  <div className="skeleton-shimmer-box h-4 w-12 rounded-full" />
                </div>

                {/* Right side: Mode Values & Actions */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 p-1 rounded-lg border border-border/30 bg-muted/20">
                    <div className="skeleton-shimmer-box h-3 w-8 rounded" />
                    <div className="skeleton-shimmer-box size-5 rounded-md" />
                    <div className="skeleton-shimmer-box h-5 w-16 rounded-md" />
                  </div>
                  <div className="skeleton-shimmer-box size-6 rounded-md" />
                  <div className="skeleton-shimmer-box size-6 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}