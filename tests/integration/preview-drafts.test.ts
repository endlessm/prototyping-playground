// The preview document in development scans the Lab versions' drafts with
// Tailwind, though Git ignores them, so a draft's new classes style its
// stage. The build knows nothing of drafts. [LAB-07]
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { versionDraftsPath } from '../../tooling/files/drafts-folder.ts'
import { previewConfig } from '../../tooling/preview/pipeline.ts'
import {
  loadSystems,
  type InstalledSystem,
} from '../../tooling/systems/registry.ts'

const ROOT = path.resolve(import.meta.dirname, '../..')
const posix = (file: string) => file.split(path.sep).join('/')

let workDir: string
let draftsDir: string
let system: InstalledSystem

beforeAll(async () => {
  const config = JSON.parse(
    readFileSync(path.join(ROOT, 'studio.config.json'), 'utf8'),
  )
  const { systems } = await loadSystems(ROOT, config)
  system = systems.find(({ key }) => key === 'endless-studios')!
  mkdirSync(path.join(ROOT, '.e2e'), { recursive: true })
  workDir = mkdtempSync(path.join(ROOT, '.e2e', 'drafts-work-'))
  draftsDir = mkdtempSync(path.join(ROOT, '.e2e', 'drafts-'))
  await previewConfig(
    { key: system.id, system },
    {
      root: ROOT,
      workDir,
      baseURL: '/',
      prototypesDir: path.join(ROOT, 'src/prototypes'),
      views: () => [],
      draftsDir,
    },
    'serve',
  )
}, 120_000)

afterAll(() => {
  for (const dir of [workDir, draftsDir])
    if (dir) rmSync(dir, { recursive: true, force: true })
})

describe('[LAB-07] drafts in the preview document', () => {
  test('Tailwind scans the versions’ drafts, which Git ignores', () => {
    const css = readFileSync(
      path.join(workDir, system.id, 'preview.css'),
      'utf8',
    )
    expect(css).toContain(
      `@source '${posix(path.relative(path.join(workDir, system.id), versionDraftsPath(draftsDir)))}';`,
    )
    expect(readFileSync(path.join(draftsDir, '.gitignore'), 'utf8')).toBe('*\n')
  })

  test('the build has no drafts', async () => {
    const buildDir = mkdtempSync(path.join(ROOT, '.e2e', 'drafts-build-'))
    try {
      await previewConfig(
        { key: system.id, system },
        {
          root: ROOT,
          workDir: buildDir,
          baseURL: '/',
          prototypesDir: path.join(ROOT, 'src/prototypes'),
          views: () => [],
        },
        'build',
      )
      expect(
        readFileSync(path.join(buildDir, system.id, 'preview.css'), 'utf8'),
      ).not.toContain('drafts')
    } finally {
      rmSync(buildDir, { recursive: true, force: true })
    }
  })
})
