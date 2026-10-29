// The file service: while the dev server runs, Nitro routes read and save
// artifacts' source (`server/source.ts`), and open pages hear `studio:source`
// with the files that changed on disk, so an open editor can reload or offer
// its conflict choice. The static build has none of it.
import path from 'node:path'
import {
  addServerHandler,
  addVitePlugin,
  createResolver,
  defineNuxtModule,
} from 'nuxt/kit'
import type { Plugin } from 'vite'
import { posix, PROTOTYPES_FOLDER } from '../manifest/build.ts'
import { loadRegistry } from '../modules/registry.ts'

export const SOURCE_ROUTE = '_studio/files/source'

/** What the routes need, through the server's runtime configuration. */
export interface FileServiceConfig {
  root: string
  prototypesFolder: string
  contributorsFolder: string
  configFile: string
  /** The installed file types, with each identity adapter's file. */
  fileTypes: { id: string; extensions: string[]; identity: string }[]
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
      contributorsFolder: process.env.STUDIO_CONTRIBUTORS || 'contributors',
      configFile: registry.configFile,
      // Turned-off modules' files too: their source still opens.
      fileTypes: registry.modules.flatMap(({ spec, dir }) =>
        (spec.fileTypes ?? []).map((type) => ({
          id: type.id,
          extensions: type.extensions,
          identity: path.join(dir, type.identity),
        })),
      ),
    }
    nuxt.options.runtimeConfig.studioFiles = config
    addServerHandler({
      route: `/${SOURCE_ROUTE}`,
      handler: resolve('./server/source.ts'),
    })
    addVitePlugin(
      sourceChanges(root, path.resolve(root, config.prototypesFolder)),
      { server: false },
    )
  },
})

/** Tells open pages which content files changed, as the service names them. */
function sourceChanges(root: string, folder: string): Plugin {
  const named = (file: string) => {
    const relative = path.relative(root, file)
    return posix(relative.startsWith('..') ? file : relative)
  }
  return {
    name: 'studio-source-changes',
    configureServer(server) {
      const files = new Set<string>()
      let timer: ReturnType<typeof setTimeout> | undefined
      const changed = (file: string) => {
        const resolved = path.resolve(file)
        if (!resolved.startsWith(folder + path.sep)) return
        files.add(named(resolved))
        clearTimeout(timer)
        timer = setTimeout(() => {
          server.ws.send({
            type: 'custom',
            event: 'studio:source',
            data: { files: [...files] },
          })
          files.clear()
        }, SETTLE_MS)
      }
      const events = ['add', 'change', 'unlink'] as const
      for (const event of events) server.watcher.on(event, changed)
      server.watcher.add(folder)
      server.httpServer?.once('close', () => {
        clearTimeout(timer)
        for (const event of events) server.watcher.off(event, changed)
      })
    },
  }
}
