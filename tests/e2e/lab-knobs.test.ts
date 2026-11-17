// Knobs: selecting a piece in a component's Breakdown turns the toolbar
// into its inspector: the piece's name, a knob for each thing its classes
// set (corners, padding, space between, text size, weight, fill, text
// colour…), Reset and Save with the count of unsaved changes. Moving a knob
// restyles the piece in the preview at once, without reloading it; hovering
// a knob draws what it changes in the knob's colour. On the original
// component Save reads "Save as experiment" and does nothing yet. On the
// real Endless Studios button, against the dev server and the static build.
import { cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
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
const content = mkdtempSync(path.join('.e2e', 'lab-knobs-'))
cpSync('tests/fixtures/endless-studios-screens', content, { recursive: true })
const ENV = {
  STUDIO_PROTOTYPES: content.split(path.sep).join('/'),
  STUDIO_CONTRIBUTORS: 'tests/fixtures/contributors',
  STUDIO_GITHUB: '',
}
const ENDLESS_STUDIOS = '8x5spen6xtvp96a9'
const button = `/lab/${ENDLESS_STUDIOS}/button/breakdown`
const BUTTON = 'root>UButton'

afterAll(() => {
  rmSync(content, { recursive: true, force: true })
})

const card = (page: Page, id: string) =>
  page.locator(`[data-breakdown-card][data-breakdown-node="${id}"]`)
const cardButton = (page: Page, id: string) => card(page, id).locator('button')
const rootFrame = (page: Page): FrameLocator =>
  card(page, 'root').locator('iframe[data-preview-frame]').contentFrame()
const piece = (page: Page, id: string) =>
  rootFrame(page).locator(`[data-lab-node~="${id}"]`).first()
const toolbar = (page: Page) =>
  page.getByRole('toolbar', { name: 'Canvas tools' })
const knob = (page: Page, name: string) =>
  toolbar(page).getByRole('spinbutton', { name, exact: true })
const knobAreas = (page: Page) =>
  rootFrame(page).locator('[data-lab-knob-overlay] > div')
const radius = (page: Page) =>
  piece(page, BUTTON).evaluate(
    (element) => getComputedStyle(element).borderTopLeftRadius,
  )
const runtime = (page: Page) =>
  rootFrame(page)
    .locator('html')
    .evaluate((root) => (root as HTMLElement).dataset.previewRuntime)

async function visible(locator: Locator) {
  await expect.poll(() => locator.isVisible(), { timeout: 60_000 }).toBe(true)
}
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
  await visible(piece(page, BUTTON))
}

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

  async function open() {
    const page = await newPage()
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(`${studio.url}${button.slice(1)}`)
    await ready(page)
    return page
  }
  async function select(page: Page, id: string) {
    await cardButton(page, id).click()
    await expect
      .poll(() => cardButton(page, id).getAttribute('aria-pressed'))
      .toBe('true')
  }

  test('[LAB-KN-01] selecting a piece shows its knobs, named in plain language; a piece without any says so', async () => {
    const page = await open()
    await select(page, BUTTON)
    const knobs = toolbar(page).getByRole('group', {
      name: 'Knobs for UButton',
    })
    await visible(knobs)
    await visible(knob(page, 'Corners'))
    for (const name of [
      'Horizontal padding',
      'Vertical padding',
      'Space between items',
      'Text size',
      'Weight',
    ])
      await visible(knob(page, name))
    for (const name of ['Fill', 'Text color'])
      await visible(
        knobs.getByRole('button', { name: new RegExp(`^${name}:`) }),
      )
    // Values show in pixels, from the classes the button renders with.
    expect(await knob(page, 'Corners').inputValue()).toBe('6')
    expect(await knob(page, 'Corners').getAttribute('aria-valuetext')).toBe(
      '6 px',
    )
    // A theme slot offers the knobs of that slot.
    await select(page, `${BUTTON}#base`)
    await visible(knob(page, 'Corners'))

    await select(page, 'root')
    await expect
      .poll(() => toolbar(page).textContent())
      .toContain('Nothing to adjust on this piece')
    expect(await knob(page, 'Corners').count()).toBe(0)
  })

  test('[LAB-KN-02] moving the corners knob changes the button’s radius in the preview without reloading it', async () => {
    const page = await open()
    const before = await runtime(page)
    expect(await radius(page)).toBe('6px')
    await select(page, BUTTON)
    await knob(page, 'Corners').focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowUp')
    await expect.poll(() => radius(page)).toBe('12px')
    expect(await knob(page, 'Corners').inputValue()).toBe('12')
    // Typed, in pixels: the nearest step of the scale.
    await knob(page, 'Corners').fill('15')
    await page.keyboard.press('Enter')
    await expect.poll(() => radius(page)).toBe('16px')
    // Dragged sideways.
    const handle = toolbar(page).locator(
      '[data-knob="base.corners"] [data-knob-handle]',
    )
    const at = (await handle.boundingBox())!
    await page.mouse.move(at.x + at.width / 2, at.y + at.height / 2)
    await page.mouse.down()
    await page.mouse.move(at.x + at.width / 2 - 30, at.y + at.height / 2, {
      steps: 6,
    })
    await page.mouse.up()
    await expect.poll(() => radius(page)).not.toBe('16px')
    // The same document, never reloaded.
    expect(await runtime(page)).toBe(before)
    // Other knobs restyle it too.
    await knob(page, 'Horizontal padding').focus()
    await page.keyboard.press('ArrowRight')
    await expect
      .poll(() =>
        piece(page, BUTTON).evaluate(
          (element) => getComputedStyle(element).paddingLeft,
        ),
      )
      .toBe('12px')
  })

  test('[LAB-KN-03] hovering a knob draws what it changes on the piece, in the knob’s colour', async () => {
    const page = await open()
    await select(page, BUTTON)
    await knob(page, 'Corners').hover()
    await expect.poll(() => knobAreas(page).count()).toBe(1)
    const corners = knobAreas(page).first()
    expect(await corners.getAttribute('data-lab-knob-area')).toBe('corners')
    expect(
      await corners.evaluate(
        (element) => getComputedStyle(element).outlineColor,
      ),
    ).toBe('rgb(236, 72, 153)')
    const box = await corners.boundingBox()
    const target = await piece(page, BUTTON).boundingBox()
    expect(Math.abs(box!.width - target!.width)).toBeLessThan(2)

    await knob(page, 'Horizontal padding').hover()
    await expect
      .poll(() =>
        knobAreas(page).evaluateAll((areas) =>
          areas.map((area) => (area as HTMLElement).dataset.labKnobArea),
        ),
      )
      .toEqual(['paddingX', 'paddingX'])
    expect(
      await knobAreas(page)
        .first()
        .evaluate((element) => getComputedStyle(element).backgroundImage),
    ).toContain('rgb(59, 130, 246)')

    await page.mouse.move(5, 5)
    await expect.poll(() => knobAreas(page).count()).toBe(0)
  })

  test('[LAB-KN-04] Save counts the unsaved changes; Reset discards them; every knob is reached and named by keyboard', async () => {
    const page = await open()
    await select(page, BUTTON)
    const save = toolbar(page).getByRole('button', {
      name: /^Save as experiment/,
    })
    await visible(save)
    expect(await save.isDisabled()).toBe(true)
    await knob(page, 'Corners').focus()
    await page.keyboard.press('ArrowRight')
    await knob(page, 'Space between items').focus()
    await page.keyboard.press('ArrowLeft')
    await expect.poll(() => save.textContent()).toContain('2')
    expect(await save.getAttribute('aria-label')).toBe(
      'Save as experiment, 2 unsaved changes',
    )
    // Back where it started is no change.
    await page.keyboard.press('ArrowRight')
    await expect
      .poll(() => save.getAttribute('aria-label'))
      .toBe('Save as experiment, 1 unsaved change')

    const reset = toolbar(page).getByRole('button', {
      name: 'Discard unsaved changes',
    })
    await reset.click()
    await expect
      .poll(() => save.getAttribute('aria-label'))
      .toBe('Save as experiment')
    await expect.poll(() => radius(page)).toBe('6px')
    expect(await reset.isDisabled()).toBe(true)

    // Tab walks the inspector: each knob a named control in turn.
    await knob(page, 'Corners').focus()
    const names: string[] = []
    for (let step = 0; step < 8; step++) {
      names.push(
        await page.evaluate(() => {
          const active = document.activeElement as HTMLElement
          return (
            active.getAttribute('aria-label') ??
            active.textContent ??
            ''
          ).trim()
        }),
      )
      await page.keyboard.press('Tab')
    }
    expect(names).toEqual([
      'Corners',
      'Horizontal padding',
      'Vertical padding',
      'Space between items',
      'Text size',
      'Weight',
      expect.stringMatching(/^Fill: /),
      expect.stringMatching(/^Text color: /),
    ])
  })
}

describe('in the studio running locally', { timeout: 180_000 }, () => {
  scenarios(() => startDevServer(ENV))
})

describe('the deployed site', { timeout: 180_000 }, () => {
  scenarios(() => startStaticSite('/', ENV))
})
