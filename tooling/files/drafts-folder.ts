// Where unsaved drafts of systems' files live while the studio runs locally:
// `.studio/drafts/<system id>/<path inside the system's folder>`, a folder
// that keeps itself out of Git. The Lab's Playground edits a component in
// its draft, which only the Playground's stage renders, until Save writes
// it over the file. `STUDIO_DRAFTS_DIR` moves the folder, for test servers.
// Plain Node, so the preview pipeline and the file service share it.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

export const DRAFTS_ENV = 'STUDIO_DRAFTS_DIR'

/** The drafts folder, absolute. */
export const draftsDir = (root: string) =>
  process.env[DRAFTS_ENV]
    ? path.resolve(process.env[DRAFTS_ENV])
    : path.join(root, '.studio/drafts')

/** One system's drafts, made with the folder's `.gitignore` if missing. */
export function systemDraftsDir(drafts: string, systemId: string) {
  mkdirSync(drafts, { recursive: true })
  const ignore = path.join(drafts, '.gitignore')
  if (!existsSync(ignore)) writeFileSync(ignore, '*\n')
  const dir = path.join(drafts, systemId)
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
 * Maps between a system's files and their drafts: the draft standing in for
 * a file, and the file a draft stands in for (null outside them).
 */
export function draftMap(systemDir: string, draftDir: string) {
  return {
    draftOf: (file: string) =>
      within(file, systemDir) && file !== systemDir
        ? path.join(draftDir, path.relative(systemDir, file))
        : null,
    originOf: (file: string) =>
      within(file, draftDir) && file !== draftDir
        ? path.join(systemDir, path.relative(draftDir, file))
        : null,
  }
}
