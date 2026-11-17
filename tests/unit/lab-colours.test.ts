// The Lab's colours come from the studio's theme: each knob family's colour
// in the studio's stylesheet is the one a preview's highlight draws with,
// and every knob and source chip class names a theme colour, so a reader
// sees one colour per family wherever it shows.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { SOURCE_CHIPS } from '../../src/modules/lab/utils/breakdown'
import { KNOB_LOOKS } from '../../src/modules/lab/utils/knobs'
import { KNOB_FAMILIES } from '../../tooling/preview/knobs'

const ROOT = path.resolve(import.meta.dirname, '../..')
const css = readFileSync(path.join(ROOT, 'app/assets/css/main.css'), 'utf8')
const themed = (name: string) =>
  new RegExp(`--color-${name}:\\s*([^;]+);`).exec(css)?.[1]?.trim()
const kebab = (name: string) =>
  name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)

describe('the Lab’s colours', () => {
  test('[LAB-KN-08] each knob family’s theme colour is its highlight’s colour', () => {
    for (const [family, { color }] of Object.entries(KNOB_FAMILIES))
      expect(themed(`knob-${kebab(family)}`), family).toBe(color)
  })

  test('[LAB-KN-08] knob and source chip classes name the studio’s theme colours', () => {
    for (const [family, look] of Object.entries(KNOB_LOOKS))
      expect(look.class, family).toContain(`text-knob-${kebab(family)}`)
    for (const [source, chip] of Object.entries(SOURCE_CHIPS)) {
      expect(themed(`source-${source}`), source).toBeTruthy()
      expect(chip.class).not.toMatch(
        /(?:^|\s)(?:bg|text|ring)-[a-z]+-\d{2,3}\b/,
      )
    }
  })
})
