import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import {
  afterAll,
  beforeAll,
  beforeEach,
  afterEach,
  expect,
  test,
} from 'vitest'
import type { Page } from 'playwright'
import { useBrowser } from './setup/browser'
import { startDevServer, type RunningStudio } from './setup/studio'
import { restartScript } from '../../tooling/settings/restart'

const newPage = useBrowser()
let page: Page
beforeEach(async () => {
  page = await newPage()
})
afterEach(async () => {
  await page?.context().close()
})
let server: RunningStudio
let configFile: string
beforeAll(async () => {
  mkdirSync('.e2e', { recursive: true })
  const folder = mkdtempSync(path.resolve('.e2e/settings-'))
  cpSync('tests/fixtures/contributors', path.join(folder, 'contributors'), {
    recursive: true,
  })
  configFile = path.join(folder, 'studio.config.json')
  const config = JSON.parse(readFileSync('studio.config.json', 'utf8'))
  config.admins = ['ada0000000000001']
  writeFileSync(configFile, JSON.stringify(config, null, 2))
  server = await startDevServer({
    STUDIO_CONFIG: configFile,
    STUDIO_CONTRIBUTORS: path.join(folder, 'contributors'),
    STUDIO_GITHUB: '',
    GIT_CONFIG_COUNT: '2',
    GIT_CONFIG_KEY_0: 'user.email',
    GIT_CONFIG_VALUE_0: 'ada@endless.example',
    GIT_CONFIG_KEY_1: 'user.name',
    GIT_CONFIG_VALUE_1: 'Ada Lovelace',
  })
}, 300000)

test('[SH-112] [SH-113] [SH-119] optional Manual toggles persist across restart while Context & Skills stays available', async () => {
  await page.goto(`${server.url}settings`)
  const manual = page.getByRole('switch', { name: 'Manual', exact: true })
  await expect.poll(() => manual.isVisible(), { timeout: 60000 }).toBe(true)
  const snapshot = await page.evaluate(async () =>
    (await fetch('/_studio/settings')).json(),
  )
  expect(
    snapshot.modules.find(
      (module: { id: string }) => module.id === 'documentation',
    ),
  ).toMatchObject({ required: false, enabled: true })
  expect(await manual.isEnabled()).toBe(true)
  for (const enabled of [false, true]) {
    const previous = await page.evaluate(async () =>
      (await fetch('/_studio/settings')).json(),
    )
    await manual.click()
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect
      .poll(
        async () => {
          const state = await page
            .evaluate(async () => (await fetch('/_studio/settings')).json())
            .catch(() => null)
          return (
            state?.instance !== previous.instance &&
            state?.config.modules.documentation === enabled
          )
        },
        { timeout: 120000 },
      )
      .toBe(true)
    await expect
      .poll(() => page.getByText('Applying changes', { exact: true }).count(), {
        timeout: 120000,
      })
      .toBe(0)
    await expect
      .poll(
        () =>
          manual
            .getAttribute('aria-checked', { timeout: 1000 })
            .catch(() => null),
        { timeout: 120000 },
      )
      .toBe(String(enabled))
      .catch(async (error) => {
        await page.screenshot({
          path: '.scratch/28-manual-restart-failed.png',
          fullPage: true,
        })
        writeFileSync(
          '.scratch/28-manual-restart-failed.html',
          await page.content(),
        )
        throw error
      })
    await page.goto(`${server.url}documentation`)
    await expect
      .poll(() => page.url(), { timeout: 30000 })
      .toContain(
        enabled ? '/documentation/manual' : '/documentation/context/platform',
      )
    await page.goto(`${server.url}settings`)
    await expect.poll(() => manual.isVisible(), { timeout: 60000 }).toBe(true)
  }
}, 360000)
afterAll(async () => {
  await server?.stop()
})

test('[SH-120] [SH-121] early cover blocks interaction and offers 15 and 30 second fallbacks', async () => {
  await page.goto(server.url)
  await page.clock.install()
  await page.route('**/_studio/settings', (route) =>
    route.fulfill({ status: 503, json: {} }),
  )
  await page.evaluate(() =>
    sessionStorage.setItem('design-studio:restart', 'old-instance'),
  )
  await page.addScriptTag({
    content: restartScript(
      {
        applying: 'Applying changes',
        preparing: 'Preparing',
        fallback: '15-second fallback',
        slow: '30-second fallback',
        reload: 'Reload studio',
      },
      '/',
    ),
  })
  expect(
    await page.getByText('Applying changes', { exact: true }).isVisible(),
  ).toBe(true)
  await page.clock.runFor(15500)
  expect(
    await page.getByText('15-second fallback', { exact: true }).isVisible(),
  ).toBe(true)
  await page.clock.runFor(15000)
  expect(
    await page.getByText('30-second fallback', { exact: true }).isVisible(),
  ).toBe(true)
  expect(
    await page.getByRole('button', { name: 'Reload studio' }).isVisible(),
  ).toBe(true)
})

test('[SH-104] [SH-107] [SH-108] [SH-109] [SH-111] [SH-112] [SH-113] [SH-115] [SH-116] [SH-118] settings editing, discard and leave guard', async () => {
  await page.goto(`${server.url}settings`)
  const name = page.getByRole('textbox', { name: 'Studio name' })
  await expect.poll(() => name.isVisible(), { timeout: 60000 }).toBe(true)
  expect(await page.getByText('Admin', { exact: true }).isVisible()).toBe(true)
  expect(
    await page
      .getByRole('link', {
        name: 'Manage people and permissions in Contributors.',
      })
      .isVisible(),
  ).toBe(true)
  expect(
    await page
      .getByText(
        'Existing prototypes keep their current system when you change this default.',
      )
      .isVisible(),
  ).toBe(true)
  expect(
    await page
      .getByText('Disabling a module keeps its files and content.')
      .isVisible(),
  ).toBe(true)
  expect(
    await page
      .getByRole('switch', { name: 'Contributors & Permissions' })
      .isDisabled(),
  ).toBe(true)
  expect(
    await page
      .getByRole('switch', { name: 'Diagrams', exact: true })
      .isVisible(),
  ).toBe(true)
  expect(
    await page
      .getByText('Text files are included with Systems.', { exact: true })
      .isVisible(),
  ).toBe(true)
  await name.fill('')
  expect(
    await page.getByRole('button', { name: 'Save changes' }).isDisabled(),
  ).toBe(true)
  await name.fill('Unsaved title')
  expect(
    await page
      .getByText('Unsaved changes. Saving restarts the studio.')
      .isVisible(),
  ).toBe(true)
  await page
    .getByRole('link', {
      name: 'Manage people and permissions in Contributors.',
    })
    .click()
  await expect.poll(() => page.getByRole('dialog').isVisible()).toBe(true)
  await page.getByRole('button', { name: 'Keep editing' }).click()
  await page.getByRole('button', { name: 'Discard', exact: true }).click()
  expect(await name.inputValue()).toBe('Endless Design Studio')
})

test('[SH-105] [SH-117] conflict disables saving until reload; failures can reload', async () => {
  await page.goto(`${server.url}settings`)
  const name = page.getByRole('textbox', { name: 'Studio name' })
  await expect.poll(() => name.isVisible(), { timeout: 60000 }).toBe(true)
  await name.fill('Stale title')
  await page.route('**/_studio/settings', async (route) => {
    if (route.request().method() === 'POST')
      await route.fulfill({
        status: 409,
        json: {
          error: 'Settings changed elsewhere. Reload settings before saving.',
        },
      })
    else await route.continue()
  })
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect
    .poll(() => page.getByRole('alert').textContent())
    .toContain('changed elsewhere')
  expect(
    await page.getByRole('button', { name: 'Save changes' }).isDisabled(),
  ).toBe(true)
  page.once('dialog', (dialog) => void dialog.accept())
  await page.getByRole('button', { name: 'Reload settings' }).click()
  await expect.poll(() => name.inputValue()).toBe('Endless Design Studio')
})

test('[SH-109] [SH-115] [SH-116] an omitted optional tagline opens without unsaved changes', async () => {
  await page.route('**/_studio/settings', async (route) => {
    const response = await route.fetch()
    const body = await response.json()
    delete body.config.tagline
    await route.fulfill({ json: body })
  })
  await page.goto(`${server.url}settings`)
  const tagline = page.getByRole('textbox', { name: 'Tagline', exact: true })
  await expect.poll(() => tagline.isVisible(), { timeout: 60000 }).toBe(true)
  expect(await tagline.inputValue()).toBe('')
  expect(
    await page.getByRole('button', { name: 'Save changes' }).isDisabled(),
  ).toBe(true)
  expect(
    await page
      .getByText('Your settings are up to date.', { exact: true })
      .isVisible(),
  ).toBe(true)
})

test('[SH-106] [SH-110] [SH-114] registered readers and unregistered people have disabled controls; dropped controls are absent', async () => {
  for (const role of ['contributor', null]) {
    await page.route('**/_studio/settings', async (route) => {
      const response = await route.fetch()
      await route.fulfill({ json: { ...(await response.json()), role } })
    })
    await page.goto(`${server.url}settings`)
    const name = page.getByRole('textbox', { name: 'Studio name' })
    await expect.poll(() => name.isVisible(), { timeout: 60000 }).toBe(true)
    expect(await name.isDisabled()).toBe(true)
    expect(
      await page
        .getByText(
          role
            ? 'You can view these settings. An Admin can change them.'
            : 'Ask your agent to register your contributor identity before editing settings.',
        )
        .isVisible(),
    ).toBe(true)
    expect(await page.getByText('Studio use', { exact: true }).count()).toBe(0)
    expect(
      await page
        .getByText('Incompatible with this platform', { exact: true })
        .count(),
    ).toBe(0)
    await page.unroute('**/_studio/settings')
  }
})

test('[SH-119] [SH-120] [SH-121] [SH-122] [CL-59] save and manual edits restart and recover the studio', async () => {
  await page.goto(`${server.url}settings`)
  const name = page.getByRole('textbox', { name: 'Studio name' })
  await expect.poll(() => name.isVisible(), { timeout: 60000 }).toBe(true)
  await name.fill('Updated studio')
  const request = page.waitForRequest(
    (request) =>
      request.url().endsWith('_studio/settings') && request.method() === 'POST',
  )
  await page.getByRole('button', { name: 'Save changes' }).click()
  expect((await request).postDataJSON().changes).toEqual({
    name: 'Updated studio',
  })
  await expect
    .poll(
      () => page.getByText('Applying changes', { exact: true }).isVisible(),
      { timeout: 30000 },
    )
    .toBe(true)
  await expect
    .poll(() => name.inputValue().catch(() => ''), { timeout: 120000 })
    .toBe('Updated studio')
  expect(JSON.parse(readFileSync(configFile, 'utf8')).name).toBe(
    'Updated studio',
  )
  await expect
    .poll(() => page.getByText('Applying changes', { exact: true }).count(), {
      timeout: 120000,
    })
    .toBe(0)
  await name.fill('Still editable')
  await page.getByRole('button', { name: 'Discard', exact: true }).click()
  await page.screenshot({ path: '.scratch/28-settings.png', fullPage: true })
  const config = JSON.parse(readFileSync(configFile, 'utf8'))
  config.name = 'Edited by agent'
  writeFileSync(configFile, JSON.stringify(config, null, 2))
  await expect
    .poll(() => name.inputValue().catch(() => ''), { timeout: 120000 })
    .toBe('Edited by agent')
}, 300000)
