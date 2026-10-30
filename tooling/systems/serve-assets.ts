// Serves the systems' asset files (`asset-files.ts`): in development from
// each system's folder, only files its asset pages list, and in the build as
// copies of those files, for active systems only, which the static site
// publishes. Nothing else of a system's folder is reachable this way.
import { copyFileSync, createReadStream, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import type { Nuxt } from 'nuxt/schema'
import type { Plugin } from 'vite'
import { SYSTEM_ASSETS_ROUTE } from './asset-files.ts'
import { systemAssets } from './catalog.ts'
import type { InstalledSystem } from './registry.ts'

const TYPES: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
}

/** The asset file at a path inside the route, or null. */
function assetFile(systems: InstalledSystem[], inside: string) {
  const [id, ...rest] = inside.split('/')
  const system = systems.find((entry) => entry.id === id)
  if (!system) return null
  let file: string
  try {
    file = rest.map(decodeURIComponent).join('/')
  } catch {
    return null
  }
  // Read again on each request, so new files show.
  return systemAssets(system).some((asset) => asset.file === file)
    ? path.join(system.dir, file)
    : null
}

export function serveSystemAssets(nuxt: Nuxt, systems: InstalledSystem[]) {
  const base = nuxt.options.app.baseURL
  if (nuxt.options.dev) {
    const prefix = `${base}${SYSTEM_ASSETS_ROUTE}`
    const plugin: Plugin = {
      name: 'studio-system-assets',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url?.startsWith(prefix)) return next()
          const inside = new URL(req.url, 'http://localhost').pathname.slice(
            prefix.length,
          )
          const file = assetFile(systems, inside)
          if (!file || req.method !== 'GET') {
            res.statusCode = 404
            return res.end()
          }
          res.setHeader(
            'Content-Type',
            TYPES[path.extname(file).toLowerCase()] ??
              'application/octet-stream',
          )
          res.setHeader('Cache-Control', 'no-store')
          res.setHeader('X-Content-Type-Options', 'nosniff')
          createReadStream(file)
            .on('error', () => {
              res.statusCode = 404
              res.end()
            })
            .pipe(res)
        })
      },
    }
    return plugin
  }
  if (nuxt.options._prepare) return null
  const dist = path.join(nuxt.options.buildDir, 'studio-system-assets')
  mkdirSync(dist, { recursive: true })
  // Copied once the build has cleared its folder, before Nitro publishes.
  nuxt.hook('build:before', () => {
    rmSync(dist, { recursive: true, force: true })
    mkdirSync(dist, { recursive: true })
    for (const system of systems.filter(({ spec }) => spec.status === 'active'))
      for (const { file } of systemAssets(system)) {
        const target = path.join(dist, system.id, file)
        mkdirSync(path.dirname(target), { recursive: true })
        copyFileSync(path.join(system.dir, file), target)
      }
  })
  nuxt.options.nitro.publicAssets ??= []
  nuxt.options.nitro.publicAssets.push({
    dir: dist,
    baseURL: `/${SYSTEM_ASSETS_ROUTE}`,
    maxAge: 0,
  })
  return null
}
