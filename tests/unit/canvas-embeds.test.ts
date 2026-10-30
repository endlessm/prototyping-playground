import { describe, expect, test } from 'vitest'
import { itemAddress } from '../../src/modules/canvas/types/canvas/format'
import {
  ITEM_CARD_HEIGHT,
  OVERVIEW_ZOOM,
  itemSize,
  normalizedItem,
  openingEmbedIds,
  renderFlags,
} from '../../src/modules/canvas/utils/embeds'
import {
  MAX_LIVE,
  MOUNT_INTERVAL_MS,
  createMountGate,
  pickEvictions,
} from '../../src/modules/canvas/utils/liveViews'

const ORIGIN = 'http://127.0.0.1:3000'
const ITEM = '/prototypes/pr0t000000000001/artifacts/v1ew000000000001'

describe('which links become items on a canvas', () => {
  test('[CV-62] only addresses of artifacts in this studio are items; other sites, pages and videos are refused', () => {
    expect(itemAddress(`${ORIGIN}${ITEM}`, ORIGIN, '/')).toBe(ITEM)
    expect(itemAddress(`${ORIGIN}/studio${ITEM}/`, ORIGIN, '/studio/')).toBe(
      ITEM,
    )
    expect(itemAddress(`${ORIGIN}${ITEM}?a=1#b`, ORIGIN, '/')).toBe(
      `${ITEM}?a=1#b`,
    )
    expect(itemAddress(ITEM, ORIGIN, '/')).toBe(ITEM)
    for (const link of [
      `https://example.com${ITEM}`,
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      `${ORIGIN}/prototypes/pr0t000000000001`,
      `${ORIGIN}/systems/harbor`,
      `${ORIGIN}${ITEM}`.replace(ORIGIN, `${ORIGIN}/elsewhere`),
      'not a link',
      '',
    ])
      expect(itemAddress(link, ORIGIN, '/studio/')).toBeNull()
  })
})

describe('how a new item is placed', () => {
  test('[CV-63] a live preview is sized like a screen with its header; anything else is a one-row card', () => {
    // 480 wide, 1440 × 900 scaled to 300, plus the 36 px header and the
    // border.
    expect(itemSize(true)).toEqual({ width: 480, height: 338 })
    expect(itemSize(false)).toEqual({ width: 480, height: ITEM_CARD_HEIGHT })
    expect(ITEM_CARD_HEIGHT).toBe(88)
  })

  test('[CV-63] [CV-64] a dropped item is centered where it landed, without outline, rounded corners or link icon', () => {
    const dropped = {
      x: 1000,
      y: 500,
      width: 560,
      height: 840,
      roundness: { type: 3 },
      strokeColor: '#1e1e1e',
      customData: undefined,
    }
    expect(normalizedItem(dropped, true)).toEqual({
      x: 760,
      y: 331,
      width: 480,
      height: 338,
      roundness: null,
      strokeColor: 'transparent',
      customData: { frame: true, hideLinkIcon: true },
    })
    // Written into the file (by an agent): its look only.
    expect(normalizedItem(dropped, true, false)).toEqual({
      roundness: null,
      strokeColor: 'transparent',
      customData: { frame: true, hideLinkIcon: true },
    })
    // Already an item: left as it is, wherever it was moved or resized.
    const placed = {
      x: 3,
      y: 4,
      width: 900,
      height: 200,
      roundness: null,
      strokeColor: 'transparent',
      customData: { frame: true, hideLinkIcon: true },
    }
    expect(normalizedItem(placed, true)).toBeNull()
    // An item someone styled gets its look back, but keeps its place.
    expect(
      normalizedItem({ ...placed, strokeColor: '#e03131' }, false),
    ).toEqual({
      roundness: null,
      strokeColor: 'transparent',
      customData: { frame: true, hideLinkIcon: true },
    })
  })
})

describe('what is drawn as the camera moves', () => {
  const view = {
    scrollX: 0,
    scrollY: 0,
    zoom: { value: 1 },
    width: 1000,
    height: 800,
  }
  const at = (x: number, y: number) => ({ x, y, width: 480, height: 338 })

  test('[CV-78] items more than 400 px beyond the view are hidden from painting', () => {
    expect(renderFlags(at(1300, 0), view).offscreen).toBe(false)
    expect(renderFlags(at(1401, 0), view).offscreen).toBe(true)
    expect(renderFlags(at(-880, 0), view).offscreen).toBe(false)
    expect(renderFlags(at(-881, 0), view).offscreen).toBe(true)
    // The margin is in screen pixels: zoomed out to half, it covers 800.
    expect(
      renderFlags(at(2700, 0), { ...view, zoom: { value: 0.5 } }).offscreen,
    ).toBe(false)
  })

  test('[CV-77] zoomed out below 12%, items show as title cards', () => {
    expect(OVERVIEW_ZOOM).toBe(0.12)
    expect(
      renderFlags(at(0, 0), { ...view, zoom: { value: 0.12 } }).overview,
    ).toBe(false)
    expect(
      renderFlags(at(0, 0), { ...view, zoom: { value: 0.11 } }).overview,
    ).toBe(true)
  })

  test('[CV-15] the opening waits only for live previews in the first view', () => {
    const elements = [
      { id: 'near', type: 'embeddable', link: 'view', ...at(100, 100) },
      { id: 'card', type: 'embeddable', link: 'doc', ...at(100, 500) },
      // Inside the preloading margin, but not on screen.
      { id: 'margin', type: 'embeddable', link: 'view', ...at(1100, 0) },
      { id: 'gone', type: 'embeddable', link: 'view', ...at(0, 0) },
      { id: 'shape', type: 'rectangle', link: null, ...at(0, 0) },
    ].map((element) =>
      element.id === 'gone' ? { ...element, isDeleted: true } : element,
    )
    const preview = (link: string) => link === 'view'
    expect(openingEmbedIds(elements, view, preview)).toEqual(['near'])
    expect(
      openingEmbedIds(elements, { ...view, zoom: { value: 0.1 } }, preview),
    ).toEqual([])
  })
})

describe('which previews are live', () => {
  test('[CV-79] previews go live at most one every 150 ms', () => {
    expect(MOUNT_INTERVAL_MS).toBe(150)
    const admit = createMountGate()
    expect(admit(0)).toBe(true)
    expect(admit(100)).toBe(false)
    expect(admit(150)).toBe(true)
  })

  test('[CV-80] offscreen previews stay live until the budget is reached; removed ones go at once', () => {
    expect(MAX_LIVE).toBe(30)
    const lastSeen = new Map(
      Array.from({ length: MAX_LIVE }, (_, i) => [String(i), 0]),
    )
    const onCanvas = new Set(lastSeen.keys())
    expect(
      pickEvictions({ lastSeen, visible: new Set(), onCanvas, now: 10_000 }),
    ).toEqual([])
    onCanvas.delete('0')
    expect(
      pickEvictions({ lastSeen, visible: new Set(), onCanvas, now: 1 }),
    ).toEqual(['0'])
  })

  test('[CV-80] beyond the budget, the least recently seen go first; visible and recently seen ones stay', () => {
    const lastSeen = new Map(
      Array.from({ length: MAX_LIVE + 2 }, (_, i) => [String(i), i]),
    )
    const onCanvas = new Set(lastSeen.keys())
    expect(
      pickEvictions({ lastSeen, visible: new Set(['0']), onCanvas, now: 1000 }),
    ).toEqual([])
    expect(
      pickEvictions({
        lastSeen,
        visible: new Set(['0']),
        onCanvas,
        now: 10_000,
      }),
    ).toEqual(['1', '2'])
  })
})
