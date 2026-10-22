import type { ReactNode } from "react"
import type { CSSProperties } from "react"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"
import { AppSidebar } from "@/components/app-sidebar"

type CommonLayoutProps = {
  children: ReactNode
  isDarkMode: boolean
  onThemeToggle: () => void
  onPushAll: () => void | Promise<void>
}

export default function CommonLayout({
  children,
  isDarkMode,
  onThemeToggle,
  onPushAll,
}: CommonLayoutProps) {
  return (
    <SidebarProvider
      className="h-dvh overflow-hidden"
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 38)",
          "--sidebar-width-icon": "calc(var(--spacing) * 12)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar />

      <SidebarInset className="flex h-dvh min-h-0 overflow-hidden transition-all duration-300">
        <SiteHeader
          isDarkMode={isDarkMode}
          onThemeToggle={onThemeToggle}
          onPushAll={onPushAll}
        />
        <main className="flex-1 min-h-0 overflow-hidden">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}