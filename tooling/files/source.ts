// The file service's source access: an artifact's text read by its
// prototype's and its own permanent IDs, and saved only over the version that
// was read, by someone allowed to change that prototype. Permissions are read
// from disk again on every request. Framework-neutral; the dev server's
// routes (`server/source.ts`) wrap it.
import { createHash } from 'node:crypto'
import { lstatSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { identityHint, resolveIdentity } from '../contributors/identity.ts'
import { readContributors } from '../contributors/profiles.ts'
import {
  permissionRefusal,
  refusalMessage,
  teamOf,
  type Refusal,
} from '../contributors/roles.ts'
import { isResourceId } from '../identity/resource-id.ts'
import {
  directories,
  posix,
  PROTOTYPES_FOLDER,
  treeFiles,
} from '../manifest/build.ts'
import type { FidelityAdapter, IdentityAdapter } from '../modules/contract.ts'
import { CONFIG_FILE } from '../modules/registry.ts'

/** The same limit as any committed file. */
export const MAX_SOURCE_BYTES = 750 * 1024

/** A request the service refuses: an HTTP status, a code and a sentence. */
// Plain fields, not parameter properties: the command line runs this file
// with Node's type stripping.
export class FileServiceError extends Error {
  readonly status: number
  /** `not_found`, `too_large`, `changed`, `identity`, or a refusal. */
  readonly code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'FileServiceError'
    this.status = status
    this.code = code
  }
}

export interface FileServiceOptions {
  root: string
  prototypesFolder?: string
  contributorsFolder?: string
  configFile?: string
  /** The installed file types: an artifact's type decides its identity. */
  fileTypes: {
    id: string
    extensions: string[]
    identity: IdentityAdapter
    fidelity?: FidelityAdapter
    /** A new file's source from its title, before its identity. */
    template?: (title: string) => string
  }[]
  /** Who is working; your Git identity by default. */
  identify?: (
    contributors: ReturnType<typeof readContributors>['contributors'],
  ) => { key: string | null; email: string; hint?: string }
}

export interface ArtifactAddress {
  prototype: string
  artifact: string
}

export interface ArtifactSource {
  /** Where the file is, from the studio's root, for people to read. */
  path: string
  content: string
  /** Changes whenever the content does. */
  version: string
  /** Whether you may save it; `reason` says why not. */
  editable: boolean
  reason?: string
}

/** A hash of a file's text, so a save can tell it changed on disk. */
export const versionOf = (text: string) =>
  createHash('sha1').update(text).digest('hex').slice(0, 16)

const notFound = () =>
  new FileServiceError(404, 'not_found', 'This file no longer exists.')

const ARCHIVED = 'This prototype is archived. Restore it to change it.'

/**
 * What every file service request starts from: finding a prototype and its
 * artifacts by permanent ID, and whether the person working may change it.
 */
export function fileAccess(options: FileServiceOptions) {
  const { root, fileTypes } = options
  const prototypesDir = path.resolve(
    root,
    options.prototypesFolder ?? PROTOTYPES_FOLDER,
  )
  const contributorsFolder = options.contributorsFolder ?? 'contributors'
  const configFile = path.resolve(root, options.configFile ?? CONFIG_FILE)
  const typeOf = (file: string) => {
    const extension = path.extname(file).toLowerCase()
    return fileTypes.find((type) => type.extensions.includes(extension))
  }
  const display = (file: string) => {
    const relative = path.relative(root, file)
    return posix(relative.startsWith('..') ? file : relative)
  }

  /** The prototype's folder and metadata, found by its permanent ID. */
  function prototypeOf(id: string) {
    if (!isResourceId(id)) throw notFound()
    for (const contributor of directories(prototypesDir))
      for (const name of directories(path.join(prototypesDir, contributor))) {
        const dir = path.join(prototypesDir, contributor, name)
        const metaFile = path.join(dir, 'meta.json')
        if (!ordinaryFile(metaFile)) continue
        let meta: Record<string, unknown>
        try {
          meta = JSON.parse(readFileSync(metaFile, 'utf8'))
        } catch {
          continue
        }
        if (meta.studioId === id) return { dir, contributor, meta }
      }
    throw notFound()
  }

  /** The artifact's file inside the prototype, found by its permanent ID. */
  function artifactOf(dir: string, id: string) {
    if (!isResourceId(id)) throw notFound()
    const real = realpathSync(dir)
    for (const relative of treeFiles(dir)) {
      const type = typeOf(relative)
      const file = path.join(dir, relative)
      if (!type || !ordinaryFile(file)) continue
      if (!realpathSync(file).startsWith(real + path.sep)) continue
      let declared: string | null
      try {
        declared = type.identity.read(readFileSync(file, 'utf8'))
      } catch {
        continue
      }
      if (declared === id) return { file, type }
    }
    throw notFound()
  }

  /** Why you may not change the prototype, or null if you may. */
  function refusalFor(
    contributor: string,
    meta: Record<string, unknown>,
  ): { code: Refusal | 'archived'; message: string } | null {
    const { contributors } = readContributors(root, contributorsFolder)
    const identity = (options.identify ?? defaultIdentify(root))(contributors)
    let config = {}
    try {
      config = JSON.parse(readFileSync(configFile, 'utf8'))
    } catch {
      // No configuration: nobody is an Admin.
    }
    // The owner is the contributor whose permanent ID the prototype names,
    // or the contributor whose folder holds it.
    const owner =
      typeof meta.ownerContributorId === 'string'
        ? (Object.keys(contributors).find(
            (key) => contributors[key]!.studioId === meta.ownerContributorId,
          ) ?? '')
        : contributor
    const refusal = permissionRefusal(
      teamOf(config, contributors),
      contributors,
      identity.key,
      { kind: 'prototype', owner },
      'edit',
    )
    if (refusal)
      return {
        code: refusal,
        message: refusalMessage(refusal, {
          email: identity.email,
          hint: identity.hint,
        }),
      }
    if (meta.status === 'archived')
      return { code: 'archived', message: ARCHIVED }
    return null
  }

  return {
    root,
    prototypesDir,
    typeOf,
    display,
    prototypeOf,
    artifactOf,
    refusalFor,
  }
}

export function createFileService(options: FileServiceOptions) {
  const { prototypeOf, artifactOf, refusalFor, display } = fileAccess(options)
  return {
    async read(address: ArtifactAddress): Promise<ArtifactSource> {
      const { dir, contributor, meta } = prototypeOf(address.prototype)
      const { file } = artifactOf(dir, address.artifact)
      if (lstatSync(file).size > MAX_SOURCE_BYTES)
        throw new FileServiceError(
          413,
          'too_large',
          'This file is too large to show here. Open it in your editor.',
        )
      const content = readFileSync(file, 'utf8')
      const refusal = refusalFor(contributor, meta)
      return {
        path: display(file),
        content,
        version: versionOf(content),
        editable: !refusal,
        ...(refusal ? { reason: refusal.message } : {}),
      }
    },

    async save(
      address: ArtifactAddress & { content: unknown; base: unknown },
    ): Promise<{ version: string; warnings: string[] }> {
      const { dir, contributor, meta } = prototypeOf(address.prototype)
      const { file, type } = artifactOf(dir, address.artifact)
      const refusal = refusalFor(contributor, meta)
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
          'This file is too large to save here. Keep files under 750 KB.',
        )
      // Never overwrite a version you haven't seen.
      const previous = readFileSync(file, 'utf8')
      if (versionOf(previous) !== address.base)
        throw new FileServiceError(
          409,
          'changed',
          'This file changed on disk since you opened it.',
        )
      let declared: string | null
      try {
        declared = type.identity.read(content)
      } catch (error) {
        throw new FileServiceError(400, 'identity', (error as Error).message)
      }
      if (declared !== address.artifact)
        throw new FileServiceError(
          409,
          'identity',
          'Keep the artifact’s permanent studio ID when editing its source.',
        )
      const lost = lostChild(type.identity, previous, content)
      if (lost)
        throw new FileServiceError(
          409,
          'identity',
          `Keep the permanent studio ID of state “${lost}” when editing its source.`,
        )
      writeFileSync(file, content)
      return { version: versionOf(content), warnings: [] }
    },
  }
}

export type FileService = ReturnType<typeof createFileService>

/**
 * The first child artifact (a view's named state) still declared in `next`
 * whose permanent ID was dropped or changed, or null. A child that is gone,
 * or renamed together with its ID's comment, is fine.
 */
function lostChild(identity: IdentityAdapter, previous: string, next: string) {
  if (!identity.children) return null
  let before: { key: string; studioId: string | null }[]
  try {
    before = identity.children.read(previous)
  } catch {
    return null
  }
  let after: Map<string, string | null>
  try {
    after = new Map(
      identity.children.read(next).map(({ key, studioId }) => [key, studioId]),
    )
  } catch (error) {
    throw new FileServiceError(400, 'identity', (error as Error).message)
  }
  return (
    before.find(
      ({ key, studioId }) =>
        studioId && after.has(key) && after.get(key) !== studioId,
    )?.key ?? null
  )
}

export function ordinaryFile(file: string) {
  try {
    const stat = lstatSync(file)
    return stat.isFile() && !stat.isSymbolicLink()
  } catch {
    return false
  }
}

export function defaultIdentify(root: string) {
  return (
    contributors: ReturnType<typeof readContributors>['contributors'],
  ) => {
    const identity = resolveIdentity(root, contributors)
    return {
      key: identity.key,
      email: identity.email,
      hint: identity.key ? undefined : identityHint(identity),
    }
  }
}
