// Merging a canvas saved elsewhere (an agent, another tab) into unsaved
// edits (CV-99). The island hands in Excalidraw's own `reconcileElements`
// and `newElementWith`, which need a browser; this stand-in follows the same
// rule: per element the higher version wins, a tie goes to the lower
// versionNonce, and the result is ordered by fractional index.
import { describe, expect, test } from 'vitest'
import {
  mergeRemote,
  type MergeElement,
} from '../../src/modules/canvas/utils/mergeRemote'

type El = MergeElement & { x?: number; index: string }

const excalidraw = {
  reconcile(local: readonly El[], remote: readonly El[]) {
    const mine = new Map(local.map((element) => [element.id, element]))
    const out = new Map<string, El>()
    for (const theirs of remote) {
      const ours = mine.get(theirs.id)
      const keepOurs =
        ours &&
        (ours.version > theirs.version ||
          (ours.version === theirs.version &&
            ours.versionNonce < theirs.versionNonce))
      out.set(theirs.id, keepOurs ? ours : theirs)
    }
    for (const ours of local) if (!out.has(ours.id)) out.set(ours.id, ours)
    return [...out.values()].sort((a, b) => (a.index < b.index ? -1 : 1))
  },
  deleted: (element: El): El => ({
    ...element,
    isDeleted: true,
    version: element.version + 1,
  }),
}

const el = (id: string, version: number, more: Partial<El> = {}): El => ({
  id,
  version,
  versionNonce: 1,
  index: `a${id}`,
  ...more,
})
const live = (elements: readonly El[]) =>
  elements
    .filter((element) => !element.isDeleted)
    .map(({ id, version, x }) => ({ id, version, ...(x == null ? {} : { x }) }))

describe('merging the file into unsaved edits', () => {
  test('[CV-99] per element the newer version wins, from either side', () => {
    const { elements, needsWriteBack } = mergeRemote(
      [el('1', 3, { x: 10 }), el('2', 1, { x: 0 })],
      [el('1', 2, { x: 99 }), el('2', 4, { x: 50 })],
      new Set(['1', '2']),
      excalidraw,
    )
    expect(live(elements)).toEqual([
      { id: '1', version: 3, x: 10 },
      { id: '2', version: 4, x: 50 },
    ])
    expect(needsWriteBack).toBe(false)
  })

  test('[CV-99] an element deleted in the file is removed here', () => {
    const { elements, needsWriteBack } = mergeRemote(
      [el('1', 1), el('2', 1)],
      [el('2', 1)],
      new Set(['1', '2']),
      excalidraw,
    )
    expect(live(elements)).toEqual([{ id: '2', version: 1 }])
    // Kept as deleted, so Excalidraw drops it like any delete.
    expect(elements.find((element) => element.id === '1')?.isDeleted).toBe(true)
    expect(needsWriteBack).toBe(false)
  })

  test('[CV-99] an element only here is kept, and the union is written back', () => {
    const { elements, needsWriteBack } = mergeRemote(
      [el('1', 1), el('3', 1)],
      [el('1', 1), el('2', 1)],
      new Set(['1']),
      excalidraw,
    )
    expect(live(elements).map(({ id }) => id)).toEqual(['1', '2', '3'])
    expect(needsWriteBack).toBe(true)
  })

  test('[CV-99] an element deleted here stays deleted when the file still has its older version', () => {
    const { elements, needsWriteBack } = mergeRemote(
      [el('1', 2, { isDeleted: true }), el('2', 1)],
      [el('1', 1), el('2', 1)],
      new Set(['1', '2']),
      excalidraw,
    )
    expect(live(elements).map(({ id }) => id)).toEqual(['2'])
    expect(needsWriteBack).toBe(false)
  })
})
