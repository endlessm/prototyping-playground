// Source mode: a designer opens an artifact's source from the file menu or
// with ⌘' / Ctrl+', edits it and saves through the dev server's file
// service. Changes made elsewhere reload the editor or offer a choice, and
// leaving with unsaved changes asks first. Someone else's prototype opens
// read-only, and the deployed site has no source mode at all. The studio
// runs as Ben (a contributor) on a disposable copy of the fixtures inside
// the checkout (preview documents serve files from the checkout only).
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
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

mkdirSync('.e2e', { recursive: true })
const content = mkdtempSync(path.join('.e2e', 'source-'))
const posix = (file: string) => file.split(path.sep).join('/')
cpSync('tests/fixtures/prototypes', content, { recursive: true })

const DEMO = 'dem0000000000002'
const HOME = 'vsrc000000000001'
const BROKEN = 'vsrc000000000002'
const OTHER = 'vsrc000000000003'
const PLAIN = 'p1a1n00000000001'
const PLAIN_VIEW = 'vp1an00000000001'

const at = (file: string) => path.join(content, file)
const read = (file: string) => readFileSync(at(file), 'utf8')
function write(file: string, text: string) {
  mkdirSync(path.dirname(at(file)), { recursive: true })
  writeFileSync(at(file), text)
}
const view = (id: string, body: string) =>
  `<!-- @studio-id ${id} -->\n${body.trim()}\n`
const home = (heading: string) =>
  view(
    HOME,
    `
<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>

<template>
  <main>
    <h1>${heading}</h1>
    <button type="button" @click="count++">Count {{ count }}</button>
  </main>
</template>
`,
  )
const BROKEN_SOURCE = view(
  BROKEN,
  `
<template>
  <main>
    <h1>Broken {{ </h1>
  </main>
</template>
`,
)
const FIXED_SOURCE = view(
  BROKEN,
  `
<template>
  <main>
    <h1>Repaired</h1>
  </main>
</template>
`,
)

function reset() {
  write(
    'ben/demo/meta.json',
    JSON.stringify({
      title: 'Demo',
      studioId: DEMO,
      ownerContributorId: 'ben0000000000002',
      systemId: null,
    }),
  )
  write('ben/demo/Home.vue', home('Hello'))
  write('ben/demo/Other.vue', view(OTHER, '<template><p>Other</p></template>'))
  write('ben/demo/Broken.vue', BROKEN_SOURCE)
}
reset()

const BEN = {
  STUDIO_PROTOTYPES: posix(content),
  STUDIO_CONTRIBUTORS: 'tests/fixtures/contributors',
  STUDIO_GITHUB: '',
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'user.name',
  GIT_CONFIG_VALUE_0: 'Ben Okafor',
  GIT_CONFIG_KEY_1: 'user.email',
  GIT_CONFIG_VALUE_1: 'ben@endless.example',
}

afterAll(() => {
  rmSync(content, { recursive: true, force: true })
})

const homeFile = `${posix(content)}/ben/demo/Home.vue`
const editor = (page: Page, file = homeFile) =>
  page.getByRole('textbox', { name: `Source of ${file}` })
const button = (page: Page, name: string) =>
  page.getByRole('button', { name, exact: true })
// Nuxt UI's tooltip names its trigger only through a hidden copy.
const tooltip = (page: Page, text: string) =>
  page.locator('[data-slot="content"]').filter({ hasText: text })
const preview = (page: Page) => page.locator('iframe').first().contentFrame()

async function visible(locator: { isVisible: () => Promise<boolean> }) {
  await expect.poll(() => locator.isVisible(), { timeout: 45_000 }).toBe(true)
}
async function hidden(locator: { isVisible: () => Promise<boolean> }) {
  await expect.poll(() => locator.isVisible(), { timeout: 30_000 }).toBe(false)
}
const query = (page: Page) => new URL(page.url()).search

// Replaces the editor's text the way pasting does.
async function replaceText(page: Page, text: string, file = homeFile) {
  await editor(page, file).click()
  await page.keyboard.press('Control+A')
  await page.keyboard.insertText(text)
}
async function editorText(page: Page, file = homeFile) {
  return (await editor(page, file).innerText()).replace(/\u200b/g, '')
}

// Cold pages and the first preview take a while on Windows.
describe('in the studio running locally', { timeout: 120_000 }, () => {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await startDevServer(BEN)
  })
  afterAll(async () => {
    await studio?.stop()
  })

  async function open(artifact = HOME, prototype = DEMO, search = '') {
    const page = await newPage()
    await page.goto(
      `${studio.url}prototypes/${prototype}/artifacts/${artifact}${search}`,
    )
    return page
  }

  test("[PR-125] [PR-126] [PR-130] [PR-135] the file menu and ⌘' / Ctrl+' switch between the page and its source, in the address", async () => {
    reset()
    const page = await open()
    await visible(preview(page).getByRole('heading', { name: 'Hello' }))

    await button(page, 'File actions').click()
    const item = page.getByRole('menuitem', { name: /Edit source/ })
    await visible(item)
    expect(await item.textContent()).toContain("Ctrl+'")
    await item.click()

    await visible(editor(page))
    expect(query(page)).toBe('?mode=source')
    await expect
      .poll(() =>
        editor(page).evaluate((node) => node === document.activeElement),
      )
      .toBe(true)
    expect(await editorText(page)).toContain('<h1>Hello</h1>')
    expect(await page.getByText(homeFile, { exact: true }).isVisible()).toBe(
      true,
    )
    expect(await button(page, 'Save').isDisabled()).toBe(true)
    await button(page, 'Done').hover()
    await visible(tooltip(page, "Return to the rendered page (Ctrl+')"))

    // The shortcut works inside the editor and returns focus to the page.
    await editor(page).click()
    await page.keyboard.press("Control+'")
    await hidden(editor(page))
    expect(query(page)).toBe('')
    await expect
      .poll(() =>
        page.evaluate(() =>
          document.activeElement?.contains(document.querySelector('iframe')),
        ),
      )
      .toBe(true)

    // A reload in source mode opens the source again.
    await page.keyboard.press("Control+'")
    await visible(editor(page))
    await page.reload()
    await visible(editor(page))

    await button(page, 'Done').click()
    await hidden(editor(page))
    expect(query(page)).toBe('')
  })

  test('[PR-127] the shortcut is ignored while a menu is open', async () => {
    reset()
    const page = await open()
    await visible(preview(page).getByRole('heading', { name: 'Hello' }))
    await button(page, 'File actions').click()
    await visible(page.getByRole('menu'))
    await page.keyboard.press("Control+'")
    await page.waitForTimeout(300)
    expect(query(page)).toBe('')
    expect(await editor(page).isVisible()).toBe(false)
  })

  test('[PR-131] [PR-129] ⌘S / Ctrl+S saves with a confirmation; the view kept its state while hidden and shows the change', async () => {
    reset()
    const page = await open()
    const frame = preview(page)
    await visible(frame.getByRole('heading', { name: 'Hello' }))
    await frame.getByRole('button', { name: 'Count 0' }).click()
    await visible(frame.getByRole('button', { name: 'Count 1' }))

    // Focus is inside the view now, so the file menu opens the source.
    await button(page, 'File actions').click()
    await page.getByRole('menuitem', { name: /Edit source/ }).click()
    await visible(editor(page))
    await replaceText(page, home('Saved from the studio'))
    await visible(page.getByText('Unsaved changes', { exact: true }))
    expect(await button(page, 'Save').isDisabled()).toBe(false)
    await button(page, 'Save').hover()
    await visible(tooltip(page, 'Save (Ctrl+S)'))
    await page.keyboard.press('Control+S')
    await visible(page.getByText('Saved', { exact: true }))
    await hidden(page.getByText('Unsaved changes', { exact: true }))
    expect(read('ben/demo/Home.vue')).toBe(home('Saved from the studio'))

    await button(page, 'Done').click()
    await visible(
      preview(page).getByRole('heading', { name: 'Saved from the studio' }),
    )
    // Still the same running view: its count survived.
    await visible(preview(page).getByRole('button', { name: 'Count 1' }))
  })

  test('[PR-132] a change on disk reloads a clean editor by itself', async () => {
    reset()
    const page = await open(HOME, DEMO, '?mode=source')
    await visible(editor(page))
    write('ben/demo/Home.vue', home('Changed by an agent'))
    await expect
      .poll(() => editorText(page), { timeout: 30_000 })
      .toContain('Changed by an agent')
    expect(await page.getByText('Unsaved changes').isVisible()).toBe(false)
  })

  test('[PR-132] with unsaved changes, a change on disk offers the new version or yours', async () => {
    reset()
    const page = await open(HOME, DEMO, '?mode=source')
    await visible(editor(page))
    await replaceText(page, home('Mine'))
    await visible(page.getByText('Unsaved changes', { exact: true }))

    write('ben/demo/Home.vue', home('Theirs'))
    const bar = page.getByRole('alert').filter({
      hasText: 'This file changed on disk while you were editing it.',
    })
    await visible(bar)
    await button(page, 'Load the new version').click()
    await hidden(bar)
    expect(await editorText(page)).toContain('<h1>Theirs</h1>')
    expect(await page.getByText('Unsaved changes').isVisible()).toBe(false)

    await replaceText(page, home('Mine again'))
    write('ben/demo/Home.vue', home('Theirs again'))
    await visible(bar)
    // A save over a version you haven't seen is refused by the server.
    await page.keyboard.press('Control+S')
    await page.waitForTimeout(500)
    expect(read('ben/demo/Home.vue')).toBe(home('Theirs again'))
    await visible(bar)
    await button(page, 'Keep mine').click()
    await hidden(bar)
    await page.keyboard.press('Control+S')
    await visible(page.getByText('Saved', { exact: true }))
    expect(read('ben/demo/Home.vue')).toBe(home('Mine again'))
  })

  test('[PR-133] leaving with unsaved changes asks first: Done, another page, and closing the tab', async () => {
    reset()
    const page = await open(HOME, DEMO, '?mode=source')
    await visible(editor(page))
    await replaceText(page, home('Not saved'))

    const dialog = page.getByRole('dialog', { name: 'Discard your changes?' })
    await button(page, 'Done').click()
    await visible(dialog)
    expect(await dialog.innerText()).toContain(
      `You have unsaved changes to ${homeFile}.`,
    )
    await button(page, 'Keep editing').click()
    await hidden(dialog)
    expect(query(page)).toBe('?mode=source')
    expect(await editorText(page)).toContain('Not saved')

    await page
      .getByRole('navigation')
      .getByRole('link', { name: 'Other', exact: true })
      .click()
    await visible(dialog)
    await button(page, 'Keep editing').click()
    await hidden(dialog)
    expect(page.url()).toContain(HOME)

    const types: string[] = []
    page.on('dialog', (asked) => {
      types.push(asked.type())
      void asked.dismiss()
    })
    await page.close({ runBeforeUnload: true })
    await expect.poll(() => types).toEqual(['beforeunload'])
  })

  test('[PR-133] Discard leaves without saving', async () => {
    reset()
    const page = await open(HOME, DEMO, '?mode=source')
    await visible(editor(page))
    await replaceText(page, home('Thrown away'))
    await button(page, 'Done').click()
    await button(page, 'Discard').click()
    await expect.poll(() => query(page)).toBe('')
    await hidden(editor(page))
    expect(read('ben/demo/Home.vue')).toBe(home('Hello'))
  })

  test('[PR-128] a broken view’s source opens, and saving the repair renders it', async () => {
    reset()
    const page = await open(BROKEN)
    await visible(button(page, 'Copy error'))
    await page.keyboard.press("Control+'")
    const brokenFile = `${posix(content)}/ben/demo/Broken.vue`
    await visible(editor(page, brokenFile))
    expect(await editorText(page, brokenFile)).toContain('Broken {{')
    await replaceText(page, FIXED_SOURCE, brokenFile)
    await page.keyboard.press('Control+S')
    await visible(page.getByText('Saved', { exact: true }))
    await button(page, 'Done').click()
    await visible(preview(page).getByRole('heading', { name: 'Repaired' }))
  })

  test('[PR-134] the editor numbers lines, closes brackets, searches with Ctrl+F and highlights Vue', async () => {
    reset()
    const page = await open(HOME, DEMO, '?mode=source')
    await visible(editor(page))
    // Line numbers.
    expect(await page.getByText('12', { exact: true }).isVisible()).toBe(true)
    // Vue: tag names are coloured, unlike plain text.
    const plain = await editor(page).evaluate(
      (node) => getComputedStyle(node).color,
    )
    await expect
      .poll(() =>
        editor(page)
          .getByText('h1', { exact: true })
          .first()
          .evaluate((node) => getComputedStyle(node).color),
      )
      .not.toBe(plain)
    // Brackets close themselves.
    await editor(page).click()
    await page.keyboard.press('Control+End')
    await page.keyboard.type('{')
    expect(await editorText(page)).toContain('{}')
    await page.keyboard.press('Control+Z')
    // Search.
    await page.keyboard.press('Control+F')
    await visible(page.getByRole('textbox', { name: 'Find' }))
  })

  test('[PR-136] [PR-126] someone else’s prototype offers View source, read-only, and says why', async () => {
    const page = await open(PLAIN_VIEW, PLAIN)
    await visible(
      preview(page).getByRole('heading', { name: 'Plain prototype' }),
    )
    await button(page, 'File actions').click()
    await page.getByRole('menuitem', { name: /View source/ }).click()
    const plainFile = `${posix(content)}/bernardo/plain/Plain.vue`
    await visible(editor(page, plainFile))
    await visible(page.getByText('Read-only', { exact: true }))
    expect(
      await page
        .getByRole('status')
        .filter({ hasText: 'This prototype belongs to someone else.' })
        .isVisible(),
    ).toBe(true)
    expect(await button(page, 'Save').count()).toBe(0)
    // Still focusable, for search and keyboard selection.
    expect(await editor(page, plainFile).getAttribute('tabindex')).toBe('0')
    expect(await editor(page, plainFile).getAttribute('contenteditable')).toBe(
      'false',
    )

    // The server refuses the write itself, with the reason.
    const reply = await page.evaluate(
      async ([prototype, artifact]) => {
        const url = '/_studio/files/source'
        const { version } = await (
          await fetch(`${url}?prototype=${prototype}&artifact=${artifact}`)
        ).json()
        const response = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prototype,
            artifact,
            content: 'x',
            base: version,
          }),
        })
        return { status: response.status, body: await response.json() }
      },
      [PLAIN, PLAIN_VIEW],
    )
    expect(reply).toEqual({
      status: 403,
      body: {
        code: 'owner',
        error:
          'This prototype belongs to someone else. You can change only your own.',
      },
    })
  })

  test('[CL-123] the file service answers only the studio’s own pages', async () => {
    const url = `${studio.url}_studio/files/source?prototype=${DEMO}&artifact=${HOME}`
    const own = await fetch(url, {
      headers: { 'Sec-Fetch-Site': 'same-origin' },
    })
    expect(own.status).toBe(200)
    const other = await fetch(url, {
      headers: { 'Sec-Fetch-Site': 'cross-site' },
    })
    expect(other.status).toBe(403)
  })
})

describe('with a module turned off', { timeout: 120_000 }, () => {
  const newPage = useBrowser()
  let studio: RunningStudio
  // A modules folder with copies of the real Prototypes and Contributors
  // modules (at the same depth as src/modules, so their relative imports
  // hold) and a Notes module, turned off, whose `.note` files are artifacts.
  const modules = mkdtempSync(path.join('.e2e', 'source-modules-'))
  const config = path.join(modules, 'studio.config.json')
  beforeAll(async () => {
    for (const id of ['prototypes', 'contributors'])
      cpSync(path.join('src/modules', id), path.join(modules, id), {
        recursive: true,
      })
    cpSync('tests/fixtures/source-modules/notes', path.join(modules, 'notes'), {
      recursive: true,
    })
    const real = JSON.parse(readFileSync('studio.config.json', 'utf8'))
    writeFileSync(
      config,
      JSON.stringify({ ...real, modules: { ...real.modules, notes: false } }),
    )
    write('ben/demo/Plan.note', view('n0te000000000001', 'A plan'))
    studio = await startDevServer({
      ...BEN,
      STUDIO_MODULES: posix(modules),
      STUDIO_CONFIG: posix(config),
    })
  })
  afterAll(async () => {
    await studio?.stop()
    rmSync(at('ben/demo/Plan.note'), { force: true })
    rmSync(modules, { recursive: true, force: true })
  })

  test('[PR-28] an artifact whose type is turned off says why, and its source still opens', async () => {
    const page = await newPage()
    await page.goto(
      `${studio.url}prototypes/${DEMO}/artifacts/n0te000000000001`,
    )
    await visible(
      page.getByText(
        'Note files can’t open here: the Notes module is turned off.',
      ),
    )
    await button(page, 'Open source').click()
    const noteFile = `${posix(content)}/ben/demo/Plan.note`
    await visible(editor(page, noteFile))
    expect(await editorText(page, noteFile)).toContain('A plan')
  })
})

describe('the deployed site', () => {
  const newPage = useBrowser()
  let site: Awaited<ReturnType<typeof startStaticSite>>
  beforeAll(async () => {
    // The build refuses a view that doesn't compile.
    reset()
    write('ben/demo/Broken.vue', FIXED_SOURCE)
    site = await startStaticSite('/', { STUDIO_PROTOTYPES: posix(content) })
  })
  afterAll(async () => {
    await site?.stop()
  })

  test('[CL-123] [PR-136] the static build has no file service and no source editor', async () => {
    const files = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const file = path.join(dir, name)
        return statSync(file).isDirectory() ? files(file) : [file]
      })
    const leaks = files(site.directory).filter((file) => {
      if (!/\.(m?js|html|json)$/.test(file)) return false
      const text = readFileSync(file, 'utf8')
      return text.includes('_studio/files') || text.includes('cm-gutters')
    })
    expect(leaks).toEqual([])
    const response = await fetch(
      `${site.url}_studio/files/source?prototype=${DEMO}&artifact=${HOME}`,
    )
    expect(response.headers.get('content-type')).not.toContain('json')
  })

  test("[PR-125] [PR-126] ?mode=source and ⌘' / Ctrl+' show the rendered page; there is no file menu", async () => {
    const page = await newPage()
    await page.goto(
      `${site.url}prototypes/${DEMO}/artifacts/${HOME}?mode=source`,
    )
    await visible(preview(page).getByRole('heading', { name: 'Hello' }))
    await page.keyboard.press("Control+'")
    await page.waitForTimeout(300)
    expect(await editor(page).count()).toBe(0)
    expect(await button(page, 'File actions').count()).toBe(0)
  })
})
