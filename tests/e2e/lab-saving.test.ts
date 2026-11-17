// Saving a Breakdown: an experiment opens in the Lab with its own Breakdown,
// the tree read from its file, and Save writes the knobs' changes into that
// file as plain theme classes, the count clearing and the Breakdown
// following the file. A file changed on disk since the changes began is
// refused with a clear message; leaving with unsaved changes asks first.
// Someone else's experiment saves as a copy of your own (Save as my
// experiment) and the original component as a new experiment (Save as
// experiment). The deployed site shows the experiment's Breakdown without
// Save. The real Endless Studios system, with Ada's "Button experiments"
// prototype on a disposable prototypes folder.
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import type { FrameLocator, Locator, Page } from 'playwright'
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
mkdirSync('.e2e', { recursive: true })
const folders: string[] = []

// A prototypes folder holding only Ada's experiment.
function prototypesWithAdasExperiment() {
  const folder = mkdtempSync(path.join('.e2e', 'lab-saving-'))
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
  return { folder, rounder: path.join(dir, 'Rounder.vue') }
}
const studioEnv = (folder: string, email?: string) => ({
  STUDIO_PROTOTYPES: posix(folder),
  STUDIO_CONTRIBUTORS: 'tests/fixtures/contributors',
  STUDIO_GITHUB: '',
  ...(email && {
    GIT_CONFIG_COUNT: '2',
    GIT_CONFIG_KEY_0: 'user.name',
    GIT_CONFIG_VALUE_0: 'Someone',
    GIT_CONFIG_KEY_1: 'user.email',
    GIT_CONFIG_VALUE_1: email,
  }),
})

afterAll(() => {
  for (const folder of folders) rmSync(folder, { recursive: true, force: true })
})

async function visible(locator: { isVisible: () => Promise<boolean> }) {
  await expect.poll(() => locator.isVisible(), { timeout: 60_000 }).toBe(true)
}
const experiments = `lab/${ENDLESS_STUDIOS}/button/experiments`
const rounderPage = `${experiments}/${ROUNDER}`
const card = (page: Page, id: string) =>
  page.locator(`[data-breakdown-card][data-breakdown-node="${id}"]`)
const rootFrame = (page: Page): FrameLocator =>
  card(page, 'root').locator('iframe[data-preview-frame]').contentFrame()
const piece = (page: Page, id = BUTTON) =>
  rootFrame(page).locator(`[data-lab-node~="${id}"]`).first()
const radius = (page: Page) =>
  piece(page)
    .evaluate((element) => getComputedStyle(element).borderTopLeftRadius)
    .catch(() => null)
const toolbar = (page: Page) =>
  page.getByRole('toolbar', { name: 'Canvas tools' })
const knob = (page: Page, name: string) =>
  toolbar(page).getByRole('spinbutton', { name, exact: true })
const saveButton = (page: Page, name: RegExp) =>
  toolbar(page).getByRole('button', { name })
const button = (scope: Page | Locator, name: string) =>
  scope.getByRole('button', { name, exact: true })

// Starts the studio once for a block, warmed up on Ada's experiment.
function useStudio(start: () => Promise<RunningStudio>) {
  const newPage = useBrowser()
  const running: { studio?: RunningStudio } = {}
  beforeAll(async () => {
    running.studio = await start()
    const page = await newPage()
    await page.goto(`${running.studio.url}${rounderPage}`)
    await rootFrame(page)
      .getByText('Invite the team')
      .waitFor({ timeout: 300_000 })
    await page.close()
  }, 900_000)
  afterAll(async () => {
    await running.studio?.stop()
  })
  return {
    newPage,
    url: () => running.studio!.url,
    async open(address: string, shown = BUTTON) {
      const page = await newPage()
      await page.setViewportSize({ width: 1440, height: 1000 })
      await page.bringToFront()
      await page.goto(`${running.studio!.url}${address}`)
      await visible(piece(page, shown))
      return page
    },
  }
}
async function select(page: Page, id: string) {
  await card(page, id).locator('button').click()
  await expect
    .poll(() => card(page, id).locator('button').getAttribute('aria-pressed'))
    .toBe('true')
}
// The corners knob one step down the scale, once it reads the piece's
// classes.
async function stepCornersDown(page: Page, from?: string) {
  await select(page, BUTTON)
  const value = expect.poll(() => knob(page, 'Corners').inputValue(), {
    timeout: 60_000,
  })
  await (from ? value.toBe(from) : value.not.toBe(''))
  await knob(page, 'Corners').focus()
  await page.keyboard.press('ArrowLeft')
}
// Rounder's full rounding to 3xl.
async function softenCorners(page: Page) {
  await stepCornersDown(page, 'full')
  await expect.poll(() => radius(page)).toBe('24px')
}

describe('in the studio running locally, as Ada', { timeout: 300_000 }, () => {
  const { folder, rounder } = prototypesWithAdasExperiment()
  const studio = useStudio(() =>
    startDevServer(studioEnv(folder, 'ada@endless.example')),
  )

  test('[LAB-SV-05] an experiment opens in Breakdown with its own file’s tree', async () => {
    const page = await studio.open(rounderPage)
    await visible(card(page, BUTTON))
    await visible(card(page, `${BUTTON}#base`))
    // Its own class: fully rounded.
    expect(Number.parseFloat((await radius(page))!)).toBeGreaterThan(100)
    await visible(card(page, 'root').getByText('Rounder', { exact: true }))
  })

  test('[LAB-SV-01] Save writes the classes into the experiment’s file, the count clears and the Breakdown follows the file', async () => {
    const page = await studio.open(rounderPage)
    await softenCorners(page)
    const save = saveButton(page, /^Save/)
    await expect
      .poll(() => save.getAttribute('aria-label'))
      .toBe('Save, 1 unsaved change')
    await save.click()
    await visible(page.getByText('Saved 1 change').first())
    await expect
      .poll(() => readFileSync(rounder, 'utf8'))
      .toContain('<UButton class="rounded-3xl">Invite the team</UButton>')
    await expect.poll(() => save.getAttribute('aria-label')).toBe('Save')
    // No change is pending, and the preview renders the file's new class.
    await expect.poll(() => radius(page), { timeout: 60_000 }).toBe('24px')
    expect(await knob(page, 'Corners').inputValue()).toBe('24')
  })

  test('[LAB-SV-03] a file changed on disk since the changes began is refused, the Breakdown following the edit', async () => {
    const page = await studio.open(rounderPage)
    await stepCornersDown(page)
    await expect
      .poll(() => saveButton(page, /^Save/).getAttribute('aria-label'))
      .toBe('Save, 1 unsaved change')
    const edited = readFileSync(rounder, 'utf8').replace(
      'Invite the team',
      'Invite everyone',
    )
    writeFileSync(rounder, edited)
    // The Breakdown follows the edit on disk.
    await visible(rootFrame(page).getByText('Invite everyone'))
    await saveButton(page, /^Save/).click()
    await visible(
      page.getByText(/This file changed on disk since you opened it\./).first(),
    )
    expect(readFileSync(rounder, 'utf8')).toBe(edited)
    await button(toolbar(page), 'Discard unsaved changes').click()
  })

  test('[LAB-SV-04] leaving with unsaved changes asks first', async () => {
    const page = await studio.open(rounderPage)
    await stepCornersDown(page)
    await expect
      .poll(() => saveButton(page, /^Save/).getAttribute('aria-label'))
      .toBe('Save, 1 unsaved change')
    await page.getByRole('link', { name: 'All experiments' }).click()
    const dialog = page.getByRole('dialog', {
      name: 'Discard unsaved changes?',
    })
    await visible(dialog)
    await button(dialog, 'Keep editing').click()
    await expect.poll(() => dialog.count()).toBe(0)
    expect(new URL(page.url()).pathname).toBe(`/${rounderPage}`)
    // Switching the canvas to the component alone stays on the page.
    await button(toolbar(page), 'Show component').click()
    await expect
      .poll(() => new URL(page.url()).searchParams.get('view'))
      .toBe('component')
    expect(await dialog.count()).toBe(0)

    await page.getByRole('link', { name: 'All experiments' }).click()
    await button(dialog, 'Discard and leave').click()
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toBe(`/${experiments}`)
  })
})

describe('in the studio running locally, as Ben', { timeout: 300_000 }, () => {
  const { folder, rounder } = prototypesWithAdasExperiment()
  const ben = path.join(folder, 'ben', 'button-experiments')
  const studio = useStudio(() =>
    startDevServer(studioEnv(folder, 'ben@endless.example')),
  )
  async function name(page: Page, text: string) {
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('textbox').fill(text)
    await button(dialog, 'Save experiment').click()
  }

  test('[LAB-SV-02] Save as my experiment copies Ada’s into Ben’s own with the changes, hers untouched', async () => {
    const page = await studio.open(rounderPage)
    await softenCorners(page)
    const save = saveButton(page, /^Save as my experiment/)
    await expect
      .poll(() => save.getAttribute('aria-label'))
      .toBe('Save as my experiment, 1 unsaved change')
    await save.click()
    await name(page, 'Rounder, softer')
    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 60_000 })
      .toMatch(new RegExp(`^/${experiments}/(?!${ROUNDER})[0-9a-z]{16}$`))
    const copy = path.join(ben, 'Rounder, softer.vue')
    await expect.poll(() => existsSync(copy)).toBe(true)
    expect(readFileSync(copy, 'utf8')).toContain(
      '<UButton class="rounded-3xl">Invite the team</UButton>',
    )
    expect(readFileSync(rounder, 'utf8')).toBe(ROUNDER_SOURCE)
    // Ben's own copy saves into its file.
    await visible(piece(page))
    await expect.poll(() => radius(page), { timeout: 60_000 }).toBe('24px')
    await select(page, BUTTON)
    await expect
      .poll(() => saveButton(page, /^Save/).getAttribute('aria-label'))
      .toBe('Save')
  })

  test('[LAB-SV-02] Save as experiment on the original makes Ben’s experiment with the changes', async () => {
    const page = await studio.open(`lab/${ENDLESS_STUDIOS}/button/breakdown`)
    await select(page, BUTTON)
    await expect
      .poll(() => knob(page, 'Corners').inputValue(), { timeout: 60_000 })
      .toBe('6')
    await knob(page, 'Corners').focus()
    await page.keyboard.press('ArrowRight')
    await saveButton(page, /^Save as experiment/).click()
    await name(page, 'Rounder corners')
    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 60_000 })
      .toMatch(new RegExp(`^/${experiments}/[0-9a-z]{16}$`))
    const made = path.join(ben, 'Rounder corners.vue')
    await expect.poll(() => existsSync(made)).toBe(true)
    expect(readFileSync(made, 'utf8')).toMatch(
      /<UButton :ui="\{ base: 'rounded-lg' \}">Invite Learners<\/UButton>/,
    )
    expect(readdirSync(ben)).toContain('Rounder corners.vue')
  })

  test('[LAB-SV-02] Save as experiment on the input writes every change into the new experiment', async () => {
    const field = 'root>UFormField'
    const input = 'root>UFormField/UInput'
    const page = await studio.open(
      `lab/${ENDLESS_STUDIOS}/input/breakdown`,
      input,
    )
    async function stepUp(id: string, name: string, from: string) {
      await select(page, id)
      await expect
        .poll(() => knob(page, name).inputValue(), { timeout: 60_000 })
        .toBe(from)
      await knob(page, name).focus()
      await page.keyboard.press('ArrowRight')
    }
    await stepUp(input, 'Corners', '6')
    await stepUp(field, 'Label weight', '500')
    const save = saveButton(page, /^Save as experiment/)
    await expect
      .poll(() => save.getAttribute('aria-label'))
      .toBe('Save as experiment, 2 unsaved changes')
    await save.click()
    await name(page, 'Rounder field')
    await visible(page.getByText('Saved 2 changes').first())
    const made = path.join(
      folder,
      'ben',
      'input-experiments',
      'Rounder field.vue',
    )
    await expect.poll(() => existsSync(made)).toBe(true)
    const source = readFileSync(made, 'utf8')
    expect(source).toContain(
      `<UFormField :ui="{ label: 'font-semibold' }" label="Cohort name"`,
    )
    expect(source).toContain(
      `<UInput :ui="{ base: 'rounded-lg' }" v-model="name"`,
    )
    // The new experiment opens with the changes in its own file.
    await visible(piece(page, input))
    await select(page, input)
    await expect
      .poll(() => knob(page, 'Corners').inputValue(), { timeout: 60_000 })
      .toBe('8')
    await expect
      .poll(() => saveButton(page, /^Save/).getAttribute('aria-label'))
      .toBe('Save')
  })
})

describe('the deployed site', { timeout: 300_000 }, () => {
  const studio = useStudio(() =>
    startStaticSite('/', studioEnv(prototypesWithAdasExperiment().folder)),
  )

  test('[LAB-SV-05] an experiment’s Breakdown shows its tree and live knobs, without Save', async () => {
    const page = await studio.open(rounderPage)
    await visible(card(page, BUTTON))
    await softenCorners(page)
    await visible(button(toolbar(page), 'Discard unsaved changes'))
    expect(await saveButton(page, /^Save/).count()).toBe(0)
    expect(await button(page, 'New experiment').count()).toBe(0)
  })
})
