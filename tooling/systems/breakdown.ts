// The Lab's Breakdown: a component, or a prototype's view, read on Node into
// the tree of pieces it is built from. It starts at one file and follows the
// `.vue` files that file imports inside its system (through the system's
// aliases, `~/` at the copied app source), down to Nuxt UI pieces and icons,
// where it stops: a Nuxt UI piece's leaves are its theme slots, read from
// the `data-slot` names its own template renders. Plain HTML is skipped and
// its components lifted to the nearest component; a tag repeated by `v-for`
// is one node. Each node's ID is its path: `>` enters a file (the root is
// `root`, its own tags `root>UButton`), `/` goes into a tag's content in the
// same file, `~2` numbers a second tag of the same name under one parent and
// `#` names a theme slot. The preview's instrumentation (`fileTags`) gives
// the rendered elements the same IDs.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parse } from 'vue/compiler-sfc'
import type { InstalledSystem } from './registry.ts'

/** Where a piece comes from, as its source chip says. */
export type BreakdownSource =
  'system' | 'app' | 'nuxt-ui' | 'icons' | 'experiment'

export interface BreakdownNode {
  /** Its path in the tree, stable while the files keep their tags. */
  id: string
  /** As its tag spells it (`UButton`), its slot (`label`), its icon name. */
  name: string
  kind: 'component' | 'slot' | 'icon'
  source: BreakdownSource
  /** Repository-relative, or `@nuxt/ui/components/<Name>.vue`; null for icons. */
  file: string | null
  /** The library it is built on, such as Nuxt UI, Reka UI or Lucide. */
  library: string | null
  /** For a theme slot: its key in the piece's `ui`. */
  slot?: string
  /** Rendered once per item of a `v-for`. */
  repeated: boolean
  children: BreakdownNode[]
}

export type BreakdownResult =
  { tree: BreakdownNode; error: null } | { tree: null; error: string }

export const ROOT_NODE = 'root'

const posix = (file: string) => file.split(path.sep).join('/')
const within = (file: string, dir: string) => {
  const relative = path.relative(dir, file)
  return (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  )
}

/** `u-button` → `UButton`; PascalCase stays. */
export const pascal = (tag: string) =>
  tag.includes('-')
    ? tag
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('')
    : tag

function findPackage(name: string, from: string) {
  for (let dir = from; ; dir = path.dirname(dir)) {
    const candidate = path.join(dir, 'node_modules', name)
    if (existsSync(path.join(candidate, 'package.json'))) return candidate
    if (path.dirname(dir) === dir) return null
  }
}

/** The Nuxt UI components a system reaches, by tag, with their files. */
export interface NuxtUiCatalog {
  /** `UButton` → absolute path of its `.vue` file. */
  components: Map<string, string>
}

const catalogs = new Map<string, NuxtUiCatalog>()
export function nuxtUiCatalog(system: InstalledSystem, root: string) {
  const ui =
    findPackage('@nuxt/ui', system.dir) ?? findPackage('@nuxt/ui', root)
  const dir = ui ? path.join(ui, 'dist/runtime/components') : null
  const key = dir ?? ''
  const known = catalogs.get(key)
  if (known) return known
  const components = new Map<string, string>()
  if (dir && existsSync(dir))
    for (const name of readdirSync(dir))
      if (name.endsWith('.vue'))
        components.set(`U${name.slice(0, -4)}`, path.join(dir, name))
  const catalog = { components }
  catalogs.set(key, catalog)
  return catalog
}

const slotsRead = new Map<string, { slots: string[]; reka: boolean }>()
/** A Nuxt UI component's theme slots, in its template's order. */
function nuxtUiParts(file: string) {
  const known = slotsRead.get(file)
  if (known) return known
  const source = readFileSync(file, 'utf8')
  const template = source.slice(source.indexOf('<template>'))
  const slots = [
    ...new Set(
      [...template.matchAll(/\sdata-slot="([A-Za-z][\w-]*)"/g)].map(
        ([, slot]) => slot!,
      ),
    ),
  ]
  const parts = { slots, reka: /from\s+["']reka-ui["']/.test(source) }
  slotsRead.set(file, parts)
  return parts
}

/** The default imports of `.vue` files in a file's scripts, by local name. */
function vueImports(scripts: string[]) {
  const imports = new Map<string, string>()
  for (const script of scripts)
    for (const [, name, specifier] of script.matchAll(
      /import\s+([A-Za-z_$][\w$]*)\s*(?:,\s*\{[^}]*\})?\s+from\s+['"]([^'"]+\.vue)['"]/g,
    ))
      imports.set(name!, specifier!)
  return imports
}

/**
 * Where an import of a system's file points: the system's exact aliases
 * first, then `~/` and `@/` at its copied app source, then relative paths.
 * Packages are never followed.
 */
export function resolveSystemImport(
  specifier: string,
  from: string,
  system: InstalledSystem,
) {
  const { aliases = {}, source } = system.spec.app
  const exact = aliases[specifier]
  if (exact) return path.resolve(system.dir, exact)
  if (source && /^[~@]\//.test(specifier))
    return path.resolve(system.dir, source, specifier.slice(2))
  if (specifier.startsWith('.'))
    return path.resolve(path.dirname(from), specifier)
  return null
}

// The parts of Vue's template AST read here, by its node type numbers.
const ELEMENT = 1
const ATTRIBUTE = 6
const DIRECTIVE = 7
interface Location {
  start: { offset: number }
  end: { offset: number }
  source: string
}
interface Expression {
  content: string
  loc: Location
}
export interface TemplateAttribute {
  type: typeof ATTRIBUTE
  name: string
  value?: { content: string }
  loc: Location
}
export interface TemplateDirective {
  type: typeof DIRECTIVE
  name: string
  rawName?: string
  arg?: Expression
  exp?: Expression
  loc: Location
}
export interface TemplateElement {
  type: typeof ELEMENT
  tag: string
  props: (TemplateAttribute | TemplateDirective)[]
  children: { type: number }[]
  loc: Location
}

/** One component tag of a file, as the tree and the instrumentation see it. */
export interface FileTag {
  /** Its path inside the file: `UPopover/UButton~2`. */
  local: string
  /** The local path of the tag it sits in, or null at the file's top. */
  parent: string | null
  /** PascalCase. */
  name: string
  kind: 'nuxt-ui' | 'icon' | 'import' | 'dynamic'
  repeated: boolean
  element: TemplateElement
  /** For an import: the file it resolves to, or null when not followed. */
  target?: string | null
  /** For an icon with a written name. */
  icon?: string
}

export type FileTags =
  | { tags: FileTag[]; problem: null }
  | { tags: null; problem: string; missing?: true }

const attribute = (element: TemplateElement, name: string) =>
  element.props.find(
    (prop): prop is TemplateAttribute =>
      prop.type === ATTRIBUTE && prop.name === name,
  )
/** A directive such as `v-for`, or `v-bind` with the argument `arg`. */
export const directive = (
  element: TemplateElement,
  name: string,
  arg?: string,
) =>
  element.props.find(
    (prop): prop is TemplateDirective =>
      prop.type === DIRECTIVE &&
      prop.name === name &&
      (arg === undefined || prop.arg?.content === arg),
  )

/**
 * The component tags of one `.vue` file's template, each with its path in
 * the file. `follow` says whether an imported file is read too.
 */
export function fileTags(
  source: string,
  file: string,
  options: {
    system: InstalledSystem
    nuxtUi: NuxtUiCatalog
    follow: (target: string) => boolean
  },
): FileTags {
  const { descriptor, errors } = parse(source, { filename: file })
  const [error] = errors
  if (error) return { tags: null, problem: error.message }
  const template = descriptor.template
  if (!template?.ast)
    return { tags: null, problem: 'has no <template>.', missing: true }
  const imports = vueImports(
    [descriptor.script?.content, descriptor.scriptSetup?.content].filter(
      (content): content is string => Boolean(content),
    ),
  )
  const tags: FileTag[] = []
  const counts = new Map<string, number>()
  const classify = (element: TemplateElement): FileTag['kind'] | null => {
    const name = pascal(element.tag)
    if (element.tag === 'component' && directive(element, 'bind', 'is'))
      return 'dynamic'
    if (imports.has(name)) return 'import'
    if (name === 'UIcon') return 'icon'
    if (options.nuxtUi.components.has(name)) return 'nuxt-ui'
    return null
  }
  const walk = (
    nodes: { type: number }[],
    parent: string | null,
    repeated: boolean,
  ) => {
    for (const node of nodes) {
      if (node.type !== ELEMENT) continue
      const element = node as TemplateElement
      const looped = repeated || Boolean(directive(element, 'for'))
      const kind = classify(element)
      if (!kind) {
        walk(element.children, parent, looped)
        continue
      }
      const name = kind === 'dynamic' ? 'component' : pascal(element.tag)
      const key = `${parent ?? ''}\u0000${name}`
      const count = (counts.get(key) ?? 0) + 1
      counts.set(key, count)
      const segment = count > 1 ? `${name}~${count}` : name
      const local = parent ? `${parent}/${segment}` : segment
      const tag: FileTag = {
        local,
        parent,
        name,
        kind,
        repeated: looped,
        element,
      }
      if (kind === 'import') {
        const target = resolveSystemImport(
          imports.get(name)!,
          file,
          options.system,
        )
        tag.target =
          target && existsSync(target) && options.follow(target) ? target : null
      }
      if (kind === 'icon') {
        const icon = attribute(element, 'name')?.value?.content
        if (icon) tag.icon = icon
      }
      tags.push(tag)
      walk(element.children, local, looped)
    }
  }
  walk((template.ast as unknown as TemplateElement).children, null, false)
  return { tags, problem: null }
}

const MAX_DEPTH = 24

/**
 * The tree of `file`, whose node is named `name`. Imports are followed
 * into files inside `follow` (the system's folder by default); the root's
 * source is `source`, or where the file sits.
 */
export function readBreakdown(options: {
  file: string
  system: InstalledSystem
  root: string
  name: string
  source?: BreakdownSource
  follow?: string[]
}): BreakdownResult {
  const { system, root } = options
  const nuxtUi = nuxtUiCatalog(system, root)
  const folders = options.follow ?? [system.dir]
  const follow = (target: string) =>
    target.endsWith('.vue') && folders.some((dir) => within(target, dir))
  const appDir = system.spec.app.source
    ? path.resolve(system.dir, system.spec.app.source)
    : null
  const sourceOf = (file: string): BreakdownSource =>
    appDir && within(file, appDir)
      ? 'app'
      : within(file, system.dir)
        ? 'system'
        : 'experiment'
  const relative = (file: string) => posix(path.relative(root, file))
  const libraryOf = (pkg: string, fallback: string) =>
    system.spec.libraries.find((library) => library.package === pkg)?.label ??
    fallback
  const nuxtUiLabel = libraryOf('@nuxt/ui', 'Nuxt UI')

  const read = (file: string): FileTags => {
    let source: string
    try {
      source = readFileSync(file, 'utf8')
    } catch (error) {
      return { tags: null, problem: (error as Error).message }
    }
    return fileTags(source, file, { system, nuxtUi, follow })
  }

  const slotNodes = (parent: BreakdownNode, file: string): BreakdownNode[] =>
    nuxtUiParts(file).slots.map((slot) => ({
      id: `${parent.id}#${slot}`,
      name: slot,
      kind: 'slot',
      source: 'nuxt-ui',
      file: parent.file,
      library: parent.library,
      slot,
      repeated: parent.repeated,
      children: [],
    }))

  // A file's own tags under `owner`, the node the file renders.
  const expand = (
    owner: BreakdownNode,
    tags: FileTag[],
    file: string,
    chain: string[],
  ) => {
    const byLocal = new Map<string, BreakdownNode>()
    for (const tag of tags) {
      const parent = tag.parent ? byLocal.get(tag.parent)! : owner
      const node = tagNode(tag, `${owner.id}>${tag.local}`, file, chain)
      byLocal.set(tag.local, node)
      parent.children.push(node)
    }
    // A Nuxt UI piece's slots come first, then what is written inside it.
    for (const node of byLocal.values())
      if (node.kind === 'component' && node.source === 'nuxt-ui') {
        const ui = nuxtUi.components.get(node.name)!
        node.children.unshift(...slotNodes(node, ui))
      }
  }

  const tagNode = (
    tag: FileTag,
    id: string,
    file: string,
    chain: string[],
  ): BreakdownNode => {
    if (tag.kind === 'icon') {
      const set = tag.icon && /^i-([a-z\d]+)-/.exec(tag.icon)?.[1]
      return {
        id: id,
        name: tag.icon ?? tag.name,
        kind: 'icon',
        source: set ? 'icons' : 'nuxt-ui',
        file: null,
        library: set ? libraryOf(`@iconify-json/${set}`, set) : nuxtUiLabel,
        repeated: tag.repeated,
        children: [],
      }
    }
    if (tag.kind === 'nuxt-ui') {
      const ui = nuxtUi.components.get(tag.name)!
      return {
        id: id,
        name: tag.name,
        kind: 'component',
        source: 'nuxt-ui',
        file: `@nuxt/ui/components/${path.basename(ui)}`,
        library: nuxtUiParts(ui).reka ? 'Reka UI' : nuxtUiLabel,
        repeated: tag.repeated,
        children: [],
      }
    }
    const target = tag.kind === 'import' ? tag.target : null
    const node: BreakdownNode = {
      id: id,
      name: tag.name,
      kind: 'component',
      source: target ? sourceOf(target) : sourceOf(file),
      file: target ? relative(target) : null,
      library: null,
      repeated: tag.repeated,
      children: [],
    }
    if (target && !chain.includes(target) && chain.length < MAX_DEPTH) {
      const inside = read(target)
      if (inside.tags) expand(node, inside.tags, target, [...chain, target])
    }
    return node
  }

  const rootFile = path.resolve(options.file)
  const own = read(rootFile)
  if (!own.tags)
    return {
      tree: null,
      error: `${relative(rootFile)}${own.missing ? ' ' : ': '}${own.problem}`,
    }
  const tree: BreakdownNode = {
    id: ROOT_NODE,
    name: options.name,
    kind: 'component',
    source: options.source ?? sourceOf(rootFile),
    file: relative(rootFile),
    library: null,
    repeated: false,
    children: [],
  }
  expand(tree, own.tags, rootFile, [rootFile])
  return { tree, error: null }
}
