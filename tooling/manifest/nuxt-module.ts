// Builds the studio's content into the app: the manifest of prototypes,
// artifacts and systems, the enabled file types' pages, and each system's
// preview document. In development the manifest is read fresh on request and
// preview documents are served by their own Vite pipelines; the build emits
// the manifest as files and builds the preview documents beside the app.
import { createHash } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createServer as createNetServer } from 'node:net'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  addTemplate,
  addTypeTemplate,
  addVitePlugin,
  defineNuxtModule,
} from 'nuxt/kit'
import {
  build as viteBuild,
  createServer,
  type Plugin,
  type ViteDevServer,
} from 'vite'
import type { IdentityReader } from '../modules/contract.ts'
import { sameOrigin } from '../modules/nuxt-module.ts'
import { loadRegistry } from '../modules/registry.ts'
import {
  NO_SYSTEM,
  PREVIEW_ROUTE,
  previewConfig,
  previewDocuments,
  type PreviewDocument,
  type PreviewOptions,
} from '../preview/pipeline.ts'
import { loadSystems } from '../systems/registry.ts'
import {
  buildManifest,
  PROTOTYPES_FOLDER,
  type BuiltManifest,
  type FileTypeReader,
} from './build.ts'

const MANIFEST_MODULE = 'virtual:studio-manifest'
const MANIFEST_ROUTE = '_studio/manifest/'

export default defineNuxtModule({
  meta: { name: 'studio-manifest' },
  async setup(_options, nuxt) {
    const root = nuxt.options.rootDir
    const base = nuxt.options.app.baseURL
    // The browser scenarios point the studio at fixture content.
    const prototypesFolder = process.env.STUDIO_PROTOTYPES || PROTOTYPES_FOLDER
    const registry = await loadRegistry(root, {
      modulesFolder: process.env.STUDIO_MODULES || undefined,
      configFile: process.env.STUDIO_CONFIG || undefined,
    })
    const { systems, problems: systemProblems } = await loadSystems(
      root,
      registry.config,
    )

    const fileTypes = registry.enabled.flatMap(({ spec, dir }) =>
      (spec.fileTypes ?? []).map((type) => ({ ...type, dir })),
    )
    const readers: FileTypeReader[] = []
    for (const type of fileTypes) {
      const file = pathToFileURL(path.join(type.dir, type.identity))
      const { identity } = (await import(file.href)) as {
        identity: IdentityReader
      }
      readers.push({ id: type.id, extensions: type.extensions, identity })
    }
    const read = (): BuiltManifest =>
      buildManifest({
        root,
        prototypesFolder,
        systems,
        fileTypes: readers,
        defaultSystem: registry.config.defaultSystem ?? null,
      })
    const problems = [...systemProblems, ...read().problems]
    for (const problem of problems) console.warn(`Warning: ${problem}`)

    // The page of each file type, loaded when an artifact of it opens.
    const pages = fileTypes.map(
      (type) =>
        `${JSON.stringify(type.id)}: { label: ${JSON.stringify(type.label)}, page: () => import(${JSON.stringify(path.join(type.dir, type.page).split(path.sep).join('/'))}) }`,
    )
    const template = addTemplate({
      filename: 'studio-file-types.mjs',
      getContents: () => `export default {${pages.join(',\n')}}\n`,
    })
    nuxt.options.alias['#studio/file-types'] = template.dst
    addTypeTemplate(
      {
        filename: 'types/studio-manifest.d.ts',
        getContents: () => `
declare module '#studio/file-types' {
  import type { Component } from 'vue'
  const types: Record<string, { label: string; page: () => Promise<{ default: Component }> }>
  export default types
}
declare module '${MANIFEST_MODULE}' {
  /** Where the manifest is fetched from. */
  const url: string
  export default url
}
`,
      },
      { nuxt: true, nitro: false, node: false },
    )

    const workDir = path.join(nuxt.options.buildDir, 'studio-preview')
    const documents = previewDocuments(systems)
    const preview = (document: PreviewDocument): PreviewOptions => ({
      root,
      workDir,
      baseURL: base,
      prototypesDir: path.resolve(root, prototypesFolder),
      views: () => {
        const { manifest, artifacts } = read()
        return manifest.prototypes
          .filter(({ systemId }) => (systemId ?? NO_SYSTEM) === document.key)
          .flatMap(({ id }) => artifacts[id] ?? [])
          .filter(({ type }) => type === 'view')
          .map(({ id, file }) => ({ id, file: path.resolve(root, file) }))
      },
    })

    // The static build serves the preview documents from `_preview/`,
    // built before the app so Nitro copies them with its public files.
    if (!nuxt.options.dev) {
      const dist = path.join(workDir, 'dist')
      mkdirSync(dist, { recursive: true })
      nuxt.options.nitro.publicAssets ??= []
      nuxt.options.nitro.publicAssets.push({
        dir: dist,
        baseURL: `/${PREVIEW_ROUTE}`,
        maxAge: 0,
      })
      nuxt.hook('build:before', async () => {
        // `nuxt prepare` (run on install) only writes types, and a fresh
        // tree has no `.nuxt/tsconfig.app.json` for Vite to read yet.
        if (nuxt.options._prepare) return
        for (const document of documents)
          await viteBuild(
            await previewConfig(document, preview(document), 'build'),
          )
      })
    }

    addVitePlugin(manifestPlugin(read, base), { server: false })
    addVitePlugin(
      previewPlugin(documents, preview, base, (close) =>
        nuxt.hook('close', close),
      ),
      { server: false },
    )
  },
})

/** The manifest as the client reads it, with where each artifact list is. */
function clientManifest(
  built: BuiltManifest,
  artifactUrl: (id: string) => string,
) {
  return {
    ...built.manifest,
    artifacts: Object.fromEntries(
      built.manifest.prototypes.map(({ id }) => [id, artifactUrl(id)]),
    ),
  }
}

const hash = (text: string) =>
  createHash('sha256').update(text).digest('hex').slice(0, 10)

function manifestPlugin(read: () => BuiltManifest, base: string): Plugin {
  const resolved = `\0${MANIFEST_MODULE}`
  let production = false
  let folder = ''
  return {
    name: 'studio-manifest',
    configResolved(config) {
      production = config.command === 'build'
      folder = `${config.build.assetsDir}/studio-manifest`
    },
    resolveId(id) {
      if (id === MANIFEST_MODULE) return resolved
    },
    load(id) {
      if (id !== resolved) return
      if (!production)
        return `export default ${JSON.stringify(`${base}${MANIFEST_ROUTE}index.json`)}`
      // Content-addressed files, linked relative to the main manifest.
      const built = read()
      const names: Record<string, string> = {}
      for (const [prototype, list] of Object.entries(built.artifacts)) {
        const source = JSON.stringify(list)
        names[prototype] = `${prototype}.${hash(source)}.json`
        this.emitFile({
          type: 'asset',
          fileName: `${folder}/${names[prototype]}`,
          source,
        })
      }
      const source = JSON.stringify(
        clientManifest(built, (prototype) => `./${names[prototype]}`),
      )
      const reference = this.emitFile({
        type: 'asset',
        fileName: `${folder}/index.${hash(source)}.json`,
        source,
      })
      return `export default import.meta.ROLLUP_FILE_URL_${reference}`
    },
    configureServer(server) {
      server.middlewares.use(`${base}${MANIFEST_ROUTE}`, (req, res) => {
        // Development data is for the studio's own pages only.
        if (req.method !== 'GET' || !sameOrigin(req.headers)) {
          res.statusCode = 403
          res.end()
          return
        }
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        const name = (req.url ?? '').split('?')[0]!.replace(/^\/+/, '')
        const built = read()
        if (name === 'index.json') {
          res.end(JSON.stringify(clientManifest(built, (id) => `./${id}.json`)))
          return
        }
        const list = built.artifacts[name.replace(/\.json$/, '')]
        if (!list) res.statusCode = 404
        res.end(JSON.stringify(list ?? { error: 'Not found' }))
      })
    },
  }
}

function freePort() {
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

// In development each preview document has its own Vite server, started on
// its first request and stopped with the studio's.
function previewPlugin(
  documents: PreviewDocument[],
  options: (document: PreviewDocument) => PreviewOptions,
  base: string,
  onClose: (close: () => Promise<void>) => void,
): Plugin {
  const servers = new Map<string, Promise<ViteDevServer>>()
  const prefix = `${base}${PREVIEW_ROUTE}`
  onClose(async () => {
    for (const pending of servers.values()) await (await pending).close()
    servers.clear()
  })
  const serverOf = (document: PreviewDocument) => {
    let server = servers.get(document.key)
    if (!server) {
      server = freePort()
        .then((hmrPort) =>
          previewConfig(document, { ...options(document), hmrPort }, 'serve'),
        )
        .then(createServer)
      servers.set(document.key, server)
    }
    return server
  }
  async function handle(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) {
    const url = new URL(req.url ?? '/', 'http://localhost')
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
  return {
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
}
