import type { IWebflowSiteInfo } from "./index"

export type WebflowNotificationType = "Error" | "Warning" | "Success" | "Info"

export type WebflowNotifyPayload = {
  type: WebflowNotificationType
  message: string
}

export type WebflowStyle = { 
  getName(): Promise<string> | string; 
  setProperties( props: Record<string, string> ): Promise<void> | void; 
  getComboStyle( name: string ): Promise<WebflowStyle | null>; 
  createComboStyle( name: string ): Promise<WebflowStyle>; 
};

export type WebflowElement = {
  append(preset: unknown): Promise<WebflowElement>
  setTag(tag: string): void
  setAttribute(key: string, value: string): void
  setTextContent(text: string): void
  setStyles?(styles: WebflowStyle[]): Promise<void>
  save?(): Promise<void>
}

export type WebflowComponentDefinition = {
  id: string
}

export type WebflowComponentRegistrationOptions = {
  name: string
  group?: string
  description?: string
}

export type WebflowCreateStyleOptions = {
  parent?: WebflowStyle;
}

export type WebflowGlobal = {
  getSiteInfo(): Promise<IWebflowSiteInfo>
  getSelectedElement(): Promise<WebflowElement | null>
  getRootElement(): Promise<WebflowElement | null>
  setSelectedElement(element: WebflowElement): Promise<WebflowElement>
  getStyleByName(name: string): Promise<WebflowStyle | null>
  
  createStyle(name: string, options?: WebflowCreateStyleOptions): Promise<WebflowStyle>
  
  registerComponent(
    name: string,
    rootElement: WebflowElement
  ): Promise<WebflowComponentDefinition>
  registerComponent(
    options: WebflowComponentRegistrationOptions
  ): Promise<WebflowComponentDefinition>
  createInstance(
    componentDefinition: WebflowComponentDefinition
  ): Promise<WebflowElement>
  notify(payload: WebflowNotifyPayload): void | Promise<void>
  elementPresets: {
    DOM: unknown
  }
  setExtensionSize(
    size: "default" | "comfortable" | "large" | { width: number; height: number }
  ): Promise<null>
}

declare global {
  const webflow: WebflowGlobal
}

export {}


