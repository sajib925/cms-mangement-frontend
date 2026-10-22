import { Link, useLocation } from "react-router"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

export interface NavigationItem {
  title: string
  url: string
  icon?: any 
}

export function NavMain({
  items,
}: {
  items: NavigationItem[]
}) {
  const location = useLocation()

  return (
    <SidebarGroup className="p-2">
      <SidebarMenu>
        {items.map((item) => {
          const isActive = location.pathname === item.url
          const Icon = item.icon

          return (
            <SidebarMenuItem key={item.title} className="flex flex-col gap-2">
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={{
                  children: item.title,
                  side: "right",
                  align: "center",
                }}
                className={`group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 transition-all duration-200 font-normal! ${
                  isActive
                    ? "text-blue-500"
                    : "hover:text-blue-400 text-muted-foreground"
                }`}
              >
                <Link to={item.url} className="flex items-center gap-2">
                  {Icon && (
                    <Icon
                      className={`size-4 shrink-0 transition-colors ${
                        isActive && "text-blue-500" 
                      }`}
                    />
                  )}
                  <span className="group-data-[collapsible=icon]:hidden">
                    {item.title}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}