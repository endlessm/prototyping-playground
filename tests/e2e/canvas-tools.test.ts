// The canvas tools in the open canvas, for an agent with a browser:
// `window.__studioCanvas` runs the same tools as `yarn canvas` on what is on
// screen, one undo step per call, saving as the person's edits do. Read-only
// canvases refuse changes. Each scenario has a canvas of its own in a
// disposable copy of the fixtures, owned by Ben, who runs the studio.
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import type { Page } from 'playwright'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { toolContext } from '../../src/modules/canvas/tools/context'
import { help, run } from '../../src/modules/canvas/tools/tools'
import type { ManifestArtifact } from '../../tooling/manifest/build'
import { useBrowser } from './setup/browser'
import { startDevServer, type RunningStudio } from './setup/studio'

const posix = (file: string) => file.split(path.sep).join('/')
mkdirSync('.e2e', { recursive: true })

const PROTOTYPE = 'cvt00000000pr0t1'
const MAIN = 'cvt00000000v1ew1'
const HOME = 'cvt00000000h0me1'
const MEMBER = 'cvt0000000st8te1'
const GUEST = 'cvt0000000st8te2'
const NOTES = 'cvt00000000d0c01'
const THEIRS = 'cvt0000000thrs01'
const canvasId = (n: number) => `cvt0000000cnvs${String(n).padStart(2, '0')}`
const at = (id: string) => `/prototypes/${PROTOTYPE}/artifacts/${id}`

const scene = (id: string, elements: unknown[] = []) =>
  `${JSON.stringify(
    {
      type: 'excalidraw',
      version: 2,
      studioVersion: 1,
      studioId: id,
      elements,
      appState: { viewBackgroundColor: '#ffffff' },
      files: {},
    },
    null,
    2,
  )}\n`
const fileOf = (n: number) => `Canvas ${n}.excalidraw`
const CANVASES = 8

const dir = mkdtempSync(path.join('.e2e', 'canvas-tools-'))
const prototypeDir = path.join(dir, 'ben', 'tools')
cpSync('tests/fixtures/prototypes', dir, { recursive: true })
mkdirSync(prototypeDir, { recursive: true })
writeFileSync(
  path.join(prototypeDir, 'meta.json'),
  JSON.stringify({
    title: 'Tools',
    studioId: PROTOTYPE,
    ownerContributorId: 'ben0000000000002',
    systemId: null,
  }),
)
writeFileSync(
  path.join(prototypeDir, 'Main.vue'),
  `<!-- @studio-id ${MAIN} -->\n<template><p>Main</p></template>\n`,
)
writeFileSync(
  path.join(prototypeDir, 'Home.vue'),
  [
    `<!-- @studio-id ${HOME} -->`,
    `<!-- @studio-state ${MEMBER} Member -->`,
    `<!-- @studio-state ${GUEST} Guest -->`,
    '<script setup lang="ts">',
    'defineProps<{ name?: string }>()',
    '</script>',
    '<script lang="ts">',
    "export const states = [{ title: 'Member', props: { name: 'Ana' } }, { title: 'Guest', props: {} }]",
    '</script>',
    "<template><p>{{ name ? 'Welcome back, ' + name : 'Welcome' }}</p></template>",
    '',
  ].join('\n'),
)
writeFileSync(
  path.join(prototypeDir, 'Notes.md'),
  `---\nstudioId: ${NOTES}\n---\n\n# Notes\n`,
)
for (let n = 1; n <= CANVASES; n++)
  writeFileSync(path.join(prototypeDir, fileOf(n)), scene(canvasId(n)))
mkdirSync(path.join(dir, 'bernardo', 'plain'), { recursive: true })
writeFileSync(
  path.join(dir, 'bernardo', 'plain', 'Theirs.excalidraw'),
  scene(THEIRS, [
    {
      id: 'one',
      type: 'rectangle',
      x: 0,
      y: 0,
      width: 200,
      height: 150,
      seed: 1,
      version: 1,
      versionNonce: 1,
      index: 'a0',
    },
  ]),
)
afterAll(() => rmSync(dir, { recursive: true, force: true }))

const BEN = {
  STUDIO_CONTRIBUTORS: 'tests/fixtures/contributors',
  STUDIO_GITHUB: '',
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'user.name',
  GIT_CONFIG_VALUE_0: 'Ben Okafor',
  GIT_CONFIG_KEY_1: 'user.email',
  GIT_CONFIG_VALUE_1: 'ben@endless.example',
}

const disk = (n: number) =>
  JSON.parse(readFileSync(path.join(prototypeDir, fileOf(n)), 'utf8')) as {
    elements: Record<string, unknown>[]
  }

// What the manifest says about the fixture prototype, for the tools run here.
const FOLDER = `${posix(dir)}/ben/tools`
const ARTIFACTS: ManifestArtifact[] = [
  {
    id: HOME,
    title: 'Home',
    path: 'Home',
    file: `${FOLDER}/Home.vue`,
    type: 'view',
    states: [
      { id: MEMBER, title: 'Member' },
      { id: GUEST, title: 'Guest' },
    ],
  },
  {
    id: MAIN,
    title: 'Main',
    path: 'Main',
    file: `${FOLDER}/Main.vue`,
    type: 'view',
  },
  {
    id: NOTES,
    title: 'Notes',
    path: 'Notes',
    file: `${FOLDER}/Notes.md`,
    type: 'document',
  },
]
const nodeContext = toolContext({
  prototype: { id: PROTOTYPE, folder: FOLDER },
  artifacts: () => ARTIFACTS,
  typeOf: (type) =>
    type === 'view'
      ? { label: 'View', preview: true }
      : { label: 'Document', preview: false },
})

const newPage = useBrowser()
const pages: Page[] = []
afterEach(async () => {
  for (const page of pages.splice(0)) await page.close().catch(() => {})
})
async function canvasPage() {
  const page = await newPage()
  pages.push(page)
  // Excalidraw's fonts come from its CDN.
  await page.route('https://esm.sh/**', (route) =>
    route.fulfill({ status: 404, body: '' }),
  )
  return page
}
const canvas = (page: Page) => page.locator('.canvas')
async function open(page: Page, studio: RunningStudio, artifact: string) {
  await page.goto(`${studio.url}prototypes/${PROTOTYPE}/artifacts/${artifact}`)
  await expect
    .poll(() => canvas(page).getAttribute('data-canvas-opening'), {
      timeout: 60_000,
    })
    .toBe('ready')
  await expect
    .poll(() => page.evaluate(() => typeof window.__studioCanvas), {
      timeout: 30_000,
    })
    .toBe('object')
}
/** Calls a tool in the page, as an agent's browser tool would. */
const tool = <T = Record<string, unknown>>(
  page: Page,
  name: string,
  args?: unknown,
) =>
  page.evaluate(
    ([name, args]) =>
      (
        window.__studioCanvas as unknown as Record<
          string,
          (args: unknown) => unknown
        >
      )[name as string]!(args),
    [name, args] as const,
  ) as Promise<T>
const refused = (page: Page, name: string, args?: unknown) =>
  tool(page, name, args).then(
    () => '',
    (error: Error) => error.message,
  )

describe('the canvas tools in the open canvas', () => {
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await startDevServer({ ...BEN, STUDIO_PROTOTYPES: posix(dir) })
  })
  afterAll(async () => {
    await studio?.stop()
  })

  test('[CV-135] [CV-114] [CV-115] the tools are on window.__studioCanvas, with the same help as the command line', async () => {
    const page = await canvasPage()
    await open(page, studio, canvasId(1))
    expect(await tool(page, 'help')).toEqual(help())
    expect(await tool(page, 'help', 'create')).toEqual(help('create'))
    expect(await tool(page, 'help', 'states')).toEqual(help('states'))
    // Leaving the canvas, inside the app, takes them away.
    await page.evaluate((target) => {
      const app = (
        document.querySelector('#__nuxt') as unknown as {
          __vue_app__: {
            config: {
              globalProperties: { $router: { push: (to: string) => unknown } }
            }
          }
        }
      ).__vue_app__
      void app.config.globalProperties.$router.push(target)
    }, `/prototypes/${PROTOTYPE}/artifacts/${MAIN}`)
    await expect
      .poll(() => page.evaluate(() => typeof window.__studioCanvas))
      .toBe('undefined')
    // A cold dev server compiles the canvas page first.
  }, 180_000)

  test('[CV-138] [CV-117] a change shows at once, is one undo step, measures its text and saves like the person’s', async () => {
    const page = await canvasPage()
    await open(page, studio, canvasId(2))
    const { artifacts } = await tool<{ artifacts: { artifact: string }[] }>(
      page,
      'artifacts',
    )
    // Canvases are artifacts too, shown as cards.
    expect(artifacts.map((item) => item.artifact)).toEqual([
      ...Array.from({ length: CANVASES }, (_, i) => fileOf(i + 1)),
      'Home.vue',
      'Main.vue',
      'Notes.md',
    ])
    const made = await tool<{ created: string[] }>(page, 'create', {
      elements: [
        { type: 'artifact', artifact: 'Main.vue', x: 0, y: 0, ref: 'main' },
        { type: 'text', text: 'Main screen', below: '@main' },
        { type: 'rectangle', text: 'Next', rightOf: '@main', ref: 'next' },
        { type: 'arrow', from: '@main', to: '@next' },
      ],
    })
    expect(made.created).toHaveLength(4)
    await expect
      .poll(() =>
        page.locator(`[data-canvas-embed-id="${made.created[0]}"]`).count(),
      )
      .toBe(1)
    // Saved by itself, with the item's permanent address.
    await expect
      .poll(() => disk(2).elements.length, { timeout: 15_000 })
      .toBe(5)
    const item = disk(2).elements.find((el) => el.id === made.created[0])!
    expect(item.link).toBe(at(MAIN))
    // Text is measured by Excalidraw, not left at the tools' estimate.
    const text = await page.evaluate(
      (id) =>
        (
          window.__studioCanvas!.describe({ ids: [id] }) as {
            elements: { width: number }[]
          }
        ).elements[0]!.width,
      made.created[1]!,
    )
    expect(text).toBeGreaterThan(80)
    // One undo takes the whole call away.
    const box = (await canvas(page).boundingBox())!
    await page.mouse.click(box.x + box.width - 40, box.y + box.height - 80)
    await page.keyboard.press('Control+z')
    await expect
      .poll(
        async () =>
          (await tool<{ elements: unknown[] }>(page, 'describe')).elements
            .length,
      )
      .toBe(0)
    await expect
      .poll(() => disk(2).elements.length, { timeout: 15_000 })
      .toBe(0)
  })

  test('[CV-143] [CV-129] [CV-114] states works in the open canvas and gives what the file tools read back', async () => {
    const page = await canvasPage()
    await open(page, studio, canvasId(3))
    const placed = await tool<{
      states: { title: string; link: string }[]
      warnings?: string[]
    }>(page, 'states', { artifact: 'Home.vue' })
    expect(placed.warnings).toBeUndefined()
    expect(placed.states.map((state) => [state.title, state.link])).toEqual([
      ['Member', at(MEMBER)],
      ['Guest', at(GUEST)],
    ])
    const persisted = await tool<{ ok: boolean; file: string }>(page, 'persist')
    expect(persisted).toEqual({ ok: true, file: `${FOLDER}/${fileOf(3)}` })
    // The same tools on the saved file read the same canvas.
    const onScreen = await tool<{ elements: Record<string, unknown>[] }>(
      page,
      'describe',
    )
    const onFile = run(disk(3).elements, 'describe', {}, nodeContext)
      .result as {
      elements: Record<string, unknown>[]
    }
    const shape = (elements: Record<string, unknown>[]) =>
      elements.map(({ kind, link, artifact, text }) => ({
        kind,
        link,
        artifact,
        text,
      }))
    expect(shape(onScreen.elements)).toEqual(shape(onFile.elements))
    expect(
      shape(onScreen.elements).filter((el) => el.kind === 'artifact'),
    ).toEqual([
      {
        kind: 'artifact',
        link: at(MEMBER),
        artifact: { title: 'Home', type: 'View', state: 'Member' },
        text: undefined,
      },
      {
        kind: 'artifact',
        link: at(GUEST),
        artifact: { title: 'Home', type: 'View', state: 'Guest' },
        text: undefined,
      },
    ])
  })

  test('[CV-136] [CV-137] [CV-139] context says what is selected and on screen; describe reads a scope; point selects and shows, never zooming in', async () => {
    const page = await canvasPage()
    await open(page, studio, canvasId(4))
    const { created } = await tool<{ created: string[] }>(page, 'create', {
      elements: [
        { type: 'note', text: 'Here', x: 0, y: 0 },
        { type: 'note', text: 'Far away', x: 20_000, y: 20_000 },
      ],
    })
    const [near, far] = created as [string, string]
    const before = await tool<{
      canvas: string
      editable: boolean
      selection: string[]
      viewport: {
        x: number
        y: number
        width: number
        height: number
        zoom: number
      }
      elements: number
      inView: string[]
    }>(page, 'context')
    expect(before).toMatchObject({
      canvas: `${FOLDER}/${fileOf(4)}`,
      editable: true,
      selection: [],
      elements: 2,
    })
    expect(before.viewport.width).toBeGreaterThan(0)
    expect(before.inView).toContain(near)
    expect(before.inView).not.toContain(far)
    const view = await tool<{ elements: { id: string }[] }>(page, 'describe', {
      scope: 'view',
    })
    expect(view.elements.map((el) => el.id)).toEqual([near])

    expect(await tool(page, 'point', { ids: [far] })).toEqual({
      ok: true,
      pointed: [far],
    })
    await expect
      .poll(
        async () => (await tool<{ inView: string[] }>(page, 'context')).inView,
      )
      .toContain(far)
    const after = await tool<{
      selection: string[]
      viewport: { zoom: number }
    }>(page, 'context')
    expect(after.selection).toEqual([far])
    expect(after.viewport.zoom).toBeLessThanOrEqual(before.viewport.zoom)
    const selection = await tool<{ elements: { id: string }[] }>(
      page,
      'describe',
      { scope: 'selection' },
    )
    expect(selection.elements.map((el) => el.id)).toEqual([far])
    expect(await refused(page, 'describe', { scope: 'nearby' })).toMatch(
      /scope must be "all", "selection", or "view"/,
    )
  })

  test('[CV-140] screenshot gives a PNG of the canvas or some elements', async () => {
    const page = await canvasPage()
    await open(page, studio, canvasId(5))
    const { created } = await tool<{ created: string[] }>(page, 'create', {
      elements: [
        { type: 'rectangle', text: 'A', x: 0, y: 0 },
        { type: 'artifact', artifact: 'Main.vue', x: 400, y: 0 },
      ],
    })
    const size = (url: string) =>
      page.evaluate(
        (src) =>
          new Promise<[number, number]>((resolve) => {
            const image = new Image()
            image.onload = () => resolve([image.width, image.height])
            image.src = src
          }),
        url,
      )
    const all = await tool<string>(page, 'screenshot')
    expect(all).toMatch(/^data:image\/png;base64,/)
    const one = await tool<string>(page, 'screenshot', {
      ids: [created[0]],
      scale: 1,
    })
    // A 200 × 120 box with 40 px padding.
    expect(await size(one)).toEqual([280, 200])
    const double = await tool<string>(page, 'screenshot', {
      ids: [created[0]],
      scale: 2,
    })
    expect(await size(double)).toEqual([560, 400])
    const capped = await tool<string>(page, 'screenshot', {
      ids: [created[0]],
      scale: 100,
    })
    expect(await size(capped)).toEqual([1120, 800])
    expect((await size(all))[0]).toBeGreaterThan(280)
  })

  test('[CV-141] persist writes the file now and says it is saved', async () => {
    const page = await canvasPage()
    await open(page, studio, canvasId(6))
    await tool(page, 'create', { type: 'note', text: 'Now', x: 0, y: 0 })
    // Before the 1.2 s pause would have saved it.
    const result = await tool(page, 'persist')
    expect(result).toEqual({ ok: true, file: `${FOLDER}/${fileOf(6)}` })
    expect(disk(6).elements).toHaveLength(2)
  })

  test('[CV-142] on a read-only canvas the changing tools refuse; describe, help and artifacts still work', async () => {
    const page = await canvasPage()
    await page.route('https://esm.sh/**', (route) =>
      route.fulfill({ status: 404, body: '' }),
    )
    await page.goto(
      `${studio.url}prototypes/p1a1n00000000001/artifacts/${THEIRS}`,
    )
    await expect
      .poll(() => canvas(page).getAttribute('data-canvas-opening'), {
        timeout: 60_000,
      })
      .toBe('ready')
    await expect
      .poll(() => page.evaluate(() => typeof window.__studioCanvas), {
        timeout: 30_000,
      })
      .toBe('object')
    for (const [name, args] of [
      ['create', { type: 'note', text: 'x' }],
      ['states', { artifact: 'x' }],
      ['update', { id: 'one', text: 'x' }],
      ['move', { id: 'one', dx: 1, dy: 0 }],
      ['delete', { id: 'one' }],
      ['persist', undefined],
    ] as const)
      expect(await refused(page, name, args)).toMatch(
        /This canvas is read-only here: it is in someone else's prototype, or the app is not running in dev/,
      )
    expect(
      (await tool<{ elements: unknown[] }>(page, 'describe')).elements,
    ).toHaveLength(1)
    expect(
      (
        await tool<{ artifacts: { artifact: string }[] }>(page, 'artifacts')
      ).artifacts.map((item) => item.artifact),
    ).toContain('Theirs.excalidraw')
    expect(await tool(page, 'help', 'move')).toEqual(help('move'))
    expect(await tool<{ editable: boolean }>(page, 'context')).toMatchObject({
      editable: false,
    })
  })

  test('[CV-133] a mistake in a call is refused with what to fix, and changes nothing', async () => {
    const page = await canvasPage()
    await open(page, studio, canvasId(7))
    expect(
      await refused(page, 'create', {
        elements: [
          { type: 'note', text: 'ok' },
          { type: 'note', text: 'x', width: 5 },
        ],
      }),
    ).toMatch(/elements\[1\] \(note\): width must be between 20 and 4000/)
    expect(
      await refused(page, 'create', {
        type: 'artifact',
        artifact: `/prototypes/0ther00000000001/artifacts/${MAIN}`,
      }),
    ).toMatch(/another prototype/)
    expect(
      (await tool<{ elements: unknown[] }>(page, 'describe')).elements,
    ).toEqual([])
  })
})
