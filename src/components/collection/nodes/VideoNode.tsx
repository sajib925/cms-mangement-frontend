import { DecoratorNode } from "lexical";
import type { DOMConversionMap, DOMExportOutput } from "lexical";
import type { ReactElement } from "react";

export class VideoNode extends DecoratorNode<ReactElement> {
  __src: string;

  static getType(): string {
    return "video";
  }

  static clone(node: VideoNode): VideoNode {
    return new VideoNode(node.__src);
  }

  constructor(src: string) {
    super();
    this.__src = src;
  }

  createDOM(): HTMLElement {
    const video = document.createElement("video");
    video.src = this.__src;
    video.controls = true;
    video.className = "my-4 rounded";
    return video;
  }

  exportDOM(): DOMExportOutput {
    return {
      element: this.createDOM(),
    };
  }

  static importDOM(): DOMConversionMap {
    return {
      video: () => ({
        conversion: (domNode: HTMLElement) => ({
          node: new VideoNode((domNode as HTMLVideoElement).src),
        }),
        priority: 1,
      }),
    };
  }

  static importJSON(serializedNode: any): VideoNode {
    return new VideoNode(serializedNode.src);
  }

  exportJSON(): any {
    return {
      type: "video",
      version: 1,
      src: this.__src,
    };
  }

  decorate(): ReactElement {
    return (
      <video src={this.__src} controls className="my-4 rounded">
        Your browser does not support the video tag.
      </video>
    );
  }
}

export function $createVideoNode(src: string): VideoNode {
  return new VideoNode(src);
}

export function $isVideoNode(node: any): node is VideoNode {
  return node instanceof VideoNode;
}
