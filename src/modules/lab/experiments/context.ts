// What the Lab's server side shares, on Node: the folders and installed
// file types it works with, read once the same way for the dev server's
// handlers and the build data, the installed systems, the view type that
// experiments are, and the refusals they answer with. Imports only Node and
// `tooling/`.
import path from 'node:path'
import {
  FileServiceError,
  type FileServiceOptions,
} from '../../../../tooling/files/source.ts'
import {
  identityFileTypes,
  type IdentityFileType,
} from '../../../../tooling/identity/file-types.ts'
import { PROTOTYPES_FOLDER } from '../../../../tooling/manifest/build.ts'
import {
  CONFIG_FILE,
  loadRegistry,
  readConfig,
} from '../../../../tooling/modules/registry.ts'
import {
  loadSystems,
  systemsFolder,
} from '../../../../tooling/systems/registry.ts'

export interface ExperimentsContext {
  /** The studio's root folder. */
  root: string
  /** Relative to the root; `src/prototypes` by default. */
  prototypesFolder?: string
  /** Relative to the root or absolute; `contributors` by default. */
  contributorsFolder?: string
  /** Relative to the root; `studio.config.json` by default. */
  configFile?: string
  /** Relative to the root; the studio's systems folder by default. */
  systemsFolder?: string
  /** Every installed file type, so no identity is handed out twice. */
  fileTypes: IdentityFileType[]
  /** Who is working; your Git identity by default. */
  identify?: FileServiceOptions['identify']
}

/** The Lab's context on the dev server, from the studio's settings. */
export async function labContext(
  root: string,
  contributorsFolder?: string,
): Promise<ExperimentsContext> {
  const configFile = process.env.STUDIO_CONFIG || undefined
  const registry = await loadRegistry(root, {
    modulesFolder: process.env.STUDIO_MODULES || undefined,
    configFile,
  })
  return {
    root,
    prototypesFolder: process.env.STUDIO_PROTOTYPES || PROTOTYPES_FOLDER,
    contributorsFolder,
    configFile,
    // Every module's, turned off or not, so no identity is handed out twice.
    fileTypes: await identityFileTypes(registry.modules),
  }
}

/** The systems the studio has installed. */
export async function installedSystems(
  context: Pick<ExperimentsContext, 'root' | 'configFile' | 'systemsFolder'>,
) {
  const { systems } = await loadSystems(
    context.root,
    readConfig(path.resolve(context.root, context.configFile ?? CONFIG_FILE)),
    context.systemsFolder ?? systemsFolder(),
  )
  return systems
}

/** The file type experiments are, when an installed module provides it. */
export const viewTypeIn = (fileTypes: IdentityFileType[]) =>
  fileTypes.find(({ id }) => id === 'view')

export const refuse = (status: number, code: string, message: string) =>
  new FileServiceError(status, code, message)
export const gone = () =>
  refuse(404, 'not_found', 'This experiment no longer exists.')
