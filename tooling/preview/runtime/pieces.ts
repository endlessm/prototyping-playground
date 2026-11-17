// Runs inside a Breakdown's preview document: which piece a theme slot's
// element belongs to. Pieces mark their elements with `data-lab-node`
// (space-separated, since a wrapper and the tag it renders share one); a
// slot belongs to the nearest marked element's deepest piece, so a modal's
// trigger button keeps its own slots and a piece inside another keeps its.

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
