import type { IWebflowSiteInfo } from "./index"

export type WebflowNotificationType = "Error" | "Warning" | "Success" | "Info"

export type WebflowNotifyPayload = {
  type: WebflowNotificationType
  message: string
}

export type WebflowGlobal = {
  getSiteInfo(): Promise<IWebflowSiteInfo>
  notify(payload: WebflowNotifyPayload): void | Promise<void>
  setExtensionSize(
    size: "default" | "comfortable" | "large" | { width: number; height: number }
  ): Promise<null>
}

declare global {
  const webflow: WebflowGlobal

  interface Window {
    webflow?: WebflowGlobal
  }
}

export {}