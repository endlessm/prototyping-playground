// The rules behind source mode that need no browser: when ⌘' / Ctrl+'
// switches to the source, when ⌘S / Ctrl+S saves, and which syntax a file
// gets from its extension.
import { describe, expect, test } from 'vitest'
import { saveShortcut, sourceShortcut } from '../../app/utils/shortcuts'
import { sourceLanguage } from '../../app/utils/sourceLanguage'

// A stand-in for an element: its tag, and the selectors it sits inside.
const element = (tagName: string, inside: string[] = []) => ({
  tagName,
  isContentEditable: inside.includes('.cm-editor'),
  closest: (selector: string) =>
    selector.split(',').some((part) => inside.includes(part.trim()))
      ? {}
      : null,
})

const key = (
  init: Partial<Omit<KeyboardEvent, 'target'>> & { target?: unknown } = {},
) => ({
  key: "'",
  code: 'Quote',
  metaKey: false,
  ctrlKey: true,
  shiftKey: false,
  altKey: false,
  repeat: false,
  isComposing: false,
  target: element('BODY'),
  ...init,
})

describe('the source shortcut', () => {
  test("[PR-125] ⌘' or Ctrl+' on the page switches between the rendered page and its source", () => {
    expect(sourceShortcut(key(), { source: false, overlay: false })).toBe(true)
    expect(
      sourceShortcut(key({ ctrlKey: false, metaKey: true }), {
        source: true,
        overlay: false,
      }),
    ).toBe(true)
    expect(
      sourceShortcut(key({ shiftKey: true, key: '"' }), {
        source: false,
        overlay: false,
      }),
    ).toBe(false)
  })

  test('[PR-127] it is ignored while typing in a form field', () => {
    for (const target of [element('INPUT'), element('TEXTAREA')])
      expect(
        sourceShortcut(key({ target }), { source: false, overlay: false }),
      ).toBe(false)
  })

  test('[PR-127] it works inside the source editor itself', () => {
    const target = element('DIV', ['.cm-editor'])
    expect(
      sourceShortcut(key({ target }), { source: true, overlay: false }),
    ).toBe(true)
  })

  test('[PR-127] it is ignored while a dialog or menu is open', () => {
    expect(sourceShortcut(key(), { source: false, overlay: true })).toBe(false)
    expect(sourceShortcut(key(), { source: true, overlay: true })).toBe(false)
  })
})

describe('the save shortcut', () => {
  test('[PR-131] ⌘S or Ctrl+S saves; with Shift or Alt it does not', () => {
    expect(saveShortcut(key({ key: 's', code: 'KeyS' }))).toBe(true)
    expect(
      saveShortcut(
        key({ key: 's', code: 'KeyS', ctrlKey: false, metaKey: true }),
      ),
    ).toBe(true)
    expect(saveShortcut(key({ key: 'S', code: 'KeyS', shiftKey: true }))).toBe(
      false,
    )
    expect(saveShortcut(key({ key: 's', code: 'KeyS', altKey: true }))).toBe(
      false,
    )
    expect(saveShortcut(key({ key: 's', code: 'KeyS', ctrlKey: false }))).toBe(
      false,
    )
  })
})

describe('syntax highlighting', () => {
  test('[PR-134] views are Vue; code, Markdown, JSON, Mermaid, CSS and YAML get their own syntax; anything else is plain', () => {
    expect(sourceLanguage('src/prototypes/ada/demo/Home.vue')).toBe('vue')
    for (const file of ['a.ts', 'a.tsx', 'a.js', 'a.jsx', 'a.mjs', 'a.cjs'])
      expect(sourceLanguage(file)).toBe('typescript')
    expect(sourceLanguage('notes/README.md')).toBe('markdown')
    expect(sourceLanguage('meta.json')).toBe('json')
    expect(sourceLanguage('flow.mmd')).toBe('mermaid')
    expect(sourceLanguage('flow.mermaid')).toBe('mermaid')
    expect(sourceLanguage('theme.CSS')).toBe('css')
    expect(sourceLanguage('config.yaml')).toBe('yaml')
    expect(sourceLanguage('notes.txt')).toBe('text')
    expect(sourceLanguage('Makefile')).toBe('text')
  })
})
