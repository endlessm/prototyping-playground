// Preview documents in development: each system's document has its own Vite
// server, started on its first request and stopped with whoever started it
// (the studio's dev server, or `yarn studio thumbnails` for one run). When
// content changes, each running document reloads its views module if its
// views did, and hears of the change, so a view that failed can try again.
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createServer as createNetServer } from 'node:net'
import path from 'node:path'
import { createServer, type Plugin, type ViteDevServer } from 'vite'
import { registerWatcher } from '../files/watchers.ts'
import type { BuiltManifest } from '../manifest/build.ts'
import { systemPreviews } from '../systems/catalog.ts'
import { fileCompileProblem } from '../systems/compile.ts'
import {
  NO_SYSTEM,
  PREVIEW_ROUTE,
  previewConfig,
  type PreviewDocument,
  type PreviewOptions,
  type PreviewView,
  VIEWS_RESOLVED,
  viewsSignature,
} from './pipeline.ts'

/** A file whose content changed, with when (milliseconds since 1970). */
export interface ChangedFile {
  file: string
  at: number
}

/**
 * What one document renders: each view of its prototypes, then each of its
 * named states; then the system's own examples, components' playgrounds
 * and Overview content. The build leaves out the playground of a component
 * file that doesn't compile, so one broken file can't stop the site; its
 * Playground says why.
 */
export function documentViews(
  document: PreviewDocument,
  { manifest, artifacts }: BuiltManifest,
  root: string,
  dev: boolean,
): PreviewView[] {
  const own = document.system
    ? systemPreviews(document.system)
        .filter(
          ({ file, playground }) =>
            dev || !playground || !fileCompileProblem(file),
        )
        .map(({ id, file, example, playground }) => ({
          id,
          file,
          prototype: '',
          path: '',
          ...(example === undefined ? {} : { example }),
          ...(playground ? { playground } : {}),
        }))
    : []
  const views = manifest.prototypes
    .filter(({ systemId }) => (systemId ?? NO_SYSTEM) === document.key)
    .flatMap(({ id: prototype }) =>
      (artifacts[prototype] ?? [])
        .filter(({ type }) => type === 'view')
        .flatMap((view) => {
          const shared = {
            file: path.resolve(root, view.file),
            prototype,
            path: view.path,
            lofi: view.lofi === true,
          }
          return [
            { id: view.id, ...shared },
            ...(view.states ?? []).map((state) => ({
              id: state.id,
              ...shared,
              state: state.title,
            })),
          ]
        }),
    )
  return [...views, ...own]
}

export function freePort() {
  return new Promise<number>((resolve, reject) => {
    const server = createNetServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as { port: number }
      server.close(() => resolve(port))
    })
  })
}

export function previewDocumentServers(
  documents: PreviewDocument[],
  options: (document: PreviewDocument) => PreviewOptions,
  base: string,
) {
  const servers = new Map<string, Promise<ViteDevServer>>()
  // What each running document's views module was built from.
  const signatures = new Map<string, string>()
  const prefix = `${base}${PREVIEW_ROUTE}`
  async function close() {
    for (const pending of servers.values()) await (await pending).close()
    servers.clear()
  }
  const serverOf = (document: PreviewDocument) => {
    let server = servers.get(document.key)
    if (!server) {
      signatures.set(document.key, viewsSignature(options(document).views()))
      server = freePort()
        .then((hmrPort) =>
          previewConfig(document, { ...options(document), hmrPort }, 'serve'),
        )
        .then(createServer)
        .then((started) => {
          // So a whole prototype's folder can be renamed or trashed.
          registerWatcher(started.watcher)
          return started
        })
      servers.set(document.key, server)
    }
    return server
  }
  /** Answers a request under `<base>_preview/`, or calls `next`. */
  async function handle(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) {
    const url = new URL(req.url ?? '/', 'http://localhost')
    if (!url.pathname.startsWith(prefix)) return next()
    const [key, ...rest] = url.pathname.slice(prefix.length).split('/')
    const document = documents.find((entry) => entry.key === key)
    if (!document) return next()
    if (!rest.length) {
      res.writeHead(301, { location: `${prefix}${key}/${url.search}` }).end()
      return
    }
    const server = await serverOf(document)
    const page = rest.join('/')
    if (page === '' || page === 'index.html') {
      // Vite's addresses are relative to the document's base.
      const html = await server.transformIndexHtml(
        `/${url.search}`,
        await readFile(path.join(server.config.root, 'index.html'), 'utf8'),
      )
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      res.end(html)
      return
    }
    server.middlewares(req, res, next)
  }
  async function changed(files: ChangedFile[]) {
    for (const document of documents) {
      const pending = servers.get(document.key)
      if (!pending) continue
      const server = await pending
      const signature = viewsSignature(options(document).views())
      if (signature !== signatures.get(document.key)) {
        signatures.set(document.key, signature)
        const views = server.moduleGraph.getModuleById(VIEWS_RESOLVED)
        if (views) await server.reloadModule(views)
      }
      // A document's own watcher can lose a file that was removed and
      // written again, and then keep serving its old compiled copy. The
      // studio's watcher passes each change on, so the document's server
      // drops that copy and sends the hot update itself.
      for (const { file } of files)
        server.watcher.emit(existsSync(file) ? 'change' : 'unlink', file)
      server.ws.send({ type: 'custom', event: 'studio:file', data: { files } })
    }
  }
  const plugin: Plugin = {
    name: 'studio-preview-documents',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith(prefix)) return next()
        handle(req, res, next).catch((error: Error) => {
          res.statusCode = 500
          res.end(error.message)
        })
      })
    },
  }
  return { plugin, changed, handle, close }
}
