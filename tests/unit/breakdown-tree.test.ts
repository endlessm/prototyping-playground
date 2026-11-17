// The Breakdown's tree: a component read on Node from its sources, from its
// system's component file through the copied app components it imports
// (with the system's aliases) down to Nuxt UI pieces, whose theme slots are
// its leaves, and icons. Plain HTML is skipped, a tag repeated by `v-for`
// is one node, and each node's ID is its path in the tree. Checked on the
// real Endless Studios components and on odd input.
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeAll, describe, expect, test } from 'vitest'
import {
  readBreakdown,
  type BreakdownNode,
} from '../../tooling/systems/breakdown'
import {
  loadSystems,
  type InstalledSystem,
} from '../../tooling/systems/registry'

const ROOT = path.resolve(import.meta.dirname, '../..')
let endless: InstalledSystem

beforeAll(async () => {
  const config = JSON.parse(
    readFileSync(path.join(ROOT, 'studio.config.json'), 'utf8'),
  )
  const { systems } = await loadSystems(ROOT, config)
  endless = systems.find(({ key }) => key === 'endless-studios')!
})

const component = (slug: string) =>
  path.join(endless.dir, 'components', slug, `${slug}.vue`)

/** Each node as `id name [source]`, indented by depth. */
function outline(node: BreakdownNode, depth = 0): string[] {
  return [
    `${'  '.repeat(depth)}${node.id} ${node.name} [${node.source}]${node.repeated ? ' ×' : ''}`,
    ...node.children.flatMap((child) => outline(child, depth + 1)),
  ]
}
const find = (node: BreakdownNode, id: string): BreakdownNode | undefined =>
  node.id === id
    ? node
    : node.children.map((child) => find(child, id)).find(Boolean)
const all = (node: BreakdownNode): BreakdownNode[] => [
  node,
  ...node.children.flatMap(all),
]

function treeOf(file: string, name: string, system = endless) {
  const result = readBreakdown({ file, system, root: ROOT, name })
  if (!result.tree) throw new Error(result.error)
  return result.tree
}

describe('the Endless Studios components', () => {
  test('the button is the system’s file, UButton, then its theme slots', () => {
    const tree = treeOf(component('button'), 'Button')
    expect(outline(tree)).toEqual([
      'root Button [system]',
      '  root>UButton UButton [nuxt-ui]',
      '    root>UButton#base base [nuxt-ui]',
      '    root>UButton#leadingIcon leadingIcon [nuxt-ui]',
      '    root>UButton#leadingAvatar leadingAvatar [nuxt-ui]',
      '    root>UButton#label label [nuxt-ui]',
      '    root>UButton#trailingIcon trailingIcon [nuxt-ui]',
    ])
    expect(tree).toMatchObject({
      kind: 'component',
      file: 'src/systems/endless-studios/components/button/button.vue',
    })
    expect(tree.children[0]).toMatchObject({
      kind: 'component',
      file: '@nuxt/ui/components/Button.vue',
      library: 'Nuxt UI',
    })
    expect(tree.children[0]!.children[1]).toMatchObject({
      kind: 'slot',
      slot: 'leadingIcon',
    })
  })

  test('the sidebar goes through its copied app file to the Nuxt UI pieces and icons in it', () => {
    const tree = treeOf(component('studio-sidebar'), 'Studio sidebar')
    const sidebar = find(tree, 'root>StudioSidebar')!
    expect(sidebar).toMatchObject({
      name: 'StudioSidebar',
      source: 'app',
      file: 'src/systems/endless-studios/studios/components/App/StudioSidebar.vue',
    })
    const ids = all(tree).map(({ id }) => id)
    expect(ids).toContain('root>StudioSidebar>USidebar')
    expect(ids).toContain('root>StudioSidebar>USidebar/UNavigationMenu')
    expect(ids).toContain('root>StudioSidebar>USidebar/UPopover/UButton')
    // Two buttons under the same piece: the second is numbered.
    expect(ids).toContain('root>StudioSidebar>USidebar/UButton')
    expect(ids).toContain('root>StudioSidebar>USidebar/UButton~2')
    // Its theme slots are leaves of the Nuxt UI piece.
    expect(ids).toContain('root>StudioSidebar>USidebar#body')
    const bell = find(
      tree,
      'root>StudioSidebar>USidebar/UPopover/UButton/UIcon',
    )
    expect(bell).toMatchObject({
      kind: 'icon',
      name: 'i-lucide-bell',
      source: 'icons',
      library: 'Lucide',
      children: [],
    })
    // The notifications the popover shows, through the app's own file.
    expect(
      find(tree, 'root>StudioSidebar>USidebar/UPopover/Notifications'),
    ).toMatchObject({ source: 'app' })
    // Never raw HTML: every node is a component, a slot or an icon.
    for (const node of all(tree))
      expect(node.name).not.toMatch(/^(div|span|img|a|nav|template)$/)
  })

  test('a tooltip around its trigger shows the trigger as its child', () => {
    const tree = treeOf(component('tooltip'), 'Tooltip')
    expect(tree.children.map(({ id }) => id)).toEqual(['root>UTooltip'])
    expect(tree.children[0]!.library).toBe('Reka UI')
  })

  test('every component with a component file has a tree', () => {
    const slugs = endless.spec.libraries
      .flatMap(({ components }) => components ?? [])
      .filter((slug) => slug !== 'button')
    for (const slug of ['button', ...slugs]) {
      const file = component(slug)
      const result = readBreakdown({
        file,
        system: endless,
        root: ROOT,
        name: slug,
      })
      expect(result.error, slug).toBeNull()
      expect(result.tree!.children.length, slug).toBeGreaterThan(0)
    }
  })
})

describe('odd input', () => {
  let dir: string
  let system: InstalledSystem
  function write(file: string, text: string) {
    const at = path.join(dir, file)
    mkdirSync(path.dirname(at), { recursive: true })
    writeFileSync(at, text)
    return at
  }
  function harbor() {
    dir = mkdtempSync(path.join(os.tmpdir(), 'studio-breakdown-'))
    system = {
      key: 'harbor',
      id: 'hrbr000000000001',
      dir,
      folder: 'harbor',
      spec: {
        label: 'Harbor',
        libraries: [],
        app: {
          factory: { from: 'app.ts', name: 'createApp' },
          source: 'app',
          aliases: { '~/components/Old.vue': 'runtime/New.vue' },
        },
      },
    } as unknown as InstalledSystem
  }
  afterEach(() => rmSync(dir, { recursive: true, force: true }))
  const read = (file: string) =>
    readBreakdown({ file, system, root: ROOT, name: 'Thing' })

  test('a tag in v-for is one node, marked as repeated', () => {
    harbor()
    const file = write(
      'components/list/list.vue',
      `<template><ul><li v-for="item in items" :key="item"><UBadge :label="item" /></li></ul></template>`,
    )
    const tree = read(file).tree!
    expect(tree.children.map(({ id, repeated }) => [id, repeated])).toEqual([
      ['root>UBadge', true],
    ])
  })

  test('plain HTML is skipped and its components are lifted to the nearest component', () => {
    harbor()
    const file = write(
      'components/panel/panel.vue',
      `<template><UCard><div class="row"><section><UButton label="A" /></section></div><p>text</p></UCard></template>`,
    )
    const tree = read(file).tree!
    expect(tree.children.map(({ id }) => id)).toEqual(['root>UCard'])
    const card = tree.children[0]!
    expect(card.children.filter(({ kind }) => kind !== 'slot')).toEqual([
      expect.objectContaining({ id: 'root>UCard/UButton' }),
    ])
  })

  test('a dynamic component is a node of its own, with nothing read inside it', () => {
    harbor()
    const file = write(
      'components/switcher/switcher.vue',
      `<script setup lang="ts">const shown = 'div'</script><template><component :is="shown"><UBadge /></component></template>`,
    )
    const tree = read(file).tree!
    expect(outline(tree).slice(0, 3)).toEqual([
      'root Thing [system]',
      '  root>component component [system]',
      '    root>component/UBadge UBadge [nuxt-ui]',
    ])
  })

  test('imports are followed through the system’s aliases, into the copied app', () => {
    harbor()
    write(
      'app/components/Shell.vue',
      `<template><UContainer><slot /></UContainer></template>`,
    )
    write('runtime/New.vue', `<template><UBadge /></template>`)
    const file = write(
      'components/page/page.vue',
      `<script setup lang="ts">
import Shell from '~/components/Shell.vue'
import Old from '~/components/Old.vue'
</script>
<template><Shell><UButton /></Shell><Old /></template>`,
    )
    const tree = read(file).tree!
    expect(outline(tree).filter((line) => !line.includes('#'))).toEqual([
      'root Thing [system]',
      '  root>Shell Shell [app]',
      '    root>Shell>UContainer UContainer [nuxt-ui]',
      '    root>Shell/UButton UButton [nuxt-ui]',
      '  root>Old Old [system]',
      '    root>Old>UBadge UBadge [nuxt-ui]',
    ])
    expect(find(tree, 'root>Shell')!.file).toBe(
      path
        .relative(ROOT, path.join(dir, 'app/components/Shell.vue'))
        .split(path.sep)
        .join('/'),
    )
  })

  test('a file that imports itself stops instead of looping', () => {
    harbor()
    const file = write(
      'components/tree/Tree.vue',
      `<script setup lang="ts">import Tree from './Tree.vue'</script><template><UCard><Tree /></UCard></template>`,
    )
    const tree = read(file).tree!
    expect(find(tree, 'root>UCard/Tree')!.children).toEqual([])
  })

  test('a file without a template, or one that does not parse, says why', () => {
    harbor()
    const empty = write(
      'components/a/a.vue',
      `<script setup lang="ts">
const a = 1
</script>
`,
    )
    expect(read(empty)).toEqual({
      tree: null,
      error: expect.stringContaining('has no <template>'),
    })
    const broken = write('components/b/b.vue', `<template><div></template>`)
    expect(read(broken).tree).toBeNull()
    expect(read(broken).error).toMatch(/b\.vue/)
    expect(read(path.join(dir, 'missing.vue')).tree).toBeNull()
  })

  test('an unknown tag that is neither imported nor Nuxt UI is skipped', () => {
    harbor()
    const file = write(
      'components/c/c.vue',
      `<template><Transition><NuxtLink to="/"><UIcon :name="icon" /></NuxtLink></Transition></template>`,
    )
    const tree = read(file).tree!
    expect(outline(tree)).toEqual([
      'root Thing [system]',
      '  root>UIcon UIcon [nuxt-ui]',
    ])
    expect(tree.children[0]!.kind).toBe('icon')
  })
})
