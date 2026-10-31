// Who is working, as the browser and the dev-server registry see it. The
// studio runs on the contributor fixtures, as Ada, with a runtime folder of
// its own.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import {
  isAlive,
  readDevServer,
  type DevServerRecord,
} from '../../tooling/dev-server/registry'
import { useBrowser } from './setup/browser'
import {
  startDevServer,
  startStaticSite,
  type RunningStudio,
} from './setup/studio'

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-e2e-people-'))
const people = path.join(work, 'contributors')
fs.cpSync('tests/fixtures/contributors', people, { recursive: true })
const env = {
  STUDIO_CONTRIBUTORS: people,
  STUDIO_RUNTIME_DIR: path.join(work, 'runtime'),
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'user.name',
  GIT_CONFIG_VALUE_0: 'Ada Lovelace',
  GIT_CONFIG_KEY_1: 'user.email',
  GIT_CONFIG_VALUE_1: 'ada@endless.example',
  STUDIO_GITHUB: '',
}

// Vitest's own environment would make Nuxt build in test mode.
const cleanEnv = () =>
  Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) =>
        !['NODE_ENV', 'TEST'].includes(key) && !key.startsWith('VITEST'),
    ),
  )

function cli(...args: string[]) {
  return spawnSync(process.execPath, ['tooling/studio/cli.ts', ...args], {
    encoding: 'utf8',
    env: { ...cleanEnv(), ...env, STUDIO_BUILD_DIR: '.nuxt-e2e' },
  })
}

afterAll(() => {
  fs.rmSync(work, { recursive: true, force: true })
})

describe('on the dev server', () => {
  const newPage = useBrowser()
  let studio: RunningStudio
  beforeAll(async () => {
    // Where this test reads the record, too.
    process.env.STUDIO_RUNTIME_DIR = env.STUDIO_RUNTIME_DIR
    studio = await startDevServer(env)
  })
  afterAll(async () => {
    cli('dev', 'stop')
    await studio?.stop()
    delete process.env.STUDIO_RUNTIME_DIR
  })

  test('[SH-136] [SH-94] Home greets you by name, and follows a change to your profile', async () => {
    const page = await newPage()
    // Every text the heading shows, from the first paint.
    await page.addInitScript(() => {
      const seen: string[] = []
      ;(window as unknown as { headings: string[] }).headings = seen
      new MutationObserver(() => {
        const text = document.querySelector('h1')?.textContent?.trim()
        if (text && seen.at(-1) !== text) seen.push(text)
      }).observe(document, {
        subtree: true,
        childList: true,
        characterData: true,
      })
    })
    await page.goto(studio.url)
    const greeting = page.getByText('Welcome back, Ada')
    await expect
      .poll(() => greeting.isVisible(), { timeout: 60_000 })
      .toBe(true)
    // Blank until the dev server says who you are: never the studio's name
    // first.
    expect(
      await page.evaluate(
        () => (window as unknown as { headings: string[] }).headings,
      ),
    ).toEqual(['Welcome back, Ada'])

    const file = path.join(people, 'ada.json')
    const profile = JSON.parse(fs.readFileSync(file, 'utf8'))
    fs.writeFileSync(
      file,
      JSON.stringify({ ...profile, name: 'Augusta Lovelace' }, null, 2),
    )
    await expect
      .poll(() => page.getByText('Welcome back, Augusta').isVisible(), {
        timeout: 30_000,
      })
      .toBe(true)
  })

  test('[CL-54] the running server records its folder, port, process, URL, start time and who started it', () => {
    const current = readDevServer(process.cwd())
    expect(current.state).toBe('running')
    const record = (current as { record: DevServerRecord }).record
    expect(path.resolve(record.root)).toBe(path.resolve('.'))
    expect(record.url).toBe(studio.url)
    expect(String(record.port)).toBe(new URL(studio.url).port)
    expect(isAlive(record.pid)).toBe(true)
    expect(Date.parse(record.startedAt)).not.toBeNaN()
    expect(record.startedBy).toBe('ada')
  })

  test('[CL-55] a second dev server for the same studio is refused', () => {
    const second = spawnSync(
      process.execPath,
      ['node_modules/nuxt/bin/nuxt.mjs', 'dev', '--port', '0'],
      {
        encoding: 'utf8',
        timeout: 240_000,
        env: {
          ...cleanEnv(),
          ...env,
          STUDIO_BUILD_DIR: '.nuxt-e2e-second',
        },
      },
    )
    expect(second.status).not.toBe(0)
    expect(second.stdout + second.stderr).toContain(
      'A dev server is already running for this studio',
    )
    fs.rmSync('.nuxt-e2e-second', { recursive: true, force: true })
  }, 300_000)

  test('[CL-57] restart replaces only the recorded server, on the same port', async () => {
    const before = (readDevServer(process.cwd()) as { record: DevServerRecord })
      .record
    const result = cli('dev', 'restart', '--json')
    expect(result.status, result.stdout + result.stderr).toBe(0)
    const { record } = JSON.parse(result.stdout) as { record: DevServerRecord }
    expect(record.port).toBe(before.port)
    expect(record.pid).not.toBe(before.pid)
    expect(isAlive(before.pid)).toBe(false)

    // Loads Home until the new server serves it, then waits for the greeting.
    const page = await newPage()
    const greets = async () => {
      if (await page.getByText(/^Welcome back, /).isVisible()) return true
      if (!(await page.getByRole('heading', { level: 1 }).isVisible()))
        await page.goto(studio.url).catch(() => undefined)
      return false
    }
    await expect
      .poll(greets, { timeout: 240_000, interval: 2_000 })
      .toBe(true)
      .catch((error: Error) => {
        const log = path.join(env.STUDIO_RUNTIME_DIR, 'dev-server.log')
        const output = fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : ''
        throw new Error(`${error.message}\n${output || 'No server log.'}`)
      })

    expect(cli('dev', 'stop').status).toBe(0)
    expect(isAlive(record.pid)).toBe(false)
    expect(readDevServer(process.cwd()).state).toBe('absent')
  }, 420_000)
})

describe('on the static build', () => {
  const newPage = useBrowser()
  let site: RunningStudio & { directory: string }
  beforeAll(async () => {
    site = await startStaticSite('/studio-e2e/', env)
  })
  afterAll(async () => {
    await site?.stop()
  })

  test('[SH-136] nobody is identified', async () => {
    const page = await newPage()
    await page.goto(site.url)
    await expect
      .poll(() => page.getByRole('heading', { level: 1 }).isVisible(), {
        timeout: 60_000,
      })
      .toBe(true)
    expect(await page.getByText(/^Welcome back, /).count()).toBe(0)
  })

  test('[CL-125] the build carries no full profile: bylines only, never emails or preferences', () => {
    const files = fs.readdirSync(site.directory, {
      recursive: true,
    }) as string[]
    for (const file of files) {
      const full = path.join(site.directory, file)
      if (!fs.statSync(full).isFile()) continue
      const text = fs.readFileSync(full, 'utf8')
      expect(text, file).not.toContain('ada@endless.example')
      expect(text, file).not.toContain('ben@home.example')
      expect(text, file).not.toContain('"preferences"')
    }
    // Gallery cards name each maker (PR-04): name, GitHub account and
    // avatar, and nothing else from the profile.
    const manifests = files.filter((file) =>
      /studio-manifest[\\/]index\.[0-9a-f]+\.json$/.test(file),
    )
    expect(manifests).toHaveLength(1)
    const { contributors } = JSON.parse(
      fs.readFileSync(path.join(site.directory, manifests[0]!), 'utf8'),
    ) as { contributors: Record<string, unknown>[] }
    for (const contributor of contributors)
      for (const field of Object.keys(contributor))
        expect(['id', 'key', 'name', 'github', 'avatar']).toContain(field)
  })
})
