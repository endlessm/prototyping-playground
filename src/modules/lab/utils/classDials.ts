import type { DialConfig } from 'dialkit/vanilla'

// Class dials: when Inspect selects an element, its own spacing, radius and
// size classes from its `class="…"` in the component's source, as dials that
// rewrite one token of that one attribute in the draft. Only plain tokens
// count; ones behind a variant (`md:p-4`, `hover:rounded-lg`), arbitrary
// values (`p-[13px]`) and `:class` bindings are left to code.
// Finding the element in the source is a heuristic, as the rendered DOM keeps
// no link to it: the longest static class attribute whose tokens are all on
// the element, or for a button or link with none of its own, its icon.

/** Which space a dial changes, for the highlight. */
export type Side = 'top' | 'right' | 'bottom' | 'left'
export type DialArea =
  | { kind: 'margin' | 'padding'; sides: Side[] }
  | { kind: 'gap' }
  | { kind: 'outline' }

export type ClassFolder = 'spacing' | 'radius' | 'size'

export interface ClassDial {
  /** The dial's key in its folder, such as `paddingX`. */
  key: string
  folder: ClassFolder
  /** The token in the source, such as `px-4`. */
  token: string
  /** The utility it belongs to, such as `px` or `rounded-t`. */
  utility: string
  area: DialArea
  /** The dial's value: a number on the spacing scale, or a keyword. */
  value: number | string
  /** DialKit's config for it. */
  config: DialConfig[string]
}

const ALL: Side[] = ['top', 'right', 'bottom', 'left']
const X: Side[] = ['left', 'right']
const Y: Side[] = ['top', 'bottom']

// Each spacing utility: its dial's key and the space it changes.
const SPACING: Record<string, [string, DialArea]> = {
  m: ['margin', { kind: 'margin', sides: ALL }],
  mx: ['marginX', { kind: 'margin', sides: X }],
  my: ['marginY', { kind: 'margin', sides: Y }],
  mt: ['marginTop', { kind: 'margin', sides: ['top'] }],
  mr: ['marginRight', { kind: 'margin', sides: ['right'] }],
  mb: ['marginBottom', { kind: 'margin', sides: ['bottom'] }],
  ml: ['marginLeft', { kind: 'margin', sides: ['left'] }],
  ms: ['marginStart', { kind: 'margin', sides: ['left'] }],
  me: ['marginEnd', { kind: 'margin', sides: ['right'] }],
  p: ['padding', { kind: 'padding', sides: ALL }],
  px: ['paddingX', { kind: 'padding', sides: X }],
  py: ['paddingY', { kind: 'padding', sides: Y }],
  pt: ['paddingTop', { kind: 'padding', sides: ['top'] }],
  pr: ['paddingRight', { kind: 'padding', sides: ['right'] }],
  pb: ['paddingBottom', { kind: 'padding', sides: ['bottom'] }],
  pl: ['paddingLeft', { kind: 'padding', sides: ['left'] }],
  ps: ['paddingStart', { kind: 'padding', sides: ['left'] }],
  pe: ['paddingEnd', { kind: 'padding', sides: ['right'] }],
  gap: ['gap', { kind: 'gap' }],
  'gap-x': ['gapX', { kind: 'gap' }],
  'gap-y': ['gapY', { kind: 'gap' }],
  'space-x': ['spaceX', { kind: 'gap' }],
  'space-y': ['spaceY', { kind: 'gap' }],
}
const RADIUS_SIDES: Record<string, string> = {
  '': 'radius',
  t: 'radiusTop',
  r: 'radiusRight',
  b: 'radiusBottom',
  l: 'radiusLeft',
  tl: 'radiusTopLeft',
  tr: 'radiusTopRight',
  br: 'radiusBottomRight',
  bl: 'radiusBottomLeft',
  s: 'radiusStart',
  e: 'radiusEnd',
}
/** A bare `rounded` has no size; its dial calls it this. */
export const BASE_RADIUS = 'base'
export const RADII = [
  'none',
  'xs',
  'sm',
  BASE_RADIUS,
  'md',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  'full',
]
const SIZE: Record<string, string> = {
  w: 'width',
  h: 'height',
  size: 'size',
  'min-w': 'minWidth',
  'min-h': 'minHeight',
  'max-w': 'maxWidth',
  'max-h': 'maxHeight',
}
export const SIZE_WORDS = [
  'auto',
  'full',
  'fit',
  'min',
  'max',
  'screen',
  'px',
  '1/2',
  '1/3',
  '2/3',
  '1/4',
  '3/4',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl',
  '7xl',
  'prose',
  'none',
]

const SCALE = /^\d+(?:\.\d+)?$/
const FRACTION = /^\d+\/\d+$/
// Longest first, so `gap-x-2` isn't read as `gap` with `x-2`.
const SPACING_UTILITIES = Object.keys(SPACING).sort(
  (a, b) => b.length - a.length,
)
const SIZE_UTILITIES = Object.keys(SIZE).sort((a, b) => b.length - a.length)

// Room for the values a design uses, around the current one.
const sliderMax = (value: number, floor: number) =>
  Math.max(floor, Math.ceil(Math.abs(value) * 2))

/** The dial for one class token, or null when it isn't one of these. */
export function classDial(token: string): ClassDial | null {
  if (token.includes(':') || token.includes('[')) return null
  const negative = token.startsWith('-')
  const bare = negative ? token.slice(1) : token
  for (const utility of SPACING_UTILITIES) {
    if (!bare.startsWith(`${utility}-`)) continue
    const rest = bare.slice(utility.length + 1)
    if (!SCALE.test(rest)) continue
    // Only margins go negative.
    if (negative && !utility.startsWith('m')) return null
    const [key, area] = SPACING[utility]!
    const value = (negative ? -1 : 1) * Number(rest)
    const max = sliderMax(value, 16)
    return {
      key,
      folder: 'spacing',
      token,
      utility,
      area,
      value,
      config: [value, utility.startsWith('m') ? -max : 0, max, 0.5],
    }
  }
  if (negative) return null
  const radius = /^rounded(?:-(t|r|b|l|tl|tr|br|bl|s|e))?(?:-(.+))?$/.exec(bare)
  if (radius) {
    const side = radius[1] ?? ''
    const size = radius[2] ?? BASE_RADIUS
    if (!RADII.includes(size)) return null
    return {
      key: RADIUS_SIDES[side]!,
      folder: 'radius',
      token,
      utility: side ? `rounded-${side}` : 'rounded',
      area: { kind: 'outline' },
      value: size,
      config: { type: 'select', options: RADII, default: size },
    }
  }
  for (const utility of SIZE_UTILITIES) {
    if (!bare.startsWith(`${utility}-`)) continue
    const rest = bare.slice(utility.length + 1)
    const base = {
      key: SIZE[utility]!,
      folder: 'size' as const,
      token,
      utility,
      area: { kind: 'outline' } as const,
    }
    if (SCALE.test(rest)) {
      const value = Number(rest)
      return {
        ...base,
        value,
        config: [value, 0, sliderMax(value, 96), 0.5],
      }
    }
    if (SIZE_WORDS.includes(rest) || FRACTION.test(rest))
      return {
        ...base,
        value: rest,
        config: {
          type: 'select',
          options: SIZE_WORDS.includes(rest)
            ? SIZE_WORDS
            : [rest, ...SIZE_WORDS],
          default: rest,
        },
      }
  }
  return null
}

/** The dials for an element's tokens, the first of each utility. */
export function classDials(tokens: string[]): ClassDial[] {
  const dials: ClassDial[] = []
  for (const token of tokens) {
    const dial = classDial(token)
    if (dial && !dials.some((other) => other.key === dial.key)) dials.push(dial)
  }
  return dials
}

/** The token a dial writes for a value. */
export function tokenFor(dial: ClassDial, value: number | string): string {
  if (dial.folder === 'radius')
    return value === BASE_RADIUS ? dial.utility : `${dial.utility}-${value}`
  if (typeof value === 'number') {
    // Snapped to the dial's step, so a drag never writes `p-3.4999`.
    const step = Math.round(value * 2) / 2
    const sign = step < 0 ? '-' : ''
    return `${sign}${dial.utility}-${Math.abs(step)}`
  }
  return `${dial.utility}-${value}`
}

/** The DialKit config of the selected element's dials, by folder. */
export function classConfig(
  dials: ClassDial[],
  folders: Record<ClassFolder, string>,
): DialConfig {
  const config: DialConfig = {}
  for (const folder of ['spacing', 'radius', 'size'] as const) {
    const own = dials.filter((dial) => dial.folder === folder)
    if (!own.length) continue
    config[folders[folder]] = Object.fromEntries(
      own.map((dial) => [dial.key, dial.config]),
    )
  }
  return config
}

// --- Finding an element in the source ---

/** One static `class="…"` attribute: where it is and its tokens. */
export interface ClassAttribute {
  /** Where the attribute starts (`class`). */
  start: number
  /** Where its value starts and ends, inside the quotes. */
  valueStart: number
  valueEnd: number
  tokens: string[]
}

/** The `<template>`'s range in a single-file component, or the whole text. */
export function templateRange(code: string) {
  const open = code.search(/<template[\s>]/)
  const close = code.lastIndexOf('</template>')
  return open >= 0 && close > open
    ? { start: open, end: close }
    : { start: 0, end: code.length }
}

/** The template's static class attributes, in order. */
export function classAttributes(code: string): ClassAttribute[] {
  const { start, end } = templateRange(code)
  const found: ClassAttribute[] = []
  const pattern = /(?<![:\w-])class="([^"]*)"/g
  pattern.lastIndex = start
  for (let match = pattern.exec(code); match; match = pattern.exec(code)) {
    if (match.index >= end) break
    const valueStart = match.index + 'class="'.length
    found.push({
      start: match.index,
      valueStart,
      valueEnd: valueStart + match[1]!.length,
      tokens: match[1]!.split(/\s+/).filter(Boolean),
    })
  }
  return found
}

/** The longest class attribute whose tokens are all in `classes`. */
export function bestClassAttribute(code: string, classes: Iterable<string>) {
  const own = new Set(classes)
  let best: ClassAttribute | null = null
  for (const attribute of classAttributes(code))
    if (
      attribute.tokens.length > (best?.tokens.length ?? 0) &&
      attribute.tokens.every((token) => own.has(token))
    )
      best = attribute
  return best
}

/**
 * Where an icon is named in the template: `i-lucide:send` in the DOM is
 * `"i-lucide-send"` in the source. -1 when it isn't.
 */
export function iconIndex(code: string, icon: string) {
  const { start, end } = templateRange(code)
  const index = code.indexOf(`"${icon.replace(':', '-')}"`, start)
  return index >= 0 && index < end ? index : -1
}

/**
 * The whole element around a position in the template: from its opening
 * `<Tag` to its matching `</Tag>`, or to `/>` when it closes itself.
 */
export function elementRange(code: string, index: number) {
  let start = code.lastIndexOf('<', index)
  while (start > 0 && !/[A-Za-z]/.test(code[start + 1] ?? ''))
    start = code.lastIndexOf('<', start - 1)
  const tag = /^[\w.-]+/.exec(code.slice(start + 1))?.[0] ?? ''
  // The first `>` after `from` outside quotes.
  const tagEnd = (from: number) => {
    let quote = ''
    for (let i = from; i < code.length; i++) {
      const char = code[i]!
      if (quote) {
        if (char === quote) quote = ''
      } else if (char === '"' || char === "'") quote = char
      else if (char === '>') return i
    }
    return code.length - 1
  }
  const openEnd = tagEnd(start)
  if (code[openEnd - 1] === '/') return { start, end: openEnd + 1 }
  const sameTag = new RegExp(
    `<(/?)${tag.replace(/[.-]/g, '\\$&')}(?=[\\s>/])`,
    'g',
  )
  sameTag.lastIndex = openEnd
  let depth = 1
  for (let match = sameTag.exec(code); match; match = sameTag.exec(code)) {
    const end = tagEnd(match.index)
    if (match[1]) {
      if (--depth === 0) return { start, end: end + 1 }
    } else if (code[end - 1] !== '/') depth++
  }
  return { start, end: openEnd + 1 }
}

/** What the inspector reads from one element on the stage. */
export interface ElementTraits {
  classes: string[]
  /** A button or link, found by its icon when it has no class of its own. */
  control: boolean
  /** An icon class on it or, for a control, inside it: `i-lucide:send`. */
  icon?: string
}

/** Where an element is in the source: its class attribute and block. */
export interface ElementSource {
  /** How many ancestors up the match was found (0: the element itself). */
  depth: number
  attribute: ClassAttribute | null
  block: { start: number; end: number }
}

/**
 * Finds an element in the source from it and its ancestors' traits, the
 * element first: the longest class attribute all on it, or its icon.
 */
export function findElementSource(
  code: string,
  chain: ElementTraits[],
): ElementSource | null {
  for (const [depth, traits] of chain.entries()) {
    const attribute = bestClassAttribute(code, traits.classes)
    const icon = traits.icon ? iconIndex(code, traits.icon) : -1
    // A control's icon names it better than classes another element shares.
    if (icon >= 0 && (traits.control || !attribute))
      return { depth, attribute: null, block: elementRange(code, icon) }
    if (attribute)
      return { depth, attribute, block: elementRange(code, attribute.start) }
  }
  return null
}

/**
 * The code with one token of one class attribute replaced. Unchanged when
 * the attribute no longer holds it there.
 */
export function rewriteToken(
  code: string,
  attribute: Pick<ClassAttribute, 'valueStart' | 'valueEnd'>,
  from: string,
  to: string,
) {
  const value = code.slice(attribute.valueStart, attribute.valueEnd)
  const parts = value.split(/(\s+)/)
  const index = parts.indexOf(from)
  if (index < 0) return code
  parts[index] = to
  return (
    code.slice(0, attribute.valueStart) +
    parts.join('') +
    code.slice(attribute.valueEnd)
  )
}

/** The class attribute starting at `start`, as it is in the code now. */
export function attributeAt(code: string, start: number) {
  return classAttributes(code).find((attribute) => attribute.start === start)
}
