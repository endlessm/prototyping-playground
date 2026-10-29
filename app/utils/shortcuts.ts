// The studio's keyboard shortcuts and their labels. Labels name the keys of
// the computer in use: ⌘ on Apple computers and devices, Ctrl elsewhere.
// Plain functions, so they run in tests without a browser.

export type StudioShortcut =
  'palette' | 'navigation' | 'source' | 'grid' | 'save'

const KEYS: Record<StudioShortcut, { shift?: boolean; key: string }> = {
  palette: { key: 'K' },
  navigation: { key: ';' },
  source: { key: "'" },
  grid: { key: "'", shift: true },
  save: { key: 'S' },
}

export const isApple = (userAgent: string) =>
  /Macintosh|Mac OS X|iPhone|iPad/.test(userAgent)

/** Whether this browser runs on an Apple computer or device. */
export const onApple = () =>
  typeof navigator !== 'undefined' && isApple(navigator.userAgent)

/** "⌘K" on Apple computers, "Ctrl+K" elsewhere. */
export function shortcutLabel(shortcut: StudioShortcut, apple = onApple()) {
  const { key, shift } = KEYS[shortcut]
  return apple
    ? `⌘${shift ? '⇧' : ''}${key}`
    : `Ctrl+${shift ? 'Shift+' : ''}${key}`
}

type Target = {
  tagName?: string
  isContentEditable?: boolean
  closest?: (selector: string) => unknown
} | null

type Keystroke = Pick<
  KeyboardEvent,
  | 'key'
  | 'code'
  | 'metaKey'
  | 'ctrlKey'
  | 'shiftKey'
  | 'altKey'
  | 'repeat'
  | 'isComposing'
> & { target: unknown }

/** True in a text field, so shortcuts don't steal keystrokes. */
export function isTyping(target: unknown) {
  const element = target as Target
  return Boolean(
    element &&
    (element.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName ?? '')),
  )
}

const plainCommand = (event: Keystroke) =>
  (event.metaKey || event.ctrlKey) &&
  !event.altKey &&
  !event.repeat &&
  !event.isComposing

/**
 * ⌘; or Ctrl+; shows or hides the section navigation. It works in the
 * source editor too, but not in other text fields.
 */
export function sectionNavShortcut(event: Keystroke) {
  const target = event.target as Target
  const inSourceEditor = Boolean(target?.closest?.('.cm-editor'))
  return (
    event.key === ';' &&
    plainCommand(event) &&
    !event.shiftKey &&
    (!isTyping(target) || inSourceEditor)
  )
}

/**
 * ⌘' toggles an artifact's source, ⌘⇧' is the grid. The key is matched by
 * its position, so Shift turning ' into " still counts.
 */
export function artifactShortcut(event: Keystroke): 'source' | 'grid' | null {
  if (!plainCommand(event)) return null
  if (event.code !== 'Quote' && event.key !== "'" && event.key !== '"')
    return null
  return event.shiftKey ? 'grid' : 'source'
}

export type PreviewShortcut = 'source' | 'grid' | 'palette' | 'navigation'

/** The studio commands a preview document passes on to the studio. */
export function previewShortcut(event: Keystroke): PreviewShortcut | null {
  const artifact = artifactShortcut(event)
  if (artifact) return artifact
  if (!plainCommand(event) || event.shiftKey) return null
  if (event.key.toLowerCase() === 'k') return 'palette'
  if (event.key === ';') return 'navigation'
  return null
}

/**
 * Whether ⌘' or Ctrl+' switches the open page to its source or back: not
 * while typing in a form field (the source editor itself excepted) or while
 * a dialog or menu is open.
 */
export function sourceShortcut(
  event: Keystroke,
  { source, overlay }: { source: boolean; overlay: boolean },
) {
  if (artifactShortcut(event) !== 'source' || overlay) return false
  const target = event.target as Target
  const inSourceEditor = Boolean(target?.closest?.('.cm-editor'))
  return !isTyping(target) || (source && inSourceEditor)
}

/** ⌘S or Ctrl+S, without Shift or Alt. */
export function saveShortcut(event: Keystroke) {
  return (
    plainCommand(event) &&
    !event.shiftKey &&
    (event.code === 'KeyS' || event.key.toLowerCase() === 's')
  )
}
