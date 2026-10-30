// Who is working, for the app. In development, `/_studio/me` answers with the
// contributor your Git identity resolves to, and a `studio:identity` event
// tells open pages to ask again when a profile or the configuration changes.
// The deployed build identifies nobody. Both get `#studio/directory`, the
// contributors' and systems' keys and permanent IDs, and nothing else.
import path from 'node:path'
import {
  addTemplate,
  addTypeTemplate,
  addVitePlugin,
  defineNuxtModule,
  updateTemplates,
} from 'nuxt/kit'
import type { Plugin } from 'vite'
import { readConfig } from '../modules/registry.ts'
import { publicDirectory } from './directory.ts'
import { resolveIdentity } from './identity.ts'
import { identityCache } from './identity-cache.ts'
import { readContributors } from './profiles.ts'
import { roleOf, teamOf } from './roles.ts'

const ME_ROUTE = '_studio/me'

export default defineNuxtModule({
  meta: { name: 'studio-contributors' },
  setup(_options, nuxt) {
    const root = nuxt.options.rootDir
    // The browser scenarios give the studio profiles of their own.
    const folder = process.env.STUDIO_CONTRIBUTORS || 'contributors'
    const configFile = path.resolve(
      root,
      process.env.STUDIO_CONFIG || 'studio.config.json',
    )

    const template = addTemplate({
      filename: 'studio-directory.mjs',
      getContents: () =>
        `export default ${JSON.stringify(
          publicDirectory(root, {
            contributorsFolder: folder,
            systems: readConfig(configFile).systems,
          }),
          null,
          2,
        )}\n`,
    })
    nuxt.options.alias['#studio/directory'] = template.dst
    addTypeTemplate(
      {
        filename: 'types/studio-directory.d.ts',
        getContents: () => `
declare module '#studio/directory' {
  const directory: {
    contributors: { key: string; studioId: string }[]
    systems: { key: string; studioId: string | null }[]
  }
  export default directory
}
`,
      },
      { nuxt: true, nitro: false, node: false },
    )

    if (!nuxt.options.dev) return
    const watched = [path.resolve(root, folder), configFile]
    const isWatched = (file: string) =>
      watched.some(
        (target) =>
          path.resolve(file) === target ||
          path.resolve(file).startsWith(target + path.sep),
      )
    addVitePlugin(
      identityPlugin({
        base: nuxt.options.app.baseURL,
        watched,
        isWatched,
        me: () => {
          const { contributors } = readContributors(root, folder)
          const { key } = resolveIdentity(root, contributors)
          if (!key) return { key: null }
          const team = teamOf(readConfig(configFile), contributors)
          const { name, studioId } = contributors[key]!
          return { key, name, studioId, role: roleOf(team, contributors, key) }
        },
        changed: () =>
          updateTemplates({
            filter: ({ filename }) => filename === 'studio-directory.mjs',
          }),
      }),
      { server: false },
    )
  },
})

function sameOrigin(headers: Record<string, string | string[] | undefined>) {
  const site = headers['sec-fetch-site']
  if (site) return site === 'same-origin'
  const origin = headers.origin
  return !origin || origin === `http://${headers.host}`
}

function identityPlugin(options: {
  base: string
  watched: string[]
  isWatched: (file: string) => boolean
  me: () => { key: string | null }
  changed: () => Promise<void>
}): Plugin {
  // Resolving runs Git (and perhaps the GitHub CLI), so the answer is kept
  // until a profile or the configuration changes.
  const cached = identityCache(options.me)
  return {
    name: 'studio-identity',
    configureServer(server) {
      server.middlewares.use(`${options.base}${ME_ROUTE}`, (req, res) => {
        if (req.method !== 'GET' || !sameOrigin(req.headers)) {
          res.statusCode = 403
          res.end()
          return
        }
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        try {
          res.end(cached.read())
        } catch (error) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: (error as Error).message }))
        }
      })
      const stale = async (file: string) => {
        if (!options.isWatched(file)) return
        cached.clear()
        await options.changed()
        server.ws.send({ type: 'custom', event: 'studio:identity', data: {} })
      }
      const events = ['add', 'unlink', 'change'] as const
      for (const event of events) server.watcher.on(event, stale)
      server.watcher.add(options.watched)
      server.httpServer?.once('close', () => {
        for (const event of events) server.watcher.off(event, stale)
      })
    },
  }
}
