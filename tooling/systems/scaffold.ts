// Templates for a component's page: its examples file and its
// Markdown page, from templates, written next to the component file. A flat
// component (`button.vue`) first moves into a folder of its own with the
// files that share its name and an `index.ts` that re-exports it. Files that
// exist are never touched. `yarn component-docs` and the component editor's
// Create files both use it; `plan` says what `apply` would do.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { posix, treeFiles } from '../manifest/build.ts'
import {
  discoverComponents,
  stemOf,
  type SystemComponent,
} from './components.ts'
import type { InstalledSystem } from './registry.ts'

/** "icon-button" or "IconButton" → "Icon button". */
export function titleOf(stem: string) {
  const words = stem
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim()
    .toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** "icon-button" → "IconButton": what a component is called in a template. */
export const tagOf = (stem: string) =>
  stem
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')

const PLACEHOLDER = 'undefined'

// A value for a required prop, so the first example renders: a real one
// for the simple types, and a placeholder for the rest to fill in.
function attribute({ name, type }: { name: string; type: string }) {
  if (type === 'string') return `${name}="${titleOf(name)}"`
  if (type === 'boolean') return name
  if (type === 'number') return `:${name}="1"`
  return `:${name}="${PLACEHOLDER}"`
}

/** The examples file and page of a component file inside `components/`. */
export function docTemplates(
  source: string,
  required: { name: string; type: string }[] = [],
) {
  const dir = source.slice(0, source.lastIndexOf('/') + 1)
  const stem = stemOf(source)
  const tag = tagOf(stem)
  const attributes = required.map(attribute)
  const note = attributes.some((value) => value.endsWith(`"${PLACEHOLDER}"`))
    ? `\n  Replace each ${PLACEHOLDER} with a real value.`
    : ''
  return {
    examples: {
      file: `${dir}${stem}.examples.vue`,
      content: `<!--
  Each <Example name="…"> is one example on the component's page, shown live
  with this file's code. Add one per variant, size or state worth seeing.${note}
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import ${tag} from './${stem}.vue';
</script>

<template>
  <Example name="Default">
    <${tag}${attributes.length ? ` ${attributes.join(' ')}` : ''} />
  </Example>
</template>
`,
    },
    doc: {
      file: `${dir}${stem}.md`,
      content: `---
title: ${titleOf(stem)}
description:
---

## When to use

<!-- Say when this is the right component, and when another one is. -->

<!-- Optional sections you might add: usage guidelines, accessibility, links to Figma or the app's source, implementation notes. Nothing else is required. -->
`,
    },
  }
}

export interface ScaffoldStep {
  kind: 'move' | 'create'
  /** Repository-relative. */
  file: string
  /** For a move, where from. */
  from?: string
}

export class ScaffoldError extends Error {}

function ordinaryTree(dir: string) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink())
      throw new ScaffoldError(
        'Component scaffolding needs ordinary files and folders.',
      )
    if (entry.isDirectory()) ordinaryTree(path.join(dir, entry.name))
  }
}

/**
 * The components `only` names (its page address or file name), or every
 * component with a component file. Throws when `only` names none.
 */
export function scaffoldTargets(system: InstalledSystem, only?: string) {
  const dir = path.join(system.dir, 'components')
  const all = existsSync(dir) ? discoverComponents(treeFiles(dir)) : []
  const wanted = only?.toLowerCase()
  const targets = wanted
    ? all.filter(
        (component) =>
          component.slug === wanted || component.name.toLowerCase() === wanted,
      )
    : all
  if (wanted && !targets.length)
    throw new ScaffoldError(
      `No component named "${only}" in ${system.folder}/components/. It needs a component file first (for example, ${only}/${only}.vue).`,
    )
  return targets.filter((component) => component.files.source)
}

// Where a flat component's files go: a folder named after it, unless that
// name is taken or it already has one.
function folderFor(dir: string, component: SystemComponent) {
  const source = component.files.source!
  const stem = stemOf(source)
  if (source.includes('/') || !/^[A-Za-z0-9_-]+$/.test(stem)) return null
  if (existsSync(path.join(dir, stem))) return null
  return stem
}

/**
 * What scaffolding would do: the moves of flat components into folders,
 * then the files it would create, in order.
 */
export function planScaffold(
  system: InstalledSystem,
  root: string,
  targets: SystemComponent[],
) {
  const dir = path.join(system.dir, 'components')
  if (existsSync(dir)) ordinaryTree(dir)
  const at = (file: string) => posix(path.relative(root, path.join(dir, file)))
  const steps: ScaffoldStep[] = []
  for (const component of targets) {
    const folder = folderFor(dir, component)
    const files = { ...component.files }
    if (folder) {
      for (const kind of ['source', 'examples', 'doc'] as const) {
        const file = files[kind]
        if (!file) continue
        files[kind] = `${folder}/${file}`
        steps.push({ kind: 'move', from: at(file), file: at(files[kind]!) })
      }
      steps.push({ kind: 'create', file: at(`${folder}/index.ts`) })
    }
    const templates = docTemplates(files.source!)
    if (!files.examples)
      steps.push({ kind: 'create', file: at(templates.examples.file) })
    if (!files.doc) steps.push({ kind: 'create', file: at(templates.doc.file) })
  }
  return steps
}

/**
 * Does what `planScaffold` says. `required` gives each component file's
 * required props (by repository path), for the first example.
 */
export function applyScaffold(
  root: string,
  steps: ScaffoldStep[],
  required: Record<string, { name: string; type: string }[]> = {},
) {
  const done: ScaffoldStep[] = []
  // Each component file's new place, so its templates use its props.
  const moved = new Map<string, string>()
  for (const step of steps) {
    const target = path.join(root, step.file)
    if (step.kind === 'move') {
      mkdirSync(path.dirname(target), { recursive: true })
      if (existsSync(target)) continue
      renameSync(path.join(root, step.from!), target)
      moved.set(step.file, step.from!)
      done.push(step)
      continue
    }
    if (existsSync(target)) continue
    const content = contentOf(step.file, moved, required)
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, content, { flag: 'wx' })
    done.push(step)
  }
  return done
}

function contentOf(
  file: string,
  moved: Map<string, string>,
  required: Record<string, { name: string; type: string }[]>,
) {
  const name = path.posix.basename(file)
  const dir = path.posix.dirname(file)
  if (name === 'index.ts') {
    const stem = path.posix.basename(dir)
    return `export { default } from './${stem}.vue';\n`
  }
  const stem = stemOf(name)
  const source = `${dir}/${stem}.vue`
  const props = required[source] ?? required[moved.get(source) ?? ''] ?? []
  const templates = docTemplates(`${stem}.vue`, props)
  return name.endsWith('.examples.vue')
    ? templates.examples.content
    : templates.doc.content
}
