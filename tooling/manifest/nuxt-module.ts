// Builds the studio's content into the app: the manifest of prototypes,
// artifacts and systems, the enabled file types' pages, and each system's
// preview document. In development the manifest is read fresh on request and
// pushed to open pages when content changes, and preview documents are served
// by their own Vite pipelines, which hear of new, renamed and emptied views;
// the build emits the manifest as files and builds the preview documents
// beside the app.
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createServer as createNetServer } from 'node:net'
import path from 'node:path'
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
import { readContributors } from '../contributors/profiles.ts'
import { identityFileTypes } from '../identity/file-types.ts'
import { createRefreshQueue } from '../live/refresh-queue.ts'
import { sameOrigin } from '../modules/nuxt-module.ts'
import { loadRegistry } from '../modules/registry.ts'
import {
  NO_SYSTEM,
  PREVIEW_ROUTE,
  previewConfig,
  previewDocuments,
  type PreviewDocument,
  type PreviewOptions,
  VIEWS_RESOLVED,
  viewsSignature,
} from '../preview/pipeline.ts'
import { registerWatcher } from '../files/watchers.ts'
import {
  systemContentProblems,
  systemDocsReport,
  systemPreviews,
} from '../systems/catalog.ts'
import { loadSystems, systemsFolder } from '../systems/registry.ts'
import { moduleChecks } from '../checks/module-checks.ts'
import { serveSystemAssets } from '../systems/serve-assets.ts'
import {
  buildManifest,
  forDeploy,
  PROTOTYPES_FOLDER,
  type BuiltManifest,
  type FileTypeReader,
} from './build.ts'

const MANIFEST_MODULE = 'virtual:studio-manifest'
const MANIFEST_ROUTE = '_studio/manifest/'

/** A file whose content changed, with when (milliseconds since 1970). */
interface ChangedFile {
  file: string
  at: number
}

export default defineNuxtModule({
  meta: { name: 'studio-manifest' },
  async setup(_options, nuxt) {
    const root = nuxt.options.rootDir
    const base = nuxt.options.app.baseURL
    // The browser scenarios point the studio at fixture content.
    const prototypesFolder = process.env.STUDIO_PROTOTYPES || PROTOTYPES_FOLDER
    const contributorsFolder = process.env.STUDIO_CONTRIBUTORS || 'contributors'
    const registry = await loadRegistry(root, {
      modulesFolder: process.env.STUDIO_MODULES || undefined,
      configFile: process.env.STUDIO_CONFIG || undefined,
    })
    const { systems, problems: systemProblems } = await loadSystems(
      root,
      registry.config,
      systemsFolder(),
    )

    const fileTypes = registry.enabled.flatMap(({ spec, dir }) =>
      (spec.fileTypes ?? []).map((type) => ({ ...type, dir })),
    )
    // A turned-off module's files stay listed, as unavailable, so they can
    // still be found and their source opened.
    const readers: FileTypeReader[] = await identityFileTypes(registry.enabled)
    for (const module of registry.modules.filter(({ state }) => state !== 'on'))
      for (const type of await identityFileTypes([module]))
        readers.push({
          ...type,
          off: {
            type: module.spec.fileTypes!.find(({ id }) => id === type.id)!
              .label,
            module: module.spec.label,
          },
        })
    // The configuration is read again, so a new default system shows.
    const defaultSystem = () => {
      try {
        const config = JSON.parse(readFileSync(registry.configFile, 'utf8'))
        return typeof config.defaultSystem === 'string'
          ? config.defaultSystem
          : null
      } catch {
        return registry.config.defaultSystem ?? null
      }
    }
    const readAll = (): BuiltManifest =>
      buildManifest({
        root,
        prototypesFolder,
        systems,
        fileTypes: readers,
        defaultSystem: defaultSystem(),
        contributors: readContributors(root, contributorsFolder).contributors,
      })
    // The deployed site leaves archived prototypes and systems out
    // entirely: they aren't listed, built or bundled.
    const read = (): BuiltManifest =>
      nuxt.options.dev ? readAll() : forDeploy(readAll(), root).built
    if (!nuxt.options.dev && !nuxt.options._prepare) {
      const { warnings, summary } = forDeploy(readAll(), root)
      for (const warning of warnings) console.warn(`Warning: ${warning}`)
      if (summary) console.log(summary)
    }
    const problems = [
      ...systemProblems,
      ...systems.flatMap((system) => systemContentProblems(system, root)),
      ...read().problems,
      ...(await moduleChecks(root, registry.enabled)),
    ]
    if (!nuxt.options.dev && !nuxt.options._prepare)
      nuxt.hook('build:before', () => {
        if (problems.length)
          throw new Error(
            `The build stopped. Fix these declarations:\n${problems.join('\n')}`,
          )
      })
    for (const problem of problems) console.warn(`Warning: ${problem}`)
    // Component documentation gaps: a warning per system, or, for a system
    // that declares `docs: 'strict'`, a build that stops.
    const building = !nuxt.options.dev && !nuxt.options._prepare
    for (const system of systems) {
      const { warning, fails } = systemDocsReport(system, root)
      if (fails && building)
        throw new Error(
          `${warning}\n${system.folder}/system.ts declares docs: 'strict', so the build stops until they are fixed.`,
        )
      if (warning) console.warn(`Warning: ${warning}`)
    }

    // Each file type's page, loaded when an artifact of it opens, and its
    // preview in documents, loaded when one appears.
    const where = (type: (typeof fileTypes)[number], file: string) =>
      JSON.stringify(path.join(type.dir, file).split(path.sep).join('/'))
    const load = (type: (typeof fileTypes)[number], file: string) =>
      `() => import(${where(type, file)})`
    // A preview's pending surface shows at once, so it is bundled with the app.
    const pending = fileTypes.flatMap((type, index) =>
      type.embedPending
        ? [`import pending${index} from ${where(type, type.embedPending)}`]
        : [],
    )
    const pages = fileTypes.map((type, index) => {
      const fields = [
        `label: ${JSON.stringify(type.label)}`,
        `fidelity: ${Boolean(type.fidelity)}`,
        `extensions: ${JSON.stringify(type.extensions)}`,
        `icon: ${JSON.stringify(type.icon ?? null)}`,
        `page: ${load(type, type.page)}`,
        ...(type.embed ? [`embed: ${load(type, type.embed)}`] : []),
        ...(type.embedIn ? [`embedIn: ${JSON.stringify(type.embedIn)}`] : []),
        ...(type.embedPending ? [`embedPending: pending${index}`] : []),
      ]
      return `${JSON.stringify(type.id)}: { ${fields.join(', ')} }`
    })
    const template = addTemplate({
      filename: 'studio-file-types.mjs',
      getContents: () =>
        `${pending.map((line) => `${line}\n`).join('')}export default {${pages.join(',\n')}}\n`,
    })
    nuxt.options.alias['#studio/file-types'] = template.dst
    addTypeTemplate(
      {
        filename: 'types/studio-manifest.d.ts',
        getContents: () => `
declare module '#studio/file-types' {
  import type { Component } from 'vue'
  type Load = () => Promise<{ default: Component }>
  const types: Record<
    string,
    {
      label: string
      /** Its artifacts can be made lo-fi and hi-fi again. */
      fidelity: boolean
      extensions: string[]
      /** An Iconify name; none shows no icon in the navigation. */
      icon: string | null
      page: Load
      /** Its preview embedded in a document or on a canvas; without one, a card. */
      embed?: Load
      /** Where its preview shows; every surface when left out. */
      embedIn?: ('document' | 'canvas')[]
      /** Shown while its preview loads, given \`startedAt\`. */
      embedPending?: Component
    }
  >
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
    const documents = previewDocuments(
      nuxt.options.dev
        ? systems
        : systems.filter(({ spec }) => spec.status !== 'archived'),
    )
    const preview = (document: PreviewDocument): PreviewOptions => ({
      root,
      workDir,
      baseURL: base,
      prototypesDir: path.resolve(root, prototypesFolder),
      // Each view, then each of its named states; then the system's own
      // examples and Overview content.
      views: () => {
        const { manifest, artifacts } = read()
        const own = document.system
          ? systemPreviews(document.system).map(({ id, file, example }) => ({
              id,
              file,
              prototype: '',
              path: '',
              ...(example === undefined ? {} : { example }),
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
      },
    })

    // The static build serves the preview documents from `_preview/`,
    // built before the app so Nitro copies them with its public files.
    // `nuxt prepare` also calls `build:before`, before it writes the
    // tsconfigs a Vite build reads, and needs no documents.
    if (!nuxt.options.dev && !nuxt.options._prepare) {
      const dist = path.join(workDir, 'dist')
      mkdirSync(dist, { recursive: true })
      nuxt.options.nitro.publicAssets ??= []
      nuxt.options.nitro.publicAssets.push({
        dir: dist,
        baseURL: `/${PREVIEW_ROUTE}`,
        maxAge: 0,
      })
      nuxt.hook('build:before', async () => {
        for (const document of documents)
          await viteBuild(
            await previewConfig(document, preview(document), 'build'),
          )
      })
    }

    const previews = previewPlugin(documents, preview, base, (close) =>
      nuxt.hook('close', close),
    )
    addVitePlugin(
      manifestPlugin(read, base, {
        root,
        watch: [
          path.resolve(root, prototypesFolder),
          // Systems' examples and Overview content reach their documents.
          path.resolve(root, systemsFolder()),
          path.resolve(root, contributorsFolder),
          registry.configFile,
        ],
        changed: previews.changed,
        textTypes: new Set(
          fileTypes.filter((type) => type.text).map((type) => type.id),
        ),
      }),
      { server: false },
    )
    addVitePlugin(previews.plugin, { server: false })
    // The files the systems' asset pages show.
    const assets = serveSystemAssets(nuxt, systems)
    if (assets) addVitePlugin(assets, { server: false })
  },
})

const hash = (text: string) =>
  createHash('sha256').update(text).digest('hex').slice(0, 10)

/** Changes whenever the manifest or any artifact list does. */
const revisionOf = (built: BuiltManifest) =>
  hash(JSON.stringify([built.manifest, built.artifacts]))

/** The manifest as the client reads it, with where each artifact list is. */
function clientManifest(
  built: BuiltManifest,
  artifactUrl: (id: string) => string,
) {
  return {
    ...built.manifest,
    revision: revisionOf(built),
    artifacts: Object.fromEntries(
      built.manifest.prototypes.map(({ id }) => [id, artifactUrl(id)]),
    ),
  }
}

// Content changes on disk in bursts (a folder move is many events); they
// become one refresh after a short pause.
const SETTLE_MS = 60
const WATCH_EVENTS = ['add', 'addDir', 'unlink', 'unlinkDir', 'change'] as const

function manifestPlugin(
  read: () => BuiltManifest,
  base: string,
  live: {
    root: string
    watch: string[]
    changed: (files: ChangedFile[]) => Promise<void>
    /** The file types whose text the deployed site ships. */
    textTypes: Set<string>
  },
): Plugin {
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
      for (const [prototype, artifacts] of Object.entries(built.artifacts)) {
        // The text of the files a page reads (documents) ships beside them.
        const list = artifacts.map((artifact) => {
          if (artifact.unavailable || !live.textTypes.has(artifact.type))
            return artifact
          const text = readFileSync(path.resolve(live.root, artifact.file))
          const name = `text/${artifact.id}.${hash(text.toString('utf8'))}.txt`
          this.emitFile({
            type: 'asset',
            fileName: `${folder}/${name}`,
            source: text,
          })
          return { ...artifact, text: `./${name}` }
        })
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

      // Pushes the manifest, with every artifact list, when it changes.
      let revision = revisionOf(read())
      const files = new Set<string>()
      // Each file's content as last seen, so a save that changes nothing
      // (or a file written again as it was) is not news.
      const contents = new Map<string, string>()
      const altered = (file: string) => {
        let content = ''
        try {
          content = hash(readFileSync(file, 'utf8'))
        } catch {
          // Removed, or a folder.
        }
        if (contents.get(file) === content) return false
        contents.set(file, content)
        return true
      }
      const refresh = createRefreshQueue(
        async () => {
          // With when each changed, so a document that loaded a file after
          // the change knows it is not news.
          const changedFiles = [...files].filter(altered).map((file) => {
            let at = Date.now()
            try {
              at = statSync(file).mtimeMs
            } catch {
              // Removed.
            }
            return { file, at }
          })
          files.clear()
          const built = read()
          const next = revisionOf(built)
          if (next !== revision) {
            revision = next
            server.ws.send({
              type: 'custom',
              event: 'studio:manifest',
              data: {
                manifest: clientManifest(built, (id) => `./${id}.json`),
                artifacts: built.artifacts,
              },
            })
          }
          await live.changed(changedFiles)
        },
        (callback) => setTimeout(callback, SETTLE_MS),
      )
      const roots = live.watch.map((file) => path.resolve(file))
      const changed = (file: string) => {
        const resolved = path.resolve(file)
        if (
          roots.some(
            (root) => resolved === root || resolved.startsWith(root + path.sep),
          )
        ) {
          files.add(resolved.split(path.sep).join('/'))
          refresh()
        }
      }
      for (const event of WATCH_EVENTS) server.watcher.on(event, changed)
      server.watcher.add(roots)
      server.httpServer?.once('close', () => {
        for (const event of WATCH_EVENTS) server.watcher.off(event, changed)
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
// its first request and stopped with the studio's. When content changes,
// each running document reloads its views module if its views did, and
// hears of the change, so a view that failed can try again.
function previewPlugin(
  documents: PreviewDocument[],
  options: (document: PreviewDocument) => PreviewOptions,
  base: string,
  onClose: (close: () => Promise<void>) => void,
) {
  const servers = new Map<string, Promise<ViteDevServer>>()
  // What each running document's views module was built from.
  const signatures = new Map<string, string>()
  const prefix = `${base}${PREVIEW_ROUTE}`
  onClose(async () => {
    for (const pending of servers.values()) await (await pending).close()
    servers.clear()
  })
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
  return { plugin, changed }
}
