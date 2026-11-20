// A prototype's picture: two hidden files at its top level, the image and
// what it was taken from. Dot files are never artifacts, so the tree and the
// identity audit leave them alone, and renames, moves, archiving and
// restoring carry them with the folder.
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { isResourceId } from '../identity/resource-id.ts'

export const THUMBNAIL_IMAGE = '.thumbnail.jpg'
export const THUMBNAIL_RECORD = '.thumbnail.json'
export const THUMBNAIL_FORMAT_VERSION = 1

export interface ThumbnailRecord {
  formatVersion: typeof THUMBNAIL_FORMAT_VERSION
  /** The view the picture shows. */
  artifactId: string
  /** A named state of that view, when the picture shows one. */
  stateId?: string
  /**
   * What the prototype's files and system were when it was taken
   * (`./fingerprint.ts`); an empty string always reads as stale.
   */
  fingerprint: string
  /** ISO 8601. */
  capturedAt: string
}

export const thumbnailImage = (dir: string) => path.join(dir, THUMBNAIL_IMAGE)
export const thumbnailRecordFile = (dir: string) =>
  path.join(dir, THUMBNAIL_RECORD)

/** The prototype's record, or null when it has none or it is unreadable. */
export function readThumbnailRecord(dir: string): ThumbnailRecord | null {
  let value: Record<string, unknown>
  try {
    value = JSON.parse(readFileSync(thumbnailRecordFile(dir), 'utf8'))
  } catch {
    return null
  }
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    value.formatVersion !== THUMBNAIL_FORMAT_VERSION ||
    !isResourceId(value.artifactId) ||
    (value.stateId !== undefined && !isResourceId(value.stateId)) ||
    typeof value.fingerprint !== 'string' ||
    typeof value.capturedAt !== 'string' ||
    Number.isNaN(Date.parse(value.capturedAt))
  )
    return null
  return {
    formatVersion: THUMBNAIL_FORMAT_VERSION,
    artifactId: value.artifactId,
    ...(value.stateId ? { stateId: value.stateId as string } : {}),
    fingerprint: value.fingerprint,
    capturedAt: value.capturedAt,
  }
}

/** The record, when the image it describes is there too. */
export function readThumbnail(dir: string) {
  const record = readThumbnailRecord(dir)
  return record && existsSync(thumbnailImage(dir)) ? record : null
}

// A reader never sees half a file: each is written beside, then renamed.
function replace(file: string, content: string | Uint8Array) {
  const temporary = `${file}.${process.pid}.tmp`
  writeFileSync(temporary, content)
  renameSync(temporary, file)
}

export function writeThumbnailRecord(dir: string, record: ThumbnailRecord) {
  replace(thumbnailRecordFile(dir), `${JSON.stringify(record, null, 2)}\n`)
}

/** Writes the image first, so a record never names a missing picture. */
export function writeThumbnail(
  dir: string,
  image: Uint8Array,
  record: ThumbnailRecord,
) {
  replace(thumbnailImage(dir), image)
  writeThumbnailRecord(dir, record)
}

/** The address's cache key: changes with each new picture. */
export const thumbnailVersion = (record: ThumbnailRecord) =>
  Date.parse(record.capturedAt).toString(36)
