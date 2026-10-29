// Permanent identities in the running studio: new views get theirs while the
// dev server runs, a permanent link survives renames and moves, and the build
// refuses missing or shared IDs. The studio runs as Ada on a disposable copy
// of the fixture prototypes.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { identity as view } from '../../src/modules/prototypes/types/view/identity'
import { useBrowser } from './setup/browser'
import {
  buildStaticSite,
  startDevServer,
  startStaticSite,
  type RunningStudio,
} from './setup/studio'

const DEMO = 'dem0000000000001'
const ID = /^[0-9a-hjkmnp-tv-z]{16}$/

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-e2e-ids-'))
const prototypes = path.join(work, 'prototypes')
const people = path.join(work, 'contributors')
fs.cpSync('tests/fixtures/prototypes', prototypes, { recursive: true })
fs.cpSync('tests/fixtures/contributors', people, { recursive: true })
const env = {
  STUDIO_PROTOTYPES: prototypes,
  STUDIO_CONTRIBUTORS: people,
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'user.name',
  GIT_CONFIG_VALUE_0: 'Ada Lovelace',
  GIT_CONFIG_KEY_1: 'user.email',
  GIT_CONFIG_VALUE_1: 'ada@endless.example',
  STUDIO_GITHUB: '',
}

// The new view's ID, assigned on the dev server.
let start: string

const at = (file: string) => path.join(prototypes, file)
function write(file: string, text: string) {
  fs.mkdirSync(path.dirname(at(file)), { recursive: true })
  fs.writeFileSync(at(file), text)
}
const idOf = (file: string) => view.read(fs.readFileSync(at(file), 'utf8'))
const template = (text: string) =>
  `<template>\n  <main>\n    <p>${text}</p>\n  </main>\n</template>\n`

write(
  'ada/demo/meta.json',
  JSON.stringify({ title: 'Demo', studioId: DEMO, systemId: null }, null, 2),
)

afterAll(() => {
  fs.rmSync(work, { recursive: true, force: true })
})

async function shows(page: Page, title: string, text: string) {
  const frame = page.locator(`iframe[title="${title}"]`)
  await expect
    .poll(() => frame.getAttribute('data-preview-state'), { timeout: 60_000 })
    .toBe('ready')
  const content = frame.contentFrame().getByText(text)
  await expect.poll(() => content.isVisible(), { timeout: 30_000 }).toBe(true)
}

describe('on the dev server', () => {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    studio = await startDevServer(env)
  })
  afterAll(async () => {
    await studio?.stop()
  })

  test('[CL-52] [PR-69] a view created on disk in your prototype gets its ID within a second, as a leading HTML comment', async () => {
    write('ada/demo/Start.vue', template('Hello from Start'))
    const written = Date.now()
    await expect
      .poll(() => idOf('ada/demo/Start.vue'), { timeout: 5_000, interval: 50 })
      .toMatch(ID)
    expect(Date.now() - written).toBeLessThan(1_000)
    start = idOf('ada/demo/Start.vue')!
    expect(fs.readFileSync(at('ada/demo/Start.vue'), 'utf8')).toBe(
      `<!-- @studio-id ${start} -->\n${template('Hello from Start')}`,
    )

    const page = await newPage()
    await page.goto(`${studio.url}prototypes/${DEMO}`)
    await expect
      .poll(() => page.url(), { timeout: 60_000 })
      .toBe(`${studio.url}prototypes/${DEMO}/artifacts/${start}`)
    await shows(page, 'Start', 'Hello from Start')
  })

  test('[CL-52] a view in someone else’s prototype is left for its owner', async () => {
    write('bernardo/plain/Other.vue', template('Not mine'))
    await new Promise((resolve) => setTimeout(resolve, 1_500))
    expect(idOf('bernardo/plain/Other.vue')).toBeNull()
    fs.rmSync(at('bernardo/plain/Other.vue'))
  })

  test('[PR-69] a permanent link keeps working after the file is renamed and moved', async () => {
    const link = `${studio.url}prototypes/${DEMO}/artifacts/${start}`
    fs.mkdirSync(at('ada/demo/flows'), { recursive: true })
    fs.renameSync(at('ada/demo/Start.vue'), at('ada/demo/flows/Begin.vue'))
    await new Promise((resolve) => setTimeout(resolve, 1_000))
    // Moving it kept its ID; nothing new was assigned.
    expect(idOf('ada/demo/flows/Begin.vue')).toBe(start)

    // The link opens the moved file under its new name. Its preview follows
    // the move with the dev server's live updates (ticket 05); the static
    // build below renders it.
    const page = await newPage()
    await page.goto(link)
    await expect
      .poll(() => page.locator('iframe[title="Begin"]').count(), {
        timeout: 60_000,
      })
      .toBe(1)
    expect(page.url()).toBe(link)
    const begin = page
      .getByRole('navigation', { name: 'Demo' })
      .getByRole('link', { name: 'Begin' })
    expect(await begin.getAttribute('href')).toContain(`/artifacts/${start}`)
  })

  test('[PR-71] old readable link forms are not supported', async () => {
    const page = await newPage()
    await page.goto(`${studio.url}prototypes/demo`)
    await expect
      .poll(
        () => page.getByText("There's nothing at this address.").isVisible(),
        {
          timeout: 60_000,
        },
      )
      .toBe(true)
    await page.goto(`${studio.url}prototypes/${DEMO}/artifacts/Begin`)
    await expect
      .poll(() => page.getByRole('navigation', { name: 'Demo' }).isVisible(), {
        timeout: 60_000,
      })
      .toBe(true)
    expect(await page.locator('iframe').count()).toBe(0)
  })
})

describe('the static build, after the move', () => {
  const newPage = useBrowser()
  let site: RunningStudio
  beforeAll(async () => {
    site = await startStaticSite('/studio-e2e/', env)
  })
  afterAll(async () => {
    await site?.stop()
  })

  test('[PR-69] the permanent link from before the rename and move renders the view', async () => {
    const page = await newPage()
    const link = `${site.url}prototypes/${DEMO}/artifacts/${start}`
    await page.goto(link)
    await shows(page, 'Begin', 'Hello from Start')
    expect(page.url()).toBe(link)
  })
})

describe('the strict build', () => {
  test('[PR-69] fails on a missing or duplicate ID, naming the file', async () => {
    const broken = path.join(work, 'broken')
    fs.cpSync(prototypes, broken, { recursive: true })
    const shared = `<!-- @studio-id dpp0000000000001 -->\n${template('Twin')}`
    fs.writeFileSync(path.join(broken, 'ada/demo/A.vue'), shared)
    fs.writeFileSync(path.join(broken, 'ada/demo/B.vue'), shared)
    fs.writeFileSync(path.join(broken, 'ada/demo/Missing.vue'), template('?'))
    const failure = await buildStaticSite('/', {
      ...env,
      STUDIO_PROTOTYPES: broken,
    }).then(
      () => null,
      (error: Error) => error.message,
    )
    expect(failure).toContain(
      'every prototype and artifact needs its own permanent identity',
    )
    expect(failure).toMatch(
      /ada\/demo\/Missing\.vue: the permanent identity is missing\./,
    )
    expect(failure).toMatch(
      /ada\/demo\/B\.vue: the permanent identity dpp0000000000001 is already used by .*ada\/demo\/A\.vue\./,
    )
  }, 300_000)
})
