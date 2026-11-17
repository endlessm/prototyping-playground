// The Breakdown canvas's plain functions: the tree laid out top-down, the
// zoom steps, and how each piece's source and file read on its card.
import type {
  BreakdownNode,
  BreakdownSource,
} from '../../../../tooling/systems/breakdown'

export interface LaidOutCard {
  node: BreakdownNode
  depth: number
  x: number
  y: number
  width: number
  height: number
}

/** A Nuxt UI piece's theme slots, drawn as a grid under it. */
export interface LaidOutGroup {
  id: string
  parent: LaidOutCard
  cards: LaidOutCard[]
  x: number
  y: number
  width: number
  height: number
}

export interface LaidOutEdge {
  /** The child card's node ID, or the slot grid's (`<piece>#slots`). */
  id: string
  from: LaidOutCard
  to: { x: number; y: number; width: number; height: number }
  /** The piece the edge's chip names. */
  child: BreakdownNode
}

export interface TreeLayout {
  cards: LaidOutCard[]
  groups: LaidOutGroup[]
  edges: LaidOutEdge[]
  width: number
  height: number
}

/** Room between sibling cards, and between a card and its children's row. */
export const CARD_GAP = { x: 32, y: 96 }
/** Room around the tree, inside the canvas. */
export const CANVAS_PADDING = 48
/** Columns of a piece's slot grid, the room between its cards and around them. */
const GRID = { columns: 3, gap: 12, padding: 12 }

const isSlot = (node: BreakdownNode) =>
  node.kind === 'slot' && node.children.length === 0

/**
 * Lays the tree out top-down: each subtree takes the width of its widest
 * row of children and a parent is centred over its children, so subtrees
 * never share a column and no two cards overlap; children start below
 * their own parent, so a tall piece pushes down only what is under it. A Nuxt UI
 * piece's theme slots go in a grid of up to three columns under it, first
 * among its children, so a piece with many slots stays compact.
 */
export function layoutTree(
  root: BreakdownNode,
  sizeOf: (node: BreakdownNode) => { width: number; height: number },
  gap = CARD_GAP,
): TreeLayout {
  const span = new Map<BreakdownNode, number>()
  const grids = new Map<
    BreakdownNode,
    {
      slots: BreakdownNode[]
      columns: number
      cell: { width: number; height: number }
      width: number
      height: number
    }
  >()
  const measure = (node: BreakdownNode): number => {
    const { width } = sizeOf(node)
    const slots = node.children.filter(isSlot)
    const parts: number[] = []
    if (slots.length) {
      const columns = Math.min(GRID.columns, slots.length)
      const lines = Math.ceil(slots.length / columns)
      const sizes = slots.map(sizeOf)
      const cell = {
        width: Math.max(...sizes.map((size) => size.width)),
        height: Math.max(...sizes.map((size) => size.height)),
      }
      const grid = {
        slots,
        columns,
        cell,
        width:
          columns * cell.width + (columns - 1) * GRID.gap + 2 * GRID.padding,
        height: lines * cell.height + (lines - 1) * GRID.gap + 2 * GRID.padding,
      }
      grids.set(node, grid)
      parts.push(grid.width)
    }
    for (const child of node.children)
      if (!isSlot(child)) parts.push(measure(child))
    const children = parts.reduce(
      (sum, part, index) => sum + (index ? gap.x : 0) + part,
      0,
    )
    const total = Math.max(width, children)
    span.set(node, total)
    return total
  }
  const width = measure(root)

  const cards: LaidOutCard[] = []
  const groups: LaidOutGroup[] = []
  const edges: LaidOutEdge[] = []
  const place = (
    node: BreakdownNode,
    depth: number,
    left: number,
    top: number,
  ) => {
    const size = sizeOf(node)
    const total = span.get(node)!
    const grid = grids.get(node)
    const branches = node.children.filter((child) => !isSlot(child))
    const parts = [
      ...(grid ? [grid.width] : []),
      ...branches.map((child) => span.get(child)!),
    ]
    const children = parts.reduce(
      (sum, part, index) => sum + (index ? gap.x : 0) + part,
      0,
    )
    const card: LaidOutCard = {
      node,
      depth,
      x: left + (total - size.width) / 2,
      y: top,
      ...size,
    }
    cards.push(card)
    const below = top + size.height + gap.y
    let next = left + (total - children) / 2
    if (grid) {
      const group: LaidOutGroup = {
        id: `${node.id}#slots`,
        parent: card,
        cards: [],
        x: next,
        y: below,
        width: grid.width,
        height: grid.height,
      }
      grid.slots.forEach((slot, index) => {
        const column = index % grid.columns
        const line = Math.floor(index / grid.columns)
        const placed: LaidOutCard = {
          node: slot,
          depth: depth + 1,
          x: group.x + GRID.padding + column * (grid.cell.width + GRID.gap),
          y: group.y + GRID.padding + line * (grid.cell.height + GRID.gap),
          ...sizeOf(slot),
        }
        group.cards.push(placed)
        cards.push(placed)
      })
      groups.push(group)
      edges.push({ id: group.id, from: card, to: group, child: grid.slots[0]! })
      next += grid.width + gap.x
    }
    for (const child of branches) {
      const placed = place(child, depth + 1, next, below)
      edges.push({ id: child.id, from: card, to: placed, child })
      next += span.get(child)! + gap.x
    }
    return card
  }
  place(root, 0, 0, 0)
  // Edges in the tree's reading order: a parent's, then each child's own.
  const order = new Map(cards.map((card, index) => [card.node.id, index]))
  const rank = (edge: LaidOutEdge) => order.get(edge.child.id)!
  edges.sort((a, b) => rank(a) - rank(b))
  return {
    cards,
    groups,
    edges,
    width,
    height: Math.max(
      ...cards.map((card) => card.y + card.height),
      ...groups.map((group) => group.y + group.height),
    ),
  }
}

/** The zoom levels the toolbar's − and + move along. */
export const ZOOM_STEPS = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4]
export const MIN_ZOOM = ZOOM_STEPS[0]!
export const MAX_ZOOM = ZOOM_STEPS.at(-1)!

/** The next zoom step in or out (`direction` 1 or -1) from any zoom. */
export function zoomStep(zoom: number, direction: 1 | -1) {
  const found =
    direction > 0
      ? ZOOM_STEPS.find((step) => step > zoom + 1e-6)
      : ZOOM_STEPS.findLast((step) => step < zoom - 1e-6)
  return found ?? (direction > 0 ? MAX_ZOOM : MIN_ZOOM)
}

export const clampZoom = (zoom: number) =>
  Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))

/**
 * Each source's chip: its icon and colours (`--color-source-*` in the
 * studio's stylesheet). A source keeps its colour on every card, so the
 * chips read at a glance.
 */
export const SOURCE_CHIPS: Record<
  BreakdownSource,
  { icon: string; class: string }
> = {
  'nuxt-ui': {
    icon: 'i-lucide-slash',
    class: 'bg-source-nuxt-ui/8 text-source-nuxt-ui ring-source-nuxt-ui/20',
  },
  app: {
    icon: 'i-lucide-app-window',
    class: 'bg-source-app/8 text-source-app ring-source-app/20',
  },
  icons: {
    icon: 'i-lucide-shapes',
    class: 'bg-source-icons/8 text-source-icons ring-source-icons/20',
  },
  system: {
    icon: 'i-lucide-component',
    class: 'bg-source-system/8 text-source-system ring-source-system/20',
  },
  experiment: {
    icon: 'i-lucide-flask-conical',
    class:
      'bg-source-experiment/8 text-source-experiment ring-source-experiment/20',
  },
}

/** A node's file as its card writes it: inside the system's folder when there. */
export function cardFile(file: string | null, systemFolder: string) {
  if (!file) return null
  const prefix = `${systemFolder}/`
  return file.startsWith(prefix) ? file.slice(prefix.length) : file
}

/**
 * The file holding a piece's tag when it isn't the tree's own file (a tag
 * inside an app component the file imports), or null. A theme slot's piece
 * is its Nuxt UI tag's.
 */
export function pieceElsewhere(tree: BreakdownNode, id: string) {
  const piece = id.split('#')[0]!
  const owner = piece.slice(0, piece.lastIndexOf('>'))
  if (!owner || owner === tree.id) return null
  return treeNodes(tree).find((node) => node.id === owner)?.file ?? null
}

/** Every node of the tree, parents first. */
export const treeNodes = (node: BreakdownNode): BreakdownNode[] => [
  node,
  ...node.children.flatMap(treeNodes),
]
