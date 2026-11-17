// What a system component's Breakdown and its new experiments start from,
// so both hold the same pieces under the same node IDs and Save as
// experiment writes every change the Breakdown made: for a component whose
// file wraps one Nuxt UI tag, its Default example (or first) on a centred
// stage, with the example file's script; for a component file that only
// renders one copied app component, that app component's own template and
// script inside the wrapper's markup, so each of its pieces' tags is in the
// file; for any other composite, or a component without examples, the
// component's own source. Relative imports are rewritten to reach the same
// files from where the source goes. Runs on Node.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { ElementTypes, NodeTypes } from '@vue/compiler-core'
import {
  babelParse,
  parse,
  type SFCBlock,
  type SFCDescriptor,
  type SFCScriptBlock,
} from 'vue/compiler-sfc'
import { splitExamples } from './example-snippets.ts'
import {
  resolveSystemImport,
  vueImports,
  type TemplateElement,
} from './breakdown.ts'
import type { InstalledSystem } from './registry.ts'

export interface StartSourceInput {
  /** The component file: its absolute path and text. */
  component: { file: string; source: string }
  /** Its examples file, or null without one. */
  examples: { file: string; source: string } | null
  /** Where the source goes, absolute. */
  target: string
  /** The component's system, whose copied app a wrapper may render. */
  system?: InstalledSystem
  /** Told each further file the source is made from (an app component). */
  read?: (file: string) => void
}

// Inline in the runtime, as Tailwind classes here: the system's Tailwind
// scans prototypes.
const STAGE = 'flex min-h-40 flex-wrap items-center justify-center gap-3 p-6'
const EXAMPLES_MODULE = '#studio/examples'
const HEADER = /^\uFEFF?(?:\s|<!--[\s\S]*?-->)*/

interface TemplateNode {
  type: number
  tag?: string
  tagType?: number
  children?: TemplateNode[]
}

/** Every component tag of a template, in order. */
function componentTags(descriptor: SFCDescriptor) {
  const root = descriptor.template?.ast as TemplateNode | undefined
  const tags: TemplateNode[] = []
  const visit = (node: TemplateNode) => {
    if (
      node.type === NodeTypes.ELEMENT &&
      node.tagType === ElementTypes.COMPONENT
    )
      tags.push(node)
    for (const child of node.children ?? []) visit(child)
  }
  if (root) visit(root)
  return tags
}

/** Whether a component file's template holds one component, a Nuxt UI one. */
export function wrapsOneNuxtUiTag(source: string) {
  const { descriptor, errors } = parse(source)
  if (errors.length || !descriptor.template?.ast) return false
  const tags = componentTags(descriptor)
  return tags.length === 1 && /^U[A-Z]/.test(tags[0]!.tag!)
}

/** A relative import of `from`, as the file at `to` reaches the same file. */
function moved(specifier: string, from: string, to: string) {
  if (!specifier.startsWith('./') && !specifier.startsWith('../'))
    return specifier
  const target = path.resolve(path.dirname(from), specifier)
  const relative = path
    .relative(path.dirname(to), target)
    .split(path.sep)
    .join('/')
  return relative.startsWith('.') ? relative : `./${relative}`
}

const IMPORT = /(\bfrom\s*|\bimport\s*\(?\s*)(['"])([^'"\r\n]+)\2/g

function rewriteImports(script: string, from: string, to: string) {
  return script.replace(
    IMPORT,
    (_, lead: string, quote: string, specifier: string) =>
      `${lead}${quote}${moved(specifier, from, to)}${quote}`,
  )
}

/** The component's own source, without its leading comments. */
function ownSource(
  { file, source }: { file: string; source: string },
  target: string,
) {
  const { descriptor } = parse(source)
  const blocks = [descriptor.script, descriptor.scriptSetup]
    .filter((block): block is SFCScriptBlock => block !== null)
    .sort((a, b) => b.loc.start.offset - a.loc.start.offset)
  let text = source
  for (const block of blocks) {
    const { start, end } = block.loc
    text =
      text.slice(0, start.offset) +
      rewriteImports(text.slice(start.offset, end.offset), file, target) +
      text.slice(end.offset)
  }
  return text.slice(HEADER.exec(text)?.[0].length ?? 0)
}

/** The examples file's setup script, without `Example`, or null when empty. */
function exampleScript(
  { file, source }: { file: string; source: string },
  target: string,
) {
  const block = parse(source).descriptor.scriptSetup
  if (!block) return null
  const content = rewriteImports(block.content, file, target)
    .split(/\r?\n/)
    .filter(
      (line) =>
        !new RegExp(`^\\s*import\\b.*['"]${EXAMPLES_MODULE}['"]`).test(line),
    )
    .join('\n')
    .trim()
  if (!content) return null
  const lang =
    typeof block.attrs.lang === 'string' ? ` lang="${block.attrs.lang}"` : ''
  return `<script setup${lang}>\n${content}\n</script>\n`
}

/**
 * The copied app component a component file does nothing but render: its
 * template's one component tag, with no attributes and nothing inside,
 * imported from a file in the system's copied app. Null for anything else.
 */
function wrappedAppComponent(
  file: string,
  descriptor: SFCDescriptor,
  system: InstalledSystem,
) {
  const appSource = system.spec.app.source
  if (!appSource) return null
  const [tag, ...others] = componentTags(descriptor)
  if (!tag || others.length) return null
  const element = tag as unknown as TemplateElement
  if (element.props.length || element.children.length) return null
  const specifier = vueImports(
    [descriptor.script?.content, descriptor.scriptSetup?.content].filter(
      (content): content is string => Boolean(content),
    ),
  ).get(element.tag)
  if (!specifier) return null
  const target = resolveSystemImport(specifier, file, system)
  if (!target || !existsSync(target)) return null
  const relative = path.relative(path.resolve(system.dir, appSource), target)
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null
  return { element, file: target }
}

// The parts of Babel's tree read here.
interface Statement {
  type: string
  start: number
  end: number
  source?: { value: string }
  specifiers?: { local: { name: string } }[]
  declarations?: { id: { type: string; name?: string } }[]
  id?: { name: string } | null
}

const MACROS =
  /\b(?:defineProps|withDefaults|defineEmits|defineModel|defineSlots|defineExpose|defineOptions)\s*[<(]/

function statementsOf(content: string): Statement[] | null {
  try {
    return babelParse(content, {
      sourceType: 'module',
      plugins: ['typescript'],
    }).program.body as unknown as Statement[]
  } catch {
    return null
  }
}

/** The names a top-level statement declares, imports aside. */
function declared(statement: Statement) {
  if (statement.declarations)
    return statement.declarations.flatMap(({ id }) =>
      id.type === 'Identifier' && id.name ? [id.name] : ['\0pattern'],
    )
  return statement.id?.name ? [statement.id.name] : []
}

const mentions = (text: string, name: string) =>
  new RegExp(`(?<![\\w$.])${name.replace(/\$/g, '\\$')}(?![\\w$])`).test(text)

/**
 * What the wrapper's setup does besides rendering its app component, put
 * in front of that component's own setup: its statements that don't read
 * its props or emits, with the imports they and the template use. None of
 * it when a name would clash with the app component's.
 */
function wrapperSetup(
  wrapper: { file: string; block: SFCScriptBlock | null },
  app: { content: string; lang: unknown },
  options: { drop: string; template: string; target: string },
) {
  const { block } = wrapper
  if (!block || block.attrs.lang !== app.lang) return ''
  const statements = statementsOf(block.content)
  const appStatements = statementsOf(app.content)
  if (!statements || !appStatements) return ''
  const appNames = new Map<string, string | null>()
  for (const statement of appStatements)
    if (statement.type === 'ImportDeclaration')
      for (const { local } of statement.specifiers ?? [])
        appNames.set(local.name, statement.source!.value)
    else for (const name of declared(statement)) appNames.set(name, null)

  const text = (statement: Statement) =>
    block.content.slice(statement.start, statement.end)
  const imports = statements.filter(({ type }) => type === 'ImportDeclaration')
  let kept = statements.filter(({ type }) => type !== 'ImportDeclaration')
  // What reads the props, the emits or the app component goes, and so does
  // anything reading what that declared.
  const gone = new Set<string>([options.drop])
  for (let changed = true; changed;) {
    changed = false
    kept = kept.filter((statement) => {
      const body = text(statement)
      if (!MACROS.test(body) && ![...gone].some((name) => mentions(body, name)))
        return true
      for (const name of declared(statement)) gone.add(name)
      changed = true
      return false
    })
  }
  if (
    kept.some((statement) =>
      declared(statement).some((name) => appNames.has(name)),
    )
  )
    return ''

  const code = kept.map(text).join('\n')
  const used = `${code}\n${options.template}`
  const lines: string[] = []
  for (const statement of imports) {
    const from = statement.source!.value
    const wanted = (statement.specifiers ?? []).filter(
      ({ local }) => !gone.has(local.name) && mentions(used, local.name),
    )
    // A name the app component imports from the same place is there already.
    const fresh = wanted.filter(
      ({ local }) => appNames.get(local.name) !== from,
    )
    if (fresh.some(({ local }) => appNames.has(local.name))) return ''
    if (fresh.length)
      lines.push(rewriteImports(text(statement), wrapper.file, options.target))
  }
  return [...lines, code].filter(Boolean).join('\n')
}

/** A block as its file writes it, tags included. */
function blockText(source: string, block: SFCBlock) {
  const start = source.lastIndexOf(`<${block.type}`, block.loc.start.offset)
  const close = `</${block.type}>`
  const end = source.indexOf(close, block.loc.end.offset) + close.length
  return source.slice(start, end)
}

/** Lines dedented, the first one in place and the others at `indent`. */
function reindent(content: string, indent: string) {
  const lines = content.replace(/^\s*\n|\s+$/g, '').split(/\r?\n/)
  const least = Math.min(
    ...lines
      .filter((line) => line.trim())
      .map((line) => /^\s*/.exec(line)![0].length),
  )
  return lines
    .map((line, index) =>
      line.trim() ? `${index ? indent : ''}${line.slice(least)}` : '',
    )
    .join('\n')
}

/**
 * A wrapper of one copied app component, with that component's template
 * and script in its place, so its pieces are in the file.
 */
function inlinedApp(
  component: { file: string; source: string },
  wrapped: { element: TemplateElement; file: string },
  target: string,
) {
  const appText = readFileSync(wrapped.file, 'utf8')
  const { descriptor: app, errors } = parse(appText)
  const { descriptor: own } = parse(component.source)
  if (errors.length || !app.template || !own.template) return null
  const { element } = wrapped
  const source = component.source
  const lineStart = source.lastIndexOf('\n', element.loc.start.offset) + 1
  const indent = /^\s*/.exec(
    source.slice(lineStart, element.loc.start.offset),
  )![0]
  const template = [
    source.slice(own.template.loc.start.offset, element.loc.start.offset),
    reindent(app.template.content, indent),
    source.slice(element.loc.end.offset, own.template.loc.end.offset),
  ].join('')

  const blocks: string[] = []
  if (app.script)
    blocks.push(
      rewriteImports(blockText(appText, app.script), wrapped.file, target),
    )
  const setup = app.scriptSetup
  if (setup) {
    const before = wrapperSetup(
      { file: component.file, block: own.scriptSetup },
      { content: setup.content, lang: setup.attrs.lang },
      { drop: element.tag, template, target },
    )
    const content = rewriteImports(setup.content, wrapped.file, target).trim()
    const lang =
      typeof setup.attrs.lang === 'string' ? ` lang="${setup.attrs.lang}"` : ''
    blocks.push(
      `<script setup${lang}>\n${before ? `${before}\n\n` : ''}${content}\n</script>`,
    )
  }
  blocks.push(`<template>${template}</template>`)
  for (const style of own.styles) blocks.push(blockText(source, style))
  for (const style of app.styles) blocks.push(blockText(appText, style))
  return `${blocks.join('\n\n')}\n`
}

/** What a component's Breakdown and its new experiments start from. */
export function startSource({
  component,
  examples,
  target,
  system,
  read,
}: StartSourceInput) {
  const snippets =
    examples && wrapsOneNuxtUiTag(component.source)
      ? splitExamples(examples.source)
      : null
  if (!examples || !snippets?.size) {
    const { descriptor, errors } = parse(component.source)
    const wrapped =
      system && !errors.length && descriptor.template?.ast
        ? wrappedAppComponent(component.file, descriptor, system)
        : null
    if (wrapped) read?.(wrapped.file)
    return (
      (wrapped && inlinedApp(component, wrapped, target)) ??
      ownSource(component, target)
    )
  }
  const example = snippets.get('Default') ?? [...snippets.values()][0]!
  const content = example
    .split('\n')
    .map((line) => (line.trim() ? `    ${line}` : ''))
    .join('\n')
  const template = `<template>\n  <div class="${STAGE}">\n${content}\n  </div>\n</template>\n`
  const script = exampleScript(examples, target)
  return script ? `${script}\n${template}` : template
}

const START = '.lab-start.vue'

/**
 * The name a component's start source goes by in its system's preview
 * document: beside the component file, so its relative imports reach the
 * same files (`button.vue` → `button.lab-start.vue`). No file has it.
 */
export const startFile = (component: string) =>
  `${component.slice(0, -'.vue'.length)}${START}`

/** The component file behind a start source's name, or null for any other. */
export const startComponent = (file: string) =>
  file.endsWith(START) ? `${file.slice(0, -START.length)}.vue` : null

/** A component file's examples file beside it, named as the catalog finds it. */
function examplesBeside(component: string) {
  const dir = path.dirname(component)
  const wanted =
    `${path.basename(component, '.vue')}.examples.vue`.toLowerCase()
  const name = readdirSync(dir).find((each) => each.toLowerCase() === wanted)
  return name ? path.join(dir, name) : null
}

/**
 * A component's start source, read from its files, as its preview serves
 * it, with the files it was made from.
 */
export function componentStart(component: string, system: InstalledSystem) {
  const examples = examplesBeside(component)
  const files = [component, ...(examples ? [examples] : [])]
  const source = startSource({
    component: { file: component, source: readFileSync(component, 'utf8') },
    examples: examples
      ? { file: examples, source: readFileSync(examples, 'utf8') }
      : null,
    target: startFile(component),
    system,
    read: (file) => files.push(file),
  })
  return { source, files }
}
