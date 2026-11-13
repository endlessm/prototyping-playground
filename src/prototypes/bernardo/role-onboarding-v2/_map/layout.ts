// Canvas geometry, in design pixels before the canvas scales to fit. Tiles sit where the story places them on the
// grid; areas wrap whatever they contain plus padding, so adding a tile to an area grows it and every area around
// it. Arrows read anchors from this layout instead of measuring the page.

import { shelfPrograms } from './programs'
import { placeDetail, type GridPoint, type NodeId, type PlaceId, type PlaceKind, type Story } from './story'

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

/** Something else on the canvas with its own size: inside an area it grows (the Programs shelf), or loose (`null`). */
export interface MapBox {
  id: string
  place: PlaceId | null
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
      // An area holding a single tile still fits its tab, which may run up to the far edge (the estimate is generous).
      width: Math.max(inner.width + 2 * AREA_PADDING.side, AREA_MIN_WIDTH, tabWidth(story, place) + TAB.inset),
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

const NARROW = new Set([..."iljtfr.,:;·' |I"])
const WIDE = new Set([...'mwMW@'])

/**
 * About how wide a line of text is in the map's sans-serif at `size` pixels, a little on the generous side, so labels
 * and tabs can be placed from data alone. Calibrated against the rendered pills and tabs.
 */
export function textWidth(text: string, size: number, weight: 'regular' | 'semibold' | 'bold' = 'regular'): number {
  let em = 0
  for (const char of text) {
    if (NARROW.has(char)) em += 0.3
    else if (WIDE.has(char)) em += 0.85
    else if (char >= 'A' && char <= 'Z') em += 0.66
    else em += 0.56
  }
  return em * size * (weight === 'bold' ? 1.06 : weight === 'semibold' ? 1.03 : 1)
}

/** An area's tab, which straddles its top edge (see `MapArea.vue`). Its width is estimated from its text. */
export const TAB = { inset: 20, height: 44, chrome: 64 }

/**
 * Which end of its top edge an area's tab sits at. A Cohort's goes on the right, as in the concept, so it stays clear
 * of the arrow that comes down into the Cohort from the Team Manager above it.
 */
export const tabSide = (kind: PlaceKind): 'left' | 'right' => (kind === 'Cohort' ? 'right' : 'left')

/** How wide an area's tab is, estimated from its name and its kind line. */
export function tabWidth(story: Story, id: PlaceId): number {
  const place = story.places[id]
  if (!place) return 0
  const detail = placeDetail(story, id)
  const meta = detail ? `${place.kind} · ${detail}` : place.kind
  return TAB.chrome + Math.max(textWidth(place.name, 14.5, 'bold'), textWidth(meta, 11, 'semibold'))
}

/** Where an area's tab sits, for arrows to reach it and to stay clear of it. */
export function tabRect(story: Story, layout: MapLayout, id: PlaceId): Rect | null {
  const area = layout.areas[id]
  const place = story.places[id]
  if (!area || !place) return null
  const width = tabWidth(story, id)
  const x = tabSide(place.kind) === 'right' ? area.x + area.width - TAB.inset - width : area.x + TAB.inset
  return { x, y: area.y - TAB.height / 2, width, height: TAB.height }
}

/** The Programs shelf: a header, then one row per Program. Rows have a fixed height so arrows can reach one. */
export const SHELF = { width: 272, top: 14, header: 40, row: 40, rowGap: 4, bottom: 12, gap: 2 * GRID }

export const shelfId = (place: PlaceId) => `programs:${place}`

export function shelfHeight(count: number): number {
  return SHELF.top + SHELF.header + count * (SHELF.row + SHELF.rowGap) + SHELF.bottom
}

/** The `index`th Program's row on a shelf. */
export function shelfRow(shelf: Rect, index: number): Rect {
  return {
    x: shelf.x + 12,
    y: shelf.y + SHELF.top + SHELF.header + SHELF.rowGap + index * (SHELF.row + SHELF.rowGap),
    width: shelf.width - 24,
    height: SHELF.row,
  }
}

/** The How to read legend, loose on the canvas at the bottom left; `entry` is the height of one of its lines. */
export const LEGEND = { id: 'legend', width: 196, height: 236, entry: 23 }

/** A story without a timeline drops the legend's two lines about steps: what happens now and what comes next. */
export const legendHeight = (story: Story): number => (story.timed ? LEGEND.height : LEGEND.height - 2 * LEGEND.entry)

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height

/**
 * The map's layout with its extras: a Programs shelf at the top right of each Organization, which grows around it,
 * and the legend in the bottom-left corner, or under everything when something already sits there.
 */
export function computeMapLayout(story: Story): MapLayout {
  const bare = computeLayout(story)
  const shelves: MapBox[] = Object.values(story.places)
    .filter((place) => place.kind === 'Organization' && bare.areas[place.id])
    .map((place) => {
      const inside = [
        ...Object.values(story.nodes)
          .filter((node) => node.place === place.id && bare.nodes[node.id])
          .map((node) => bare.nodes[node.id]),
        ...Object.values(story.places)
          .filter((child) => child.parent === place.id && bare.areas[child.id])
          .map((child) => bare.areas[child.id]),
      ]
      const area = bare.areas[place.id]
      const right = inside.length ? Math.max(...inside.map((r) => r.x + r.width)) : area.x + AREA_PADDING.side
      const top = inside.length ? Math.min(...inside.map((r) => r.y)) : area.y + AREA_PADDING.top
      const height = shelfHeight(shelfPrograms(story).length)
      return { id: shelfId(place.id), place: place.id, rect: { x: right + SHELF.gap, y: top, width: SHELF.width, height } }
    })

  const shelved = computeLayout(story, shelves)
  const corner = {
    x: CANVAS_MARGIN,
    y: shelved.height - CANVAS_MARGIN - legendHeight(story),
    width: LEGEND.width,
    height: legendHeight(story),
  }
  const taken = [...Object.values(shelved.areas), ...Object.values(shelved.nodes)]
  const rect = taken.some((r) => overlaps(r, corner)) ? { ...corner, y: shelved.height } : corner
  return computeLayout(story, [...shelves, { id: LEGEND.id, place: null, rect }])
}
