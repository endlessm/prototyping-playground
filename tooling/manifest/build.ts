// The manifest the studio reads: prototypes, their artifacts in file-tree
// order, and the installed systems. Each prototype's artifact list is kept
// apart, so the main manifest stays small and a list loads when its
// prototype opens. Problems are reported as sentences naming the file.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { isResourceId } from '../identity/resource-id.ts'
import type { IdentityAdapter } from '../modules/contract.ts'
import { PLAIN_TEXT } from '../modules/registry.ts'
import type { InstalledSystem } from '../systems/registry.ts'

export const PROTOTYPES_FOLDER = 'src/prototypes'

export interface ManifestPrototype {
  id: string
  title: string
  /** The contributor folder it lives in. */
  contributor: string
  /** Repository-relative, with forward slashes. */
  folder: string
  /** The owner's permanent contributor ID. */
  owner: string | null
  created: string | null
  /** The assigned system's permanent ID, or null for no system. */
  systemId: string | null
}

export interface ManifestSystem {
  id: string
  /** The folder name. */
  key: string
  label: string
  status: 'active' | 'archived'
  colorModes: ('light' | 'dark')[]
}

export interface Manifest {
  prototypes: ManifestPrototype[]
  systems: ManifestSystem[]
  /** The system new prototypes start with. */
  defaultSystem: string | null
}

export interface ManifestArtifact {
  id: string
  title: string
  /** Inside the prototype, without the extension: `flows/Sign in`. */
  path: string
  /** Repository-relative, with forward slashes. */
  file: string
  /** The file type's ID. */
  type: string
}

export interface FileTypeReader {
  id: string
  extensions: string[]
  identity: IdentityAdapter
}

export interface ManifestOptions {
  root: string
  prototypesFolder?: string
  systems: InstalledSystem[]
  fileTypes: FileTypeReader[]
  defaultSystem?: string | null
}

export interface BuiltManifest {
  manifest: Manifest
  /** Each prototype's artifacts, by prototype ID. */
  artifacts: Record<string, ManifestArtifact[]>
  problems: string[]
}

export const posix = (file: string) => file.split(path.sep).join('/')
const compare = (a: string, b: string) =>
  a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }) ||
  (a < b ? -1 : a > b ? 1 : 0)
// Leading underscores mark a prototype's helpers; dot files are hidden.
export const listed = (name: string) =>
  !name.startsWith('_') && !name.startsWith('.') && name !== 'node_modules'

export function directories(dir: string) {
  return existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && listed(entry.name))
        .map((entry) => entry.name)
        .sort(compare)
    : []
}

/** Files under `dir` in file-tree order: folders first, then files. */
export function treeFiles(dir: string, prefix = ''): string[] {
  const entries = readdirSync(dir, { withFileTypes: true }).filter((entry) =>
    listed(entry.name),
  )
  const folders = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort(compare)
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort(compare)
  return [
    ...folders.flatMap((name) =>
      treeFiles(path.join(dir, name), `${prefix}${name}/`),
    ),
    ...files.map((name) => `${prefix}${name}`),
  ]
}

function readMeta(file: string, where: string, problems: string[]) {
  let meta: Record<string, unknown>
  try {
    meta = JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    problems.push(`${where} is not valid JSON.`)
    return null
  }
  const found: string[] = []
  if (!isResourceId(meta.studioId))
    found.push(
      `${where}: "studioId" must be 16 lowercase letters and digits (Crockford base32).`,
    )
  if (typeof meta.title !== 'string' || !PLAIN_TEXT.test(meta.title))
    found.push(`${where}: "title" must be plain text.`)
  problems.push(...found)
  return meta
}

export function buildManifest(options: ManifestOptions): BuiltManifest {
  const { root, systems, fileTypes } = options
  const folder = options.prototypesFolder ?? PROTOTYPES_FOLDER
  const base = path.resolve(root, folder)
  const problems: string[] = []
  const systemIds = new Set(systems.map((system) => system.id))
  const types = new Map(
    fileTypes.flatMap((type) =>
      type.extensions.map((extension) => [extension.toLowerCase(), type]),
    ),
  )
  const prototypes: ManifestPrototype[] = []
  const artifacts: Record<string, ManifestArtifact[]> = {}
  const owners = new Map<string, string>()

  for (const contributor of directories(base))
    for (const name of directories(path.join(base, contributor))) {
      const dir = path.join(base, contributor, name)
      const relative = `${posix(folder)}/${contributor}/${name}`
      const metaFile = path.join(dir, 'meta.json')
      if (!existsSync(metaFile)) continue
      const where = `${relative}/meta.json`
      const before = problems.length
      const meta = readMeta(metaFile, where, problems)
      if (!meta || problems.length > before) continue
      if (!('systemId' in meta) || meta.systemId === undefined) {
        problems.push(
          `${where}: "systemId" is missing; name the prototype’s system, or null for no system.`,
        )
        continue
      }
      if (meta.systemId !== null && !systemIds.has(meta.systemId as string)) {
        problems.push(
          `${where}: the system ${String(meta.systemId)} is not installed; choose an installed system or null for no system.`,
        )
        continue
      }
      const id = meta.studioId as string
      const owner = owners.get(id)
      if (owner) {
        problems.push(
          `${where}: the permanent identity ${id} is already used by ${owner}.`,
        )
        continue
      }
      owners.set(id, relative)
      prototypes.push({
        id,
        title: meta.title as string,
        contributor,
        folder: relative,
        owner:
          typeof meta.ownerContributorId === 'string'
            ? meta.ownerContributorId
            : null,
        created: typeof meta.created === 'string' ? meta.created : null,
        systemId: (meta.systemId as string | null) ?? null,
      })
      artifacts[id] = []
      for (const file of treeFiles(dir)) {
        const extension = path.extname(file).toLowerCase()
        const type = types.get(extension)
        if (!type) continue
        const where = `${relative}/${file}`
        let artifactId: string | null
        try {
          artifactId = type.identity.read(
            readFileSync(path.join(dir, file), 'utf8'),
          )
        } catch (error) {
          const message = (error as Error).message
          problems.push(
            `${where}: ${message[0]!.toLowerCase()}${message.slice(1)}`,
          )
          continue
        }
        if (!artifactId) {
          problems.push(
            `${where}: the permanent identity is missing; it belongs in a leading <!-- @studio-id … --> comment.`,
          )
          continue
        }
        const owner = owners.get(artifactId)
        if (owner) {
          problems.push(
            `${where}: the permanent identity ${artifactId} is already used by ${owner}.`,
          )
          continue
        }
        owners.set(artifactId, where)
        const inside = file.slice(0, -extension.length)
        artifacts[id].push({
          id: artifactId,
          title: path.posix.basename(inside),
          path: inside,
          file: where,
          type: type.id,
        })
      }
    }

  return {
    manifest: {
      prototypes,
      systems: systems.map(({ id, key, spec }) => ({
        id,
        key,
        label: spec.label,
        status: spec.status,
        colorModes: spec.colorModes,
      })),
      defaultSystem: options.defaultSystem ?? null,
    },
    artifacts,
    problems,
  }
}
