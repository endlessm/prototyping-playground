// The canvas's React island. Excalidraw is a React component, so the Vue
// page mounts it in a React root of its own; React and React DOM are used
// nowhere else. Loaded when the first canvas opens, so neither is in the
// studio's main bundle.
import '@excalidraw/excalidraw/index.css'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import './canvas.css'
import { CanvasEditor, type CanvasEditorProps } from './Editor'

export type {
  CanvasEditorProps,
  CanvasHandle,
  CanvasItemHost,
  CanvasItemState,
} from './Editor'

export function mountCanvas(element: HTMLElement, props: CanvasEditorProps) {
  const root = createRoot(element)
  root.render(createElement(CanvasEditor, props))
  return {
    update: (next: CanvasEditorProps) =>
      root.render(createElement(CanvasEditor, next)),
    unmount: () => root.unmount(),
  }
}
