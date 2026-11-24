// The file service: while the dev server runs, Nitro routes read and save
// artifacts' source (`server/source.ts`) and systems' own source files
// (`server/system-source.ts`) and shared guidance with the Manual's
// chapters (`server/guidance-source.ts`), list and change a prototype's files for its
// file tree (`server/tree.ts`) and create prototypes
// (`server/prototypes.ts`), and create and change design systems
// (`server/systems.ts`) and their Context and Skills files
// (`server/system-tree.ts`); renames and moves made outside the studio
// have their references repaired (`server/moves.ts`). Open pages hear
// `studio:source` with the files whose content changed on disk, so an open
// editor can reload or offer its conflict choice, and `studio:files` when
// files or folders were added or removed, so file trees refresh. The static
// build has none of it.
import { randomBytes } from 'node:crypto'
import path from 'node:path'
import {
  addServerHandler,
  addServerPlugin,
  addVitePlugin,
  createResolver,
  defineNuxtModule,
} from 'nuxt/kit'
import type { Plugin } from 'vite'
import { posix, PROTOTYPES_FOLDER } from '../manifest/build.ts'
import { platformFolder } from '../guidance/sources.ts'
import type { ModulePrototypeFolder } from '../modules/contract.ts'
import {
  loadRegistry,
  MODULES_FOLDER,
  prototypeFolders,
} from '../modules/registry.ts'
import { systemsFolder } from '../systems/registry.ts'
import {
  RELEASE_ROUTE,
  registerWatcher,
  releaseFolder,
  restoreFolder,
} from './watchers.ts'

export const SOURCE_ROUTE = '_studio/files/source'
export const SYSTEM_SOURCE_ROUTE = '_studio/files/system-source'
export const GUIDANCE_SOURCE_ROUTE = '_studio/files/guidance-source'
export const PROTOTYPES_ROUTE = '_studio/files/prototypes'
export const TREE_ROUTE = '_studio/files/tree'
export const SYSTEMS_ROUTE = '_studio/files/systems'
export const SYSTEM_TREE_ROUTE = '_studio/files/system-tree'

/** What the routes need, through the server's runtime configuration. */
export interface FileServiceConfig {
  root: string
  prototypesFolder: string
  systemsFolder: string
  contributorsFolder: string
  configFile: string
  /** Shared guidance: the Platform's folder and the modules' folder. */
  platformFolder: string
  modulesFolder: string
  /**
   * The installed file types, with the files of each one's identity
   * adapter, lo-fi adapter and template.
   */
  fileTypes: {
    id: string
    extensions: string[]
    identity: string
    fidelity?: string
    template?: string
  }[]
  /** The files of every module's reference adapters, turned off or not. */
  references: string[]
  /** Every module's hidden prototype folder, turned off or not. */
  prototypeFolders: ModulePrototypeFolder[]
  /**
   * Where to note the programs the service would start (file browser, code
   * editor) instead of starting them, with no code editor found; for the
   * browser scenarios.
   */
  launchLog?: string
  /** Proves a release request comes from the file service. */
  releaseToken: string
}

const SETTLE_MS = 50

export default defineNuxtModule({
  meta: { name: 'studio-files' },
  async setup(_options, nuxt) {
    if (!nuxt.options.dev) return
    const { resolve } = createResolver(import.meta.url)
    const root = nuxt.options.rootDir
    const registry = await loadRegistry(root, {
      modulesFolder: process.env.STUDIO_MODULES || undefined,
      configFile: process.env.STUDIO_CONFIG || undefined,
    })
    const config: FileServiceConfig = {
      root,
      // The browser scenarios point the studio at fixture content.
      prototypesFolder: process.env.STUDIO_PROTOTYPES || PROTOTYPES_FOLDER,
      systemsFolder: systemsFolder(),
      contributorsFolder: process.env.STUDIO_CONTRIBUTORS || 'contributors',
      configFile: registry.configFile,
      platformFolder: platformFolder(),
      modulesFolder: process.env.STUDIO_MODULES || MODULES_FOLDER,
      // Turned-off modules' files too: their source still opens.
      fileTypes: registry.modules.flatMap(({ spec, dir }) =>
        (spec.fileTypes ?? []).map((type) => ({
          id: type.id,
          extensions: type.extensions,
          identity: path.join(dir, type.identity),
          ...(type.fidelity && { fidelity: path.join(dir, type.fidelity) }),
          ...(type.template && { template: path.join(dir, type.template) }),
        })),
      ),
      references: registry.modules.flatMap(({ spec, dir }) =>
        spec.references ? [path.join(dir, spec.references)] : [],
      ),
      prototypeFolders: prototypeFolders(registry.modules),
      launchLog: process.env.STUDIO_LAUNCH_LOG || undefined,
      releaseToken: randomBytes(16).toString('hex'),
    }
    nuxt.options.runtimeConfig.studioFiles = config
    addServerHandler({
      route: `/${SOURCE_ROUTE}`,
      handler: resolve('./server/source.ts'),
    })
    addServerHandler({
      route: `/${SYSTEM_SOURCE_ROUTE}`,
      handler: resolve('./server/system-source.ts'),
    })
    addServerHandler({
      route: `/${GUIDANCE_SOURCE_ROUTE}`,
      handler: resolve('./server/guidance-source.ts'),
    })
    addServerHandler({
      route: `/${PROTOTYPES_ROUTE}`,
      handler: resolve('./server/prototypes.ts'),
    })
    addServerHandler({
      route: `/${TREE_ROUTE}`,
      handler: resolve('./server/tree.ts'),
    })
    addServerHandler({
      route: `/${SYSTEMS_ROUTE}`,
      handler: resolve('./server/systems.ts'),
    })
    addServerHandler({
      route: `/${SYSTEM_TREE_ROUTE}`,
      handler: resolve('./server/system-tree.ts'),
    })
    // Renames and moves made outside the studio repair references too.
    addServerPlugin(resolve('./server/moves.ts'))
    addVitePlugin(
      sourceChanges(root, [
        path.resolve(root, config.prototypesFolder),
        path.resolve(root, config.systemsFolder),
        path.resolve(root, config.platformFolder),
        path.resolve(root, config.modulesFolder),
      ]),
      { server: false },
    )
    addVitePlugin(
      releaseRoute(nuxt.options.app.baseURL, config.releaseToken, [
        path.resolve(root, config.prototypesFolder),
        path.resolve(root, config.systemsFolder),
      ]),
      { server: false },
    )
  },
})

/**
 * Lets the file service ask the dev server's watchers to let go of a
 * prototype's or a system's folder, and to watch it again (`./watchers.ts`).
 */
function releaseRoute(base: string, token: string, places: string[]): Plugin {
  return {
    name: 'studio-release-folders',
    configureServer(server) {
      const unregister = registerWatcher(server.watcher)
      server.httpServer?.once('close', unregister)
      server.middlewares.use(`${base}${RELEASE_ROUTE}`, (req, res) => {
        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', () => {
          let request: { token?: string; folder?: string; restore?: boolean }
          try {
            request = JSON.parse(body)
          } catch {
            request = {}
          }
          const folder = path.resolve(String(request.folder ?? ''))
          if (
            req.method !== 'POST' ||
            request.token !== token ||
            !places.some((place) => folder.startsWith(place + path.sep))
          ) {
            res.statusCode = 403
            res.end()
            return
          }
          if (request.restore) restoreFolder(folder)
          else releaseFolder(folder)
          res.statusCode = 204
          res.end()
        })
      })
    },
  }
}

/**
 * Tells open pages which content files changed, as the service names them,
 * and which files and folders were added or removed.
 */
function sourceChanges(root: string, folders: string[]): Plugin {
  const named = (file: string) => {
    const relative = path.relative(root, file)
    return posix(relative.startsWith('..') ? file : relative)
  }
  return {
    name: 'studio-source-changes',
    configureServer(server) {
      const batch = (event: string, key: 'files' | 'paths') => {
        const files = new Set<string>()
        let timer: ReturnType<typeof setTimeout> | undefined
        return {
          add(file: string) {
            files.add(file)
            clearTimeout(timer)
            timer = setTimeout(() => {
              server.ws.send({
                type: 'custom',
                event,
                data: { [key]: [...files] },
              })
              files.clear()
            }, SETTLE_MS)
          },
          stop: () => clearTimeout(timer),
        }
      }
      const sources = batch('studio:source', 'files')
      const structure = batch('studio:files', 'paths')
      const listener = (event: string) => (file: string) => {
        const resolved = path.resolve(file)
        if (!folders.some((folder) => resolved.startsWith(folder + path.sep)))
          return
        if (event !== 'addDir' && event !== 'unlinkDir')
          sources.add(named(resolved))
        if (event !== 'change') structure.add(named(resolved))
      }
      const events = ['add', 'change', 'unlink', 'addDir', 'unlinkDir']
      const listeners = events.map((event) => [event, listener(event)] as const)
      for (const [event, on] of listeners) server.watcher.on(event, on)
      server.watcher.add(folders)
      server.httpServer?.once('close', () => {
        sources.stop()
        structure.stop()
        for (const [event, on] of listeners) server.watcher.off(event, on)
      })
    },
  }
}
