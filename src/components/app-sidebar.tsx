"use client"

import * as React from "react"
import { Link, useLocation } from "react-router"
import { Home } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar"

import { NavMain } from "./nav-main"
import { primaryNavigationItems } from "@/config/navigation"

export function AppSidebar(
  props: React.ComponentProps<typeof Sidebar>
) {
  const location = useLocation()

  const pathSegments = location.pathname
    .split("/")
    .filter(Boolean)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b px-4 py-3.5 flex justify-center group-data-[collapsible=icon]:px-2">
        <Breadcrumb className="w-full">
          <BreadcrumbList className="gap-1 flex-nowrap items-center group-data-[collapsible=icon]:justify-center">
            
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  to="/"
                  className="flex items-center gap-1 text-xs font-medium hover:text-foreground"
                  title="Home"
                >
                  <Home className="size-4 shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden">Home</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {pathSegments.length > 0 && (
              <BreadcrumbSeparator className="group-data-[collapsible=icon]:hidden" />
            )}

            {pathSegments.map((segment, index) => {
              const url = `/${pathSegments
                .slice(0, index + 1)
                .join("/")}`

              const isLast =
                index === pathSegments.length - 1

              const rawName = decodeURIComponent(segment)

              const displayName =
                rawName.charAt(0).toUpperCase() + rawName.slice(1)

              return (
                <React.Fragment key={url}>
                  <BreadcrumbItem className="group-data-[collapsible=icon]:hidden">
                    {isLast ? (
                      <BreadcrumbPage className="max-w-30 truncate text-xs font-semibold">
                        {displayName}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link
                          to={url}
                          className="text-xs"
                        >
                          {displayName}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>

                  {!isLast && (
                    <BreadcrumbSeparator className="group-data-[collapsible=icon]:hidden" />
                  )}
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </SidebarHeader>
      <SidebarContent className="group-data-[collapsible=icon]:items-center">
        <NavMain items={primaryNavigationItems} />
      </SidebarContent>
    </Sidebar>
  )
}