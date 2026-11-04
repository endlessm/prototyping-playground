// The canvas's React island. Excalidraw is a React component, so the Vue
// page mounts it in a React root of its own; React and React DOM are used
// nowhere else. Loaded when the first canvas opens, so neither is in the
// studio's main bundle.
import '@excalidraw/excalidraw/index.css'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import './canvas.css'
import { CanvasEditor, type CanvasEditorProps } from './Editor'
import { CanvasPreview, type CanvasPreviewProps } from './Preview'

export type {
  CanvasEditorProps,
  CanvasHandle,
  CanvasItemHost,
  CanvasItemState,
} from './Editor'

export type { CanvasPreviewHandle, CanvasPreviewProps } from './Preview'

/** A canvas's read-only, fitted picture, inside a document. */
export function mountPreview(element: HTMLElement, props: CanvasPreviewProps) {
  const root = createRoot(element)
  root.render(createElement(CanvasPreview, props))
  return {
    update: (next: CanvasPreviewProps) =>
      root.render(createElement(CanvasPreview, next)),
    unmount: () => root.unmount(),
  }
}

export function mountCanvas(element: HTMLElement, props: CanvasEditorProps) {
  const root = createRoot(element)
  root.render(createElement(CanvasEditor, props))
  return {
    unmount: () => root.unmount(),
  }
}
