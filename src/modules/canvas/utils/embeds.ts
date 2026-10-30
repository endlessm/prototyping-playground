// How items sit on a canvas. An item is a stock Excalidraw `embeddable`
// whose `link` is an artifact's address, so Excalidraw owns paste, drop,
// selection, moving and resizing. These rules size and style new items and
// decide, as the camera moves, which are drawn and which are live.
// Framework-neutral, so they are tested alone.

/** The shared frame's header. */
export const EMBED_HEADER_HEIGHT = 36
/** The frame's border, a pixel on each side. */
export const EMBED_BORDER = 2
/** A card's height: one row. */
export const ITEM_CARD_HEIGHT = 88
const DEFAULT_WIDTH = 480
// A 1440 × 900 screen at the default width.
const DEFAULT_BODY_HEIGHT = Math.round((DEFAULT_WIDTH * 900) / 1440)
/** Beyond this many screen pixels outside the view an item isn't painted. */
const CULL_MARGIN_PX = 400
/** Below this zoom a preview is unreadable: items show their name instead. */
export const OVERVIEW_ZOOM = 0.12

interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** The part of Excalidraw's state the camera rules read. */
export interface CanvasView {
  scrollX: number
  scrollY: number
  zoom: { value: number }
  width: number
  height: number
}

/** A new item's size: a screen with its header for a live preview, else a card. */
export const itemSize = (preview: boolean) => ({
  width: DEFAULT_WIDTH,
  height: preview
    ? EMBED_HEADER_HEIGHT + EMBED_BORDER + DEFAULT_BODY_HEIGHT
    : ITEM_CARD_HEIGHT,
})

const ITEM_LOOK = {
  roundness: null,
  strokeColor: 'transparent',
} as const

/**
 * What an item needs changed to look like one: no outline, no rounded
 * corners, no link icon (the title bar is the link; `hideLinkIcon` is read
 * by the Excalidraw patch). One just `placed` by dropping or pasting (not
 * yet marked `frame`) is also sized and centered where it landed; one
 * written into the file keeps its place and size. Null when it is fine.
 */
export function normalizedItem(
  element: Box & {
    roundness: unknown
    strokeColor: string
    customData?: Record<string, unknown> | null
  },
  preview: boolean,
  placed = true,
) {
  const data = element.customData ?? {}
  if (
    data.frame &&
    data.hideLinkIcon &&
    element.roundness === null &&
    element.strokeColor === ITEM_LOOK.strokeColor
  )
    return null
  const customData = { ...data, frame: true, hideLinkIcon: true }
  if (data.frame || !placed) return { ...ITEM_LOOK, customData }
  // Excalidraw puts a new embed's corner where it was dropped or pasted.
  const size = itemSize(preview)
  return {
    x: element.x - size.width / 2,
    y: element.y - size.height / 2,
    ...size,
    ...ITEM_LOOK,
    customData,
  }
}

/**
 * Whether an element is far off screen (not painted), and whether the
 * canvas is zoomed out too far to read it. Each flips only at an edge, so a
 * still canvas doesn't re-render.
 */
export function renderFlags(
  element: Box,
  view: CanvasView,
  marginPx = CULL_MARGIN_PX,
) {
  const zoom = view.zoom.value || 1
  const margin = marginPx / zoom
  const left = -view.scrollX - margin
  const top = -view.scrollY - margin
  const right = -view.scrollX + view.width / zoom + margin
  const bottom = -view.scrollY + view.height / zoom + margin
  const offscreen =
    element.x > right ||
    element.x + element.width < left ||
    element.y > bottom ||
    element.y + element.height < top
  return { offscreen, overview: zoom < OVERVIEW_ZOOM }
}

/**
 * The items whose live previews the opening waits for: those in the first
 * view itself, not the preloading margin.
 */
export function openingEmbedIds(
  elements: readonly (Box & {
    id: string
    type: string
    link?: string | null
    isDeleted?: boolean
  })[],
  view: CanvasView,
  preview: (link: string) => boolean,
) {
  return elements
    .filter((element) => {
      if (element.type !== 'embeddable' || element.isDeleted || !element.link)
        return false
      const { offscreen, overview } = renderFlags(element, view, 0)
      return !offscreen && !overview && preview(element.link)
    })
    .map((element) => element.id)
}
