import { VIDEO_HOSTS } from "@/constant/validator"

// ---- URL VALIDATION (HTTP/HTTPS) ----
export const isValidUrl = (urlString: string): boolean => {
  if (!urlString || urlString.trim() === "") return true
  try {
    const url = new URL(urlString)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

// ---- VIDEO ONLY VALIDATION (VIDEO_HOSTS) ----
export const isValidVideoUrl = (urlString: string): boolean => {
  if (!urlString || urlString.trim() === "") return true

  try {
    const url = new URL(urlString)
    const host = url.hostname.toLowerCase()

    return VIDEO_HOSTS.some((allowedHost) =>
      host.includes(allowedHost.toLowerCase())
    )
  } catch {
    return false
  }
}

// ---- VIDEO HOST VALIDATION ----
export const isValidVideoHost = (urlString: string): boolean => {
  try {
    const url = new URL(urlString)
    const hostname = url.hostname.replace("www.", "").toLowerCase()

    return VIDEO_HOSTS.some((host) =>
      hostname.includes(host.toLowerCase())
    )
  } catch {
    return false
  }
}

// ---- EMAIL VALIDATION ----
export const isValidEmail = (email: string): boolean => {
  if (!email || email.trim() === "") return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ---- PHONE VALIDATION ----
export const isValidPhone = (phone: string): boolean => {
  if (!phone || phone.trim() === "") return true
  return /^[0-9+\-\s]{6,20}$/.test(phone)
}
