// A system's theme tokens, read from its own stylesheet so the Theme pages
// can't drift from the app: the custom properties it and the stylesheets it
// imports (its own files and its packages', such as Tailwind's theme and
// Nuxt UI's roles) set on the page, in `@theme` blocks or under the system's
// theme class, each sorted onto a Theme page. A Nuxt UI app's theme colours
// and their palettes, which Nuxt UI sets at runtime, are added. The pages
// measure each token's value inside the system's preview document; the
// declared value is kept for a token the browser doesn't hold. Node only for
// the stylesheet's files; `themeTokens` itself is plain.
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

export type TokenGroup =
  | 'colors'
  | 'typography'
  | 'radius'
  | 'shadows'
  | 'spacing'
  | 'motion'
  | 'effects'
  | 'other'

/** Nuxt UI's colour roles, which the Colors page shows first. */
export type ColorSection = 'text' | 'surfaces' | 'borders' | 'actions'

export interface ThemeToken {
  /** `--ui-text-muted` */
  name: string
  /** As the stylesheet writes it; empty for one Nuxt UI sets at runtime. */
  value: string
  group: TokenGroup
  /** Colours only: the Nuxt UI role it belongs to. */
  section: ColorSection | null
  /** Colours only: the palette a stepped name belongs to, as "Amber". */
  ramp: string | null
  /** A Nuxt UI theme colour's palette, set by Nuxt UI. */
  palette: boolean
  /** The Tailwind class that uses a Nuxt UI role. */
  utility: string | null
  /** It has a dark value of its own. */
  dark: boolean
}

export interface ThemeScope {
  /** The class the system's preview document puts on its root. */
  themeClass?: string
  /** Nuxt UI's theme colour names, from the system's declaration. */
  nuxtUiColors?: string[]
}

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

// Nuxt UI's roles and the utilities that use them.
const ROLES: [prefix: string, section: ColorSection, utility: string][] = [
  ['--ui-text', 'text', 'text'],
  ['--ui-bg', 'surfaces', 'bg'],
  ['--ui-border', 'borders', 'border'],
]
const ROLE_NAMES = {
  text: ['dimmed', 'muted', 'toned', '', 'highlighted', 'inverted'],
  surfaces: ['', 'muted', 'elevated', 'accented', 'inverted'],
  borders: ['', 'muted', 'accented', 'inverted'],
}

function roleOf(
  name: string,
  colors: string[],
): { section: ColorSection; utility: string } | null {
  for (const [prefix, section, utility] of ROLES) {
    if (section === 'actions') continue
    for (const variant of ROLE_NAMES[section])
      if (name === (variant ? `${prefix}-${variant}` : prefix))
        return { section, utility: `${utility}-${variant || 'default'}` }
  }
  const color = /^--ui-([a-z]+)$/.exec(name)?.[1]
  if (color && colors.includes(color))
    return { section: 'actions', utility: `bg-${color}` }
  return null
}

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

interface Block {
  selector: string
  body: string
}

// The blocks at the top level of some CSS: each selector (or at-rule) and
// what is inside its braces.
function blocksOf(css: string): Block[] {
  const out: Block[] = []
  let depth = 0
  let start = 0
  let selectorFrom = 0
  let selector = ''
  for (let i = 0; i < css.length; i++) {
    const c = css[i]
    if (c === '{') {
      if (depth === 0) {
        selector = css.slice(selectorFrom, i).replace(/\s+/g, ' ').trim()
        start = i + 1
      }
      depth++
    } else if (c === '}') {
      depth--
      if (depth === 0) {
        out.push({ selector, body: css.slice(start, i) })
        selectorFrom = i + 1
      }
      if (depth < 0) depth = 0
    } else if (c === ';' && depth === 0) selectorFrom = i + 1
  }
  return out
}

// The custom properties a block sets itself (not in nested blocks), in
// order. `--font-*: initial` is a namespace reset.
function declarationsOf(body: string): [string, string][] {
  let top = ''
  let depth = 0
  for (const c of body) {
    if (c === '{') depth++
    else if (c === '}') depth = Math.max(0, depth - 1)
    else if (depth === 0) top += c
  }
  const out: [string, string][] = []
  for (const part of top.split(';')) {
    const match = /^\s*(--[\w\\%-]*\*?)\s*:\s*([\s\S]+?)\s*$/.exec(part)
    if (match) out.push([match[1]!, match[2]!.replace(/\s+/g, ' ')])
  }
  return out
}

const COLOR_VALUE =
  /^(#[0-9a-f]{3,8}$|(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\(|(?:transparent|currentcolor|white|black)$)/i

function isColor(value: string, values: Map<string, string>, depth = 0) {
  const v = value.trim()
  if (COLOR_VALUE.test(v)) return true
  const ref = /^var\(\s*(--[\w-]+)/.exec(v)?.[1]
  if (!ref) return false
  if (ref.startsWith('--ui-color-')) return true
  const target = values.get(ref)
  return target !== undefined && depth < 6
    ? isColor(target, values, depth + 1)
    : false
}

function groupOf(name: string, value: string, values: Map<string, string>) {
  const n = name.slice(2)
  if (/^(color|text-color|ui-color|ui-text|ui-bg|ui-border)(-|$)/.test(n))
    return 'colors'
  if (/^(radius|ui-radius)(-|$)/.test(n)) return 'radius'
  if (/^(shadow|text-shadow|drop-shadow|inset-shadow|elevation)(-|$)/.test(n))
    return 'shadows'
  if (
    /^(spacing|space|gap|container|ui-container|ui-header-height)(-|$)/.test(n)
  )
    return 'spacing'
  if (/^(animate|ease|duration|transition|default-transition)(-|$)/.test(n))
    return 'motion'
  if (/^(blur|backdrop-blur|perspective|aspect)(-|$)/.test(n)) return 'effects'
  if (/^(font|text|leading|tracking|line-height|letter-spacing)(-|$)/.test(n))
    return 'typography'
  if (isColor(value, values)) return 'colors'
  return 'other'
}

const titled = (words: string) =>
  words.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase())

/** `--color-amber-500` → "Amber", `--ui-color-primary-50` → "Primary". */
function rampOf(name: string) {
  const ramp = /^--(?:ui-)?(?:color-)?(.+?)-(\d{2,3})$/.exec(name)?.[1]
  return ramp ? titled(ramp) : null
}

// Nested namespaces a reset of their parent leaves alone.
const NESTED = [
  '--font-weight-',
  '--inset-shadow-',
  '--drop-shadow-',
  '--text-shadow-',
]

/** The tokens some CSS sets, in the order they first appear. */
export function themeTokens(css: string, scope: ThemeScope): ThemeToken[] {
  const themed = scope.themeClass ? `.${scope.themeClass}` : null
  const light = new Set([':root', ':host', 'html', '.light'])
  const dark = new Set(['.dark', ':root.dark', 'html.dark'])
  if (themed) {
    light.add(themed)
    dark.add(`${themed}.dark`).add(`.dark ${themed}`)
  }
  const values = new Map<string, string>()
  const darkNames = new Set<string>()
  const set = (name: string, value: string) => {
    if (name.endsWith('*')) {
      if (value !== 'initial') return
      const prefix = name.slice(0, -1)
      for (const key of [...values.keys()])
        if (
          key.startsWith(prefix) &&
          !NESTED.some((nested) => nested !== prefix && key.startsWith(nested))
        )
          values.delete(key)
      return
    }
    if (value === 'initial') values.delete(name)
    else values.set(name, value)
  }
  const visit = (blocks: Block[]) => {
    for (const { selector, body } of blocks) {
      if (selector.startsWith('@theme')) {
        for (const [name, value] of declarationsOf(body)) set(name, value)
        continue
      }
      // @layer, @media, @supports…
      if (selector.startsWith('@')) {
        if (/^@(layer|media|supports)\b/.test(selector)) visit(blocksOf(body))
        continue
      }
      const selectors = selector.split(',').map((part) => part.trim())
      if (selectors.some((part) => light.has(part)))
        for (const [name, value] of declarationsOf(body)) set(name, value)
      if (selectors.some((part) => dark.has(part)))
        for (const [name, value] of declarationsOf(body)) {
          darkNames.add(name)
          if (!values.has(name)) set(name, value)
        }
    }
  }
  visit(blocksOf(stripComments(css)))

  // Nuxt UI writes each theme colour and its palette into the page.
  const colors = scope.nuxtUiColors ?? []
  for (const color of colors) {
    if (!values.has(`--ui-${color}`))
      values.set(`--ui-${color}`, `var(--ui-color-${color}-500)`)
    for (const shade of SHADES)
      if (!values.has(`--ui-color-${color}-${shade}`))
        values.set(`--ui-color-${color}-${shade}`, '')
  }

  return [...values].map(([name, value]) => {
    const group = groupOf(name, value, values)
    const role = group === 'colors' ? roleOf(name, colors) : null
    return {
      name,
      value,
      group,
      section: role?.section ?? null,
      ramp: group === 'colors' && !role ? rampOf(name) : null,
      palette: /^--ui-color-/.test(name),
      utility: role?.utility ?? null,
      dark: darkNames.has(name),
    }
  })
}

// The file a stylesheet's `@import` names: one of its own, or a package's
// stylesheet (its `style` export). Null for what isn't there, such as
// `#build/…`.
function importedFile(from: string, target: string) {
  if (target.startsWith('.')) {
    const file = path.resolve(path.dirname(from), target)
    return existsSync(file) ? file : null
  }
  if (!/^[@a-z]/i.test(target)) return null
  const parts = target.split('/')
  const name = parts.slice(0, target.startsWith('@') ? 2 : 1).join('/')
  const subpath = parts.slice(name.split('/').length).join('/')
  for (let dir = path.dirname(from); ; dir = path.dirname(dir)) {
    const folder = path.join(dir, 'node_modules', ...name.split('/'))
    const manifest = path.join(folder, 'package.json')
    if (existsSync(manifest)) {
      if (subpath)
        return (
          [subpath, `${subpath}.css`]
            .map((file) => path.join(folder, file))
            .find((file) => existsSync(file) && file.endsWith('.css')) ?? null
        )
      try {
        const data = JSON.parse(readFileSync(manifest, 'utf8'))
        const style = data.exports?.['.']?.style ?? data.style ?? 'index.css'
        const file = path.join(folder, style)
        return existsSync(file) ? file : null
      } catch {
        return null
      }
    }
    if (path.dirname(dir) === dir) return null
  }
}

/** The stylesheet with what it imports in its place, each file once. */
function inlined(file: string, seen: Set<string>): string {
  if (seen.has(file) || !existsSync(file)) return ''
  seen.add(file)
  const css = stripComments(readFileSync(file, 'utf8'))
  return css.replace(
    /@import\s+(?:url\()?\s*['"]([^'"]+)['"]\s*\)?[^;]*;/g,
    (_all, target: string) => {
      const found = importedFile(file, target)
      return found ? `\n${inlined(found, seen)}\n` : ''
    },
  )
}

/** The tokens of a system's stylesheet and everything it imports. */
export function stylesheetTokens(file: string, scope: ThemeScope) {
  return themeTokens(inlined(file, new Set()), scope)
}
