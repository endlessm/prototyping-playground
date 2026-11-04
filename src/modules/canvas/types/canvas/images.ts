// A canvas's pictures on disk: one file each in the prototype's image folder,
// named by Excalidraw's file id, so a picture placed twice is stored once and
// a stored picture never changes. Pictures no canvas of the prototype shows
// any more are removed (`pruneImages`). Runs on Node, for the dev server's
// image handler, the command line and the deployed site's bundle.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  statSync,
  unlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { treeFiles } from '../../../../../tooling/manifest/build.ts'
import {
  IMAGE_FOLDER,
  IMAGE_TYPES,
  imagePath,
  isImageId,
  parseCanvas,
  type ImageType,
  type StoredImage,
} from './format.ts'

/** The same limit as any committed file. */
export const MAX_IMAGE_BYTES = 750 * 1024

/**
 * How long a picture stored or confirmed a moment ago is kept even though no
 * canvas shows it yet: between storing a picture and writing the canvas
 * that shows it, another canvas's save may prune.
 */
export const PRUNE_GRACE_MS = 2 * 60 * 1000

const invalid = (message: string) =>
  Object.assign(new Error(message), { status: 400 })

const fileOf = (dir: string, image: StoredImage) =>
  path.join(dir, imagePath(image.id, image.mimeType))

// Marks a stored picture as just used, so a prune leaves it for a while.
function touch(file: string) {
  const now = new Date()
  utimesSync(file, now, now)
}

/** A stored picture as a data URL, or null if its file is missing. */
export function readImage(dir: string, image: StoredImage) {
  const file = fileOf(dir, image)
  if (!existsSync(file)) return null
  return `data:${image.mimeType};base64,${readFileSync(file).toString('base64')}`
}

/**
 * Of the pictures a canvas is about to show, the ids not stored; the stored
 * ones count as just used.
 */
export function missingImages(dir: string, images: readonly StoredImage[]) {
  const missing: string[] = []
  for (const image of images) {
    if (!isImageId(image?.id) || !(String(image.mimeType) in IMAGE_TYPES))
      continue
    const file = fileOf(dir, image)
    if (existsSync(file)) touch(file)
    else missing.push(image.id)
  }
  return missing
}

/** Writes a picture unless it is already stored. */
export function writeImage(
  dir: string,
  image: { id: unknown; mimeType: unknown; dataURL: unknown },
) {
  const { id, mimeType, dataURL } = image
  if (!isImageId(id)) throw invalid('This picture has no usable id.')
  if (typeof mimeType !== 'string' || !(mimeType in IMAGE_TYPES))
    throw invalid(
      `Pictures are stored as ${Object.keys(IMAGE_TYPES).join(' or ')}.`,
    )
  const prefix = `data:${mimeType};base64,`
  if (typeof dataURL !== 'string' || !dataURL.startsWith(prefix))
    throw invalid('This picture’s data doesn’t match its type.')
  const bytes = Buffer.from(dataURL.slice(prefix.length), 'base64')
  if (!bytes.length) throw invalid('This picture is empty.')
  if (bytes.length > MAX_IMAGE_BYTES)
    throw Object.assign(
      new Error(
        'This picture is too large to store. Keep pictures under 750 KB.',
      ),
      { status: 413 },
    )
  const file = path.join(dir, imagePath(id, mimeType as ImageType))
  if (existsSync(file)) {
    touch(file)
    return { stored: false }
  }
  mkdirSync(path.join(dir, IMAGE_FOLDER), { recursive: true })
  writeFileSync(file, bytes)
  return { stored: true }
}

const PICTURE_FILE = new RegExp(
  `^([A-Za-z0-9_-]{8,64})(${Object.values(IMAGE_TYPES)
    .map((extension) => extension.replace('.', '\\.'))
    .join('|')})$`,
)

/**
 * Removes the pictures in the prototype's image folder that none of its
 * canvases shows and that weren't stored or confirmed in the last
 * `PRUNE_GRACE_MS`; the folder goes once it is empty. Nothing is removed
 * while any canvas can't be read: what it shows is unknown. Files that aren't
 * pictures are left alone. Returns the removed files, relative to the
 * prototype.
 */
export function pruneImages(dir: string, now = Date.now()) {
  const folder = path.join(dir, IMAGE_FOLDER)
  if (!existsSync(folder)) return []
  const shown = new Set<string>()
  for (const file of treeFiles(dir)) {
    if (path.extname(file).toLowerCase() !== '.excalidraw') continue
    try {
      for (const image of Object.values(
        parseCanvas(readFileSync(path.join(dir, file), 'utf8')).files,
      ))
        shown.add(imagePath(image.id, image.mimeType))
    } catch {
      return []
    }
  }
  const removed: string[] = []
  for (const name of readdirSync(folder)) {
    const relative = `${IMAGE_FOLDER}/${name}`
    const file = path.join(folder, name)
    if (!PICTURE_FILE.test(name) || shown.has(relative)) continue
    const stat = statSync(file)
    if (!stat.isFile() || now - stat.mtimeMs < PRUNE_GRACE_MS) continue
    unlinkSync(file)
    removed.push(relative)
  }
  if (!readdirSync(folder).length) rmdirSync(folder)
  return removed
}
