import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { loadRegistry } from '../../tooling/modules/registry'

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name)
    if (entry.name === 'node_modules') return []
    return entry.isDirectory() ? files(file) : [file]
  })
}
const sources = (...dirs: string[]) =>
  dirs
    .flatMap((dir) => files(dir))
    .filter((file) => /\.(ts|vue|js|mjs)$/.test(file))
    .map((file) => file.split(path.sep).join('/'))

describe('the canvas module', () => {
  test('[CV-02] is an optional module called Canvases', async () => {
    const { modules } = await loadRegistry(process.cwd())
    const canvas = modules.find(({ spec }) => spec.id === 'canvas')
    expect(canvas?.spec.label).toBe('Canvases')
    expect(canvas?.spec.required).toBeFalsy()
    expect(canvas?.spec.fileTypes?.[0]?.extensions).toEqual(['.excalidraw'])
  })

  test('[CV-03] nothing outside the module imports it, so the studio runs without it', () => {
    const outside = sources('app', 'tooling', 'src/modules').filter(
      (file) => !file.startsWith('src/modules/canvas/'),
    )
    for (const file of outside)
      expect(readFileSync(file, 'utf8'), file).not.toMatch(
        /modules\/canvas\b|@excalidraw\//,
      )
  })

  test('React and React DOM are used only by the canvas’s island', () => {
    const users = sources('app', 'tooling', 'src')
      .filter((file) => !file.startsWith('src/prototypes/'))
      .filter((file) =>
        /from '(react|react-dom)(\/[^']*)?'/.test(readFileSync(file, 'utf8')),
      )
    expect(users.length).toBeGreaterThan(0)
    for (const file of users)
      expect(file).toMatch(/^src\/modules\/canvas\/island\//)
  })

  test('[CL-145] [CV-44] Excalidraw is patched through yarn: link icons can be hidden and the desktop layout stays at any width', () => {
    const manifest = JSON.parse(readFileSync('package.json', 'utf8'))
    expect(manifest.dependencies['@excalidraw/excalidraw']).toMatch(
      /^patch:@excalidraw\/excalidraw@npm%3A0\.18\.1#/,
    )
    for (const build of ['dev', 'prod']) {
      const dir = `node_modules/@excalidraw/excalidraw/dist/${build}`
      const code = readdirSync(dir)
        .filter((file) => file.endsWith('.js'))
        .map((file) => readFileSync(path.join(dir, file), 'utf8'))
        .join('\n')
      expect(code.match(/customData\?\.hideLinkIcon/g)?.length).toBe(2)
    }
    expect(
      readFileSync(
        'node_modules/@excalidraw/excalidraw/dist/dev/index.js',
        'utf8',
      ),
    ).toMatch(/"isMobileBreakpoint", \(width, height\) => \{\s*return false;/)
  })
})
