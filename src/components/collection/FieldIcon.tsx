import React from "react"
import {
  FileText,
  ImageIcon,
  Link as LinkIcon,
  Mail,
  Phone,
  Calendar,
  Palette,
  VideoIcon,
  RefreshCcw,
  SwitchCameraIcon,
} from "lucide-react"
import type { FieldType } from "@/types"

interface FieldIconProps {
  type: FieldType
}

export const FieldIcon: React.FC<FieldIconProps> = ({ type }) => {
  const commonProps = { size: 14, className: "text-muted-foreground" }

  switch (type) {
    case "PlainText":
    case "RichText":
      return <FileText {...commonProps} />
    case "Image":
      return <ImageIcon {...commonProps} />
    case "VideoLink":
      return <VideoIcon {...commonProps} />
    case "Link":
      return <LinkIcon {...commonProps} />
    case "Email":
      return <Mail {...commonProps} />
    case "Phone":
      return <Phone {...commonProps} />
    case "Number":
      return <RefreshCcw {...commonProps} />
    case "DateTime":
      return <Calendar {...commonProps} />
    case "Switch":
      return <SwitchCameraIcon {...commonProps} />
    case "Color":
      return <Palette {...commonProps} />
    case "Reference":
      return <RefreshCcw {...commonProps} />
    case "MultiReference":
      return <RefreshCcw {...commonProps} />
    default:
      return null
  }
}