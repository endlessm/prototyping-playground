// Knobs: the plain-language controls a Breakdown's inspector offers for a
// piece, read from the classes its theme slots render with (Nuxt UI's
// computed classes for the Endless Studios button), and the classes a
// knob writes back when it moves. Values step along Tailwind's scale and
// show in pixels; colours offer the theme's colours and shades.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { compile } from 'tailwindcss'
import { describe, expect, test } from 'vitest'
import {
  knobClass,
  knobDisplay,
  knobLabel,
  knobParse,
  knobPixels,
  knobsOf,
  knobSafelist,
  knobStep,
  knobValues,
  type Knob,
  type KnobFamily,
} from '../../tooling/preview/knobs'

const theme = {
  colors: ['primary', 'secondary', 'kids', 'neutral'],
  textSizes: ['body', 'menu'],
}
// Nuxt UI 4.8.2's classes for the Endless Studios button (primary, solid, md).
const BUTTON_BASE =
  'rounded-md font-medium inline-flex items-center disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75 transition-colors px-2.5 py-1.5 text-sm gap-1.5 text-inverted bg-primary hover:bg-primary/75 active:bg-primary/75 disabled:bg-primary aria-disabled:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

const knob = (knobs: Knob[], id: string) => {
  const found = knobs.find((entry) => entry.id === id)
  if (!found) throw new Error(`No knob ${id} in ${knobs.map((k) => k.id)}`)
  return found
}

describe('the knobs a piece offers', () => {
  test('the button’s base: corners, padding, space between, text, weight, fill and text colour', () => {
    const knobs = knobsOf({ base: BUTTON_BASE }, theme)
    expect(knobs.map(({ id, value }) => [id, value])).toEqual([
      ['base.corners', 'md'],
      ['base.paddingX', '2.5'],
      ['base.paddingY', '1.5'],
      ['base.gap', '1.5'],
      ['base.textSize', 'sm'],
      ['base.weight', 'medium'],
      ['base.fill', 'primary'],
      ['base.textColor', 'inverted'],
    ])
    expect(knob(knobs, 'base.corners').className).toBe('rounded-md')
  })

  test('only unprefixed classes count: hover, responsive and state classes stay as they are', () => {
    expect(
      knobsOf({ base: 'hover:rounded-xl md:px-4 sm:text-lg' }, theme),
    ).toEqual([])
  })

  test('each slot keeps its own knobs, in the order the slots come', () => {
    const knobs = knobsOf(
      {
        base: 'rounded-lg p-4',
        leadingIcon: 'shrink-0 size-5',
        label: 'truncate',
      },
      theme,
    )
    expect(knobs.map(({ id }) => id)).toEqual([
      'base.corners',
      'base.padding',
      'leadingIcon.size',
    ])
  })

  test('semantic colours, shades and opacity are colours; custom theme sizes are text sizes', () => {
    const knobs = knobsOf(
      {
        root: 'bg-elevated text-secondary-700 ring ring-inset ring-accented',
        badge: 'bg-primary/10 text-body text-center',
      },
      theme,
    )
    expect(knobs.map(({ id, value }) => [id, value])).toEqual([
      ['root.fill', 'elevated'],
      ['root.textColor', 'secondary-700'],
      ['root.ring', '1'],
      ['badge.textSize', 'body'],
      ['badge.fill', 'primary/10'],
    ])
  })

  test('text alignment, wrapping and arbitrary values are not knobs', () => {
    expect(
      knobsOf(
        {
          base: 'text-left text-wrap rounded-[10px] p-[3px] bg-linear-to-r size-full',
        },
        theme,
      ),
    ).toEqual([])
  })

  test('a piece with nothing to adjust has no knobs', () => {
    expect(knobsOf({ label: 'truncate', base: 'inline-flex' }, theme)).toEqual(
      [],
    )
    expect(knobsOf({}, theme)).toEqual([])
  })
})

describe('a knob’s values', () => {
  test('step along the theme’s scale, stopping at its ends', () => {
    const [corners] = knobsOf({ base: 'rounded-md' }, theme)
    expect(knobStep(corners!, 1, theme)).toBe('lg')
    expect(knobStep(corners!, -1, theme)).toBe('sm')
    expect(knobStep({ ...corners!, value: 'full' }, 1, theme)).toBe('full')
    expect(knobStep({ ...corners!, value: 'none' }, -1, theme)).toBe('none')
    const [padding] = knobsOf({ base: 'px-2.5' }, theme)
    expect(knobStep(padding!, 1, theme)).toBe('3')
    expect(knobStep(padding!, -2, theme)).toBe('1.5')
  })

  test('a value off the scale steps to the nearest one in that direction', () => {
    const [padding] = knobsOf({ base: 'p-13' }, theme)
    expect(knobStep(padding!, 1, theme)).toBe('14')
    expect(knobStep(padding!, -1, theme)).toBe('12')
  })

  test('show as pixels', () => {
    expect(knobPixels('corners', 'md')).toBe(6)
    expect(knobPixels('corners', 'none')).toBe(0)
    expect(knobPixels('paddingX', '2.5')).toBe(10)
    expect(knobPixels('gap', '1.5')).toBe(6)
    expect(knobPixels('textSize', 'sm')).toBe(14)
    expect(knobPixels('size', '5')).toBe(20)
    expect(knobPixels('ring', '2')).toBe(2)
    expect(knobPixels('weight', 'medium')).toBe(null)
    expect(knobPixels('textSize', 'body')).toBe(null)
  })

  test('colours offer the theme’s colours, with opacity steps and shades', () => {
    const fill = knobValues('fill', theme)
    expect(fill).toEqual(
      expect.arrayContaining([
        'default',
        'elevated',
        'primary',
        'primary/10',
        'kids-50',
        'kids-500',
        'neutral-950',
      ]),
    )
    expect(fill).not.toContain('orange-500')
    expect(knobValues('textColor', theme)).toEqual(
      expect.arrayContaining(['highlighted', 'muted', 'secondary-700']),
    )
  })
})

describe('the class a knob writes', () => {
  test('replaces the family’s class with the new value', () => {
    const [corners, padding, ring, size] = knobsOf(
      { base: 'rounded-md px-2.5 ring', icon: 'size-5' },
      theme,
    )
    expect(knobClass(corners!, 'xl')).toBe('rounded-xl')
    expect(knobClass(padding!, '4')).toBe('px-4')
    expect(knobClass(ring!, '2')).toBe('ring-2')
    expect(knobClass(size!, '6')).toBe('size-6')
  })

  test('colours and text sizes, a size with its line height becoming the plain size', () => {
    const [size, fill, color] = knobsOf(
      { base: 'text-base/5 bg-primary text-inverted' },
      theme,
    )
    expect(knobClass(size!, 'lg')).toBe('text-lg')
    expect(knobClass(fill!, 'kids-200')).toBe('bg-kids-200')
    expect(knobClass(color!, 'secondary-700')).toBe('text-secondary-700')
  })

  test('read back, the written class gives the same knob at the new value', () => {
    for (const knob of knobsOf({ base: BUTTON_BASE }, theme)) {
      const next = knobStep(knob, 1, theme)
      const [read] = knobsOf({ base: knobClass(knob, next) }, theme)
      expect(read, knob.id).toMatchObject({ family: knob.family, value: next })
    }
  })
})

describe('what a knob shows and what typing gives', () => {
  test('pixels for sizes, weights as numbers, colours and named sizes as they are', () => {
    expect(knobDisplay('corners', 'md')).toBe('6')
    expect(knobDisplay('corners', 'full')).toBe('full')
    expect(knobDisplay('paddingX', '2.5')).toBe('10')
    expect(knobDisplay('weight', 'semibold')).toBe('600')
    expect(knobDisplay('textSize', 'body')).toBe('body')
    expect(knobDisplay('fill', 'primary/10')).toBe('primary/10')
  })

  test('typed pixels land on the nearest step; names are taken as they are', () => {
    expect(knobParse('corners', '12', theme)).toBe('xl')
    expect(knobParse('corners', '13px', theme)).toBe('xl')
    expect(knobParse('corners', 'full', theme)).toBe('full')
    expect(knobParse('paddingY', '17', theme)).toBe('4')
    expect(knobParse('weight', '650', theme)).toBe('semibold')
    expect(knobParse('textSize', 'lg', theme)).toBe('lg')
    expect(knobParse('fill', ' kids-200 ', theme)).toBe('kids-200')
    expect(knobParse('fill', 'orange-500', theme)).toBe(null)
    expect(knobParse('gap', 'wide', theme)).toBe(null)
  })
})

describe('labels', () => {
  test('plain language from the family, with the slot named unless it is the piece itself', () => {
    const names = {
      corners: 'Corners',
      textSize: 'Text size',
      size: 'Size',
    } as Record<string, string>
    const label = (slot: string, family: string) =>
      knobLabel({ slot, family } as Knob, (key) => names[key]!)
    expect(label('base', 'corners')).toBe('Corners')
    expect(label('root', 'corners')).toBe('Corners')
    expect(label('label', 'textSize')).toBe('Label text size')
    expect(label('leadingIcon', 'size')).toBe('Leading icon size')
  })
})

describe('the safelist', () => {
  test('names every value a knob can choose, in Tailwind’s brace syntax', () => {
    const lines = knobSafelist(theme)
    const text = lines.join('\n')
    expect(text).toContain('rounded-{none,xs,sm,md,lg,xl,2xl,3xl,full}')
    expect(text).toContain('{p,px,py,gap}-{0,0.5,1,1.5,2,2.5,3')
    expect(text).toContain(
      '{bg,text}-{primary,secondary,kids,neutral}-{50,100,',
    )
    expect(text).toContain(
      '{bg,text}-{primary,secondary,kids,neutral}/{10,25,50,75}',
    )
    for (const line of lines) expect(line).not.toMatch(/["\n]/)
  })

  test('gives Tailwind every class each knob can write', async () => {
    const tailwind = path.dirname(
      createRequire(import.meta.url).resolve('tailwindcss/package.json'),
    )
    const sheet = (file: string) =>
      readFileSync(path.join(tailwind, file), 'utf8')
    // The theme's colours as Nuxt UI declares them, values aside.
    const colors = [...theme.colors, 'default', 'muted', 'elevated']
      .flatMap((color) => [
        `--color-${color}: red;`,
        ...[
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
        ].map((shade) => `--color-${color}-${shade}: red;`),
      ])
      .join('\n')
    const semantic = [
      'default',
      'muted',
      'elevated',
      'accented',
      'inverted',
      'dimmed',
      'toned',
      'highlighted',
    ]
      .flatMap((name) => [
        `--background-color-${name}: red;`,
        `--text-color-${name}: red;`,
      ])
      .join('\n')
    const css = `@import 'tailwindcss/theme.css';\n@import 'tailwindcss/utilities.css';\n@theme { ${colors}\n${semantic} }\n${knobSafelist(
      theme,
    )
      .map((line) => `@source inline("${line}");`)
      .join('\n')}\n`
    const compiler = await compile(css, {
      base: tailwind,
      loadStylesheet: async (id: string) => ({
        path: id,
        base: tailwind,
        content: sheet(id.replace(/^tailwindcss\//, '')),
      }),
    })
    const out = compiler.build([])
    const escape = (name: string) => name.replace(/[./]/g, (c) => `\\${c}`)
    const families: KnobFamily[] = [
      'corners',
      'padding',
      'paddingX',
      'paddingY',
      'gap',
      'textSize',
      'weight',
      'fill',
      'textColor',
      'ring',
      'size',
    ]
    const missing = families.flatMap((family) =>
      knobValues(family, theme)
        .map((value) => knobClass({ family }, value))
        .filter((name) => !out.includes(`.${escape(name)} {`)),
    )
    expect(missing).toEqual([])
  })
})
