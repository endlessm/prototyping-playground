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
  {
    restart: { ...en.settings, reload: en.settings.reloadStudio },
    system: en.systems.transition,
  },
  '/',
)

/** A page load: the server its document came from, and its code's. */
interface Load {
  document: string
  /** Null: the application never starts. */
  code: string | null
  /** One of its modules fails to load. */
  broken?: boolean
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
<!-- As in the studio: the head script runs before the identity tag is parsed. -->
<script>${SCRIPT}</script>
<meta name="${IDENTITY_TAG}" content="${load.document}">
</head><body>
<div id="__nuxt"><h1>Studio</h1><button type="button">Studio button</button>
<input aria-label="Studio name" value="Draft">
<div id="closed" inert><button type="button">Closed panel</button></div></div>
${load.broken ? `<script type="module" src="${ORIGIN}missing.js"></script>` : ''}
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

// On Linux the outgoing server still answers beside the new one, so the
// reload the new server's answer prompts can reach the outgoing one.
test('[SH-119] a reload that reaches the outgoing server keeps the screen and loads again once the new server answers', async () => {
  await start({ kind: 'restart', from: 'A', confirmation: 'Settings saved' })
  world.answering = 'B'
  world.next.push({ document: 'A', code: 'A' })
  await until(() => world.loads.length === 2)
  expect(await covered()).toBe(true)
  await page.clock.runFor(200)
  expect(world.confirmations).toEqual([])
  await until(() => world.loads.length === 3)
  await until(settled)
  expect(world.loads.at(-1)).toEqual({ document: 'B', code: 'B' })
  expect(world.confirmations).toEqual(['Settings saved'])
})

// The new server can serve the page while the code it runs still comes from
// the outgoing one: finishing there would show the confirmation, then lose
// it to Vite's next reload.
test('[SH-119] [SY-59] a page from the new server running the outgoing server’s code keeps the screen, loads again, then finishes with its confirmation once', async () => {
  await start({ kind: 'restart', from: 'A', confirmation: 'Settings saved' })
  world.answering = 'B'
  world.next.push({ document: 'B', code: 'A' })
  await until(() => world.loads.length === 2)
  await page.clock.runFor(200)
  expect(await covered()).toBe(true)
  expect(world.confirmations).toEqual([])
  await until(() => world.loads.length === 3)
  await until(settled)
  expect(world.loads.at(-1)).toEqual({ document: 'B', code: 'B' })
  expect(world.confirmations).toEqual(['Settings saved'])
  await page.clock.runFor(5000)
  expect(world.loads).toHaveLength(3)
  expect(world.confirmations).toEqual(['Settings saved'])
})

/** What the keyboard reaches from the start of the page, by Tab. */
async function reachable() {
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  const reached = new Set<string>()
  for (let step = 0; step < 8; step++) {
    await page.keyboard.press('Tab')
    reached.add(
      await page.evaluate(() => {
        const element = document.activeElement
        return element === document.body
          ? ''
          : (element?.getAttribute('aria-label') ??
              element?.textContent?.trim() ??
              '')
      }),
    )
  }
  reached.delete('')
  return [...reached].sort()
}
const focused = () =>
  page.evaluate(() => document.activeElement?.textContent?.trim() ?? '')

test('[SH-120] nothing behind the screen is reachable, focus moves to Reload studio, and lifting it restores exactly what it made inert', async () => {
  expect(await reachable()).toEqual(['Studio button', 'Studio name'])
  await start({ kind: 'restart', from: 'A' })
  expect(await reachable()).toEqual([])
  // A dialog the app opens meanwhile is out of reach too.
  await page.evaluate(() => {
    const dialog = document.createElement('button')
    dialog.textContent = 'Opened dialog'
    document.body.append(dialog)
  })
  expect(await reachable()).toEqual([])
  world.answering = ''
  await page.clock.runFor(15_500)
  expect(await focused()).toBe('Reload studio')
  expect(await reachable()).toEqual(['Reload studio'])
  // Lifted: as reachable as before, and what the app itself had made inert
  // stays so.
  await page.evaluate(
    (global) =>
      (window as unknown as Record<string, RestartHandoff>)[global]!.cancel(),
    HANDOFF_GLOBAL,
  )
  await page.clock.runFor(1000)
  expect(await reachable()).toEqual([
    'Opened dialog',
    'Studio button',
    'Studio name',
  ])
})

test('[SH-120] the page a handoff finishes on is as reachable as before', async () => {
  await start({ kind: 'restart', from: 'A' })
  world.answering = 'B'
  await until(() => world.loads.length === 2)
  await until(settled)
  expect(await reachable()).toEqual(['Studio button', 'Studio name'])
})

test('[SH-120] with reduced motion the spinner and the fade stop', async () => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await start({ kind: 'restart', from: 'A' })
  const motion = () =>
    page.evaluate(() => {
      const screen = document.getElementById('studio-restart')!
      return [
        getComputedStyle(screen.querySelector('.spinner')!).animationName,
        getComputedStyle(screen).transitionDuration,
      ]
    })
  expect(await motion()).toEqual(['none', '0s'])
  await page.evaluate(
    (global) =>
      (window as unknown as Record<string, RestartHandoff>)[global]!.cancel(),
    HANDOFF_GLOBAL,
  )
  // Gone at once, not after a fade.
  expect(await page.locator('#studio-restart').count()).toBe(0)
})

/** Calls the handoff's interface on the page. */
function call(method: 'update' | 'markReady' | 'cancel', ...args: unknown[]) {
  return page.evaluate(
    ([global, method, args]) =>
      (
        (window as unknown as Record<string, RestartHandoff>)[global]![
          method
        ] as (...args: unknown[]) => void
      )(...args),
    [HANDOFF_GLOBAL, method, args] as const,
  )
}

test('[SH-119] [SH-120] a browser reload in the middle of a restart brings the screen back, and the tab still recovers by itself', async () => {
  await start({ kind: 'restart', from: 'A', confirmation: 'Settings saved' })
  await page.reload()
  expect(await covered()).toBe(true)
  expect(await said()).toBe(
    'The studio is restarting. This page will reload when it’s ready.',
  )
  expect(await reachable()).toEqual([])
  await page.clock.runFor(15_500)
  expect(await said()).toBe(
    'The studio has not finished restarting. Reload to check again.',
  )
  world.answering = 'B'
  await until(() => world.loads.length === 3)
  await until(settled)
  expect(world.confirmations).toEqual(['Settings saved'])
})

test('[SH-122] a handoff with a destination finishes only once it is marked ready, with the confirmation it was last given', async () => {
  await start({ kind: 'restart', from: 'A', destination: true })
  await call('update', { confirmation: 'Settings saved' })
  world.answering = 'B'
  await until(() => world.loads.length === 2)
  await page.clock.runFor(5000)
  expect(await covered()).toBe(true)
  expect(world.confirmations).toEqual([])
  await call('markReady')
  await until(settled)
  expect(world.confirmations).toEqual(['Settings saved'])
  expect(world.loads).toHaveLength(2)
})

// Between two servers a page can get its document from the new one and fail
// to get its code from either; nothing else would load it again.
test('[SH-119] a page from the new server whose application fails to load loads again once a server answers', async () => {
  await start({ kind: 'restart', from: 'A', confirmation: 'Settings saved' })
  world.answering = 'B'
  world.next.push({ document: 'B', code: null, broken: true })
  await until(() => world.loads.length === 2)
  expect(await covered()).toBe(true)
  await until(() => world.loads.length === 3)
  await until(settled)
  expect(world.confirmations).toEqual(['Settings saved'])
})

test('[SH-119] a page from the new server whose application hasn’t started after a minute loads again', async () => {
  await start({ kind: 'restart', from: 'A' })
  world.answering = 'B'
  world.next.push({ document: 'B', code: null })
  await until(() => world.loads.length === 2)
  await page.clock.runFor(30_000)
  expect(world.loads).toHaveLength(2)
  expect(await covered()).toBe(true)
  await page.clock.runFor(30_000)
  await until(() => world.loads.length === 3)
  await until(settled)
})

test('[SH-119] [SH-121] a restart after a cancelled one on the same page covers it and recovers the same way', async () => {
  await start({ kind: 'restart', from: 'A' })
  await call('cancel')
  await page.clock.runFor(20_000)
  expect(await covered()).toBe(false)
  expect(world.loads).toHaveLength(1)
  world.answering = ''
  await start({ kind: 'restart', from: 'A', confirmation: 'Settings saved' })
  await page.clock.runFor(15_500)
  expect(await said()).toBe(
    'The studio has not finished restarting. Reload to check again.',
  )
  world.answering = 'B'
  await until(() => world.loads.length === 2)
  await until(settled)
  expect(world.confirmations).toEqual(['Settings saved'])
})

// A system change in the tab that asked for it: the caller's own words.
const RENAMING = {
  kind: 'system',
  from: 'A',
  title: 'Renaming Cove',
  description: en.systems.transition.descriptions.rename,
}
const heading = () => page.getByRole('status').getByRole('heading')
const screenUp = () => page.getByRole('status').isVisible()

test('[SY-25] a system change’s screen reads as its caller says, and offers Reload studio after 30 seconds without repeating the request', async () => {
  world.answering = ''
  await start(RENAMING)
  expect(await heading().textContent()).toBe('Renaming Cove')
  expect(await said()).toBe('Updating its folder, references and the studio.')
  const reload = page.getByRole('button', { name: 'Reload studio' })
  // No 15-second fallback: a system change says nothing until 30 seconds.
  await page.clock.runFor(15_500)
  expect(await said()).toBe('Updating its folder, references and the studio.')
  expect(await reload.isVisible()).toBe(false)
  await page.clock.runFor(15_000)
  expect(await said()).toBe(
    'This is taking longer than expected. Reload to check the studio. Your request will not be repeated.',
  )
  expect(await reload.isVisible()).toBe(true)
  expect(await page.getByRole('status').count()).toBe(1)
})

test('[SY-25] a system change’s 30 seconds count from its start, across reloads', async () => {
  world.answering = ''
  await start(RENAMING)
  await page.clock.runFor(20_000)
  await page.reload()
  expect(await heading().textContent()).toBe('Renaming Cove')
  expect(await said()).toBe('Updating its folder, references and the studio.')
  await page.clock.runFor(10_500)
  expect(await said()).toBe(
    'This is taking longer than expected. Reload to check the studio. Your request will not be repeated.',
  )
})

test('[SY-25] a system change’s screen older than 2 minutes is forgotten', async () => {
  world.answering = ''
  await start(RENAMING)
  await page.clock.runFor(119_000)
  await page.reload()
  expect(await screenUp()).toBe(true)
  await page.clock.runFor(2000)
  await page.reload()
  await page.clock.runFor(1000)
  expect(await screenUp()).toBe(false)
  expect(await reachable()).toEqual(['Studio button', 'Studio name'])
  // Forgotten, not only hidden.
  await page.reload()
  expect(await screenUp()).toBe(false)
})

test('a system change’s screen keeps the studio’s colours as they were when it started, across reloads', async () => {
  const paint = (background: string, foreground: string) =>
    page.evaluate(
      ([background, foreground]) => {
        const root = document.documentElement.style
        root.setProperty('--ui-bg', background)
        root.setProperty('--ui-text-highlighted', foreground)
      },
      [background, foreground] as const,
    )
  const colours = () =>
    page.getByRole('status').evaluate((screen) => {
      const style = getComputedStyle(screen)
      return [style.backgroundColor, style.color]
    })
  world.answering = ''
  await paint('rgb(10, 20, 30)', 'rgb(200, 210, 220)')
  await start(RENAMING)
  expect(await colours()).toEqual(['rgb(10, 20, 30)', 'rgb(200, 210, 220)'])
  // The theme the page changes to meanwhile doesn't reach the screen.
  await paint('rgb(255, 255, 255)', 'rgb(0, 0, 0)')
  expect(await colours()).toEqual(['rgb(10, 20, 30)', 'rgb(200, 210, 220)'])
  await page.reload()
  expect(await colours()).toEqual(['rgb(10, 20, 30)', 'rgb(200, 210, 220)'])
})
