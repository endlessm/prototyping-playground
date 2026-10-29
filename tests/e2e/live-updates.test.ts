import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import type { Frame, FrameLocator, Page } from 'playwright'
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  onTestFailed,
  test,
} from 'vitest'
import { useBrowser } from './setup/browser'
import { startDevServer, type RunningStudio } from './setup/studio'

// While an agent edits files, the studio keeps up without reloading. The
// scenarios edit a disposable prototypes folder inside the checkout (the
// preview documents serve files from the checkout only).
mkdirSync('.e2e', { recursive: true })
const content = mkdtempSync(path.join('.e2e', 'live-'))
const folder = path.join(content, 'bernardo', 'live')
const env = { STUDIO_PROTOTYPES: content.split(path.sep).join('/') }

const PROTOTYPE = 'pr0t0000000000a1'
const COUNTER = 'c0nter0000000001'
const SECOND = 'sec0nd0000000001'

function write(name: string, source: string) {
  const file = path.join(folder, name)
  if (existsSync(file) && readFileSync(file, 'utf8') === source) return
  writeFileSync(file, source)
}
const remove = (name: string) => rmSync(path.join(folder, name))
const view = (id: string, body: string) =>
  `<!-- @studio-id ${id} -->\n${body.trim()}\n`

const counter = (heading: string, colour = 'rgb(0, 0, 255)') =>
  view(
    COUNTER,
    `
<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>

<template>
  <main>
    <h1>${heading}</h1>
    <button type="button" @click="count++">Add</button>
    <p>Count {{ count }}</p>
  </main>
</template>

<style>
h1 { color: ${colour}; }
</style>
`,
  )
const plain = (id: string, heading: string) =>
  view(id, `<template><h1>${heading}</h1></template>`)

// Back to the two views, leaving files that stay as they are, as an agent
// would: a folder removed and made again is a burst the scenarios don't need.
function reset() {
  mkdirSync(folder, { recursive: true })
  for (const name of readdirSync(folder))
    if (!['meta.json', 'Counter.vue', 'Second.vue'].includes(name))
      rmSync(path.join(folder, name))
  write(
    'meta.json',
    JSON.stringify({
      formatVersion: 1,
      title: 'Live',
      created: '2026-10-28',
      studioId: PROTOTYPE,
      ownerContributorId: 'ma1xykkc2j3d2x24',
      systemId: null,
    }),
  )
  write('Counter.vue', counter('Counter one'))
  write('Second.vue', plain(SECOND, 'Second view'))
}

const address = (studio: RunningStudio, artifact: string) =>
  `${studio.url}prototypes/${PROTOTYPE}/artifacts/${artifact}`
const navigation = (page: Page) =>
  page.getByRole('navigation', { name: 'Live' })
const links = (page: Page) =>
  navigation(page).getByRole('link').allTextContents()
const host = (page: Page) => page.locator('[data-preview-session]')
const frameOf = (page: Page): FrameLocator =>
  page.locator('iframe[data-preview-frame]').contentFrame()
const documentOf = (page: Page): Frame =>
  page.frames().find((frame) => frame.url().includes('/_preview/'))!

async function opened(page: Page, url: string) {
  await page.goto(url)
  await expect
    .poll(() => host(page).getAttribute('data-preview-state'), {
      timeout: 60_000,
    })
    .toBe('ready')
  // Marks the studio and the preview document, to tell an update from a
  // reload.
  await page.evaluate(() => ((window as { mark?: number }).mark = 1))
  await documentOf(page).evaluate(
    () => ((window as { mark?: number }).mark = 1),
  )
}
const studioKept = (page: Page) =>
  page.evaluate(() => (window as { mark?: number }).mark)
const previewKept = (page: Page) =>
  documentOf(page).evaluate(() => (window as { mark?: number }).mark)

describe('live updates on the dev server', { timeout: 120_000 }, () => {
  const openPage = useBrowser()
  // What the studio and its previews logged, shown when a scenario fails.
  const newPage = async () => {
    const page = await openPage()
    const log: string[] = []
    page.on('console', (message) =>
      log.push(`${message.type()}: ${message.text()}`),
    )
    page.on('pageerror', (error) => log.push(`pageerror: ${error.message}`))
    onTestFailed(() => console.log(log.join('\n')))
    return page
  }
  let studio: RunningStudio
  beforeAll(async () => {
    reset()
    studio = await startDevServer(env)
  })
  afterAll(async () => {
    await studio?.stop()
    rmSync(content, { recursive: true, force: true })
  })

  test('[PR-81] [SY-176] editing a view updates its open preview and keeps its state', async () => {
    reset()
    const page = await newPage()
    await opened(page, address(studio, COUNTER))
    const frame = frameOf(page)
    await frame.getByRole('button', { name: 'Add' }).click()
    await frame.getByRole('button', { name: 'Add' }).click()
    await expect.poll(() => frame.getByText('Count 2').isVisible()).toBe(true)

    write('Counter.vue', counter('Counter two'))
    const heading = frame.getByRole('heading', { name: 'Counter two' })
    await expect.poll(() => heading.isVisible(), { timeout: 10_000 }).toBe(true)
    expect(await frame.getByText('Count 2').isVisible()).toBe(true)

    // A style change applies live too.
    write('Counter.vue', counter('Counter two', 'rgb(255, 0, 0)'))
    await expect
      .poll(
        () => heading.evaluate((element) => getComputedStyle(element).color),
        {
          timeout: 10_000,
        },
      )
      .toBe('rgb(255, 0, 0)')
    expect(await frame.getByText('Count 2').isVisible()).toBe(true)
    expect(await previewKept(page)).toBe(1)
    expect(await studioKept(page)).toBe(1)
  })

  test('[PR-66] [SH-137] [CL-121] [SH-140] new, removed and renamed views appear in every open tab without a reload', async () => {
    reset()
    const page = await newPage()
    const other = await newPage()
    await opened(page, address(studio, COUNTER))
    await opened(other, address(studio, SECOND))
    expect(await links(page)).toEqual(['Counter', 'Second'])

    // Added: listed within a second, and it renders without a restart.
    write('Third.vue', plain('th1rd00000000001', 'Third view'))
    for (const tab of [page, other])
      await expect
        .poll(() => links(tab), { timeout: 3_000 })
        .toEqual(['Counter', 'Second', 'Third'])
    await navigation(page).getByRole('link', { name: 'Third' }).click()
    await expect
      .poll(() => frameOf(page).getByText('Third view').isVisible(), {
        timeout: 15_000,
      })
      .toBe(true)

    // Renamed: same identity, new name; the open view keeps rendering.
    renameSync(path.join(folder, 'Third.vue'), path.join(folder, 'Fourth.vue'))
    for (const tab of [page, other])
      await expect
        .poll(() => links(tab), { timeout: 3_000 })
        .toEqual(['Counter', 'Fourth', 'Second'])
    expect(page.url()).toBe(address(studio, 'th1rd00000000001'))
    await expect
      .poll(() => frameOf(page).getByText('Third view').isVisible(), {
        timeout: 15_000,
      })
      .toBe(true)

    // Removed: gone from the list, and the open page says so.
    remove('Fourth.vue')
    for (const tab of [page, other])
      await expect
        .poll(() => links(tab), { timeout: 3_000 })
        .toEqual(['Counter', 'Second'])
    await expect
      .poll(() =>
        page.getByText("There's nothing at this address.").isVisible(),
      )
      .toBe(true)

    expect(await studioKept(page)).toBe(1)
    expect(await studioKept(other)).toBe(1)
    expect(await previewKept(other)).toBe(1)
  })

  test('[PR-84] [SH-139] a view that fails to compile shows the compiler’s message and location, and recovers once fixed', async () => {
    reset()
    write(
      'Broken.vue',
      view('br0ken0000000001', '<template>\n  <main>\n    <h1>Fixed</h1>\n'),
    )
    const page = await newPage()
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto(address(studio, 'br0ken0000000001'))
    const alert = page.getByRole('alert')
    await expect
      .poll(() => alert.textContent(), { timeout: 60_000 })
      .toContain(
        "This page couldn't load. Copy the error and give it to your agent.",
      )
    const detail = (await alert.locator('pre').textContent()) ?? ''
    expect(detail).toMatch(/live\/Broken\.vue:\d+:\d+/)
    expect(detail).toMatch(/end tag|Element is missing end tag/i)
    expect(await host(page).getAttribute('data-preview-state')).toBe('error')

    await alert.getByRole('button', { name: 'Copy error' }).click()
    await expect
      .poll(() => alert.getByRole('button', { name: 'Copied' }).isVisible())
      .toBe(true)
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
      'Broken.vue',
    )

    // The studio stays usable.
    await navigation(page).getByRole('link', { name: 'Counter' }).isVisible()

    write('Broken.vue', plain('br0ken0000000001', 'Fixed'))
    await expect
      .poll(() => host(page).getAttribute('data-preview-state'), {
        timeout: 15_000,
      })
      .toBe('ready')
    await expect
      .poll(() => frameOf(page).getByText('Fixed').isVisible())
      .toBe(true)
    expect(await alert.count()).toBe(0)
  })

  test('[PR-86] [PR-98] [CL-124] a preview that can’t show the latest change says it is out of date, then catches up', async () => {
    reset()
    const page = await newPage()
    await opened(page, address(studio, COUNTER))
    expect(await host(page).getAttribute('data-preview-freshness')).toBe(
      'current',
    )
    write('Counter.vue', counter('Counter <broken').replace('</main>', ''))
    const notice = page.getByRole('status').filter({
      hasText: 'This preview is out of date.',
    })
    await expect
      .poll(() => notice.textContent(), { timeout: 10_000 })
      .toContain(
        'The latest changes could not render. Give the error to your agent.',
      )
    expect(await host(page).getAttribute('data-preview-freshness')).toBe(
      'stale',
    )
    // The last good output stays visible behind the notice.
    expect(
      await frameOf(page)
        .getByRole('heading', { name: 'Counter one' })
        .isVisible(),
    ).toBe(true)

    write('Counter.vue', counter('Counter three'))
    await expect
      .poll(
        () =>
          frameOf(page)
            .getByRole('heading', { name: 'Counter three' })
            .isVisible(),
        { timeout: 10_000 },
      )
      .toBe(true)
    await expect
      .poll(() => host(page).getAttribute('data-preview-freshness'))
      .toBe('current')
    expect(await notice.count()).toBe(0)
  })

  test('[PR-86] [PR-98] a view whose file is removed and written again never keeps showing the old output', async () => {
    reset()
    const page = await newPage()
    await opened(page, address(studio, COUNTER))
    remove('Counter.vue')
    write('Counter.vue', counter('Counter again'))
    await expect
      .poll(
        () =>
          frameOf(page)
            .getByRole('heading', { name: 'Counter again' })
            .isVisible()
            .catch(() => false),
        { timeout: 15_000 },
      )
      .toBe(true)
    await expect
      .poll(() => host(page).getAttribute('data-preview-freshness'))
      .toBe('current')
  })

  test('[PR-85] a view with nothing to show says what is missing, and recovers by itself', async () => {
    reset()
    write(
      'Unfinished.vue',
      view(
        'n0tmp00000000001',
        `<script setup>\nconst title = 'Soon'\n</script>`,
      ),
    )
    const page = await newPage()
    await page.goto(address(studio, 'n0tmp00000000001'))
    const alert = page.getByRole('alert')
    await expect
      .poll(() => alert.locator('pre').textContent(), { timeout: 60_000 })
      .toContain('Unfinished has no <template>.')
    write('Unfinished.vue', plain('n0tmp00000000001', 'Finished'))
    await expect
      .poll(() => frameOf(page).getByText('Finished').isVisible(), {
        timeout: 15_000,
      })
      .toBe(true)
  })

  test('[PR-88] a new, empty view asks for the agent, with a prompt to copy', async () => {
    reset()
    write('Blank.vue', '<!-- @studio-id b1ank00000000001 -->\n')
    const page = await newPage()
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto(address(studio, 'b1ank00000000001'))
    await expect
      .poll(() => page.getByText('This view is empty').isVisible(), {
        timeout: 60_000,
      })
      .toBe(true)
    expect(
      await page
        .getByText(
          "Ask your agent to build something here. Describe what it's for and who it's for.",
        )
        .isVisible(),
    ).toBe(true)
    expect(await page.getByText('In live/Blank.vue, build').isVisible()).toBe(
      true,
    )
    expect(await host(page).getAttribute('data-preview-state')).toBe('empty')
    await page.getByRole('button', { name: 'Copy prompt' }).click()
    await expect
      .poll(() => page.getByRole('button', { name: 'Copied' }).isVisible())
      .toBe(true)
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      `In ${env.STUDIO_PROTOTYPES}/bernardo/live/Blank.vue, build `,
    )
    await expect
      .poll(
        () => page.getByRole('button', { name: 'Copy prompt' }).isVisible(),
        {
          timeout: 3_000,
        },
      )
      .toBe(true)

    // The agent builds it: it renders by itself.
    write('Blank.vue', plain('b1ank00000000001', 'Built'))
    await expect
      .poll(() => frameOf(page).getByText('Built').isVisible(), {
        timeout: 15_000,
      })
      .toBe(true)
    expect(await page.getByText('This view is empty').count()).toBe(0)
  })

  test('[PR-79] moving between views keeps the outgoing one until the next is ready, saying “Opening view” when slow', async () => {
    reset()
    const page = await newPage()
    await page.route('**/Second.vue*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2_000))
      await route.continue()
    })
    await opened(page, address(studio, COUNTER))
    await navigation(page).getByRole('link', { name: 'Second' }).click()
    const opening = page.getByRole('status').filter({ hasText: 'Opening view' })
    await expect.poll(() => opening.isVisible()).toBe(true)
    expect(
      await frameOf(page)
        .getByRole('heading', { name: 'Counter one' })
        .isVisible(),
    ).toBe(true)
    await expect
      .poll(() => frameOf(page).getByText('Second view').isVisible(), {
        timeout: 15_000,
      })
      .toBe(true)
    expect(await opening.count()).toBe(0)
    expect(await frameOf(page).getByText('Counter one').count()).toBe(0)
    // The same document showed both.
    expect(await previewKept(page)).toBe(1)
  })

  test('[PR-97] a view’s preview opens in its own tab and reports its state', async () => {
    reset()
    const page = await newPage()
    await opened(page, address(studio, COUNTER))
    expect(await host(page).getAttribute('data-preview-artifact')).toBe(COUNTER)
    expect(await host(page).getAttribute('data-preview-session')).toBeTruthy()

    const events = page.evaluate(
      () =>
        new Promise<unknown>((resolve) =>
          document.addEventListener('studio:preview-state', (event) => {
            const detail = (event as CustomEvent).detail
            if (detail.state === 'ready') resolve(detail)
          }),
        ),
    )
    await navigation(page).getByRole('link', { name: 'Second' }).click()
    expect(await events).toMatchObject({ artifact: SECOND, state: 'ready' })

    const href = await page
      .getByRole('link', { name: 'Open in a new tab' })
      .getAttribute('href')
    expect(href).toMatch(new RegExp(`/_preview/none/\\?artifact=${SECOND}$`))
    const tab = await newPage()
    await tab.goto(new URL(href!, studio.url).href)
    await expect
      .poll(() => tab.locator('html').getAttribute('data-preview-state'), {
        timeout: 30_000,
      })
      .toBe('ready')
    expect(
      await tab.locator('html').getAttribute('data-preview-artifact'),
    ).toBe(SECOND)
    expect(await tab.getByText('Second view').isVisible()).toBe(true)
  })

  test('[PR-87] a preview that stops answering says so after 15 seconds', async () => {
    reset()
    const page = await newPage()
    await page.route('**/_preview/none/?*', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><title>Silent</title>',
      }),
    )
    const started = Date.now()
    await page.goto(address(studio, COUNTER))
    const notice = page
      .getByRole('status')
      .filter({ hasText: 'Preview has not responded.' })
    await expect
      .poll(() => notice.isVisible(), { timeout: 30_000, interval: 500 })
      .toBe(true)
    expect(Date.now() - started).toBeGreaterThanOrEqual(15_000)
  }, 60_000)
})
