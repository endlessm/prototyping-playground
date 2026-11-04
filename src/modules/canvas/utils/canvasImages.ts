// A canvas's pictures in the browser. Locally they come from, and go to, the
// prototype's image folder through the canvas's dev-server handler; the
// deployed site has them bundled. A picture is stored once and never
// changes, so each is fetched and written at most once per page.
import urls from 'virtual:studio-module-data'
import { requestJson } from '../../../../app/utils/studioRequest'
import {
  storedImageType,
  type ImageType,
  type StoredImage,
} from '../types/canvas/format'

/** A picture as Excalidraw holds it (its BinaryFileData). */
export interface CanvasPicture {
  id: string
  mimeType: string
  dataURL: string
  created: number
}

// Under the committed-file limit, with room for the data URL's base64.
const MAX_STORED_BYTES = 700 * 1024
const WEBP_QUALITY = 0.85

const handler = (base: string) => `${base}_studio/modules/canvas/images`

let bundled: Promise<Record<string, Record<string, string>>> | undefined

/** The stored pictures among `wanted`; a missing one is left out. */
export async function loadImages(
  base: string,
  prototypeId: string,
  wanted: readonly StoredImage[],
): Promise<CanvasPicture[]> {
  if (!wanted.length) return []
  let found: Record<string, string>
  if (import.meta.dev)
    ({ images: found } = await requestJson<{ images: Record<string, string> }>(
      handler(base),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'read',
          prototype: prototypeId,
          images: wanted,
        }),
      },
    ))
  else {
    bundled ??= fetch(urls['canvas/images']!).then((response) => {
      if (!response.ok)
        throw new Error('The canvases’ pictures failed to load.')
      return response.json() as Promise<Record<string, Record<string, string>>>
    })
    bundled.catch(() => (bundled = undefined))
    found = (await bundled)[prototypeId] ?? {}
  }
  const created = Date.now()
  return wanted.flatMap(({ id, mimeType }) =>
    found[id] ? [{ id, mimeType, dataURL: found[id], created }] : [],
  )
}

const bytesOf = (dataURL: string) =>
  Math.floor(((dataURL.length - dataURL.indexOf(',') - 1) * 3) / 4)

function decode(dataURL: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('This picture couldn’t be read.'))
    image.src = dataURL
  })
}

/**
 * The picture as it is stored: SVG as it is, anything else as WebP, smaller
 * step by step until it fits under the committed-file limit.
 */
export async function storedPicture(
  picture: Pick<CanvasPicture, 'mimeType' | 'dataURL'>,
): Promise<{ mimeType: ImageType; dataURL: string }> {
  const mimeType = storedImageType(picture.mimeType)
  if (mimeType === 'image/svg+xml') {
    if (bytesOf(picture.dataURL) > MAX_STORED_BYTES)
      throw new Error(
        'This SVG is too large to store. Keep pictures under 700 KB.',
      )
    return { mimeType, dataURL: picture.dataURL }
  }
  const image = await decode(picture.dataURL)
  let scale = 1
  let quality = WEBP_QUALITY
  for (let attempt = 0; attempt < 8; attempt++) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height)
    const dataURL = canvas.toDataURL(mimeType, quality)
    if (!dataURL.startsWith(`data:${mimeType}`))
      throw new Error('This browser can’t store pictures as WebP.')
    if (bytesOf(dataURL) <= MAX_STORED_BYTES) return { mimeType, dataURL }
    quality = Math.max(0.6, quality - 0.1)
    scale *= 0.8
  }
  throw new Error('This picture is too large to store, even made smaller.')
}

/** Stores a picture in the prototype's image folder (dev only). */
export async function storeImage(
  base: string,
  prototypeId: string,
  picture: CanvasPicture,
) {
  const stored = await storedPicture(picture)
  await requestJson(handler(base), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'write',
      prototype: prototypeId,
      image: { id: picture.id, ...stored },
    }),
  })
}

const post = <T>(base: string, body: Record<string, unknown>) =>
  requestJson<T>(handler(base), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

/**
 * Of the pictures a canvas is about to show, the ids not stored (dev only).
 * The stored ones count as just used, so a prune leaves them meanwhile.
 */
export async function missingImages(
  base: string,
  prototypeId: string,
  images: readonly StoredImage[],
) {
  if (!images.length) return []
  return (
    await post<{ missing: string[] }>(base, {
      action: 'ensure',
      prototype: prototypeId,
      images,
    })
  ).missing
}

/** Removes the prototype's pictures no canvas shows any more (dev only). */
export function pruneImages(base: string, prototypeId: string) {
  return post<{ removed: string[] }>(base, {
    action: 'prune',
    prototype: prototypeId,
  })
}
