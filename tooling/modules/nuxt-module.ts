// Builds the enabled studio modules into the app: their pages join the
// router, their rail and palette entries reach the client as
// `#studio/modules`, and their build data is served in development and
// emitted as files by the build. The studio reads the registry when the dev
// server starts, so switching a module takes a restart.
import path from 'node:path'
import {
  addTemplate,
  addTypeTemplate,
  addVitePlugin,
  defineNuxtModule,
  extendPages,
} from 'nuxt/kit'
import type { NuxtPage } from 'nuxt/schema'
import type { Plugin } from 'vite'
import type { ModulePage } from './contract.ts'
import { buildDataStore } from './build-data.ts'
import { loadRegistry, modulesForApp } from './registry.ts'

const DATA_MODULE = 'virtual:studio-module-data'
const DATA_ROUTE = '_studio/data/'

export default defineNuxtModule({
  meta: { name: 'studio-modules' },
  async setup(_options, nuxt) {
    const root = nuxt.options.rootDir
    // The browser scenarios point the studio at fixture modules and a
    // configuration of their own.
    const registry = await loadRegistry(root, {
      modulesFolder: process.env.STUDIO_MODULES || undefined,
      configFile: process.env.STUDIO_CONFIG || undefined,
    })
    // Local-only modules stay off the deployed site.
    const enabled = modulesForApp(registry.enabled, { dev: nuxt.options.dev })

    // Child pages render inside their parent's `<NuxtPage />`.
    const nuxtPage = (
      page: ModulePage,
      dir: string,
      name: string,
    ): NuxtPage => ({
      ...(page.children?.some((child) => child.path === '') ? {} : { name }),
      path: page.path,
      file: path.join(dir, page.file),
      children: (page.children ?? []).map((child, index) =>
        nuxtPage(child, dir, `${name}-${index}`),
      ),
    })
    extendPages((pages) => {
      for (const { spec, dir } of enabled)
        for (const [index, page] of (spec.pages ?? []).entries())
          pages.push(nuxtPage(page, dir, `${spec.id}-${index}`))
    })

    // Only what the browser needs; loaders stay on Node.
    const client = enabled.map(({ spec }) => ({
      id: spec.id,
      label: spec.label,
      description: spec.description ?? '',
      rail:
        spec.rail && spec.rail.position !== 'none'
          ? {
              position: spec.rail.position,
              icon: spec.rail.icon,
              order: spec.rail.order ?? 50,
              to: spec.rail.to ?? spec.pages?.[0]?.path ?? `/${spec.id}`,
            }
          : null,
      palette: spec.palette ?? [],
      paletteSource: spec.paletteSource,
      paletteOrder: spec.paletteOrder,
    }))
    // Each module's Home block, loaded when Home opens.
    const homeBlocks = enabled.flatMap(({ spec, dir }) =>
      spec.home
        ? [
            `{ id: ${JSON.stringify(spec.id)}, label: ${JSON.stringify(spec.label)}, order: ${JSON.stringify(spec.home.order ?? {})}, component: () => import(${JSON.stringify(path.join(dir, spec.home.component).split(path.sep).join('/'))}) }`,
          ]
        : [],
    )
    const homeTemplate = addTemplate({
      filename: 'studio-home-blocks.mjs',
      getContents: () => `export default [${homeBlocks.join(',\n')}]\n`,
    })
    nuxt.options.alias['#studio/home-blocks'] = homeTemplate.dst
    const template = addTemplate({
      filename: 'studio-modules.mjs',
      getContents: () => `export default ${JSON.stringify(client, null, 2)}\n`,
    })
    nuxt.options.alias['#studio/modules'] = template.dst
    addTypeTemplate(
      {
        filename: 'types/studio-modules.d.ts',
        getContents: () => `
declare module '#studio/modules' {
  export interface ClientModule {
    id: string
    label: string
    description: string
    rail: { position: 'top' | 'bottom'; icon?: string; order: number; to: string } | null
    palette: { label: string; to: string; icon?: string; group?: string; keywords?: string[] }[]
    paletteSource?: 'prototypes' | 'systems'
    paletteOrder?: number
  }
  const modules: ClientModule[]
  export default modules
}
declare module '#studio/home-blocks' {
  import type { Component } from 'vue'
  export interface HomeBlock {
    id: string
    label: string
    order: { local?: number; deployed?: number }
    component: () => Promise<{ default: Component }>
  }
  const blocks: HomeBlock[]
  export default blocks
}
declare module '${DATA_MODULE}' {
  /** Where each \`<module>/<name>\` build data is fetched from. */
  const urls: Record<string, string>
  export default urls
}
`,
      },
      { nuxt: true, nitro: false, node: false },
    )

    const store = buildDataStore(enabled, root, { dev: nuxt.options.dev })
    const base = nuxt.options.app.baseURL
    addVitePlugin(buildDataPlugin(store, base), { server: false })
  },
})

export function sameOrigin(
  headers: Record<string, string | string[] | undefined>,
) {
  const site = headers['sec-fetch-site']
  if (site) return site === 'same-origin'
  const origin = headers.origin
  return !origin || origin === `http://${headers.host}`
}

function buildDataPlugin(
  store: ReturnType<typeof buildDataStore>,
  base: string,
): Plugin {
  const resolved = `\0${DATA_MODULE}`
  let production = false
  return {
    name: 'studio-module-data',
    configResolved(config) {
      production = config.command === 'build'
    },
    resolveId(id) {
      if (id === DATA_MODULE) return resolved
    },
    async load(id) {
      if (id !== resolved) return
      const entries: string[] = []
      for (const key of store.keys) {
        if (production) {
          const reference = this.emitFile({
            type: 'asset',
            name: `${key.replace('/', '-')}.json`,
            source: await store.read(key),
          })
          entries.push(
            `${JSON.stringify(key)}: import.meta.ROLLUP_FILE_URL_${reference}`,
          )
        } else
          entries.push(
            `${JSON.stringify(key)}: ${JSON.stringify(base + DATA_ROUTE + key)}`,
          )
      }
      return `export default {${entries.join(',')}}`
    },
    configureServer(server) {
      server.middlewares.use(`${base}${DATA_ROUTE}`, async (req, res) => {
        // Development data is for the studio's own pages only.
        if (req.method !== 'GET' || !sameOrigin(req.headers)) {
          res.statusCode = 403
          res.end()
          return
        }
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        const key = decodeURIComponent((req.url ?? '').split('?')[0]!).replace(
          /^\/+/,
          '',
        )
        try {
          res.end(await store.read(key))
        } catch (error) {
          res.statusCode = store.keys.includes(key) ? 500 : 404
          res.end(JSON.stringify({ error: (error as Error).message }))
        }
      })
      const stale = (file: string) => {
        for (const key of store.invalidate(file))
          server.ws.send({
            type: 'custom',
            event: 'studio:data',
            data: { key },
          })
      }
      const events = ['add', 'unlink', 'change'] as const
      for (const event of events) server.watcher.on(event, stale)
      server.watcher.add(store.watchRoots)
      server.httpServer?.once('close', () => {
        for (const event of events) server.watcher.off(event, stale)
      })
    },
  }
}
