// The canvas file: an Excalidraw scene, kept small and stable so canvases
// diff cleanly and an agent can read and edit them. Pure, so the studio, the
// build and the command line share it.
//
// - Deleted elements are never stored (undoing a delete is in-memory
//   history).
// - An image's bytes are never stored here: each picture lives in its own
//   file in the prototype's `_canvas-images/` folder, named by Excalidraw's
//   file id, and `files` holds only each shown picture's id and type.
// - Fields at Excalidraw's default are dropped; Excalidraw fills them back
//   in on load. `version`, `versionNonce` and `index` are kept: merging
//   changes needs them.
// - Numbers are rounded, keys are sorted, and volatile fields (`updated`)
//   are dropped.
// - The camera is personal and never stored.

export type Stored = Record<string, unknown>

// Excalidraw's own file version (keeps the file opening on excalidraw.com).
const EXCALIDRAW_FILE_VERSION = 2
/**
 * The studio's version of the stored shape. Bump it when the shape changes,
 * and upgrade older files in `parseCanvas`. 2 added images; a canvas without
 * any is still written as 1, so a copy of the studio from before images can
 * keep editing it, and one with images opens there read-only instead of
 * losing them on its next save.
 */
export const FORMAT_VERSION = 2
const IMAGES_VERSION = 2

export const DEFAULT_BACKGROUND = '#ffffff'

/** The prototype folder holding its canvases' pictures, a helper rather than an artifact. */
export const IMAGE_FOLDER = '_canvas-images'

/**
 * The types a picture is stored as: SVG as it came, every other picture as
 * WebP, which keeps a screenshot well under the committed-file limit.
 */
export const IMAGE_TYPES = {
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
} as const
export type ImageType = keyof typeof IMAGE_TYPES

/** The type a picture of `mimeType` is stored as. */
export const storedImageType = (mimeType: string): ImageType =>
  mimeType === 'image/svg+xml' ? 'image/svg+xml' : 'image/webp'

/** Excalidraw's file ids: a SHA-1 of the picture, or a random fallback. */
export const isImageId = (id: unknown): id is string =>
  typeof id === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(id)

/** A picture's file inside its prototype, such as `_canvas-images/<id>.webp`. */
export const imagePath = (id: string, mimeType: ImageType) =>
  `${IMAGE_FOLDER}/${id}${IMAGE_TYPES[mimeType]}`

/** What the canvas file keeps of a picture: its id and stored type. */
export interface StoredImage {
  id: string
  mimeType: ImageType
}

export interface ParsedCanvas {
  studioId: string | null
  elements: Stored[]
  background: string
  gridSize: number | null
  /** The pictures its images show, by file id; their bytes are beside it. */
  files: Record<string, StoredImage>
  /** Written by a newer copy of the studio: open it, never save over it. */
  tooNew: boolean
}

// The well-formed entries of a file's `files`; the build's check names the
// rest.
function storedImages(files: unknown) {
  const out: Record<string, StoredImage> = {}
  if (!files || typeof files !== 'object') return out
  for (const [id, entry] of Object.entries(files as Record<string, unknown>)) {
    const mimeType = (entry as { mimeType?: unknown } | null)?.mimeType
    if (
      isImageId(id) &&
      typeof mimeType === 'string' &&
      mimeType in IMAGE_TYPES
    )
      out[id] = { id, mimeType: mimeType as ImageType }
  }
  return out
}

export function parseCanvas(text: string): ParsedCanvas {
  const file = JSON.parse(text) as {
    studioId?: unknown
    elements?: unknown
    appState?: { viewBackgroundColor?: string; gridSize?: number | null }
    files?: unknown
    studioVersion?: unknown
  } | null
  if (!file || typeof file !== 'object' || !Array.isArray(file.elements))
    throw new Error('This isn’t a canvas file: it has no list of elements.')
  const version = file.studioVersion ?? 1
  if (!Number.isInteger(version) || (version as number) < 1)
    throw new Error(
      `Unknown canvas version: ${JSON.stringify(file.studioVersion)}`,
    )
  return {
    studioId: typeof file.studioId === 'string' ? file.studioId : null,
    elements: file.elements as Stored[],
    background: file.appState?.viewBackgroundColor || DEFAULT_BACKGROUND,
    gridSize: file.appState?.gridSize ?? null,
    files: storedImages(file.files),
    tooNew: (version as number) > FORMAT_VERSION,
  }
}

// Fields dropped when equal to Excalidraw's element defaults.
const DEFAULTS: Record<string, unknown> = {
  angle: 0,
  backgroundColor: 'transparent',
  boundElements: null,
  customData: undefined,
  fillStyle: 'solid',
  frameId: null,
  groupIds: [],
  isDeleted: false,
  link: null,
  locked: false,
  opacity: 100,
  roughness: 1,
  roundness: null,
  strokeColor: '#1e1e1e',
  strokeStyle: 'solid',
  strokeWidth: 2,
}
// An image's `status` is Excalidraw's own loading state.
const VOLATILE = new Set(['updated', 'status'])

const round = (n: number) =>
  Number.isFinite(n) && !Number.isInteger(n) ? Math.round(n * 100) / 100 : n

// A deep copy with numbers rounded and object keys sorted.
function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stable((value as Stored)[key])]),
    )
  return typeof value === 'number' ? round(value) : value
}

const isDefault = (key: string, value: unknown) => {
  if (!(key in DEFAULTS)) return false
  const fallback = DEFAULTS[key]
  return Array.isArray(fallback)
    ? Array.isArray(value) && value.length === 0
    : value === fallback
}

/** One element in stored form; `mapLink` turns a link into an app path. */
export function slimElement(
  element: Stored,
  mapLink: (link: string) => string = (link) => link,
): Stored {
  const out: Stored = {}
  for (const [key, raw] of Object.entries(element)) {
    const value = key === 'link' && typeof raw === 'string' ? mapLink(raw) : raw
    if (value === undefined || VOLATILE.has(key) || isDefault(key, value))
      continue
    out[key] = value
  }
  return stable(out) as Stored
}

// The permanent address of an item in the studio, without a trailing slash.
const ITEM_ADDRESS = /^(\/prototypes\/[^/?#]+\/artifacts\/[^/?#]+)\/?([?#].*)?$/
const address = (path: string) => {
  const found = ITEM_ADDRESS.exec(path)
  return found ? `${found[1]}${found[2] ?? ''}` : null
}

/**
 * How a link is stored: a link to an item in this studio becomes its app
 * address (`/prototypes/<prototype-id>/artifacts/<artifact-id>`), so the
 * canvas works on any host and under any base path, and link repair can
 * find it. Excalidraw holds whole URLs; `origin` and `base` are where this
 * studio runs. Any other link is kept as it is.
 */
export function storedLink(link: string, origin: string, base: string) {
  return itemAddress(link, origin, base) ?? link
}

/**
 * The app address of an artifact of this studio a link points at, or null
 * for anything else (another site, a studio page that isn't an artifact).
 * Only these links become items on a canvas.
 */
export function itemAddress(link: string, origin: string, base: string) {
  if (link.startsWith('/')) return link.startsWith('//') ? null : address(link)
  let url: URL
  try {
    url = new URL(link)
  } catch {
    return null
  }
  const prefix = base.replace(/\/$/, '')
  if (url.origin !== origin || !url.pathname.startsWith(`${prefix}/`))
    return null
  return address(`${url.pathname.slice(prefix.length)}${url.search}${url.hash}`)
}

/**
 * The canvas file's text. Of the app state only the background and the grid
 * are kept; the camera is per person. `files` names the pictures stored
 * beside the canvas: an image whose picture isn't among them is left out,
 * and so is every picture no image shows.
 */
export function stringifyScene(
  elements: readonly Stored[],
  appState: { viewBackgroundColor?: string; gridSize?: number | null } = {},
  mapLink?: (link: string) => string,
  studioId?: string | null,
  files: Readonly<Record<string, StoredImage>> = {},
) {
  const kept = elements.filter(
    (element) =>
      !element.isDeleted &&
      (element.type !== 'image' ||
        (typeof element.fileId === 'string' &&
          Object.hasOwn(files, element.fileId))),
  )
  const shown = [
    ...new Set(
      kept.flatMap((element) =>
        element.type === 'image' ? [element.fileId as string] : [],
      ),
    ),
  ].sort()
  const scene = {
    type: 'excalidraw',
    version: EXCALIDRAW_FILE_VERSION,
    studioVersion: shown.length ? IMAGES_VERSION : 1,
    ...(studioId != null ? { studioId } : {}),
    elements: kept.map((element) => slimElement(element, mapLink)),
    appState: {
      viewBackgroundColor: appState.viewBackgroundColor || DEFAULT_BACKGROUND,
      ...(appState.gridSize != null ? { gridSize: appState.gridSize } : {}),
    },
    files: Object.fromEntries(
      shown.map((id) => [id, { id, mimeType: files[id]!.mimeType }]),
    ),
  }
  return `${JSON.stringify(scene, null, 2)}\n`
}
