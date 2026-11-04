// What the build accepts as a canvas, and what a new one holds. Runs on Node;
// each problem completes "<file>: …" and says how to fix it.
import type { FileCheck } from '../../../../../tooling/modules/contract.ts'
import {
  DEFAULT_BACKGROUND,
  FORMAT_VERSION,
  IMAGE_FOLDER,
  IMAGE_TYPES,
  isImageId,
} from './format.ts'

/** A new canvas: an empty scene with a white background. */
export const template = () =>
  `${JSON.stringify(
    {
      type: 'excalidraw',
      version: 2,
      studioVersion: 1,
      elements: [],
      appState: { viewBackgroundColor: DEFAULT_BACKGROUND },
      files: {},
    },
    null,
    2,
  )}\n`

// A canvas links to its items by their permanent addresses in the studio.
const ARTIFACT_ADDRESS = /^\/prototypes\/([^/?#]+)\/artifacts\/[^/?#]+/

const listed = (values: Iterable<string>) => {
  const all = [...values]
  return `${all.slice(0, 3).join(', ')}${all.length > 3 ? ', …' : ''}`
}

export const check: FileCheck = (source, { prototypeId } = {}) => {
  let canvas: { elements?: unknown; files?: unknown; studioVersion?: unknown }
  try {
    canvas = JSON.parse(source)
  } catch (error) {
    return [`it isn’t valid JSON (${(error as Error).message}).`]
  }
  if (!canvas || typeof canvas !== 'object' || Array.isArray(canvas))
    return ['a canvas is one JSON object.']
  const problems: string[] = []
  const elements = Array.isArray(canvas.elements)
    ? (canvas.elements as {
        type?: unknown
        link?: unknown
        fileId?: unknown
      }[])
    : undefined
  if (!elements)
    problems.push('"elements" must be a list (use [] for an empty canvas).')

  // Images: the canvas names each picture, whose bytes are a file of their
  // own in the prototype's image folder, never inside the canvas.
  const files =
    canvas.files &&
    typeof canvas.files === 'object' &&
    !Array.isArray(canvas.files)
      ? (canvas.files as Record<string, unknown>)
      : undefined
  if (canvas.files !== undefined && !files)
    problems.push(
      '"files" must be an object (use {} for a canvas without images).',
    )
  const inline = Object.entries(files ?? {})
    .filter(
      ([, entry]) => entry && typeof entry === 'object' && 'dataURL' in entry,
    )
    .map(([id]) => id)
  if (inline.length)
    problems.push(
      `it holds the bytes of ${inline.length === 1 ? 'an image' : `${inline.length} images`} (${listed(inline)}). Open the canvas in the studio and save it again: pictures are stored in ${IMAGE_FOLDER}/, and "files" keeps only each one's id and mimeType.`,
    )
  const malformed = Object.entries(files ?? {})
    .filter(
      ([id, entry]) =>
        !inline.includes(id) &&
        (!isImageId(id) ||
          !entry ||
          typeof entry !== 'object' ||
          !(
            ((entry as { mimeType?: unknown }).mimeType as string) in
            IMAGE_TYPES
          )),
    )
    .map(([id]) => id)
  if (malformed.length)
    problems.push(
      `"files" has entries that aren’t pictures it can show (${listed(malformed)}). Each is keyed by its id and has a "mimeType" of ${Object.keys(IMAGE_TYPES).join(' or ')}.`,
    )
  const missing = new Set<string>()
  for (const element of elements ?? [])
    if (
      element?.type === 'image' &&
      (typeof element.fileId !== 'string' ||
        !files ||
        !(element.fileId in files))
    )
      missing.add(String(element.fileId ?? '(none)'))
  if (missing.size)
    problems.push(
      `it has images whose picture isn’t listed in "files" (${listed(missing)}). Remove those images, or add each picture to the canvas again in the studio.`,
    )

  // A canvas shows only its own prototype's items.
  const elsewhere = new Set<string>()
  for (const { link } of prototypeId ? (elements ?? []) : [])
    if (
      typeof link === 'string' &&
      link.startsWith('/') &&
      !link.startsWith('//') &&
      ARTIFACT_ADDRESS.exec(link)?.[1] !== prototypeId
    )
      elsewhere.add(link)
  if (elsewhere.size)
    problems.push(
      `it links to another prototype (${listed(elsewhere)}). A canvas shows only items from its own prototype: copy the view into this prototype, then link that copy.`,
    )
  const version = canvas.studioVersion ?? 1
  if (
    !Number.isInteger(version) ||
    (version as number) < 1 ||
    (version as number) > FORMAT_VERSION
  )
    problems.push(
      `"studioVersion" must be a whole number from 1 to ${FORMAT_VERSION}. A newer file needs a newer copy of the studio.`,
    )
  return problems
}
