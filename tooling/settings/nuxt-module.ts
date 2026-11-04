import { addVitePlugin, defineNuxtModule } from 'nuxt/kit'
import { serverIdentity } from '../restart/nuxt-module.ts'
import { settingsSnapshot, saveSettings } from './service.ts'

// Reading and saving Settings. Whether a save restarts the studio is the
// restart trigger's to decide (`../restart/`); the answers name this dev
// server, which the page waits to leave.
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
    const instance = serverIdentity(nuxt)
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
        },
      },
      { server: false },
    )
  },
})
