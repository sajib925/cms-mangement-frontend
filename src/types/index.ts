
export type IWebflowSiteInfo = {
  siteId: string
  siteName: string
  shortName: string
  domains?: { url: string }[]
}

export type WebflowApiResponse<T> = {
  statusCode: number
  success: boolean
  message: string
  data: T
}

export type FieldType =
  | "PlainText"
  | "RichText"
  | "Image"
  | "ImageRefSet"
  | "VideoLink"
  | "Link"
  | "Email"
  | "Phone"
  | "Number"
  | "DateTime"
  | "Switch"
  | "Color"
  | "Option"
  | "File"
  | "Reference"
  | "MultiReference"
  | "Set"
  | "User"
  | "MultiImage"
  | "List" 


export interface FieldDefinition {
  id: string
  isEditable: boolean
  isRequired: boolean
  type: FieldType
  slug: string
  displayName: string
  validations: any
  referencedCollectionId?: string 
  options?: any[]
  helpText?: string
}

export type FieldData = {
  [key: string]: string | undefined | Record<string, any> | Array<Record<string, any>> | null
}

export interface CollectionItem {
  _id: string 
  fieldData: FieldData 
}

export interface Collection {
  id: string
  displayName: string
}

export interface Item {
  id: string
  fieldData: Record<string, any>
}

export interface ExtendedItem extends Item {
  lastUpdated?: string
  createdOn?: string
  isDraft?: boolean
  lastPublished?: string
  isLoading?: boolean
  slug?: string
  isArchived?: boolean
}

export interface UpdatePayload {
  items: Array<{ _id: string; fields: Record<string, any> }>
}

export const CmsFieldType = {
  PlainText: "PlainText",
  RichText: "RichText",
  Image: "Image",
  MultiImage: "MultiImage",
  Link: "Link",
  Email: "Email",
  Phone: "Phone",
  Number: "Number",
  DateTime: "DateTime",
  Switch: "Switch",
  Color: "Color",
  File: "File",
  Reference: "Reference",
  MultiReference: "MultiReference",
  Option: "Option",
  VideoLink: "VideoLink",
} as const;

export type CmsFieldType =
  (typeof CmsFieldType)[keyof typeof CmsFieldType];


export type LicenseInfo = {
  appName: string;
  siteId: string;
  valid: boolean;
  createdAt: string;
  expireAt: string;
  key: string;
  activated?: string;
};


export type MetaValue = {
  name: string
  url: string
}

export type ProjectMetaResponse = {
  app_title: string
  meta_key: string
  meta_value: MetaValue[]
}

