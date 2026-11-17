// Breakdown pieces: every card below the root shows its own piece live, cut
// from the rendered component. Its preview is a frame of the same
// Breakdown preview, clipped to the box the document reports for that
// piece (a theme slot's card to that slot's element), so it keeps the
// component's real content. A piece the content doesn't render says so. A
// large tree mounts frames only for the cards in view. Locally, the cards
// follow the component's files as they change on disk. The Endless
// Studios button and sidebar run on the real systems, against the dev
// server and the static build; the file changes on a disposable copy of
// `tests/fixtures/systems-area`, with a component of two files added to
// Harbor.
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { Locator, Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import {
  startDevServer,
  startStaticSite,
  type RunningStudio,
} from './setup/studio'

mkdirSync('.e2e', { recursive: true })
const posix = (file: string) => file.split(path.sep).join('/')
const empty = mkdtempSync(path.join('.e2e', 'lab-pieces-prototypes-'))
const content = mkdtempSync(path.join('.e2e', 'lab-pieces-'))
cpSync('tests/fixtures/systems-area', content, { recursive: true })

const ENDLESS_STUDIOS = '8x5spen6xtvp96a9'
const HARBOR = 'hrbr000000000001'
const button = `/lab/${ENDLESS_STUDIOS}/button/breakdown`
const sidebar = `/lab/${ENDLESS_STUDIOS}/studio-sidebar/breakdown`
const tide = `/lab/${HARBOR}/tide/breakdown`

const at = (file: string) => path.join(content, 'systems', 'harbor', file)
function write(file: string, text: string) {
  mkdirSync(path.dirname(at(file)), { recursive: true })
  writeFileSync(at(file), text)
}
const MARK = (size: number) =>
  `<template><i data-tide-mark style="display: block; width: ${size}px; height: ${size}px; background: #0a7"></i></template>\n`
write(
  'components/tide/tide.vue',
  `<script setup lang="ts">
import TideMark from './mark.vue'
</script>
<template><p style="display: flex; gap: 8px; margin: 0"><TideMark /><span>High tide</span></p></template>
`,
)
write('components/tide/mark.vue', MARK(20))
write(
  'components/tide/tide.md',
  '---\ntitle: Tide\ndescription: Says how the water stands.\n---\n\n## When to use\n\nAt the dock.\n',
)
writeFileSync(
  path.join(content, 'studio.config.json'),
  JSON.stringify({
    formatVersion: 1,
    name: 'Pieces Studio',
    tagline: 'Fixture',
    modules: { prototypes: true, systems: true, contributors: true, lab: true },
    systems: ['attic', 'harbor', 'lantern'],
    defaultSystem: HARBOR,
    admins: ['ada0000000000001'],
    systemMaintainers: { [HARBOR]: ['ben0000000000002'] },
  }),
)

// The repository's own systems and settings, with no prototypes.
const REAL = {
  STUDIO_PROTOTYPES: posix(empty),
  STUDIO_CONTRIBUTORS: 'tests/fixtures/contributors',
  STUDIO_GITHUB: '',
}
const HARBOR_ENV = {
  STUDIO_CONFIG: posix(path.join(content, 'studio.config.json')),
  STUDIO_SYSTEMS: posix(path.join(content, 'systems')),
  STUDIO_PROTOTYPES: posix(path.join(content, 'prototypes')),
  STUDIO_CONTRIBUTORS: 'tests/fixtures/contributors',
  STUDIO_GITHUB: '',
}

afterAll(() => {
  rmSync(content, { recursive: true, force: true })
  rmSync(empty, { recursive: true, force: true })
})

// The canvas's cards, each carrying its piece's node ID.
const pieces = (page: Page) => page.getByRole('group', { name: /^Pieces of / })
const card = (page: Page, id: string) =>
  pieces(page).locator(`[data-lab-node="${id}"]`)
/** A card's clipped piece: the window its frame shows through. */
const clip = (page: Page, id: string) =>
  card(page, id).locator('[data-breakdown-clip]')
const pieceFrame = (page: Page, id: string) =>
  card(page, id).locator('iframe[data-preview-frame]')
const inPiece = (page: Page, id: string, selector: string) =>
  pieceFrame(page, id).contentFrame().locator(selector)
const notShown = (page: Page, id: string) =>
  card(page, id).getByText('Not shown with this content')

async function visible(locator: Locator) {
  await expect.poll(() => locator.isVisible(), { timeout: 90_000 }).toBe(true)
}
async function box(locator: Locator) {
  const found = await locator.boundingBox()
  if (!found) throw new Error('Not rendered')
  return found
}
// Whether one box holds another, within a pixel.
const holds = (
  outer: { x: number; y: number; width: number; height: number },
  inner: { x: number; y: number; width: number; height: number },
) =>
  inner.x >= outer.x - 1 &&
  inner.y >= outer.y - 1 &&
  inner.x + inner.width <= outer.x + outer.width + 1 &&
  inner.y + inner.height <= outer.y + outer.height + 1

function scenarios(start: () => Promise<RunningStudio>) {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await start()
    const page = await newPage()
    await page.goto(`${studio.url}${button.slice(1)}`)
    await card(page, 'root').waitFor({ timeout: 300_000 })
    await page.close()
  }, 600_000)
  afterAll(async () => {
    await studio?.stop()
  })

  async function open(address: string) {
    const page = await newPage()
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(`${studio.url}${address.replace(/^\//, '')}`)
    return page
  }

  test('[LAB-BD-20] each card shows only its own piece, live from the rendered button', async () => {
    const page = await open(button)
    const id = 'root>UButton'
    await visible(clip(page, id))
    // The button inside the card's frame fills the card's window onto it.
    const shown = inPiece(page, id, `[data-lab-node~="${id}"]`)
    await visible(shown)
    const window = await box(clip(page, id))
    await expect
      .poll(async () => {
        const piece = await box(shown)
        return (
          Math.abs(piece.x - window.x) < 1.5 &&
          Math.abs(piece.width - window.width) < 1.5 &&
          Math.abs(piece.height - window.height) < 1.5
        )
      })
      .toBe(true)
    expect(holds(await box(card(page, id)), window)).toBe(true)
    // It is the same button the root shows, with the same label.
    expect(await shown.textContent()).toBe(
      await card(page, 'root')
        .locator('iframe[data-preview-frame]')
        .contentFrame()
        .locator(`[data-lab-node~="${id}"]`)
        .textContent(),
    )

    // A theme slot's card clips to that slot inside the piece.
    const label = 'root>UButton#base'
    await visible(clip(page, label))
    const slot = inPiece(
      page,
      label,
      `[data-lab-node~="${id}"][data-slot="base"]`,
    )
    await visible(slot)
    const labelWindow = await box(clip(page, label))
    await expect
      .poll(async () => {
        const piece = await box(slot)
        return (
          Math.abs(piece.x - labelWindow.x) < 1.5 &&
          Math.abs(piece.width - labelWindow.width) < 1.5
        )
      })
      .toBe(true)
  })

  test('[LAB-BD-21] a piece the content doesn’t render says so instead of showing an empty card', async () => {
    const page = await open(button)
    await visible(clip(page, 'root>UButton#base'))
    // The Default example's text is the button's own content, not its label.
    await visible(notShown(page, 'root>UButton#label'))
    await visible(notShown(page, 'root>UButton#leadingIcon'))
    expect(await clip(page, 'root>UButton#leadingIcon').count()).toBe(0)
    expect(await notShown(page, 'root>UButton#base').count()).toBe(0)
  })

  test('[LAB-BD-22] a large tree mounts frames only for the cards in view, and more as it pans', async () => {
    const page = await open(sidebar)
    const cards = pieces(page).locator('[data-lab-node]')
    await visible(card(page, 'root>USidebar'))
    await visible(clip(page, 'root>USidebar'))
    const frames = page.locator('[data-lab-node] iframe[data-preview-frame]')
    const total = await cards.count()
    const mounted = await frames.count()
    expect(total).toBeGreaterThan(50)
    expect(mounted).toBeGreaterThan(1)
    expect(mounted).toBeLessThan(total / 2)

    // A card far below the first view gets its frame once it is in view.
    const deep = cards.last()
    const id = (await deep.getAttribute('data-lab-node'))!
    expect(await pieceFrame(page, id).count()).toBe(0)
    const canvas = page.getByRole('region', { name: /^Breakdown of / })
    await canvas.hover({ position: { x: 20, y: 20 } })
    for (let step = 0; step < 40; step += 1) {
      const where = await box(deep)
      const area = await box(canvas)
      if (holds(area, where)) break
      await page.mouse.wheel(
        Math.sign(where.x + where.width / 2 - (area.x + area.width / 2)) * 400,
        Math.sign(where.y + where.height / 2 - (area.y + area.height / 2)) *
          400,
      )
    }
    await expect
      .poll(
        async () =>
          (await pieceFrame(page, id).count()) +
          (await notShown(page, id).count()),
        { timeout: 60_000 },
      )
      .toBeGreaterThan(0)
  })
}

describe('in the studio running locally', { timeout: 180_000 }, () => {
  scenarios(() => startDevServer(REAL))
})

describe('the deployed site', { timeout: 180_000 }, () => {
  scenarios(() => startStaticSite('/', REAL))
})

describe('a Harbor component, running locally', { timeout: 180_000 }, () => {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await startDevServer(HARBOR_ENV)
  }, 600_000)
  afterAll(async () => {
    await studio?.stop()
  })

  test('[LAB-BD-23] the cards follow the component’s files as they change on disk', async () => {
    const page = await newPage()
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(`${studio.url}${tide.slice(1)}`)
    const id = 'root>TideMark'
    await visible(clip(page, id))
    const mark = inPiece(page, id, '[data-tide-mark]')
    await visible(mark)
    // On screen at the canvas's zoom, so compared with what it was.
    const before = (await box(clip(page, id))).width
    expect(Math.abs((await box(mark)).width - before)).toBeLessThan(1)

    write('components/tide/mark.vue', MARK(44))
    await expect
      .poll(
        async () =>
          Math.round(((await box(clip(page, id))).width / before) * 20),
        { timeout: 60_000 },
      )
      .toBe(44)
    expect(Math.abs((await box(mark)).width - (before * 44) / 20)).toBeLessThan(
      1,
    )
    write('components/tide/mark.vue', MARK(20))
  })
})
