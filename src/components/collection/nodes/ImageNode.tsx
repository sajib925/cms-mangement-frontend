import { DecoratorNode } from "lexical";
import type { DOMConversionMap, DOMExportOutput } from "lexical";
import type { ReactElement } from "react";

export class ImageNode extends DecoratorNode<ReactElement> {
  __src: string

  static getType(): string {
    return "image"
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src)
  }

  constructor(src: string) {
    super()
    this.__src = src
  }

  createDOM(): HTMLElement {
    const img = document.createElement("img")
    img.src = this.__src
    img.alt = "Image"
    img.className = "my-4 rounded"
    return img
  }

  exportDOM(): DOMExportOutput {
    return {
      element: this.createDOM(),
    }
  }

  static importDOM(): DOMConversionMap {
    return {
      img: () => ({
        conversion: (domNode: HTMLElement) => ({
          node: new ImageNode((domNode as HTMLImageElement).src),
        }),
        priority: 1,
      }),
    }
  }

  static importJSON(serializedNode: any): ImageNode {
    return new ImageNode(serializedNode.src)
  }

  exportJSON(): any {
    return {
      type: "image",
      version: 1,
      src: this.__src,
    }
  }

  decorate(): ReactElement {
    return <img src={this.__src} alt="image" className="my-4 rounded" />
  }
}

export function $createImageNode(src: string): ImageNode {
  return new ImageNode(src)
}

export function $isImageNode(node: any): node is ImageNode {
  return node instanceof ImageNode
}
