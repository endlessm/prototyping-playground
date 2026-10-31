import { expect, test } from 'vitest'
import { paletteShortcut } from '../../app/utils/shortcuts'

test('[SH-40] palette closes from fields, preserves their closed-state keys and ignores repeats', () => {
  const event = {
    key: 'k',
    code: 'KeyK',
    ctrlKey: true,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    repeat: false,
    isComposing: false,
    target: { tagName: 'INPUT' },
  }
  expect(paletteShortcut(event, false)).toBe(false)
  expect(paletteShortcut(event, true)).toBe(true)
  expect(paletteShortcut({ ...event, repeat: true }, true)).toBe(false)
  expect(paletteShortcut({ ...event, target: null }, false)).toBe(true)
})
