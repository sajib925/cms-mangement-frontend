import { CmsFieldType } from "@/types"

const detectFieldType = (fieldName: string, sampleValue: unknown): CmsFieldType => {
  const lowerName = fieldName.toLowerCase()
  const valueStr = String(sampleValue || "").toLowerCase()

  // Switch (boolean)
  if (["true", "false", "1", "0", "yes", "no", "on", "off"].includes(valueStr)) {
    return CmsFieldType.Switch
  }
  // Number
  if (sampleValue !== null && sampleValue !== "" && !isNaN(Number(sampleValue))) {
    return CmsFieldType.Number
  }
  // Date
  if (sampleValue && !isNaN(Date.parse(String(sampleValue)))) {
    const dateRegex = /\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{4}/
    if (dateRegex.test(String(sampleValue))) {
      return CmsFieldType.DateTime
    }
  }
  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valueStr)) {
    return CmsFieldType.Email
  }
  // Link
  if (/^https?:\/\/.+/.test(valueStr)) {
    return CmsFieldType.Link
  }
  // Phone
  if (/^[+]?[1-9][\d]{0,15}$/.test(valueStr.replace(/[\s\-()]/g, ""))) {
    return CmsFieldType.Phone
  }
  // Image
  if (/\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i.test(valueStr)) {
    return CmsFieldType.Image
  }
  // File
  if (/\.(pdf|docx?|xlsx?|pptx?|zip|rar|csv|json)$/i.test(valueStr)) {
    return CmsFieldType.File
  }
  // Color
  if (/^#[0-9A-F]{6}$/i.test(valueStr) || /^rgb\(/.test(valueStr)) {
    return CmsFieldType.Color
  }
  // Video Link (added explicit check)
  if (/(youtube\.com|vimeo\.com|youtu\.be)/i.test(valueStr) && /^https?:\/\/.+/.test(valueStr)) {
    return CmsFieldType.VideoLink
  }
  // Reference & MultiReference
  // Prioritize more specific checks if possible, but these are based on naming conventions
  if (lowerName.includes("multireference") || lowerName.includes("categories") || lowerName.includes("tags")) {
    return CmsFieldType.MultiReference
  }
  if (lowerName.includes("reference") || lowerName.includes("category") || lowerName.includes("author")) {
    return CmsFieldType.Reference
  }
  // RichText
  if (
    lowerName.includes("richtext") ||
    lowerName.includes("html") ||
    lowerName.includes("wysiwyg") ||
    lowerName.includes("editor") ||
    String(sampleValue).length > 250
  ) {
    return CmsFieldType.RichText
  }
  return CmsFieldType.PlainText
}

export const transformItemForWebflow = (item: Record<string, any>): Record<string, any> => {
  const transformed: Record<string, any> = {}
  Object.entries(item).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return

    const fieldSlug = String(key)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    const fieldType = detectFieldType(key, value)

    let transformedValue = value

    switch (fieldType) {
      case CmsFieldType.Number:
        transformedValue = isNaN(Number(value)) ? 0 : Number(value)
        break
      case CmsFieldType.DateTime:
        const dateTest = Date.parse(String(value))
        transformedValue = isNaN(dateTest) ? new Date().toISOString() : new Date(String(value)).toISOString()
        break
      case CmsFieldType.Switch:
        transformedValue = ["true", "1", "yes", "on"].includes(String(value).toLowerCase())
        break
      case CmsFieldType.MultiImage:
        if (typeof value === "string") {
          transformedValue = value.split(";").map((url) => ({ url: url.trim() }))
        } else if (Array.isArray(value)) {
          transformedValue = value.map((url) => ({ url: url.trim() }))
        }
        break
      case CmsFieldType.Reference:
        if (typeof value === "string" && value.trim() !== "") {
          transformedValue = { _id: value.trim() }
        } else if (typeof value === "object" && value !== null && "_id" in value) {
          transformedValue = value
        } else {
          transformedValue = null
        }
        break
      case CmsFieldType.MultiReference:
        if (typeof value === "string" && value.trim() !== "") {
          transformedValue = value.split(";").map((id) => ({ _id: id.trim() }))
        } else if (Array.isArray(value)) {
          transformedValue = value.map((item) => (typeof item === "string" ? { _id: item.trim() } : item))
        } else {
          transformedValue = []
        }
        break
      case CmsFieldType.Image:
      case CmsFieldType.File:
      case CmsFieldType.VideoLink:
        if (typeof value === "string") {
          const urlMatch = value.match(/https?:\/\/[^\s,}]+/)
          transformedValue = urlMatch ? { url: urlMatch[0] } : { url: "" }
        } else if (typeof value === "object" && value !== null && "url" in value) {
          transformedValue = value
        } else {
          transformedValue = { url: "" }
        }
        break
      case CmsFieldType.RichText:
        if (typeof value === "string" && (value.startsWith("{") || value.startsWith("["))) {
          try {
            transformedValue = JSON.parse(value)
          } catch (e) {
            transformedValue = value
          }
        } else {
          transformedValue = value
        }
        break
      default:
        transformedValue = value
        break
    }
    transformed[fieldSlug] = transformedValue
  })
  return transformed
}
