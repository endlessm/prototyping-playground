// The Breakdown's instrumentation: a Vite plugin of a system's preview
// document that serves an instrumented copy of a `.vue` file under a name of
// its own (`button.vue` → `button.lab-breakdown.vue`), so the plain file the
// examples and playground use stays as it is. A system component's
// Breakdown instruments its start source (`button.lab-start.vue`, made from
// its files by `startSource`), the same a new experiment of it starts from. In the copy, each tag the tree
// reader names (`fileTags`) reports its rendered elements to the runtime's
// `$lab` under its node ID and takes its `ui` (Nuxt UI pieces) and `class`
// through `$lab`, which merges the overrides the studio sends. The `.vue`
// files the copy imports inside the followed folders are served
// instrumented too, so the IDs continue through the copied app.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { MagicString } from 'vue/compiler-sfc'
import {
  directive,
  fileTags,
  nuxtUiCatalog,
  type FileTag,
} from '../systems/breakdown.ts'
import type { InstalledSystem } from '../systems/registry.ts'
import { componentStart, startComponent } from '../systems/start-source.ts'

const SUFFIX = '.lab-breakdown.vue'
const posix = (file: string) => file.split(path.sep).join('/')
const within = (file: string, dir: string) => {
  const relative = path.relative(dir, file)
  return (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  )
}

// A dev server's `/@fs/<absolute path>` address, as a file path.
const fsPath = (source: string) =>
  source.replace(/^\/@fs(?=\/)/, '').replace(/^\/(?=[A-Za-z]:)/, '')

/** The instrumented copy's name for a `.vue` file. */
export const breakdownFile = (file: string) =>
  `${file.slice(0, -'.vue'.length)}${SUFFIX}`

/** The real file behind an instrumented copy's ID, or null for any other. */
export function instrumentedSource(id: string) {
  const [file, query] = id.split('?')
  if (query !== undefined || !file!.endsWith(SUFFIX)) return null
  return `${file!.slice(0, -SUFFIX.length)}.vue`
}

// Closes a wrapped expression on a line of its own, so a `//` comment on the
// expression's last line can't swallow what follows.
const END = '\n'

// The expression of a binding, its quotes kept so the copy stays valid.
const bound = (name: string, quote: string, expression: string) =>
  ` :${name}=${quote}${expression}${quote}`

function instrumentTag(code: MagicString, tag: FileTag) {
  const { element, local } = tag
  const id = `\`${local}\``
  const quoteOf = (source: string) => (source.endsWith("'") ? "'" : '"')
  const end = element.props.length
    ? Math.max(...element.props.map((prop) => prop.loc.end.offset))
    : element.loc.start.offset + 1 + element.tag.length
  const added: string[] = []
  // `ui` for a Nuxt UI piece: its own binding, or what a `v-bind` object
  // gives it, merged with the overrides. Last, so it wins over the object.
  if (tag.kind === 'nuxt-ui') {
    const ui = directive(element, 'bind', 'ui')
    if (ui?.exp) {
      const quote = quoteOf(ui.loc.source)
      code.overwrite(
        ui.loc.start.offset,
        ui.loc.end.offset,
        bound(
          'ui',
          quote,
          `$lab.ui($,${id},(${ui.exp.content}${END}))`,
        ).trimStart(),
      )
    } else {
      const spread = element.props.filter(
        (prop) => prop.type === 7 && prop.name === 'bind' && !prop.arg,
      )
      const object = spread.at(-1)
      added.push(
        bound(
          'ui',
          '"',
          object && 'exp' in object && object.exp
            ? `$lab.ui($,${id},(${object.exp.content}${END})?.ui)`
            : `$lab.ui($,${id})`,
        ),
      )
    }
  }
  // A Nuxt UI piece's own class wins over its root slot's `ui`, so the root
  // slot's overrides reach the class too.
  const root = tag.rootSlot ? `,\`${tag.rootSlot}\`` : ''
  const className = directive(element, 'bind', 'class')
  if (className?.exp) {
    const quote = quoteOf(className.loc.source)
    code.overwrite(
      className.loc.start.offset,
      className.loc.end.offset,
      bound(
        'class',
        quote,
        `[(${className.exp.content}${END}),$lab.cls($,${id}${root})]`,
      ).trimStart(),
    )
  } else added.push(bound('class', '"', `$lab.cls($,${id}${root})`))
  const slotted = tag.kind === 'nuxt-ui' ? ',1' : ''
  added.push(
    bound('onVnodeMounted', '"', `$lab.hook($,${id}${slotted})`),
    bound('onVnodeUpdated', '"', `$lab.hook($,${id}${slotted})`),
    bound('onVnodeBeforeUnmount', '"', `$lab.drop($,${id})`),
  )
  code.appendLeft(end, added.join(''))
}

/**
 * A `.vue` file's source with each of its tree's tags instrumented, or the
 * source unchanged when its template can't be read.
 */
export function instrument(
  source: string,
  file: string,
  options: {
    system: InstalledSystem
    root: string
    follow: (target: string) => boolean
  },
) {
  const found = fileTags(source, file, {
    system: options.system,
    nuxtUi: nuxtUiCatalog(options.system, options.root),
    follow: options.follow,
  })
  if (!found.tags) return source
  const code = new MagicString(source)
  for (const tag of found.tags) instrumentTag(code, tag)
  return code.toString()
}

/**
 * Serves instrumented copies in a system's preview document: the entry a
 * Breakdown loads, and every `.vue` file such a copy imports from inside
 * `folders` (the system's folder and the prototypes).
 */
export function breakdownPlugin(options: {
  system: InstalledSystem
  root: string
  folders: string[]
}): Plugin {
  const follow = (target: string) =>
    target.endsWith('.vue') &&
    options.folders.some((dir) => within(target, dir))
  // Each start source's instrumented copy, with the files it is made from.
  const starts = new Map<string, Set<string>>()
  return {
    name: `studio-preview-breakdown:${options.system.key}`,
    enforce: 'pre',
    async resolveId(source, importer) {
      if (instrumentedSource(source)) return posix(path.resolve(fsPath(source)))
      // The copy's script block, as the build splits it out, imports too.
      const real = importer && instrumentedSource(importer.split('?')[0]!)
      if (!real) return
      const resolved = await this.resolve(source, real, { skipSelf: true })
      if (!resolved || resolved.external) return resolved
      const target = resolved.id.split('?')[0]!
      if (resolved.id.includes('?') || !follow(path.resolve(target)))
        return resolved
      return posix(breakdownFile(path.resolve(target)))
    },
    load(id) {
      const real = instrumentedSource(id)
      if (!real) return
      const component = startComponent(real)
      let source: string
      if (component) {
        const start = componentStart(component, options.system)
        source = start.source
        const files = new Set(start.files.map((file) => path.resolve(file)))
        starts.set(posix(path.resolve(id)), files)
        for (const file of files) this.addWatchFile(file)
      } else {
        this.addWatchFile(real)
        source = readFileSync(real, 'utf8')
      }
      return instrument(source, real, {
        system: options.system,
        root: options.root,
        follow,
      })
    },
    // A copy lives under a name no file has, so a change to its real file
    // reaches it only through here: it is read again and hot-updated in
    // the documents that show it. A start source is made from several of
    // its system's files (the component, its examples, an app component),
    // so it follows any of them.
    async hotUpdate({ file }) {
      if (!file.endsWith('.vue')) return
      const graph = this.environment.moduleGraph
      const changed = path.resolve(file)
      const ids = [posix(breakdownFile(changed))]
      for (const [id, files] of starts) if (files.has(changed)) ids.push(id)
      for (const id of ids) {
        const copy = graph.getModuleById(id)
        if (copy) await this.environment.reloadModule(copy)
      }
    },
  }
}
