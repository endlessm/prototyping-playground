// The preview document: the page a view renders in, inside a same-origin
// iframe. Each system gets its own, built by a Vite pipeline of its own beside
// the studio's Nuxt build, so the document holds only that system's app: its
// factory, stylesheet, Nuxt UI configuration and stand-ins. No studio module,
// style or Nuxt composable can enter it, because none is in its module graph.
// Prototypes with no system share a document with plain Vue and browser
// defaults.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import type { InlineConfig, Plugin, PluginOption } from 'vite'
import type { InstalledSystem } from '../systems/registry.ts'

import { colorModeScript, NO_SYSTEM, PREVIEW_ROUTE } from './constants.ts'

export { NO_SYSTEM, PREVIEW_ROUTE }

const VIEWS_MODULE = 'virtual:studio-preview-views'
const RUNTIME = path.resolve(import.meta.dirname, 'runtime/mount.ts')

const posix = (file: string) => file.split(path.sep).join('/')
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export interface PreviewView {
  id: string
  /** Absolute path of the view's file. */
  file: string
}

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
        `@import '${systemFile(app.stylesheet)}';\n@source '${relative(options.prototypesDir)}';\n`,
      )
      lines.push(`import './preview.css'`)
    }
  } else {
    lines.push(
      `import { createApp } from 'vue'`,
      `const create = ({ component, props }) => createApp(component, props)`,
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
${colorModeScript(document.system ? document.system.spec.colorModes : null)}
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

function viewsPlugin(options: PreviewOptions): Plugin {
  const resolved = `\0${VIEWS_MODULE}`
  return {
    name: 'studio-preview-views',
    resolveId(id) {
      if (id === VIEWS_MODULE) return resolved
    },
    load(id) {
      if (id !== resolved) return
      const entries = options
        .views()
        .map(
          ({ id, file }) =>
            `${JSON.stringify(id)}: () => import(${JSON.stringify(posix(file))})`,
        )
      return `export default {${entries.join(',\n')}}\n`
    },
  }
}

// The system's own Vue setup: Nuxt UI in its Vue mode with the app's
// configuration, auto-imports of Vue, Nuxt UI and the stand-ins, `~/` at the
// copied app source and the stand-ins' exact aliases.
async function systemPlugins(system: InstalledSystem, root: string) {
  const { app } = system.spec
  const plugins: PluginOption[] = []
  const aliases = Object.entries(app.aliases ?? {}).map(([name, target]) => ({
    find: new RegExp(`^${escape(name)}$`),
    replacement: posix(path.resolve(system.dir, target)),
  }))
  if (app.source)
    aliases.push({
      find: /^~\//,
      replacement: `${posix(path.resolve(system.dir, app.source))}/`,
    })
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
    if (app.standIns)
      imports.push({
        from: posix(path.resolve(system.dir, app.standIns.from)),
        imports: app.standIns.imports,
      })
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

/** The Vite configuration of one preview document. */
export async function previewConfig(
  document: PreviewDocument,
  options: PreviewOptions,
  mode: 'serve' | 'build',
): Promise<InlineConfig> {
  const dir = writeEntry(document, options)
  const plugins: PluginOption[] = [
    vue({ include: [/\.vue$/] }),
    viewsPlugin(options),
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
    server: {
      middlewareMode: true,
      // Each document's Vite client connects to its own socket.
      hmr: { host: '127.0.0.1', port: options.hmrPort },
      fs: { allow: [options.root] },
    },
    build: {
      outDir: path.join(options.workDir, 'dist', document.key),
      emptyOutDir: true,
    },
  }
}
