// What the Systems area shows of Endless Studios' theme and assets, read from
// the app's own stylesheet (and the Tailwind and Nuxt UI themes it imports)
// and the copied app images, with no hand-kept mirror.
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, test } from 'vitest'
import {
  systemCatalog,
  type SystemCatalog,
} from '../../tooling/systems/catalog'
import { loadSystems } from '../../tooling/systems/registry'

const ROOT = path.resolve(import.meta.dirname, '../..')
const DIR = path.join(ROOT, 'src/systems/endless-studios')

let catalog: SystemCatalog
const token = (name: string) =>
  catalog.tokens.find((entry) => entry.name === name)
const names = (group: string) =>
  catalog.tokens
    .filter((entry) => entry.group === group)
    .map((entry) => entry.name)

beforeAll(async () => {
  const config = JSON.parse(
    readFileSync(path.join(ROOT, 'studio.config.json'), 'utf8'),
  )
  const { systems } = await loadSystems(ROOT, config)
  catalog = systemCatalog(
    systems.find(({ key }) => key === 'endless-studios')!,
    ROOT,
  )
})

describe('Endless Studios', () => {
  test('[SY-174] the Theme pages read the app’s own stylesheet; no mirror file is left', () => {
    expect(catalog.stylesheet).toBe(
      'src/systems/endless-studios/styles/studios.css',
    )
    expect(existsSync(path.join(DIR, 'styles/theme.css'))).toBe(false)
    // A token only the copied main.css declares.
    expect(token('--color-orange-endless')?.value).toBe('#f76e40')
  })

  test('[SY-165] typography: Inter and Figtree families, sizes xs–4xl with line heights, weights, leading and tracking', () => {
    expect(token('--font-sans')?.value).toContain("'Inter Variable'")
    expect(token('--font-heading')?.value).toContain("'Figtree Variable'")
    const typography = names('typography')
    for (const size of ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'])
      expect(typography).toEqual(
        expect.arrayContaining([
          `--text-${size}`,
          `--text-${size}--line-height`,
        ]),
      )
    expect(typography).toEqual(
      expect.arrayContaining([
        '--font-weight-normal',
        '--font-weight-bold',
        '--leading-tight',
        '--tracking-tight',
        '--tracking-thin',
      ]),
    )
  })

  test('[SY-165] spacing, radius, shadows, container widths with the page width, and breakpoints', () => {
    expect(names('spacing')).toEqual(
      expect.arrayContaining([
        '--spacing',
        '--spacing-2_5',
        '--container-3xl',
        '--ui-container',
      ]),
    )
    expect(token('--ui-container')?.value).toBe('82.4rem')
    expect(names('radius')).toEqual(
      expect.arrayContaining(['--radius-xs', '--radius-4xl', '--ui-radius']),
    )
    expect(names('shadows')).toEqual(
      expect.arrayContaining([
        '--shadow-xs',
        '--shadow-lg',
        '--drop-shadow-hard',
      ]),
    )
    expect(names('other')).toEqual(
      expect.arrayContaining(['--breakpoint-sm', '--breakpoint-tablet']),
    )
  })

  test('[SY-165] [SY-88] colours: the eight palettes, the DESIGN.md roles and the semantic colours, with Nuxt UI labels', () => {
    for (const color of [
      'primary',
      'secondary',
      'kids',
      'info',
      'success',
      'warning',
      'error',
      'neutral',
    ]) {
      expect(token(`--ui-${color}`)).toMatchObject({ section: 'actions' })
      expect(token(`--ui-color-${color}-500`)).toMatchObject({
        group: 'colors',
        palette: true,
      })
    }
    expect(token('--ui-text-muted')).toMatchObject({
      section: 'text',
      utility: 'text-muted',
      value: 'var(--ui-color-neutral-600)',
    })
    expect(token('--ui-bg-elevated')).toMatchObject({
      section: 'surfaces',
      utility: 'bg-elevated',
    })
    expect(token('--color-amber-500')).toMatchObject({ ramp: 'Amber' })
    // The app's text colours are colours, not type sizes.
    expect(token('--text-color-orange-title')).toMatchObject({
      group: 'colors',
    })
  })

  test('[SY-166] the fonts come from the Fontsource packages', () => {
    const manifest = JSON.parse(
      readFileSync(path.join(DIR, 'package.json'), 'utf8'),
    )
    expect(Object.keys(manifest.dependencies)).toEqual(
      expect.arrayContaining([
        '@fontsource-variable/inter',
        '@fontsource-variable/figtree',
      ]),
    )
    const stylesheet = readFileSync(
      path.join(DIR, 'styles/studios.css'),
      'utf8',
    )
    expect(stylesheet).toContain("@import '@fontsource-variable/inter';")
    expect(stylesheet).toContain("@import '@fontsource-variable/figtree';")
  })

  test('[SY-170] [SY-101] the copied app images are its Images and Icons, and the Overview counts them', () => {
    const icons = catalog.assets.filter(({ kind }) => kind === 'icons')
    const images = catalog.assets.filter(({ kind }) => kind === 'images')
    expect(icons.length).toBeGreaterThan(10)
    expect(images.length).toBeGreaterThan(50)
    expect(catalog.assets.every(({ origin }) => origin === 'app')).toBe(true)
    expect(icons.every(({ path }) => /\/Icons\//.test(path))).toBe(true)
    expect(images.map(({ file }) => file)).toContain(
      'studios/assets/images/logo-endless-studios-orange.svg',
    )
    expect(catalog.assets.length).toBe(icons.length + images.length)
  })
})
