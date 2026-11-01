// The file service's source access to a system: its own source files, read
// by the system's permanent ID and a path inside its folder, and saved only
// over the version that was read, by an Admin or one of its maintainers
// while it is active. Only the system's declaration, its stylesheet, its
// documented components' files, its Context documents and its skills'
// files are reachable. Permissions are read from disk again on every
// request. Framework-neutral; `server/system-source.ts` wraps it.
import { lstatSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { readContributors } from '../contributors/profiles.ts'
import {
  permissionRefusal,
  refusalMessage,
  teamOf,
  type TeamConfig,
} from '../contributors/roles.ts'
import { posix } from '../manifest/build.ts'
import { CONFIG_FILE, readConfig } from '../modules/registry.ts'
import { SKILL_FILE, skillProblems } from '../systems/catalog.ts'
import {
  loadSystems,
  SYSTEMS_FOLDER,
  type InstalledSystem,
} from '../systems/registry.ts'
import {
  applyScaffold,
  planScaffold,
  ScaffoldError,
  scaffoldTargets,
} from '../systems/scaffold.ts'
import {
  defaultIdentify,
  FileServiceError,
  MAX_SOURCE_BYTES,
  versionOf,
  type ArtifactSource,
  type FileServiceOptions,
} from './source.ts'

export interface SystemSourceOptions {
  root: string
  systemsFolder?: string
  contributorsFolder?: string
  configFile?: string
  identify?: FileServiceOptions['identify']
}

export interface SystemFileAddress {
  /** The system's permanent ID. */
  system: string
  /** Inside the system's folder, with forward slashes. */
  path: string
}

const notFound = () =>
  new FileServiceError(404, 'not_found', 'This file no longer exists.')

/** Whether the system's source route may reach `file` inside it. */
export function reachable(system: InstalledSystem, file: string) {
  const parts = file.split('/')
  if (!file || parts.some((part) => !part || part === '.' || part === '..'))
    return false
  if (parts.some((part) => part.startsWith('.') || part === 'node_modules'))
    return false
  if (file === 'system.ts') return true
  const stylesheet = system.spec.app.stylesheet
  if (stylesheet && posix(path.normalize(stylesheet)) === file) return true
  const [section] = parts
  if (section === 'context') return parts.length > 1 && file.endsWith('.md')
  if (section === 'skills') return parts.length > 2
  return section === 'components' && parts.length > 1
}

function ordinaryFile(file: string) {
  try {
    const stat = lstatSync(file)
    return stat.isFile() && !stat.isSymbolicLink()
  } catch {
    return false
  }
}

/**
 * A system by its permanent ID, with the configuration it was read from,
 * and why the person working may not change it (null when they may):
 * Admins and the system's maintainers change an active system. Read from
 * disk again on every call.
 */
export function systemAccess(options: SystemSourceOptions) {
  const { root } = options
  const folder = options.systemsFolder ?? SYSTEMS_FOLDER
  const configFile = path.resolve(root, options.configFile ?? CONFIG_FILE)
  const contributorsFolder = options.contributorsFolder ?? 'contributors'

  async function systemOf(id: string) {
    let config: TeamConfig & { systems?: string[] } = {}
    try {
      config = readConfig(configFile)
    } catch {
      // No configuration: no systems, and nobody is an Admin.
    }
    const { systems } = await loadSystems(root, config, folder)
    return { system: systems.find((entry) => entry.id === id), config }
  }

  function refusalFor(system: InstalledSystem, config: TeamConfig) {
    const { contributors } = readContributors(root, contributorsFolder)
    const identity = (options.identify ?? defaultIdentify(root))(contributors)
    const refusal = permissionRefusal(
      teamOf(config, contributors),
      contributors,
      identity.key,
      { kind: 'system', id: system.id, status: system.spec.status },
      'edit',
    )
    return refusal
      ? {
          code: refusal,
          message: refusalMessage(refusal, {
            email: identity.email,
            system: system.spec.label,
            hint: identity.hint,
          }),
        }
      : null
  }

  return { systemOf, refusalFor }
}

export function createSystemSourceService(options: SystemSourceOptions) {
  const { root } = options
  const { systemOf, refusalFor } = systemAccess(options)

  async function locate(address: SystemFileAddress) {
    const { system, config } = await systemOf(address.system)
    if (!system || !reachable(system, address.path)) throw notFound()
    const file = path.join(system.dir, ...address.path.split('/'))
    if (!ordinaryFile(file)) throw notFound()
    if (!realpathSync(file).startsWith(realpathSync(system.dir) + path.sep))
      throw notFound()
    return { system, file, config }
  }

  const display = (file: string) => posix(path.relative(root, file))

  return {
    async read(address: SystemFileAddress): Promise<ArtifactSource> {
      const { system, file, config } = await locate(address)
      if (lstatSync(file).size > MAX_SOURCE_BYTES)
        throw new FileServiceError(
          413,
          'too_large',
          'This file is too large to show here. Open it in your editor.',
        )
      const content = readFileSync(file, 'utf8')
      const refusal = refusalFor(system, config)
      return {
        path: display(file),
        content,
        version: versionOf(content),
        editable: !refusal,
        ...(refusal ? { reason: refusal.message } : {}),
      }
    },

    /**
     * Creates the examples file and page a component is missing, from
     * templates, as `yarn component-docs <system> <component> --yes` does.
     * Returns the files it created, repository-relative.
     */
    async create(address: {
      system: string
      component: string
    }): Promise<{ files: string[] }> {
      const { system, config } = await systemOf(address.system)
      if (!system || !address.component) throw notFound()
      const refusal = refusalFor(system, config)
      if (refusal)
        throw new FileServiceError(403, refusal.code, refusal.message)
      try {
        const steps = planScaffold(
          system,
          root,
          scaffoldTargets(system, address.component),
        )
        const sources = steps
          .filter(({ file }) => file.endsWith('.examples.vue'))
          .map(({ file }) => file.replace(/\.examples\.vue$/, '.vue'))
        const required: Record<string, { name: string; type: string }[]> = {}
        if (sources.length) {
          const { componentProps } = await import('../systems/props.ts')
          const found = await componentProps(
            sources.map((file) => path.join(root, file)),
          )
          for (const file of sources) {
            const result = found[path.join(root, file)]
            if (result && !('error' in result))
              required[file] = result.props.filter((prop) => prop.required)
          }
        }
        const done = applyScaffold(root, steps, required)
        return {
          files: done
            .filter(({ kind }) => kind === 'create')
            .map(({ file }) => file),
        }
      } catch (error) {
        if (error instanceof ScaffoldError)
          throw new FileServiceError(404, 'not_found', error.message)
        throw error
      }
    },

    async save(
      address: SystemFileAddress & { content: unknown; base: unknown },
    ): Promise<{ version: string; warnings: string[] }> {
      const { system, file, config } = await locate(address)
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
          'This file is too large to save here. Keep files under 750 KB.',
        )
      // Never overwrite a version you haven't seen.
      if (versionOf(readFileSync(file, 'utf8')) !== address.base)
        throw new FileServiceError(
          409,
          'changed',
          'This file changed on disk since you opened it.',
        )
      writeFileSync(file, content)
      // Saved anyway, but a skill out of the format would fail the build:
      // say so now.
      const [section, skill, name, ...rest] = address.path.split('/')
      const warnings =
        section === 'skills' && skill && name === SKILL_FILE && !rest.length
          ? skillProblems(system, root, skill, content)
          : []
      return { version: versionOf(content), warnings }
    },
  }
}
