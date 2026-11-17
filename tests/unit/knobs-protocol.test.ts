// The knobs' messages on the preview channel: the studio sends a
// Breakdown's unsaved changes (`overrides`: node ID → theme slot →
// classes) and the area a hovered knob controls (`knob`), and the
// document reports the classes each piece's theme slots render with,
// beside their boxes (`nodes`). Plain strings only, validated like props.
import { describe, expect, test } from 'vitest'
import {
  isHostMessage,
  isPreviewMessage,
  PREVIEW_CHANNEL,
  PREVIEW_VERSION,
} from '../../tooling/preview/protocol'

const envelope = {
  channel: PREVIEW_CHANNEL,
  version: PREVIEW_VERSION,
  session: 'session-a',
  runtime: 'runtime-a',
  artifact: 'vhme000000000001',
}

describe('the overrides message', () => {
  const overrides = (value: unknown) =>
    isHostMessage({ ...envelope, kind: 'overrides', overrides: value })

  test('carries classes by node and theme slot', () => {
    expect(
      overrides({
        'root>UButton': { base: 'rounded-xl px-4', label: 'text-lg' },
        'root>StudioSidebar>USidebar/UButton~2': { base: 'bg-kids-200' },
      }),
    ).toBe(true)
    expect(overrides({})).toBe(true)
    expect(overrides({ 'root>UButton': {} })).toBe(true)
  })

  test('refuses anything but plain strings, odd node IDs and slot names, and prototype keys', () => {
    expect(overrides(null)).toBe(false)
    expect(overrides([])).toBe(false)
    expect(overrides({ 'root>UButton': 'rounded-xl' })).toBe(false)
    expect(overrides({ 'root>UButton': { base: 4 } })).toBe(false)
    expect(overrides({ 'root>UButton': { base: ['rounded-xl'] } })).toBe(false)
    expect(overrides({ 'root>UButton': { 'base slot': 'p-2' } })).toBe(false)
    expect(overrides({ 'root>UButton': { base: 'p-2\u0000' } })).toBe(false)
    expect(overrides({ 'root>UButton': { base: 'p'.repeat(5000) } })).toBe(
      false,
    )
    expect(overrides({ 'root UButton': { base: 'p-2' } })).toBe(false)
    expect(overrides(JSON.parse('{"__proto__": { "base": "p-2" }}'))).toBe(
      false,
    )
    expect(
      overrides({ 'root>UButton': JSON.parse('{"__proto__": "p-2"}') }),
    ).toBe(false)
  })
})

describe('the knob message', () => {
  const knob = (value: unknown) =>
    isHostMessage({ ...envelope, kind: 'knob', knob: value })

  test('names the slot a hovered knob changes, its area and its colour, or none', () => {
    expect(
      knob({ target: 'root>UButton#base', area: 'corners', color: '#ec4899' }),
    ).toBe(true)
    for (const area of ['padding', 'paddingX', 'paddingY', 'gap', 'box'])
      expect(
        knob({ target: 'root>UButton#base', area, color: '#14b8a6' }),
      ).toBe(true)
    expect(knob(null)).toBe(true)
  })

  test('refuses unknown areas, colours that are not hex and odd targets', () => {
    const good = { target: 'root>UButton#base', area: 'gap', color: '#14b8a6' }
    expect(knob(undefined)).toBe(false)
    expect(knob({ ...good, area: 'margin' })).toBe(false)
    expect(knob({ ...good, color: 'red' })).toBe(false)
    expect(knob({ ...good, color: '#14b8a6; display:none' })).toBe(false)
    expect(knob({ ...good, target: 'root UButton' })).toBe(false)
    expect(knob({ ...good, target: null })).toBe(false)
  })
})

describe('the nodes message’s classes', () => {
  const box = { x: 0, y: 0, width: 10, height: 10 }
  const nodes = (classes: unknown) =>
    isPreviewMessage({
      ...envelope,
      kind: 'nodes',
      nodes: {
        'root>UButton': { boxes: [box], slots: { base: [box] }, classes },
      },
    })

  test('carry each theme slot’s rendered classes', () => {
    expect(nodes({ base: 'rounded-md px-2.5', label: 'truncate' })).toBe(true)
    expect(nodes({})).toBe(true)
    expect(nodes(undefined)).toBe(true)
  })

  test('refuse classes that are not strings by slot', () => {
    expect(nodes({ base: 3 })).toBe(false)
    expect(nodes(['rounded-md'])).toBe(false)
    expect(nodes({ 'a b': 'p-2' })).toBe(false)
  })
})
