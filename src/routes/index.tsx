import { createHashRouter } from "react-router"

import App from "@/App"
import { NotFoundPage } from "@/pages/NotFoundPage"
import DashboardHome from "@/pages/Dashboard"
import FeedbackPage from "@/pages/FeedbackPage"
import DocsPage from "@/pages/DocsPage"
import Collections from "@/pages/Collections"

export const router = createHashRouter([
  {
    path: "/",
    Component: App,
    children: [
      {
        index: true,
        Component: DashboardHome,
      },
      {
        path: "table",
        Component: Collections,
      },
      {
        path: "docs",
        Component: DocsPage,
      },
      {
        path: "feedback",
        Component: FeedbackPage,
      },
      {
        path: "*",
        Component: NotFoundPage,
      },
    ],
  },
])