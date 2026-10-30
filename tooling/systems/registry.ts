// The system registry: every folder in the systems folder with a
// `system.ts`, checked against the systems `studio.config.json` registers.
// The platform finds systems only here, never by name.
import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { isResourceId } from '../identity/resource-id.ts'
import { PLAIN_TEXT } from '../modules/registry.ts'
import type { SystemSpec } from './contract.ts'

export const SYSTEMS_FOLDER = 'src/systems'

/**
 * The systems folder the app reads; the browser scenarios point it at
 * fixture systems with `STUDIO_SYSTEMS`. The `studio` command ignores it.
 */
export const systemsFolder = () => process.env.STUDIO_SYSTEMS || SYSTEMS_FOLDER

export interface InstalledSystem {
  spec: SystemSpec
  /** The folder name, which `studio.config.json` registers. */
  key: string
  /** The permanent ID prototypes store as `systemId`. */
  id: string
  /** Absolute path of the system's folder. */
  dir: string
  /** The folder, relative to the studio's root, with forward slashes. */
  folder: string
}

export interface SystemRegistry {
  systems: InstalledSystem[]
  /** Each a sentence naming the file or setting to fix. */
  problems: string[]
}

// Counts reads, so two in the same millisecond still read the file again.
let loads = 0

const STATUS = new Set(['active', 'archived'])
const MODES = new Set(['light', 'dark'])
const ASSETS = new Set(['fonts', 'icons', 'images'])

const relativeFile = (value: unknown) =>
  typeof value === 'string' &&
  value.length > 0 &&
  !path.isAbsolute(value) &&
  !value.split(/[/\\]/).includes('..')

/** Problems with one declaration, each a sentence naming the file. */
export function systemProblems(spec: unknown, where: string): string[] {
  if (!spec || typeof spec !== 'object' || Array.isArray(spec))
    return [`${where} must export a system declaration as its default.`]
  const system = spec as Record<string, unknown>
  const problems: string[] = []
  if (typeof system.label !== 'string' || !PLAIN_TEXT.test(system.label))
    problems.push(`${where}: the label must be plain text.`)
  if (!STATUS.has(system.status as string))
    problems.push(`${where}: the status is "active" or "archived".`)
  if (system.role !== 'prototype')
    problems.push(`${where}: the role is "prototype".`)
  if (system.styling !== 'tailwind' && system.styling !== 'custom')
    problems.push(`${where}: the styling is "tailwind" or "custom".`)
  const modes = system.colorModes
  if (
    !Array.isArray(modes) ||
    !modes.length ||
    modes.some((mode) => !MODES.has(mode))
  )
    problems.push(`${where}: colour modes are "light" and "dark".`)
  if (!['warn', 'strict', 'off'].includes(system.docs as string))
    problems.push(`${where}: docs is "warn", "strict" or "off".`)
  if (!Array.isArray(system.libraries))
    problems.push(`${where}: libraries must be a list.`)
  else if (
    system.libraries.some(
      (library) =>
        library?.assets !== undefined &&
        (!Array.isArray(library.assets) ||
          library.assets.some((kind: unknown) => !ASSETS.has(kind as string))),
    )
  )
    problems.push(
      `${where}: a library’s assets are "fonts", "icons" and "images".`,
    )
  const overview = system.overview
  if (
    overview !== undefined &&
    (!overview ||
      typeof overview !== 'object' ||
      Object.values(overview).some(
        (value) => typeof value !== 'string' || !PLAIN_TEXT.test(value),
      ))
  )
    problems.push(
      `${where}: overview.summary, overview.guidance and overview.code are plain text.`,
    )
  const icons = system.icons as Record<string, unknown> | null | undefined
  if (
    icons !== undefined &&
    (!icons ||
      typeof icons !== 'object' ||
      typeof icons.snippet !== 'string' ||
      typeof icons.href !== 'string' ||
      !/^https?:\/\//.test(icons.href) ||
      !Array.isArray(icons.names) ||
      icons.names.some(
        (name: unknown) =>
          typeof name !== 'string' || !/^i-[a-z0-9-]+$/.test(name),
      ))
  )
    problems.push(
      `${where}: icons has a snippet, an http(s) href and a list of Iconify names (i-lucide-…).`,
    )
  if (!isResourceId(system.studioId))
    problems.push(
      `${where}: the studioId must be 16 lowercase letters and digits (Crockford base32).`,
    )
  if (
    system.origin !== null &&
    (typeof system.origin !== 'string' ||
      system.origin === 'shadcn' ||
      !PLAIN_TEXT.test(system.origin))
  )
    problems.push(
      `${where}: the origin is a plain-text source or null; shadcn systems are not supported.`,
    )
  const app = (system.app ?? {}) as Record<string, unknown>
  const factory = (app.factory ?? {}) as Record<string, unknown>
  if (!relativeFile(factory.from) || typeof factory.name !== 'string')
    problems.push(
      `${where}: app.factory names the file and export that create the system’s Vue app.`,
    )
  for (const key of ['stylesheet', 'source'])
    if (app[key] !== undefined && !relativeFile(app[key]))
      problems.push(`${where}: app.${key} is a path inside the system.`)
  return problems
}

/** Reads every system declaration and checks it against the configuration. */
export async function loadSystems(
  root: string,
  config: { systems?: string[] },
  folder = SYSTEMS_FOLDER,
): Promise<SystemRegistry> {
  const systemsDir = path.resolve(root, folder)
  const registered = new Set(config.systems ?? [])
  const folders = existsSync(systemsDir)
    ? readdirSync(systemsDir, { withFileTypes: true })
        .filter(
          (entry) =>
            entry.isDirectory() &&
            existsSync(path.join(systemsDir, entry.name, 'system.ts')),
        )
        .map((entry) => entry.name)
        .sort()
    : []
  const problems: string[] = []
  for (const key of registered)
    if (!folders.includes(key))
      problems.push(
        `studio.config.json registers the system "${key}", but ${folder}/${key}/system.ts does not exist.`,
      )
  const systems: InstalledSystem[] = []
  for (const key of folders) {
    const relative = `${folder}/${key}`
    if (!registered.has(key)) {
      problems.push(
        `${relative} is not registered: add "${key}" to "systems" in studio.config.json, or remove the folder.`,
      )
      continue
    }
    const dir = path.join(systemsDir, key)
    const where = `${relative}/system.ts`
    // A query busts Node's module cache when the dev server restarts in-process.
    const url = pathToFileURL(path.join(dir, 'system.ts'))
    url.search = `?t=${Date.now()}-${++loads}`
    const spec = (await import(url.href)).default
    const found = systemProblems(spec, where)
    const owner = systems.find((system) => system.id === spec?.studioId)
    if (owner)
      found.push(
        `${where}: the studioId ${spec.studioId} is already used by ${owner.folder}.`,
      )
    problems.push(...found)
    if (found.length) continue
    systems.push({ spec, key, id: spec.studioId, dir, folder: relative })
  }
  return { systems, problems }
}
