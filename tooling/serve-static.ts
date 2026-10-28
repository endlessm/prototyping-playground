// Serves the built site the way a plain static host does: files under the base
// path, and the 404 copy of the app (with a 404 status) for any other address.
// `yarn preview` and the browser scenarios both use it.
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { basePathFromEnv } from './deployment.ts'

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
}

export interface StaticServerOptions {
  directory: string
  basePath: string
  port: number
  host?: string
}

export async function serveStatic({
  directory,
  basePath,
  port,
  host = '127.0.0.1',
}: StaticServerOptions) {
  const root = path.resolve(directory)

  // Resolves a request path to a file inside the site, or nothing.
  function find(pathname: string) {
    let relative: string
    try {
      relative = decodeURIComponent(pathname.slice(basePath.length))
    } catch {
      return undefined
    }
    const file = path.resolve(root, relative)
    if (file !== root && !file.startsWith(root + path.sep)) return undefined
    for (const candidate of [file, path.join(file, 'index.html')]) {
      if (existsSync(candidate) && statSync(candidate).isFile())
        return candidate
    }
    return undefined
  }

  const server = createServer((request, response) => {
    const { pathname } = new URL(request.url ?? '/', 'http://localhost')
    if (`${pathname}/` === basePath) {
      response.writeHead(301, { location: basePath }).end()
      return
    }
    const file = pathname.startsWith(basePath) ? find(pathname) : undefined
    const served = file ?? path.join(root, '404.html')
    if (!existsSync(served)) {
      response.writeHead(404, { 'content-type': TYPES['.txt'] }).end()
      return
    }
    response.writeHead(file ? 200 : 404, {
      'content-type':
        TYPES[path.extname(served).toLowerCase()] ?? 'application/octet-stream',
    })
    createReadStream(served).pipe(response)
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, host, resolve)
  })
  const address = server.address() as { port: number }
  return {
    url: `http://${host}:${address.port}${basePath}`,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections()
        server.close(() => resolve())
      }),
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({
    options: {
      dir: { type: 'string', default: '.output/public' },
      port: { type: 'string', default: '4173' },
      host: { type: 'string', default: '127.0.0.1' },
    },
  })
  if (!existsSync(path.join(values.dir, 'index.html'))) {
    console.error(
      `There is no built site in ${values.dir}. Run \`yarn build\` first.`,
    )
    process.exit(1)
  }
  const { url } = await serveStatic({
    directory: values.dir,
    basePath: basePathFromEnv(process.env),
    port: Number(values.port),
    host: values.host,
  })
  console.log(`Serving the built studio at ${url}`)
}
