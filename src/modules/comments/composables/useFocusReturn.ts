import type { ShallowRef } from 'vue'

/**
 * Focus goes back where it came from when a popover closes: the pin, the
 * list's row or the button that opened it. When that is gone (a resolved
 * thread's row leaves the Open tab), `fallback` says where instead. Focus
 * that has already moved elsewhere stays there. Call during setup, before
 * the popover takes focus.
 */
export function useFocusReturn(
  root: Readonly<ShallowRef<HTMLElement | null>>,
  fallback?: () => HTMLElement | null | undefined,
) {
  const active = document.activeElement
  const from =
    active instanceof HTMLElement && active !== document.body ? active : null
  onBeforeUnmount(() => {
    const now = document.activeElement
    if (now && now !== document.body && !root.value?.contains(now)) return
    const target = from?.isConnected ? from : fallback?.()
    target?.focus({ preventScroll: true })
  })
}
