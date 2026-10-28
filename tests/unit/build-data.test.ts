import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { buildDataStore } from '../../tooling/modules/build-data'
import type { InstalledModule } from '../../tooling/modules/registry'
import type { ModuleBuildData } from '../../tooling/modules/contract'

const root = path.resolve('/studio')

function module(id: string, data: Record<string, ModuleBuildData>) {
  return {
    spec: { id, label: id, data },
    dir: path.join(root, 'src/modules', id),
    folder: `src/modules/${id}`,
    state: 'on',
  } satisfies InstalledModule
}

function counting(value: () => unknown = () => ({ pages: ['a'] })) {
  const calls = { count: 0 }
  const entry: ModuleBuildData = {
    watch: ['src/modules/manual/pages/**/*.md'],
    load: () => {
      calls.count++
      return value()
    },
  }
  return { calls, entry }
}

describe('module build data', () => {
  test('[CL-118] is named by module and computed on demand, not up front', async () => {
    const { calls, entry } = counting()
    const store = buildDataStore([module('manual', { pages: entry })], root)
    expect(store.keys).toEqual(['manual/pages'])
    expect(calls.count).toBe(0)
    expect(JSON.parse(await store.read('manual/pages'))).toEqual({
      pages: ['a'],
    })
    expect(calls.count).toBe(1)
  })

  test('[CL-118] is cached until a watched file changes', async () => {
    const { calls, entry } = counting()
    const store = buildDataStore([module('manual', { pages: entry })], root)
    await Promise.all([store.read('manual/pages'), store.read('manual/pages')])
    await store.read('manual/pages')
    expect(calls.count).toBe(1)

    expect(store.invalidate(path.join(root, 'README.md'))).toEqual([])
    await store.read('manual/pages')
    expect(calls.count).toBe(1)

    expect(
      store.invalidate(path.join(root, 'src/modules/manual/pages/a/b.md')),
    ).toEqual(['manual/pages'])
    await store.read('manual/pages')
    expect(calls.count).toBe(2)
  })

  test('[CL-118] a change during computation never publishes the old result', async () => {
    let release = () => {}
    let version = 0
    const entry: ModuleBuildData = {
      watch: ['src/modules/manual/pages/*.md'],
      load: async () => {
        const seen = ++version
        if (seen === 1) await new Promise<void>((done) => (release = done))
        return seen
      },
    }
    const store = buildDataStore([module('manual', { pages: entry })], root)
    const first = store.read('manual/pages')
    await new Promise((done) => setTimeout(done))
    store.invalidate(path.join(root, 'src/modules/manual/pages/a.md'))
    release()
    expect(await first).toBe('2')
  })

  test('[CL-118] gives the module and studio folders to the loader', async () => {
    const seen: unknown[] = []
    const store = buildDataStore(
      [
        module('manual', {
          pages: {
            watch: ['x.md'],
            load: (context) => seen.push(context),
          },
        }),
      ],
      root,
    )
    await store.read('manual/pages')
    expect(seen).toEqual([
      {
        root,
        dir: path.join(root, 'src/modules/manual'),
        enabled: ['manual'],
      },
    ])
  })

  test('[CL-118] refuses values that are not JSON, and unknown names', async () => {
    const store = buildDataStore(
      [
        module('manual', {
          broken: { watch: ['x.md'], load: () => ({ when: new Date() }) },
          missing: { watch: ['x.md'], load: () => ({ value: undefined }) },
        }),
      ],
      root,
    )
    await expect(store.read('manual/broken')).rejects.toThrow(/JSON/)
    await expect(store.read('manual/missing')).rejects.toThrow(/JSON/)
    await expect(store.read('manual/nothing')).rejects.toThrow(/unavailable/)
  })
})
