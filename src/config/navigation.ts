import type { ComponentType, SVGProps } from "react"
import {
  FileText,
  MessageSquare,
} from "lucide-react"

export type NavigationIcon = ComponentType<SVGProps<SVGSVGElement>>

export type NavigationItem = {
  title: string
  url: string
  icon?: NavigationIcon
  end?: boolean
}

export const primaryNavigationItems: NavigationItem[] = [

  {
    title: "Table",
    url: "/table",
    icon: FileText,
  },
  {
    title: "Docs",
    url: "/docs",
    icon: FileText,
  },
  {
    title: "Feedback",
    url: "/feedback",
    icon: MessageSquare,
  },
]