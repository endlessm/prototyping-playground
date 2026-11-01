// The dev-server registry: one record of this studio's running `yarn dev`, so
// people and agents can see it (`yarn studio dev status`) and restart or stop
// only it. The record lives in `.studio/runtime/`, a folder that keeps itself
// out of Git. `STUDIO_RUNTIME_DIR` moves it, for test servers.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

/** Set to `1` to start a second dev server while one runs. */
export const FORCE_ENV = 'STUDIO_DEV_FORCE'

export interface DevServerRecord {
  root: string
  port: number
  pid: number
  url?: string
  startedAt: string
  startedBy: string
}

export type DevServerStatus =
  { state: 'absent' } | { state: 'running' | 'stale'; record: DevServerRecord }

export const runtimeDir = (root: string) =>
  process.env.STUDIO_RUNTIME_DIR
    ? path.resolve(process.env.STUDIO_RUNTIME_DIR)
    : path.join(root, '.studio/runtime')
const recordFile = (root: string) =>
  path.join(runtimeDir(root), 'dev-server.json')
export const logFile = (root: string) =>
  path.join(runtimeDir(root), 'dev-server.log')

// Windows paths compare without case.
const sameRoot = (a: string, b: string) =>
  process.platform === 'win32'
    ? path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase()
    : path.resolve(a) === path.resolve(b)

// A process that has ended but that its parent has not yet collected (a
// zombie) still answers signal 0 on Linux and macOS. A parent blocked in a
// synchronous call, such as a script running `yarn studio dev stop`, leaves
// its stopped server in that state until the call returns.
function isZombie(pid: number) {
  if (process.platform === 'linux') {
    try {
      const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8')
      // "pid (name) state …"; the name may itself hold spaces or parentheses.
      return /^[ZX]/.test(stat.slice(stat.lastIndexOf(')') + 2))
    } catch {
      return false
    }
  }
  if (process.platform === 'darwin')
    return /^\s*Z/.test(
      spawnSync('ps', ['-o', 'stat=', '-p', String(pid)], { encoding: 'utf8' })
        .stdout ?? '',
    )
  return false
}

/** Whether a process runs; EPERM means it belongs to someone else. */
export function isAlive(pid: number) {
  if (!Number.isInteger(pid) || pid <= 0) return false
  try {
    process.kill(pid, 0)
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM'
  }
  return !isZombie(pid)
}

/** The record and whether its process still runs. */
export function readDevServer(
  root: string,
  { alive = isAlive }: { alive?: (pid: number) => boolean } = {},
): DevServerStatus {
  let record: DevServerRecord
  try {
    record = JSON.parse(fs.readFileSync(recordFile(root), 'utf8'))
  } catch {
    return { state: 'absent' }
  }
  // A copied studio carries the original's record, which names another root.
  if (
    !record ||
    typeof record !== 'object' ||
    !Number.isInteger(record.pid) ||
    !sameRoot(record.root ?? '', root)
  )
    return { state: 'absent' }
  return { state: alive(record.pid) ? 'running' : 'stale', record }
}

export function recordDevServer(
  root: string,
  fields: Omit<DevServerRecord, 'root'>,
) {
  const dir = runtimeDir(root)
  fs.mkdirSync(dir, { recursive: true })
  const ignore = path.join(dir, '.gitignore')
  if (!fs.existsSync(ignore)) fs.writeFileSync(ignore, '*\n')
  const record: DevServerRecord = { root: path.resolve(root), ...fields }
  const temporary = `${recordFile(root)}.${process.pid}.tmp`
  fs.writeFileSync(temporary, `${JSON.stringify(record, null, 2)}\n`)
  fs.renameSync(temporary, recordFile(root))
  return record
}

/** Removes the record, only when it belongs to `pid` (any, by default). */
export function clearDevServer(root: string, pid?: number) {
  const current = readDevServer(root, { alive: () => true })
  if (current.state === 'absent') return false
  if (pid !== undefined && current.record.pid !== pid) return false
  fs.rmSync(recordFile(root), { force: true })
  return true
}

/** "the dev server on port 3000 (process 1234, started by ada)" */
export const describeDevServer = (record: DevServerRecord) =>
  `the dev server on port ${record.port} (process ${record.pid}, started by ${record.startedBy || 'an unknown session'})`

function ago(ms: number) {
  const minutes = Math.max(0, Math.round(ms / 60_000))
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  return hours < 48 ? `${hours} h ago` : `${Math.round(hours / 24)} days ago`
}

export function statusLines(status: DevServerStatus, now = Date.now()) {
  if (status.state === 'absent')
    return [
      'No dev server is recorded for this studio. Start one with yarn dev.',
    ]
  const { record } = status
  if (status.state === 'stale')
    return [
      `Stale record: ${describeDevServer(record)} is no longer running.`,
      'Start one with yarn dev, run yarn studio dev restart to start it again on the same port, or yarn studio dev stop to clear the record.',
    ]
  const started = Date.parse(record.startedAt)
  return [
    `Running: ${record.url ?? `http://localhost:${record.port}/`} (port ${record.port}, process ${record.pid}), started by ${record.startedBy} since ${record.startedAt}${Number.isNaN(started) ? '' : ` (${ago(now - started)})`}.`,
  ]
}
