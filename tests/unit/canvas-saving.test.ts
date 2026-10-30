// Saving an open canvas and taking in outside edits (CV-87 to CV-100),
// through the framework-neutral `createCanvasFile`. An in-memory file
// service stands in for the dev server's (same rule: a save names the
// version it builds on and is refused with `changed` otherwise), and a small
// scene stands in for Excalidraw. Time is Vitest's fake clock.
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  stringifyScene,
  type Stored,
} from '../../src/modules/canvas/types/canvas/format'
import {
  createCanvasFile,
  type CanvasSnapshot,
  type SaveState,
} from '../../src/modules/canvas/utils/canvasFile'

const ID = 'canv000000000001'
const rect = (id: string, version = 1, more: Stored = {}): Stored => ({
  id,
  type: 'rectangle',
  x: 0,
  y: 0,
  version,
  versionNonce: 1,
  index: `a${id}`,
  ...more,
})
const text = (elements: Stored[]) =>
  stringifyScene(elements, { viewBackgroundColor: '#ffffff' }, undefined, ID)

class Refused extends Error {
  constructor(readonly code: string) {
    super(code)
  }
}

function harness(start: Stored[] = [rect('1')]) {
  let n = 0
  const disk = { content: text(start), version: `v${n}` }
  const writes: string[] = []
  const failures: Error[] = []
  let hold: Promise<void> | undefined
  const states: SaveState[] = []
  const notices: string[] = []
  const taken: { ids: string[]; merged: boolean }[] = []
  // The scene: what Excalidraw holds, and its scene version.
  let elements = start
  let sceneVersion = 100
  let needsWriteBack = false

  const file = createCanvasFile({
    initial: {
      content: disk.content,
      version: disk.version,
      sceneVersion,
    },
    editable: () => true,
    serialize: (snapshot, studioId) =>
      stringifyScene(snapshot.elements, snapshot.appState, undefined, studioId),
    read: async () => ({ ...disk }),
    async write(content, base) {
      if (hold) await hold
      const failure = failures.shift()
      if (failure) throw failure
      if (base !== disk.version) throw new Refused('changed')
      disk.content = content
      disk.version = `v${++n}`
      writes.push(content)
      return { version: disk.version }
    },
    take(parsed, lastIds) {
      taken.push({
        ids: parsed.elements.map((element) => element.id as string),
        merged: Boolean(lastIds),
      })
      if (lastIds) {
        const remote = new Set(parsed.elements.map((element) => element.id))
        elements = [
          ...parsed.elements,
          ...elements.filter(
            (element) =>
              !remote.has(element.id) && !lastIds.has(element.id as string),
          ),
        ]
      } else elements = parsed.elements
      return {
        needsWriteBack,
        sceneVersion: ++sceneVersion,
        snapshot: snapshot(),
      }
    },
    onState: (state) => states.push(state),
    notify: (notice) => notices.push(notice),
  })

  const snapshot = (): CanvasSnapshot => ({
    elements,
    appState: { viewBackgroundColor: '#ffffff' },
  })
  return {
    file,
    disk,
    writes,
    states,
    notices,
    taken,
    failures,
    /** An edit in the editor: new elements and a new scene version. */
    edit(next: Stored[]) {
      elements = next
      file.changed(snapshot(), ++sceneVersion)
    },
    /** Excalidraw reporting a change that isn't an edit (selection, camera). */
    nudge: () => file.changed(snapshot(), sceneVersion),
    /** Someone else saves the file. */
    outside(next: Stored[]) {
      disk.content = text(next)
      disk.version = `v${++n}`
    },
    holdWrites() {
      let release!: () => void
      hold = new Promise((resolve) => (release = resolve))
      return () => {
        hold = undefined
        release()
      }
    },
    writeBack: (value: boolean) => (needsWriteBack = value),
    get elements() {
      return elements
    },
  }
}

const ids = (content: string) =>
  (JSON.parse(content).elements as Stored[]).map((element) => element.id)
const later = (ms: number) => vi.advanceTimersByTimeAsync(ms)

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('saving edits', () => {
  test('[CV-87] an edit saves after a 1.2 s pause', async () => {
    const h = harness()
    h.edit([rect('1'), rect('2')])
    expect(h.file.state()).toBe('unsaved')
    await later(1100)
    expect(h.writes).toEqual([])
    await later(100)
    expect(h.writes.map(ids)).toEqual([['1', '2']])
    expect(h.file.state()).toBe('saved')
    expect(h.states).toEqual(['unsaved', 'saving', 'saved'])
  })

  test('[CV-87] a long run of edits saves at least every 5 s', async () => {
    const h = harness()
    for (let step = 2; step <= 12; step++) {
      h.edit([rect('1', step)])
      await later(500)
    }
    // 5.5 s of edits, never 1.2 s apart: one save at 5 s.
    expect(h.writes).toHaveLength(1)
  })

  test('[CV-88] selecting, panning, zooming and the scene handed back after loading are not edits', async () => {
    const h = harness()
    h.nudge()
    h.nudge()
    await later(6000)
    expect(h.writes).toEqual([])
    expect(h.states).toEqual([])
    expect(h.file.state()).toBe('saved')
  })

  test('[CV-88] identical content isn’t rewritten', async () => {
    const h = harness()
    // Moved away and back: a new scene version, the same file.
    h.edit([rect('1', 1)])
    await later(1200)
    expect(h.writes).toEqual([])
    expect(h.file.state()).toBe('saved')
  })

  test('[CV-89] one save at a time; edits made during a save are saved next', async () => {
    const h = harness()
    const release = h.holdWrites()
    h.edit([rect('1'), rect('2')])
    await later(1200)
    expect(h.file.state()).toBe('saving')
    h.edit([rect('1'), rect('2'), rect('3')])
    await later(1000)
    // Still the first save.
    expect(h.writes).toEqual([])
    release()
    await later(0)
    expect(h.writes.map(ids)).toEqual([['1', '2']])
    expect(h.file.state()).toBe('unsaved')
    await later(1200)
    expect(h.writes.map(ids)).toEqual([
      ['1', '2'],
      ['1', '2', '3'],
    ])
    expect(h.file.state()).toBe('saved')
  })

  test('[CV-97] every save keeps the canvas’s permanent identity', async () => {
    const h = harness()
    h.edit([rect('2')])
    await later(1200)
    expect(JSON.parse(h.disk.content).studioId).toBe(ID)
  })

  test('[CV-94] hiding the tab or leaving saves anything unsaved right away', async () => {
    const h = harness()
    h.edit([rect('1'), rect('2')])
    h.file.flush()
    await later(0)
    expect(h.writes.map(ids)).toEqual([['1', '2']])
  })
})

describe('when saving fails', () => {
  test('[CV-91] a file changed meanwhile is merged in and the union saved again', async () => {
    const h = harness([rect('1')])
    h.edit([rect('1'), rect('mine')])
    // An agent adds an element before the save lands.
    h.outside([rect('1'), rect('agent')])
    h.writeBack(true)
    await later(1200)
    expect(h.taken).toEqual([{ ids: ['1', 'agent'], merged: true }])
    await later(600)
    expect(h.writes.map(ids)).toEqual([['1', 'agent', 'mine']])
    expect(h.file.state()).toBe('saved')
    expect(h.notices).toEqual([])
  })

  test('[CV-91] [CV-93] if it keeps changing, saving pauses with one notice until Retry', async () => {
    const h = harness()
    h.edit([rect('1'), rect('mine')])
    let round = 0
    // Before each save lands, the file has changed again.
    const write = h.failures
    for (let i = 0; i < 4; i++) write.push(new Refused('changed'))
    await later(1200)
    for (; round < 5; round++) await later(600)
    expect(h.notices).toEqual(['keepsChanging'])
    expect(h.file.state()).toBe('failed')
    expect(h.writes).toEqual([])
    // Paused: edits don't try again by themselves.
    h.edit([rect('1'), rect('mine'), rect('more')])
    await later(10_000)
    expect(h.writes).toEqual([])
    h.file.retry()
    await later(0)
    expect(h.writes.map(ids)).toEqual([['1', 'mine', 'more']])
    expect(h.file.state()).toBe('saved')
  })

  test('[CV-92] other failures show one notice and retry after 2 s, doubling up to 30 s', async () => {
    const h = harness()
    for (let i = 0; i < 6; i++) h.failures.push(new Refused('unavailable'))
    h.edit([rect('2')])
    await later(1200)
    expect(h.file.state()).toBe('failed')
    const tries: number[] = []
    let elapsed = 0
    let left = h.failures.length
    while (h.writes.length === 0 && elapsed < 200_000) {
      await later(1000)
      elapsed += 1000
      if (h.failures.length !== left) {
        left = h.failures.length
        tries.push(elapsed)
      }
    }
    // Tries again after 2, 4, 8, 16 and 30 s; the next, 30 s later, saves.
    expect(tries.map((at, i) => at - (tries[i - 1] ?? 0))).toEqual([
      2000, 4000, 8000, 16_000, 30_000,
    ])
    expect(h.writes.map(ids)).toEqual([['2']])
    expect(h.notices).toEqual(['retrying'])
    expect(h.file.state()).toBe('saved')
  })

  test('[CV-93] Retry resumes a failed save immediately', async () => {
    const h = harness()
    h.failures.push(new Refused('unavailable'))
    h.edit([rect('2')])
    await later(1200)
    expect(h.file.state()).toBe('failed')
    h.file.retry()
    await later(0)
    expect(h.writes.map(ids)).toEqual([['2']])
  })

  test('[CV-95] persist finishes saving, and says when it can’t', async () => {
    const h = harness()
    h.edit([rect('2')])
    await expect(h.file.persist()).resolves.toBe(true)
    expect(h.writes.map(ids)).toEqual([['2']])
    for (let i = 0; i < 20; i++) h.failures.push(new Refused('unavailable'))
    h.edit([rect('3')])
    const persisted = h.file.persist()
    await later(6000)
    await expect(persisted).resolves.toBe(false)
    expect(h.file.pending()).toBe(true)
    h.file.discard()
    expect(h.file.pending()).toBe(false)
  })
})

describe('changes made to the file outside', () => {
  test('[CV-98] [CV-99] with no unsaved edits, the file replaces the scene', async () => {
    const h = harness([rect('1')])
    h.outside([rect('1', 2), rect('agent')])
    await h.file.fileChanged()
    expect(h.taken).toEqual([{ ids: ['1', 'agent'], merged: false }])
    // Taking it in is not an edit.
    h.nudge()
    await later(6000)
    expect(h.writes).toEqual([])
  })

  test('[CV-99] with unsaved edits, both are merged and the union is written back', async () => {
    const h = harness([rect('1')])
    h.edit([rect('1'), rect('mine')])
    h.outside([rect('1'), rect('agent')])
    h.writeBack(true)
    await h.file.fileChanged()
    expect(h.taken).toEqual([{ ids: ['1', 'agent'], merged: true }])
    await later(1200)
    expect(h.writes.map(ids)).toEqual([['1', 'agent', 'mine']])
  })

  test('[CV-100] the canvas’s own saves coming back are ignored', async () => {
    const h = harness()
    const release = h.holdWrites()
    h.edit([rect('2')])
    await later(1200)
    release()
    await later(0)
    await h.file.fileChanged()
    expect(h.taken).toEqual([])
  })

  test('[CV-100] a half-written or invalid file is skipped until the next change', async () => {
    const h = harness()
    h.disk.content = '{"type":"excalidraw","elements":[{"id":'
    h.disk.version = 'half'
    await h.file.fileChanged()
    expect(h.taken).toEqual([])
    h.outside([rect('1'), rect('agent')])
    await h.file.fileChanged()
    expect(h.taken).toEqual([{ ids: ['1', 'agent'], merged: false }])
  })
})
