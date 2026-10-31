// Organizing whole prototypes, for their menus (through the dev server's
// file service) and agents: renaming (the folder follows the title, the
// permanent link and IDs stay), duplicating (a copy with fresh identities,
// or a rebuild copy for another system), archiving and restoring, and
// deleting to the computer's own trash. Each is checked against who is
// working: the owner or an Admin. Framework-neutral; the dev server's route
// (`server/prototypes.ts`) wraps it.
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import trashFile from 'trash'
import { readContributors } from '../contributors/profiles.ts'
import { newStudioId } from '../contributors/studio-ids.ts'
import { identityLock } from '../identity/assign.ts'
import { auditIdentities, identitiesInUse } from '../identity/audit.ts'
import { posix, PROTOTYPES_FOLDER, treeFiles } from '../manifest/build.ts'
import { CONFIG_FILE } from '../modules/registry.ts'
import { registeredSystems } from '../studio/systems.ts'
import { localDate, slugify, systemFor, titleProblem } from './prototypes.ts'
import {
  movesOf,
  repairReferences,
  snapshotFiles,
  type ReferenceAdapter,
} from './references.ts'
import {
  defaultIdentify,
  fileAccess,
  FileServiceError,
  MAX_SOURCE_BYTES,
  type FileServiceOptions,
} from './source.ts'
import type { TrashPlace } from './tree.ts'

export interface OrganizeOptions extends FileServiceOptions {
  /** Where each kind of source names other files, to repair on renames. */
  references?: ReferenceAdapter[]
  /** Moves a folder to the computer's trash. */
  trash?: (file: string) => Promise<void>
  platform?: NodeJS.Platform
  /**
   * Has the dev server's file watchers let go of a folder before it is
   * renamed or trashed (`./watchers.ts`); resolves to how to watch it
   * again.
   */
  release?: (dir: string) => Promise<() => Promise<void>>
}

const META = 'meta.json'
/** What a copy leaves behind. */
const SKIPPED = new Set(['.git', 'node_modules', '.trash'])

const refuse = (status: number, code: string, message: string) =>
  new FileServiceError(status, code, message)

const noRelease = async () => async () => {}

const writeJson = (file: string, value: unknown) =>
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)

// Windows refuses to rename a folder for a moment while something (a file
// watcher, an indexer) holds it; a folder held for longer is reported.
function renameFolder(from: string, to: string) {
  for (let attempt = 0; ; attempt++)
    try {
      renameSync(from, to)
      return
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (!['EPERM', 'EBUSY', 'EACCES'].includes(code ?? '')) throw error
      if (attempt >= 10)
        throw refuse(
          409,
          'held',
          'Another program is using this prototype’s folder. Close it and try again.',
        )
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100)
    }
}

/** Refuses anything but ordinary files and folders, before copying. */
function checkFiles(dir: string) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIPPED.has(entry.name)) continue
    if (entry.isSymbolicLink())
      throw refuse(
        400,
        'invalid',
        'Remove symbolic links from the prototype before duplicating it.',
      )
    if (entry.isDirectory()) checkFiles(path.join(dir, entry.name))
    else if (!entry.isFile())
      throw refuse(
        400,
        'invalid',
        'Only ordinary files and folders can be duplicated.',
      )
  }
}

/** Every file under `dir`, Git data and node_modules aside. */
function* everyFile(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIPPED.has(entry.name)) continue
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* everyFile(file)
    else if (entry.isFile()) yield file
  }
}

/**
 * Replaces each old permanent ID with its new one in every text file under
 * `dir`: identity comments, named states, metadata and permanent links.
 */
function replaceIds(
  dir: string,
  ids: Map<string, string>,
  adapters: ReferenceAdapter[],
) {
  if (!ids.size) return
  // Kinds of source that record the change themselves go first.
  for (const file of everyFile(dir)) {
    const extension = path.extname(file).toLowerCase()
    const adapter = adapters.find(
      (each) => each.copy && each.extensions.includes(extension),
    )
    if (!adapter || lstatSync(file).size > MAX_SOURCE_BYTES) continue
    const text = readFileSync(file, 'utf8')
    const next = adapter.copy!(text, posix(path.relative(dir, file)), ids)
    if (next !== text) writeFileSync(file, next)
  }
  const pattern = new RegExp(
    `(?<![0-9a-z])(${[...ids.keys()].join('|')})(?![0-9a-z])`,
    'g',
  )
  for (const file of everyFile(dir)) {
    if (lstatSync(file).size > MAX_SOURCE_BYTES) continue
    const text = readFileSync(file, 'utf8')
    if (text.includes(String.fromCharCode(0))) continue
    const next = text.replace(pattern, (id) => ids.get(id)!)
    if (next !== text) writeFileSync(file, next)
  }
}

export function createOrganizer(options: OrganizeOptions) {
  const { root } = options
  const contributorsFolder = options.contributorsFolder ?? 'contributors'
  const configFile = path.resolve(root, options.configFile ?? CONFIG_FILE)
  const access = fileAccess(options)
  const { prototypeOf, refusalFor, prototypesDir, display, typeOf } = access

  const readConfig = () => {
    try {
      return JSON.parse(readFileSync(configFile, 'utf8')) as Record<
        string,
        unknown
      >
    } catch {
      return {}
    }
  }

  /** The prototype, refusing if you may not change it. */
  function changeable(prototype: unknown, archived = true) {
    const found = prototypeOf(String(prototype ?? ''))
    const refusal = refusalFor(found.contributor, found.meta, { archived })
    if (refusal) throw refuse(403, refusal.code, refusal.message)
    return found
  }

  function cleanTitle(value: unknown) {
    const title = typeof value === 'string' ? value.trim() : ''
    const problem = titleProblem(title)
    if (problem) throw refuse(400, 'invalid', problem)
    return title
  }

  const taken = (title: string) =>
    refuse(
      409,
      'exists',
      `You already have a prototype named “${title}”. Choose a different title.`,
    )

  /** The permanent IDs a prototype's folder declares, each with a new one. */
  function freshIds(dir: string, prototypeId: string) {
    const used = identitiesInUse(
      auditIdentities(root, options.fileTypes, {
        prototypesFolder: options.prototypesFolder ?? PROTOTYPES_FOLDER,
        contributorsFolder,
      }),
    )
    const ids = new Map<string, string>()
    const add = (id: string | null | undefined) => {
      if (!id || ids.has(id)) return
      const next = newStudioId(used)
      used.add(next)
      ids.set(id, next)
    }
    add(prototypeId)
    for (const relative of treeFiles(dir)) {
      const type = typeOf(relative)
      if (!type) continue
      try {
        const source = readFileSync(path.join(dir, relative), 'utf8')
        add(type.identity.read(source))
        for (const child of type.identity.children?.read(source) ?? [])
          add(child.studioId)
      } catch {
        // An unreadable identity: the studio's audit names it.
      }
    }
    return ids
  }

  return {
    /**
     * A new title, and the folder renamed to match it. The permanent link
     * and every ID stay; references to files inside it from elsewhere are
     * repaired.
     */
    async rename(request: { prototype: unknown; title: unknown }) {
      const { dir, meta } = changeable(request.prototype)
      const title = cleanTitle(request.title)
      const target = path.join(path.dirname(dir), slugify(title))
      const sameFolder = target.toLowerCase() === dir.toLowerCase()
      if (!sameFolder && existsSync(target)) throw taken(title)
      writeJson(path.join(dir, META), { ...meta, title })
      let relinked = 0
      if (target !== dir) {
        const before = new Set(snapshotFiles(prototypesDir).keys())
        const from = posix(path.relative(prototypesDir, dir))
        const to = posix(path.relative(prototypesDir, target))
        const watchAgain = await (options.release ?? noRelease)(dir)
        try {
          renameFolder(dir, target)
        } catch (error) {
          writeJson(path.join(dir, META), meta)
          throw error
        } finally {
          await watchAgain()
        }
        try {
          relinked = repairReferences(
            prototypesDir,
            before,
            movesOf(before, from, to),
            options.references ?? [],
          ).length
        } catch (error) {
          renameFolder(target, dir)
          writeJson(path.join(dir, META), meta)
          throw refuse(
            409,
            'references',
            `Nothing was renamed: the references to it couldn’t be updated. ${(error as Error).message}`,
          )
        }
      }
      return {
        id: meta.studioId as string,
        folder: display(target),
        relinked,
      }
    },

    /**
     * A copy with a new title, in the copy maker's own space. The copy, its
     * artifacts and their named states get fresh permanent IDs, and the
     * copy's own permanent links point at the copy. Another `system` (a
     * folder name or ID, or null for none) makes a rebuild copy: it keeps
     * the original's system until an agent rebuilds it. An archived
     * prototype's copy is active.
     */
    async duplicate(request: {
      prototype: unknown
      title: unknown
      system?: unknown
    }) {
      const { dir, contributor, meta } = changeable(request.prototype, false)
      const title = cleanTitle(request.title)
      const { contributors } = readContributors(root, contributorsFolder)
      const actor = (options.identify ?? defaultIdentify(root))(
        contributors,
      ).key!
      // Yours stays in your folder; an Admin's copy of someone else's is
      // theirs.
      const ownerKey =
        typeof meta.ownerContributorId === 'string'
          ? Object.keys(contributors).find(
              (key) => contributors[key]!.studioId === meta.ownerContributorId,
            )
          : contributor
      const yours = ownerKey === actor
      const space = yours ? path.dirname(dir) : path.join(prototypesDir, actor)
      const owner = yours
        ? (meta.ownerContributorId ?? contributors[actor]!.studioId)
        : contributors[actor]!.studioId
      const source = (meta.systemId as string | null | undefined) ?? null
      const target =
        request.system === undefined
          ? source
          : systemFor(root, readConfig(), request.system)
      const copy = path.join(space, slugify(title))
      if (existsSync(copy)) throw taken(title)
      checkFiles(dir)
      mkdirSync(space, { recursive: true })
      const release = identityLock(root)
      try {
        try {
          mkdirSync(copy)
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'EEXIST')
            throw taken(title)
          throw error
        }
        try {
          cpSync(dir, copy, {
            recursive: true,
            force: false,
            errorOnExist: true,
            filter: (file) => file === dir || !SKIPPED.has(path.basename(file)),
          })
          replaceIds(
            copy,
            freshIds(copy, meta.studioId as string),
            options.references ?? [],
          )
          const copied = JSON.parse(
            readFileSync(path.join(copy, META), 'utf8'),
          ) as Record<string, unknown>
          // A copy starts active, with nothing to rebuild yet.
          delete copied.status
          delete copied.archivedBySystemId
          delete copied.rebuild
          delete copied.systemMissing
          Object.assign(copied, {
            title,
            created: localDate(),
            ownerContributorId: owner,
            systemId: source,
          })
          if (target !== source)
            copied.rebuild = {
              targetSystemId: target,
              sourcePrototypeId: meta.studioId,
            }
          writeJson(path.join(copy, META), copied)
          return {
            id: copied.studioId as string,
            folder: display(copy),
            rebuild: target !== source,
          }
        } catch (error) {
          rmSync(copy, { recursive: true, force: true })
          throw error
        }
      } finally {
        release()
      }
    },

    /**
     * Archives the whole prototype: the deployed site leaves it out, and
     * here it stays, read-only, until it is restored.
     */
    async archive(request: { prototype: unknown }) {
      const { dir, meta } = changeable(request.prototype, false)
      writeJson(path.join(dir, META), { ...meta, status: 'archived' })
      return { status: 'archived' as const }
    },

    /**
     * Makes an archived prototype active again, once its system is there
     * and active.
     */
    async restore(request: { prototype: unknown }) {
      const { dir, meta } = changeable(request.prototype, false)
      const systemId = meta.systemId ?? null
      if (systemId !== null || meta.systemMissing) {
        const system = registeredSystems(root, readConfig().systems).find(
          ({ studioId }) => studioId === systemId,
        )
        if (!system || meta.systemMissing)
          throw refuse(
            409,
            'system',
            'Rebuild this prototype with an available system before restoring it.',
          )
        if (system.status !== 'active')
          throw refuse(
            409,
            'system',
            'Restore this prototype’s system before restoring the prototype.',
          )
      }
      const next = { ...meta }
      delete next.status
      delete next.archivedBySystemId
      writeJson(path.join(dir, META), next)
      return { status: 'active' as const }
    },

    /** Moves the whole prototype to the computer's trash. */
    async remove(request: { prototype: unknown }) {
      const { dir, meta } = changeable(request.prototype, false)
      const trash = options.trash ?? ((file: string) => trashFile([file]))
      const watchAgain = await (options.release ?? noRelease)(dir)
      try {
        await trash(dir)
      } catch (error) {
        if (!existsSync(dir)) throw error
        throw refuse(
          409,
          'held',
          'Couldn’t move this prototype to the trash. Another program may be using its folder: close it and try again.',
        )
      } finally {
        // Whatever appears at its path later is watched again.
        await watchAgain()
      }
      const trashedTo: TrashPlace =
        (options.platform ?? process.platform) === 'win32'
          ? 'recycle-bin'
          : 'trash'
      return { trashedTo, title: meta.title as string }
    },
  }
}

export type Organizer = ReturnType<typeof createOrganizer>
export type { TrashPlace }
