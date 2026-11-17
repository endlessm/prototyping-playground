// A component's playground in its system's preview document: the document
// mounts the component file itself, at its defaults, and applies the props
// the studio sends by message in place, without remounting or reloading.
// Props that make it throw report an error, and the next props bring it
// back. The document is driven from a blank page on the studio's origin,
// standing in for the studio, against the dev server and the static build,
// on a disposable copy of `tests/fixtures/systems-area` with a button added.
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { PREVIEW_ROUTE } from '../../tooling/preview/constants'
import { playgroundId } from '../../tooling/systems/preview-ids'
import { useBrowser } from './setup/browser'
import {
  startDevServer,
  startStaticSite,
  type RunningStudio,
} from './setup/studio'

mkdirSync('.e2e', { recursive: true })
const content = mkdtempSync(path.join('.e2e', 'playground-'))
const posix = (file: string) => file.split(path.sep).join('/')
cpSync('tests/fixtures/systems-area', content, { recursive: true })

const HARBOR = 'hrbr000000000001'
const BUTTON = playgroundId(HARBOR, 'button')
const at = (file: string) => path.join(content, 'systems', 'harbor', file)
function write(file: string, text: string) {
  mkdirSync(path.dirname(at(file)), { recursive: true })
  writeFileSync(at(file), text)
}
write(
  'components/button/button.vue',
  `<script setup lang="ts">
import { computed } from 'vue'
const props = withDefaults(
  defineProps<{
    /** What the button says. */
    label?: string
    tone?: 'calm' | 'loud'
    /** Breaks the button, for the error scenario. */
    sink?: boolean
  }>(),
  { label: 'Moor the boat', tone: 'calm', sink: false },
)
const text = computed(() => {
  if (props.sink) throw new Error('The button sank.')
  return props.label
})
</script>
<template><button :data-tone="tone">{{ text }}</button></template>
`,
)

writeFileSync(
  path.join(content, 'studio.config.json'),
  JSON.stringify({
    formatVersion: 1,
    name: 'Playground Studio',
    tagline: 'Fixture',
    modules: { prototypes: true, systems: true, contributors: true },
    systems: ['attic', 'harbor', 'lantern'],
    defaultSystem: HARBOR,
    admins: ['ada0000000000001'],
    systemMaintainers: {},
  }),
)

const ENV = {
  STUDIO_CONFIG: posix(path.join(content, 'studio.config.json')),
  STUDIO_SYSTEMS: posix(path.join(content, 'systems')),
  STUDIO_PROTOTYPES: posix(path.join(content, 'prototypes')),
  STUDIO_CONTRIBUTORS: 'tests/fixtures/contributors',
  STUDIO_GITHUB: '',
}

afterAll(() => {
  rmSync(content, { recursive: true, force: true })
})

interface Host {
  state: string | null
  detail: string
  runtime: string | null
  readies: number
}

/**
 * A blank page on the studio's origin holding the preview document for the
 * button's playground, answering it the way the studio does: `configure`
 * then `props` after each `ready`. `send` sends new props.
 */
async function openHost(page: Page, studio: RunningStudio) {
  const blank = `${studio.url}__playground-host`
  await page.route(blank, (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html><body></body></html>',
    }),
  )
  await page.goto(blank)
  await page.evaluate(
    ({ src, artifact }) => {
      const session = 'playground-session'
      const host = { state: null, detail: '', runtime: null, readies: 0 } as {
        state: string | null
        detail: string
        runtime: string | null
        readies: number
      }
      let props: Record<string, unknown> = {}
      const frame = document.createElement('iframe')
      frame.title = 'Playground'
      frame.style.cssText = 'width: 600px; height: 400px; border: 0'
      frame.src = `${src}?artifact=${artifact}&session=${session}`
      const post = (message: Record<string, unknown>) =>
        frame.contentWindow?.postMessage(
          {
            channel: 'studio-preview',
            version: 1,
            session,
            runtime: host.runtime,
            artifact,
            ...message,
          },
          location.origin,
        )
      window.addEventListener('message', (event) => {
        const message = event.data as Record<string, unknown> | null
        if (
          event.source !== frame.contentWindow ||
          message?.channel !== 'studio-preview' ||
          message.session !== session
        )
          return
        if (message.kind === 'ready') {
          host.readies++
          host.runtime = message.runtime as string
          post({ kind: 'configure' })
          post({ kind: 'props', props })
        } else if (message.kind === 'status') {
          host.state = message.state as string
          host.detail = message.detail as string
        }
      })
      Object.assign(window, {
        host,
        send: (next: Record<string, unknown>) => {
          props = next
          post({ kind: 'props', props: next })
        },
        sendRaw: (message: Record<string, unknown>) => post(message),
      })
      document.body.append(frame)
    },
    {
      src: `${new URL(studio.url).pathname}${PREVIEW_ROUTE}${HARBOR}/`,
      artifact: BUTTON,
    },
  )
  const frame = page.frameLocator('iframe[title="Playground"]')
  const host = () =>
    page.evaluate(() => (window as unknown as { host: Host }).host)
  const send = (props: Record<string, unknown>) =>
    page.evaluate(
      (next) =>
        (window as unknown as { send: (p: unknown) => void }).send(next),
      props,
    )
  return { frame, host, send }
}

function scenarios(start: () => Promise<RunningStudio>) {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await start()
    // The first visit builds the preview document; later ones are quicker.
    const page = await newPage()
    const { host } = await openHost(page, studio)
    const deadline = Date.now() + 300_000
    while ((await host()).state !== 'ready' && Date.now() < deadline)
      await page.waitForTimeout(500)
    await page.close()
  }, 900_000)
  afterAll(async () => {
    await studio?.stop()
  })

  test('renders the real component file alone, at its defaults', async () => {
    const page = await newPage()
    const { frame, host } = await openHost(page, studio)
    await expect.poll(async () => (await host()).state).toBe('ready')
    const button = frame.getByRole('button', { name: 'Moor the boat' })
    await expect.poll(() => button.isVisible()).toBe(true)
    expect(await button.getAttribute('data-tone')).toBe('calm')
    expect(await frame.getByRole('button').count()).toBe(1)
  })

  test('new props update the component in place, and a removed prop goes back to its default', async () => {
    const page = await newPage()
    const { frame, host, send } = await openHost(page, studio)
    await expect.poll(async () => (await host()).state).toBe('ready')
    const button = frame.locator('button')
    await expect.poll(() => button.textContent()).toBe('Moor the boat')
    // Marks on the document and on the button's element show whether
    // either was replaced.
    await button.evaluate((element) => {
      ;(element as unknown as { mark: boolean }).mark = true
      ;(window as unknown as { mark: boolean }).mark = true
    })

    await send({ label: 'Cast off', tone: 'loud' })
    await expect.poll(() => button.textContent()).toBe('Cast off')
    expect(await button.getAttribute('data-tone')).toBe('loud')

    await send({ label: 'Cast off' })
    await expect.poll(() => button.getAttribute('data-tone')).toBe('calm')
    expect(await button.textContent()).toBe('Cast off')

    expect(
      await button.evaluate((element) => ({
        element: (element as unknown as { mark?: boolean }).mark,
        document: (window as unknown as { mark?: boolean }).mark,
      })),
    ).toEqual({ element: true, document: true })
    expect((await host()).readies).toBe(1)
  })

  test('props that are not plain JSON values are ignored', async () => {
    const page = await newPage()
    const { frame, host } = await openHost(page, studio)
    await expect.poll(async () => (await host()).state).toBe('ready')
    await page.evaluate(() => {
      const raw = (window as unknown as { sendRaw: (m: unknown) => void })
        .sendRaw
      raw({ kind: 'props', props: { label: undefined } })
      raw({ kind: 'props', props: { label: 'Sunk', when: new Date(0) } })
      raw({ kind: 'props', props: ['Sunk'] })
    })
    await page.waitForTimeout(500)
    expect(await frame.locator('button').textContent()).toBe('Moor the boat')
    expect((await host()).state).toBe('ready')
  })

  test('props that make it throw report its error, and the next props bring it back', async () => {
    const page = await newPage()
    const { frame, host, send } = await openHost(page, studio)
    await expect.poll(async () => (await host()).state).toBe('ready')

    await send({ sink: true })
    await expect.poll(async () => (await host()).state).toBe('error')
    expect((await host()).detail).toContain('The button sank.')

    await send({ label: 'Afloat again' })
    await expect.poll(async () => (await host()).state).toBe('ready')
    await expect
      .poll(() => frame.locator('button').textContent())
      .toBe('Afloat again')
    expect((await host()).readies).toBe(1)
  })
}

describe('in the studio running locally', { timeout: 180_000 }, () => {
  scenarios(() => startDevServer(ENV))
})

describe('on the deployed site', { timeout: 180_000 }, () => {
  scenarios(() => startStaticSite('/', ENV))
})
