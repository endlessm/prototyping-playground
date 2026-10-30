// Renames and moves made outside the studio while the dev server runs: an
// editor, File Explorer or Finder. Each prototype you may change is
// remembered as its files' identities on disk; when files come and go, the
// new state is compared with the old, and references are repaired for the
// moves that are certain (`fileMoves`). Copies, deletes, moves between
// prototypes and ambiguous cases are left alone. The studio's own moves
// repair as they happen and then `capture`, so they aren't repaired twice.
// Framework-neutral; `server/moves.ts` runs it in the dev server.
import { lstatSync } from 'node:fs'
import {
  fileMoves,
  repairReferences,
  snapshotFiles,
  type ReferenceAdapter,
} from './references.ts'

export interface WatchMovesOptions {
  /** The folders of the prototypes whose moves to repair, now. */
  scopes: () => string[]
  references: () => Promise<ReferenceAdapter[]>
  /** After references were repaired in `dir`. */
  onRepair?: (dir: string, relinked: string[]) => void
  onError?: (dir: string, error: Error) => void
}

export function watchMoves(options: WatchMovesOptions) {
  // By the folder's own identity, so a prototype folder renamed meanwhile
  // is still recognized.
  let previous = new Map<string, Map<string, string>>()
  const identity = (dir: string) => {
    const stat = lstatSync(dir, { bigint: true })
    return `${stat.dev}:${stat.ino}`
  }
  function snapshot() {
    const next = new Map<string, { dir: string; files: Map<string, string> }>()
    for (const dir of options.scopes())
      try {
        next.set(identity(dir), { dir, files: snapshotFiles(dir) })
      } catch {
        // A folder going away.
      }
    return next
  }

  return {
    /** Remembers every prototype as it is now. */
    capture() {
      previous = new Map(
        [...snapshot()].map(([id, { files }]) => [id, files] as const),
      )
    },

    /** Repairs the references of what moved since the last look. */
    async flush() {
      // Loaded first: from here on nothing else runs until it's done, so a
      // move the studio makes meanwhile can't land in the middle.
      const adapters = await options.references()
      const current = snapshot()
      const earlier = previous
      previous = new Map(
        [...current].map(([id, { files }]) => [id, files] as const),
      )
      for (const [id, { dir, files }] of current) {
        const old = earlier.get(id)
        if (!old) continue
        const moves = fileMoves(old, files)
        if (!moves.size) continue
        try {
          const relinked = repairReferences(
            dir,
            new Set(old.keys()),
            moves,
            adapters,
          )
          if (relinked.length) options.onRepair?.(dir, relinked)
        } catch (error) {
          options.onError?.(dir, error as Error)
        }
        // What the repair wrote isn't a move.
        previous.set(id, snapshotFiles(dir))
      }
    },
  }
}
