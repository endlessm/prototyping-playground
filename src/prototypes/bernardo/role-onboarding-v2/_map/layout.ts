// Canvas geometry, in design pixels before the canvas scales to fit. Tiles sit where the story places them on the
// grid; areas wrap whatever they contain plus padding, so adding a tile to an area grows it and every area around
// it. Arrows read anchors from this layout instead of measuring the page.

import type { GridPoint, NodeId, PlaceId, Story } from './story'

/** One grid cell, the spacing of the canvas's dots. */
export const GRID = 20
export const TILE = { width: 120, height: 136 }
/** Room around an area's contents; the top leaves space for the area's tab, which straddles its border. */
export const AREA_PADDING = { side: 24, top: 48, bottom: 24 }
/** Space between the outermost areas and the canvas's edge. */
export const CANVAS_MARGIN = 16
/** The narrowest an area gets, so its tab never overflows it. */
export const AREA_MIN_WIDTH = 196

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** Something else an area must wrap, such as the Programs shelf, with its own size. */
export interface MapBox {
  id: string
  place: PlaceId
  rect: Rect
}

export interface MapLayout {
  nodes: Record<NodeId, Rect>
  areas: Record<PlaceId, Rect>
  boxes: Record<string, Rect>
  /** Areas from the outermost in, so inner ones paint on top. */
  areaOrder: PlaceId[]
  width: number
  height: number
}

export const atGrid = (point: GridPoint): { x: number; y: number } => ({ x: point.col * GRID, y: point.row * GRID })

function bounds(rects: Rect[]): Rect | null {
  if (!rects.length) return null
  const left = Math.min(...rects.map((r) => r.x))
  const top = Math.min(...rects.map((r) => r.y))
  const right = Math.max(...rects.map((r) => r.x + r.width))
  const bottom = Math.max(...rects.map((r) => r.y + r.height))
  return { x: left, y: top, width: right - left, height: bottom - top }
}

function depth(story: Story, id: PlaceId): number {
  const parent = story.places[id]?.parent
  return parent ? depth(story, parent) + 1 : 0
}

/** Lays out every tile and area of a story, whatever step is showing, so nothing moves as the story plays. */
export function computeLayout(story: Story, boxes: MapBox[] = []): MapLayout {
  const nodes: Record<NodeId, Rect> = {}
  for (const [id, point] of Object.entries(story.positions)) {
    nodes[id] = { ...atGrid(point), ...TILE }
  }

  const areas: Record<PlaceId, Rect> = {}
  const areaOf = (place: PlaceId): Rect | null => {
    if (areas[place]) return areas[place]
    const contents = [
      ...Object.values(story.nodes)
        .filter((node) => node.place === place && nodes[node.id])
        .map((node) => nodes[node.id]),
      ...boxes.filter((box) => box.place === place).map((box) => box.rect),
      ...Object.values(story.places)
        .filter((child) => child.parent === place)
        .map((child) => areaOf(child.id))
        .filter((rect): rect is Rect => rect !== null),
    ]
    const inner = bounds(contents)
    if (!inner) return null
    const rect = {
      x: inner.x - AREA_PADDING.side,
      y: inner.y - AREA_PADDING.top,
      width: Math.max(inner.width + 2 * AREA_PADDING.side, AREA_MIN_WIDTH),
      height: inner.height + AREA_PADDING.top + AREA_PADDING.bottom,
    }
    areas[place] = rect
    return rect
  }
  Object.keys(story.places).forEach(areaOf)

  const all = bounds([...Object.values(nodes), ...Object.values(areas), ...boxes.map((box) => box.rect)])
  return {
    nodes,
    areas,
    boxes: Object.fromEntries(boxes.map((box) => [box.id, box.rect])),
    areaOrder: Object.keys(areas).sort((a, b) => depth(story, a) - depth(story, b)),
    width: (all ? all.x + all.width : 0) + CANVAS_MARGIN,
    height: (all ? all.y + all.height : 0) + CANVAS_MARGIN,
  }
}

export type Side = 'top' | 'right' | 'bottom' | 'left'

/** A point on a rect's side, `offset` of the way along it (0.5 is the middle), for an arrow to leave or reach. */
export function anchor(rect: Rect, side: Side, offset = 0.5): { x: number; y: number } {
  if (side === 'left') return { x: rect.x, y: rect.y + rect.height * offset }
  if (side === 'right') return { x: rect.x + rect.width, y: rect.y + rect.height * offset }
  if (side === 'top') return { x: rect.x + rect.width * offset, y: rect.y }
  return { x: rect.x + rect.width * offset, y: rect.y + rect.height }
}
