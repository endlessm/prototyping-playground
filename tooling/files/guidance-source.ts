// The file service's access to shared guidance: the Platform's and enabled
// modules' README, context, skills (with their supporting files) and
// contract files, and every Manual chapter file while the Manual is on,
// broken ones included so they can be fixed. Anyone may read them; they are
// the studio's own, so only an Admin saves them, over the version read. They
// can also be shown in the file browser or opened in a code editor.
// Framework-neutral; `server/guidance-source.ts` wraps it.
import {
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { readContributors } from '../contributors/profiles.ts'
import {
  permissionRefusal,
  refusalMessage,
  teamOf,
  type TeamConfig,
} from '../contributors/roles.ts'
import { guidanceCatalog } from '../guidance/catalog.ts'
import { guidanceSources } from '../guidance/sources.ts'
import { CONFIG_FILE, readConfig } from '../modules/registry.ts'
import {
  defaultIdentify,
  FileServiceError,
  MAX_SOURCE_BYTES,
  versionOf,
  type ArtifactSource,
  type FileServiceOptions,
} from './source.ts'
import {
  fileBrowser,
  installedEditors,
  launchProgram,
  type Editor,
} from './tree.ts'

export interface GuidanceSourceOptions {
  root: string
  platformFolder?: string
  modulesFolder?: string
  contributorsFolder?: string
  configFile?: string
  identify?: FileServiceOptions['identify']
  launch?: (command: string, args: string[]) => Promise<void>
  platform?: NodeJS.Platform
  editors?: Editor[]
}

const notFound = () =>
  new FileServiceError(404, 'not_found', 'This file no longer exists.')

export function createGuidanceSourceService(options: GuidanceSourceOptions) {
  const { root } = options
  const configFile = path.resolve(root, options.configFile ?? CONFIG_FILE)
  const contributorsFolder = options.contributorsFolder ?? 'contributors'
  const platform = options.platform ?? process.platform
  const launch = options.launch ?? launchProgram

  /** Every file the service may reach, repository-relative. */
  async function reachable() {
    const sources = await guidanceSources(root, {
      dev: true,
      platform: options.platformFolder,
      modulesFolder: options.modulesFolder,
      configFile: options.configFile,
    })
    const files = new Set<string>()
    for (const owner of guidanceCatalog(root, sources).owners)
      for (const document of owner.documents) {
        files.add(document.file)
        for (const file of document.files ?? [])
          files.add(`${path.posix.dirname(document.file)}/${file}`)
      }
    if (sources.manual && existsSync(path.join(root, sources.manual)))
      for (const entry of readdirSync(path.join(root, sources.manual), {
        withFileTypes: true,
      }))
        if (entry.isFile() && entry.name.endsWith('.md'))
          files.add(`${sources.manual}/${entry.name}`)
    return files
  }

  async function locate(address: { path: unknown }) {
    const relative = String(address.path ?? '')
    if (!(await reachable()).has(relative)) throw notFound()
    const file = path.join(root, ...relative.split('/'))
    try {
      const stat = lstatSync(file)
      if (!stat.isFile() || stat.isSymbolicLink()) throw notFound()
    } catch {
      throw notFound()
    }
    if (!realpathSync(file).startsWith(realpathSync(root) + path.sep))
      throw notFound()
    return { relative, file }
  }

  function refusal() {
    let config: TeamConfig = {}
    try {
      config = readConfig(configFile)
    } catch {
      // No configuration: nobody is an Admin.
    }
    const { contributors } = readContributors(root, contributorsFolder)
    const identity = (options.identify ?? defaultIdentify(root))(contributors)
    const refused = permissionRefusal(
      teamOf(config, contributors),
      contributors,
      identity.key,
      { kind: 'studio' },
      'edit',
    )
    return refused
      ? {
          code: refused,
          message: refusalMessage(refused, {
            email: identity.email,
            hint: identity.hint,
          }),
        }
      : null
  }

  async function reveal(file: string) {
    if (platform === 'win32') return launch('explorer.exe', [`/select,${file}`])
    if (platform === 'darwin') return launch('/usr/bin/open', ['-R', file])
    return launch('xdg-open', [path.dirname(file)])
  }

  return {
    async read(address: { path: unknown }): Promise<ArtifactSource> {
      const { relative, file } = await locate(address)
      if (lstatSync(file).size > MAX_SOURCE_BYTES)
        throw new FileServiceError(
          413,
          'too_large',
          'This file is too large to show here. Open it in your editor.',
        )
      const content = readFileSync(file, 'utf8')
      const refused = refusal()
      return {
        path: relative,
        content,
        version: versionOf(content),
        editable: !refused,
        ...(refused ? { reason: refused.message } : {}),
      }
    },

    async save(address: {
      path: unknown
      content: unknown
      base: unknown
    }): Promise<{ version: string; warnings: string[] }> {
      const { file } = await locate(address)
      const refused = refusal()
      if (refused)
        throw new FileServiceError(403, refused.code, refused.message)
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

    /** Shows the file in the computer's file browser. */
    async reveal(address: { path: unknown }) {
      const { file } = await locate(address)
      try {
        await reveal(file)
      } catch {
        throw new FileServiceError(
          500,
          'unavailable',
          `Couldn’t open ${fileBrowser(platform)}. Copy the file’s path instead.`,
        )
      }
      return {}
    },

    /** Opens the file in a code editor, or shows it in the file browser. */
    async open(address: { path: unknown }) {
      const { file } = await locate(address)
      const editors = options.editors ?? installedEditors(platform)
      for (const editor of editors) {
        try {
          await launch(editor.command, [...editor.args, file])
          return { opened: true, editor: editor.name }
        } catch {
          // Try the next one.
        }
      }
      const where = fileBrowser(platform)
      try {
        await reveal(file)
      } catch {
        throw new FileServiceError(
          500,
          'unavailable',
          'Couldn’t open a code editor. Use Edit source, or copy the file’s path.',
        )
      }
      return {
        opened: false,
        message: editors.length
          ? `Your code editor didn’t open, so the file is shown in ${where}. You can also use Edit source, or copy its path.`
          : `No supported code editor is installed, so the file is shown in ${where}. You can also use Edit source, or copy its path.`,
      }
    },
  }
}
