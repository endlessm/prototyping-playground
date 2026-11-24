// Where unsaved drafts of the Lab's versions live while the studio runs
// locally: `.studio/drafts/lab-versions/<the view's path inside the
// prototypes folder>`, a folder that keeps itself out of Git. The Lab's
// Playground edits a version in its draft, which only the version's stage
// renders, until Save writes it over the file. `STUDIO_DRAFTS_DIR` moves the
// folder, for test servers. Plain Node, so the preview pipeline, the file
// service and the Lab's handler share it.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

export const DRAFTS_ENV = 'STUDIO_DRAFTS_DIR'

/** The drafts folder, absolute. */
export const draftsDir = (root: string) =>
  process.env[DRAFTS_ENV]
    ? path.resolve(process.env[DRAFTS_ENV])
    : path.join(root, '.studio/drafts')

/** The versions' drafts inside the drafts folder, without making it. */
export const versionDraftsPath = (drafts: string) =>
  path.join(drafts, 'lab-versions')

/**
 * The drafts of the Lab's versions, which are views in prototypes: each at
 * its view's path inside the prototypes folder (`draftMap(prototypesDir,
 * dir)`). Made with the folder's `.gitignore` if missing.
 */
export function versionDraftsDir(drafts: string) {
  mkdirSync(drafts, { recursive: true })
  const ignore = path.join(drafts, '.gitignore')
  if (!existsSync(ignore)) writeFileSync(ignore, '*\n')
  const dir = versionDraftsPath(drafts)
  mkdirSync(dir, { recursive: true })
  return dir
}

/** Whether `file` is `dir` or inside it. */
export function within(file: string, dir: string) {
  const relative = path.relative(dir, file)
  return (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  )
}

/**
 * Maps between files and their drafts: the draft standing in for a file
 * inside `filesDir`, and the file a draft stands in for (null outside them).
 */
export function draftMap(filesDir: string, draftDir: string) {
  return {
    draftOf: (file: string) =>
      within(file, filesDir) && file !== filesDir
        ? path.join(draftDir, path.relative(filesDir, file))
        : null,
    originOf: (file: string) =>
      within(file, draftDir) && file !== draftDir
        ? path.join(filesDir, path.relative(draftDir, file))
        : null,
  }
}
