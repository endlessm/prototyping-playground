// Wires the restart trigger (`./trigger.ts`) into the dev server: a new
// identity each time Nuxt restarts, named in a tag on every page, the light
// check, and the dev server's watcher, socket and restart.
import path from 'node:path'
import { addVitePlugin, defineNuxtModule } from 'nuxt/kit'
import type { Nuxt } from 'nuxt/schema'
import { systemsFolder } from '../systems/registry.ts'
import { OPERATION_MARKER } from '../systems/lifecycle.ts'
import { IDENTITY_TAG, LIGHT_CHECK } from './names.ts'
import { restartTrigger } from './trigger.ts'

const identities = new WeakMap<Nuxt, string>()

/**
 * The identity of the dev server this Nuxt instance runs, new each time Nuxt
 * restarts. Settings names it in its answers too.
 */
export function serverIdentity(nuxt: Nuxt) {
  let instance = identities.get(nuxt)
  if (!instance) {
    instance = crypto.randomUUID()
    identities.set(nuxt, instance)
  }
  return instance
}

export default defineNuxtModule({
  meta: { name: 'studio-restart' },
  setup(_options, nuxt) {
    if (!nuxt.options.dev) return
    const root = nuxt.options.rootDir
    const instance = serverIdentity(nuxt)
    nuxt.options.app.head.meta ??= []
    nuxt.options.app.head.meta.push({ name: IDENTITY_TAG, content: instance })
    addVitePlugin(
      {
        name: 'studio-restart',
        configureServer(server) {
          const trigger = restartTrigger({
            instance,
            configFile: path.resolve(
              root,
              process.env.STUDIO_CONFIG || 'studio.config.json',
            ),
            systemsFolder: path.resolve(root, systemsFolder()),
            marker: path.join(root, OPERATION_MARKER),
            watcher: server.watcher,
            clock: {
              setTimeout: (run, ms) => setTimeout(run, ms),
              clearTimeout: (timer) =>
                clearTimeout(timer as ReturnType<typeof setTimeout>),
            },
            announce: (event, data) =>
              server.ws.send({ type: 'custom', event, data }),
            restart: () => void nuxt.callHook('restart', { hard: true }),
          })
          server.middlewares.use(
            `${nuxt.options.app.baseURL}${LIGHT_CHECK}`,
            trigger.lightCheck,
          )
          server.httpServer?.once('close', trigger.close)
        },
      },
      { server: false },
    )
  },
})
