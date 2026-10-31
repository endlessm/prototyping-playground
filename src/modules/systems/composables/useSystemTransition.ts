import {
  TRANSITION_ELEMENT,
  TRANSITION_EVENT,
  TRANSITION_KEY,
  type PendingTransition,
  type TransitionOperation,
} from '../../../../tooling/systems/transition'

// A system change in the tab that asked for it: the full-window status
// screen (`tooling/systems/transition.ts`), which survives the dev server's
// restart, and the confirmation toast, delivered once on the page after
// the reload. The Systems pages settle it when their destination is ready.

const TOAST_KEY = 'design-studio:system-toast'

const read = (): PendingTransition | null => {
  try {
    return JSON.parse(sessionStorage.getItem(TRANSITION_KEY) || 'null')
  } catch {
    return null
  }
}
const save = (pending: PendingTransition) => {
  sessionStorage.setItem(TRANSITION_KEY, JSON.stringify(pending))
  window.dispatchEvent(new Event(TRANSITION_EVENT))
}

/** Covers the app while a system change runs and the studio restarts. */
export function beginSystemTransition(
  operation: TransitionOperation,
  name: string,
  studioId?: string,
) {
  const style = getComputedStyle(document.documentElement)
  const value = (name: string) => style.getPropertyValue(name).trim()
  save({
    operation,
    name,
    studioId,
    started: Date.now(),
    appearance: {
      background: value('--ui-bg'),
      foreground: value('--ui-text-highlighted'),
      muted: value('--ui-text-muted'),
      border: value('--ui-border'),
    },
  })
}

// The dev server announces its restart to every page: the change is done.
const restarting = () => {
  const pending = read()
  if (pending && !pending.restarting) save({ ...pending, restarting: true })
}
if (import.meta.dev) import.meta.hot?.on('studio:restarting', restarting)

/** A new system exists: "Opening <Name>", until its Overview is ready. */
export function systemCreated(studioId: string) {
  const pending = read()
  if (pending) save({ ...pending, studioId })
}

/** Removes the status screen, fading unless motion is reduced. */
export function finishSystemTransition() {
  sessionStorage.removeItem(TRANSITION_KEY)
  for (const element of document.querySelectorAll<HTMLElement>(
    '[data-transition-inert]',
  )) {
    element.inert = false
    delete element.dataset.transitionInert
  }
  const cover = document.getElementById(TRANSITION_ELEMENT)
  if (!cover) return
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) cover.style.transition = 'none'
  requestAnimationFrame(() => {
    cover.style.opacity = '0'
    setTimeout(() => cover.remove(), reduced ? 0 : 160)
  })
}

/** A confirmation shown once, on the next page. */
export function queueSystemToast(title: string) {
  sessionStorage.setItem(TOAST_KEY, title)
}

/**
 * On a Systems page: shows a queued confirmation, and ends a pending
 * change's status screen once the studio has reloaded and the destination
 * is ready: a new system's Overview, a collection without the deleted
 * system, or any page for the other changes.
 */
export function useSystemTransition(
  systems: () => string[],
  current: () => string | undefined,
) {
  if (!import.meta.dev) return
  const toast = useStudioToast()
  function settle() {
    const pending = read()
    if (!pending?.restarted) return
    const ids = systems()
    if (
      pending.operation === 'create' &&
      (!pending.studioId ||
        !ids.includes(pending.studioId) ||
        current() !== pending.studioId)
    )
      return
    if (
      pending.operation === 'delete' &&
      pending.studioId &&
      ids.includes(pending.studioId)
    )
      return
    finishSystemTransition()
  }
  function deliver() {
    if (read()) return
    const title = sessionStorage.getItem(TOAST_KEY)
    if (!title) return
    sessionStorage.removeItem(TOAST_KEY)
    toast.success(title)
  }
  onMounted(() => {
    settle()
    deliver()
  })
  watch([systems, current], () => {
    settle()
    deliver()
  })
}
