import type { ReferenceAdapter } from '../../../tooling/files/references.ts'

// A canvas element's link. Items are linked by their permanent addresses,
// which never change when files move; a link to a file, relative to the
// canvas, follows the file. In a copied prototype, items link to the copied
// artifacts. Either way the element gets a new version, the way Excalidraw
// records an edit, so an open canvas takes it in. Everything else in the
// scene stays as it is. `updated` is never stored (`types/canvas/format.ts`).
function relink(source: string, link: (value: string) => string) {
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
    const next = link(element.link)
    if (next === element.link) continue
    element.link = next
    element.version = ((element.version as number) ?? 0) + 1
    element.versionNonce = Math.floor(Math.random() * 2 ** 31)
    changed = true
  }
  return changed ? `${JSON.stringify(scene, null, 2)}\n` : source
}

const ADDRESS = /^\/prototypes\/([^/?#]+)\/artifacts\/([^/?#]+)/

export const references: ReferenceAdapter[] = [
  {
    extensions: ['.excalidraw'],
    move: (source, _file, context) => relink(source, context.link),
    copy: (source, _file, ids) =>
      relink(source, (link) =>
        link.replace(ADDRESS, (address, prototype: string, artifact: string) =>
          ids.has(prototype) || ids.has(artifact)
            ? `/prototypes/${ids.get(prototype) ?? prototype}/artifacts/${ids.get(artifact) ?? artifact}`
            : address,
        ),
      ),
  },
]
