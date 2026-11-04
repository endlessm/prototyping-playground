import { describe, expect, test } from 'vitest'
import { check, template } from '../../src/modules/canvas/types/canvas/check'
import {
  parseCanvas,
  stringifyScene,
} from '../../src/modules/canvas/types/canvas/format'
import { identity as canvas } from '../../src/modules/canvas/types/canvas/identity'

const ID = 'canv000000000001'
const PICTURE = '0123456789abcdef0123456789abcdef01234567'

describe('a canvas’s identity', () => {
  test('[CV-06] is a top-level "studioId" next to the format version', () => {
    const written = canvas.write(
      '{"type":"excalidraw","version":2,"studioVersion":1,"elements":[],"appState":{},"files":{}}',
      ID,
    )
    expect(Object.keys(JSON.parse(written))).toEqual([
      'type',
      'version',
      'studioVersion',
      'studioId',
      'elements',
      'appState',
      'files',
    ])
    expect(canvas.read(written)).toBe(ID)
    expect(written.endsWith('}\n')).toBe(true)
  })

  test('[CV-06] is never replaced once declared', () => {
    expect(() =>
      canvas.write(`{"studioId":"${ID}","elements":[]}`, 'canv000000000002'),
    ).toThrow(/already declares/)
  })

  test('[CV-06] is read only from the top level, once', () => {
    expect(
      canvas.read(`{"elements":[{"customData":{"studioId":"${ID}"}}]}`),
    ).toBeNull()
    expect(() =>
      canvas.read(`{"studioId":"${ID}","studioId":"canv000000000002"}`),
    ).toThrow(/only once/)
    expect(() => canvas.read('{"studioId":"not an id"}')).toThrow(
      /16 lowercase/,
    )
  })

  test('[CV-22] is still found in a file that is not valid JSON, so the canvas can open and say what is wrong', () => {
    expect(canvas.read(`{\n  "studioId": "${ID}",\n  "elements": [\n`)).toBe(ID)
  })
})

describe('a new canvas', () => {
  test('[CV-05] starts as an empty scene with a white background', () => {
    const scene = JSON.parse(template())
    expect(scene).toEqual({
      type: 'excalidraw',
      version: 2,
      studioVersion: 1,
      elements: [],
      appState: { viewBackgroundColor: '#ffffff' },
      files: {},
    })
    expect(
      check(canvas.write(template(), ID), { prototypeId: PROTOTYPE }),
    ).toEqual([])
  })
})

const PROTOTYPE = 'pr0t000000000001'
const scene = (more: Record<string, unknown>) =>
  JSON.stringify({
    type: 'excalidraw',
    version: 2,
    studioVersion: 1,
    studioId: ID,
    elements: [],
    ...more,
  })
const link = (path: string) => ({ type: 'embeddable', id: 'e1', link: path })

describe('the canvas check', () => {
  const problems = (source: string) => check(source, { prototypeId: PROTOTYPE })

  test('[CV-09] refuses a file that is not valid JSON or not one object, saying how to fix it', () => {
    expect(problems('{ "elements": [')).toEqual([
      expect.stringMatching(/^it isn’t valid JSON \(/),
    ])
    expect(problems('[]')).toEqual(['a canvas is one JSON object.'])
  })

  test('[CV-09] refuses a canvas without a list of elements', () => {
    expect(problems(scene({ elements: undefined }))).toEqual([
      '"elements" must be a list (use [] for an empty canvas).',
    ])
  })

  test('[CV-09] [CV-59] accepts images whose pictures it lists by id and type', () => {
    expect(
      problems(
        scene({
          elements: [{ type: 'image', id: 'i', fileId: PICTURE }],
          files: { [PICTURE]: { id: PICTURE, mimeType: 'image/webp' } },
          studioVersion: 2,
        }),
      ),
    ).toEqual([])
  })

  test('[CV-09] [CV-59] refuses a picture’s bytes inside the canvas', () => {
    expect(
      problems(
        scene({
          elements: [{ type: 'image', id: 'i', fileId: PICTURE }],
          files: {
            [PICTURE]: {
              id: PICTURE,
              mimeType: 'image/png',
              dataURL: 'data:image/png;base64,AAAA',
            },
          },
        }),
      ),
    ).toEqual([
      expect.stringMatching(
        /^it holds the bytes of an image \(0123.*pictures are stored in _canvas-images\//,
      ),
    ])
  })

  test('[CV-09] [CV-59] refuses images whose picture it doesn’t list, and entries that aren’t pictures', () => {
    expect(
      problems(
        scene({
          elements: [{ type: 'image', id: 'i', fileId: 'unlisted0001' }],
          files: { f: {} },
        }),
      ),
    ).toEqual([
      expect.stringMatching(
        /^"files" has entries that aren’t pictures it can show \(f\)/,
      ),
      expect.stringMatching(
        /^it has images whose picture isn’t listed in "files" \(unlisted0001\)/,
      ),
    ])
  })

  test('[CV-09] refuses links to another prototype, and accepts its own artifacts', () => {
    expect(
      problems(
        scene({
          elements: [
            link(`/prototypes/${PROTOTYPE}/artifacts/vew0000000000001`),
          ],
        }),
      ),
    ).toEqual([])
    expect(
      problems(
        scene({
          elements: [
            link('/prototypes/thr0000000000001/artifacts/vew0000000000001'),
          ],
        }),
      ),
    ).toEqual([
      'it links to another prototype (/prototypes/thr0000000000001/artifacts/vew0000000000001). A canvas shows only items from its own prototype: copy the view into this prototype, then link that copy.',
    ])
  })

  test('[CV-10] drop: the older contributor/prototype link forms count as another prototype', () => {
    for (const old of ['/bernardo/demo/Home', '/prototypes/bernardo/demo/Home'])
      expect(problems(scene({ elements: [link(old)] }))).toEqual([
        expect.stringMatching(/^it links to another prototype/),
      ])
  })

  test('[CV-09] refuses an unknown format version', () => {
    expect(problems(scene({ studioVersion: 3 }))).toEqual([
      '"studioVersion" must be a whole number from 1 to 2. A newer file needs a newer copy of the studio.',
    ])
  })
})

describe('reading and storing a canvas', () => {
  test('[CV-22] a file that is not a canvas is refused with a reason', () => {
    expect(() => parseCanvas('{"studioId":"x"}')).toThrow(
      'This isn’t a canvas file: it has no list of elements.',
    )
    expect(() => parseCanvas(scene({ studioVersion: 'two' }))).toThrow(
      'Unknown canvas version: "two"',
    )
  })

  test('[CV-29] a canvas from a newer format opens, marked too new to save over', () => {
    expect(parseCanvas(scene({ studioVersion: 3 })).tooNew).toBe(true)
    expect(parseCanvas(scene({ studioVersion: 2 })).tooNew).toBe(false)
    expect(parseCanvas(scene({})).tooNew).toBe(false)
    expect(parseCanvas(scene({})).background).toBe('#ffffff')
  })

  test('[CV-26] [CV-59] stores no camera, no deleted elements and no image whose picture isn’t stored', () => {
    const text = stringifyScene(
      [
        { id: 'a', type: 'rectangle', x: 1.234, angle: 0, isDeleted: false },
        { id: 'b', type: 'image', fileId: 'f' },
        { id: 'c', type: 'ellipse', isDeleted: true },
      ],
      {
        viewBackgroundColor: '#fff9db',
        scrollX: 40,
        scrollY: 20,
        zoom: { value: 2 },
      } as never,
      undefined,
      ID,
    )
    expect(JSON.parse(text)).toEqual({
      type: 'excalidraw',
      version: 2,
      studioVersion: 1,
      studioId: ID,
      elements: [{ id: 'a', type: 'rectangle', x: 1.23 }],
      appState: { viewBackgroundColor: '#fff9db' },
      files: {},
    })
  })

  test('[CV-59] stores an image with its picture’s id and type, never its bytes or loading state', () => {
    const files = {
      [PICTURE]: { id: PICTURE, mimeType: 'image/webp' as const },
      unused000001: { id: 'unused000001', mimeType: 'image/svg+xml' as const },
    }
    const text = stringifyScene(
      [{ id: 'p', type: 'image', fileId: PICTURE, status: 'pending' }],
      {},
      undefined,
      ID,
      files,
    )
    expect(JSON.parse(text)).toEqual({
      type: 'excalidraw',
      version: 2,
      studioVersion: 2,
      studioId: ID,
      elements: [{ id: 'p', type: 'image', fileId: PICTURE }],
      appState: { viewBackgroundColor: '#ffffff' },
      files: { [PICTURE]: { id: PICTURE, mimeType: 'image/webp' } },
    })
    expect(parseCanvas(text).files).toEqual({
      [PICTURE]: { id: PICTURE, mimeType: 'image/webp' },
    })
  })
})
