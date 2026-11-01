import { spawn, spawnSync } from 'node:child_process'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'
import { useBrowser } from './setup/browser'
import { freePort } from './setup/studio'

const newPage = useBrowser()

test('[SH-119] [CL-17] [CL-53] dev startup, configure and Settings restart refresh real agent guidance', async () => {
  mkdirSync('.e2e', { recursive: true })
  const root = mkdtempSync(path.resolve('.e2e/settings-sync-'))
  for (const entry of [
    'app',
    'i18n',
    'tooling',
    'src',
    'public',
    'nuxt.config.ts',
    'tsconfig.json',
    'package.json',
    'studio.config.json',
  ])
    cpSync(entry, path.join(root, entry), { recursive: true })
  cpSync('tests/fixtures/contributors', path.join(root, 'contributors'), {
    recursive: true,
  })
  symlinkSync(
    path.resolve('node_modules'),
    path.join(root, 'node_modules'),
    'junction',
  )
  const file = path.join(root, 'studio.config.json')
  const config = JSON.parse(readFileSync(file, 'utf8'))
  config.admins = ['ada0000000000001']
  writeFileSync(file, JSON.stringify(config, null, 2))
  writeFileSync(path.join(root, 'AGENTS.md'), '# Settings sync fixture\n')
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    STUDIO_GITHUB: '',
    GIT_CONFIG_COUNT: '2',
    GIT_CONFIG_KEY_0: 'user.email',
    GIT_CONFIG_VALUE_0: 'ada@endless.example',
    GIT_CONFIG_KEY_1: 'user.name',
    GIT_CONFIG_VALUE_1: 'Ada Lovelace',
  }
  const cleanEnv = Object.fromEntries(
    Object.entries(env).filter(
      ([key]) =>
        !key.startsWith('VITEST') &&
        ![
          'NODE_ENV',
          'TEST',
          'STUDIO_CONFIG',
          'STUDIO_MODULES',
          'STUDIO_CONTRIBUTORS',
          'STUDIO_RUNTIME_DIR',
        ].includes(key),
    ),
  )
  const cli = (...args: string[]) =>
    spawnSync(process.execPath, ['tooling/studio/cli.ts', ...args], {
      cwd: root,
      env: cleanEnv,
      encoding: 'utf8',
    })
  expect(cli('sync', '--check').status).toBe(1)
  const configured = cli('configure', '--name', 'Synced studio', '--yes')
  expect(configured.status, configured.stderr).toBe(0)
  expect(cli('sync', '--check').status).toBe(0)
  // Startup must repair drift too, without a fixture config override.
  writeFileSync(path.join(root, 'AGENTS.md'), '# Settings sync fixture\n')
  const port = await freePort()
  const server = spawn(
    process.execPath,
    [
      path.resolve('node_modules/nuxt/bin/nuxt.mjs'),
      'dev',
      '--port',
      String(port),
      '--host',
      '127.0.0.1',
    ],
    { cwd: root, env: cleanEnv, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  let log = ''
  server.stdout.on('data', (chunk) => {
    log += chunk
  })
  server.stderr.on('data', (chunk) => {
    log += chunk
  })
  const page = await newPage()
  try {
    const url = `http://127.0.0.1:${port}/`
    await expect
      .poll(
        async () =>
          fetch(url)
            .then((response) => response.ok)
            .catch(() => false),
        { timeout: 300000 },
      )
      .toBe(true)
    expect(cli('sync', '--check').status).toBe(0)
    await page.goto(`${url}settings`)
    // The started studio serves the manifest it built to its own pages.
    const manifest = await page.evaluate(async () => {
      const response = await fetch('/_studio/manifest/index.json')
      return { ok: response.ok, body: await response.json() }
    })
    expect(manifest.ok).toBe(true)
    expect(Array.isArray(manifest.body.prototypes)).toBe(true)
    expect(
      manifest.body.systems.map(({ key }: { key: string }) => key),
    ).toContain('endless-studios')
    const manual = page.getByRole('switch', { name: 'Manual', exact: true })
    await expect.poll(() => manual.isVisible(), { timeout: 60000 }).toBe(true)
    await manual.click()
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect
      .poll(
        () =>
          readFileSync(path.join(root, 'AGENTS.md'), 'utf8').includes(
            'src/modules/documentation/skills/write-manual',
          ),
        { timeout: 120000 },
      )
      .toBe(false)
    await expect
      .poll(
        () =>
          manual
            .getAttribute('aria-checked', { timeout: 1000 })
            .catch(() => null),
        { timeout: 120000 },
      )
      .toBe('false')
    expect(cli('sync', '--check').status).toBe(0)
  } finally {
    mkdirSync('.scratch', { recursive: true })
    writeFileSync('.scratch/28-real-sync-server.log', log)
    await page.context().close()
    const stopped = cli('dev', 'stop')
    expect(stopped.status, stopped.stderr).toBe(0)
  }
}, 600000)
