// The manifest the studio reads: prototypes, their artifacts in their
// tree's order (the first opens with the prototype), the installed systems, and the contributors' names for bylines. Each prototype's artifact list is kept
// apart, so the main manifest stays small and a list loads when its
// prototype opens. Problems are reported as sentences naming the file.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { isResourceId } from '../identity/resource-id.ts'
import { byOrder, compare, parseOrder } from './order.ts'
import { artifactTitle } from './titles.ts'
import type {
  FidelityAdapter,
  FileCheck,
  IdentityAdapter,
} from '../modules/contract.ts'
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
  /** Archived prototypes are left out of the deployed site. */
  status: 'active' | 'archived'
  /**
   * A copy waiting for an agent to rebuild it with another system (null for
   * none); it keeps its current system until then.
   */
  rebuild?: ManifestRebuild
}

export interface ManifestRebuild {
  targetSystemId: string | null
  /** The prototype it was copied from. */
  sourcePrototypeId: string
}

function rebuildOf(value: unknown): ManifestRebuild | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return
  const { targetSystemId, sourcePrototypeId } = value as Record<string, unknown>
  if (!isResourceId(sourcePrototypeId)) return
  if (targetSystemId !== null && !isResourceId(targetSystemId)) return
  return { targetSystemId, sourcePrototypeId }
}

/** What a byline shows of a contributor, and nothing more. */
export interface ManifestContributor {
  /** The permanent contributor ID prototypes name as their owner. */
  id: string
  /** The folder their prototypes live in. */
  key: string
  name: string
  /** A GitHub account, for the profile photo. */
  github?: string
  /** An image inside `public/`, such as `images/sam.jpg`. */
  avatar?: string
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
  contributors: ManifestContributor[]
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
  /** A view's named states, in declaration order. */
  states?: ManifestState[]
  /** Drawn in grayscale with a handwritten font. */
  lofi?: true
  /**
   * Set when the artifact can't open: its type belongs to a module that is
   * turned off. Its source can still be opened locally.
   */
  unavailable?: ArtifactUnavailable
  /**
   * In the deployed site, where the file's text is, relative to the main
   * manifest, for a type whose page reads it. Locally the file service
   * reads it.
   */
  text?: string
}

/** A turned-off file type, by its label and its module's. */
export interface ArtifactUnavailable {
  type: string
  module: string
}

/** A named state of a view: a child artifact with its own identity. */
export interface ManifestState {
  id: string
  title: string
}

export interface FileTypeReader {
  id: string
  extensions: string[]
  identity: IdentityAdapter
  /** The problems of one file's source, as sentences. */
  check?: FileCheck
  fidelity?: FidelityAdapter
  /** Set for a type whose module is turned off. */
  off?: ArtifactUnavailable
}

export interface ManifestOptions {
  root: string
  prototypesFolder?: string
  systems: InstalledSystem[]
  fileTypes: FileTypeReader[]
  defaultSystem?: string | null
  /** Contributor profiles by key; only their bylines are listed. */
  contributors?: Record<
    string,
    { studioId: string; name: string; github?: string; avatar?: string }
  >
}

export interface BuiltManifest {
  manifest: Manifest
  /** Each prototype's artifacts, by prototype ID. */
  artifacts: Record<string, ManifestArtifact[]>
  problems: string[]
}

export const posix = (file: string) => file.split(path.sep).join('/')
export { compare }
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

/** The order saved in a prototype's meta.json, or none. */
export function readOrder(dir: string): string[] {
  try {
    return (
      parseOrder(
        JSON.parse(readFileSync(path.join(dir, 'meta.json'), 'utf8')).order,
      ) ?? []
    )
  } catch {
    return []
  }
}

/**
 * A prototype's files in its tree's order (`./order.ts`): at each level
 * the arranged entries, then files, then folders.
 */
export function arrangedFiles(
  dir: string,
  order: readonly string[] = readOrder(dir),
  prefix = '',
): string[] {
  const entries = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => listed(entry.name))
    .filter((entry) => entry.isDirectory() || entry.isFile())
    .map((entry) => ({
      name: entry.name,
      path: `${prefix}${entry.name}`,
      dir: entry.isDirectory(),
    }))
  return byOrder(entries, order).flatMap((entry) =>
    entry.dir
      ? arrangedFiles(path.join(dir, entry.name), order, `${entry.path}/`)
      : [entry.path],
  )
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

// A file that declares children, even broken ones, keeps its list.
function hasStates(source: string, type: FileTypeReader) {
  try {
    return type.identity.children!.read(source).length > 0
  } catch {
    return true
  }
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
        status: meta.status === 'archived' ? 'archived' : 'active',
        ...(rebuildOf(meta.rebuild) && { rebuild: rebuildOf(meta.rebuild) }),
      })
      artifacts[id] = []
      for (const file of arrangedFiles(dir, parseOrder(meta.order) ?? [])) {
        const extension = path.extname(file).toLowerCase()
        const type = types.get(extension)
        if (!type) continue
        const where = `${relative}/${file}`
        let artifactId: string | null
        let source: string
        try {
          source = readFileSync(path.join(dir, file), 'utf8')
          artifactId = type.identity.read(source)
        } catch (error) {
          const message = (error as Error).message
          problems.push(
            `${where}: ${message[0]!.toLowerCase()}${message.slice(1)}`,
          )
          continue
        }
        if (!artifactId) {
          problems.push(
            `${where}: the permanent identity is missing; it belongs in ${type.identity.where ?? 'a leading <!-- @studio-id … --> comment'}.`,
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
        const artifact: ManifestArtifact = {
          id: artifactId,
          title: artifactTitle(path.posix.basename(inside)),
          path: inside,
          file: where,
          type: type.id,
          ...(type.off ? { unavailable: type.off } : {}),
        }
        for (const problem of type.check?.(source, { prototypeId: id }) ?? [])
          problems.push(`${where}: ${problem}`)
        if (type.identity.children) {
          artifact.states = []
          try {
            for (const { key, studioId } of type.identity.children.read(
              source,
            )) {
              const named = `${where}: state ${JSON.stringify(key)}`
              if (!studioId) {
                problems.push(`${named} has no permanent identity yet.`)
                continue
              }
              const owner = owners.get(studioId)
              if (owner) {
                problems.push(
                  `${named}: the permanent identity ${studioId} is already used by ${owner}.`,
                )
                continue
              }
              owners.set(studioId, `${where} (state ${JSON.stringify(key)})`)
              artifact.states.push({ id: studioId, title: key })
            }
          } catch (error) {
            const message = (error as Error).message
            problems.push(
              `${where}: ${message[0]!.toLowerCase()}${message.slice(1)}`,
            )
          }
          if (!artifact.states.length && !hasStates(source, type))
            delete artifact.states
        }
        if (type.fidelity?.isLofi(source)) artifact.lofi = true
        artifacts[id].push(artifact)
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
      contributors: Object.entries(options.contributors ?? {}).map(
        ([key, { studioId, name, github, avatar }]) => ({
          id: studioId,
          key,
          name,
          ...(github ? { github } : {}),
          ...(avatar ? { avatar } : {}),
        }),
      ),
    },
    artifacts,
    problems,
  }
}

/** What the deployed site keeps of a manifest, and what it leaves out. */
export interface DeployedManifest {
  built: BuiltManifest
  left: { prototypes: ManifestPrototype[]; systems: ManifestSystem[] }
  /** Active files that link to a prototype left out, as sentences. */
  warnings: string[]
  /** How much was left out, or null when nothing was. */
  summary: string | null
}

const LARGEST_TEXT = 750 * 1024

function* textFilesIn(dir: string): Generator<string> {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* textFilesIn(file)
    else if (entry.isFile() && statSync(file).size <= LARGEST_TEXT) yield file
  }
}

/**
 * The manifest for the deployed site: archived prototypes, archived
 * systems and the prototypes that use them are left out entirely, so they
 * are not built, bundled, listed or searchable. Active files that link to
 * one of them are named, since the site shows a placeholder there.
 */
export function forDeploy(
  built: BuiltManifest,
  root: string,
): DeployedManifest {
  const { manifest } = built
  const archivedSystems = new Set(
    manifest.systems
      .filter(({ status }) => status === 'archived')
      .map(({ id }) => id),
  )
  const leftOut = (prototype: ManifestPrototype) =>
    prototype.status === 'archived' ||
    (prototype.systemId !== null && archivedSystems.has(prototype.systemId))
  const kept = manifest.prototypes.filter((prototype) => !leftOut(prototype))
  const left = {
    prototypes: manifest.prototypes.filter(leftOut),
    systems: manifest.systems.filter(({ id }) => archivedSystems.has(id)),
  }
  const warnings: string[] = []
  if (left.prototypes.length)
    for (const prototype of kept)
      for (const file of [
        ...textFilesIn(path.resolve(root, prototype.folder)),
      ].sort()) {
        const text = readFileSync(file, 'utf8')
        for (const target of left.prototypes)
          if (new RegExp(`/prototypes/${target.id}(?![0-9a-z])`).test(text))
            warnings.push(
              `${posix(path.relative(root, file))} links to the archived prototype “${target.title}”; the deployed site leaves it out and shows a placeholder there.`,
            )
      }
  const counted = (n: number, one: string, many: string) =>
    n ? [`${n} ${n === 1 ? one : many}`] : []
  const parts = [
    ...counted(
      left.prototypes.length,
      'archived prototype',
      'archived prototypes',
    ),
    ...counted(left.systems.length, 'archived system', 'archived systems'),
  ]
  return {
    built: {
      ...built,
      manifest: {
        ...manifest,
        prototypes: kept,
        systems: manifest.systems.filter(({ id }) => !archivedSystems.has(id)),
      },
      artifacts: Object.fromEntries(
        kept.map(({ id }) => [id, built.artifacts[id] ?? []]),
      ),
    },
    left,
    warnings,
    summary: parts.length
      ? `Left out of the deployed site: ${parts.join(', ')}.`
      : null,
  }
}
