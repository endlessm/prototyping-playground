// Diagrams: a designer writes Mermaid in a `.mermaid` or `.mmd` file of a
// prototype and sees it drawn filling the page, in the studio's colours for
// the colour mode, updating as the file is saved, with Mermaid's message
// when the text is wrong. Documents embed it as a compact preview. The
// deployed site draws the same diagrams, read-only. The studio runs as Ada,
// who owns the fixture prototype, on a disposable copy inside the checkout.
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

const FIXTURES = 'tests/fixtures/diagrams'
mkdirSync('.e2e', { recursive: true })
const content = mkdtempSync(path.join('.e2e', 'diagrams-'))
const posix = (file: string) => file.split(path.sep).join('/')
cpSync(FIXTURES, content, { recursive: true })

const FLOWS = 'd1a6000000000001'
const SIGN_IN = 'd1a6000000000002'
const HANDOFF = 'd1a6000000000003'
const BROKEN = 'd1a6000000000004'
const UNSAFE = 'd1a6000000000005'
const GUIDE = 'd1a6000000000006'

const at = (file: string) => path.join(content, file)
const read = (file: string) => readFileSync(at(file), 'utf8')
function write(file: string, text: string) {
  mkdirSync(path.dirname(at(file)), { recursive: true })
  if (!existsSync(at(file)) || read(file) !== text)
    writeFileSync(at(file), text)
}
// The fixtures again: changed files rewritten in place, extra files removed.
function reset() {
  const dir = 'ada/flows'
  for (const name of readdirSync(at(dir)))
    if (!existsSync(path.join(FIXTURES, dir, name)))
      rmSync(at(path.join(dir, name)), { force: true })
  for (const name of readdirSync(path.join(FIXTURES, dir)))
    write(
      path.join(dir, name),
      readFileSync(path.join(FIXTURES, dir, name), 'utf8'),
    )
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
const diagram = (page: Page) => page.locator('[data-diagram-state]').first()
const ready = (page: Page) =>
  expect
    .poll(() => diagram(page).getAttribute('data-diagram-state'), {
      timeout: 60_000,
    })
    .toBe('ready')
const embed = (page: Page, artifact: string) =>
  page.locator(`[data-preview-artifact="${artifact}"]`)
const mark = (page: Page) =>
  page.evaluate(() => {
    ;(window as unknown as { studioMark: number }).studioMark = 1
  })
const marked = (page: Page) =>
  page.evaluate(() => (window as unknown as { studioMark?: number }).studioMark)

describe('in the studio running locally', { timeout: 150_000 }, () => {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await startDevServer(ADA)
    // The first diagram compiles the page and Mermaid.
    const page = await newPage()
    await page.goto(`${studio.url}prototypes/${FLOWS}/artifacts/${SIGN_IN}`)
    await page
      .locator('[data-diagram-state="ready"]')
      .waitFor({ timeout: 180_000 })
    await page.close()
  }, 300_000)
  afterAll(async () => {
    await studio?.stop()
  })

  async function open(artifact: string) {
    const page = await newPage()
    await page.goto(`${studio.url}prototypes/${FLOWS}/artifacts/${artifact}`)
    return page
  }

  test('[PR-117] [PR-118] a .mermaid file opens as a diagram filling the page, in the studio’s font, and draws again in dark mode', async () => {
    reset()
    const page = await open(SIGN_IN)
    await ready(page)
    const svg = diagram(page).locator('svg')
    await visible(svg.getByText('Sign in', { exact: true }))
    // The diagram fills the page's width, under the header.
    const size = await page.evaluate(() => {
      const figure = document.querySelector('[data-diagram-state]')!
      const svg = figure.querySelector('svg')!
      return {
        svg: svg.getBoundingClientRect().width,
        figure: figure.getBoundingClientRect().width,
        window: window.innerWidth,
        height: svg.getBoundingClientRect().height,
        font: getComputedStyle(svg.querySelector('.nodeLabel, text')!)
          .fontFamily,
        body: getComputedStyle(document.body).fontFamily,
      }
    })
    expect(size.figure).toBeGreaterThan(size.window * 0.6)
    expect(size.svg).toBeGreaterThan(size.figure * 0.8)
    expect(size.height).toBeGreaterThan(300)
    expect(size.font).toBe(size.body)
    // Accessible title and description come from the source.
    expect(await svg.getAttribute('aria-roledescription')).toBe('flowchart-v2')
    expect(await svg.locator('title').textContent()).toBe('Sign-in flow')

    const light = await svg.innerHTML()
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect
      .poll(() => diagram(page).locator('svg').innerHTML(), { timeout: 30_000 })
      .not.toBe(light)
    await ready(page)
  })

  test('[PR-117] a .mmd file opens as a diagram too', async () => {
    reset()
    const page = await open(HANDOFF)
    await ready(page)
    await visible(
      diagram(page)
        .locator('svg')
        .getByText('Shares the flow', { exact: true }),
    )
  })

  test('[PR-119] saving the file draws the new diagram without a reload, keeping the previous drawing until the new one is ready', async () => {
    reset()
    const page = await open(SIGN_IN)
    await ready(page)
    await visible(
      diagram(page).locator('svg').getByText('Home', { exact: true }),
    )
    await mark(page)
    // A slow reply: the old drawing stays, saying it is updating.
    await page.route('**/_studio/files/source*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      await route.continue()
    })
    write(
      'ada/flows/Sign-in.mermaid',
      read('ada/flows/Sign-in.mermaid').replace('[Home]', '[Dashboard]'),
    )
    await visible(page.getByText('Updating diagram…'))
    expect(
      await diagram(page)
        .locator('svg')
        .getByText('Home', { exact: true })
        .count(),
    ).toBe(1)
    await visible(
      diagram(page).locator('svg').getByText('Dashboard', { exact: true }),
    )
    await hidden(page.getByText('Updating diagram…'))
    expect(await marked(page)).toBe(1)
  })

  test('[PR-120] invalid Mermaid shows its message, the source still opens to repair it, and the fix draws again', async () => {
    reset()
    const page = await open(BROKEN)
    await expect
      .poll(() => diagram(page).getAttribute('data-diagram-state'), {
        timeout: 60_000,
      })
      .toBe('error')
    const alert = diagram(page).getByRole('alert')
    await visible(alert.getByText('Unable to render Mermaid diagram.'))
    expect(await alert.locator('pre').innerText()).toMatch(/Parse error/)

    // The file's menu in the navigation, as in React.
    await page
      .getByRole('navigation', { name: 'Flows' })
      .getByRole('link', { name: 'Broken', exact: true })
      .click({ button: 'right' })
    await page.getByRole('menuitem', { name: /Edit source/ }).click()
    const source = page.getByRole('textbox', {
      name: `Source of ${posix(content)}/ada/flows/Broken.mermaid`,
    })
    await visible(source)
    expect(await source.innerText()).toContain('start[Sign in -->')

    write(
      'ada/flows/Broken.mermaid',
      read('ada/flows/Broken.mermaid').replace(
        'start[Sign in -->',
        'start[Sign in] --> fixed[Fixed]',
      ),
    )
    await page.getByRole('button', { name: 'Done' }).click()
    await ready(page)
    await visible(
      diagram(page).locator('svg').getByText('Fixed', { exact: true }),
    )
  })

  test('[PR-120] a diagram says it is rendering, and gives up after 15 seconds', async () => {
    reset()
    const page = await newPage()
    // Mermaid itself never arrives.
    await page.route(/\/deps\/mermaid\.js/, () => undefined)
    await page.goto(`${studio.url}prototypes/${FLOWS}/artifacts/${SIGN_IN}`)
    await visible(page.getByText('Rendering diagram…'))
    await expect
      .poll(
        () =>
          page
            .getByText(
              'Diagram rendering took too long. Repair the source or reload this view.',
            )
            .isVisible(),
        { timeout: 30_000 },
      )
      .toBe(true)
  })

  test('[PR-120] Mermaid draws with its strict security: HTML in labels and script links never run', async () => {
    reset()
    const page = await open(UNSAFE)
    await ready(page)
    const svg = diagram(page).locator('svg')
    await visible(svg.getByText('Next', { exact: true }))
    // Mermaid's sanitizer keeps the picture and drops its handler.
    expect(await svg.locator('[onerror], script').count()).toBe(0)
    await svg.getByText('Next', { exact: true }).click()
    await page.waitForTimeout(500)
    expect(await page.evaluate(() => 'studioDiagramRan' in window)).toBe(false)
  })

  test('[PR-121] a document embeds a diagram as a compact preview whose header opens it; a broken one shows its error', async () => {
    reset()
    const page = await open(GUIDE)
    const flow = embed(page, SIGN_IN)
    await expect
      .poll(
        () =>
          flow
            .locator('[data-diagram-state]')
            .getAttribute('data-diagram-state'),
        { timeout: 60_000 },
      )
      .toBe('ready')
    await visible(flow.locator('svg').getByText('Sign in', { exact: true }))
    const box = await flow.boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(220)
    expect(box!.height).toBeLessThanOrEqual(440)
    await visible(
      embed(page, BROKEN).getByText('Unable to render Mermaid diagram.'),
    )

    const header = page.getByRole('link', { name: 'Open Sign-in flow' })
    await header.hover()
    await visible(header.getByText('Open', { exact: true }))
    await header.click()
    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 30_000 })
      .toBe(`/prototypes/${FLOWS}/artifacts/${SIGN_IN}`)
    await ready(page)
  })

  test('[PR-121] an embedded diagram says it is loading, and that it could not load', async () => {
    reset()
    const page = await newPage()
    await page.route(
      `**/_studio/files/source*artifact=${SIGN_IN}*`,
      async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 3000))
        await route.continue()
      },
    )
    await page.route(`**/_studio/files/source*artifact=${BROKEN}*`, (route) =>
      route.abort(),
    )
    await page.goto(`${studio.url}prototypes/${FLOWS}/artifacts/${GUIDE}`)
    await visible(embed(page, SIGN_IN).getByText('Loading diagram…'))
    await visible(
      embed(page, BROKEN).getByText(
        'This diagram could not load. Open it to inspect its source.',
      ),
    )
    await visible(
      embed(page, SIGN_IN).locator('svg').getByText('Home', { exact: true }),
    )
    await hidden(embed(page, SIGN_IN).getByText('Loading diagram…'))
  })

  test('[PR-122] [CL-52] a new diagram in your own prototype gets its permanent ID in a leading comment', async () => {
    reset()
    write('ada/flows/Plan.mermaid', 'flowchart LR\n  a[Plan] --> b[Ship]\n')
    await expect
      .poll(
        () =>
          /^%% @studio-id [0-9a-z]{16}\nflowchart LR\n/.test(
            read('ada/flows/Plan.mermaid'),
          ),
        { timeout: 30_000 },
      )
      .toBe(true)
    const id = /@studio-id (\S+)/.exec(read('ada/flows/Plan.mermaid'))![1]
    const page = await open(id!)
    await ready(page)
    await visible(
      diagram(page).locator('svg').getByText('Ship', { exact: true }),
    )
  })
})

describe('on the deployed site', { timeout: 120_000 }, () => {
  const newPage = useBrowser()
  let site: RunningStudio
  beforeAll(async () => {
    reset()
    site = await startStaticSite('/studio-diagrams/', ADA)
  })
  afterAll(async () => {
    await site?.stop()
  })

  test('[PR-117] [PR-121] diagrams draw the same, read-only, on their pages and in documents', async () => {
    const page = await newPage()
    const requests: string[] = []
    page.on('request', (request) => requests.push(request.url()))
    await page.goto(`${site.url}prototypes/${FLOWS}/artifacts/${SIGN_IN}`)
    await ready(page)
    await visible(
      diagram(page).locator('svg').getByText('Home', { exact: true }),
    )
    expect(
      await page.getByRole('button', { name: 'File actions' }).count(),
    ).toBe(0)

    await page.goto(`${site.url}prototypes/${FLOWS}/artifacts/${GUIDE}`)
    await visible(
      embed(page, SIGN_IN).locator('svg').getByText('Home', { exact: true }),
    )
    expect(requests.some((url) => url.includes('_studio/files'))).toBe(false)
  })
})
