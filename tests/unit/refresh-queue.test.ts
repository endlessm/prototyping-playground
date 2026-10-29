import { describe, expect, test } from 'vitest'
import { createRefreshQueue } from '../../tooling/live/refresh-queue'

// File events arrive in bursts (a folder move is dozens). The queue turns a
// burst into one refresh, runs refreshes one at a time, and a change that
// arrives during a refresh schedules one more, so the latest is never lost.
function manualSchedule() {
  const pending: (() => void)[] = []
  return {
    schedule: (callback: () => void) => pending.push(callback),
    flush: () => pending.splice(0).forEach((callback) => callback()),
    get size() {
      return pending.length
    },
  }
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('the refresh queue', () => {
  test('[SH-137] [CL-121] a burst of changes becomes one refresh', async () => {
    const clock = manualSchedule()
    let refreshes = 0
    const request = createRefreshQueue(async () => {
      refreshes++
    }, clock.schedule)
    for (let index = 0; index < 50; index++) request()
    expect(clock.size).toBe(1)
    clock.flush()
    await tick()
    expect(refreshes).toBe(1)
  })

  test('[SH-137] a change during a refresh is applied after it, never lost or run alongside', async () => {
    const clock = manualSchedule()
    const seen: number[] = []
    let version = 0
    let running = 0
    let overlap = false
    let release!: () => void
    const request = createRefreshQueue(async () => {
      running++
      if (running > 1) overlap = true
      const read = version
      if (seen.length === 0) await new Promise<void>((done) => (release = done))
      seen.push(read)
      running--
    }, clock.schedule)
    version = 1
    request()
    clock.flush()
    await tick()
    // The file changes again while the first refresh is still reading.
    version = 2
    request()
    request()
    clock.flush()
    release()
    await tick()
    clock.flush()
    await tick()
    expect(seen).toEqual([1, 2])
    expect(overlap).toBe(false)
  })

  test('[SH-137] a failed refresh does not stop later ones', async () => {
    const clock = manualSchedule()
    let calls = 0
    const request = createRefreshQueue(async () => {
      calls++
      if (calls === 1) throw new Error('read failed')
    }, clock.schedule)
    request()
    clock.flush()
    await tick()
    request()
    clock.flush()
    await tick()
    expect(calls).toBe(2)
  })
})
