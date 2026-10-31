import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'
import { buildStaticSite, startDevServer } from './setup/studio'

test('[CL-104] module-owned Manual page problems warn in dev and stop the strict build', async () => {
  mkdirSync('.e2e', { recursive: true })
  const folder = mkdtempSync(path.join('.e2e', 'manual-checks-'))
  try {
    const modules = path.join(folder, 'modules')
    cpSync('tests/fixtures/modules/sample', path.join(modules, 'sample'), {
      recursive: true,
    })
    writeFileSync(
      path.join(modules, 'sample/check.ts'),
      "export const check = () => ['pages/intro.md: Manual title is missing. Add a plain-text title to frontmatter.']",
    )
    const config = path.join(folder, 'studio.config.json')
    writeFileSync(
      config,
      JSON.stringify({
        ...JSON.parse(readFileSync('studio.config.json', 'utf8')),
        modules: { sample: true },
      }),
    )
    const env = {
      STUDIO_MODULES: modules.split(path.sep).join('/'),
      STUDIO_CONFIG: config.split(path.sep).join('/'),
      STUDIO_PROTOTYPES: 'tests/fixtures/prototypes',
    }
    const dev = await startDevServer(env)
    try {
      expect((await fetch(dev.url)).status).toBe(200)
    } finally {
      await dev.stop()
    }
    const failure = await buildStaticSite('/', env).then(
      () => '',
      (error: Error) => error.message,
    )
    expect(failure).toContain('pages/intro.md')
    expect(failure).toContain('Add a plain-text title')
  } finally {
    rmSync(folder, { recursive: true, force: true })
  }
}, 300_000)

test('[CL-104] strict build refuses invalid prototype metadata with file and remedy', async () => {
  mkdirSync('.e2e', { recursive: true })
  const folder = mkdtempSync(path.join('.e2e', 'checks-'))
  try {
    cpSync('tests/fixtures/prototypes', folder, { recursive: true })
    // Locate by walking the fixture's actual contributor folders.
    const { readdirSync } = await import('node:fs')
    const owner = readdirSync(folder)[0]!
    const prototype = readdirSync(path.join(folder, owner))[0]!
    const target = path.join(folder, owner, prototype, 'meta.json')
    const previous = JSON.parse(readFileSync(target, 'utf8'))
    writeFileSync(target, JSON.stringify({ ...previous, title: '<invalid>' }))
    const failure = await buildStaticSite('/', {
      STUDIO_PROTOTYPES: folder.split(path.sep).join('/'),
    }).then(
      () => '',
      (error: Error) => error.message,
    )
    expect(failure).toContain('meta.json')
    expect(failure).toContain('plain text')
    expect(failure).toContain('Fix these declarations')
  } finally {
    rmSync(folder, { recursive: true, force: true })
  }
}, 300_000)
