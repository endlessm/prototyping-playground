// Whether a prototype's picture still shows it: a fingerprint of what the
// picture was taken from, compared with the one its record keeps. It is read
// on every manifest refresh, so each file's hash is kept until the file's
// size or time changes.
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { parseOrder } from '../manifest/order.ts'
import type { InstalledSystem } from '../systems/registry.ts'
import { readThumbnail, type ThumbnailRecord } from './record.ts'

export type ThumbnailState = 'missing' | 'stale' | 'current'

export interface ThumbnailStatus {
  state: ThumbnailState
  /** The prototype's fingerprint now. */
  fingerprint: string
  record: ThumbnailRecord | null
}

const hashes = new Map<string, { size: number; time: number; hash: string }>()

// Line endings are left out, so a checkout that converts them agrees.
function fileHash(file: string) {
  const { size, mtimeMs } = statSync(file)
  const known = hashes.get(file)
  if (known && known.size === size && known.time === mtimeMs) return known.hash
  const bytes = readFileSync(file)
  const hash = createHash('sha256')
    .update(bytes.toString('latin1').replace(/\r\n/g, '\n'), 'latin1')
    .digest('hex')
  hashes.set(file, { size, time: mtimeMs, hash })
  return hash
}

// Every file a view could draw from: helpers too, never hidden files
// (pictures, comments) or installed packages.
function* contentFiles(dir: string, prefix = ''): Generator<string> {
  const entries = readdirSync(dir, { withFileTypes: true })
    .filter(({ name }) => !name.startsWith('.') && name !== 'node_modules')
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  for (const entry of entries) {
    const relative = `${prefix}${entry.name}`
    if (entry.isDirectory())
      yield* contentFiles(path.join(dir, entry.name), `${relative}/`)
    else if (entry.isFile()) yield relative
  }
}

const versions = new Map<string, { time: number; version: string }>()

/** The system's package version, as its `package.json` says now. */
export function systemVersion(system: InstalledSystem | null | undefined) {
  if (!system) return ''
  const file = path.join(system.dir, 'package.json')
  try {
    const time = statSync(file).mtimeMs
    const known = versions.get(file)
    if (known?.time === time) return known.version
    const { version } = JSON.parse(readFileSync(file, 'utf8'))
    const found = typeof version === 'string' ? version : ''
    versions.set(file, { time, version: found })
    return found
  } catch {
    return ''
  }
}

/**
 * Every non-hidden file in the prototype, its system's ID and its system's
 * package version. `meta.json` counts only by its `order`, which picks the
 * first view: a rename, archive or restore changes its title or status, not
 * the picture.
 */
export function prototypeFingerprint(
  dir: string,
  systemId: string | null,
  version: string,
) {
  const hash = createHash('sha256')
  hash.update(`system ${systemId ?? 'none'} ${version}\n`)
  for (const file of contentFiles(dir)) {
    if (file === 'meta.json') {
      let order: string[] | null = null
      try {
        order = parseOrder(
          JSON.parse(readFileSync(path.join(dir, file), 'utf8')).order,
        )
      } catch {
        // Unreadable metadata counts as no order.
      }
      hash.update(`order ${JSON.stringify(order ?? [])}\n`)
      continue
    }
    hash.update(`${file}\0${fileHash(path.join(dir, file))}\n`)
  }
  return hash.digest('hex').slice(0, 32)
}

/** Missing, stale (taken from other files) or current. */
export function thumbnailStatus(
  dir: string,
  systemId: string | null,
  version: string,
): ThumbnailStatus {
  const fingerprint = existsSync(dir)
    ? prototypeFingerprint(dir, systemId, version)
    : ''
  const record = readThumbnail(dir)
  return {
    state: !record
      ? 'missing'
      : record.fingerprint && record.fingerprint === fingerprint
        ? 'current'
        : 'stale',
    fingerprint,
    record,
  }
}
