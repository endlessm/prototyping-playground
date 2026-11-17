// A Breakdown's knobs: the plain-language controls the inspector offers for
// a piece, read from the classes its theme slots render with, and the class
// each writes back. One family per kind of utility (corners, padding, space
// between, text size, weight, fill, text colour, ring, size), each with a
// fixed colour and a scale from Tailwind's own, so every value chosen exists
// in the design system. Only a slot's unprefixed classes are knobs: a
// `hover:` or `md:` class stays as it is. Pure, so the studio, the preview
// document and the preview's stylesheet (`knobSafelist`) share it.
import type { KnobHighlight } from './protocol.ts'

export type KnobFamily =
  | 'corners'
  | 'padding'
  | 'paddingX'
  | 'paddingY'
  | 'gap'
  | 'textSize'
  | 'weight'
  | 'fill'
  | 'textColor'
  | 'ring'
  | 'size'

/** What part of a piece a knob's family changes, for its highlight. */
export type KnobArea = KnobHighlight['area']

export interface KnobFamilyLook {
  /** The family's colour, the same everywhere, as `#rrggbb`. */
  color: string
  area: KnobArea
  kind: 'scale' | 'color'
}

// Pink corners, blue padding and teal spacing follow the reference video.
// The studio's theme names the same colours (`--color-knob-*` in its
// stylesheet); these reach a preview's highlight, where its theme can't.
export const KNOB_FAMILIES: Record<KnobFamily, KnobFamilyLook> = {
  corners: {
    color: '#ec4899',
    area: 'corners',
    kind: 'scale',
  },
  padding: {
    color: '#3b82f6',
    area: 'padding',
    kind: 'scale',
  },
  paddingX: {
    color: '#3b82f6',
    area: 'paddingX',
    kind: 'scale',
  },
  paddingY: {
    color: '#6366f1',
    area: 'paddingY',
    kind: 'scale',
  },
  gap: {
    color: '#14b8a6',
    area: 'gap',
    kind: 'scale',
  },
  textSize: {
    color: '#8b5cf6',
    area: 'box',
    kind: 'scale',
  },
  weight: {
    color: '#f59e0b',
    area: 'box',
    kind: 'scale',
  },
  fill: {
    color: '#f97316',
    area: 'box',
    kind: 'color',
  },
  textColor: {
    color: '#e11d48',
    area: 'box',
    kind: 'color',
  },
  ring: {
    color: '#22c55e',
    area: 'box',
    kind: 'scale',
  },
  size: {
    color: '#a855f7',
    area: 'box',
    kind: 'scale',
  },
}
const ORDER = Object.keys(KNOB_FAMILIES) as KnobFamily[]

export interface KnobTheme {
  /** Nuxt UI's theme colour names (`primary`, `neutral`…). */
  colors: string[]
  /**
   * The theme's text sizes in CSS pixels, by the name their class uses
   * (`body` for `text-body`, `caption-1`, `2.8xl` for `--text-2_8xl`),
   * Tailwind's own among them when the theme sets them again.
   */
  textSizes?: Record<string, number>
}

// A length as CSS pixels, at the browser's default 16px root size.
function lengthPx(value: string) {
  const found = /^\s*(-?\d*\.?\d+)(px|rem|em)?\s*$/.exec(value)
  if (!found) return null
  const number = Number(found[1])
  if (found[2] === 'rem' || found[2] === 'em') return number * 16
  return found[2] || number === 0 ? number : null
}

/**
 * A system's knob theme from its catalog: its Nuxt UI colours and the text
 * sizes its tokens set (`--text-body: 14px`), which aren't colours. A
 * `--text-*` token holding anything but a length (a colour) is no size, and
 * `--text-<size>--line-height` is its size's line height.
 */
export const knobTheme = (system: {
  colors: string[]
  tokens: { name: string; value?: string }[]
}): KnobTheme => ({
  colors: system.colors,
  textSizes: Object.fromEntries(
    system.tokens.flatMap(({ name, value }) => {
      const size = /^--text-([a-z0-9_]+(?:-[a-z0-9_]+)*)$/.exec(name)?.[1]
      const px = size && value !== undefined ? lengthPx(value) : null
      return size && px !== null ? [[size.replace(/_/g, '.'), px]] : []
    }),
  ),
})

export interface Knob {
  /** `<slot>.<family>`, unique in a piece. */
  id: string
  /** The theme slot whose classes it changes. */
  slot: string
  family: KnobFamily
  /** Its value as the class spells it: `md`, `2.5`, `primary/10`. */
  value: string
  /** The class it was read from. */
  className: string
}

type Scale = { value: string; px: number | null }[]
const scale = (entries: [string, number | null][]): Scale =>
  entries.map(([value, px]) => ({ value, px }))

const CORNERS = scale([
  ['none', 0],
  ['xs', 2],
  ['sm', 4],
  ['md', 6],
  ['lg', 8],
  ['xl', 12],
  ['2xl', 16],
  ['3xl', 24],
  ['full', 9999],
])
const SPACING_STEPS = [
  0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16,
]
const SPACING = scale(SPACING_STEPS.map((step) => [String(step), step * 4]))
// Tailwind's own text sizes, which a theme may set again.
const TEXT_SIZES: Record<string, number> = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
  '7xl': 72,
  '8xl': 96,
  '9xl': 128,
}

/**
 * Every text size a theme offers, smallest first: Tailwind's, then the
 * theme's own, each at the size the theme gives it.
 */
function textScale(theme?: KnobTheme): Scale {
  const sizes = { ...TEXT_SIZES, ...theme?.textSizes }
  return Object.entries(sizes)
    .map(([value, px], order) => ({ value, px, order }))
    .sort((a, b) => a.px - b.px || a.order - b.order)
    .map(({ value, px }) => ({ value, px }))
}
const WEIGHTS = scale(
  [
    'thin',
    'extralight',
    'light',
    'normal',
    'medium',
    'semibold',
    'bold',
    'extrabold',
    'black',
  ].map((name) => [name, null]),
)
const RINGS = scale([0, 1, 2, 4, 8].map((width) => [String(width), width]))
const SIZES = scale(
  [3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10, 12].map((step) => [
    String(step),
    step * 4,
  ]),
)
const SHADES = [
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
  '950',
]
const OPACITIES = ['10', '25', '50', '75']
// Nuxt UI's semantic colours for backgrounds and for text.
const FILLS = ['default', 'muted', 'elevated', 'accented', 'inverted']
const TEXT_COLORS = [
  'default',
  'muted',
  'dimmed',
  'toned',
  'highlighted',
  'inverted',
]
const PLAIN_COLORS = ['white', 'black']

const SPACING_TOKEN = /^\d+(?:\.\d+)?$/
const spacingPx = (value: string) =>
  SPACING_TOKEN.test(value) ? Number(value) * 4 : null

/**
 * The knob family a class belongs to, and its value, or null when it is no
 * knob (a prefixed class such as `hover:rounded-lg` never is).
 */
export function knobFamilyOf(
  className: string,
  theme: KnobTheme,
): { family: KnobFamily; value: string } | null {
  if (className.includes(':') || className.includes('[')) return null
  const dash = className.indexOf('-')
  const head = dash < 0 ? className : className.slice(0, dash)
  const rest = dash < 0 ? '' : className.slice(dash + 1)
  switch (head) {
    case 'rounded':
      return CORNERS.some(({ value }) => value === rest)
        ? { family: 'corners', value: rest }
        : null
    case 'p':
    case 'px':
    case 'py':
    case 'gap': {
      if (!SPACING_TOKEN.test(rest)) return null
      const family = (
        { p: 'padding', px: 'paddingX', py: 'paddingY', gap: 'gap' } as const
      )[head]
      return { family, value: rest }
    }
    case 'font':
      return WEIGHTS.some(({ value }) => value === rest)
        ? { family: 'weight', value: rest }
        : null
    case 'ring':
      if (rest === '') return { family: 'ring', value: '1' }
      return /^\d+$/.test(rest) ? { family: 'ring', value: rest } : null
    case 'size':
      return SPACING_TOKEN.test(rest) ? { family: 'size', value: rest } : null
    case 'bg':
      return colorOf(rest, FILLS, theme)
        ? { family: 'fill', value: rest }
        : null
    case 'text': {
      const size = rest.split('/')[0]!
      if (
        Object.hasOwn(TEXT_SIZES, size) ||
        Object.hasOwn(theme.textSizes ?? {}, size)
      )
        return { family: 'textSize', value: size }
      return colorOf(rest, TEXT_COLORS, theme)
        ? { family: 'textColor', value: rest }
        : null
    }
    default:
      return null
  }
}

// A colour token: a semantic name, a theme colour, a palette shade, with an
// optional opacity.
function colorOf(token: string, semantic: string[], theme: KnobTheme) {
  const [name, opacity, extra] = token.split('/')
  if (extra !== undefined || (opacity !== undefined && !/^\d+$/.test(opacity)))
    return false
  if (
    semantic.includes(name!) ||
    PLAIN_COLORS.includes(name!) ||
    theme.colors.includes(name!)
  )
    return true
  const shade = /^([a-z]+(?:-[a-z]+)*)-(\d+)$/.exec(name!)
  return Boolean(shade && SHADES.includes(shade[2]!))
}

/**
 * The knobs of a piece, from the classes each of its theme slots renders
 * with (slot → class list), in the slots' order and then the families'.
 */
export function knobsOf(
  slots: Record<string, string>,
  theme: KnobTheme,
): Knob[] {
  const knobs: Knob[] = []
  for (const [slot, classes] of Object.entries(slots)) {
    const found = new Map<KnobFamily, Knob>()
    for (const className of classes.split(/\s+/).filter(Boolean)) {
      const knob = knobFamilyOf(className, theme)
      // The last class of a family is the one that shows.
      if (knob)
        found.set(knob.family, {
          id: `${slot}.${knob.family}`,
          slot,
          ...knob,
          className,
        })
    }
    knobs.push(...ORDER.flatMap((family) => found.get(family) ?? []))
  }
  return knobs
}

function scaleOf(family: KnobFamily, theme?: KnobTheme): Scale {
  switch (family) {
    case 'corners':
      return CORNERS
    case 'textSize':
      return textScale(theme)
    case 'weight':
      return WEIGHTS
    case 'ring':
      return RINGS
    case 'size':
      return SIZES
    default:
      return SPACING
  }
}

/** Every value a family offers, in order. */
export function knobValues(family: KnobFamily, theme: KnobTheme): string[] {
  if (KNOB_FAMILIES[family].kind === 'scale')
    return scaleOf(family, theme).map(({ value }) => value)
  return [
    ...(family === 'fill' ? FILLS : TEXT_COLORS),
    ...theme.colors,
    ...theme.colors.flatMap((color) =>
      OPACITIES.map((opacity) => `${color}/${opacity}`),
    ),
    ...theme.colors.flatMap((color) =>
      SHADES.map((shade) => `${color}-${shade}`),
    ),
  ]
}

/**
 * A value's size in CSS pixels, a theme's text sizes at the size the theme
 * gives them, or null for weights and colours.
 */
export function knobPixels(
  family: KnobFamily,
  value: string,
  theme?: KnobTheme,
): number | null {
  if (family === 'textSize')
    return textScale(theme).find((entry) => entry.value === value)?.px ?? null
  if (KNOB_FAMILIES[family].kind === 'color' || family === 'weight') return null
  if (family === 'corners')
    return CORNERS.find((entry) => entry.value === value)?.px ?? null
  if (family === 'ring') return /^\d+$/.test(value) ? Number(value) : null
  return spacingPx(value)
}

const WEIGHT_NUMBERS = (name: string) =>
  (WEIGHTS.findIndex(({ value }) => value === name) + 1) * 100

// A value as a number to compare: pixels, or a weight's number.
const amount = (family: KnobFamily, value: string, theme?: KnobTheme) =>
  family === 'weight'
    ? WEIGHT_NUMBERS(value) || null
    : knobPixels(family, value, theme)

/**
 * The value `steps` along the knob's scale from where it is, stopping at
 * the ends. Each step goes to the nearest value that way, so a value off
 * the scale (`p-13`) lands on the next size up or down, and two values the
 * same size (`text-base`, a theme's `text-body-2` at 16px) count as one. A
 * colour off the theme's list stays where it is.
 */
export function knobStep(knob: Knob, steps: number, theme: KnobTheme): string {
  const values = knobValues(knob.family, theme)
  const at = values.indexOf(knob.value)
  const current = amount(knob.family, knob.value, theme)
  if (current === null) {
    if (at < 0) return knob.value
    return values[Math.min(values.length - 1, Math.max(0, at + steps))]!
  }
  const sized = values.flatMap((value) => {
    const size = amount(knob.family, value, theme)
    return size === null ? [] : [{ value, size }]
  })
  let value = knob.value
  let size = current
  for (let step = 0; step < Math.abs(steps); step++) {
    const next = sized
      .filter((each) => (steps > 0 ? each.size > size : each.size < size))
      .reduce<{ value: string; size: number } | null>(
        (best, each) =>
          !best || Math.abs(each.size - size) < Math.abs(best.size - size)
            ? each
            : best,
        null,
      )
    if (!next) break
    value = next.value
    size = next.size
  }
  return value
}

/**
 * What a knob shows for a value: pixels for sizes (`6`), a weight's number
 * (`600`), and anything else as the class spells it (`full`, `primary`).
 */
export function knobDisplay(
  family: KnobFamily,
  value: string,
  theme?: KnobTheme,
) {
  if (family === 'corners' && value === 'full') return value
  const number = amount(family, value, theme)
  return number === null || (number <= 0 && family === 'weight')
    ? value
    : String(number)
}

/**
 * The value typed into a knob: one of its values by name, or a number (in
 * pixels, or a weight) landing on the nearest step; null when neither.
 */
export function knobParse(
  family: KnobFamily,
  text: string,
  theme: KnobTheme,
): string | null {
  const typed = text.trim().toLowerCase()
  const values = knobValues(family, theme)
  if (values.includes(typed)) return typed
  const number = /^(\d+(?:\.\d+)?)\s*(?:px)?$/.exec(typed)
  if (!number || KNOB_FAMILIES[family].kind === 'color') return null
  const target = Number(number[1])
  let best: string | null = null
  let distance = Infinity
  for (const value of values) {
    const at = amount(family, value, theme)
    if (at === null || Math.abs(at - target) >= distance) continue
    best = value
    distance = Math.abs(at - target)
  }
  return best
}

const PREFIX: Record<KnobFamily, string> = {
  corners: 'rounded',
  padding: 'p',
  paddingX: 'px',
  paddingY: 'py',
  gap: 'gap',
  textSize: 'text',
  weight: 'font',
  fill: 'bg',
  textColor: 'text',
  ring: 'ring',
  size: 'size',
}

/** The class a knob writes for a value. */
export const knobClass = (knob: Pick<Knob, 'family'>, value: string) =>
  `${PREFIX[knob.family]}-${value}`

const words = (name: string) =>
  name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
// The slot that is the piece itself goes unnamed.
const OWN_SLOTS = ['base', 'root']

/**
 * A knob's label: its family's (`family` gives it, from i18n), after the
 * slot’s name when the slot is a part of the piece: “Label text size”.
 */
export function knobLabel(
  knob: Pick<Knob, 'slot' | 'family'>,
  family: (key: KnobFamily) => string,
) {
  const name = family(knob.family)
  if (OWN_SLOTS.includes(knob.slot)) return name
  const slot = words(knob.slot)
  return `${slot.charAt(0).toUpperCase()}${slot.slice(1)} ${name.charAt(0).toLowerCase()}${name.slice(1)}`
}

/**
 * Tailwind's `@source inline(...)` arguments naming every class a knob can
 * write, so a value chosen live renders before any file uses it.
 */
export function knobSafelist(theme: KnobTheme): string[] {
  const list = (values: string[]) => `{${values.join(',')}}`
  const colors = list(theme.colors)
  return [
    `rounded-${list(CORNERS.map(({ value }) => value))}`,
    `{p,px,py,gap}-${list(SPACING.map(({ value }) => value))}`,
    `text-${list(textScale(theme).map(({ value }) => value))}`,
    `font-${list(WEIGHTS.map(({ value }) => value))}`,
    `ring-${list(RINGS.map(({ value }) => value))}`,
    `size-${list(SIZES.map(({ value }) => value))}`,
    `bg-${list([...FILLS, ...PLAIN_COLORS])}`,
    `text-${list([...TEXT_COLORS, ...PLAIN_COLORS])}`,
    ...(theme.colors.length
      ? [
          `{bg,text}-${colors}`,
          `{bg,text}-${colors}/${list(OPACITIES)}`,
          `{bg,text}-${colors}-${list(SHADES)}`,
        ]
      : []),
  ]
}
