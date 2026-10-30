import { describe, expect, test } from 'vitest'
import { initialCamera } from '../../src/modules/canvas/utils/camera'
import {
  OPENING_STATUS_DELAY_MS,
  OPENING_WAIT_MS,
  openingReady,
  settledEmbeds,
} from '../../src/modules/canvas/utils/opening'
import { tooltipParts } from '../../src/modules/canvas/utils/tooltips'

const size = { width: 1000, height: 500 }

describe('where a canvas opens', () => {
  test('[CV-25] a canvas opened for the first time fits its content in 90% of the space', () => {
    const camera = initialCamera(
      [
        { x: 0, y: 0, width: 2000, height: 500 },
        { x: 2000, y: 500, width: 0, height: 500, isDeleted: false },
      ],
      null,
      size,
    )
    // 2000 × 1000 into 1000 × 500: half, then 90% of it.
    expect(camera).toEqual({
      scrollX: 1000 / (2 * 0.45) - 1000,
      scrollY: 500 / (2 * 0.45) - 500,
      zoom: { value: 0.45 },
    })
  })

  test('[CV-25] small content never opens above 100% zoom, and deleted elements don’t count', () => {
    const camera = initialCamera(
      [
        { x: 100, y: 100, width: 50, height: 50 },
        { x: 9000, y: 9000, width: 10, height: 10, isDeleted: true },
      ],
      null,
      size,
    )
    expect(camera?.zoom.value).toBe(1)
    expect(camera?.scrollX).toBe(500 - 125)
  })

  test('[CV-24] a remembered position and zoom are restored', () => {
    expect(
      initialCamera(
        [],
        JSON.stringify({ scrollX: 12, scrollY: -40, zoom: 2 }),
        size,
      ),
    ).toEqual({ scrollX: 12, scrollY: -40, zoom: { value: 2 } })
  })

  test('[CV-25] a damaged remembered position is ignored and the canvas fits instead', () => {
    const elements = [{ x: 0, y: 0, width: 100, height: 100 }]
    const fitted = initialCamera(elements, null, size)
    for (const saved of [
      '{"scrollX":null,"scrollY":0,"zoom":1}',
      '{"scrollX":0,"scrollY":0,"zoom":0}',
      '{"scrollX":0,"scrollY":0,"zoom":500}',
      'not json',
    ])
      expect(initialCamera(elements, saved, size)).toEqual(fitted)
  })

  test('[CV-25] an empty canvas, or one with no room yet, keeps Excalidraw’s own camera', () => {
    expect(initialCamera([], null, size)).toBeUndefined()
    expect(
      initialCamera([{ x: 0, y: 0, width: 1, height: 1 }], null, {
        width: 0,
        height: 0,
      }),
    ).toBeUndefined()
  })
})

describe('the opening wait', () => {
  test('[CV-15] the status waits 200 ms, and the wait is bounded by 2 s', () => {
    expect(OPENING_STATUS_DELAY_MS).toBe(200)
    expect(OPENING_WAIT_MS).toBe(2000)
  })

  test('[CV-19] waits for every initial visible embed, including ones not admitted yet', () => {
    expect(
      openingReady(['first', 'queued'], new Set(['first', 'offscreen']), 500),
    ).toBe(false)
    expect(
      openingReady(['first', 'queued'], new Set(['first', 'queued']), 600),
    ).toBe(true)
    expect(openingReady([], new Set(), 0)).toBe(true)
  })

  test('[CV-19] a stalled embed cannot hold the reveal beyond 2 s', () => {
    expect(openingReady(['stalled'], new Set(), OPENING_WAIT_MS - 1)).toBe(
      false,
    )
    expect(openingReady(['stalled'], new Set(), OPENING_WAIT_MS)).toBe(true)
  })

  test('[CV-19] previews that committed or failed settle the wait', () => {
    const embeds = ['ready', 'error', 'loading', 'placeholder'].map(
      (state) => ({
        dataset: { canvasEmbedId: state },
        querySelector: () =>
          state === 'ready' || state === 'error' ? {} : null,
      }),
    )
    const container = {
      querySelectorAll: () => embeds,
    } as unknown as HTMLElement
    expect([...settledEmbeds(container)]).toEqual(['ready', 'error'])
  })
})

describe('control tooltips', () => {
  test('[CV-43] show the control’s name and each shortcut key', () => {
    expect(tooltipParts('Rectangle — R or 2')).toEqual({
      label: 'Rectangle',
      keys: ['R', '2'],
    })
    expect(tooltipParts('Library')).toEqual({ label: 'Library', keys: [] })
  })
})
