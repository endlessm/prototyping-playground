// The file service's drafts of a system's source files (`./drafts-folder.ts`):
// read, written and discarded by the system's permanent ID and a path inside
// its folder, for the files the system source route reaches. Writing one
// takes the same permission as saving the file (an Admin or one of the
// system's maintainers, while it is active); a draft equal to the file is
// no draft, so it is removed. Saving goes through the source route over the
// version read, then discards the draft. Framework-neutral;
// `server/system-draft.ts` wraps it.
import {
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs'
import path from 'node:path'
import { posix } from '../manifest/build.ts'
import { draftsDir, systemDraftsDir } from './drafts-folder.ts'
import { FileServiceError, MAX_SOURCE_BYTES } from './source.ts'
import {
  systemFiles,
  type SystemFileAddress,
  type SystemSourceOptions,
} from './system-source.ts'

export interface SystemDraftOptions extends SystemSourceOptions {
  /** The drafts folder; `draftsDir(root)` when left out. */
  draftsFolder?: string
}

function listFiles(dir: string, prefix = ''): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const inside = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory())
      return listFiles(path.join(dir, entry.name), inside)
    return entry.isFile() ? [inside] : []
  })
}

export function createSystemDraftService(options: SystemDraftOptions) {
  const { systemOf, refusalFor, locate } = systemFiles(options)
  const folder = options.draftsFolder ?? draftsDir(options.root)

  async function place(address: SystemFileAddress) {
    const found = await locate(address)
    const dir = systemDraftsDir(folder, found.system.id)
    return { ...found, draft: path.join(dir, ...address.path.split('/')) }
  }

  return {
    /** The draft's text, or null when the file has none. */
    async read(address: SystemFileAddress): Promise<{ draft: string | null }> {
      const { draft } = await place(address)
      return { draft: existsSync(draft) ? readFileSync(draft, 'utf8') : null }
    },

    /** The files of the system that have a draft, inside its folder. */
    async list(system: string): Promise<{ files: string[] }> {
      const found = await systemOf(system)
      if (!found.system)
        throw new FileServiceError(404, 'not_found', 'No such system.')
      return {
        files: listFiles(path.join(folder, found.system.id)).map(posix),
      }
    },

    /** Writes the draft, or removes it when it matches the file. */
    async write(
      address: SystemFileAddress & { content: unknown },
    ): Promise<{ draft: boolean }> {
      const { system, file, config, draft } = await place(address)
      const refusal = refusalFor(system, config)
      if (refusal)
        throw new FileServiceError(403, refusal.code, refusal.message)
      const { content } = address
      if (
        typeof content !== 'string' ||
        Buffer.byteLength(content) > MAX_SOURCE_BYTES
      )
        throw new FileServiceError(
          413,
          'too_large',
          'This file is too large to edit here. Keep files under 750 KB.',
        )
      if (content === readFileSync(file, 'utf8')) {
        rmSync(draft, { force: true })
        return { draft: false }
      }
      // Rewriting the same text would send the stage a needless update.
      if (existsSync(draft) && readFileSync(draft, 'utf8') === content)
        return { draft: true }
      mkdirSync(path.dirname(draft), { recursive: true })
      writeFileSync(draft, content)
      return { draft: true }
    },

    /**
     * Removes the draft. Anyone may: a draft only changes this computer's
     * Playground, and losing the permission to save shouldn't leave one.
     */
    async discard(address: SystemFileAddress): Promise<{ draft: false }> {
      const { draft } = await place(address)
      rmSync(draft, { force: true })
      return { draft: false }
    },
  }
}
