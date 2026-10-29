// While the dev server runs, a view (or another artifact) that an agent or an
// editor creates in your own prototype gets its permanent identity: one new ID
// from the retained inventory, written by its file type's adapter. So does
// each named state added to a view, unless its type's check reports problems
// in the file: a state renamed in code alone leaves a comment naming no
// state, which is reported rather than given a new link.
//
// An existing ID is never rewritten, so a copied file that kept its
// original's ID stays a duplicate for the audit to report. Nothing is
// assigned while the studio has identity problems. A file created empty, as
// editors often do, waits for its first content.
import { createHash } from 'node:crypto'
import {
  closeSync,
  existsSync,
  lstatSync,
  openSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { newStudioId } from '../contributors/studio-ids.ts'
import { listed, posix, PROTOTYPES_FOLDER } from '../manifest/build.ts'
import { auditIdentities, identitiesInUse, type AuditOptions } from './audit.ts'
import { fileTypeOf, type IdentityFileType } from './file-types.ts'

const STALE_MS = 10_000

/**
 * Takes the studio's identity lock, so only one dev server (or command)
 * assigns at a time. It sits outside the studio, where no watcher sees it.
 * Returns the release; throws when another holder keeps it past `timeout`.
 */
export function identityLock(root: string, timeout = 2000) {
  const lock = path.join(
    os.tmpdir(),
    `studio-identity-${createHash('sha1').update(path.resolve(root)).digest('hex')}.lock`,
  )
  const deadline = Date.now() + timeout
  for (;;) {
    try {
      closeSync(openSync(lock, 'wx'))
      break
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      try {
        if (Date.now() - statSync(lock).mtimeMs > STALE_MS)
          rmSync(lock, { force: true })
      } catch {
        // Released meanwhile.
      }
      if (Date.now() > deadline)
        throw new Error('another dev server is assigning identities.', {
          cause: error,
        })
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20)
    }
  }
  let held = true
  return () => {
    if (held) rmSync(lock, { force: true })
    held = false
  }
}

export interface AssignOptions extends AuditOptions {
  root: string
  types: IdentityFileType[]
  /** The contributor running the dev server, or null for nobody. */
  contributor: string | null
  lockTimeout?: number
}

/** A named state given its identity. */
export interface AssignedState {
  title: string
  studioId: string
}

export type AssignResult = (
  | { assigned: true; studioId: string }
  | {
      assigned: false
      /** `pending`: try again on its next change. */
      reason:
        | 'outside'
        | 'not-own'
        | 'not-artifact'
        | 'not-prototype'
        | 'gone'
        | 'pending'
        | 'identified'
        | 'unreadable'
    }
) & { states?: AssignedState[] }

/** The children the file declares without an identity, if it may get them. */
function missingChildren(type: IdentityFileType, source: string) {
  if (!type.identity.children || type.check?.(source).length) return []
  try {
    return type.identity.children
      .read(source)
      .filter(({ studioId }) => !studioId)
      .map(({ key }) => key)
  } catch {
    return []
  }
}

/** Gives one new file its identity; throws when the studio has problems. */
export function assignNewArtifact(
  file: string,
  options: AssignOptions,
): AssignResult {
  const { root, types, contributor } = options
  const prototypes = path.resolve(
    root,
    options.prototypesFolder ?? PROTOTYPES_FOLDER,
  )
  const parts = path.relative(prototypes, file).split(path.sep)
  const [owner, prototype, ...rest] = parts
  if (owner === '..' || path.isAbsolute(owner!) || !prototype || !rest.length)
    return { assigned: false, reason: 'outside' }
  if (!contributor || owner !== contributor)
    return { assigned: false, reason: 'not-own' }
  const type = fileTypeOf(types, file)
  if (!type || ![prototype, ...rest].every(listed))
    return { assigned: false, reason: 'not-artifact' }
  if (!existsSync(path.join(prototypes, owner, prototype, 'meta.json')))
    return { assigned: false, reason: 'not-prototype' }
  if (!existsSync(file) || !lstatSync(file).isFile())
    return { assigned: false, reason: 'gone' }

  const release = identityLock(root, options.lockTimeout)
  try {
    const source = readFileSync(file, 'utf8')
    if (!source.trim()) return { assigned: false, reason: 'pending' }
    let identified: boolean
    try {
      identified = type.identity.read(source) !== null
    } catch {
      return { assigned: false, reason: 'unreadable' }
    }
    const children = missingChildren(type, source)
    if (identified && !children.length)
      return { assigned: false, reason: 'identified' }
    const audit = auditIdentities(root, types, options)
    if (audit.problems.length) throw new Error(audit.problems.join('\n'))
    const taken = identitiesInUse(audit)
    let next = source
    let studioId: string | undefined
    if (!identified) {
      studioId = newStudioId(taken)
      taken.add(studioId)
      next = type.identity.write(next, studioId)
    }
    const states = children.map((title) => {
      const id = newStudioId(taken)
      taken.add(id)
      next = type.identity.children!.write(next, title, id)
      return { title, studioId: id }
    })
    // Something else wrote it meanwhile; its next change gets another try.
    if (readFileSync(file, 'utf8') !== source)
      return { assigned: false, reason: 'pending' }
    writeFileSync(file, next)
    return studioId
      ? { assigned: true, studioId, states }
      : { assigned: false, reason: 'identified', states }
  } finally {
    release()
  }
}

/** What the dev server's file watcher offers. */
export interface FileWatcher {
  on: (
    event: 'add' | 'change' | 'unlink',
    listener: (file: string) => void,
  ) => unknown
}

export interface WatchOptions extends AuditOptions {
  root: string
  types: () => IdentityFileType[]
  contributor: () => string | null
  logger: { info: (message: string) => void; warn: (message: string) => void }
  lockTimeout?: number
}

/** Assigns identities to the artifacts that appear while the server runs. */
export function watchNewArtifacts(watcher: FileWatcher, options: WatchOptions) {
  const { root } = options
  const prototypes = path.resolve(
    root,
    options.prototypesFolder ?? PROTOTYPES_FOLDER,
  )
  const shown = (file: string) => posix(path.relative(root, file))
  const assign = (file: string) => {
    let result: AssignResult
    try {
      result = assignNewArtifact(file, {
        ...options,
        types: options.types(),
        contributor: options.contributor(),
      })
    } catch (error) {
      // The next change tries again.
      const [owner, prototype] = path.relative(prototypes, file).split(path.sep)
      const folder = shown(path.join(prototypes, owner!, prototype!))
      options.logger.warn(
        `${shown(file)} was not given an identity: ${(error as Error).message}\nFix that, then run \`yarn studio identify ${folder} --yes\`.`,
      )
      return
    }
    if (result.assigned)
      options.logger.info(
        `Assigned identity ${result.studioId} to ${shown(file)}`,
      )
    for (const state of result.states ?? [])
      options.logger.info(
        `Assigned identity ${state.studioId} to state ${JSON.stringify(state.title)} of ${shown(file)}`,
      )
  }
  watcher.on('add', assign)
  // A change may add a named state, or bring a waiting file its content.
  watcher.on('change', assign)
}
