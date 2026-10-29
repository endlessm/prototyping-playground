// Where a canvas opens, and where each person left it (per browser). The
// opening camera is worked out before Excalidraw's first paint, so the canvas
// doesn't draw at 100% and then jump. The camera is never written to the file.

const MIN_ZOOM = 0.1
const MAX_ZOOM = 30 // Excalidraw's own limits
export const CAMERA_SAVE_DELAY_MS = 400

/** Where this browser remembers a canvas's camera, by its permanent ID. */
export const cameraKey = (artifactId: string) =>
  `design-studio:canvas-camera:${artifactId}`

export interface Camera {
  scrollX: number
  scrollY: number
  zoom: { value: number }
}
interface Box {
  x: number
  y: number
  width: number
  height: number
  isDeleted?: boolean
}

/**
 * The remembered camera (`saved`, as stored), else the whole canvas fitted to
 * the space: 90% of it, never above 100% zoom. Undefined when there is
 * nothing to fit.
 */
export function initialCamera(
  elements: readonly Box[],
  saved: string | null,
  size: { width: number; height: number },
): Camera | undefined {
  try {
    const camera = JSON.parse(saved || 'null')
    // A bad saved camera (zoom 0, a null scroll) would open the canvas blank
    // every time.
    if (
      camera &&
      Number.isFinite(camera.scrollX) &&
      Number.isFinite(camera.scrollY) &&
      Number.isFinite(camera.zoom) &&
      camera.zoom >= MIN_ZOOM &&
      camera.zoom <= MAX_ZOOM
    )
      return {
        scrollX: camera.scrollX,
        scrollY: camera.scrollY,
        zoom: { value: camera.zoom },
      }
  } catch {
    // Fit instead.
  }
  const live = elements.filter((element) => !element.isDeleted)
  if (!live.length || !size.width || !size.height) return undefined
  const minX = Math.min(...live.map((element) => element.x))
  const minY = Math.min(...live.map((element) => element.y))
  const maxX = Math.max(...live.map((element) => element.x + element.width))
  const maxY = Math.max(...live.map((element) => element.y + element.height))
  const zoom = Math.min(
    1,
    Math.max(
      MIN_ZOOM,
      0.9 *
        Math.min(
          size.width / (maxX - minX || 1),
          size.height / (maxY - minY || 1),
        ),
    ),
  )
  return {
    scrollX: size.width / (2 * zoom) - (minX + maxX) / 2,
    scrollY: size.height / (2 * zoom) - (minY + maxY) / 2,
    zoom: { value: zoom },
  }
}

/** The camera as this browser stores it. */
export const storedCamera = ({ scrollX, scrollY, zoom }: Camera) =>
  JSON.stringify({ scrollX, scrollY, zoom: zoom.value })
