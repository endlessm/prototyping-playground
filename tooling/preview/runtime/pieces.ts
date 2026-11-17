// Runs inside a Breakdown's preview document: what its outlines and knob
// highlights share. The layer they draw on, over everything in the page;
// where a box sits on it; and which piece a theme slot's element belongs
// to. Pieces mark their elements with `data-lab-node` (space-separated,
// since a wrapper and the tag it renders share one); a slot belongs to the
// nearest marked element's deepest piece, so a modal's trigger button keeps
// its own slots and a piece inside another keeps its.

import type { NodeBox } from '../protocol.ts'

/** A layer over the whole document, marked `data-<name>`, never clicked. */
export function overlayLayer(name: string) {
  const layer = document.createElement('div')
  layer.setAttribute(`data-${name}`, '')
  layer.setAttribute('aria-hidden', 'true')
  layer.style.cssText =
    'position: absolute; inset: 0 auto auto 0; width: 0; height: 0; pointer-events: none; z-index: 2147483647;'
  document.documentElement.append(layer)
  return layer
}

/** Where a box, in page pixels, sits on an overlay layer. */
export const place = ({ x, y, width, height }: NodeBox) =>
  `left: ${x}px; top: ${y}px; width: ${width}px; height: ${height}px;`

/** Whether a piece's ID names a piece inside `id`, in the same file or past it. */
const inside = (other: string, id: string) =>
  other.startsWith(`${id}/`) || other.startsWith(`${id}>`)

/** Whether the theme slot element `part` is a slot of the piece `id`. */
export function ownsSlot(part: Element, id: string) {
  const ids = part.closest('[data-lab-node]')?.getAttribute('data-lab-node')
  if (!ids) return false
  const owners = ids.split(' ')
  return owners.includes(id) && !owners.some((other) => inside(other, id))
}
