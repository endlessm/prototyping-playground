// Excalidraw's Help dialog lists every shortcut it has and can't be
// customised. Some do nothing on a canvas here, so this hides their rows, and
// sections left empty. Rows are hidden with inline `display: none`, never
// removed: React owns them, and deleting its nodes breaks its next update.

// Excalidraw's own labels for the shortcuts the canvas doesn't offer, and why.
export const UNSUPPORTED_SHORTCUTS = new Set([
  'Toggle grid', // remapped by the studio; the canvas menu shows its shortcut
  'Reset the canvas', // wiping a canvas isn't offered
  'Toggle light/dark theme', // the canvas follows the studio's colour mode
  'View mode', // set by the studio (a canvas you can't edit is read-only)
  'Command palette', // Excalidraw's isn't mounted; ⌘K is the studio's own
])

function prune() {
  const dialog = document.querySelector('.HelpDialog')
  if (!dialog) return
  for (const row of dialog.querySelectorAll<HTMLElement>(
    '.HelpDialog__shortcut',
  ))
    if (
      UNSUPPORTED_SHORTCUTS.has(
        row.firstElementChild?.textContent?.trim() ?? '',
      )
    )
      row.style.display = 'none'
  for (const section of dialog.querySelectorAll<HTMLElement>(
    '.HelpDialog__island',
  )) {
    const rows = [
      ...section.querySelectorAll<HTMLElement>('.HelpDialog__shortcut'),
    ]
    if (rows.length && rows.every((row) => row.style.display === 'none'))
      section.style.display = 'none'
  }
}

/**
 * Prunes the Help dialog whenever it opens (it renders into a portal outside
 * the canvas). Returns the stop function.
 */
export function pruneHelpDialog() {
  prune()
  const observer = new MutationObserver(prune)
  observer.observe(document.body, { childList: true, subtree: true })
  return () => observer.disconnect()
}
