// Inside a prototype: a view's named states in navigation and at their own
// permanent addresses, links between views that go through the studio, the
// studio's shortcuts while a view has focus, and lo-fi views. The studio
// runs as Ada on a disposable copy of tests/fixtures/named-states inside the
// checkout (preview documents serve files from the checkout only).
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
  buildStaticSite,
  startDevServer,
  startStaticSite,
  type RunningStudio,
} from './setup/studio'

mkdirSync('.e2e', { recursive: true })
const content = mkdtempSync(path.join('.e2e', 'states-'))
cpSync('tests/fixtures/named-states', content, { recursive: true })
const folder = path.join(content, 'ada', 'flows')
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

const FLOWS = 'f1ws000000000001'
const HOME = 'hme0000000000a01'
const MEMBER = 'stmb00000000a001'
const NEW_USER = 'stnw00000000a001'
const DETAILS = 'det0000000000a01'
const SKETCH = 'skt0000000000a01'
const GONE_MEMBER = 'gstm00000000a001'

const address = (studio: RunningStudio, artifact: string) =>
  `${studio.url}prototypes/${FLOWS}/artifacts/${artifact}`
const navigation = (page: Page) =>
  page.getByRole('navigation', { name: 'Flows' })
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

function sharedScenarios(
  studio: () => RunningStudio,
  newPage: () => Promise<Page>,
) {
  test('[SH-72] [PR-51] [PR-89] [PR-59] a view’s states are listed under it and each opens at its own permanent address', async () => {
    const page = await newPage()
    await page.goto(address(studio(), HOME))
    await ready(page)
    const links = navigation(page).getByRole('link')
    await expect
      .poll(() => links.allTextContents(), { timeout: 30_000 })
      .toEqual([
        'Gone',
        'Member',
        'Home',
        'Member',
        'New user',
        'Sketch',
        'Details',
      ])
    // State rows have no file of their own: nothing being dragged, none of
    // them shows the line where a drop would land.
    expect(await navigation(page).locator('[data-drop-line]').count()).toBe(0)

    const member = navigation(page).getByRole('link', { name: 'Member' }).nth(1)
    expect(await member.getAttribute('href')).toContain(`/artifacts/${MEMBER}`)
    await member.click()
    await expect.poll(() => page.url()).toBe(address(studio(), MEMBER))
    await sees(view(page), 'Welcome back, Ana')
    await expect.poll(() => page.title()).toMatch(/^Flows — Home · Member — /)

    // A state's permanent link opens it directly.
    await page.goto(address(studio(), NEW_USER))
    await ready(page)
    await sees(view(page), 'Welcome')
    expect(
      await navigation(page)
        .getByRole('link', { name: 'New user' })
        .getAttribute('aria-current'),
    ).toBe('page')
  })

  test('[PR-89] switching state remounts the screen with the other state’s props', async () => {
    const page = await newPage()
    await page.goto(address(studio(), MEMBER))
    await ready(page)
    await view(page).getByRole('button', { name: 'Add' }).click()
    await sees(view(page), 'Count 1')
    await navigation(page).getByRole('link', { name: 'New user' }).click()
    await sees(view(page), 'Welcome')
    await sees(view(page), 'Count 0')
  })

  test('[PR-89] a state its view no longer has shows an error', async () => {
    const page = await newPage()
    await page.goto(address(studio(), GONE_MEMBER))
    await expect
      .poll(() => host(page).getAttribute('data-preview-state'), {
        timeout: 120_000,
      })
      .toBe('error')
    await expect
      .poll(() =>
        page
          .getByText('has no state titled "Member" in export const states')
          .isVisible(),
      )
      .toBe(true)
  })

  test('[PR-82] [PR-94] a link to another view opens it in the studio, and Back returns', async () => {
    const page = await newPage()
    await page.goto(address(studio(), HOME))
    await ready(page)
    // The helpers resolve paths inside the prototype to permanent addresses.
    await sees(
      view(page),
      `Details lives at ${new URL(studio().url).pathname}prototypes/${FLOWS}/artifacts/${DETAILS}`,
    )
    await sees(view(page), 'You are on Home')

    await view(page).getByRole('link', { name: 'Details' }).click()
    await expect.poll(() => page.url()).toBe(address(studio(), DETAILS))
    await sees(view(page), 'Details')
    expect(
      await navigation(page)
        .getByRole('link', { name: 'Details' })
        .getAttribute('aria-current'),
    ).toBe('page')

    await page.goBack()
    await expect.poll(() => page.url()).toBe(address(studio(), HOME))
    await sees(view(page), 'You are on Home')
    await page.goForward()
    await expect.poll(() => page.url()).toBe(address(studio(), DETAILS))

    await view(page).getByRole('link', { name: 'Back home' }).click()
    await expect.poll(() => page.url()).toBe(address(studio(), HOME))
    await view(page).getByRole('button', { name: 'Go to details' }).click()
    await expect.poll(() => page.url()).toBe(address(studio(), DETAILS))
  })

  test('[PR-82] #anchors stay inside the view, external links open a new tab, modified clicks are the browser’s', async () => {
    const page = await newPage()
    await page
      .context()
      .route('https://example.com/**', (route) =>
        route.fulfill({ contentType: 'text/html', body: '<p>Help</p>' }),
      )
    await page.goto(address(studio(), HOME))
    await ready(page)
    const entries = await page.evaluate(() => history.length)

    await view(page).getByRole('link', { name: 'Jump to the bottom' }).click()
    await expect
      .poll(() => view(page).getByText('Bottom of Home').isVisible())
      .toBe(true)
    await expect
      .poll(() =>
        view(page)
          .locator('#bottom')
          .evaluate((element) => {
            const box = element.getBoundingClientRect()
            return box.top >= 0 && box.bottom <= window.innerHeight
          }),
      )
      .toBe(true)
    expect(page.url()).toBe(address(studio(), HOME))
    expect(await page.evaluate(() => history.length)).toBe(entries)

    const external = page.context().waitForEvent('page')
    await view(page).getByRole('link', { name: 'Help' }).click()
    expect((await external).url()).toBe('https://example.com/help')
    expect(page.url()).toBe(address(studio(), HOME))

    const modified = page.context().waitForEvent('page')
    await view(page)
      .getByRole('link', { name: 'Details' })
      .click({ modifiers: ['ControlOrMeta'] })
    await expect
      .poll(async () => (await modified).url())
      .toContain(`/artifacts/${DETAILS}`)
    expect(page.url()).toBe(address(studio(), HOME))
  })

  test('[PR-82] the studio’s shortcuts keep working while focus is in a view, but not while typing there', async () => {
    const page = await newPage()
    await page.goto(address(studio(), HOME))
    await ready(page)
    const sidebar = page.getByRole('complementary', { name: 'Flows' })
    await expect.poll(() => sidebar.isVisible()).toBe(true)

    await view(page).getByRole('textbox', { name: 'Notes' }).click()
    await page.keyboard.press('Control+;')
    await page.waitForTimeout(300)
    expect(await sidebar.isVisible()).toBe(true)

    await view(page)
      .getByRole('heading', { name: 'Welcome back, Ana' })
      .or(view(page).getByRole('heading', { name: 'Welcome' }))
      .click()
    await page.keyboard.press('Control+;')
    await expect.poll(() => sidebar.isVisible()).toBe(false)
    await page.keyboard.press('Control+;')
    await expect.poll(() => sidebar.isVisible()).toBe(true)
  })
}

const lofiOf = (page: Page) =>
  view(page)
    .getByRole('heading', { name: 'Sketch' })
    .evaluate((heading) => {
      const style = getComputedStyle(heading)
      let filter = 'none'
      for (
        let element: Element | null = heading;
        element;
        element = element.parentElement
      ) {
        const own = getComputedStyle(element).filter
        if (own !== 'none') filter = own
      }
      return { filter, font: style.fontFamily, color: style.color }
    })

// The heading's bold handwritten font is a face the document can load.
const handwriting = (page: Page) =>
  view(page)
    .locator('body')
    .evaluate(async () => {
      const faces = await document.fonts.load(
        'bold 16px "Comic Neue"',
        'Sketch',
      )
      return faces.some((face) => face.status === 'loaded')
    })

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

  test("[PR-82] [PR-130] ⌘' / Ctrl+' pressed in a view opens its source, but not while typing there", async () => {
    const page = await newPage()
    await page.goto(address(studio, HOME))
    await ready(page)
    const editor = page.getByRole('textbox', {
      name: /^Source of .*Home\.vue$/,
    })

    await view(page).getByRole('textbox', { name: 'Notes' }).click()
    await page.keyboard.press("Control+'")
    await page.waitForTimeout(300)
    expect(new URL(page.url()).search).toBe('')

    await view(page)
      .getByRole('heading', { name: 'Welcome back, Ana' })
      .or(view(page).getByRole('heading', { name: 'Welcome' }))
      .click()
    await page.keyboard.press("Control+'")
    await expect.poll(() => editor.isVisible(), { timeout: 30_000 }).toBe(true)
    expect(new URL(page.url()).search).toBe('?mode=source')

    await editor.click()
    await page.keyboard.press("Control+'")
    await expect.poll(() => editor.isVisible()).toBe(false)
    expect(new URL(page.url()).search).toBe('')
  })

  test('[PR-89] [PR-125] a named state’s source is its view’s file', async () => {
    const page = await newPage()
    await page.goto(address(studio, MEMBER))
    await ready(page)
    await view(page).getByRole('heading', { name: 'Welcome back, Ana' }).click()
    await page.keyboard.press("Control+'")
    const editor = page.getByRole('textbox', {
      name: /^Source of .*Home\.vue$/,
    })
    await expect
      .poll(() => editor.textContent(), { timeout: 30_000 })
      .toContain('export const states')
    expect(await page.getByText('This file no longer exists.').count()).toBe(0)
  })

  test('[SH-90] [PR-91] “Make lo-fi” draws a view in grayscale with the handwritten font; “Make hi-fi” switches back', async () => {
    const page = await newPage()
    await page.goto(address(studio, SKETCH))
    await ready(page)
    expect(await lofiOf(page)).toMatchObject({ filter: 'none' })
    expect((await lofiOf(page)).font).not.toContain('Comic Neue')

    const row = navigation(page).getByRole('link', { name: 'Sketch' })
    await row.click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Make lo-fi' }).click()
    await expect
      .poll(() => readFileSync(path.join(folder, 'Sketch.vue'), 'utf8'))
      // The marker keeps the file's own line endings (CRLF in a Windows
      // checkout).
      .toMatch(/^<!-- @lofi -->\r?\n<!-- @studio-id skt0000000000a01 -->/)
    await expect
      .poll(async () => (await lofiOf(page)).filter, { timeout: 30_000 })
      .toBe('grayscale(1)')
    expect((await lofiOf(page)).font).toContain('Comic Neue')
    // The view keeps its own colours underneath.
    expect((await lofiOf(page)).color).toBe('rgb(255, 0, 0)')
    await expect.poll(() => handwriting(page)).toBe(true)

    await row.click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Make hi-fi' }).click()
    await expect
      .poll(async () => (await lofiOf(page)).filter, { timeout: 30_000 })
      .toBe('none')
    expect(readFileSync(path.join(folder, 'Sketch.vue'), 'utf8')).toMatch(
      /^<!-- @studio-id skt0000000000a01 -->/,
    )
  })

  test('[PR-89] a state’s props edited on disk reach the open state without reloading the document, and a new state gets its ID and its row', async () => {
    const file = path.join(folder, 'Home.vue')
    const original = readFileSync(file, 'utf8')
    try {
      const page = await newPage()
      await page.goto(address(studio, MEMBER))
      await ready(page)
      await sees(view(page), 'Welcome back, Ana')
      const runtime = () =>
        view(page).locator('html').getAttribute('data-preview-runtime')
      const before = await runtime()

      writeFileSync(file, original.replace("name: 'Ana'", "name: 'Bea'"))
      await sees(view(page), 'Welcome back, Bea', 30_000)
      // The same document: Vue's hot update, not a reload.
      expect(await runtime()).toBe(before)

      writeFileSync(
        file,
        original.replace(
          "{ title: 'New user', props: { name: '' } },",
          "{ title: 'New user', props: { name: '' } },\n  { title: 'Returning', props: { name: 'Cy' } },",
        ),
      )
      await expect
        .poll(() => readFileSync(file, 'utf8'), { timeout: 10_000 })
        .toMatch(/<!-- @studio-state ([0-9a-z]{16}) Returning -->/)
      const id = /<!-- @studio-state ([0-9a-z]{16}) Returning -->/.exec(
        readFileSync(file, 'utf8'),
      )![1]!
      const row = navigation(page).getByRole('link', { name: 'Returning' })
      await expect.poll(() => row.isVisible(), { timeout: 30_000 }).toBe(true)
      await row.click()
      await expect.poll(() => page.url()).toBe(address(studio, id))
      await sees(view(page), 'Welcome back, Cy')
    } finally {
      writeFileSync(file, original)
    }
  })

  test('[SH-90] lo-fi is offered only for your own prototypes', async () => {
    const page = await newPage()
    const owned = JSON.parse(
      readFileSync(path.join(folder, 'meta.json'), 'utf8'),
    )
    // Ben's copy of the prototype, with ids of its own.
    const bens = path.join(content, 'ben', 'flows')
    mkdirSync(bens, { recursive: true })
    writeFileSync(
      path.join(bens, 'meta.json'),
      JSON.stringify({
        ...owned,
        title: 'Ben’s flows',
        studioId: 'bfws000000000001',
        ownerContributorId: 'ben0000000000002',
      }),
    )
    writeFileSync(
      path.join(bens, 'Draft.vue'),
      '<!-- @studio-id bdft000000000001 -->\n<template><h1>Draft</h1></template>\n',
    )
    await page.goto(
      `${studio.url}prototypes/bfws000000000001/artifacts/bdft000000000001`,
    )
    await ready(page)
    await page
      .getByRole('navigation', { name: 'Ben’s flows' })
      .getByRole('link', { name: 'Draft' })
      .click({ button: 'right' })
    await page.waitForTimeout(300)
    expect(
      await page.getByRole('menuitem', { name: 'Make lo-fi' }).count(),
    ).toBe(0)
  })
})

describe('the static build', () => {
  const newPage = useBrowser()
  let site: RunningStudio
  beforeAll(async () => {
    // Sketch arrives lo-fi in the build.
    const sketch = path.join(folder, 'Sketch.vue')
    writeFileSync(sketch, `<!-- @lofi -->\n${readFileSync(sketch, 'utf8')}`)
    site = await startStaticSite('/studio-states/', env)
  })
  afterAll(async () => {
    await site?.stop()
  })

  sharedScenarios(() => site, newPage)

  test('[PR-91] a lo-fi view is drawn in grayscale with the bundled handwritten font', async () => {
    const page = await newPage()
    const requests: string[] = []
    page.on('request', (request) => requests.push(request.url()))
    await page.goto(address(site, SKETCH))
    await ready(page)
    await expect
      .poll(async () => (await lofiOf(page)).filter)
      .toBe('grayscale(1)')
    expect((await lofiOf(page)).font).toContain('Comic Neue')
    await expect.poll(() => handwriting(page)).toBe(true)
    // Bundled: nothing comes from another site.
    expect(requests.filter((url) => !url.startsWith(site.url))).toEqual([])
    // The deployed site's file menu only copies (ticket 11): no lo-fi.
    await navigation(page)
      .getByRole('link', { name: 'Sketch' })
      .click({ button: 'right' })
    await expect
      .poll(async () =>
        (await page.getByRole('menuitem').allTextContents()).map((text) =>
          text.trim(),
        ),
      )
      .toEqual(['Copy link', 'Copy path'])
  })
})

describe('the strict build', () => {
  test('[PR-90] fails on a state comment that names no state, a repeated title and a state without its ID, naming the file and title', async () => {
    const broken = mkdtempSync(path.join('.e2e', 'states-broken-'))
    cpSync(content, broken, { recursive: true })
    const home = path.join(broken, 'ada', 'flows', 'Home.vue')
    writeFileSync(
      home,
      readFileSync(home, 'utf8').replace(
        "title: 'Member'",
        "title: 'Signed in'",
      ),
    )
    const sketch = path.join(broken, 'ada', 'flows', 'Sketch.vue')
    writeFileSync(
      sketch,
      `${readFileSync(sketch, 'utf8')}<script lang="ts">\nexport const states = [\n  { title: 'One', props: {} },\n  { title: 'One', props: {} },\n]\n</script>\n`,
    )
    const failure = await buildStaticSite('/', {
      ...env,
      STUDIO_PROTOTYPES: broken.split(path.sep).join('/'),
    }).then(
      () => null,
      (error: Error) => error.message,
    )
    expect(failure).toMatch(
      /ada\/flows\/Home\.vue: @studio-state stmb00000000a001 names no state titled "Member"\. When renaming a state, change its title in the comment too/,
    )
    expect(failure).toMatch(
      /ada\/flows\/Home\.vue \(state "Signed in"\): the permanent identity is missing\./,
    )
    expect(failure).toMatch(
      /ada\/flows\/Sketch\.vue: two states are titled "One"; titles must differ\./,
    )
  }, 300_000)
})
