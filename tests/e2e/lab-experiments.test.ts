// The Lab's Experiments tab: a designer opens a component's Experiments and
// sees everyone's experiments with it, each with its live preview, name,
// maker and date. Locally, someone registered starts one with New
// experiment, which makes their "<Component> experiments" prototype the
// first time and opens the experiment, rendering like the Playground;
// Duplicate copies a colleague's into their own; Open as view reaches its
// page in its prototype. Someone who hasn't joined is told how, and the
// deployed site lists experiments without New experiment or Duplicate. The
// real Endless Studios system, with Ada's "Button experiments" prototype on
// a disposable prototypes folder, as Ben.
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
import type { Locator, Page } from 'playwright'
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
const TANGLED = 'adatng0000000001'
const posix = (file: string) => file.split(path.sep).join('/')
mkdirSync('.e2e', { recursive: true })
const folders: string[] = []

// A prototypes folder holding only Ada's experiment.
function prototypesWithAdasExperiment() {
  const folder = mkdtempSync(path.join('.e2e', 'lab-experiments-'))
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
  writeFileSync(
    path.join(dir, 'Rounder.vue'),
    `<!-- @studio-id ${ROUNDER} -->
<!-- @lab-experiment ${ENDLESS_STUDIOS} button 2026-11-10 -->
<template>
  <div class="flex min-h-40 flex-wrap items-center justify-center gap-3 p-6">
    <UButton class="rounded-full">Invite the team</UButton>
  </div>
</template>
`,
  )
  return folder
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
const card = (page: Page, name: string): Locator =>
  page
    .locator('[data-experiment]')
    .filter({ has: page.getByRole('link', { name, exact: true }) })
const preview = (scope: Page | Locator, title: string) =>
  scope.frameLocator(`iframe[title="${title}"]`)
const button = (scope: Page | Locator, name: string) =>
  scope.getByRole('button', { name, exact: true })
// An experiment's page shows its Breakdown, the root card live.
const stagePreview = (page: Page, title: string) =>
  preview(page.locator('[data-lab-experiment-stage]'), `${title} broken down`)

// Starts the studio once for a block, warmed up on the Experiments tab.
function useStudio(start: () => Promise<RunningStudio>) {
  const newPage = useBrowser()
  const running: { studio?: RunningStudio } = {}
  beforeAll(async () => {
    running.studio = await start()
    const page = await newPage()
    await page.goto(`${running.studio.url}${experiments}`)
    await preview(page, 'Rounder')
      .getByText('Invite the team')
      .waitFor({ timeout: 300_000 })
    await page.close()
  }, 900_000)
  afterAll(async () => {
    await running.studio?.stop()
  })
  return { newPage, url: () => running.studio!.url }
}

function listedScenarios({ newPage, url }: ReturnType<typeof useStudio>) {
  const studio = {
    get url() {
      return url()
    },
  }

  test('[LAB-41] lists Ada’s experiment with its live preview, name, maker and date', async () => {
    const page = await newPage()
    await page.goto(`${studio.url}${experiments}`)
    const rounder = card(page, 'Rounder')
    await visible(preview(rounder, 'Rounder').getByText('Invite the team'))
    await visible(rounder.getByText('Ada Lovelace'))
    await visible(rounder.getByText('Nov 10, 2026'))
    expect(await page.title()).toContain('Experiments — Button — Lab')
    await visible(
      page
        .getByRole('navigation', { name: 'Component tabs' })
        .getByRole('link', { name: 'Experiments', exact: true }),
    )
  })

  test('[LAB-41] an experiment opens at its own address, and Open as view reaches its prototype', async () => {
    const page = await newPage()
    await page.goto(`${studio.url}${experiments}`)
    await card(page, 'Rounder')
      .getByRole('link', { name: 'Rounder', exact: true })
      .click()
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toBe(`/${experiments}/${ROUNDER}`)
    await visible(stagePreview(page, 'Rounder').getByText('Invite the team'))
    await expect
      .poll(() => page.title())
      .toContain('Rounder — Experiments — Button — Lab')
    expect(
      await page
        .getByRole('link', { name: 'Experiments', exact: true })
        .getAttribute('aria-current'),
    ).toBe('page')
    await page.getByRole('link', { name: 'Open as view', exact: true }).click()
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toBe(`/prototypes/${ADA_PROTOTYPE}/artifacts/${ROUNDER}`)
  })

  test('[LAB-41] an address naming no experiment is not found, with the way back', async () => {
    const page = await newPage()
    await page.goto(`${studio.url}${experiments}/zzzz000000000000`)
    await visible(page.getByText('Page not found'))
    await page.getByRole('link', { name: 'All experiments' }).click()
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toBe(`/${experiments}`)
  })
}

describe('in the studio running locally, as Ben', { timeout: 180_000 }, () => {
  const folder = prototypesWithAdasExperiment()
  const ben = path.join(folder, 'ben')
  const running = useStudio(() =>
    startDevServer(studioEnv(folder, 'ben@endless.example')),
  )
  listedScenarios(running)
  const { newPage } = running
  const studio = {
    get url() {
      return running.url()
    },
  }

  async function name(page: Page, text: string, submit: string) {
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('textbox').fill(text)
    await button(dialog, submit).click()
  }

  test('[LAB-42] New experiment makes Ben’s “Button experiments” prototype once and opens a view that renders like the Playground', async () => {
    const page = await newPage()
    await page.goto(`${studio.url}${experiments}`)
    await button(page, 'New experiment').click()
    await name(page, 'Softer corners', 'Create experiment')
    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 60_000 })
      .toMatch(new RegExp(`^/${experiments}/[0-9a-z]{16}$`))
    const stage = page.locator('[data-lab-experiment-stage]')
    // The Default example's button, centred on a stage as tall as the
    // Playground's.
    await visible(
      stagePreview(page, 'Softer corners').getByText('Invite Learners'),
    )
    const root = stage.locator('iframe[title="Softer corners broken down"]')
    const frame = await root.boundingBox()
    const inside = await stagePreview(page, 'Softer corners')
      .getByText('Invite Learners')
      .boundingBox()
    // Its own height, whatever the canvas's zoom.
    expect(
      await root.evaluate((element) => (element as HTMLElement).offsetHeight),
    ).toBeGreaterThanOrEqual(160)
    expect(
      Math.abs(inside!.x + inside!.width / 2 - (frame!.x + frame!.width / 2)),
    ).toBeLessThan(4)
    expect(readdirSync(ben)).toEqual(['button-experiments'])
    expect(readdirSync(path.join(ben, 'button-experiments')).sort()).toEqual([
      'Softer corners.vue',
      'meta.json',
    ])

    await page.goto(`${studio.url}${experiments}`)
    await button(page, 'New experiment').click()
    await name(page, 'Bolder', 'Create experiment')
    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 60_000 })
      .not.toBe(`/${experiments}`)
    expect(readdirSync(ben)).toEqual(['button-experiments'])
    expect(readdirSync(path.join(ben, 'button-experiments')).sort()).toEqual([
      'Bolder.vue',
      'Softer corners.vue',
      'meta.json',
    ])
    await page.goto(`${studio.url}${experiments}`)
    for (const listed of ['Softer corners', 'Bolder', 'Rounder'])
      await visible(card(page, listed))
    await visible(card(page, 'Bolder').getByText('Ben Okafor'))
  })

  test('[LAB-42] a name Ben already uses is refused in the dialog', async () => {
    const page = await newPage()
    await page.goto(`${studio.url}${experiments}`)
    await button(page, 'New experiment').click()
    await name(page, 'Softer corners', 'Create experiment')
    await visible(
      page
        .getByRole('dialog')
        .getByText(
          'You already have an experiment named “Softer corners”. Choose a different name.',
        ),
    )
  })

  test('[LAB-44] Duplicate copies Ada’s experiment into Ben’s own and opens the copy', async () => {
    const page = await newPage()
    await page.goto(`${studio.url}${experiments}`)
    await button(card(page, 'Rounder'), 'Duplicate Rounder').click()
    await name(page, 'Rounder', 'Duplicate')
    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 60_000 })
      .toMatch(new RegExp(`^/${experiments}/(?!${ROUNDER})[0-9a-z]{16}$`))
    const copy = path.join(ben, 'button-experiments', 'Rounder.vue')
    await expect.poll(() => existsSync(copy)).toBe(true)
    expect(readFileSync(copy, 'utf8')).toContain(
      '<UButton class="rounded-full">Invite the team</UButton>',
    )
    expect(readFileSync(copy, 'utf8')).not.toContain(ROUNDER)
    await visible(page.getByText('Ben Okafor'))
    await visible(stagePreview(page, 'Rounder').getByText('Invite the team'))
  })
})

// Ada's experiment, and one of hers whose template can't be read.
function prototypesWithABrokenExperiment() {
  const folder = prototypesWithAdasExperiment()
  writeFileSync(
    path.join(folder, 'ada', 'button-experiments', 'Tangled.vue'),
    `<!-- @studio-id ${TANGLED} -->\n<!-- @lab-experiment ${ENDLESS_STUDIOS} button 2026-11-11 -->\n<template>\n  <div><UButton>Tangled</div>\n</template>\n`,
  )
  return folder
}

describe(
  'in the studio running locally, for someone who hasn’t joined',
  { timeout: 180_000 },
  () => {
    const { newPage, url } = useStudio(() =>
      startDevServer(
        studioEnv(
          prototypesWithABrokenExperiment(),
          'nobody@elsewhere.example',
        ),
      ),
    )
    const studio = {
      get url() {
        return url()
      },
    }

    test('[LAB-47] lists experiments, says to join first and offers neither New experiment nor Duplicate', async () => {
      const page = await newPage()
      await page.goto(`${studio.url}${experiments}`)
      await visible(
        page.getByText(
          'Join the studio to make experiments. Ask your agent to register you with yarn studio join.',
        ),
      )
      await visible(
        preview(card(page, 'Rounder'), 'Rounder').getByText('Invite the team'),
      )
      expect(await button(page, 'New experiment').count()).toBe(0)
      expect(await button(page, 'Duplicate Rounder').count()).toBe(0)
    })

    test('[LAB-47] the Breakdown says why Save as experiment is unavailable', async () => {
      const page = await newPage()
      await page.goto(`${studio.url}lab/${ENDLESS_STUDIOS}/button/breakdown`)
      await visible(
        page
          .getByRole('note')
          .getByText(
            'Join the studio to make experiments. Ask your agent to register you with yarn studio join.',
          ),
      )
    })

    test('[LAB-17] an experiment whose structure can’t be read says so, with Try again', async () => {
      const page = await newPage()
      await page.goto(`${studio.url}${experiments}/${TANGLED}`)
      const alert = page
        .getByRole('region', { name: 'Tangled in the Lab' })
        .getByRole('alert')
      await visible(
        alert.getByText('Breakdown can’t read how Tangled is built.'),
      )
      await visible(alert.getByText(/Tangled\.vue/))
      await button(alert, 'Try again').click()
      await visible(
        alert.getByText('Breakdown can’t read how Tangled is built.'),
      )
    })
  },
)

describe('the deployed site', { timeout: 180_000 }, () => {
  const running = useStudio(() =>
    startStaticSite('/', studioEnv(prototypesWithAdasExperiment())),
  )
  listedScenarios(running)
  const { newPage } = running
  const studio = {
    get url() {
      return running.url()
    },
  }

  test('[LAB-45] lists experiments without New experiment or Duplicate', async () => {
    const page = await newPage()
    await page.goto(`${studio.url}${experiments}`)
    await visible(
      preview(card(page, 'Rounder'), 'Rounder').getByText('Invite the team'),
    )
    await visible(card(page, 'Rounder').getByText('Open as view'))
    expect(await button(page, 'New experiment').count()).toBe(0)
    expect(await button(page, 'Duplicate Rounder').count()).toBe(0)
    expect(await page.getByText(/Join the studio/).count()).toBe(0)
  })
})
