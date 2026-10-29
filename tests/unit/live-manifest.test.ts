import { describe, expect, test } from 'vitest'
import {
  createLiveManifest,
  createMutationQueue,
} from '../../tooling/live/live-manifest'

// A tab's own changes go through one queue: they run one after another and
// apply the content they return once, in order. The same content arriving
// again from the server (the tab's own change echoed, or another tab's) is
// applied only if it is new.
const content = (revision: string) => ({ revision, title: revision })

describe('changes made in this tab', () => {
  test('[SH-140] run one at a time, in the order they were made', async () => {
    const live = createLiveManifest(content('r0'))
    const queue = createMutationQueue(live)
    const started: string[] = []
    let releaseFirst!: () => void
    const first = queue.run(async () => {
      started.push('first')
      await new Promise<void>((done) => (releaseFirst = done))
      return { manifest: content('r1') }
    })
    const second = queue.run(async () => {
      started.push('second')
      return { manifest: content('r2') }
    })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(started).toEqual(['first'])
    releaseFirst()
    await first
    await second
    expect(started).toEqual(['first', 'second'])
    expect(live.current.revision).toBe('r2')
  })

  test('[SH-140] apply once: the server echoing the same content changes nothing', async () => {
    const live = createLiveManifest(content('r0'))
    const applied: string[] = []
    live.subscribe((manifest) => applied.push(manifest.revision))
    const queue = createMutationQueue(live)
    await queue.run(async () => ({ manifest: content('r1') }))
    expect(live.receive(content('r1'))).toBe(false)
    expect(live.receive(content('r2'))).toBe(true)
    expect(applied).toEqual(['r1', 'r2'])
  })

  test('[SH-140] a rejected change leaves the content alone and the next one still runs', async () => {
    const live = createLiveManifest(content('r0'))
    const queue = createMutationQueue(live)
    await expect(
      queue.run(async () => {
        throw new Error('Denied')
      }),
    ).rejects.toThrow('Denied')
    await expect(
      queue.run(async () => ({ manifest: undefined as never })),
    ).rejects.toThrow(/content/)
    expect(live.current.revision).toBe('r0')
    await queue.run(async () => ({ manifest: content('r3') }))
    expect(live.current.revision).toBe('r3')
  })

  test('[SH-140] a request is marked as coming from this tab', () => {
    const queue = createMutationQueue(createLiveManifest(content('r0')))
    expect(queue.headers['X-Studio-Tab']).toMatch(/^[a-z0-9]{8,}$/)
    expect(
      createMutationQueue(createLiveManifest(content('r0'))).headers,
    ).not.toEqual(queue.headers)
  })
})
