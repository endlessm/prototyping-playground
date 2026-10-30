// Named data modules compute on Node (their `data` loaders), keyed
// `<module>/<name>`. Nothing is computed until it is read; a result stays
// cached until one of its watched files changes.
import path from 'node:path'
import type { ModuleBuildData } from './contract.ts'
import type { InstalledModule } from './registry.ts'

/** Pending work belongs to a generation; a change starts a new one. */
function generationCache<V>(load: (key: string) => Promise<V>) {
  const states = new Map<string, { revision: number; pending?: Promise<V> }>()
  return {
    async read(key: string): Promise<V> {
      let state = states.get(key)
      if (!state) states.set(key, (state = { revision: 0 }))
      for (;;) {
        const revision = state.revision
        const pending = (state.pending ??= Promise.resolve().then(() =>
          load(key),
        ))
        try {
          const value = await pending
          if (revision === state.revision) return value
        } catch (error) {
          if (revision !== state.revision) continue
          // A failure stays retryable.
          if (state.pending === pending) state.pending = undefined
          throw error
        }
      }
    },
    invalidate(key: string) {
      const state = states.get(key)
      if (!state) return
      state.revision++
      state.pending = undefined
    },
  }
}

function isPlainObject(value: object) {
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

/** JSON text, refusing anything JSON would change or drop silently. */
export function serializeData(value: unknown, key: string): string {
  const seen = new Set<object>()
  const check = (item: unknown, where: string): void => {
    if (item === null || typeof item === 'string' || typeof item === 'boolean')
      return
    if (typeof item === 'number' && Number.isFinite(item)) return
    if (
      typeof item === 'object' &&
      (Array.isArray(item) || isPlainObject(item))
    ) {
      if (seen.has(item)) throw new Error(`${key}: ${where} is a cycle.`)
      seen.add(item)
      for (const [name, child] of Object.entries(item))
        check(child, `${where}.${name}`)
      seen.delete(item)
      return
    }
    throw new Error(
      `${key}: ${where} is not JSON (only strings, finite numbers, booleans, null, arrays and plain objects).`,
    )
  }
  check(value, 'value')
  return JSON.stringify(value)
}

function watchRoot(root: string, pattern: string) {
  const fixed = pattern.split(/[?*{]/)[0]!
  return path.resolve(
    root,
    fixed === pattern || !fixed.endsWith('/') ? path.dirname(fixed) : fixed,
  )
}

export function buildDataStore(
  enabled: InstalledModule[],
  root: string,
  {
    dev = false,
    studio = {},
  }: {
    dev?: boolean
    /**
     * The studio's own data, whatever modules are on, keyed
     * `studio/<name>`; its loaders get the root as their folder.
     */
    studio?: Record<string, ModuleBuildData>
  } = {},
) {
  const entries = new Map<string, { dir: string; data: ModuleBuildData }>([
    ...enabled.flatMap((module) =>
      Object.entries(module.spec.data ?? {}).map(
        ([name, data]) =>
          [`${module.spec.id}/${name}`, { dir: module.dir, data }] as const,
      ),
    ),
    ...Object.entries(studio).map(
      ([name, data]) => [`studio/${name}`, { dir: root, data }] as const,
    ),
  ])
  const ids = enabled.map(({ spec }) => spec.id)
  const cache = generationCache(async (key) => {
    const entry = entries.get(key)
    if (!entry) throw new Error(`Build data ${key} is unavailable.`)
    const value = await entry.data.load({
      root,
      dir: entry.dir,
      enabled: ids,
      dev,
    })
    return serializeData(value, key)
  })
  return {
    keys: [...entries.keys()],
    read: cache.read,
    /** Folders to watch for changes. */
    watchRoots: [
      ...new Set(
        [...entries.values()].flatMap(({ data }) =>
          data.watch.map((pattern) => watchRoot(root, pattern)),
        ),
      ),
    ],
    /** Marks data stale after `file` changed; returns the keys it affects. */
    invalidate(file: string) {
      const relative = path.relative(root, file).split(path.sep).join('/')
      const changed: string[] = []
      for (const [key, { data }] of entries)
        if (data.watch.some((pattern) => path.matchesGlob(relative, pattern))) {
          cache.invalidate(key)
          changed.push(key)
        }
      return changed
    },
  }
}
