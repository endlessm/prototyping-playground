// Endless Studios screens with their system options: a view declares the
// locale, the signed-in user and sample data in `export const system`, and
// each named state overrides them. The studio runs as Ada on a disposable
// copy of tests/fixtures/endless-studios-screens inside the checkout
// (preview documents serve files from the checkout only).
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
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

mkdirSync('.e2e', { recursive: true })
const content = mkdtempSync(path.join('.e2e', 'es-screens-'))
cpSync('tests/fixtures/endless-studios-screens', content, { recursive: true })
const folder = path.join(content, 'ada', 'screens')
const env = {
  STUDIO_PROTOTYPES: content.split(path.sep).join('/'),
  STUDIO_CONTRIBUTORS: 'tests/fixtures/contributors',
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'user.name',
  GIT_CONFIG_VALUE_0: 'Ada Lovelace',
  GIT_CONFIG_KEY_1: 'user.email',
  GIT_CONFIG_VALUE_1: 'ada@endless.example',
  STUDIO_GITHUB: '',
}

const SCREENS = 'scrn00000000e001'
const DASHBOARD = 'dsbd00000000e001'
const SPANISH = 'st5p00000000e001'
const SIGNED_OUT = 'st5g00000000e001'
const NO_EVENTS = 'st5e00000000e001'
const IN_THE_APP = 'st5a00000000e001'
const IN_THE_APP_SIGNED_OUT = 'st5s00000000e001'

const address = (studio: RunningStudio, artifact: string) =>
  `${studio.url}prototypes/${SCREENS}/artifacts/${artifact}`
const view = (page: Page): FrameLocator =>
  page.locator('iframe[data-preview-frame]').contentFrame()
const host = (page: Page) => page.locator('[data-preview-session]')

async function ready(page: Page) {
  await expect
    .poll(() => host(page).getAttribute('data-preview-state'), {
      timeout: 120_000,
    })
    .toBe('ready')
}
async function sees(frame: FrameLocator, text: string, timeout = 60_000) {
  await expect
    .poll(() => frame.getByText(text, { exact: true }).isVisible(), {
      timeout,
    })
    .toBe(true)
}
/** The Endless Studios stand-ins' console reports, from every frame. */
function reports(page: Page) {
  const lines: string[] = []
  page.on('console', (message) => {
    if (message.text().includes('[Endless Studios]')) lines.push(message.text())
  })
  return lines
}

function sharedScenarios(
  studio: () => RunningStudio,
  newPage: () => Promise<Page>,
) {
  test('[SY-173] [SY-179] [SY-180] [SY-181] a view renders with the options it declares', async () => {
    const page = await newPage()
    await page.goto(address(studio(), DASHBOARD))
    await ready(page)
    const screen = view(page)
    await sees(screen, 'Welcome Back!')
    await sees(screen, 'User: Alex')
    await sees(screen, 'Unread: 5')
    await sees(screen, 'Note: none')
    await sees(screen, 'Game jam kickoff')
  }, 180_000)

  test('[SY-173] [SY-178] [SY-179] [SY-181] each state overrides the view’s options and keeps the others', async () => {
    const page = await newPage()
    await page.goto(address(studio(), SPANISH))
    await ready(page)
    await sees(view(page), '¡Bienvenido de nuevo!')
    await sees(view(page), 'User: Ana')
    await sees(view(page), 'Note: From a state')
    // The view's sample, which this state doesn't override.
    await sees(view(page), 'Game jam kickoff')
    await sees(view(page), 'Unread: 5')

    await page.goto(address(studio(), SIGNED_OUT))
    await ready(page)
    await sees(view(page), 'User: nobody')
    await sees(view(page), 'Welcome Back!')

    await page.goto(address(studio(), NO_EVENTS))
    await ready(page)
    await sees(view(page), 'User: Alex')
    await sees(view(page), 'No Upcoming Events')
    await sees(view(page), 'Unread: 0')
  })

  test('[SY-177] a link in a copied component stays on the screen and logs where it goes', async () => {
    const page = await newPage()
    const lines = reports(page)
    await page.goto(address(studio(), DASHBOARD))
    await ready(page)
    const runtime = await view(page)
      .locator('html')
      .getAttribute('data-preview-runtime')
    await view(page).getByRole('link', { name: 'Game jam kickoff' }).click()
    await expect
      .poll(() => lines.some((line) => line.includes('/live-event/9/')))
      .toBe(true)
    expect(page.url()).toBe(address(studio(), DASHBOARD))
    expect(
      await view(page).locator('html').getAttribute('data-preview-runtime'),
    ).toBe(runtime)
    await sees(view(page), 'Game jam kickoff')
  })

  test('[SY-185] gaps are reported once and the screen keeps rendering', async () => {
    const page = await newPage()
    const lines = reports(page)
    await page.goto(address(studio(), DASHBOARD))
    await ready(page)
    await sees(view(page), 'Missing: no_such.key no_such.key')
    await expect
      .poll(() => lines.filter((line) => line.includes('no_such.key')).length)
      .toBe(1)
    expect(
      lines.filter((line) => line.includes('"loadDashboard"')),
    ).toHaveLength(1)
  })

  test('[SY-184] [SY-195] the app shell option shows the screen inside the app’s sidebar, top bar and footer, with the app’s images', async () => {
    const page = await newPage()
    await page.goto(address(studio(), IN_THE_APP))
    await ready(page)
    const screen = view(page)
    await sees(screen, 'Welcome Back!')
    await expect
      .poll(() => screen.getByText(/All rights reserved/).isVisible())
      .toBe(true)
    await expect
      .poll(() =>
        screen
          .getByRole('link', { name: 'Community', exact: true })
          .isVisible(),
      )
      .toBe(true)
    // The top bar's, sidebar's and footer's logos come from template
    // `src="~/assets/…"` URLs; the avatar from a script import.
    await expect
      .poll(() =>
        screen
          .locator('img[alt="Endless Studios"], img[alt="Profile"]')
          .evaluateAll((images) =>
            (images as HTMLImageElement[]).map(
              (image) => image.complete && image.naturalWidth > 0,
            ),
          ),
      )
      .toEqual([true, true, true, true, true])

    // Without the option, the screen stands alone.
    await page.goto(address(studio(), DASHBOARD))
    await ready(page)
    await sees(view(page), 'Welcome Back!')
    expect(
      await view(page)
        .getByText(/All rights reserved/)
        .count(),
    ).toBe(0)
  })

  test('[SY-184] signed out, the app shell shows the sign-up state', async () => {
    const page = await newPage()
    await page.goto(address(studio(), IN_THE_APP_SIGNED_OUT))
    await ready(page)
    await sees(view(page), 'User: nobody')
    await expect
      .poll(() =>
        view(page)
          .getByRole('button', { name: 'Sign up' })
          .filter({ visible: true })
          .count(),
      )
      .toBeGreaterThan(0)
  })
}

describe('on the dev server', () => {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await startDevServer(env)
  })
  afterAll(async () => {
    await studio?.stop()
  })

  sharedScenarios(() => studio, newPage)

  test('[SY-173] a changed option rebuilds the screen in place, while changed props update it without a rebuild', async () => {
    const file = path.join(folder, 'Dashboard.vue')
    const original = readFileSync(file, 'utf8')
    try {
      const page = await newPage()
      await page.goto(address(studio, SPANISH))
      await ready(page)
      await sees(view(page), 'User: Ana')
      const runtime = () =>
        view(page).locator('html').getAttribute('data-preview-runtime')
      const before = await runtime()
      await view(page).getByRole('button', { name: 'Count 0' }).click()
      await sees(view(page), 'Count 1')

      // Props: the screen's app, and the count it keeps, stay.
      writeFileSync(
        file,
        original.replace("note: 'From a state'", "note: 'Edited'"),
      )
      await sees(view(page), 'Note: Edited', 30_000)
      await sees(view(page), 'Count 1')

      // An option: the screen is built again, in the same document.
      writeFileSync(
        file,
        original
          .replace("note: 'From a state'", "note: 'Edited'")
          .replace("user: 'learner'", "user: 'mentor'"),
      )
      await sees(view(page), 'User: Marco', 30_000)
      await sees(view(page), 'Count 0')
      expect(await runtime()).toBe(before)

      // The view's own options reach the open view too.
      await page.goto(address(studio, DASHBOARD))
      await ready(page)
      await sees(view(page), 'User: Alex')
      writeFileSync(
        file,
        original.replace("user: 'admin'", "locale: 'es',\n  user: 'admin'"),
      )
      await sees(view(page), '¡Bienvenido de nuevo!', 30_000)
    } finally {
      writeFileSync(file, original)
    }
  }, 180_000)
})

describe('the static build', () => {
  const newPage = useBrowser()
  let site: RunningStudio
  beforeAll(async () => {
    site = await startStaticSite('/studio-screens/', env)
  })
  afterAll(async () => {
    await site?.stop()
  })

  sharedScenarios(() => site, newPage)
})
