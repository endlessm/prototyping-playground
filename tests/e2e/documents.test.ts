// Documents: a designer writes Markdown in a prototype and reads it in the
// studio's own style, with its title, "On this page", code in the studio's
// palette, Mermaid diagrams, links that open the prototype's artifacts, and
// views and documents embedded by linking them on their own line. Saving
// the file updates every open reader in place; the deployed site reads the
// same documents, read-only. The studio runs as Ada, who owns the fixture
// prototype, on a disposable copy inside the checkout (preview documents
// serve files from the checkout only).
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import type { Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import {
  startDevServer,
  startStaticSite,
  type RunningStudio,
} from './setup/studio'

const FIXTURES = 'tests/fixtures/documents'
mkdirSync('.e2e', { recursive: true })
const content = mkdtempSync(path.join('.e2e', 'documents-'))
const posix = (file: string) => file.split(path.sep).join('/')
cpSync(FIXTURES, content, { recursive: true })

const NOTES = 'd0c5000000000001'
const BRIEF = 'd0c5000000000002'
const INTERVIEWS = 'd0c5000000000003'
const HOME = 'd0c5000000000004'

const at = (file: string) => path.join(content, file)
const read = (file: string) => readFileSync(at(file), 'utf8')
function write(file: string, text: string) {
  mkdirSync(path.dirname(at(file)), { recursive: true })
  if (!existsSync(at(file)) || read(file) !== text)
    writeFileSync(at(file), text)
}
// The fixtures again: changed files rewritten in place, extra files removed
// (removing the folder in one burst can lose events).
function reset(dir = '') {
  const fixtures = path.join(FIXTURES, dir)
  for (const entry of readdirSync(at(dir), { withFileTypes: true })) {
    const relative = path.join(dir, entry.name)
    if (!existsSync(path.join(FIXTURES, relative)))
      rmSync(at(relative), { recursive: true, force: true })
  }
  for (const entry of readdirSync(fixtures, { withFileTypes: true })) {
    const relative = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      mkdirSync(at(relative), { recursive: true })
      reset(relative)
    } else write(relative, readFileSync(path.join(FIXTURES, relative), 'utf8'))
  }
}

const ADA = {
  STUDIO_PROTOTYPES: posix(content),
  STUDIO_CONTRIBUTORS: 'tests/fixtures/contributors',
  STUDIO_GITHUB: '',
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'user.name',
  GIT_CONFIG_VALUE_0: 'Ada Lovelace',
  GIT_CONFIG_KEY_1: 'user.email',
  GIT_CONFIG_VALUE_1: 'ada@endless.example',
}

afterAll(() => {
  rmSync(content, { recursive: true, force: true })
})

async function visible(locator: { isVisible: () => Promise<boolean> }) {
  await expect.poll(() => locator.isVisible(), { timeout: 45_000 }).toBe(true)
}
async function hidden(locator: { isVisible: () => Promise<boolean> }) {
  await expect.poll(() => locator.isVisible(), { timeout: 30_000 }).toBe(false)
}
const title = (page: Page, name: string) =>
  page.getByRole('heading', { name, level: 1, exact: true })
const article = (page: Page) => page.locator('article')
const scroller = (page: Page) => page.locator('[data-document-scroll]')
const toc = (page: Page) =>
  page.getByRole('navigation', { name: 'On this page' })
const embed = (page: Page, artifact = HOME) =>
  page.locator(`[data-preview-artifact="${artifact}"]`)
const embedded = (page: Page, artifact = HOME) =>
  embed(page, artifact).locator('iframe').contentFrame()
// How far a heading is from where going to it puts it: the top of the
// document's scrolling area, less the heading's scroll margin.
const offset = (page: Page, id: string) =>
  page.evaluate((target) => {
    const heading = document.getElementById(target)!
    const area = document
      .querySelector('[data-document-scroll]')!
      .getBoundingClientRect()
    return Math.round(
      heading.getBoundingClientRect().top -
        area.top -
        parseFloat(getComputedStyle(heading).scrollMarginTop),
    )
  }, id)
const scrollTop = (page: Page) =>
  scroller(page).evaluate((element) => Math.round(element.scrollTop))

// Cold pages and the first preview take a while on Windows.
describe('in the studio running locally', { timeout: 150_000 }, () => {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await startDevServer(ADA)
    // The first document compiles the reader, the highlighter and Mermaid.
    const page = await newPage()
    await page.goto(`${studio.url}prototypes/${NOTES}/artifacts/${BRIEF}`)
    await title(page, 'Research brief').waitFor({ timeout: 180_000 })
    await page.close()
  }, 300_000)
  afterAll(async () => {
    await studio?.stop()
  })

  async function open(artifact = BRIEF, hash = '') {
    const page = await newPage()
    await page.goto(
      `${studio.url}prototypes/${NOTES}/artifacts/${artifact}${hash}`,
    )
    return page
  }

  test('[PR-106] [PR-107] [PR-110] [CL-119] a .md file reads as a page: title and description from the frontmatter, GitHub-style Markdown, raw HTML as text, comments hidden', async () => {
    reset()
    const page = await open()
    await visible(title(page, 'Research brief'))
    // The opening heading repeated the title, so it shows once.
    expect(
      await page.getByText('Research brief', { exact: true }).count(),
    ).toBe(1)
    await visible(page.getByText('What we learned from five interviews.'))
    await visible(page.getByRole('cell', { name: 'Sign in' }))
    expect(
      await page
        .getByRole('checkbox')
        .evaluateAll((boxes) =>
          boxes.map((box) => (box as HTMLInputElement).checked),
        ),
    ).toEqual([true, false])
    expect(await article(page).locator('del').innerText()).toBe('Old plan')
    await visible(page.getByRole('link', { name: 'https://example.com' }))
    const text = await article(page).innerText()
    expect(text).toContain('The method.')
    expect(text).toContain('Use <placeholder> in a sentence.')
    expect(text).toContain('<script>window.studioHtmlRan = true</script>')
    expect(text).not.toContain('a note for whoever edits this file')
    expect(await page.evaluate(() => 'studioHtmlRan' in window)).toBe(false)
    expect(await article(page).locator('script').count()).toBe(0)
    // Headings carry anchors that link to themselves.
    expect(
      await page
        .getByRole('heading', { name: 'Goals', level: 2 })
        .getAttribute('id'),
    ).toBe('goals')
    expect(
      await page
        .getByRole('heading', { name: 'Goals', level: 2 })
        .getByRole('link')
        .getAttribute('href'),
    ).toBe('#goals')
  })

  test('[SY-148] [CL-119] [PR-110] code is highlighted with the studio’s accent palette, light and dark', async () => {
    reset()
    const page = await open()
    const keyword = article(page).locator('pre span', { hasText: /^const$/ })
    await visible(keyword)
    // Flexoki green: 600 in light mode, 400 in dark mode.
    await expect
      .poll(() => keyword.evaluate((span) => getComputedStyle(span).color))
      .toBe('rgb(102, 128, 11)')
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect
      .poll(() => keyword.evaluate((span) => getComputedStyle(span).color))
      .toBe('rgb(135, 154, 57)')
  })

  test('[PR-113] [CL-119] a Mermaid fence renders as a diagram, and again in dark mode', async () => {
    reset()
    const page = await open()
    const diagram = article(page).locator('[data-diagram-state]')
    await expect
      .poll(() => diagram.getAttribute('data-diagram-state'), {
        timeout: 45_000,
      })
      .toBe('ready')
    await expect
      .poll(() => diagram.locator('svg').textContent())
      .toContain('Start')
    const light = await diagram.locator('svg').innerHTML()
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect
      .poll(() => diagram.locator('svg').innerHTML(), { timeout: 30_000 })
      .not.toBe(light)
    await expect
      .poll(() => diagram.locator('svg').textContent())
      .toContain('Finish')
  })

  test('[PR-108] "On this page" lists level 2–3 headings, follows the scroll, and goes to a heading without animation under reduced motion', async () => {
    reset()
    const page = await open()
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await visible(toc(page))
    expect(
      (await toc(page).getByRole('link').allInnerTexts()).map((name) =>
        name.trim(),
      ),
    ).toEqual(['Goals', 'Screens', 'Links', 'Details', 'Last section'])
    expect(
      await toc(page)
        .getByRole('link', { name: 'Goals' })
        .getAttribute('aria-current'),
    ).toBe('location')

    await toc(page).getByRole('link', { name: 'Details' }).click()
    // No animation: the heading is in place right away.
    expect(Math.abs(await offset(page, 'details'))).toBeLessThan(4)
    expect(new URL(page.url()).hash).toBe('#details')
    await expect
      .poll(() =>
        toc(page)
          .getByRole('link', { name: 'Details' })
          .getAttribute('aria-current'),
      )
      .toBe('location')

    // A document without `toc: true` has no list.
    await page.goto(`${studio.url}prototypes/${NOTES}/artifacts/${INTERVIEWS}`)
    await visible(title(page, 'Interview notes'))
    expect(await toc(page).count()).toBe(0)
  })

  test('[PR-108] "On this page" is only on wide screens', async () => {
    reset()
    const page = await open()
    await visible(title(page, 'Research brief'))
    await visible(toc(page))
    await page.setViewportSize({ width: 1100, height: 800 })
    await hidden(toc(page))
  })

  test('[PR-109] an address with #heading opens there; another document opens at the top', async () => {
    reset()
    const page = await open(BRIEF, '#details')
    await visible(title(page, 'Research brief'))
    await expect
      .poll(() => offset(page, 'details').then(Math.abs), { timeout: 30_000 })
      .toBeLessThan(4)
    expect(await scrollTop(page)).toBeGreaterThan(200)

    await page
      .getByRole('navigation', { name: 'Notes' })
      .getByRole('link', { name: 'Notes', exact: true })
      .click()
    await visible(title(page, 'Interview notes'))
    expect(await scrollTop(page)).toBe(0)
  })

  test('[PR-111] links open the prototype’s artifacts at their permanent addresses, stay on the page for #anchors, and open other sites in a new tab', async () => {
    reset()
    const page = await open()
    await visible(title(page, 'Research brief'))
    const notes = article(page).getByRole('link', {
      name: 'the notes',
      exact: true,
    })
    // Written without its extension; the inline image reference too.
    expect(await notes.first().getAttribute('href')).toBe(
      `/prototypes/${NOTES}/artifacts/${INTERVIEWS}`,
    )
    expect(await notes.count()).toBe(2)
    expect(
      await article(page)
        .getByRole('link', { name: 'the method' })
        .getAttribute('target'),
    ).toBe('_blank')
    expect(
      await article(page)
        .getByRole('link', { name: 'home', exact: true })
        .getAttribute('href'),
    ).toBe('/')

    await article(page).getByRole('link', { name: 'the details' }).click()
    await expect.poll(() => new URL(page.url()).hash).toBe('#details')
    expect(new URL(page.url()).pathname).toBe(
      `/prototypes/${NOTES}/artifacts/${BRIEF}`,
    )

    await notes.last().click()
    await visible(title(page, 'Interview notes'))
    expect(new URL(page.url()).pathname).toBe(
      `/prototypes/${NOTES}/artifacts/${INTERVIEWS}`,
    )
    await page.goBack()
    await visible(title(page, 'Research brief'))
  })

  test('[PR-112] [PR-99] [PR-100] an embedded view is a 1440 px desktop picture in the shared frame, sized to the text, opening the view from its header', async () => {
    reset()
    const page = await open()
    await visible(
      embedded(page).getByRole('heading', { name: 'Hello from Home' }),
    )
    const frame = embed(page)
    const size = await frame.evaluate((element) => {
      const iframe = element.querySelector('iframe')!
      const box = element.getBoundingClientRect()
      return {
        width: box.width,
        height: box.height,
        viewport: iframe.clientWidth,
        hidden: iframe.closest('[aria-hidden="true"]') !== null,
        inert: iframe.closest('[inert]') !== null,
        pointer: getComputedStyle(iframe.parentElement!).pointerEvents,
        text: element.closest('article')!.getBoundingClientRect().width,
      }
    })
    expect(size.viewport).toBe(1440)
    expect(size.hidden).toBe(true)
    expect(size.inert).toBe(true)
    expect(size.pointer).toBe('none')
    expect(size.height).toBeGreaterThanOrEqual(220)
    expect(size.height).toBeLessThanOrEqual(440)
    expect(Math.abs(size.text - size.width)).toBeLessThan(4)
    // Pictures only: the view's button never takes focus from the page.
    await page.keyboard.press('Tab')
    for (let i = 0; i < 40; i++) {
      const inside = await page.evaluate(
        () => document.activeElement?.tagName === 'IFRAME',
      )
      expect(inside).toBe(false)
      await page.keyboard.press('Tab')
    }

    const header = page.getByRole('link', { name: 'Open Home screen' })
    await header.hover()
    await visible(header.getByText('Open', { exact: true }))
    expect(await header.getAttribute('href')).toBe(
      `/prototypes/${NOTES}/artifacts/${HOME}`,
    )
    await header.click()
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toBe(`/prototypes/${NOTES}/artifacts/${HOME}`)
  })

  test('[PR-101] [PR-102] [PR-103] [PR-75] documents embed as cards, and what can’t be shown says why', async () => {
    reset()
    const page = await open()
    await visible(title(page, 'Research brief'))
    const card = page.getByRole('link', { name: 'Open Notes' })
    await visible(card)
    expect(await card.getAttribute('href')).toBe(
      `/prototypes/${NOTES}/artifacts/${INTERVIEWS}`,
    )
    await visible(article(page).getByText('Document', { exact: true }))
    for (const reason of [
      'This file was moved or deleted. Ask your agent to fix the link.',
      'Choose a file inside this prototype.',
      'File unavailable. Check its path and whether its module is enabled.',
      'A document shows only its own prototype. Copy the view here.',
    ])
      await visible(article(page).getByText(reason, { exact: true }))
    await visible(article(page).getByText('Another prototype', { exact: true }))
    expect(
      await article(page).getByText('Not found', { exact: true }).count(),
    ).toBe(3)
    // The other prototype's view is never loaded.
    await visible(
      embedded(page).getByRole('heading', { name: 'Hello from Home' }),
    )
    expect(await page.locator('iframe').count()).toBe(1)
  })

  test('[PR-112] [PR-89] [PR-94] a named state embeds by its permanent address, and the navigation helpers work in the embed', async () => {
    reset()
    const page = await open('d0c500000000000b')
    await visible(title(page, 'States'))
    const state = embedded(page, 'd0c5000000000007')
    await visible(state.getByRole('heading', { name: 'Welcome back, Ana' }))
    await visible(
      state.getByText(`Home lives at /prototypes/${NOTES}/artifacts/${HOME}`),
    )
    expect(
      await page
        .getByRole('link', { name: 'Open Signed in' })
        .getAttribute('href'),
    ).toBe(`/prototypes/${NOTES}/artifacts/d0c5000000000007`)
  })

  test('[PR-104] an embed says it is loading, and that a broken view has an error', async () => {
    reset()
    write(
      'ada/notes/Broken.vue',
      '<!-- @studio-id d0c5000000000005 -->\n<template>\n  <h1>Broken {{ </h1>\n</template>\n',
    )
    write(
      'ada/notes/Gallery.md',
      '---\nstudioId: d0c5000000000006\n---\n\n# Gallery\n\n![Home](./Home.vue)\n\n![Broken](./Broken.vue)\n',
    )
    const page = await newPage()
    await page.route('**/Home.vue*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000))
      await route.continue()
    })
    await page.goto(
      `${studio.url}prototypes/${NOTES}/artifacts/d0c5000000000006`,
    )
    await visible(title(page, 'Gallery'))
    await visible(embed(page).getByText('Loading preview…'))
    await visible(
      embed(page, 'd0c5000000000005').getByText(
        'This view has an error. Open it to see what is wrong.',
      ),
    )
    await visible(
      embedded(page).getByRole('heading', { name: 'Hello from Home' }),
    )
    await hidden(embed(page).getByText('Loading preview…'))
  })

  test('[CL-122] [PR-105] [PR-109] saving updates every open reader in place, keeping its scroll; an embedded view follows its own source and stays mounted', async () => {
    reset()
    const first = await open()
    const second = await open()
    for (const page of [first, second]) {
      await visible(
        embedded(page).getByRole('heading', { name: 'Hello from Home' }),
      )
      // Marks that a reload or a remount would lose.
      await page.evaluate(() => {
        ;(window as unknown as { studioMark: number }).studioMark = 1
        ;(
          document.querySelector(
            '[data-preview-artifact] iframe',
          ) as unknown as {
            studioMark: number
          }
        ).studioMark = 1
      })
    }
    await scroller(first).evaluate((element) => element.scrollTo({ top: 600 }))

    write(
      'ada/notes/Brief.md',
      read('ada/notes/Brief.md')
        .replace(
          'The brief opens with a paragraph that stays content.',
          'An agent rewrote the opening.\n\n## Added section',
        )
        .replace('Line twenty.', 'Line twenty, edited.'),
    )
    for (const page of [first, second]) {
      await visible(page.getByText('An agent rewrote the opening.'))
      expect(
        await page.evaluate(
          () => (window as unknown as { studioMark?: number }).studioMark,
        ),
      ).toBe(1)
    }
    // A new section before the view moved it down, yet it stayed mounted.
    expect(
      await first.evaluate(
        () =>
          (
            document.querySelector(
              '[data-preview-artifact] iframe',
            ) as unknown as {
              studioMark?: number
            }
          ).studioMark,
      ),
    ).toBe(1)
    expect(await scrollTop(first)).toBe(600)
    await visible(toc(first).getByRole('link', { name: 'Added section' }))

    write(
      'ada/notes/Home.vue',
      read('ada/notes/Home.vue').replace('Hello from Home', 'Home, edited'),
    )
    for (const page of [first, second])
      await visible(
        embedded(page).getByRole('heading', { name: 'Home, edited' }),
      )
    expect(
      await second.evaluate(
        () => (window as unknown as { studioMark?: number }).studioMark,
      ),
    ).toBe(1)
  })

  test('[PR-114] a document that can’t be read shows the error with "Copy error", and reads again once fixed; while catching up it says it is out of date', async () => {
    reset()
    const page = await open()
    await visible(title(page, 'Research brief'))
    const original = read('ada/notes/Brief.md')

    write(
      'ada/notes/Brief.md',
      original.replace('title: Research brief', 'title: [Research brief'),
    )
    await visible(page.getByRole('alert'))
    await visible(page.getByRole('button', { name: 'Copy error' }))
    await hidden(title(page, 'Research brief'))

    write('ada/notes/Brief.md', original)
    await visible(title(page, 'Research brief'))
    await hidden(page.getByRole('alert'))

    // A slow reply: the page keeps the old text and says it is catching up.
    await page.route('**/_studio/files/source*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      await route.continue()
    })
    write('ada/notes/Brief.md', original.replace('The end.', 'The real end.'))
    await visible(
      page.getByText('This document is out of date. Updating document…'),
    )
    await visible(page.getByText('The real end.'))
    await hidden(
      page.getByText('This document is out of date. Updating document…'),
    )
  })

  test('[CL-52] [PR-115] a new document in your own prototype gets its permanent ID in its frontmatter', async () => {
    reset()
    write('ada/notes/Plan.md', '---\ntitle: Plan\n---\n\nThe plan.\n')
    await expect
      .poll(
        () =>
          /^---\nstudioId: [0-9a-z]{16}\ntitle: Plan\n---\n/.test(
            read('ada/notes/Plan.md'),
          ),
        {
          timeout: 30_000,
        },
      )
      .toBe(true)
    const id = /studioId: (\S+)/.exec(read('ada/notes/Plan.md'))![1]
    const page = await newPage()
    await page.goto(`${studio.url}prototypes/${NOTES}/artifacts/${id}`)
    await visible(title(page, 'Plan'))
  })
})

describe('on the deployed site', { timeout: 120_000 }, () => {
  const newPage = useBrowser()
  let site: RunningStudio
  beforeAll(async () => {
    reset()
    site = await startStaticSite('/studio-docs/', ADA)
  })
  afterAll(async () => {
    await site?.stop()
  })

  test('[PR-106] [PR-112] [PR-102] documents read the same, read-only, with embedded views and the deployed wording for missing files', async () => {
    const page = await newPage()
    const requests: string[] = []
    page.on('request', (request) => requests.push(request.url()))
    await page.goto(`${site.url}prototypes/${NOTES}/artifacts/${BRIEF}`)
    await visible(title(page, 'Research brief'))
    await visible(toc(page))
    await visible(
      embedded(page).getByRole('heading', { name: 'Hello from Home' }),
    )
    await visible(
      article(page).getByText(
        'Not on this site. It may be archived. Run the studio locally to see it.',
      ),
    )
    await visible(
      article(page).locator('[data-diagram-state="ready"] svg').first(),
    )
    expect(
      await page.getByRole('button', { name: 'File actions' }).count(),
    ).toBe(0)
    expect(requests.some((url) => url.includes('_studio/files'))).toBe(false)
    // Nothing comes from outside the site.
    const origin = new URL(site.url).origin
    expect(
      requests.filter(
        (url) => /^https?:/.test(url) && new URL(url).origin !== origin,
      ),
    ).toEqual([])

    await article(page)
      .getByRole('link', { name: 'the notes', exact: true })
      .first()
      .click()
    await visible(title(page, 'Interview notes'))
  })
})
