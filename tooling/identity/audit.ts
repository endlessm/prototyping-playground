// The retained inventory of permanent identities: every contributor, system,
// prototype and prototype artifact, with what is missing or wrong. It only
// reads. Archived prototypes and the file types of switched-off modules count
// too, so an ID is never handed out twice.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  directories,
  posix,
  PROTOTYPES_FOLDER,
  treeFiles,
} from '../manifest/build.ts'
import { SYSTEMS_FOLDER } from '../systems/registry.ts'
import { fileTypeOf, type IdentityFileType } from './file-types.ts'
import { isResourceId } from './resource-id.ts'

export interface IdentityResource {
  kind: 'contributor' | 'system' | 'prototype' | 'artifact' | 'state'
  /** Repository-relative, with forward slashes. */
  path: string
  studioId: string | null
  /** For prototypes and artifacts: the prototype's folder. */
  prototype?: string
  /** For prototypes and artifacts: the contributor folder it lives in. */
  owner?: string
  /** For artifacts and states: the file type's ID. */
  fileType?: string
  /** For states: the state's title in its view. */
  title?: string
}

/** A named state, in the view at `path`, with no identity yet. */
export interface MissingState {
  path: string
  title: string
}

export interface IdentityAudit {
  resources: IdentityResource[]
  /** Files with no identity yet. */
  missing: string[]
  /** Named states with no identity yet. */
  missingStates: MissingState[]
  /** Malformed and duplicate identities, as sentences naming the file. */
  problems: string[]
  /**
   * What artifacts' file types report about their source, such as a view's
   * unreadable state titles, as sentences naming the file.
   */
  checks: string[]
}

export interface AuditOptions {
  prototypesFolder?: string
  contributorsFolder?: string
}

const MALFORMED =
  'a permanent identity must be 16 lowercase letters and digits (Crockford base32).'

const sentence = (message: string) =>
  `${message[0]!.toLowerCase()}${message.slice(1)}`

export function auditIdentities(
  root: string,
  types: IdentityFileType[],
  options: AuditOptions = {},
): IdentityAudit {
  const resources: IdentityResource[] = []
  const missing: string[] = []
  const missingStates: MissingState[] = []
  const problems: string[] = []
  const checks: string[] = []
  const owners = new Map<string, string>()

  const record = (
    resource: Omit<IdentityResource, 'studioId'>,
    read: () => unknown,
  ) => {
    let id: unknown
    try {
      id = read()
    } catch (error) {
      problems.push(`${resource.path}: ${sentence((error as Error).message)}`)
      return
    }
    if (id === null || id === undefined) {
      missing.push(resource.path)
      resources.push({ ...resource, studioId: null })
      return
    }
    if (!isResourceId(id)) {
      problems.push(`${resource.path}: ${MALFORMED}`)
      return
    }
    claim(resource, id)
  }
  const named = (resource: Omit<IdentityResource, 'studioId'>) =>
    resource.title === undefined
      ? resource.path
      : stateName(resource.path, resource.title)
  const claim = (resource: Omit<IdentityResource, 'studioId'>, id: string) => {
    const owner = owners.get(id)
    if (owner)
      problems.push(
        `${named(resource)}: the permanent identity ${id} is already used by ${owner}.`,
      )
    else owners.set(id, named(resource))
    resources.push({ ...resource, studioId: id })
  }
  const text = (file: string) => readFileSync(path.resolve(root, file), 'utf8')
  const relative = (file: string) => posix(path.relative(root, file))
  const json = (file: string) => {
    const value = JSON.parse(text(file))
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error('It must hold a JSON object.')
    return value as Record<string, unknown>
  }

  const contributorsFolder = options.contributorsFolder ?? 'contributors'
  const people = path.resolve(root, contributorsFolder)
  const profiles = existsSync(people)
    ? readdirSync(people)
        .filter((name) => name.endsWith('.json'))
        .sort()
    : []
  for (const name of profiles) {
    const file = relative(path.join(people, name))
    record({ kind: 'contributor', path: file }, () => json(file).studioId)
  }

  for (const key of directories(path.join(root, SYSTEMS_FOLDER))) {
    const file = `${SYSTEMS_FOLDER}/${key}/system.ts`
    if (!existsSync(path.join(root, file))) continue
    // Read as text, without running the declaration.
    record(
      { kind: 'system', path: file },
      () => /\bstudioId:\s*["']([^"']*)["']/.exec(text(file))?.[1] ?? null,
    )
  }

  const prototypesFolder = posix(options.prototypesFolder ?? PROTOTYPES_FOLDER)
  const base = path.resolve(root, prototypesFolder)
  for (const owner of directories(base))
    for (const name of directories(path.join(base, owner))) {
      const dir = path.join(base, owner, name)
      if (!existsSync(path.join(dir, 'meta.json'))) continue
      const folder = relative(dir)
      const metaFile = `${folder}/meta.json`
      record(
        { kind: 'prototype', path: metaFile, prototype: folder, owner },
        () => json(metaFile).studioId,
      )
      for (const file of treeFiles(dir)) {
        const type = fileTypeOf(types, file)
        if (!type) continue
        const artifact = `${folder}/${file}`
        const resource = {
          path: artifact,
          prototype: folder,
          owner,
          fileType: type.id,
        }
        record({ kind: 'artifact', ...resource }, () =>
          type.identity.read(text(artifact)),
        )
        for (const problem of type.check?.(text(artifact)) ?? [])
          checks.push(`${artifact}: ${problem}`)
        if (!type.identity.children) continue
        let children: { key: string; studioId: string | null }[]
        try {
          children = type.identity.children.read(text(artifact))
        } catch (error) {
          problems.push(`${artifact}: ${sentence((error as Error).message)}`)
          continue
        }
        for (const { key, studioId } of children)
          if (studioId)
            claim({ kind: 'state', ...resource, title: key }, studioId)
          else missingStates.push({ path: artifact, title: key })
      }
    }

  return { resources, missing, missingStates, problems, checks }
}

/** Every identity in use, for handing out new ones. */
export const identitiesInUse = (audit: IdentityAudit) =>
  new Set(
    audit.resources.flatMap((resource) =>
      resource.studioId ? [resource.studioId] : [],
    ),
  )

/** How a state is named in messages: its view's path and its title. */
export const stateName = (file: string, title: string) =>
  `${file} (state ${JSON.stringify(title)})`

/** Every file and named state with no identity yet, by name. */
export const missingNames = (audit: IdentityAudit) => [
  ...audit.missing,
  ...audit.missingStates.map(({ path, title }) => stateName(path, title)),
]
