"use client"

import { Link } from "react-router"
import {
  FolderKanban,
  ArrowRight,
  ExternalLink,
} from "lucide-react"


export const dashboardTools = [

  {
    title: "CMS Management",
    description:
      "Upload, organize, and manage your images, files, and videos with folders.",
    icon: FolderKanban,
    href: "/table",
    accentColor:
      "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    title: "Feedback",
    description:
      "Upload, organize, and manage your images, files, and videos with folders.",
    icon: FolderKanban,
    href: "/feedback",
    accentColor:
      "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    title: "Docs",
    description:
      "Explore guides, documentation, and resources to get the most out of Bugzflow.",
    icon: FolderKanban,
    href: "/docs",
    accentColor:
      "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20",
  },
]

export default function DashboardHome() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 p-5">
      <div className="space-y-0.5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Welcome to Bugzflow
        </h1>
        <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Choose a tool below to start building, managing, and publishing your
          Webflow projects.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {dashboardTools.map((tool) => {
          const Icon = tool.icon
          const isExternal =
            tool.href.startsWith("http://") || tool.href.startsWith("https://")

          return (
            <Link
              key={tool.href + tool.title}
              to={tool.href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              className="group relative block outline-none"
            >
              <div className="relative flex h-full flex-col justify-between rounded-xl border border-border/60 bg-card/40 p-3.5 transition-all duration-200 hover:border-border/80 hover:bg-card/80 hover:shadow-sm">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg border transition-transform duration-200 group-hover:scale-105 ${tool.accentColor}`}
                    >
                      <Icon className="size-4" />
                    </div>

                    <div className="text-muted-foreground transition-colors group-hover:text-foreground">
                      {isExternal ? (
                        <ExternalLink className="size-3.5" />
                      ) : (
                        <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                      )}
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <h3 className="text-xs font-semibold tracking-tight text-foreground">
                      {tool.title}
                    </h3>
                    <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}