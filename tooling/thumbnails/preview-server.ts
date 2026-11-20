// The preview documents for one run of `yarn studio thumbnails` when no dev
// server is running: the same documents the dev server serves, from a small
// local server that stops with the run. Its own work folder keeps it apart
// from a dev server's.
import { createServer } from 'node:http'
import path from 'node:path'
import { identityFileTypes } from '../identity/file-types.ts'
import { buildManifest, PROTOTYPES_FOLDER } from '../manifest/build.ts'
import { loadRegistry } from '../modules/registry.ts'
import {
  documentViews,
  previewDocumentServers,
} from '../preview/dev-documents.ts'
import { previewDocuments, type PreviewDocument } from '../preview/pipeline.ts'
import { loadSystems, systemsFolder } from '../systems/registry.ts'

export async function startPreviewServer(root: string) {
  const registry = await loadRegistry(root)
  const { systems } = await loadSystems(root, registry.config, systemsFolder())
  const fileTypes = await identityFileTypes(registry.enabled)
  const read = () => buildManifest({ root, systems, fileTypes })
  const documents = previewDocuments(systems)
  const servers = previewDocumentServers(
    documents,
    (document: PreviewDocument) => ({
      root,
      workDir: path.join(root, '.nuxt', 'studio-thumbnails-preview'),
      baseURL: '/',
      prototypesDir: path.resolve(root, PROTOTYPES_FOLDER),
      views: () => documentViews(document, read(), root, true),
    }),
    '/',
  )
  const server = createServer((req, res) => {
    const missing = () => {
      res.statusCode = 404
      res.end()
    }
    servers.handle(req, res, missing).catch((error: Error) => {
      res.statusCode = 500
      res.end(error.message)
    })
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const { port } = server.address() as { port: number }
  return {
    url: `http://127.0.0.1:${port}/`,
    async close() {
      server.closeAllConnections()
      await new Promise((resolve) => server.close(resolve))
      await servers.close()
    },
  }
}
