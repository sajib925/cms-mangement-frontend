import { useState } from "react"
import { useAppDispatch } from "@/redux/hooks"
import { dataApi } from "@/redux/api/dataApi"
import { RefreshCcw } from "lucide-react"

declare global {
  interface Window {
    webflow: {
      notify: (options: { type: "Success" | "Error" | "Warning" | "Info"; message: string }) => void
    }
  }
}

const ReloadButton = () => {
  const [spinning, setSpinning] = useState(false)
  const dispatch = useAppDispatch()

  const handleReload = async () => {
    setSpinning(true)

    try {
      // RTK Query Cache Invalidation for all Collections & Items
      dispatch(dataApi.util.invalidateTags(["Collection", "CollectionItem"]))
    } catch (error) {
      if (typeof window !== "undefined" && window.webflow?.notify) {
        window.webflow.notify({
          type: "Error",
          message: `Reload failed: ${error}` || "Something went wrong!",
        })
      }
    } finally {
      setTimeout(() => {
        setSpinning(false)
      }, 500)
    }
  }

  return (
    <div
      onClick={handleReload}
      className="px-3 py-2 cursor-pointer"
      title="Reload Data"
    >
      <RefreshCcw
        className={`w-4 h-4 transition-transform ${
          spinning ? "animate-spin" : ""
        }`}
      />
    </div>
  )
}

export default ReloadButton