// The full-window status screen of a system change (creating, deleting,
// renaming, archiving, restoring or choosing the default system) in the tab
// that asked for it. The change restarts the dev server, so the screen runs
// before the application, from `sessionStorage`, on every page load until
// the destination is ready: it survives the restart, keeps the app inert,
// is announced politely, uses the studio's colours as they were, says so
// after 30 seconds and is forgotten after 2 minutes. Development only.
//
// The change is done once a page comes from a different dev server than the
// one that took the request, the rule of every restart (see
// `../settings/restart.ts`): a page from the server that took it waits for
// the next one and loads again from it.
import { studioServerSource, type DevServer } from '../settings/restart.ts'

export const TRANSITION_KEY = 'design-studio:system-transition'
export const TRANSITION_EVENT = 'studio:system-transition'
export const TRANSITION_ELEMENT = 'studio-system-transition'

export type TransitionOperation =
  'create' | 'delete' | 'rename' | 'archive' | 'restore' | 'default'

export interface PendingTransition {
  operation: TransitionOperation
  /** The system's name, as shown. */
  name: string
  /** Its permanent ID; for a creation, set once the system exists. */
  studioId?: string
  started: number
  appearance?: Record<string, string>
  /** The instance of the dev server that took the request. */
  from?: string
}

export interface TransitionText {
  titles: Record<TransitionOperation | 'opening', string>
  descriptions: Record<TransitionOperation | 'opening', string>
  slow: string
  reload: string
}

export function transitionScript(text: TransitionText, base: string) {
  return `(${systemTransition.toString()})(${JSON.stringify(text)},${JSON.stringify(
    {
      key: TRANSITION_KEY,
      event: TRANSITION_EVENT,
      id: TRANSITION_ELEMENT,
      base,
    },
  )},${studioServerSource})`
}

/** Runs in the page before the application; self-contained. */
export function systemTransition(
  text: TransitionText,
  names: { key: string; event: string; id: string; base: string },
  server: DevServer,
) {
  let slow: ReturnType<typeof setTimeout> | undefined
  let waiting = false
  const read = (): PendingTransition | null => {
    try {
      return JSON.parse(sessionStorage.getItem(names.key) || 'null')
    } catch {
      return null
    }
  }
  // A page from the server that took the request loads again once another
  // one answers. A creation's page waits for its answer first: a reload
  // would drop the request, and with it where to go.
  function awaitRestart(current: PendingTransition) {
    if (waiting || !current.from || server.servedBy() !== current.from) return
    if (current.operation === 'create' && !current.studioId) return
    waiting = true
    server.reloadFrom(current.from, names.base, () => Boolean(read()))
  }
  function show() {
    const current = read()
    if (!current) return
    if (Date.now() - current.started > 120_000) {
      sessionStorage.removeItem(names.key)
      return
    }
    awaitRestart(current)
    let cover = document.getElementById(names.id)
    if (!cover) {
      cover = document.createElement('div')
      cover.id = names.id
      cover.setAttribute('role', 'status')
      cover.setAttribute('aria-live', 'polite')
      cover.tabIndex = -1
      cover.style.cssText =
        'position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:24px;background:var(--transition-background,Canvas);color:var(--transition-foreground,CanvasText);font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;transition:opacity 160ms ease'
      const style = document.createElement('style')
      style.textContent = `#${names.id},#${names.id} *{box-sizing:border-box}@keyframes studio-transition-spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){#${names.id} [data-transition-spinner]{animation:none!important}#${names.id}{transition:none!important}}`
      const card = document.createElement('div')
      card.style.cssText = 'width:min(100%,420px);text-align:center'
      const spinner = document.createElement('div')
      spinner.setAttribute('aria-hidden', 'true')
      spinner.dataset.transitionSpinner = ''
      spinner.style.cssText =
        'width:32px;height:32px;margin:0 auto 24px;border:2px solid var(--transition-border,GrayText);border-top-color:var(--transition-foreground,CanvasText);border-radius:50%;animation:studio-transition-spin 1s linear infinite'
      const title = document.createElement('h1')
      title.dataset.transitionTitle = ''
      title.style.cssText =
        'font-size:24px;line-height:1.3;font-weight:600;margin:0 0 12px;overflow-wrap:anywhere'
      const description = document.createElement('p')
      description.dataset.transitionDescription = ''
      description.style.cssText =
        'font-size:14px;line-height:1.6;margin:0;color:var(--transition-muted,GrayText)'
      const reload = document.createElement('button')
      reload.type = 'button'
      reload.textContent = text.reload
      reload.hidden = true
      reload.style.cssText =
        'margin-top:24px;padding:8px 14px;border:1px solid var(--transition-border,GrayText);border-radius:8px;background:transparent;color:inherit;font:inherit;cursor:pointer'
      reload.onclick = () => location.reload()
      card.append(spinner, title, description, reload)
      cover.append(style, card)
      document.body.append(cover)
      // Everything else, the app and its open dialogs, is inert meanwhile.
      for (const child of document.body.children)
        if (child !== cover && child instanceof HTMLElement && !child.inert) {
          child.inert = true
          child.dataset.transitionInert = ''
        }
      cover.focus()
    }
    for (const [name, value] of Object.entries(current.appearance ?? {}))
      if (value) cover.style.setProperty(`--transition-${name}`, value)
    const phase =
      current.operation === 'create' && current.studioId
        ? 'opening'
        : current.operation
    const title = text.titles[phase].replace('{name}', current.name)
    cover.querySelector('[data-transition-title]')!.textContent = title
    const description = cover.querySelector('[data-transition-description]')!
    description.textContent = text.descriptions[phase]
    clearTimeout(slow)
    slow = setTimeout(
      () => {
        description.textContent = text.slow
        ;(cover.querySelector('button') as HTMLButtonElement).hidden = false
      },
      Math.max(0, current.started + 30_000 - Date.now()),
    )
  }
  window.addEventListener(names.event, show)
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', show)
  else show()
}
