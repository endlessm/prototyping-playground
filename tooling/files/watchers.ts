// The dev server's file watchers, so a whole prototype's folder can be
// renamed or moved to the trash while the studio runs. On Windows a watcher
// keeps a handle on each folder it watches, and a folder can't be renamed
// or trashed while one of the folders inside it is held. The watchers (the
// studio's own and each preview document's) let go of a folder and
// everything in it first, and watch its path again afterwards. They live in
// the dev server's main process; the file service, which runs apart, asks
// over HTTP (`nuxt-module.ts`).
import { readdirSync } from 'node:fs'
import path from 'node:path'

/** The main process's route the file service calls (`nuxt-module.ts`). */
export const RELEASE_ROUTE = '_studio/files/release'

/** What the studio needs of a Vite (chokidar) watcher. */
export interface FolderWatcher {
  add: (paths: string | string[]) => unknown
  unwatch: (paths: string | string[]) => unknown
  /** Set once the watcher is closed, with its server. */
  closed?: boolean
}

const KEY = Symbol.for('design-studio.file-watchers')
const store = globalThis as unknown as Record<
  symbol,
  { watchers: Set<FolderWatcher>; released: Map<string, string[]> }
>
const state = (store[KEY] ??= { watchers: new Set(), released: new Map() })

/** Adds a watcher; returns how to remove it again. */
export function registerWatcher(watcher: FolderWatcher) {
  state.watchers.add(watcher)
  return () => state.watchers.delete(watcher)
}

/** The watchers still open; closed ones are forgotten. */
function open() {
  for (const watcher of state.watchers)
    if (watcher.closed) state.watchers.delete(watcher)
  return [...state.watchers]
}

/** The folder and everything inside it, deepest first. */
function inside(dir: string): string[] {
  let entries: string[] = []
  try {
    entries = readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const file = path.join(dir, entry.name)
      return entry.isDirectory() ? inside(file) : [file]
    })
  } catch {
    // Gone already.
  }
  return [...entries, dir]
}

/** Every watcher lets go of the folder and what is in it. */
export function releaseFolder(dir: string) {
  const paths = inside(path.resolve(dir))
  state.released.set(path.resolve(dir), paths)
  for (const watcher of open()) watcher.unwatch(paths)
}

/**
 * Every watcher watches the folder's paths again, whether or not they are
 * still there, so whatever appears there later is seen.
 */
export function restoreFolder(dir: string) {
  const paths = state.released.get(path.resolve(dir))
  if (!paths) return
  state.released.delete(path.resolve(dir))
  for (const watcher of open()) watcher.add(paths)
}
