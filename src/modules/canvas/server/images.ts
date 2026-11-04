// The canvas's pictures on the local dev server, at
// `<base>_studio/modules/canvas/images`:
//
//   POST { action: "read", prototype, images: [{ id, mimeType }] }
//        the stored pictures as data URLs, by id; missing ones are left out
//   POST { action: "write", prototype, image: { id, mimeType, dataURL } }
//        stores a picture in the prototype's image folder, for whoever may
//        change the prototype; a picture already stored is kept as it is
//   POST { action: "ensure", prototype, images: [{ id, mimeType }] }
//        before a canvas that shows them is written: the ids not stored, to
//        store first; the stored ones count as just used, so a prune leaves
//        them while the canvas is written
//   POST { action: "prune", prototype }
//        after a canvas stopped showing a picture: removes the prototype's
//        pictures no canvas shows (see `pruneImages`)
//
// Every action but "read" is for whoever may change the prototype.
import path from 'node:path'
import type { ModuleServerHandler } from '../../../../tooling/modules/contract.ts'
import {
  fileAccess,
  FileServiceError,
} from '../../../../tooling/files/source.ts'
import { PROTOTYPES_FOLDER } from '../../../../tooling/manifest/build.ts'
import {
  isImageId,
  IMAGE_TYPES,
  type StoredImage,
} from '../types/canvas/format.ts'
import {
  missingImages,
  pruneImages,
  readImage,
  writeImage,
} from '../types/canvas/images.ts'

const fail = (status: number, message: string) =>
  Object.assign(new Error(message), { status })

export default (({ root, contributorsFolder, method, body }) => {
  const request = (body ?? {}) as Record<string, unknown>
  if (method !== 'POST' || typeof request.prototype !== 'string')
    throw fail(400, 'Invalid image request.')
  const access = fileAccess({
    root,
    prototypesFolder: process.env.STUDIO_PROTOTYPES || PROTOTYPES_FOLDER,
    contributorsFolder: path.relative(root, contributorsFolder),
    configFile: process.env.STUDIO_CONFIG || undefined,
    fileTypes: [],
  })
  let found: ReturnType<typeof access.prototypeOf>
  try {
    found = access.prototypeOf(request.prototype)
  } catch (error) {
    if (error instanceof FileServiceError)
      throw fail(error.status, error.message)
    throw error
  }

  if (request.action === 'read') {
    const wanted = Array.isArray(request.images) ? request.images : []
    const images: Record<string, string> = {}
    for (const entry of wanted as Partial<StoredImage>[]) {
      if (!isImageId(entry?.id) || !(String(entry.mimeType) in IMAGE_TYPES))
        continue
      const dataURL = readImage(found.dir, entry as StoredImage)
      if (dataURL) images[entry.id] = dataURL
    }
    return { images }
  }

  const refusal = access.refusalFor(found.contributor, found.meta)
  if (refusal) throw fail(403, refusal.message)

  if (request.action === 'ensure')
    return {
      missing: missingImages(
        found.dir,
        (Array.isArray(request.images) ? request.images : []) as StoredImage[],
      ),
    }

  if (request.action === 'prune') return { removed: pruneImages(found.dir) }

  if (request.action === 'write') {
    const image = (request.image ?? {}) as Record<string, unknown>
    return writeImage(found.dir, {
      id: image.id,
      mimeType: image.mimeType,
      dataURL: image.dataURL,
    })
  }
  throw fail(400, 'Invalid image request.')
}) satisfies ModuleServerHandler
