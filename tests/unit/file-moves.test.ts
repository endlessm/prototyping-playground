// Arranging a prototype's files in its tree: the order saved in its
// meta.json, moving files and folders, and the references in other files
// that a rename or move repairs. A temp studio where Ben owns a prototype.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { references as canvasReferences } from '../../src/modules/canvas/references'
import { references as documentReferences } from '../../src/modules/document/references'
import { identity as document } from '../../src/modules/document/types/document/identity'
import { references as viewReferences } from '../../src/modules/prototypes/references'
import { identity as view } from '../../src/modules/prototypes/types/view/identity'
import { FileServiceError } from '../../tooling/files/source'
import { createFileTree, type TreeOptions } from '../../tooling/files/tree'

const ADA_DEMO = 'dem0000000000001'
const BEN_DEMO = 'dem0000000000002'
const VIEW = (id: string, body = '<template><p>Hi</p></template>\n') =>
  `<!-- @studio-id ${id} -->\n${body}`
const DEMO = 'src/prototypes/ben/demo'

let root: string
let actor: string | null
beforeEach(() => {
  root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'moves-')))
  fs.cpSync('tests/fixtures/contributors', path.join(root, 'contributors'), {
    recursive: true,
  })
  fs.writeFileSync(
    path.join(root, 'studio.config.json'),
    JSON.stringify({ name: 'Test', admins: ['ada0000000000001'] }),
  )
  meta('ada', ADA_DEMO, 'ada0000000000001')
  meta('ben', BEN_DEMO, 'ben0000000000002')
  write(`${DEMO}/Home.vue`, VIEW('vw00000000000001'))
  write(`${DEMO}/About.vue`, VIEW('vw00000000000002'))
  write(`${DEMO}/flows/Start.vue`, VIEW('vw00000000000003'))
  write(`${DEMO}/notes/Brief.md`, '<!-- @studio-id dc00000000000001 -->\n')
  actor = 'ben'
})
afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

const at = (file: string) => path.join(root, file)
function write(file: string, text: string) {
  fs.mkdirSync(path.dirname(at(file)), { recursive: true })
  fs.writeFileSync(at(file), text)
}
const read = (file: string) => fs.readFileSync(at(file), 'utf8')
const exists = (file: string) => fs.existsSync(at(file))
function meta(owner: string, id: string, ownerId: string, extra = {}) {
  write(
    `src/prototypes/${owner}/demo/meta.json`,
    `${JSON.stringify({ title: 'Demo', studioId: id, ownerContributorId: ownerId, systemId: null, ...extra }, null, 2)}\n`,
  )
}
const savedOrder = () => JSON.parse(read(`${DEMO}/meta.json`)).order
const tree = (options: Partial<TreeOptions> = {}) =>
  createFileTree({
    root,
    fileTypes: [
      { id: 'view', extensions: ['.vue'], identity: view },
      { id: 'document', extensions: ['.md'], identity: document },
    ],
    identify: () => ({ key: actor, email: `${actor}@endless.example` }),
    trash: async (file) => fs.rmSync(file, { recursive: true }),
    launch: async () => {},
    platform: 'win32',
    editors: [],
    references: [...viewReferences, ...documentReferences, ...canvasReferences],
    ...options,
  })
const paths = async () => {
  const flat = (nodes: { path: string; children?: unknown[] }[]): string[] =>
    nodes.flatMap((node) => [
      node.path,
      ...flat((node.children ?? []) as typeof nodes),
    ])
  return flat((await tree().list({ prototype: BEN_DEMO })).nodes)
}

async function refusal(promise: Promise<unknown>) {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught,
  )
  expect(error).toBeInstanceOf(FileServiceError)
  return error as FileServiceError
}

describe('order', () => {
  test('[PR-59] without a saved order, files come before folders, each alphabetical', async () => {
    expect(await paths()).toEqual([
      'About.vue',
      'Home.vue',
      'meta.json',
      'flows',
      'flows/Start.vue',
      'notes',
      'notes/Brief.md',
    ])
  })

  test('[PR-59] [SH-85] the order saved in meta.json comes first; anything not listed follows in the usual order', async () => {
    meta('ben', BEN_DEMO, 'ben0000000000002', {
      order: ['notes', 'Home.vue', 'notes/Brief.md'],
    })
    expect(await paths()).toEqual([
      'notes',
      'notes/Brief.md',
      'Home.vue',
      'About.vue',
      'meta.json',
      'flows',
      'flows/Start.vue',
    ])
  })
})

describe('arranging', () => {
  test('[PR-57] [PR-58] [SH-85] reordering puts a file before another in its folder, or last, and saves the order in meta.json', async () => {
    expect(
      await tree().reorder({
        prototype: BEN_DEMO,
        path: 'Home.vue',
        before: 'About.vue',
      }),
    ).toMatchObject({ path: 'Home.vue', relinked: 0 })
    expect(savedOrder()).toEqual([
      'Home.vue',
      'About.vue',
      'meta.json',
      'flows',
      'notes',
    ])
    await tree().reorder({ prototype: BEN_DEMO, path: 'flows', before: '' })
    expect(savedOrder()).toEqual([
      'Home.vue',
      'About.vue',
      'meta.json',
      'notes',
      'flows',
    ])
    // The rest of meta.json stays as it was.
    expect(JSON.parse(read(`${DEMO}/meta.json`))).toMatchObject({
      title: 'Demo',
      studioId: BEN_DEMO,
      systemId: null,
    })
  })

  test('[PR-57] moving puts a file or folder into another folder, or the top level, after the arranged ones there', async () => {
    expect(
      await tree().move({ prototype: BEN_DEMO, path: 'Home.vue', to: 'flows' }),
    ).toMatchObject({ path: 'flows/Home.vue' })
    expect(exists(`${DEMO}/flows/Home.vue`)).toBe(true)
    expect(exists(`${DEMO}/Home.vue`)).toBe(false)
    expect(
      await tree().move({ prototype: BEN_DEMO, path: 'notes', to: 'flows' }),
    ).toMatchObject({ path: 'flows/notes' })
    expect(exists(`${DEMO}/flows/notes/Brief.md`)).toBe(true)
    await tree().move({ prototype: BEN_DEMO, path: 'flows/Start.vue', to: '' })
    expect(exists(`${DEMO}/Start.vue`)).toBe(true)
  })

  test('[PR-57] a reorder may move into another folder first, at a place there', async () => {
    expect(
      await tree().reorder({
        prototype: BEN_DEMO,
        path: 'Home.vue',
        to: 'flows',
        before: 'flows/Start.vue',
      }),
    ).toMatchObject({ path: 'flows/Home.vue', moved: true })
    expect(await paths()).toContain('flows/Home.vue')
    expect(savedOrder()).toEqual(['flows/Home.vue', 'flows/Start.vue'])
  })

  test('[PR-57] [SH-83] a folder can’t move into itself, meta.json can’t move, and a name taken there is refused', async () => {
    write(`${DEMO}/flows/inner/Deep.vue`, VIEW('vw00000000000009'))
    expect(
      (
        await refusal(
          tree().move({
            prototype: BEN_DEMO,
            path: 'flows',
            to: 'flows/inner',
          }),
        )
      ).message,
    ).toBe('A folder can’t move inside itself.')
    expect(
      (
        await refusal(
          tree().move({ prototype: BEN_DEMO, path: 'flows', to: 'flows' }),
        )
      ).message,
    ).toBe('A folder can’t move inside itself.')
    expect(
      (
        await refusal(
          tree().move({ prototype: BEN_DEMO, path: 'meta.json', to: 'flows' }),
        )
      ).code,
    ).toBe('fixed')
    expect(
      (
        await refusal(
          tree().reorder({
            prototype: BEN_DEMO,
            path: 'meta.json',
            before: '',
          }),
        )
      ).code,
    ).toBe('fixed')
    write(`${DEMO}/flows/Home.vue`, VIEW('vw00000000000008'))
    const taken = await refusal(
      tree().move({ prototype: BEN_DEMO, path: 'Home.vue', to: 'flows' }),
    )
    expect(taken.status).toBe(409)
    expect(taken.message).toBe(
      'Something named “Home.vue” already exists there.',
    )
    expect(read(`${DEMO}/flows/Home.vue`)).toContain('vw00000000000008')
  })

  test('[PR-57] only someone who may change the prototype can arrange it', async () => {
    actor = 'ben'
    const refused = await refusal(
      tree().reorder({ prototype: ADA_DEMO, path: 'x.vue', before: '' }),
    )
    expect(refused.status).toBe(403)
    expect(
      (
        await refusal(
          tree().move({ prototype: ADA_DEMO, path: 'x.vue', to: '' }),
        )
      ).status,
    ).toBe(403)
  })

  test('[SH-85] renames, moves and deletes keep the saved order in step', async () => {
    meta('ben', BEN_DEMO, 'ben0000000000002', {
      order: ['notes', 'notes/Brief.md', 'Home.vue', 'About.vue'],
    })
    await tree().rename({ prototype: BEN_DEMO, path: 'notes', name: 'docs' })
    expect(savedOrder()).toEqual([
      'docs',
      'docs/Brief.md',
      'Home.vue',
      'About.vue',
    ])
    await tree().move({ prototype: BEN_DEMO, path: 'Home.vue', to: 'flows' })
    expect(savedOrder()).toEqual(['docs', 'docs/Brief.md', 'About.vue'])
    await tree().remove({ prototype: BEN_DEMO, path: 'docs' })
    expect(savedOrder()).toEqual(['About.vue'])
  })
})

describe('repairing references', () => {
  const HOME = `<!-- @studio-id vw00000000000001 -->
<script lang="ts">
export const states = [{ title: 'Empty', props: {} }]
</script>
<script setup lang="ts">
import Card from './_parts/Card.vue'
import { rows } from './_parts/data'
import { PrototypeLink, usePrototypeNavigate } from '#studio/prototype'
const navigate = usePrototypeNavigate()
const next = () => navigate('flows/Start')
const about = () => navigate('About')
const label = 'About'
const site = 'https://example.com/flows/Start'
</script>

<template>
  <Card :rows="rows" />
  <PrototypeLink to="flows/Start.vue">Start</PrototypeLink>
  <PrototypeLink :to="'flows/Start#top'">Top</PrototypeLink>
  <UButton @click="navigate('flows/Start?step=2')">Go</UButton>
  <img src="./_assets/logo.png" alt="" />
</template>

<style>
@import './_parts/theme.css';
.hero { background: url('./_assets/logo.png'); }
</style>
`
  beforeEach(() => {
    write(`${DEMO}/Home.vue`, HOME)
    write(`${DEMO}/_parts/Card.vue`, `<template><div /></template>\n`)
    write(`${DEMO}/_parts/data.ts`, `export const rows = []\n`)
    write(`${DEMO}/_parts/theme.css`, `@import './base.css';\n`)
    write(`${DEMO}/_parts/base.css`, `body { margin: 0 }\n`)
    write(`${DEMO}/_assets/logo.png`, 'png')
  })

  test('[PR-67] [SH-88] moving a view updates the views that navigate to it, in script and template, and says how many files changed', async () => {
    expect(
      await tree().move({
        prototype: BEN_DEMO,
        path: 'flows/Start.vue',
        to: '',
      }),
    ).toMatchObject({ path: 'Start.vue', relinked: 1 })
    const home = read(`${DEMO}/Home.vue`)
    expect(home).toContain(`navigate('Start')`)
    expect(home).toContain(`<PrototypeLink to="Start.vue">`)
    expect(home).toContain(`:to="'Start#top'"`)
    expect(home).toContain(`@click="navigate('Start?step=2')"`)
    // Words that only look like a path, and other sites, stay.
    expect(home).toContain(`const label = 'About'`)
    expect(home).toContain(`'https://example.com/flows/Start'`)
  })

  test('[PR-67] a single-segment path counts only where it names something to open', async () => {
    await tree().rename({
      prototype: BEN_DEMO,
      path: 'About.vue',
      name: 'Team',
    })
    const home = read(`${DEMO}/Home.vue`)
    expect(home).toContain(`navigate('Team')`)
    expect(home).toContain(`const label = 'About'`)
  })

  test('[PR-67] a moved view’s own imports, links and style URLs are rebased; its navigation paths, inside the prototype, stay', async () => {
    fs.mkdirSync(at(`${DEMO}/sub`))
    expect(
      await tree().move({ prototype: BEN_DEMO, path: 'Home.vue', to: 'sub' }),
    ).toMatchObject({ path: 'sub/Home.vue', relinked: 1 })
    const home = read(`${DEMO}/sub/Home.vue`)
    expect(home).toContain(`import Card from '../_parts/Card.vue'`)
    expect(home).toContain(`import { rows } from '../_parts/data'`)
    expect(home).toContain(`from '#studio/prototype'`)
    expect(home).toContain(`<img src="../_assets/logo.png"`)
    expect(home).toContain(`@import '../_parts/theme.css';`)
    expect(home).toContain(`url('../_assets/logo.png')`)
    expect(home).toContain(`navigate('flows/Start')`)
    expect(home).toContain(`<PrototypeLink to="flows/Start.vue">`)
  })

  test('[PR-67] renaming a helper or a folder updates imports, CSS imports and URLs that reach it', async () => {
    await tree().rename({ prototype: BEN_DEMO, path: '_parts', name: '_bits' })
    let home = read(`${DEMO}/Home.vue`)
    expect(home).toContain(`import Card from './_bits/Card.vue'`)
    expect(home).toContain(`import { rows } from './_bits/data'`)
    expect(home).toContain(`@import './_bits/theme.css';`)
    expect(
      await tree().rename({
        prototype: BEN_DEMO,
        path: '_bits/base.css',
        name: 'reset.css',
      }),
    ).toMatchObject({ path: '_bits/reset.css', relinked: 1 })
    expect(read(`${DEMO}/_bits/theme.css`)).toBe(`@import './reset.css';\n`)
    await tree().rename({
      prototype: BEN_DEMO,
      path: 'flows',
      name: 'journeys',
    })
    home = read(`${DEMO}/Home.vue`)
    expect(home).toContain(`navigate('journeys/Start')`)
    expect(home).toContain(`<PrototypeLink to="journeys/Start.vue">`)
  })

  test('[PR-67] documents’ Markdown links and embeds follow, outside code; permanent addresses and other sites stay', async () => {
    const brief = [
      '<!-- @studio-id dc00000000000001 -->',
      '# Brief',
      '',
      'See [the start](../flows/Start.vue) and [again](../flows/Start#steps).',
      '',
      '![Start](<../flows/Start.vue>)',
      '',
      '[Home](../Home) and [by address](/prototypes/dem0000000000002/artifacts/vw00000000000003).',
      '',
      '[ref]: ../flows/Start.vue',
      '',
      '```md',
      '[not a link](../flows/Start.vue)',
      '```',
      '',
      '[elsewhere](https://example.com/flows/Start.vue)',
      '',
    ].join('\n')
    write(`${DEMO}/notes/Brief.md`, brief)
    await tree().rename({
      prototype: BEN_DEMO,
      path: 'flows/Start.vue',
      name: 'Sign in',
    })
    expect(read(`${DEMO}/notes/Brief.md`)).toBe(
      brief
        .replace(
          '[the start](../flows/Start.vue)',
          '[the start](../flows/Sign%20in.vue)',
        )
        .replace('(../flows/Start#steps)', '(../flows/Sign%20in#steps)')
        .replace('(<../flows/Start.vue>)', '(<../flows/Sign in.vue>)')
        .replace('[ref]: ../flows/Start.vue', '[ref]: ../flows/Sign%20in.vue'),
    )
    // A moved document's own links are rebased.
    await tree().move({ prototype: BEN_DEMO, path: 'notes/Brief.md', to: '' })
    const moved = read(`${DEMO}/Brief.md`)
    expect(moved).toContain('[the start](flows/Sign%20in.vue)')
    expect(moved).toContain('[Home](Home)')
    expect(moved).toContain('[not a link](../flows/Start.vue)')
  })

  test('[PR-67] canvas elements’ links to files follow, as a new version of the element; permanent addresses stay', async () => {
    const canvas = {
      type: 'excalidraw',
      version: 2,
      studioVersion: 1,
      studioId: 'cv00000000000001',
      elements: [
        {
          id: 'a',
          link: 'flows/Start.vue',
          type: 'rectangle',
          version: 3,
          versionNonce: 7,
        },
        {
          id: 'b',
          link: '/prototypes/dem0000000000002/artifacts/vw00000000000003',
          type: 'rectangle',
          version: 1,
          versionNonce: 1,
        },
      ],
      appState: { viewBackgroundColor: '#ffffff' },
      files: {},
    }
    write(`${DEMO}/Board.excalidraw`, `${JSON.stringify(canvas, null, 2)}\n`)
    await tree().move({
      prototype: BEN_DEMO,
      path: 'flows/Start.vue',
      to: 'notes',
    })
    const after = JSON.parse(read(`${DEMO}/Board.excalidraw`))
    expect(after.elements[0]).toMatchObject({
      link: 'notes/Start.vue',
      version: 4,
    })
    expect(after.elements[0].versionNonce).not.toBe(7)
    expect(after.elements[0]).not.toHaveProperty('updated')
    expect(after.elements[1]).toEqual(canvas.elements[1])
  })

  test('[PR-67] when a reference can’t be repaired, the move is undone and no file changes', async () => {
    const broken = tree({
      references: [
        ...viewReferences,
        {
          extensions: ['.md'],
          move: () => {
            throw new Error('Broken grammar.')
          },
        },
      ],
    })
    write(`${DEMO}/notes/Brief.md`, '[x](../flows/Start.vue)\n')
    const before = read(`${DEMO}/Home.vue`)
    const error = await refusal(
      broken.move({ prototype: BEN_DEMO, path: 'flows/Start.vue', to: '' }),
    )
    expect(error.message).toContain('Broken grammar.')
    expect(exists(`${DEMO}/flows/Start.vue`)).toBe(true)
    expect(exists(`${DEMO}/Start.vue`)).toBe(false)
    expect(read(`${DEMO}/Home.vue`)).toBe(before)
  })

  test('[PR-67] references in other prototypes are left alone', async () => {
    write(
      'src/prototypes/ada/demo/Other.vue',
      `<template><PrototypeLink to="flows/Start" /></template>\n`,
    )
    await tree().move({ prototype: BEN_DEMO, path: 'flows/Start.vue', to: '' })
    expect(read('src/prototypes/ada/demo/Other.vue')).toContain(
      'to="flows/Start"',
    )
  })
})
