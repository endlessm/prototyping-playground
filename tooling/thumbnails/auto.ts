// The dev server's own pictures. A change inside a prototype marks it dirty;
// after a few seconds without another change to it, its first view is
// captured if its picture is missing or stale and the running contributor
// may change it (their own, or any as an Admin). Captures run one at a time
// in one shared headless Chromium, started on the first and closed when idle
// or when the dev server stops. Writing the picture changes only hidden
// files, which the fingerprint and this scheduler ignore, so it never causes
// another capture; the manifest refresh it triggers carries the new address
// to open galleries. Without Chromium it says so once and stops trying.
import { createHash } from 'node:crypto'
import {
  closeSync,
  openSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { teamOf } from '../contributors/roles.ts'
import type { Contributors } from '../contributors/profiles.ts'
import type { BuiltManifest } from '../manifest/build.ts'
import { readConfig } from '../modules/registry.ts'
import type { InstalledSystem } from '../systems/registry.ts'
import {
  ChromiumMissing,
  createThumbnailCapturer,
  type ThumbnailCapturer,
} from './capture.ts'
import { systemVersion, thumbnailStatus } from './fingerprint.ts'
import { firstView, thumbnailRefusal } from './targets.ts'

/** Quiet time after a prototype's last change before its picture. */
export const AUTO_QUIET_MS = 4000
/** Idle time after the last capture before the browser closes. */
export const AUTO_IDLE_MS = 3 * 60_000
// A lock older than this, or whose holder has exited, is left behind.
const LOCK_STALE_MS = 5 * 60_000

export interface AutoCaptureOptions {
  root: string
  /** Where prototypes live, relative to the root or absolute. */
  prototypesFolder: string
  /** The configuration file naming Admins. */
  configFile: string
  systems: InstalledSystem[]
  /** The manifest as it is now. */
  read: () => BuiltManifest
  contributors: () => Contributors
  /** The contributor running the dev server, or null for nobody. */
  contributor: () => string | null
  /** The studio's address with its base path, once it is listening. */
  studioUrl: () => string | null
  logger: { info: (message: string) => void; warn: (message: string) => void }
  quietMs?: number
  idleMs?: number
  capturer?: ThumbnailCapturer
}

const posix = (file: string) => file.split(path.sep).join('/')

/**
 * Takes the studio's thumbnail lock, so only one dev server captures at a
 * time. It sits outside the studio, where no watcher sees it, and names its
 * holder's process, so one left by an exited server is taken over. Returns
 * the release and a touch that keeps a long run's lock fresh, or null while
 * another holds it.
 */
export function thumbnailLock(root: string) {
  const lock = path.join(
    os.tmpdir(),
    `studio-thumbnails-${createHash('sha1').update(path.resolve(root)).digest('hex')}.lock`,
  )
  const take = () => {
    const fd = openSync(lock, 'wx')
    writeFileSync(fd, String(process.pid))
    closeSync(fd)
  }
  try {
    take()
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
    let abandoned: boolean
    try {
      const holder = Number(readFileSync(lock, 'utf8'))
      abandoned = Date.now() - statSync(lock).mtimeMs > LOCK_STALE_MS
      if (!abandoned && holder > 0 && holder !== process.pid)
        try {
          process.kill(holder, 0)
        } catch (gone) {
          abandoned = (gone as NodeJS.ErrnoException).code === 'ESRCH'
        }
    } catch {
      // Released meanwhile: the next try takes it.
      return null
    }
    if (!abandoned) return null
    rmSync(lock, { force: true })
    try {
      take()
    } catch {
      return null
    }
  }
  let held = true
  return {
    touch() {
      const now = new Date()
      if (held) utimesSync(lock, now, now)
    },
    release() {
      if (held) rmSync(lock, { force: true })
      held = false
    },
  }
}

export function createAutoCapture(options: AutoCaptureOptions) {
  const { root, logger } = options
  const quietMs = options.quietMs ?? AUTO_QUIET_MS
  const idleMs = options.idleMs ?? AUTO_IDLE_MS
  const capturer = options.capturer ?? createThumbnailCapturer()
  const prototypes = path.resolve(root, options.prototypesFolder)
  // Prototype folder (relative to the root) → its quiet timer.
  const waiting = new Map<string, ReturnType<typeof setTimeout>>()
  const queue: string[] = []
  let running = false
  let idle: ReturnType<typeof setTimeout> | null = null
  // No Chromium, or the server is closing: no more captures.
  let stopped = false

  /** The prototype folder a changed file belongs to, or null. */
  const prototypeOf = (file: string) => {
    const parts = path.relative(prototypes, path.resolve(file)).split(path.sep)
    const [owner, prototype, ...rest] = parts
    if (
      !owner ||
      owner === '..' ||
      path.isAbsolute(owner) ||
      !prototype ||
      !rest.length ||
      // Pictures, comments and other hidden files never change a view.
      parts.some((part) => part.startsWith('.') || part === 'node_modules')
    )
      return null
    return posix(path.relative(root, path.join(prototypes, owner, prototype)))
  }

  const keepIdle = () => {
    if (idle) clearTimeout(idle)
    idle = setTimeout(() => {
      idle = null
      if (!running) void capturer.close()
    }, idleMs)
    idle.unref?.()
  }

  async function captureOne(folder: string) {
    const built = options.read()
    const prototype = built.manifest.prototypes.find(
      (entry) => entry.folder === folder,
    )
    if (!prototype) return
    const contributors = options.contributors()
    const team = teamOf(readConfig(options.configFile), contributors)
    if (thumbnailRefusal(team, contributors, options.contributor(), prototype))
      return
    const view = firstView(built.artifacts[prototype.id] ?? [])
    if (!view) return
    const dir = path.resolve(root, folder)
    const version = systemVersion(
      options.systems.find(({ id }) => id === prototype.systemId),
    )
    if (thumbnailStatus(dir, prototype.systemId, version).state === 'current')
      return
    const studioUrl = options.studioUrl()
    if (!studioUrl) return
    const result = await capturer.capture(studioUrl, {
      dir,
      systemId: prototype.systemId,
      systemVersion: version,
      artifactId: view.id,
    })
    if (result.ok)
      logger.info(`Took a new picture of ${folder} (${view.path}).`)
    else
      logger.info(
        `No new picture of ${folder}: ${result.detail} Its last picture, if any, stays.`,
      )
  }

  async function drain() {
    if (running || stopped || !queue.length) return
    const lock = thumbnailLock(root)
    // Another dev server is capturing; try again after the next quiet spell.
    if (!lock) {
      const retry = setTimeout(() => void drain(), quietMs)
      retry.unref?.()
      return
    }
    running = true
    if (idle) clearTimeout(idle)
    try {
      while (queue.length && !stopped) {
        const folder = queue.shift()!
        lock.touch()
        try {
          await captureOne(folder)
        } catch (error) {
          if (error instanceof ChromiumMissing) {
            stopped = true
            queue.length = 0
            logger.warn(
              `Prototype pictures are off: ${error.message.replace(/ then run this again\.$/, ' then restart the dev server.')}`,
            )
          } else if (!stopped)
            logger.warn(
              `No new picture of ${folder}: ${(error as Error).message}`,
            )
        }
      }
    } finally {
      lock.release()
      running = false
      if (stopped) await capturer.close()
      else keepIdle()
    }
  }

  return {
    /** Files that changed on disk, as the manifest watcher reports them. */
    changed(files: readonly { file: string }[]) {
      if (stopped) return
      for (const { file } of files) {
        const folder = prototypeOf(file)
        if (!folder) continue
        const previous = waiting.get(folder)
        if (previous) clearTimeout(previous)
        const timer = setTimeout(() => {
          waiting.delete(folder)
          if (!queue.includes(folder)) queue.push(folder)
          void drain()
        }, quietMs)
        timer.unref?.()
        waiting.set(folder, timer)
      }
    },
    async close() {
      stopped = true
      queue.length = 0
      for (const timer of waiting.values()) clearTimeout(timer)
      waiting.clear()
      if (idle) clearTimeout(idle)
      await capturer.close()
    },
  }
}
