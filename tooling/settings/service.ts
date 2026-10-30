import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  loadRegistry,
  type RegistryOptions,
  type StudioConfig,
} from '../modules/registry.ts'
import { readContributors } from '../contributors/profiles.ts'
import { resolveIdentity } from '../contributors/identity.ts'
import { adminProblems, roleOf, teamOf } from '../contributors/roles.ts'
import { registeredSystems } from '../studio/systems.ts'
import { editConfig, parseConfig } from './config-file.ts'

export const revisionOf = (source: string) =>
  createHash('sha256').update(source).digest('hex')
const KEYS = new Set([
  '$schema',
  'formatVersion',
  'name',
  'tagline',
  'modules',
  'systems',
  'systemMaintainers',
  'defaultSystem',
  'admins',
])
const EDITABLE = new Set([
  'name',
  'tagline',
  'modules',
  'defaultSystem',
  'admins',
  'systemMaintainers',
])

export async function settingsSnapshot(
  root: string,
  options: RegistryOptions & { contributorsFolder?: string } = {},
) {
  const file = path.resolve(root, options.configFile ?? 'studio.config.json')
  const source = readFileSync(file, 'utf8')
  const { config } = parseConfig(source, file)
  const registry = await loadRegistry(root, options)
  const { contributors } = readContributors(root, options.contributorsFolder)
  const { key } = resolveIdentity(root, contributors)
  const systems = registeredSystems(root, config.systems)
  return {
    file,
    source,
    config: config as StudioConfig,
    revision: revisionOf(source),
    contributors,
    adminProblem: adminProblems(config, contributors)[0] ?? null,
    role: roleOf(teamOf(config, contributors), contributors, key),
    systems,
    modules: registry.modules.map(({ spec, state }) => ({
      id: spec.id,
      label: spec.label,
      description: spec.description ?? '',
      required: !!spec.required || spec.id === 'contributors',
      enabled: state === 'on',
    })),
  }
}

export type SettingsSnapshot = Awaited<ReturnType<typeof settingsSnapshot>>

export function validateSettings(
  config: StudioConfig,
  snapshot: SettingsSnapshot,
) {
  const problems: string[] = []
  for (const key of Object.keys(config))
    if (!KEYS.has(key)) problems.push(`Unknown setting ${key}.`)
  if (config.formatVersion !== 1) problems.push('formatVersion must be 1.')
  if (typeof config.name !== 'string' || !config.name.trim())
    problems.push('Studio name is required.')
  if (
    config.tagline !== undefined &&
    (typeof config.tagline !== 'string' || config.tagline.length > 140)
  )
    problems.push('Tagline must be at most 140 characters.')
  problems.push(...adminProblems(config, snapshot.contributors))
  if (
    !Array.isArray(config.systems) ||
    new Set(config.systems).size !== config.systems.length ||
    config.systems.some(
      (key) =>
        !snapshot.systems.some(
          (system) => system.key === key && system.studioId,
        ),
    )
  )
    problems.push('systems must list unique registered systems.')
  if (
    config.defaultSystem !== null &&
    !snapshot.systems.some(
      (system) =>
        system.studioId === config.defaultSystem && system.status === 'active',
    )
  )
    problems.push('Default system must be an active system or null.')
  for (const module of snapshot.modules) {
    if (typeof config.modules?.[module.id] !== 'boolean')
      problems.push(`Module ${module.id} must be explicitly true or false.`)
    if (module.required && config.modules?.[module.id] !== true)
      problems.push(`Module ${module.id} is required.`)
  }
  if (
    !config.modules ||
    typeof config.modules !== 'object' ||
    Array.isArray(config.modules) ||
    Object.values(config.modules).some((value) => typeof value !== 'boolean')
  )
    problems.push('modules must map IDs to true or false.')
  const grants = config.systemMaintainers
  if (!grants || typeof grants !== 'object' || Array.isArray(grants))
    problems.push('systemMaintainers must be an object.')
  else {
    for (const system of snapshot.systems) {
      if (system.studioId && !Object.hasOwn(grants, system.studioId))
        problems.push(
          `Maintainers for ${system.key} must be explicit; use [] when unassigned.`,
        )
    }
    for (const [id, people] of Object.entries(grants)) {
      if (
        !snapshot.systems.some((system) => system.studioId === id) ||
        !Array.isArray(people) ||
        new Set(people).size !== people.length ||
        people.some(
          (person) =>
            !Object.values(snapshot.contributors).some(
              (profile) => profile.studioId === person,
            ),
        )
      )
        problems.push(`Invalid maintainers for ${id}.`)
    }
  }
  if (problems.length)
    throw new Error(`studio.config.json: ${problems.join(' ')}`)
}

export function planSettings(
  snapshot: SettingsSnapshot,
  changes: Record<string, unknown>,
) {
  for (const key of Object.keys(changes))
    if (!EDITABLE.has(key)) throw new Error(`Cannot change ${key}.`)
  const config = { ...snapshot.config, ...changes }
  validateSettings(config, snapshot)
  return { config, source: editConfig(snapshot.source, changes, snapshot.file) }
}

export function saveSettings(
  snapshot: SettingsSnapshot,
  changes: Record<string, unknown>,
  revision: string,
  recovery = false,
) {
  if (!recovery && snapshot.role !== 'admin')
    throw new Error('Only an Admin can change settings.')
  const plan = planSettings(snapshot, changes)
  if (revisionOf(readFileSync(snapshot.file, 'utf8')) !== revision)
    throw new Error(
      'Settings changed elsewhere. Reload settings before saving.',
    )
  if (plan.source !== snapshot.source) writeFileSync(snapshot.file, plan.source)
  return plan.config
}

export function pinnedPrototypes(root: string) {
  const folder = path.join(root, 'src/prototypes')
  if (!existsSync(folder)) return []
  return readdirSync(folder, { recursive: true })
    .filter((name) => String(name).endsWith('meta.json'))
    .map((name) => ({
      file: String(name),
      systemId: JSON.parse(
        readFileSync(path.join(folder, String(name)), 'utf8'),
      ).systemId,
    }))
}
