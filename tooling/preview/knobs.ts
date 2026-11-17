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
  /** The theme's own text sizes (`body` for `text-body`), if any. */
  textSizes?: string[]
}

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
const TEXT_SIZES = scale([
  ['xs', 12],
  ['sm', 14],
  ['base', 16],
  ['lg', 18],
  ['xl', 20],
  ['2xl', 24],
  ['3xl', 30],
  ['4xl', 36],
])
const LARGER_TEXT: Record<string, number> = {
  '5xl': 48,
  '6xl': 60,
  '7xl': 72,
  '8xl': 96,
  '9xl': 128,
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

// The family a class belongs to, and its value, or null when it is no knob.
function read(
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
        TEXT_SIZES.some(({ value }) => value === size) ||
        size in LARGER_TEXT ||
        theme.textSizes?.includes(size)
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
      const knob = read(className, theme)
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

function scaleOf(family: KnobFamily): Scale {
  switch (family) {
    case 'corners':
      return CORNERS
    case 'textSize':
      return TEXT_SIZES
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
    return scaleOf(family).map(({ value }) => value)
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

/** A value's size in CSS pixels, or null for weights, colours and named sizes. */
export function knobPixels(family: KnobFamily, value: string): number | null {
  if (family === 'textSize')
    return (
      LARGER_TEXT[value] ??
      scaleOf(family).find((entry) => entry.value === value)?.px ??
      null
    )
  if (KNOB_FAMILIES[family].kind === 'color' || family === 'weight') return null
  if (family === 'corners')
    return CORNERS.find((entry) => entry.value === value)?.px ?? null
  if (family === 'ring') return /^\d+$/.test(value) ? Number(value) : null
  return spacingPx(value)
}

/**
 * The value `steps` along the knob's scale from where it is, stopping at
 * the ends. A value off the scale moves to the nearest one that way.
 */
export function knobStep(knob: Knob, steps: number, theme: KnobTheme): string {
  const values = knobValues(knob.family, theme)
  let at = values.indexOf(knob.value)
  if (at < 0) {
    const px = knobPixels(knob.family, knob.value)
    if (px === null) at = steps > 0 ? -1 : values.length
    else {
      const sizes = values.map((value) => knobPixels(knob.family, value) ?? 0)
      const above = sizes.findIndex((size) => size > px)
      // Between two steps: one step up lands above it, one down below it.
      at =
        steps > 0
          ? (above < 0 ? values.length : above) - 1
          : above < 0
            ? values.length
            : above
    }
  }
  return values[Math.min(values.length - 1, Math.max(0, at + steps))]!
}

const WEIGHT_NUMBERS = (name: string) =>
  (WEIGHTS.findIndex(({ value }) => value === name) + 1) * 100

// A value as a number to compare: pixels, or a weight's number.
const amount = (family: KnobFamily, value: string) =>
  family === 'weight' ? WEIGHT_NUMBERS(value) : knobPixels(family, value)

/**
 * What a knob shows for a value: pixels for sizes (`6`), a weight's number
 * (`600`), and anything else as the class spells it (`full`, `primary`).
 */
export function knobDisplay(family: KnobFamily, value: string) {
  if (family === 'corners' && value === 'full') return value
  const number = amount(family, value)
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
    const at = amount(family, value)
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

/**
 * The class a knob writes for a value. A text size drops a line height the
 * old class carried (`text-base/5`), as each size brings its own.
 */
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
    `text-${list(TEXT_SIZES.map(({ value }) => value))}`,
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
