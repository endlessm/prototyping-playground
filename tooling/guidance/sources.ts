// Where the studio's shared guidance is: the Platform's folder, each
// enabled module's, and the Manual's chapters while the Documentation module
// is on. The browser scenarios point it at fixtures (`STUDIO_PLATFORM`,
// `STUDIO_MODULES`, `STUDIO_CONFIG`).
import path from 'node:path'
import { posix } from '../manifest/build.ts'
import { loadRegistry, modulesForApp } from '../modules/registry.ts'
import type { GuidanceSources } from './catalog.ts'

export const PLATFORM_FOLDER = 'src/platform'
/** The Manual's chapters, inside the Documentation module's folder. */
export const MANUAL_FOLDER = 'pages'

export const platformFolder = () =>
  process.env.STUDIO_PLATFORM || PLATFORM_FOLDER

export interface SourcesOptions {
  /** Modules the deployed site leaves out are listed only for `dev`. */
  dev: boolean
  platform?: string
  modulesFolder?: string
  configFile?: string
}

export async function guidanceSources(
  root: string,
  options: SourcesOptions,
): Promise<GuidanceSources & { manual: string | null }> {
  const registry = await loadRegistry(root, {
    modulesFolder:
      options.modulesFolder ?? (process.env.STUDIO_MODULES || undefined),
    configFile: options.configFile ?? (process.env.STUDIO_CONFIG || undefined),
  })
  const enabled = modulesForApp(registry.enabled, { dev: options.dev })
  const documentation = enabled.find(({ spec }) => spec.id === 'documentation')
  return {
    platform: posix(options.platform ?? platformFolder()),
    modules: enabled.map(({ spec, folder }) => ({
      id: spec.id,
      label: spec.label,
      folder,
    })),
    manual: documentation
      ? posix(path.posix.join(documentation.folder, MANUAL_FOLDER))
      : null,
  }
}
