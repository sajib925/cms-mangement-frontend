"use client"

import { useState } from "react"
import { BookOpen, ExternalLink, FileText, Sparkles, Copy, Check } from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function DocsPage() {
  const DOCS_URL = "https://bugzflow.vercel.app/public/docs/dev-kit"
  const [copied, setCopied] = useState(false)

  const handleOpenDocs = () => {
    window.open(DOCS_URL, "_blank", "noopener,noreferrer")
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(DOCS_URL)
    setCopied(true)
    toast.success("Documentation link copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header Section */}
      <div className="flex items-center gap-2">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Documentation & Guides
          </h1>
          <p className="text-xs text-muted-foreground">
            Learn how to make the most of Dev Kit with our tutorials and API references.
          </p>
        </div>
      </div>

      {/* Main Card Section */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-2">
          
          {/* Icon Badge */}
          <div className="flex size-12 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-500 shadow-inner">
            <BookOpen className="size-6" />
          </div>

          {/* Title and Description */}
          <div className="space-y-1.5 max-w-md">
            <h2 className="text-sm font-semibold text-foreground/90">
              Dev Kit Official Documentation
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Explore step-by-step guides for HTML/Tailwind conversion, script management, variables workspace, and asset workflows.
            </p>
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/50 px-2 py-1 text-[10px] font-medium text-muted-foreground">
              <FileText className="size-3 text-blue-500" /> Getting Started
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/50 px-2 py-1 text-[10px] font-medium text-muted-foreground">
              <Sparkles className="size-3 text-amber-500" /> Feature Walkthroughs
            </span>
          </div>

          <div className="w-full space-y-1.5 pt-3 text-left">
            <label className="block text-[11px] font-medium text-foreground/90">
              External Documentation Link
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={DOCS_URL}
                className="h-8.5 rounded-lg border-border/60 bg-background/50 text-xs font-mono text-muted-foreground focus-visible:ring-0 select-all"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyLink}
                className="h-8.5 shrink-0 px-3 text-xs cursor-pointer border-border/60 bg-background/50 hover:bg-background"
              >
                {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5 text-muted-foreground" />}
              </Button>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="w-full pt-2">
            <Button
              type="button"
              onClick={handleOpenDocs}
              className="h-9 w-full cursor-pointer rounded-lg bg-blue-600 text-xs font-medium text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-500 active:scale-[0.99]"
            >
              <ExternalLink className="mr-2 size-3.5" />
              https://bugzflow.vercel.app/public/docs/dev-kit
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}