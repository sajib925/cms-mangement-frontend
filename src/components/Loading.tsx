import { Code2 } from "lucide-react"
import type { PropsWithChildren } from "react"

export const LoadingScreen = ({ height = "min-h-screen" }: PropsWithChildren<{ height?: string }>) => {
  return (
    <div
      className={`${height} relative flex w-full items-center justify-center overflow-hidden bg-background px-6 text-foreground`}
    >
      {/* Background Ambient Glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 size-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 size-96 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Main Glassmorphic Card with CSS Fade-in */}
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-border/40 bg-card/40 p-8 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
        
        {/* Animated Icon Box with Glowing Pulse */}
        <div className="relative flex items-center justify-center">
          {/* Outer Pulsing Ring */}
          <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-md animate-ping opacity-30" />

          {/* Icon Container */}
          <div className="relative flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-inner">
            <Code2 className="size-7 animate-[spin_8s_linear_infinite]" />
          </div>
        </div>

        {/* Text & Smooth Progress Bar Section */}
        <div className="flex w-full flex-col items-center gap-3 text-center">
          <p className="text-sm font-medium tracking-wide text-foreground/80 animate-in fade-in duration-700">
            Setting up your workspace...
          </p>

          {/* Pure Tailwind Shimmer Progress Bar */}
          <div className="relative h-1.5 w-48 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full bg-linear-to-r from-transparent via-primary to-transparent animate-[shimmer_1.5s_infinite]" />
          </div>
        </div>
      </div>
    </div>
  )
}