import type { NodeBox, NodeBoxes } from '../../../../tooling/preview/protocol'
import type { BreakdownNode } from '../../../../tooling/systems/breakdown'

/**
 * The least zoom a card's piece is drawn live at: below it the pieces are
 * too small to read, and a large tree would mount a frame for every card.
 */
export const LIVE_ZOOM = 0.4

/** Room left around a piece that has to shrink to fit its card. */
const MARGIN = 8

/**
 * The IDs of the pieces a list draws once per item: the repeated tags, and
 * everything inside them.
 */
export function onePerItem(tree: BreakdownNode) {
  const found = new Set<string>()
  const walk = (node: BreakdownNode, inside: boolean) => {
    const repeated = inside || node.repeated
    if (repeated) found.add(node.id)
    for (const child of node.children) walk(child, repeated)
  }
  walk(tree, false)
  return found
}

const union = (boxes: NodeBox[]): NodeBox => {
  const left = Math.min(...boxes.map(({ x }) => x))
  const top = Math.min(...boxes.map(({ y }) => y))
  const right = Math.max(...boxes.map(({ x, width }) => x + width))
  const bottom = Math.max(...boxes.map(({ y, height }) => y + height))
  return { x: left, y: top, width: right - left, height: bottom - top }
}
const takesRoom = (box: NodeBox) => box.width > 0 && box.height > 0

/**
 * Where a card's piece is in the rendered component, as its document
 * reported: a theme slot's element inside its piece, or the piece's own
 * elements (all of them, or the first item's when a list draws it once per
 * item). An element that takes no room of its own (a sidebar whose
 * container is fixed inside it) is widened to its theme slots, then to the
 * pieces inside it. Null when it isn't rendered or takes no room.
 */
export function pieceBox(
  nodes: Record<string, NodeBoxes>,
  node: Pick<BreakdownNode, 'id' | 'slot' | 'children'>,
  perItem: ReadonlySet<string>,
): NodeBox | null {
  const once = perItem.has(node.id)
  if (node.slot) {
    const found =
      nodes[node.id.slice(0, node.id.lastIndexOf('#'))]?.slots[node.slot]?.[0]
    return found && takesRoom(found) ? found : null
  }
  const reported = nodes[node.id]
  if (!reported?.boxes.length) return null
  const widen = [
    () => (once ? reported.boxes.slice(0, 1) : reported.boxes),
    () =>
      Object.values(reported.slots).flatMap((boxes) =>
        once ? boxes.slice(0, 1) : boxes,
      ),
    () =>
      node.children.flatMap((child) => {
        const found = child.slot ? null : pieceBox(nodes, child, perItem)
        return found ? [found] : []
      }),
  ]
  const boxes: NodeBox[] = []
  for (const more of widen) {
    boxes.push(...more())
    const around = union(boxes)
    if (takesRoom(around)) return around
  }
  return null
}

/**
 * How a piece sits in its card's inset: at its own size, or shrunk to fit
 * inside a margin, and centred.
 */
export function fitPiece(
  box: NodeBox,
  room: { width: number; height: number },
) {
  const scale = Math.min(
    1,
    (room.width - 2 * MARGIN) / box.width,
    (room.height - 2 * MARGIN) / box.height,
  )
  const width = box.width * scale
  const height = box.height * scale
  return {
    scale,
    left: (room.width - width) / 2,
    top: (room.height - height) / 2,
    width,
    height,
  }
}
