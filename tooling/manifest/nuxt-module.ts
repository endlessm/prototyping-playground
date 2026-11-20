// Builds the studio's content into the app: the manifest of prototypes,
// artifacts and systems, the enabled file types' pages, and each system's
// preview document. In development the manifest is read fresh on request and
// pushed to open pages when content changes, and preview documents are served
// by their own Vite pipelines, which hear of new, renamed and emptied views;
// the build emits the manifest as files and builds the preview documents
// beside the app.
import { createHash } from 'node:crypto'
import {
  copyFileSync,
  createReadStream,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs'
import path from 'node:path'
import {
  addTemplate,
  addTypeTemplate,
  addVitePlugin,
  defineNuxtModule,
} from 'nuxt/kit'
import { build as viteBuild, type Plugin } from 'vite'
import { readContributors } from '../contributors/profiles.ts'
import { identityFileTypes } from '../identity/file-types.ts'
import { createRefreshQueue } from '../live/refresh-queue.ts'
import { sameOrigin } from '../modules/nuxt-module.ts'
import { loadRegistry } from '../modules/registry.ts'
import {
  documentViews,
  previewDocumentServers,
  type ChangedFile,
} from '../preview/dev-documents.ts'
import {
  PREVIEW_ROUTE,
  previewConfig,
  previewDocuments,
  type PreviewDocument,
  type PreviewOptions,
  vueUpdatesFromOwnModules,
} from '../preview/pipeline.ts'
import { systemContentProblems, systemDocsReport } from '../systems/catalog.ts'
import { loadSystems, systemsFolder } from '../systems/registry.ts'
import { moduleChecks } from '../checks/module-checks.ts'
import { serveSystemAssets } from '../systems/serve-assets.ts'
import { thumbnailImage } from '../thumbnails/record.ts'
import {
  buildManifest,
  forDeploy,
  PROTOTYPES_FOLDER,
  THUMBNAILS_ROUTE,
  type BuiltManifest,
  type FileTypeReader,
} from './build.ts'

const MANIFEST_MODULE = 'virtual:studio-manifest'
const MANIFEST_ROUTE = '_studio/manifest/'
// Locally, each prototype's picture is read from its own folder.
const THUMBNAILS_DEV_ROUTE = '_studio/thumbnails/'

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
        // Locally from the prototype's folder; the build copies each picture
        // beside the site. The version makes a new picture a new address.
        thumbnailUrl: (id, version) =>
          `${base}${nuxt.options.dev ? THUMBNAILS_DEV_ROUTE : THUMBNAILS_ROUTE}${id}.jpg?v=${version}`,
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
      views: () =>
        documentViews(document, read(), root, Boolean(nuxt.options.dev)),
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
      // Each published prototype's committed picture, as
      // `_thumbnails/<prototype-id>.jpg`. The manifest names only pictures
      // that exist, so a prototype without one shows its placeholder. They
      // are copied once the build has cleared its folder.
      const pictures = path.join(nuxt.options.buildDir, 'studio-thumbnails')
      nuxt.options.nitro.publicAssets.push({
        dir: pictures,
        baseURL: `/${THUMBNAILS_ROUTE}`,
        maxAge: 0,
      })
      nuxt.hook('build:before', () => {
        rmSync(pictures, { recursive: true, force: true })
        mkdirSync(pictures, { recursive: true })
        for (const { id, folder, thumbnail } of read().manifest.prototypes)
          if (thumbnail)
            copyFileSync(
              thumbnailImage(path.resolve(root, folder)),
              path.join(pictures, `${id}.jpg`),
            )
      })
    }

    // In development each preview document has its own Vite server,
    // started on its first request and stopped with the studio's.
    const previews = previewDocumentServers(documents, preview, base)
    nuxt.hook('close', previews.close)
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
    // The studio never compiles a view, so its Vite leaves their changes to
    // the documents showing them.
    addVitePlugin(vueUpdatesFromOwnModules())
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

      // Each prototype's picture, from its folder, by the prototype's ID.
      server.middlewares.use(`${base}${THUMBNAILS_DEV_ROUTE}`, (req, res) => {
        if (req.method !== 'GET' || !sameOrigin(req.headers)) {
          res.statusCode = 403
          res.end()
          return
        }
        const id = /^\/([0-9a-z]+)\.jpg$/.exec(
          (req.url ?? '').split('?')[0]!,
        )?.[1]
        const prototype = read().manifest.prototypes.find(
          (entry) => entry.id === id && entry.thumbnail,
        )
        if (!prototype) {
          res.statusCode = 404
          res.end()
          return
        }
        res.setHeader('Content-Type', 'image/jpeg')
        res.setHeader('Cache-Control', 'no-cache')
        createReadStream(
          thumbnailImage(path.resolve(live.root, prototype.folder)),
        )
          .on('error', () => {
            if (!res.headersSent) res.statusCode = 404
            res.end()
          })
          .pipe(res)
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
