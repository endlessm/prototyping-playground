// The preview document in development renders a component's draft on its
// playground, and only there: Tailwind is told to scan the Git-ignored
// drafts, the views module points the playground at the draft while there
// is one, and the draft's relative imports resolve from the component's own
// folder. The build knows nothing of drafts. [LAB-07]
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { createServer, type ViteDevServer } from 'vite'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { draftMap } from '../../tooling/files/drafts-folder.ts'
import {
  previewConfig,
  VIEWS_RESOLVED,
  type PreviewView,
} from '../../tooling/preview/pipeline.ts'
import {
  loadSystems,
  type InstalledSystem,
} from '../../tooling/systems/registry.ts'

const ROOT = path.resolve(import.meta.dirname, '../..')
const posix = (file: string) => file.split(path.sep).join('/')

let server: ViteDevServer
let workDir: string
let draftsDir: string
let system: InstalledSystem
let button: string
let draft: string

beforeAll(async () => {
  const config = JSON.parse(
    readFileSync(path.join(ROOT, 'studio.config.json'), 'utf8'),
  )
  const { systems } = await loadSystems(ROOT, config)
  system = systems.find(({ key }) => key === 'endless-studios')!
  mkdirSync(path.join(ROOT, '.e2e'), { recursive: true })
  workDir = mkdtempSync(path.join(ROOT, '.e2e', 'drafts-work-'))
  draftsDir = mkdtempSync(path.join(ROOT, '.e2e', 'drafts-'))
  button = path.join(system.dir, 'components/button/button.vue')
  draft = draftMap(system.dir, path.join(draftsDir, system.id)).draftOf(button)!
  const views: PreviewView[] = [
    {
      id: 'playground1',
      file: button,
      prototype: '',
      path: '',
      playground: true,
    },
    {
      id: 'example1',
      file: button,
      prototype: '',
      path: '',
      example: 'Default',
    },
  ]
  const preview = await previewConfig(
    { key: system.id, system },
    {
      root: ROOT,
      workDir,
      baseURL: '/',
      prototypesDir: path.join(ROOT, 'src/prototypes'),
      views: () => views,
      draftsDir,
    },
    'serve',
  )
  server = await createServer({
    ...preview,
    logLevel: 'error',
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
  })
}, 120_000)

afterAll(async () => {
  await server?.close()
  for (const dir of [workDir, draftsDir])
    if (dir) rmSync(dir, { recursive: true, force: true })
})

async function viewsModule() {
  const loaded = await server.pluginContainer.load(VIEWS_RESOLVED)
  return typeof loaded === 'string' ? loaded : String(loaded?.code)
}

describe('[LAB-07] drafts in the preview document', () => {
  test('Tailwind scans the system’s drafts, which Git ignores', () => {
    const css = readFileSync(
      path.join(workDir, system.id, 'preview.css'),
      'utf8',
    )
    expect(css).toContain(
      `@source '${posix(path.relative(path.join(workDir, system.id), path.join(draftsDir, system.id)))}';`,
    )
    expect(readFileSync(path.join(draftsDir, '.gitignore'), 'utf8')).toBe('*\n')
  })

  test('the playground renders the draft while there is one; examples keep the file', async () => {
    expect(await viewsModule()).not.toContain(posix(draft))
    mkdirSync(path.dirname(draft), { recursive: true })
    writeFileSync(draft, readFileSync(button, 'utf8'))
    const code = await viewsModule()
    const playground = code
      .split('\n')
      .find((line) => line.includes('playground1'))!
    const example = code.split('\n').find((line) => line.includes('example1'))!
    expect(playground).toContain(`import(${JSON.stringify(posix(draft))})`)
    expect(example).toContain(`import(${JSON.stringify(posix(button))})`)
    rmSync(draft)
    expect(await viewsModule()).not.toContain(posix(draft))
  })

  test('a draft’s relative imports resolve from the component’s folder', async () => {
    const resolved = await server.pluginContainer.resolveId(
      './button.examples.vue',
      draft,
    )
    expect(posix(resolved!.id)).toBe(
      posix(path.join(system.dir, 'components/button/button.examples.vue')),
    )
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
