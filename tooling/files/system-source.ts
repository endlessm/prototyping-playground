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
import {
  loadSystems,
  SYSTEMS_FOLDER,
  type InstalledSystem,
} from '../systems/registry.ts'
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
  return section === 'components' && parts.length > 2
}

function ordinaryFile(file: string) {
  try {
    const stat = lstatSync(file)
    return stat.isFile() && !stat.isSymbolicLink()
  } catch {
    return false
  }
}

export function createSystemSourceService(options: SystemSourceOptions) {
  const { root } = options
  const folder = options.systemsFolder ?? SYSTEMS_FOLDER
  const configFile = path.resolve(root, options.configFile ?? CONFIG_FILE)
  const contributorsFolder = options.contributorsFolder ?? 'contributors'

  async function locate(address: SystemFileAddress) {
    let config: TeamConfig & { systems?: string[] } = {}
    try {
      config = readConfig(configFile)
    } catch {
      // No configuration: no systems, and nobody is an Admin.
    }
    const { systems } = await loadSystems(root, config, folder)
    const system = systems.find(({ id }) => id === address.system)
    if (!system || !reachable(system, address.path)) throw notFound()
    const file = path.join(system.dir, ...address.path.split('/'))
    if (!ordinaryFile(file)) throw notFound()
    if (!realpathSync(file).startsWith(realpathSync(system.dir) + path.sep))
      throw notFound()
    return { system, file, config }
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
      return { version: versionOf(content), warnings: [] }
    },
  }
}
