// The stored form a save writes (CV-102 to CV-106). Carried over from the
// React studio's `tools.test.ts` (the identity and stored-form tests), plus
// how an item's link is stored.
import { describe, expect, test } from 'vitest'
import {
  parseCanvas,
  storedLink,
  stringifyScene,
} from '../../src/modules/canvas/types/canvas/format'
import { identity as canvas } from '../../src/modules/canvas/types/canvas/identity'

const ID = 'canv000000000001'
const ORIGIN = 'http://127.0.0.1:4000'

describe('saving a canvas', () => {
  test('[CV-97] keeps the canvas’s permanent identity, apart from its elements’ ids and links', () => {
    const elements = [
      { id: 'frame-id', type: 'frame', x: 20, y: 30 },
      { id: 'embed-id', type: 'embeddable', link: '/pat/demo/main' },
    ]
    const written = stringifyScene(elements, { gridSize: 20 }, undefined, ID)
    expect(canvas.read(written)).toBe(ID)
    expect(
      JSON.parse(written).elements.map((element: { id: string }) => element.id),
    ).toEqual(['frame-id', 'embed-id'])
    // Saving what was read writes the same file.
    expect(
      stringifyScene(
        JSON.parse(written).elements,
        { gridSize: 20 },
        undefined,
        parseCanvas(written).studioId,
      ),
    ).toBe(written)
    // A file without an identity doesn't get a random one on save.
    expect(canvas.read(stringifyScene(elements))).toBeNull()
  })

  test('[CV-102] is Excalidraw’s own scene, version 2, so it opens on excalidraw.com', () => {
    const file = JSON.parse(stringifyScene([], {}, undefined, ID))
    expect(file.type).toBe('excalidraw')
    expect(file.version).toBe(2)
  })

  test('[CV-103] is small and stable: defaults dropped, numbers rounded, keys sorted, merge fields kept, 2-space JSON', () => {
    const text = stringifyScene(
      [
        {
          y: 0,
          x: 0.123456,
          id: 'a',
          type: 'rectangle',
          angle: 0,
          opacity: 100,
          strokeColor: '#1e1e1e',
          groupIds: [],
          isDeleted: false,
          updated: 1730000000000,
          version: 7,
          versionNonce: 99,
          index: 'a0',
          strokeWidth: 4,
        },
        { id: 'gone', type: 'ellipse', isDeleted: true },
      ],
      { viewBackgroundColor: '#ffffff' },
      undefined,
      ID,
    )
    expect(text.endsWith('}\n')).toBe(true)
    expect(text.split('\n')[1]).toBe('  "type": "excalidraw",')
    const [element] = JSON.parse(text).elements
    expect(Object.keys(element)).toEqual([
      'id',
      'index',
      'strokeWidth',
      'type',
      'version',
      'versionNonce',
      'x',
      'y',
    ])
    expect(element.x).toBe(0.12)
    expect(JSON.parse(text).elements).toHaveLength(1)
    expect(stringifyScene(JSON.parse(text).elements, {}, undefined, ID)).toBe(
      text,
    )
  })

  test('[CV-104] keeps only the background and grid size of the view state; files is always empty', () => {
    const file = JSON.parse(
      stringifyScene(
        [],
        {
          viewBackgroundColor: '#fff9db',
          gridSize: 20,
          gridModeEnabled: true,
          objectsSnapModeEnabled: true,
          scrollX: 10,
          zoom: { value: 2 },
        } as never,
        undefined,
        ID,
      ),
    )
    expect(file.appState).toEqual({
      viewBackgroundColor: '#fff9db',
      gridSize: 20,
    })
    expect(file.files).toEqual({})
  })

  test('[CV-106] carries studioVersion 1 while it holds no images', () => {
    expect(
      JSON.parse(stringifyScene([], {}, undefined, ID)).studioVersion,
    ).toBe(1)
    expect(() => parseCanvas('{"elements":[],"studioVersion":0}')).toThrow(
      'Unknown canvas version: 0',
    )
    expect(parseCanvas('{"elements":[],"studioVersion":2}').tooNew).toBe(false)
    expect(parseCanvas('{"elements":[],"studioVersion":3}').tooNew).toBe(true)
  })
})

describe('an item’s link', () => {
  const ITEM = '/prototypes/pr0t000000000001/artifacts/v1ew000000000001'

  test('[CV-105] is stored as its app address, whatever the host and base path', () => {
    expect(storedLink(`${ORIGIN}${ITEM}`, ORIGIN, '/')).toBe(ITEM)
    expect(storedLink(`${ORIGIN}/studio${ITEM}`, ORIGIN, '/studio/')).toBe(ITEM)
    expect(storedLink(`${ORIGIN}${ITEM}/`, ORIGIN, '/')).toBe(ITEM)
    expect(storedLink(`${ORIGIN}${ITEM}?state=open`, ORIGIN, '/')).toBe(
      `${ITEM}?state=open`,
    )
    // Already an address.
    expect(storedLink(ITEM, ORIGIN, '/')).toBe(ITEM)
    const file = JSON.parse(
      stringifyScene(
        [{ id: 'e', type: 'embeddable', link: `${ORIGIN}${ITEM}` }],
        {},
        (link) => storedLink(link, ORIGIN, '/'),
        ID,
      ),
    )
    expect(file.elements[0].link).toBe(ITEM)
  })

  test('[CV-105] anything that isn’t an item in this studio is kept as it is', () => {
    for (const link of [
      'https://example.com/prototypes/x/artifacts/y',
      `${ORIGIN}/systems/harbor`,
      `${ORIGIN}${ITEM}`.replace(ORIGIN, 'http://127.0.0.1:5000'),
      `${ORIGIN}/other${ITEM}`,
    ])
      expect(storedLink(link, ORIGIN, '/studio/')).toBe(link)
  })
})
