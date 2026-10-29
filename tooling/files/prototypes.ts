// Creating a prototype, for the New prototype dialog (through the dev
// server's file service) and `yarn new`: a folder named after the title in
// your own space, `src/prototypes/<you>/<slug>/`, with its metadata and one
// empty starting view, each with a new permanent identity. Only registered
// contributors create, and a failed creation leaves nothing behind.
// Framework-neutral.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { readContributors } from '../contributors/profiles.ts'
import { newStudioId } from '../contributors/studio-ids.ts'
import { identityLock } from '../identity/assign.ts'
import { auditIdentities, identitiesInUse } from '../identity/audit.ts'
import type { IdentityFileType } from '../identity/file-types.ts'
import { PROTOTYPES_FOLDER, posix } from '../manifest/build.ts'
import { CONFIG_FILE, PLAIN_TEXT } from '../modules/registry.ts'
import { registeredSystems } from '../studio/systems.ts'
import {
  defaultIdentify,
  FileServiceError,
  type FileServiceOptions,
} from './source.ts'

/** The metadata format new prototypes are written in. */
export const PROTOTYPE_FORMAT = 1

/** The file type of the starting view, and its file. */
const STARTING_TYPE = 'view'
const STARTING_VIEW = 'Prototype.vue'

export interface CreateOptions {
  root: string
  prototypesFolder?: string
  contributorsFolder?: string
  configFile?: string
  /** Every installed file type, so no identity is handed out twice. */
  fileTypes: IdentityFileType[]
  identify?: FileServiceOptions['identify']
}

export interface CreateRequest {
  title: unknown
  /**
   * A system's folder name or permanent ID, or null for no system; the
   * studio's default system when left out.
   */
  system?: unknown
}

export interface CreatedPrototype {
  /** The prototype's permanent ID. */
  id: string
  /** Repository-relative, with forward slashes. */
  folder: string
  /** The starting view's permanent ID. */
  artifact: string
}

/** "Agent Config" → "agent-config" */
export const slugify = (title: string) =>
  title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const refuse = (message: string, status = 400, code = 'invalid') =>
  new FileServiceError(status, code, message)

/** The title, trimmed, or why it can't be one. */
export function titleProblem(title: string) {
  if (!title) return 'Add a title.'
  if (!slugify(title)) return 'Use at least one letter or number in the title.'
  if (!PLAIN_TEXT.test(title))
    return 'Use plain text in the title: no <, >, `, $ or \\.'
  return null
}

const localDate = (date = new Date()) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')

function readJson(file: string): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return {}
  }
}

/** The system's permanent ID, or null; refuses unknown and archived ones. */
function systemFor(
  root: string,
  config: Record<string, unknown>,
  wanted: unknown,
) {
  if (wanted === null) return null
  const choice = wanted === undefined ? (config.defaultSystem ?? null) : wanted
  if (choice === null) return null
  const name = String(choice)
  const system = registeredSystems(root, config.systems).find(
    ({ key, studioId }) => key === name || studioId === name,
  )
  if (!system?.studioId)
    throw refuse(
      `There’s no system “${name}”. Choose an installed system, or no system.`,
    )
  if (system.status !== 'active')
    throw refuse(
      `The ${system.key} system is archived. Choose an active system, or no system.`,
    )
  return system.studioId
}

export function createPrototype(
  options: CreateOptions,
  request: CreateRequest,
): CreatedPrototype {
  const { root } = options
  const title = typeof request.title === 'string' ? request.title.trim() : ''
  const problem = titleProblem(title)
  if (problem) throw refuse(problem)

  const contributorsFolder = options.contributorsFolder ?? 'contributors'
  const { contributors } = readContributors(root, contributorsFolder)
  const identity = (options.identify ?? defaultIdentify(root))(contributors)
  const owner = identity.key ? contributors[identity.key] : undefined
  if (!identity.key || !owner)
    throw refuse(
      'You’re not set up as a contributor yet. Ask your agent to add you.',
      403,
      'identity',
    )

  const config = readJson(path.resolve(root, options.configFile ?? CONFIG_FILE))
  const systemId = systemFor(root, config, request.system)
  const view = options.fileTypes.find(({ id }) => id === STARTING_TYPE)
  if (!view)
    throw refuse(
      'Prototypes start with a view, and no installed module provides views.',
      500,
      'unavailable',
    )

  const prototypesFolder = options.prototypesFolder ?? PROTOTYPES_FOLDER
  const space = path.resolve(root, prototypesFolder, identity.key)
  const slug = slugify(title)
  const dir = path.join(space, slug)
  mkdirSync(space, { recursive: true })
  const release = identityLock(root)
  try {
    try {
      // Not recursive: an existing folder of that name refuses.
      mkdirSync(dir)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      throw refuse(
        `You already have a prototype named “${title}”. Choose a different title.`,
        409,
        'exists',
      )
    }
    try {
      const taken = identitiesInUse(
        auditIdentities(root, options.fileTypes, {
          prototypesFolder,
          contributorsFolder,
        }),
      )
      const id = newStudioId(taken)
      taken.add(id)
      const artifact = newStudioId(taken)
      const meta = {
        formatVersion: PROTOTYPE_FORMAT,
        title,
        created: localDate(),
        studioId: id,
        ownerContributorId: owner.studioId,
        systemId,
      }
      writeFileSync(
        path.join(dir, 'meta.json'),
        `${JSON.stringify(meta, null, 2)}\n`,
        { flag: 'wx' },
      )
      writeFileSync(
        path.join(dir, STARTING_VIEW),
        view.identity.write('', artifact),
        { flag: 'wx' },
      )
      const relative = path.relative(root, dir)
      return {
        id,
        folder: posix(relative.startsWith('..') ? dir : relative),
        artifact,
      }
    } catch (error) {
      rmSync(dir, { recursive: true, force: true })
      throw error
    }
  } finally {
    release()
  }
}
