"use client"

import { useEffect, useRef } from "react"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setExtensionSize, type ExtensionSize } from "@/redux/collectionSlice"
import ReloadButton from "./ReloadButton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { useLocation } from "react-router"


const sizePayloadMap: Record<ExtensionSize, "large" | { width: number; height: number }> = {
  large: "large",
  max: { width: 1200, height: 800 },
}

export function ResizeSelector() {
  const location = useLocation()
  const dispatch = useAppDispatch()
  const currentPath = location.pathname.toLowerCase().replace(/\/$/, "") || "/"
  const isTablePage = currentPath === "/table"
  
  // Connect directly to Redux slice state
  const extensionSize = useAppSelector((state) => state.collection.extensionSize) || "large"
  const hasInitialized = useRef(false)

  const applySize = async (size: ExtensionSize) => {
    try {
      // 1. Dispatch action to Redux store
      dispatch(setExtensionSize(size))

      // 2. Safely call Webflow Designer Extension API
      const webflowInstance =
        typeof window !== "undefined"
          ? (window as any).webflow || (globalThis as any).webflow
          : null

      if (webflowInstance && typeof webflowInstance.setExtensionSize === "function") {
        const payload = sizePayloadMap[size]
        await webflowInstance.setExtensionSize(payload)
        console.log(`Extension UI size updated to [${size}]:`, payload)
      } else {
        console.warn("Webflow Designer API is not available in this environment.")
      }
    } catch (error) {
      console.error("Failed to set extension size:", error)
    }
  }

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true

      // Small delay on initial render to ensure Webflow SDK is ready
      const timer = setTimeout(() => {
        applySize(extensionSize)
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <div className="flex items-center gap-1 shrink-0">
      {
        isTablePage &&
        <ReloadButton />
      }
      
      <Select
        value={extensionSize}
        onValueChange={(val) => applySize(val as ExtensionSize)}
      >
        <SelectTrigger className="h-6! w-16 text-[11px] py-1! font-semibold px-2 bg-card border-border cursor-pointer shrink-0">
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent className="z-50 bg-card border-border min-w-16 ring-0">
          <SelectItem value="large" className="text-xs cursor-pointer font-medium">
            LG
          </SelectItem>
          <SelectItem value="max" className="text-xs cursor-pointer font-medium">
            MAX
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}