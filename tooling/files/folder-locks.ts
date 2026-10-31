// Moving whole folders that another program may hold open. On Windows a
// folder can't be renamed while a process holds it or something inside it
// (a running dev server's watcher, an editor, a terminal opened there), so
// operations probe the folders they will move before asking for
// confirmation, and a refused rename falls back to copy-then-remove.
// Shared by the system lifecycle (`../systems/lifecycle.ts`).
import { cpSync, existsSync, renameSync, rmSync } from 'node:fs'
import path from 'node:path'

const LOCKED = new Set(['EPERM', 'EBUSY', 'EACCES'])
export const isLockError = (error: unknown) =>
  LOCKED.has((error as NodeJS.ErrnoException)?.code ?? '')
// A rename across drives (to the system's temporary folder) is refused the
// same way, and copies just as well.
const refused = (error: unknown) =>
  isLockError(error) || (error as NodeJS.ErrnoException)?.code === 'EXDEV'

export const UNKNOWN_HOLDER =
  'another program, often a running dev server, an editor or a terminal opened in that folder'

/** Names what holds a folder, when something is known to. */
export type DescribeHolder = (folder: string) => string | null | undefined

/** The file system steps a move takes; tests refuse some of them. */
export interface FolderOps {
  rename?: (from: string, to: string) => void
  copy?: (from: string, to: string) => void
  remove?: (folder: string) => void
}

export interface HeldFolder {
  folder: string
  holder: string
  code?: string
}

const defaults: Required<FolderOps> = {
  rename: (from, to) => renameSync(from, to),
  copy: (from, to) =>
    cpSync(from, to, {
      recursive: true,
      errorOnExist: true,
      force: false,
      verbatimSymlinks: true,
    }),
  remove: (folder) =>
    rmSync(folder, { recursive: true, force: true, maxRetries: 2 }),
}

/**
 * What holds `folder`, or null. A known holder answers first; on Windows
 * the folder is also renamed beside itself and back. Elsewhere open
 * handles never refuse a rename, so nothing moves.
 */
export function probeFolder(
  folder: string,
  {
    describeHolder,
    platform = process.platform,
    ops = {},
  }: {
    describeHolder?: DescribeHolder
    platform?: NodeJS.Platform
    ops?: FolderOps
  } = {},
): HeldFolder | null {
  if (!existsSync(folder)) return null
  const known = describeHolder?.(folder)
  if (known) return { folder, holder: known }
  if (platform !== 'win32') return null
  const rename = ops.rename ?? defaults.rename
  const probe = path.join(
    path.dirname(folder),
    `.${path.basename(folder)}.studio-lock-probe-${process.pid}`,
  )
  try {
    rename(folder, probe)
  } catch (error) {
    if (!isLockError(error)) throw error
    return {
      folder,
      holder: UNKNOWN_HOLDER,
      code: (error as NodeJS.ErrnoException).code,
    }
  }
  rename(probe, folder)
  return null
}

/** One sentence naming the holder and what to do next. */
export const heldSentence = (held: HeldFolder, root: string) =>
  `${path.relative(root, held.folder).replaceAll('\\', '/')} is in use by ${held.holder}. Stop it, then try again.`

/** A move refused because something holds the folder. */
export class HeldError extends Error {
  held: HeldFolder
  constructor(held: HeldFolder, cause: unknown) {
    super((cause as Error).message, { cause })
    this.held = held
  }
}

/**
 * Moves a folder. A refused rename falls back to copy-then-remove; if the
 * removal fails part way, `from` is put back as it was and the error names
 * the holder.
 */
export function moveFolder(
  from: string,
  to: string,
  {
    ops = {},
    describeHolder,
  }: { ops?: FolderOps; describeHolder?: DescribeHolder } = {},
): 'rename' | 'copy' {
  const { rename, copy, remove } = { ...defaults, ...ops }
  const holder = (error: unknown) =>
    new HeldError(
      {
        folder: from,
        holder: describeHolder?.(from) || UNKNOWN_HOLDER,
        code: (error as NodeJS.ErrnoException).code,
      },
      error,
    )
  try {
    rename(from, to)
    return 'rename'
  } catch (error) {
    if (!refused(error)) throw error
  }
  try {
    copy(from, to)
  } catch (error) {
    // `from` is untouched; drop the partial copy.
    defaults.remove(to)
    throw holder(error)
  }
  try {
    remove(from)
  } catch (error) {
    // Some files may be gone already: restore them from the whole copy.
    cpSync(to, from, { recursive: true, force: true, verbatimSymlinks: true })
    defaults.remove(to)
    throw holder(error)
  }
  return 'copy'
}
