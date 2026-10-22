export type AppRouteContext = {
  siteId: string
  isDarkMode: boolean
  onRegisterPushAll: (pushAll: (() => Promise<void>) | null) => void
}
