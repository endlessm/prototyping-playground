// The dial panel: an experiment's component alone on its canvas has a
// DialKit panel beside it, with a folder for each piece that has knobs,
// named as the Breakdown names it, offering the inspector's knobs over the
// theme's own values, and for each tag that is the Lab's component, its
// props, starting from what the tag writes, saved as static attributes. It
// moves the same unsaved changes as the Breakdown, both ways, and Reset
// clears both. The Breakdown hides it, and the deployed site shows it
// without Save. The real Endless Studios system, with Ada's "Button
// experiments" prototype on a disposable prototypes folder.
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import type { FrameLocator, Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import {
  startDevServer,
  startStaticSite,
  type RunningStudio,
} from './setup/studio'

const ENDLESS_STUDIOS = '8x5spen6xtvp96a9'
const ADA_PROTOTYPE = 'adaexp0000000001'
const ROUNDER = 'adarnd0000000001'
const BUTTON = 'root>UButton'
const ROUNDER_SOURCE = `<!-- @studio-id ${ROUNDER} -->
<!-- @lab-experiment ${ENDLESS_STUDIOS} button 2026-11-10 -->
<template>
  <div class="flex min-h-40 flex-wrap items-center justify-center gap-3 p-6">
    <UButton class="rounded-full">Invite the team</UButton>
  </div>
</template>
`
const posix = (file: string) => file.split(path.sep).join('/')
const BUSY = 'adabsy0000000001'
const BUSY_SOURCE = `<!-- @studio-id ${BUSY} -->
<!-- @lab-experiment ${ENDLESS_STUDIOS} button 2026-11-11 -->
<script setup lang="ts">
const busy = false
</script>

<template>
  <div class="flex min-h-40 items-center justify-center p-6">
    <UButton :loading="busy" size="md">Send the invite</UButton>
  </div>
</template>
`
mkdirSync('.e2e', { recursive: true })
const folders: string[] = []

function prototypesWithAdasExperiment() {
  const folder = mkdtempSync(path.join('.e2e', 'lab-dial-'))
  folders.push(folder)
  const dir = path.join(folder, 'ada', 'button-experiments')
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    path.join(dir, 'meta.json'),
    JSON.stringify({
      formatVersion: 1,
      title: 'Button experiments',
      created: '2026-11-10',
      studioId: ADA_PROTOTYPE,
      ownerContributorId: 'ada0000000000001',
      systemId: ENDLESS_STUDIOS,
    }),
  )
  writeFileSync(path.join(dir, 'Rounder.vue'), ROUNDER_SOURCE)
  writeFileSync(path.join(dir, 'Busy.vue'), BUSY_SOURCE)
  return {
    folder,
    rounder: path.join(dir, 'Rounder.vue'),
    busy: path.join(dir, 'Busy.vue'),
  }
}
const studioEnv = (folder: string) => ({
  STUDIO_PROTOTYPES: posix(folder),
  STUDIO_CONTRIBUTORS: 'tests/fixtures/contributors',
  STUDIO_GITHUB: '',
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'user.name',
  GIT_CONFIG_VALUE_0: 'Someone',
  GIT_CONFIG_KEY_1: 'user.email',
  GIT_CONFIG_VALUE_1: 'ada@endless.example',
})

afterAll(() => {
  for (const folder of folders) rmSync(folder, { recursive: true, force: true })
})

async function visible(locator: { isVisible: () => Promise<boolean> }) {
  await expect.poll(() => locator.isVisible(), { timeout: 60_000 }).toBe(true)
}
const rounderPage = `lab/${ENDLESS_STUDIOS}/button/experiments/${ROUNDER}`
const busyPage = `lab/${ENDLESS_STUDIOS}/button/experiments/${BUSY}`
const panel = (page: Page) =>
  page.getByRole('region', { name: 'Controls for Rounder' })
const busyPanel = (page: Page) =>
  page.getByRole('region', { name: 'Controls for Busy' })
// A select in the panel is a button named by its label and its value.
const control = (page: Page, label: string) =>
  panel(page).getByRole('button', { name: new RegExp(`^${label}`) })
const toolbar = (page: Page) =>
  page.getByRole('toolbar', { name: 'Canvas tools' })
const componentFrame = (page: Page): FrameLocator =>
  page.locator('iframe[title="Rounder on the canvas"]').contentFrame()
const radius = (page: Page) =>
  componentFrame(page)
    .locator(`[data-lab-node~="${BUTTON}"]`)
    .first()
    .evaluate((element) => getComputedStyle(element).borderTopLeftRadius)
    .catch(() => null)
const pieces = (page: Page) => page.getByRole('group', { name: /^Pieces of / })

function useStudio(start: () => Promise<RunningStudio>) {
  const newPage = useBrowser()
  const running: { studio?: RunningStudio } = {}
  beforeAll(async () => {
    running.studio = await start()
    const page = await newPage()
    await page.goto(`${running.studio.url}${rounderPage}?view=component`)
    await control(page, 'Corners').waitFor({ timeout: 300_000 })
    await page.close()
  }, 900_000)
  afterAll(async () => {
    await running.studio?.stop()
  })
  return {
    async open(address: string) {
      const page = await newPage()
      await page.setViewportSize({ width: 1440, height: 1000 })
      await page.goto(`${running.studio!.url}${address}`)
      return page
    },
  }
}

// Picks a value in one of the panel's selects.
async function choose(page: Page, label: string, option: string) {
  await control(page, label).click()
  await page
    .getByRole('listbox', { name: label })
    .getByRole('option', { name: option, exact: true })
    .click()
}

describe('in the studio running locally, as Ada', { timeout: 300_000 }, () => {
  const { folder, busy } = prototypesWithAdasExperiment()
  const studio = useStudio(() => startDevServer(studioEnv(folder)))

  test('[LAB-DK-01] the component alone has a panel with a folder for each piece with knobs, and the Breakdown hides it', async () => {
    const page = await studio.open(`${rounderPage}?view=component`)
    await visible(control(page, 'Corners'))
    await visible(panel(page).getByRole('button', { name: 'UButton' }))
    // Only the theme's own values, named by their class and size.
    await control(page, 'Corners').click()
    const corners = page.getByRole('listbox', { name: 'Corners' })
    await visible(corners.getByRole('option', { name: 'full', exact: true }))
    await visible(corners.getByRole('option', { name: 'lg · 8 px' }))
    await page.keyboard.press('Escape')
    await toolbar(page).getByRole('button', { name: 'Show breakdown' }).click()
    await expect.poll(() => panel(page).isVisible()).toBe(false)
    await visible(pieces(page))
    await toolbar(page).getByRole('button', { name: 'Show component' }).click()
    await visible(control(page, 'Corners'))
  })

  test('[LAB-DK-02] a control moves the preview and the Breakdown’s changes, both ways, and Reset clears the panel', async () => {
    const page = await studio.open(`${rounderPage}?view=component`)
    await visible(control(page, 'Corners'))
    await expect
      .poll(() => control(page, 'Corners').innerText())
      .toMatch(/full/)
    await choose(page, 'Corners', 'lg · 8 px')
    await expect.poll(() => radius(page)).toBe('8px')
    const save = toolbar(page).getByRole('button', { name: /^Save/ })
    await expect
      .poll(() => save.getAttribute('aria-label'))
      .toBe('Save, 1 unsaved change')
    // The Breakdown's inspector sees the same change, and moves it on.
    await toolbar(page).getByRole('button', { name: 'Show breakdown' }).click()
    await pieces(page).locator(`[data-lab-node="${BUTTON}"] button`).click()
    const knob = toolbar(page).getByRole('spinbutton', {
      name: 'Corners',
      exact: true,
    })
    await expect.poll(() => knob.inputValue()).toBe('8')
    await knob.focus()
    await page.keyboard.press('ArrowLeft')
    await expect.poll(() => knob.inputValue()).toBe('6')
    await page.keyboard.press('Escape')
    await toolbar(page).getByRole('button', { name: 'Show component' }).click()
    await expect
      .poll(() => control(page, 'Corners').innerText())
      .toMatch(/md · 6 px/)
    await toolbar(page)
      .getByRole('button', { name: 'Discard unsaved changes' })
      .click()
    await expect
      .poll(() => control(page, 'Corners').innerText())
      .toMatch(/full/)
    await expect.poll(() => radius(page)).not.toBe('6px')
    // Nothing pending and nothing selected: Reset and Save step aside.
    await expect.poll(() => save.count()).toBe(0)
  })

  test('[LAB-DK-04] the component’s Props folder starts from its tag, moves the preview, resets, and Save writes it on the tag', async () => {
    const page = await studio.open(`${busyPage}?view=component`)
    const props = busyPanel(page)
    await visible(props.getByRole('button', { name: 'Props' }))
    // A prop bound to code is shown, not offered.
    await visible(props.getByRole('group', { name: 'loading: set in code' }))
    const size = props.getByRole('button', { name: /^size/ })
    const variant = props.getByRole('button', { name: /^variant/ })
    await expect.poll(() => size.innerText()).toMatch(/md/)
    await expect.poll(() => variant.innerText()).toMatch(/solid/)
    const button = page
      .locator('iframe[title="Busy on the canvas"]')
      .contentFrame()
      .getByRole('button', { name: 'Send the invite' })
    const before = await button.getAttribute('class')
    await variant.click()
    await page
      .getByRole('listbox', { name: 'variant' })
      .getByRole('option', { name: 'outline', exact: true })
      .click()
    await expect.poll(() => button.getAttribute('class')).not.toBe(before)
    const save = toolbar(page).getByRole('button', { name: /^Save/ })
    await expect
      .poll(() => save.getAttribute('aria-label'))
      .toBe('Save, 1 unsaved change')
    // Reset clears the panel and the preview.
    await toolbar(page)
      .getByRole('button', { name: 'Discard unsaved changes' })
      .click()
    await expect.poll(() => variant.innerText()).toMatch(/solid/)
    await expect.poll(() => button.getAttribute('class')).toBe(before)
    // Save writes the new value on the tag, the binding left as it is.
    await size.click()
    await page
      .getByRole('listbox', { name: 'size' })
      .getByRole('option', { name: 'xl', exact: true })
      .click()
    await expect
      .poll(() => save.getAttribute('aria-label'))
      .toBe('Save, 1 unsaved change')
    await save.click()
    await visible(page.getByText('Saved 1 change').first())
    await expect
      .poll(() => readFileSync(busy, 'utf8'))
      .toContain('<UButton :loading="busy" size="xl">Send the invite</UButton>')
    await expect.poll(() => size.innerText()).toMatch(/xl/)
  })
})

describe('the deployed site', { timeout: 300_000 }, () => {
  const studio = useStudio(() =>
    startStaticSite('/', studioEnv(prototypesWithAdasExperiment().folder)),
  )

  test('[LAB-DK-03] the panel shows and moves the preview, without Save', async () => {
    const page = await studio.open(`${rounderPage}?view=component`)
    await visible(control(page, 'Corners'))
    await choose(page, 'Corners', 'lg · 8 px')
    await expect.poll(() => radius(page)).toBe('8px')
    await visible(
      toolbar(page).getByRole('button', { name: 'Discard unsaved changes' }),
    )
    expect(
      await toolbar(page).getByRole('button', { name: /^Save/ }).count(),
    ).toBe(0)
  })
})
