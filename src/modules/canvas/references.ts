import type { ReferenceAdapter } from '../../../tooling/files/references.ts'

// A canvas element's link. Items are linked by their permanent addresses,
// which never change; a link to a file, relative to the canvas, follows the
// file as a new version of its element, the way Excalidraw records an edit.
// `updated` is never stored (`types/canvas/format.ts`).
export const references: ReferenceAdapter[] = [
  {
    extensions: ['.excalidraw'],
    move(source, _file, context) {
      let scene: { elements?: Record<string, unknown>[] }
      try {
        scene = JSON.parse(source)
      } catch {
        // A broken canvas is left for its own check to report.
        return source
      }
      let changed = false
      for (const element of scene.elements ?? []) {
        if (typeof element.link !== 'string') continue
        const next = context.link(element.link)
        if (next === element.link) continue
        element.link = next
        element.version = ((element.version as number) ?? 0) + 1
        element.versionNonce = Math.floor(Math.random() * 2 ** 31)
        changed = true
      }
      return changed ? `${JSON.stringify(scene, null, 2)}\n` : source
    },
  },
]
