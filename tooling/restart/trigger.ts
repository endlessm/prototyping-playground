// The restart trigger: the dev server's half of a restart. It decides which
// file changes restart the studio, waits out a system operation in progress,
// skips a change that put the files back as this server found them, and
// announces what it decided over the dev server's socket before asking Nuxt
// to restart. Its dependencies are passed in, so it runs on a temporary
// folder without Nuxt (`./nuxt-module.ts` wires the real ones).
import path from 'node:path'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { NO_RESTART_EVENT, RESTART_EVENT } from './names.ts'

type FileEvent = 'add' | 'change' | 'unlink'
const FILE_EVENTS: FileEvent[] = ['add', 'change', 'unlink']

export interface TriggerOptions {
  /** This dev server's identity: what its announcements name. */
  instance: string
  /** The studio's configuration file. */
  configFile: string
  /** The folder of systems, each declared by its `system.ts`. */
  systemsFolder: string
  /** A system operation's marker: while it exists, the restart waits. */
  marker: string
  /** The dev server's file watcher. */
  watcher: {
    add(paths: string[]): unknown
    on(event: FileEvent, listener: (file: string) => void): unknown
    off(event: FileEvent, listener: (file: string) => void): unknown
  }
  clock: {
    setTimeout(run: () => void, ms: number): unknown
    clearTimeout(timer: unknown): void
  }
  /** Tells the studio's open pages, over the dev server's socket. */
  announce(event: string, data: { instance: string }): void
  /** Asks Nuxt to restart. */
  restart(): void
}

export function restartTrigger(options: TriggerOptions) {
  const { clock } = options
  const configFile = path.resolve(options.configFile)
  const systems = path.resolve(options.systemsFolder)
  let timer: unknown

  // The files as this server found them: a change rolled back restores them,
  // and needs no restart.
  const snapshot = () => {
    const text = (file: string) =>
      existsSync(file) ? readFileSync(file, 'utf8') : ''
    const declarations = existsSync(systems)
      ? readdirSync(systems)
          .sort()
          .map((key) => [key, text(path.join(systems, key, 'system.ts'))])
      : []
    return JSON.stringify([text(configFile), declarations])
  }
  const started = snapshot()

  const decide = () => {
    // A system change in progress restarts the studio once it is done.
    if (existsSync(options.marker)) {
      timer = clock.setTimeout(decide, 250)
      return
    }
    if (snapshot() === started)
      return options.announce(NO_RESTART_EVENT, { instance: options.instance })
    options.announce(RESTART_EVENT, { instance: options.instance })
    timer = clock.setTimeout(options.restart, 200)
  }
  // The configuration, and each system's declaration: one created or
  // deleted counts too.
  const counts = (file: string) => {
    const resolved = path.resolve(file)
    return (
      resolved === configFile ||
      (path.basename(resolved) === 'system.ts' &&
        path.dirname(path.dirname(resolved)) === systems)
    )
  }
  const changed = (file: string) => {
    if (!counts(file)) return
    clock.clearTimeout(timer)
    timer = clock.setTimeout(decide, 150)
  }

  options.watcher.add([configFile, systems])
  for (const event of FILE_EVENTS) options.watcher.on(event, changed)
  return {
    /** Stops listening, as the dev server closes. */
    close() {
      clock.clearTimeout(timer)
      for (const event of FILE_EVENTS) options.watcher.off(event, changed)
    },
  }
}
