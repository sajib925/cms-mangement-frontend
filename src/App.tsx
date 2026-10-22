import { useEffect, useRef, useState } from "react"
import { Outlet } from "react-router"

import { AuthScreen } from "@/components/AuthScreen"
import { LoadingScreen } from "@/components/Loading"
import CommonLayout from "@/components/layout/CommonLayout"
import {
  useGetRegisteredSiteInfoQuery,
  useGetAuthenticatedUserQuery,
  useGetSiteFromApiQuery,
  useGetSitesListFromApiQuery,
  useListCollectionsQuery,
} from "@/redux/api/dataApi"
import { useAppDispatch } from "@/redux/hooks"
import { setSelectedCollectionId } from "@/redux/collectionSlice"

import type { AppRouteContext } from "@/types/app-route-context"
import toast from "react-hot-toast"

import "react-loading-skeleton/dist/skeleton.css"

function App() {
  const dispatch = useAppDispatch()
  const [siteId, setSiteId] = useState("")
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") {
      return true
    }

    const storedTheme = window.localStorage.getItem("theme")
    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme === "dark"
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
  })

  const pushAllRef = useRef<(() => Promise<void>) | null>(null)

  const registeredSiteQuery = useGetRegisteredSiteInfoQuery(siteId, {
    skip: !siteId,
  })
  const { error, isLoading } = registeredSiteQuery

  useGetAuthenticatedUserQuery(siteId, { skip: !siteId })
  useGetSiteFromApiQuery(siteId, { skip: !siteId })
  useGetSitesListFromApiQuery(siteId, { skip: !siteId })

  // Auto fetch initial Collections & update Store
  const { data: collectionsData } = useListCollectionsQuery(siteId, { skip: !siteId })

  useEffect(() => {
    const collectionsList = (collectionsData as any)?.data?.collections || (collectionsData as any)?.collections || []
    if (collectionsList.length > 0) {
      // Pre-select the first collection in Redux store upon application mount
      dispatch(setSelectedCollectionId(collectionsList[0].id))
    }
  }, [collectionsData, dispatch])

  useEffect(() => {
    const root = document.documentElement
    const body = document.body

    if (isDarkMode) {
      root.classList.add("dark")
      body.classList.add("dark")
    } else {
      root.classList.remove("dark")
      body.classList.remove("dark")
    }

    window.localStorage.setItem("theme", isDarkMode ? "dark" : "light")
  }, [isDarkMode])

  useEffect(() => {
    const initExtension = async () => {
      try {
        if (typeof webflow !== "undefined" && webflow.setExtensionSize) {
          await webflow.setExtensionSize("large")
        }
      } catch {
        toast.error("Failed to set extension size.")
      }

      try {
        if (typeof webflow !== "undefined" && webflow.getSiteInfo) {
          const info = await webflow.getSiteInfo()
          setSiteId(info.siteId)
        }
      } catch {
        toast.error("Failed to load site information.")
      }
    }

    initExtension()
  }, [])

  if (isLoading) {
    return <LoadingScreen />
  }

  if (error) {
    return <AuthScreen />
  }

  return (
    <CommonLayout
      isDarkMode={isDarkMode}
      onThemeToggle={() => {
        setIsDarkMode((current) => !current)
      }}
      onPushAll={async () => {
        if (pushAllRef.current) {
          await pushAllRef.current()
        }
      }}
    >
      <Outlet
        context={
          {
            siteId,
            isDarkMode,
            onRegisterPushAll: (nextPushAll) => {
              pushAllRef.current = nextPushAll
            },
          } satisfies AppRouteContext
        }
      />
    </CommonLayout>
  )
}

export default App