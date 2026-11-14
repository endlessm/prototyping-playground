// The map's zoom and pan as plain numbers: where the stage sits in the canvas (`x`, `y`, in canvas pixels) and how
// much it is scaled. `MapCanvas.vue` owns the state and the pointer; everything here is pure so it can be checked
// without a browser.

export interface Size {
  width: number
  height: number
}

/** The canvas: its size, and where the map may start at the top when it fits (below the zoom bar). */
export interface Space extends Size {
  top?: number
}

export interface Point {
  x: number
  y: number
}

export interface View extends Point {
  scale: number
}

/** How much bigger than its design size the fitted map may grow on a wide preview. */
export const FIT_MAX = 1.25
/** Breathing room between the map and the canvas's edge. */
export const FIT_MARGIN = 8
/** Where a fitted map may start at the top: below the zoom bar (12 px from the edge, 38 px tall) and a gap. */
export const ZOOM_BAR_BAND = 56
/** Furthest the map zooms out, unless the fit itself is smaller. */
export const ZOOM_MIN = 0.4
/** Furthest the map zooms in, unless the fit itself is bigger. */
export const ZOOM_MAX = 2
/** The scales the − and + buttons step through; the fit sits wherever it falls between them. */
export const ZOOM_STEPS = [0.4, 0.5, 0.6, 0.75, 0.9, 1, 1.25, 1.5, 1.75, 2]

/** Two scales closer than this are the same step, so a fit of 0.7499 doesn't step to 0.75. */
const SAME = 0.01

/** The scale that shows the whole map in the space, centred, as the map opens. */
export function fitScale(space: Space, map: Size): number {
  if (!space.width || !space.height || !map.width || !map.height) return 1
  const scale = Math.min(
    (space.width - 2 * FIT_MARGIN) / map.width,
    (space.height - topOf(space) - FIT_MARGIN) / map.height,
    FIT_MAX,
  )
  return Math.max(scale, 0.05)
}

/** The scales the map may take in this space: from the fit (or `ZOOM_MIN`, whichever is smaller) up to `ZOOM_MAX`. */
export function scaleRange(space: Space, map: Size): [number, number] {
  const fit = fitScale(space, map)
  return [Math.min(ZOOM_MIN, fit), Math.max(ZOOM_MAX, fit)]
}

export function fitView(space: Space, map: Size): View {
  return clampView({ x: 0, y: 0, scale: fitScale(space, map) }, space, map)
}

/**
 * Keeps the map where it can be seen: on an axis where it fits, it is centred (below the zoom bar when there is room);
 * on an axis where it is bigger than the space, it can be dragged until its edge reaches the margin, never further.
 */
export function clampView(view: View, space: Space, map: Size): View {
  const [min, max] = scaleRange(space, map)
  const scale = Math.min(Math.max(view.scale, min), max)
  return {
    scale,
    x: clampAxis(view.x, space.width, map.width * scale, FIT_MARGIN),
    y: clampAxis(view.y, space.height, map.height * scale, topOf(space)),
  }
}

function topOf(space: Space): number {
  return Math.max(space.top ?? 0, FIT_MARGIN)
}

function clampAxis(offset: number, space: number, size: number, start: number): number {
  const end = space - FIT_MARGIN
  if (size <= end - start) return start + (end - start - size) / 2
  if (size + 2 * FIT_MARGIN <= space) return (space - size) / 2
  return Math.min(Math.max(offset, space - size - FIT_MARGIN), FIT_MARGIN)
}

/** Scales the map to `scale`, keeping the map point under `at` (canvas pixels) where it is. */
export function zoomTo(view: View, scale: number, at: Point, space: Space, map: Size): View {
  const [min, max] = scaleRange(space, map)
  const next = Math.min(Math.max(scale, min), max)
  const ratio = next / view.scale
  return clampView({ scale: next, x: at.x - (at.x - view.x) * ratio, y: at.y - (at.y - view.y) * ratio }, space, map)
}

/** The next scale the + (`1`) or − (`-1`) button goes to from `scale`, within the range. */
export function stepScale(scale: number, direction: 1 | -1, space: Space, map: Size): number {
  const [min, max] = scaleRange(space, map)
  const steps = ZOOM_STEPS.filter((s) => s >= min - SAME && s <= max + SAME)
  const next =
    direction > 0 ? steps.find((s) => s > scale + SAME) : [...steps].reverse().find((s) => s < scale - SAME)
  return Math.min(Math.max(next ?? (direction > 0 ? max : min), min), max)
}

export function panBy(view: View, dx: number, dy: number, space: Space, map: Size): View {
  return clampView({ ...view, x: view.x + dx, y: view.y + dy }, space, map)
}

/** Whether the map is bigger than the space on either axis, so dragging can move it. */
export function canPan(view: View, space: Size, map: Size): boolean {
  return (
    map.width * view.scale + 2 * FIT_MARGIN > space.width + 0.5 ||
    map.height * view.scale + 2 * FIT_MARGIN > space.height + 0.5
  )
}
