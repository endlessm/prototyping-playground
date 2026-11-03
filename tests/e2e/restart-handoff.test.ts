// The restart handoff, replayed in a real browser without a dev server: a
// small page carries the studio's own head script, the clock is fake, and the
// test scripts which dev server answers the light check and which one serves
// each page load's document and code. On Linux, Nuxt starts the new server on
// the same port while the outgoing one still answers, so a reload can meet
// either; the replay makes those moments happen on every run, in seconds.
import { afterEach, beforeEach, expect, test } from 'vitest'
import type { Page } from 'playwright'
import { useBrowser } from './setup/browser'
import {
  handoffScript,
  type RestartHandoff,
} from '../../tooling/restart/handoff'
import {
  HANDOFF_GLOBAL,
  IDENTITY_TAG,
  LIGHT_CHECK,
} from '../../tooling/restart/names'
import en from '../../i18n/locales/en.json'

const ORIGIN = 'http://studio.test/'
const SCRIPT = handoffScript(
  { restart: { ...en.settings, reload: en.settings.reloadStudio } },
  '/',
)

/** A page load: the server its document came from, and its code's. */
interface Load {
  document: string
  /** Null: the application never starts. */
  code: string | null
}

/**
 * The scripted world: who answers the light check (`answering`, '' for
 * nobody), and what each page load gets: the next scripted load, or the
 * server answering now.
 */
interface World {
  answering: string
  next: Load[]
  loads: Load[]
  confirmations: string[]
}

// Stands in for the studio's application: once the page has loaded it tells
// the handoff where its code came from, and shows confirmations.
function application(code: string | null, global: string) {
  if (code === null) return
  addEventListener('load', () => {
    const handoff = (window as unknown as Record<string, RestartHandoff>)[
      global
    ]!
    handoff.connect({
      codeServer: code,
      confirm: (title: string) =>
        (window as unknown as { confirmed: (title: string) => void }).confirmed(
          title,
        ),
    })
  })
}

function html(load: Load) {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="${IDENTITY_TAG}" content="${load.document}">
<script>${SCRIPT}</script>
</head><body>
<div id="__nuxt"><h1>Studio</h1><button type="button">Studio button</button>
<label>Studio name <input value="Draft"></label>
<div id="closed" inert><button type="button">Closed panel</button></div></div>
<script>(${application})(${JSON.stringify(load.code)},${JSON.stringify(HANDOFF_GLOBAL)})</script>
</body></html>`
}

const newPage = useBrowser()
let page: Page
let world: World
beforeEach(async () => {
  page = await newPage()
  world = { answering: 'A', next: [], loads: [], confirmations: [] }
  await page.clock.install()
  await page.exposeBinding('confirmed', (_source, title: string) => {
    world.confirmations.push(title)
  })
  await page.route(`${ORIGIN}**`, async (route) => {
    const request = route.request()
    if (request.url() === `${ORIGIN}${LIGHT_CHECK}`) {
      if (!world.answering) return route.abort('connectionrefused')
      return route.fulfill({ json: { instance: world.answering } })
    }
    if (request.resourceType() !== 'document') return route.abort()
    const load = world.next.shift() ?? {
      document: world.answering,
      code: world.answering,
    }
    world.loads.push(load)
    return route.fulfill({ contentType: 'text/html', body: html(load) })
  })
  await page.goto(ORIGIN)
})
afterEach(async () => {
  await page?.context().close()
})

/** What a caller does: starts a handoff on the page. */
function start(handoff: Record<string, unknown>) {
  return page.evaluate(
    ([global, handoff]) =>
      (window as unknown as Record<string, RestartHandoff>)[global]!.start(
        handoff as never,
      ),
    [HANDOFF_GLOBAL, handoff] as const,
  )
}
const said = () =>
  page.getByRole('status').locator('p').textContent({ timeout: 2000 })
const screen = () => page.getByText('Applying changes', { exact: true })

test('[SH-120] [SH-121] the restart screen says plainly that the studio is restarting, then offers Reload studio after 15 and 30 seconds', async () => {
  world.answering = ''
  await start({ kind: 'restart', from: 'A' })
  expect(await screen().isVisible()).toBe(true)
  expect(await said()).toBe(
    'The studio is restarting. This page will reload when it’s ready.',
  )
  const reload = page.getByRole('button', { name: 'Reload studio' })
  expect(await reload.isVisible()).toBe(false)
  await page.clock.runFor(15_500)
  expect(await said()).toBe(
    'The studio has not finished restarting. Reload to check again.',
  )
  expect(await reload.isVisible()).toBe(true)
  await page.clock.runFor(15_000)
  expect(await said()).toBe(
    'This is taking longer than expected. Reload to check again.',
  )
  expect(await reload.isVisible()).toBe(true)
})

/**
 * Lets time pass, half a second per step as the light check's pace, until
 * `done`: a reload replaces the page meanwhile.
 */
async function until(done: () => boolean | Promise<boolean>) {
  await expect
    .poll(
      async () => {
        await page.waitForLoadState().catch(() => undefined)
        if (await done()) return true
        await page.clock.runFor(500).catch(() => undefined)
        return false
      },
      { timeout: 10_000, interval: 50 },
    )
    .toBe(true)
  await page.waitForLoadState()
}
/** Whether the screen is up on a loaded page. */
const covered = () => screen().isVisible()
/** Whether the screen is gone from a loaded page, after any fade. */
async function settled() {
  await page.clock.runFor(1000).catch(() => undefined)
  return (await page.locator('#studio-restart').count()) === 0
}

test('[SH-119] [SH-122] a tab that heard the restart reloads once the new server answers, and finishes there with its confirmation once', async () => {
  await start({ kind: 'restart', from: 'A', confirmation: 'Settings saved' })
  // The outgoing server still answers: nothing happens.
  await page.clock.runFor(5000)
  expect(world.loads).toHaveLength(1)
  expect(await covered()).toBe(true)
  // Between servers, then the new one.
  world.answering = ''
  await page.clock.runFor(2000)
  world.answering = 'B'
  await until(() => world.loads.length === 2)
  expect(world.loads[1]).toEqual({ document: 'B', code: 'B' })
  await until(settled)
  expect(world.confirmations).toEqual(['Settings saved'])
  // Delivered once: loading again shows nothing.
  await page.reload()
  await page.clock.runFor(5000)
  expect(await covered()).toBe(false)
  expect(world.confirmations).toEqual(['Settings saved'])
})
