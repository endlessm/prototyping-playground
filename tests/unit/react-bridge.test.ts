import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

// The React bridge of the old studio is gone: views are Vue files that render
// in their system's preview document.
const system = 'src/systems/endless-studios'

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name)
    if (entry.name === 'node_modules') return []
    return entry.isDirectory() ? files(file) : [file]
  })
}

const sources = () =>
  [...files(system), ...files('tooling'), ...files('app')].filter((file) =>
    /\.(ts|tsx|vue|js|css)$/.test(file),
  )

describe('the React bridge', () => {
  // Reading every source file can pass 5 s while the other test files run.
  test('[SY-186] [SY-187] [CL-126] has no VueInline, VueScreen, shadow-root mount or React wrappers', () => {
    expect(files(system).filter((file) => file.endsWith('.tsx'))).toEqual([])
    for (const file of sources()) {
      const text = readFileSync(file, 'utf8')
      expect(text, file).not.toMatch(/\bVueInline\b|\bVueScreen\b/)
      expect(text, file).not.toMatch(/attachShadow|adoptedStyleSheets/)
    }
  }, 30_000)

  test('[SY-188] has no stylesheet mapping studio names onto the app’s roles', () => {
    expect(existsSync(path.join(system, 'styles/theme.css'))).toBe(false)
  })

  test('[SY-189] declares no React peer dependencies', () => {
    const pkg = JSON.parse(
      readFileSync(path.join(system, 'package.json'), 'utf8'),
    )
    expect(pkg.peerDependencies ?? {}).toEqual({})
    expect(Object.keys(pkg.dependencies)).not.toContain('react')
  })

  test('[SY-137] has no Tailwind token inventory check', () => {
    for (const file of sources())
      expect(readFileSync(file, 'utf8'), file).not.toMatch(
        /token inventory|tokenInventory/i,
      )
  })
})
