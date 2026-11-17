// What a new experiment of a system component starts as, so it first renders
// like the Playground: for a component whose file wraps one Nuxt UI tag, its
// Default example (or first) on a centred stage, with the example file's
// script; for a composite, or a component without examples, the component's
// own source, so each of its pieces' tags is in the experiment's file.
// Relative imports are rewritten to reach the same files from the
// experiment's folder. Runs on Node.
import path from 'node:path'
import { parse, type SFCScriptBlock } from 'vue/compiler-sfc'
import { splitExamples } from '../../../../tooling/systems/example-snippets.ts'

export interface ExperimentSourceInput {
  /** The component file: its absolute path and text. */
  component: { file: string; source: string }
  /** Its examples file, or null without one. */
  examples: { file: string; source: string } | null
  /** Where the experiment's file goes, absolute. */
  target: string
}

// Inline in the runtime, as Tailwind classes here: the system's Tailwind
// scans prototypes.
const STAGE = 'flex min-h-40 flex-wrap items-center justify-center gap-3 p-6'
const EXAMPLES_MODULE = '#studio/examples'
const HEADER = /^\uFEFF?(?:\s|<!--[\s\S]*?-->)*/
const ELEMENT = 1
const COMPONENT = 1

interface TemplateNode {
  type: number
  tag?: string
  tagType?: number
  children?: TemplateNode[]
}

/** Whether a component file's template holds one component, a Nuxt UI one. */
export function wrapsOneNuxtUiTag(source: string) {
  const { descriptor, errors } = parse(source)
  const root = descriptor.template?.ast as TemplateNode | undefined
  if (errors.length || !root) return false
  const tags: string[] = []
  const visit = (node: TemplateNode) => {
    if (node.type === ELEMENT && node.tagType === COMPONENT)
      tags.push(node.tag!)
    for (const child of node.children ?? []) visit(child)
  }
  visit(root)
  return tags.length === 1 && /^U[A-Z]/.test(tags[0]!)
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

export function experimentSource({
  component,
  examples,
  target,
}: ExperimentSourceInput) {
  const snippets =
    examples && wrapsOneNuxtUiTag(component.source)
      ? splitExamples(examples.source)
      : null
  if (!examples || !snippets?.size) return ownSource(component, target)
  const example = snippets.get('Default') ?? [...snippets.values()][0]!
  const content = example
    .split('\n')
    .map((line) => (line.trim() ? `    ${line}` : ''))
    .join('\n')
  const template = `<template>\n  <div class="${STAGE}">\n${content}\n  </div>\n</template>\n`
  const script = exampleScript(examples, target)
  return script ? `${script}\n${template}` : template
}
