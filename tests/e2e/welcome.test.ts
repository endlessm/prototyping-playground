import fs from 'node:fs'
import path from 'node:path'
import type { Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import { startDevServer, type RunningStudio } from './setup/studio'

// The welcome on Home, for Ada, with the real modules and configuration
// (the welcome is on) and a copy of the fixture profiles.
fs.mkdirSync('.e2e', { recursive: true })
const root = fs.mkdtempSync(path.resolve('.e2e/welcome-'))
const people = path.join(root, 'contributors')
fs.cpSync('tests/fixtures/contributors', people, { recursive: true })
const adaFile = path.join(people, 'ada.json')
const original = JSON.parse(fs.readFileSync(adaFile, 'utf8'))
const ada = () => JSON.parse(fs.readFileSync(adaFile, 'utf8'))
const setAda = (changes: object) =>
  fs.writeFileSync(
    adaFile,
    `${JSON.stringify({ ...original, ...changes }, null, 2)}\n`,
  )
const dismissed = (value: boolean) =>
  setAda({ preferences: { onboarding: { welcomeDismissed: value } } })

const CLAIM = '_studio/modules/onboarding/claim'
const newPage = useBrowser()
let studio: RunningStudio
beforeAll(async () => {
  dismissed(false)
  studio = await startDevServer({
    STUDIO_CONTRIBUTORS: people,
    STUDIO_GITHUB: '',
    GIT_CONFIG_COUNT: '2',
    GIT_CONFIG_KEY_0: 'user.email',
    GIT_CONFIG_VALUE_0: 'ada@endless.example',
    GIT_CONFIG_KEY_1: 'user.name',
    GIT_CONFIG_VALUE_1: 'Ada Lovelace',
  })
}, 600_000)
afterAll(async () => {
  await studio?.stop()
  fs.rmSync(root, { recursive: true, force: true })
})

// Named by the step's title, which changes as you go.
const dialog = (page: Page) => page.getByRole('dialog')
/** Opens Home and waits until the studio has answered whether to welcome. */
async function openHome(page: Page) {
  const claimed = page.waitForResponse((response) =>
    response.url().endsWith(CLAIM),
  )
  await page.goto(studio.url)
  return claimed
}
const progress = (page: Page) =>
  page.getByRole('progressbar', { name: 'Introduction progress' })
const button = (page: Page, name: string) =>
  page.getByRole('button', { name, exact: true })

describe('the welcome', () => {
  test('[SH-130] [SH-134] opens over Home on the first visit, only once the identity is known, and records it on the profile', async () => {
    const page = await newPage()
    // Hold back who you are for a while: nothing is claimed meanwhile.
    let identityAnswered = 0
    await page.route(`**/_studio/me`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000))
      identityAnswered = Date.now()
      await route.continue()
    })
    const claims: number[] = []
    page.on('request', (request) => {
      if (request.url().endsWith(CLAIM)) claims.push(Date.now())
    })
    const claimed = await openHome(page)
    expect((await claimed).status()).toBe(200)
    expect(claims).toHaveLength(1)
    expect(identityAnswered).toBeGreaterThan(0)
    expect(claims[0]).toBeGreaterThanOrEqual(identityAnswered)
    await expect
      .poll(() =>
        page
          .getByRole('dialog', { name: 'Welcome to Endless Design Studio' })
          .isVisible(),
      )
      .toBe(true)
    expect(ada()).toEqual({
      ...original,
      preferences: { onboarding: { welcomeDismissed: true } },
    })

    // Another browser, or a reload, doesn't show it again.
    const other = await newPage()
    expect(await (await openHome(other)).json()).toEqual({ show: false })
    await expect
      .poll(() =>
        other
          .getByRole('heading', { level: 1, name: 'Welcome back, Ada' })
          .isVisible(),
      )
      .toBe(true)
    expect(await dialog(other).count()).toBe(0)
  }, 300_000)

  test('[SH-131] [SH-134] steps with a progress indicator, Back and Next, and Skip; the flag set back to false shows it again', async () => {
    dismissed(false)
    const page = await newPage()
    await openHome(page)
    await expect.poll(() => dialog(page).isVisible()).toBe(true)
    expect(await progress(page).getAttribute('aria-valuetext')).toBe(
      'Welcome to Endless Design Studio',
    )
    expect(await button(page, 'Back').count()).toBe(0)
    await button(page, 'Show me around').click()
    await expect
      .poll(() => progress(page).getAttribute('aria-valuetext'))
      .toBe('Built from Endless Studios screens')
    expect(await progress(page).getAttribute('aria-valuenow')).toBe('2')
    await button(page, 'Back').click()
    await expect
      .poll(() => progress(page).getAttribute('aria-valuenow'))
      .toBe('1')
    await button(page, 'Show me around').click()
    const titles: string[] = []
    while (await button(page, 'Next').count()) {
      titles.push((await progress(page).getAttribute('aria-valuetext'))!)
      await button(page, 'Next').click()
    }
    titles.push((await progress(page).getAttribute('aria-valuetext'))!)
    expect(titles).toEqual([
      'Built from Endless Studios screens',
      'Lay it out on a canvas',
      'Ask your agent',
      'Start exploring',
    ])
    expect(await progress(page).getAttribute('aria-valuemax')).toBe('5')
    await button(page, 'Explore my studio').click()
    await expect.poll(() => dialog(page).count()).toBe(0)

    // Skip, Escape and a click outside all finish it too.
    for (const finish of ['skip', 'escape', 'outside'] as const) {
      dismissed(false)
      const next = await newPage()
      await openHome(next)
      await expect.poll(() => dialog(next).isVisible()).toBe(true)
      if (finish === 'skip') await button(next, 'Skip introduction').click()
      else if (finish === 'escape') await next.keyboard.press('Escape')
      else await next.mouse.click(5, 5)
      await expect.poll(() => dialog(next).count()).toBe(0)
      expect(ada().preferences.onboarding.welcomeDismissed).toBe(true)
    }
  }, 300_000)

  test('[SH-134] before registration, the browser remembers it instead', async () => {
    // An email that matches nobody: the studio doesn't know who you are.
    setAda({ email: 'someone-else@endless.example', preferences: {} })
    try {
      const page = await newPage()
      await expect
        .poll(async () => (await openHome(page)).json(), { timeout: 30_000 })
        .toEqual({ show: null })
      await expect.poll(() => dialog(page).isVisible()).toBe(true)
      await button(page, 'Skip introduction').click()
      await expect.poll(() => dialog(page).count()).toBe(0)
      await openHome(page)
      await expect
        .poll(() =>
          page
            .getByRole('heading', { level: 1, name: 'Endless Design Studio' })
            .isVisible(),
        )
        .toBe(true)
      expect(await dialog(page).count()).toBe(0)
      // The profile is untouched.
      expect(ada().preferences).toEqual({})
    } finally {
      dismissed(true)
    }
  }, 300_000)
})
