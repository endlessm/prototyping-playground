import path from 'node:path'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { addVitePlugin, defineNuxtModule } from 'nuxt/kit'
import { systemsFolder } from '../systems/registry.ts'
import { OPERATION_MARKER } from '../systems/lifecycle.ts'
import { settingsSnapshot, saveSettings } from './service.ts'

export default defineNuxtModule({
  meta: { name: 'studio-settings' },
  setup(_options, nuxt) {
    if (!nuxt.options.dev) return
    const root = nuxt.options.rootDir
    const options = {
      configFile: process.env.STUDIO_CONFIG || 'studio.config.json',
      modulesFolder: process.env.STUDIO_MODULES || undefined,
      contributorsFolder: process.env.STUDIO_CONTRIBUTORS || undefined,
    }
    const instance = crypto.randomUUID()
    addVitePlugin(
      {
        name: 'studio-settings',
        configureServer(server) {
          server.middlewares.use(
            `${nuxt.options.app.baseURL}_studio/settings`,
            async (req, res) => {
              res.setHeader('Content-Type', 'application/json')
              res.setHeader('Cache-Control', 'no-store')
              const origin = req.headers.origin
              if (
                (req.headers['sec-fetch-site'] &&
                  req.headers['sec-fetch-site'] !== 'same-origin') ||
                (origin && origin !== `http://${req.headers.host}`) ||
                !['GET', 'POST'].includes(req.method ?? '')
              ) {
                res.statusCode = 403
                res.end('{}')
                return
              }
              try {
                const snapshot = await settingsSnapshot(root, options)
                if (req.method === 'POST') {
                  let body = ''
                  for await (const chunk of req) {
                    body += chunk
                    if (body.length > 65536)
                      throw new Error('Settings request is too large.')
                  }
                  const { changes, revision } = JSON.parse(body)
                  saveSettings(snapshot, changes, revision)
                  res.end(JSON.stringify({ saved: true, instance }))
                } else {
                  const {
                    source: _source,
                    file: _file,
                    contributors: _contributors,
                    ...publicSettings
                  } = snapshot
                  res.end(JSON.stringify({ ...publicSettings, instance }))
                }
              } catch (error) {
                const message = (error as Error).message
                res.statusCode = message.includes('changed elsewhere')
                  ? 409
                  : message.includes('Only an Admin')
                    ? 403
                    : 400
                res.end(JSON.stringify({ error: message }))
              }
            },
          )
          let timer: ReturnType<typeof setTimeout> | undefined
          const systems = path.resolve(root, systemsFolder())
          // What this server started with: a change rolled back restores it,
          // and needs no restart.
          const snapshot = () => {
            const text = (file: string) =>
              existsSync(file) ? readFileSync(file, 'utf8') : ''
            const declarations = existsSync(systems)
              ? readdirSync(systems)
                  .sort()
                  .map((key) => [
                    key,
                    text(path.join(systems, key, 'system.ts')),
                  ])
              : []
            return JSON.stringify([
              text(path.resolve(root, options.configFile)),
              declarations,
            ])
          }
          const started = snapshot()
          // A system change in progress (its marker) restarts once it is done.
          const restart = () => {
            if (existsSync(path.join(root, OPERATION_MARKER))) {
              timer = setTimeout(restart, 250)
              return
            }
            if (snapshot() === started) return
            server.ws.send({
              type: 'custom',
              event: 'studio:restarting',
              data: { instance },
            })
            setTimeout(() => void nuxt.callHook('restart', { hard: true }), 200)
          }
          const changed = (file: string) => {
            const resolved = path.resolve(file)
            if (
              resolved !== path.resolve(root, options.configFile) &&
              !(
                resolved.startsWith(systems + path.sep) &&
                path.basename(file) === 'system.ts'
              )
            )
              return
            clearTimeout(timer)
            timer = setTimeout(restart, 150)
          }
          server.watcher.add([path.resolve(root, options.configFile), systems])
          // New and removed declarations count too: a system created or
          // deleted.
          for (const event of ['change', 'add', 'unlink'])
            server.watcher.on(event, changed)
          server.httpServer?.once('close', () => {
            clearTimeout(timer)
            for (const event of ['change', 'add', 'unlink'])
              server.watcher.off(event, changed)
          })
        },
      },
      { server: false },
    )
  },
})
