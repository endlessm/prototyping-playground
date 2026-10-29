// Shared by the preview build and the studio's pages.

/** The URL segment, under the studio's base path, of preview documents. */
export const PREVIEW_ROUTE = '_preview/'
/** The document of prototypes with no system. */
export const NO_SYSTEM = 'none'
/** The message channel between the studio and a preview document. */
export const PREVIEW_CHANNEL = 'studio-preview'
/** Where the studio keeps its color mode: `system`, `light` or `dark`. */
export const COLOR_MODE_KEY = 'design-studio:color-mode'

/**
 * Runs first in a preview document's head: applies the studio's color mode
 * before the first paint, then follows it (another document of the studio
 * changing it, or the computer while it is System). A system with only a
 * light mode stays light.
 */
export function colorModeScript(modes: readonly string[] | null) {
  if (modes && !modes.includes('dark'))
    return `document.documentElement.style.colorScheme = 'light'`
  return `(() => {
  const root = document.documentElement
  const computer = matchMedia('(prefers-color-scheme: dark)')
  const apply = () => {
    let chosen = 'system'
    try { chosen = localStorage.getItem(${JSON.stringify(COLOR_MODE_KEY)}) || chosen } catch {}
    const dark = chosen === 'dark' || (chosen === 'system' && computer.matches)
    root.classList.toggle('dark', dark)
    root.style.colorScheme = dark ? 'dark' : 'light'
  }
  apply()
  addEventListener('storage', (event) => {
    if (event.key === ${JSON.stringify(COLOR_MODE_KEY)} || event.key === null) apply()
  })
  computer.addEventListener('change', apply)
})()`
}
