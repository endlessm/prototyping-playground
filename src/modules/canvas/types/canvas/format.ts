// The canvas file: an Excalidraw scene, kept small and stable so canvases
// diff cleanly and an agent can read and edit them. Pure, so the studio, the
// build and the command line share it.
//
// - Deleted elements are never stored (undoing a delete is in-memory
//   history).
// - Images are never stored and `files` is always empty: an image's bytes
//   would be written into this file. A canvas shows the view itself instead.
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
 * and upgrade older files in `parseCanvas`.
 */
export const FORMAT_VERSION = 1

export const DEFAULT_BACKGROUND = '#ffffff'

export interface ParsedCanvas {
  studioId: string | null
  elements: Stored[]
  background: string
  gridSize: number | null
  /** Written by a newer copy of the studio: open it, never save over it. */
  tooNew: boolean
}

export function parseCanvas(text: string): ParsedCanvas {
  const file = JSON.parse(text) as {
    studioId?: unknown
    elements?: unknown
    appState?: { viewBackgroundColor?: string; gridSize?: number | null }
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
const VOLATILE = new Set(['updated'])

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

/**
 * The canvas file's text. Of the app state only the background and the grid
 * are kept; the camera is per person.
 */
export function stringifyScene(
  elements: readonly Stored[],
  appState: { viewBackgroundColor?: string; gridSize?: number | null } = {},
  mapLink?: (link: string) => string,
  studioId?: string | null,
) {
  const scene = {
    type: 'excalidraw',
    version: EXCALIDRAW_FILE_VERSION,
    studioVersion: FORMAT_VERSION,
    ...(studioId != null ? { studioId } : {}),
    elements: elements
      .filter((element) => !element.isDeleted && element.type !== 'image')
      .map((element) => slimElement(element, mapLink)),
    appState: {
      viewBackgroundColor: appState.viewBackgroundColor || DEFAULT_BACKGROUND,
      ...(appState.gridSize != null ? { gridSize: appState.gridSize } : {}),
    },
    files: {},
  }
  return `${JSON.stringify(scene, null, 2)}\n`
}
