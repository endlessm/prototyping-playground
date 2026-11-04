import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { canvasImages } from '../../src/modules/canvas/types/canvas/bundle'
import {
  missingImages,
  PRUNE_GRACE_MS,
  pruneImages,
  readImage,
  writeImage,
} from '../../src/modules/canvas/types/canvas/images'

const PICTURE = '0123456789abcdef0123456789abcdef01234567'
const WEBP = `data:image/webp;base64,${Buffer.from('webp bytes').toString('base64')}`

let root: string
beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), 'canvas-images-'))
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

function write(file: string, content: string) {
  const full = path.join(root, 'src/prototypes', file)
  mkdirSync(path.dirname(full), { recursive: true })
  writeFileSync(full, content)
}

const canvas = (files: Record<string, unknown>) =>
  JSON.stringify({
    type: 'excalidraw',
    version: 2,
    studioVersion: 2,
    studioId: 'canv000000000001',
    elements: Object.keys(files).map((fileId, i) => ({
      id: `i${i}`,
      type: 'image',
      fileId,
    })),
    appState: {},
    files,
  })

describe('a canvas’s pictures on disk', () => {
  test('[CV-59] are stored once each, in the prototype’s image folder, by file id', () => {
    const dir = path.join(root, 'demo')
    expect(
      writeImage(dir, { id: PICTURE, mimeType: 'image/webp', dataURL: WEBP }),
    ).toEqual({
      stored: true,
    })
    const file = path.join(dir, '_canvas-images', `${PICTURE}.webp`)
    expect(readFileSync(file, 'utf8')).toBe('webp bytes')
    // A stored picture never changes.
    expect(
      writeImage(dir, {
        id: PICTURE,
        mimeType: 'image/webp',
        dataURL: `data:image/webp;base64,${Buffer.from('other').toString('base64')}`,
      }),
    ).toEqual({ stored: false })
    expect(readImage(dir, { id: PICTURE, mimeType: 'image/webp' })).toBe(WEBP)
    expect(
      readImage(dir, { id: 'missing00001', mimeType: 'image/webp' }),
    ).toBeNull()
  })

  test('[CV-59] refuses an id that could leave the folder, another type, mismatched data and large pictures', () => {
    const dir = path.join(root, 'demo')
    expect(() =>
      writeImage(dir, {
        id: '../../escape',
        mimeType: 'image/webp',
        dataURL: WEBP,
      }),
    ).toThrow('This picture has no usable id.')
    expect(() =>
      writeImage(dir, {
        id: PICTURE,
        mimeType: 'image/png',
        dataURL: 'data:image/png;base64,AA',
      }),
    ).toThrow(/stored as image\/webp or image\/svg\+xml/)
    expect(() =>
      writeImage(dir, {
        id: PICTURE,
        mimeType: 'image/svg+xml',
        dataURL: WEBP,
      }),
    ).toThrow('This picture’s data doesn’t match its type.')
    const large = `data:image/webp;base64,${Buffer.alloc(751 * 1024).toString('base64')}`
    expect(() =>
      writeImage(dir, { id: PICTURE, mimeType: 'image/webp', dataURL: large }),
    ).toThrow(/too large to store/)
    expect(existsSync(path.join(dir, '_canvas-images'))).toBe(false)
  })

  test('[CV-59] are bundled for the deployed site by prototype, and a missing one stops the build', () => {
    write(
      'ada/demo/meta.json',
      JSON.stringify({
        title: 'Demo',
        studioId: 'canvpr0t00000001',
        systemId: null,
      }),
    )
    write(
      'ada/demo/Flows.excalidraw',
      canvas({ [PICTURE]: { id: PICTURE, mimeType: 'image/webp' } }),
    )
    writeImage(path.join(root, 'src/prototypes/ada/demo'), {
      id: PICTURE,
      mimeType: 'image/webp',
      dataURL: WEBP,
    })
    expect(canvasImages(root, 'src/prototypes')).toEqual({
      canvpr0t00000001: { [PICTURE]: WEBP },
    })

    write(
      'ada/demo/Other.excalidraw',
      canvas({
        gone00000001: { id: 'gone00000001', mimeType: 'image/svg+xml' },
      }),
    )
    expect(() => canvasImages(root, 'src/prototypes')).toThrow(
      'Canvas pictures are missing: ada/demo/Other.excalidraw shows _canvas-images/gone00000001.svg, which isn’t in the prototype. Restore the file, or remove the image from the canvas.',
    )
  })
})

describe('pictures no canvas shows any more', () => {
  const OTHER = 'fedcba9876543210fedcba9876543210fedcba98'
  const dir = () => path.join(root, 'src/prototypes/ada/demo')
  const pictureFile = (id: string) =>
    path.join(dir(), '_canvas-images', `${id}.webp`)
  const store = (id: string, ageMs: number) => {
    writeImage(dir(), { id, mimeType: 'image/webp', dataURL: WEBP })
    const then = new Date(Date.now() - ageMs)
    utimesSync(pictureFile(id), then, then)
  }
  beforeEach(() => {
    write(
      'ada/demo/meta.json',
      JSON.stringify({ title: 'Demo', studioId: 'canvpr0t00000001' }),
    )
  })

  test('[CV-59] are removed, while pictures any canvas of the prototype shows stay', () => {
    write(
      'ada/demo/flows/Flows.excalidraw',
      canvas({ [PICTURE]: { id: PICTURE, mimeType: 'image/webp' } }),
    )
    store(PICTURE, PRUNE_GRACE_MS * 2)
    store(OTHER, PRUNE_GRACE_MS * 2)
    writeFileSync(path.join(dir(), '_canvas-images', 'notes.txt'), 'mine')
    expect(pruneImages(dir())).toEqual([`_canvas-images/${OTHER}.webp`])
    expect(readdirSync(path.join(dir(), '_canvas-images')).sort()).toEqual([
      `${PICTURE}.webp`,
      'notes.txt',
    ])
  })

  test('[CV-59] stay for a while after being stored or confirmed, so a canvas being written can show them', () => {
    write('ada/demo/Flows.excalidraw', canvas({}))
    store(OTHER, PRUNE_GRACE_MS * 2)
    store(PICTURE, 1000)
    expect(pruneImages(dir())).toEqual([`_canvas-images/${OTHER}.webp`])
    expect(existsSync(pictureFile(PICTURE))).toBe(true)
    // Confirming a stored picture before a save counts as using it.
    const then = new Date(Date.now() - PRUNE_GRACE_MS * 2)
    utimesSync(pictureFile(PICTURE), then, then)
    expect(
      missingImages(dir(), [
        { id: PICTURE, mimeType: 'image/webp' },
        { id: OTHER, mimeType: 'image/webp' },
      ]),
    ).toEqual([OTHER])
    expect(pruneImages(dir())).toEqual([])
    // Once nothing is left, the folder goes too.
    expect(pruneImages(dir(), Date.now() + PRUNE_GRACE_MS * 2)).toEqual([
      `_canvas-images/${PICTURE}.webp`,
    ])
    expect(existsSync(path.join(dir(), '_canvas-images'))).toBe(false)
  })

  test('[CV-59] are all kept while any canvas of the prototype can’t be read', () => {
    write('ada/demo/Broken.excalidraw', '{ half written')
    store(OTHER, PRUNE_GRACE_MS * 2)
    expect(pruneImages(dir())).toEqual([])
    expect(existsSync(pictureFile(OTHER))).toBe(true)
  })
})
