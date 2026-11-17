// Breakdown: a designer opens a component's Breakdown tab and sees how it
// is built, as a tree of pieces on a dotted canvas: the Endless Studios
// button is its file, Nuxt UI's UButton and that piece's theme slots; the
// sidebar goes through its copied app file to the Nuxt UI pieces in it.
// The root card shows the component live in its system's preview
// document, which marks each piece's elements with its node ID. Hovering a
// card outlines its piece in the preview, clicking selects it, and Escape
// or the empty canvas lets go; the canvas pans, zooms, switches to the
// component alone and covers the screen. On the real Endless Studios system, with a disposable
// copy of tests/fixtures/endless-studios-screens as the prototypes,
// against the dev server and the static build.
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import type { FrameLocator, Locator, Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import {
  startDevServer,
  startStaticSite,
  type RunningStudio,
} from './setup/studio'

mkdirSync('.e2e', { recursive: true })
const content = mkdtempSync(path.join('.e2e', 'lab-breakdown-'))
cpSync('tests/fixtures/endless-studios-screens', content, { recursive: true })
const ENV = {
  STUDIO_PROTOTYPES: content.split(path.sep).join('/'),
  STUDIO_CONTRIBUTORS: 'tests/fixtures/contributors',
  STUDIO_GITHUB: '',
}
const STUDIO = JSON.parse(readFileSync('studio.config.json', 'utf8')).name
const ENDLESS_STUDIOS = '8x5spen6xtvp96a9'
const button = `/lab/${ENDLESS_STUDIOS}/button`
const sidebar = `/lab/${ENDLESS_STUDIOS}/studio-sidebar`

afterAll(() => {
  rmSync(content, { recursive: true, force: true })
})

const pathname = (page: Page) => () => new URL(page.url()).pathname
const tabs = (page: Page) =>
  page.getByRole('navigation', { name: 'Component tabs' })
// The canvas's cards, each carrying its piece's node ID.
const pieces = (page: Page) => page.getByRole('group', { name: /^Pieces of / })
const card = (page: Page, id: string) =>
  pieces(page).locator(`[data-lab-node="${id}"]`)
const cardButton = (page: Page, id: string) => card(page, id).locator('button')
const rootFrame = (page: Page): FrameLocator =>
  card(page, 'root').locator('iframe[data-preview-frame]').contentFrame()
const piece = (page: Page, id: string) =>
  rootFrame(page).locator(`[data-lab-node~="${id}"]`)
const outlines = (page: Page) =>
  rootFrame(page).locator('[data-lab-overlay] > div')
const transform = (page: Page) =>
  page
    .getByRole('group', { name: /^Pieces of / })
    .evaluate((element) => (element as HTMLElement).style.transform)
const toolbar = (page: Page) =>
  page.getByRole('toolbar', { name: 'Canvas tools' })

async function visible(locator: Locator) {
  await expect.poll(() => locator.isVisible(), { timeout: 60_000 }).toBe(true)
}
// The canvas fits the tree once its cards have been measured.
async function placed(page: Page) {
  await expect
    .poll(() => transform(page), { timeout: 60_000 })
    .not.toBe('translate(0px, 0px) scale(1)')
}
const canvas = (page: Page) =>
  page.getByRole('region', { name: /^Breakdown of / })
async function ready(page: Page) {
  await expect
    .poll(
      () =>
        card(page, 'root')
          .locator('[data-preview-state]')
          .getAttribute('data-preview-state'),
      { timeout: 120_000 },
    )
    .toBe('ready')
}
const box = (locator: Locator) =>
  locator.evaluate((element) => {
    const { x, y, width, height } = element.getBoundingClientRect()
    return { x, y, width, height }
  })

function scenarios(start: () => Promise<RunningStudio>) {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await start()
    // The first page builds the component data; later pages are quicker.
    const page = await newPage()
    await page.goto(`${studio.url}${button.slice(1)}/breakdown`)
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

  test('[LAB-BD-01] Breakdown is the tab between Playground and Experiments, with its own address and title', async () => {
    const page = await open(`${button}/playground`)
    const names = tabs(page).getByRole('link')
    await visible(names.last())
    expect(await names.allTextContents()).toEqual([
      'Overview',
      'Variants',
      'Playground',
      'Breakdown',
      'Experiments',
    ])
    await tabs(page).getByRole('link', { name: 'Breakdown' }).click()
    await expect.poll(pathname(page)).toBe(`${button}/breakdown`)
    await expect
      .poll(() => page.title())
      .toBe(`Breakdown — Button — Lab — ${STUDIO}`)
    expect(
      await tabs(page)
        .getByRole('link', { name: 'Breakdown' })
        .getAttribute('aria-current'),
    ).toBe('page')
  })

  test('[LAB-BD-02] the button is its file, then UButton, then UButton’s theme slots, live in the root card', async () => {
    const page = await open(`${button}/breakdown`)
    await visible(card(page, 'root'))
    const ids = await pieces(page)
      .locator('[data-lab-node]')
      .evaluateAll((cards) =>
        cards.map((element) => element.getAttribute('data-lab-node')),
      )
    expect(ids).toEqual([
      'root',
      'root>UButton',
      'root>UButton#base',
      'root>UButton#leadingIcon',
      'root>UButton#leadingAvatar',
      'root>UButton#label',
      'root>UButton#trailingIcon',
    ])
    await expect
      .poll(() => card(page, 'root').textContent())
      .toContain('components/button/button.vue')
    expect(await card(page, 'root>UButton').textContent()).toContain(
      '@nuxt/ui/components/Button.vue',
    )
    expect(await card(page, 'root>UButton#label').textContent()).toContain(
      'ui.label',
    )
    await visible(pieces(page).getByText('Nuxt UI', { exact: true }).first())
    // The preview marks UButton's element with the file's node and its own.
    await ready(page)
    await visible(piece(page, 'root>UButton'))
    expect(
      await piece(page, 'root>UButton').evaluate((element) => element.tagName),
    ).toBe('BUTTON')
    expect(
      await piece(page, 'root>UButton').getAttribute('data-lab-node'),
    ).toContain('root')
  })

  test('[LAB-BD-02] the sidebar starts from the app’s own sidebar and goes through the copied app files it uses', async () => {
    const page = await open(`${sidebar}/breakdown`)
    const app = card(page, 'root>USidebar/UPopover/Notifications')
    await visible(app)
    expect(await app.textContent()).toContain(
      'studios/components/Notifications/index.vue',
    )
    for (const id of [
      'root>USidebar',
      'root>USidebar/UNavigationMenu',
      'root>USidebar/UPopover/UButton/UIcon',
      'root>USidebar/UPopover/Notifications>UButton',
    ])
      expect(await card(page, id).count(), id).toBe(1)
    expect(
      await card(page, 'root>USidebar/UPopover/UButton/UIcon').textContent(),
    ).toContain('i-lucide-bell')
    for (const chip of ['Endless Studios app', 'Nuxt UI', 'Lucide'])
      await visible(pieces(page).getByText(chip, { exact: true }).first())
    await ready(page)
    await visible(piece(page, 'root>USidebar/UNavigationMenu'))
  })

  test('[LAB-BD-03] the canvas zooms, pans and switches to the component alone', async () => {
    const page = await open(`${button}/breakdown`)
    await visible(card(page, 'root'))
    await placed(page)
    // The percentage, which moves along the zoom steps.
    const zoom = async () =>
      Number.parseInt(
        (await toolbar(page).getByRole('status').textContent()) ?? '',
      )
    const start = await zoom()
    await toolbar(page).getByRole('button', { name: 'Zoom in' }).click()
    await expect.poll(zoom).toBeGreaterThan(start)
    const zoomedIn = await zoom()
    await toolbar(page).getByRole('button', { name: 'Zoom out' }).click()
    await expect.poll(zoom).toBeLessThan(zoomedIn)

    const before = await transform(page)
    await canvas(page).hover({ position: { x: 20, y: 20 } })
    const area = await box(canvas(page))
    await page.mouse.down()
    await page.mouse.move(area.x + 80, area.y + 60, { steps: 5 })
    await page.mouse.up()
    await expect.poll(() => transform(page)).not.toBe(before)

    await toolbar(page).getByRole('button', { name: 'Show component' }).click()
    await expect.poll(() => new URL(page.url()).search).toBe('?view=component')
    await visible(page.getByTitle('Button on the canvas'))
    await visible(toolbar(page).getByRole('button', { name: 'Show breakdown' }))
    await toolbar(page).getByRole('button', { name: 'Show breakdown' }).click()
    await expect.poll(() => new URL(page.url()).search).toBe('')
    await visible(toolbar(page).getByRole('button', { name: 'Show component' }))
  })

  test('[LAB-BD-05] the canvas goes full screen and back, by its button or Escape', async () => {
    const page = await open(`${button}/breakdown`)
    await visible(card(page, 'root'))
    const covers = async () => {
      const area = await box(canvas(page))
      const size = page.viewportSize()!
      return (
        area.x === 0 &&
        area.y === 0 &&
        area.width === size.width &&
        area.height === size.height
      )
    }
    expect(await covers()).toBe(false)
    await toolbar(page).getByRole('button', { name: 'Full screen' }).click()
    await expect.poll(covers).toBe(true)
    await toolbar(page)
      .getByRole('button', { name: 'Exit full screen' })
      .click()
    await expect.poll(covers).toBe(false)

    await toolbar(page).getByRole('button', { name: 'Full screen' }).click()
    await expect.poll(covers).toBe(true)
    await page.evaluate(
      () => document.fullscreenElement && document.exitFullscreen(),
    )
    await page.keyboard.press('Escape')
    await expect.poll(covers).toBe(false)
    await visible(toolbar(page).getByRole('button', { name: 'Full screen' }))
  })

  test('[LAB-BD-04] hovering a card outlines its piece in the preview; clicking selects it until Escape or the canvas', async () => {
    const page = await open(`${button}/breakdown`)
    await ready(page)
    await placed(page)
    await visible(piece(page, 'root>UButton'))
    await cardButton(page, 'root>UButton').hover()
    await expect.poll(() => outlines(page).count()).toBe(1)
    // The outline sits on the piece.
    const outline = await box(outlines(page).first())
    const target = await box(piece(page, 'root>UButton'))
    expect(Math.abs(outline.x - target.x)).toBeLessThan(2)
    expect(Math.abs(outline.width - target.width)).toBeLessThan(2)

    await cardButton(page, 'root>UButton').click()
    await expect
      .poll(() => cardButton(page, 'root>UButton').getAttribute('aria-pressed'))
      .toBe('true')
    await expect.poll(() => toolbar(page).textContent()).toContain('UButton')
    // A theme slot's card outlines that slot.
    await cardButton(page, 'root>UButton#base').hover()
    await expect.poll(() => outlines(page).count()).toBe(2)

    await page.keyboard.press('Escape')
    await expect
      .poll(() => cardButton(page, 'root>UButton').getAttribute('aria-pressed'))
      .toBe('false')

    await cardButton(page, 'root>UButton').click()
    await canvas(page).click({ position: { x: 10, y: 10 } })
    await expect
      .poll(() => cardButton(page, 'root>UButton').getAttribute('aria-pressed'))
      .toBe('false')
  })
}

describe('in the studio running locally', { timeout: 180_000 }, () => {
  scenarios(() => startDevServer(ENV))
})

describe('the deployed site', { timeout: 180_000 }, () => {
  scenarios(() => startStaticSite('/', ENV))
})
