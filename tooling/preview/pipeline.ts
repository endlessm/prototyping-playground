// The preview document: the page a view renders in, inside a same-origin
// iframe. Each system gets its own, built by a Vite pipeline of its own beside
// the studio's Nuxt build, so the document holds only that system's app: its
// factory, stylesheet, Nuxt UI configuration and stand-ins. No studio module,
// style or Nuxt composable can enter it, because none is in its module graph.
// Prototypes with no system share a document with plain Vue and browser
// defaults.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import type { InlineConfig, Plugin, PluginOption, ViteDevServer } from 'vite'
import type { InstalledSystem } from '../systems/registry.ts'
import { importGuard } from '../checks/imports.ts'
import { loadRegistry } from '../modules/registry.ts'
import { standInNames } from './stand-ins.ts'

import {
  COMPILE_ROUTE,
  LIGHT_ONLY_SCRIPT,
  NO_SYSTEM,
  PREVIEW_ROUTE,
} from './constants.ts'

export { NO_SYSTEM, PREVIEW_ROUTE }

const VIEWS_MODULE = 'virtual:studio-preview-views'
const RUNTIME = path.resolve(import.meta.dirname, 'runtime/mount.ts')
/** What views import their navigation helpers from. */
export const NAVIGATION_MODULE = '#studio/prototype'
const NAVIGATION = path.resolve(import.meta.dirname, 'runtime/navigation.ts')
/** What a system's examples files import `Example` from. */
export const EXAMPLES_MODULE = '#studio/examples'
const EXAMPLES = path.resolve(import.meta.dirname, 'runtime/example.ts')

const posix = (file: string) => file.split(path.sep).join('/')
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export interface PreviewView {
  /** The view's or the named state's permanent ID. */
  id: string
  /** Absolute path of the view's file. */
  file: string
  /** The prototype's permanent ID. */
  prototype: string
  /** Inside the prototype, without the extension: `flows/Sign in`. */
  path: string
  /** For a named state: its title, matched in the view's `states`. */
  state?: string
  /** Drawn in grayscale with a handwritten font. */
  lofi?: boolean
  /** For a component page's example: its `<Example name>`. */
  example?: string
}

// A view that holds nothing but comments (a new view, before the agent
// writes it) is empty: the studio says so instead of compiling it.
export const isEmptyView = (source: string) =>
  source.replace(/<!--[\s\S]*?-->/g, '').trim() === ''

function emptyFile(file: string) {
  try {
    return isEmptyView(readFileSync(file, 'utf8'))
  } catch {
    return false
  }
}

/**
 * What a document's views module holds: each view's file and whether it is
 * empty. When this changes in development, the module is reloaded in place.
 */
export const viewsSignature = (views: PreviewView[]) =>
  JSON.stringify(views.map((view) => [view, emptyFile(view.file)]))

export interface PreviewDocument {
  /** The system's permanent ID, or `none`. */
  key: string
  system: InstalledSystem | null
}

export interface PreviewOptions {
  /** The studio's root folder. */
  root: string
  /** Where the document's generated entry files go. */
  workDir: string
  /** The studio's base path, ending in a slash. */
  baseURL: string
  /** The prototypes folder, absolute; the system's Tailwind scans its views. */
  prototypesDir: string
  /** The development server's live-update socket. */
  hmrPort?: number
  /** The views this document renders, read when its views module loads. */
  views: () => PreviewView[]
}

export function previewDocuments(systems: InstalledSystem[]) {
  return [
    ...systems.map((system) => ({ key: system.id, system })),
    { key: NO_SYSTEM, system: null },
  ] satisfies PreviewDocument[]
}

function findPackage(name: string, from: string) {
  for (let dir = from; ; dir = path.dirname(dir)) {
    const candidate = path.join(dir, 'node_modules', name)
    if (existsSync(path.join(candidate, 'package.json'))) return candidate
    if (path.dirname(dir) === dir) return null
  }
}

async function importDefault(file: string) {
  return (await import(pathToFileURL(file).href)).default
}

// Writes the document's page, entry module and stylesheet. Paths in them are
// relative, so they work from the work folder in development and the build.
function writeEntry(document: PreviewDocument, options: PreviewOptions) {
  const dir = path.join(options.workDir, document.key)
  mkdirSync(dir, { recursive: true })
  const relative = (file: string) => {
    const link = posix(path.relative(dir, file))
    return link.startsWith('.') ? link : `./${link}`
  }
  const app = document.system?.spec.app
  const systemFile = (file: string) =>
    relative(path.join(document.system!.dir, file))
  const lines = [`import { mountPreview } from '${relative(RUNTIME)}'`]
  if (app) {
    lines.push(
      `import { ${app.factory.name} as create } from '${systemFile(app.factory.from)}'`,
    )
    if (app.stylesheet) {
      writeFileSync(
        path.join(dir, 'preview.css'),
        // The system's own files (its examples and overview), and the views.
        `@import '${systemFile(app.stylesheet)}';\n@source '${relative(document.system!.dir)}';\n@source '${relative(options.prototypesDir)}';\n`,
      )
      lines.push(`import './preview.css'`)
    }
  } else {
    lines.push(
      `import { createApp, h } from 'vue'`,
      // Props read on each render, so a state's new props apply in place.
      `const create = ({ component, props }) => createApp({ render: () => h(component, { ...props }) })`,
    )
  }
  lines.push(
    `import views from '${VIEWS_MODULE}'`,
    `void mountPreview({ create, views })`,
  )
  writeFileSync(path.join(dir, 'entry.js'), `${lines.join('\n')}\n`)
  const theme = document.system?.spec.themeClass
  // No system: browser colours and a system font.
  const body = app ? '<body>' : '<body style="font-family: system-ui">'
  writeFileSync(
    path.join(dir, 'index.html'),
    `<!doctype html>
<html lang="en"${theme ? ` class="${theme}"` : ''}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Preview</title>
    <script>
${LIGHT_ONLY_SCRIPT}
    </script>
  </head>
  ${body}
    <div id="app"></div>
    <script type="module" src="./entry.js"></script>
  </body>
</html>
`,
  )
  return dir
}

export const VIEWS_RESOLVED = `\0${VIEWS_MODULE}`

// Each view's and named state's file, title, place in its prototype, state,
// fidelity and loader (none for an empty view). In
// development the module accepts its own updates: it changes the one object
// the runtime holds and tells it, so new, renamed and emptied views reach an
// open document without a reload.
function viewsPlugin(options: PreviewOptions): Plugin {
  return {
    name: 'studio-preview-views',
    resolveId(id) {
      if (id === VIEWS_MODULE) return VIEWS_RESOLVED
    },
    load(id) {
      if (id !== VIEWS_RESOLVED) return
      const entries = options.views().map((view) => {
        const { id, file } = view
        const title = path.basename(file, path.extname(file))
        const load = emptyFile(file)
          ? 'null'
          : `() => import(${JSON.stringify(posix(file))})`
        const data = JSON.stringify({
          file: posix(file),
          title,
          prototype: view.prototype,
          path: view.path,
          state: view.state ?? null,
          lofi: Boolean(view.lofi),
          example: view.example ?? null,
        })
        return `${JSON.stringify(id)}: { ...${data}, load: ${load} }`
      })
      return `const next = {${entries.join(',\n')}}
const views = import.meta.hot?.data.views ?? next
if (import.meta.hot) {
  import.meta.hot.data.views = views
  if (views !== next) {
    for (const id of Object.keys(views)) if (!(id in next)) delete views[id]
    Object.assign(views, next)
    window.dispatchEvent(new CustomEvent('studio:views'))
  }
  import.meta.hot.accept()
}
export default views
`
    },
  }
}

// Development only: the compiler's message and location for a view that
// failed to load, which the browser reports only as a failed import.
function compilePlugin(options: PreviewOptions): Plugin {
  return {
    name: 'studio-preview-compile',
    apply: 'serve',
    configureServer(server) {
      // The whole folder, not only the views it has compiled: a folder that
      // is removed and made again keeps updating its views.
      server.watcher.add(options.prototypesDir)
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        if (!url.pathname.endsWith(`/${COMPILE_ROUTE}`)) return next()
        const view = options
          .views()
          .find(({ id }) => id === url.searchParams.get('artifact'))
        const found = view
          ? {
              view: posix(view.file),
              ...(await compileError(server, view, options.root)),
            }
          : {}
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        res.end(JSON.stringify(found))
      })
    },
  }
}

async function compileError(
  server: ViteDevServer,
  view: PreviewView,
  root: string,
) {
  try {
    await server.transformRequest(`/@fs/${posix(view.file)}`)
    return {}
  } catch (failure) {
    const error = failure as Error & {
      id?: string
      loc?: { file?: string; line: number; column: number }
      frame?: string
    }
    const file = error.loc?.file ?? error.id?.split('?')[0] ?? view.file
    return {
      message: error.message,
      file: posix(path.relative(root, file)),
      line: error.loc?.line ?? null,
      column: error.loc?.column ?? null,
      frame: error.frame ?? '',
    }
  }
}

// The system's own Vue setup: Nuxt UI in its Vue mode with the app's
// configuration, auto-imports of Vue, Nuxt UI and the stand-ins, `~/` and
// `assets/` at the copied app source (as Nuxt's own aliases) and the
// stand-ins' exact aliases.
async function systemPlugins(system: InstalledSystem, root: string) {
  const { app } = system.spec
  const plugins: PluginOption[] = []
  const aliases = Object.entries(app.aliases ?? {}).map(([name, target]) => ({
    find: new RegExp(`^${escape(name)}$`),
    replacement: posix(path.resolve(system.dir, target)),
  }))
  if (app.source) {
    const source = posix(path.resolve(system.dir, app.source))
    aliases.push(
      { find: /^~\//, replacement: `${source}/` },
      // A template's `src="~/assets/…"` compiles to an import of `assets/…`,
      // which Nuxt answers with its `assets` alias; so does this, for any file.
      { find: /^assets\//, replacement: `${source}/assets/` },
    )
  }
  plugins.push({
    name: `studio-preview-aliases:${system.key}`,
    enforce: 'pre',
    config: () => ({ resolve: { alias: aliases } }),
  })
  if (app.nuxtUi) {
    // Nuxt UI is reached from the system's own packages.
    const ui =
      findPackage('@nuxt/ui', system.dir) ?? findPackage('@nuxt/ui', root)
    if (!ui)
      throw new Error(
        `${system.folder} configures Nuxt UI, but @nuxt/ui is not installed; run yarn install.`,
      )
    const NuxtUI = await importDefault(path.join(ui, 'dist/vite.mjs'))
    const config = await importDefault(path.join(system.dir, app.nuxtUi.config))
    const imports: (string | { from: string; imports: string[] })[] = ['vue']
    if (app.standIns) {
      const from = path.resolve(system.dir, app.standIns.from)
      imports.push({ from: posix(from), imports: standInNames(from) })
    }
    plugins.push(
      NuxtUI({
        router: false,
        colorMode: false,
        dts: false,
        autoImport: {
          dts: false,
          include: [/\.vue$/, /\.vue\?vue/],
          imports,
        },
        components: { dts: false },
        theme: { colors: app.nuxtUi.colors },
        ui: config,
      }),
    )
  }
  return plugins
}

/**
 * @vitejs/plugin-vue remembers each file's last source in module state, which
 * the studio's Vite server and every preview document's share in the dev
 * process. Each server watching a `.vue` file runs the plugin's hot update on
 * a change, and whichever runs first records the new source as seen: the
 * document showing the file may then find nothing changed and send no update.
 * With this plugin, a server leaves a `.vue` change it has no module for to
 * the servers that have one.
 */
export function vueUpdatesFromOwnModules(): Plugin {
  return {
    name: 'studio-vue-own-updates',
    apply: 'serve',
    configResolved(config) {
      const vue = config.plugins.find(({ name }) => name === 'vite:vue')
      const update = vue?.handleHotUpdate
      if (!vue || typeof update !== 'function') return
      vue.handleHotUpdate = function (context) {
        if (context.modules.length || !context.file.endsWith('.vue'))
          return update.call(this, context)
      }
    },
  }
}

// Development only: a view module tells the document its newest `states` and
// `system` options after each hot update, so a state's new props reach the
// open view without a remount, and new options rebuild it.
function statesPlugin(options: PreviewOptions): Plugin {
  const folder = `${posix(options.prototypesDir)}/`
  return {
    name: 'studio-preview-states',
    apply: 'serve',
    enforce: 'post',
    transform(code, id) {
      if (!id.endsWith('.vue') || !posix(id).startsWith(folder)) return
      const file = JSON.stringify(posix(id))
      return `${code}
if (import.meta.hot) import.meta.hot.accept((next) => {
  if (next) window.dispatchEvent(new CustomEvent('studio:exports', { detail: { file: ${file}, states: next.states, system: next.system } }))
})
`
    },
  }
}

/** The Vite configuration of one preview document. */
export async function previewConfig(
  document: PreviewDocument,
  options: PreviewOptions,
  mode: 'serve' | 'build',
): Promise<InlineConfig> {
  const dir = writeEntry(document, options)
  const registry = await loadRegistry(options.root, {
    modulesFolder: process.env.STUDIO_MODULES || undefined,
    configFile: process.env.STUDIO_CONFIG || undefined,
  })
  const plugins: PluginOption[] = [
    importGuard({
      root: options.root,
      prototypesDir: options.prototypesDir,
      system: document.system,
      modules: registry.enabled
        .filter(({ spec }) => spec.library)
        .map(({ spec, dir }) => ({ id: spec.id, dir, library: spec.library! })),
    }),
    vue({ include: [/\.vue$/] }),
    vueUpdatesFromOwnModules(),
    viewsPlugin(options),
    compilePlugin(options),
    statesPlugin(options),
  ]
  if (document.system)
    plugins.push(...(await systemPlugins(document.system, options.root)))
  return {
    configFile: false,
    envDir: false,
    root: dir,
    base: `${options.baseURL}${PREVIEW_ROUTE}${document.key}/`,
    mode: mode === 'build' ? 'production' : 'development',
    appType: 'custom',
    logLevel: 'warn',
    clearScreen: false,
    cacheDir: path.join(options.workDir, '.vite', document.key),
    plugins,
    resolve: {
      alias: [
        { find: NAVIGATION_MODULE, replacement: NAVIGATION },
        { find: EXAMPLES_MODULE, replacement: EXAMPLES },
      ],
      // One Vue for the runtime, its navigation helpers and the views.
      dedupe: ['vue'],
    },
    server: {
      middlewareMode: true,
      // Each document's Vite client connects to its own socket.
      // The studio shows errors in its own words, not Vite's overlay.
      hmr: { host: '127.0.0.1', port: options.hmrPort, overlay: false },
      fs: { allow: [options.root] },
    },
    build: {
      outDir: path.join(options.workDir, 'dist', document.key),
      emptyOutDir: true,
    },
  }
}
