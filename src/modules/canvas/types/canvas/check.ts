// What the build accepts as a canvas, and what a new one holds. Runs on Node;
// each problem completes "<file>: …" and says how to fix it.
import type { FileCheck } from '../../../../../tooling/modules/contract.ts'
import { DEFAULT_BACKGROUND, FORMAT_VERSION } from './format.ts'

/** A new canvas: an empty scene with a white background. */
export const template = () =>
  `${JSON.stringify(
    {
      type: 'excalidraw',
      version: 2,
      studioVersion: FORMAT_VERSION,
      elements: [],
      appState: { viewBackgroundColor: DEFAULT_BACKGROUND },
      files: {},
    },
    null,
    2,
  )}\n`

// A canvas links to its items by their permanent addresses in the studio.
const ARTIFACT_ADDRESS = /^\/prototypes\/([^/?#]+)\/artifacts\/[^/?#]+/

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
    ? (canvas.elements as { type?: unknown; link?: unknown }[])
    : undefined
  if (!elements)
    problems.push('"elements" must be a list (use [] for an empty canvas).')
  else if (elements.some((element) => element?.type === 'image'))
    problems.push(
      'a canvas can’t hold images: their bytes would be stored inside the file. Remove the image elements, and put the view itself on the canvas instead of a screenshot of it.',
    )
  if (canvas.files && Object.keys(canvas.files).length)
    problems.push('"files" must be empty. Images aren’t stored in a canvas.')
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
      `it links to another prototype (${[...elsewhere].slice(0, 3).join(', ')}${elsewhere.size > 3 ? ', …' : ''}). A canvas shows only items from its own prototype: copy the view into this prototype, then link that copy.`,
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
