import { describe, expect, test } from 'vitest'
import {
  artifactShortcut,
  isApple,
  isTyping,
  previewShortcut,
  sectionNavShortcut,
  shortcutLabel,
} from '../../app/utils/shortcuts'

const key = (
  init: Partial<Omit<KeyboardEvent, 'target'>> & { target?: unknown } = {},
) => ({
  key: ';',
  code: 'Semicolon',
  metaKey: false,
  ctrlKey: true,
  shiftKey: false,
  altKey: false,
  repeat: false,
  isComposing: false,
  target: null,
  ...init,
})

describe('shortcut labels follow the operating system', () => {
  test('[SH-50] [SH-48] macOS shows ⌘ and ⇧ joined, everything else Ctrl and Shift with plus signs', () => {
    expect(shortcutLabel('palette', true)).toBe('⌘K')
    expect(shortcutLabel('palette', false)).toBe('Ctrl+K')
    expect(shortcutLabel('navigation', true)).toBe('⌘;')
    expect(shortcutLabel('navigation', false)).toBe('Ctrl+;')
    expect(shortcutLabel('source', true)).toBe("⌘'")
    expect(shortcutLabel('source', false)).toBe("Ctrl+'")
    expect(shortcutLabel('grid', true)).toBe("⌘⇧'")
    expect(shortcutLabel('grid', false)).toBe("Ctrl+Shift+'")
    expect(shortcutLabel('save', true)).toBe('⌘S')
    expect(shortcutLabel('save', false)).toBe('Ctrl+S')
  })

  test('[SH-50] Apple computers and devices are recognised from the user agent', () => {
    expect(
      isApple(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      ),
    ).toBe(true)
    expect(
      isApple('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit'),
    ).toBe(true)
    expect(
      isApple('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
    ).toBe(false)
    expect(isApple('Mozilla/5.0 (X11; Linux x86_64)')).toBe(false)
  })
})

describe('the section navigation shortcut', () => {
  test('[SH-47] Ctrl+; or ⌘; toggles it', () => {
    expect(sectionNavShortcut(key())).toBe(true)
    expect(sectionNavShortcut(key({ ctrlKey: false, metaKey: true }))).toBe(
      true,
    )
  })

  test('[SH-47] it is ignored without the modifier, with Alt or Shift, on key repeat and while composing', () => {
    expect(sectionNavShortcut(key({ ctrlKey: false }))).toBe(false)
    expect(sectionNavShortcut(key({ altKey: true }))).toBe(false)
    expect(sectionNavShortcut(key({ shiftKey: true }))).toBe(false)
    expect(sectionNavShortcut(key({ repeat: true }))).toBe(false)
    expect(sectionNavShortcut(key({ isComposing: true }))).toBe(false)
    expect(sectionNavShortcut(key({ key: 'k', code: 'KeyK' }))).toBe(false)
  })

  test('[SH-47] [SH-49] it never fires in a text field, except in the source editor', () => {
    const field = (tagName: string, editable = false, inEditor = false) => ({
      tagName,
      isContentEditable: editable,
      closest: (selector: string) =>
        inEditor && selector === '.cm-editor' ? {} : null,
    })
    expect(sectionNavShortcut(key({ target: field('INPUT') }))).toBe(false)
    expect(sectionNavShortcut(key({ target: field('TEXTAREA') }))).toBe(false)
    expect(sectionNavShortcut(key({ target: field('SELECT') }))).toBe(false)
    expect(sectionNavShortcut(key({ target: field('DIV', true) }))).toBe(false)
    expect(sectionNavShortcut(key({ target: field('DIV', true, true) }))).toBe(
      true,
    )
    expect(sectionNavShortcut(key({ target: field('BUTTON') }))).toBe(true)
  })
})

describe('text fields keep their keystrokes', () => {
  test('[SH-49] inputs, text areas, selects and editable text are text fields', () => {
    expect(isTyping({ tagName: 'INPUT', isContentEditable: false })).toBe(true)
    expect(isTyping({ tagName: 'TEXTAREA', isContentEditable: false })).toBe(
      true,
    )
    expect(isTyping({ tagName: 'SELECT', isContentEditable: false })).toBe(true)
    expect(isTyping({ tagName: 'P', isContentEditable: true })).toBe(true)
    expect(isTyping({ tagName: 'BUTTON', isContentEditable: false })).toBe(
      false,
    )
    expect(isTyping(null)).toBe(false)
  })
})

describe('artifact shortcuts', () => {
  test("[SH-48] Ctrl+' shows the source, Ctrl+Shift+' the grid, matched by the key's position", () => {
    expect(artifactShortcut(key({ key: "'", code: 'Quote' }))).toBe('source')
    // Shift turns the apostrophe into a quote on most layouts.
    expect(
      artifactShortcut(key({ key: '"', code: 'Quote', shiftKey: true })),
    ).toBe('grid')
    // A layout that reports another character on the same key.
    expect(artifactShortcut(key({ key: 'ä', code: 'Quote' }))).toBe('source')
    expect(
      artifactShortcut(key({ key: "'", code: 'Quote', ctrlKey: false })),
    ).toBe(null)
    expect(
      artifactShortcut(key({ key: "'", code: 'Quote', altKey: true })),
    ).toBe(null)
    expect(
      artifactShortcut(key({ key: "'", code: 'Quote', repeat: true })),
    ).toBe(null)
  })

  test('[SH-48] a preview passes on only the studio’s own commands', () => {
    expect(previewShortcut(key({ key: "'", code: 'Quote' }))).toBe('source')
    expect(previewShortcut(key({ key: 'k', code: 'KeyK' }))).toBe('palette')
    expect(previewShortcut(key({ key: 'K', code: 'KeyK' }))).toBe('palette')
    expect(previewShortcut(key())).toBe('navigation')
    expect(previewShortcut(key({ key: 's', code: 'KeyS' }))).toBe(null)
    expect(
      previewShortcut(key({ key: 'k', code: 'KeyK', shiftKey: true })),
    ).toBe(null)
  })

  test("[PR-83] a view passes on ⌘K, ⌘;, ⌘' and the canvas grid's ⌘⇧'", () => {
    expect(
      [
        key({ key: 'k', code: 'KeyK' }),
        key(),
        key({ key: "'", code: 'Quote' }),
        key({ key: '"', code: 'Quote', shiftKey: true }),
      ].map(previewShortcut),
    ).toEqual(['palette', 'navigation', 'source', 'grid'])
  })
})
