// A system's theme tokens, read from its own stylesheet and the stylesheets
// it imports (its own files and its packages'), sorted into the Theme pages.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { stylesheetTokens, themeTokens } from '../../tooling/systems/tokens'

let root: string
function write(file: string, text: string) {
  const at = path.join(root, file)
  mkdirSync(path.dirname(at), { recursive: true })
  writeFileSync(at, text)
  return at
}
beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), 'studio-tokens-'))
})
afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

const named = (tokens: { name: string }[]) => tokens.map(({ name }) => name)

describe('themeTokens', () => {
  test('[SY-86] reads custom properties on the root, the theme class and @theme, by page', () => {
    const tokens = themeTokens(
      `
      /* --commented: 1px; */
      @theme static { --color-sea-500: #0a7ea4; --font-sans: Inter, sans-serif; }
      :root { --radius-card: 12px; --shadow-card: 0 1px 2px #0003; }
      .harbor-theme { --spacing-gutter: 24px; --ease-out: ease-out; --blur-soft: 4px; --z-top: 10; }
      .elsewhere { --ignored: 1px; }
      @layer theme { :host, :root { --text-body: 14px; --text-body--line-height: 24px; } }
      `,
      { themeClass: 'harbor-theme' },
    )
    expect(
      Object.fromEntries(tokens.map(({ name, group }) => [name, group])),
    ).toEqual({
      '--color-sea-500': 'colors',
      '--font-sans': 'typography',
      '--radius-card': 'radius',
      '--shadow-card': 'shadows',
      '--spacing-gutter': 'spacing',
      '--ease-out': 'motion',
      '--blur-soft': 'effects',
      '--z-top': 'other',
      '--text-body': 'typography',
      '--text-body--line-height': 'typography',
    })
    expect(tokens.find(({ name }) => name === '--color-sea-500')).toMatchObject(
      { value: '#0a7ea4', ramp: 'Sea', dark: false },
    )
  })

  test('[SY-86] a namespace reset drops what came before it, and dark values are noted', () => {
    const tokens = themeTokens(
      `
      @theme default { --font-sans: a; --font-serif: b; --font-weight-bold: 700; }
      @theme static { --font-*: initial; --font-heading: Figtree; }
      :root { --ui-bg: #fff; }
      .dark { --ui-bg: #000; }
      `,
      {},
    )
    expect(named(tokens)).toEqual([
      '--font-weight-bold',
      '--font-heading',
      '--ui-bg',
    ])
    expect(tokens.at(-1)).toMatchObject({
      group: 'colors',
      section: 'surfaces',
      utility: 'bg-default',
      dark: true,
    })
  })

  test('[SY-88] Nuxt UI roles fall into Text, Surfaces, Borders and Actions with their utilities', () => {
    const tokens = themeTokens(
      ':root { --ui-text-muted: #666; --ui-bg-elevated: #eee; --ui-border: #ddd; --color-gray-dark: #333; }',
      { nuxtUiColors: ['primary', 'kids'] },
    )
    const by = (name: string) => tokens.find((token) => token.name === name)
    expect(by('--ui-text-muted')).toMatchObject({
      section: 'text',
      utility: 'text-muted',
    })
    expect(by('--ui-bg-elevated')).toMatchObject({
      section: 'surfaces',
      utility: 'bg-elevated',
    })
    expect(by('--ui-border')).toMatchObject({
      section: 'borders',
      utility: 'border-default',
    })
    // A name with no ramp step is one of the other colours.
    expect(by('--color-gray-dark')).toMatchObject({ section: null, ramp: null })
    // Nuxt UI sets each theme colour and its palette at runtime.
    expect(by('--ui-kids')).toMatchObject({
      group: 'colors',
      section: 'actions',
      utility: 'bg-kids',
    })
    expect(by('--ui-color-kids-500')).toMatchObject({
      group: 'colors',
      ramp: 'Kids',
      palette: true,
    })
    expect(
      named(tokens).filter((name) => name.startsWith('--ui-color-primary-')),
    ).toHaveLength(11)
  })
})

describe('stylesheetTokens', () => {
  test('[SY-174] follows the stylesheet’s own and its packages’ imports, skipping what it can’t find', () => {
    write(
      'node_modules/kit/package.json',
      JSON.stringify({ name: 'kit', exports: { '.': { style: './k.css' } } }),
    )
    write('node_modules/kit/k.css', ':root { --radius-kit: 2px; }')
    write(
      'node_modules/@f/sans/package.json',
      JSON.stringify({ name: '@f/sans' }),
    )
    write('node_modules/@f/sans/index.css', '@font-face { font-family: X; }')
    write('system/styles/parts/colors.css', ':root { --color-own: red; }')
    const file = write(
      'system/styles/app.css',
      `@import 'kit';\n@import '@f/sans';\n@import '#build/ui.css';\n@import './parts/colors.css' layer(base);\n:root { --radius-kit: 4px; }`,
    )
    const tokens = stylesheetTokens(file, {})
    expect(tokens.map(({ name, value }) => [name, value])).toEqual([
      ['--radius-kit', '4px'],
      ['--color-own', 'red'],
    ])
  })
})
