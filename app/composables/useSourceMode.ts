import { useEventListener } from '@vueuse/core'
import { sourceShortcut } from '../utils/shortcuts'

/**
 * Whether the open page shows its source, kept in the address
 * (`?mode=source`) so it can be shared and reloaded, and ⌘' / Ctrl+' to
 * switch. Returning from the source focuses the rendered page (`rendered`).
 * Source mode exists only in the studio running locally.
 */
export function useSourceMode(rendered: Ref<HTMLElement | null | undefined>) {
  const route = useRoute()
  const source = computed(
    () => import.meta.dev && route.query.mode === 'source',
  )

  function toggle() {
    const query = { ...route.query }
    if (source.value) delete query.mode
    else query.mode = 'source'
    return navigateTo({ query, hash: route.hash })
  }

  if (import.meta.dev)
    useEventListener(
      window,
      'keydown',
      (event: KeyboardEvent) => {
        if (event.defaultPrevented) return
        // A dialog or menu inside an inert, hidden page doesn't count.
        const overlay = [
          ...document.querySelectorAll(
            '[role="dialog"], [role="alertdialog"], [role="menu"]',
          ),
        ].some((element) => !element.closest('[inert]'))
        if (!sourceShortcut(event, { source: source.value, overlay })) return
        event.preventDefault()
        event.stopImmediatePropagation()
        void toggle()
      },
      { capture: true },
    )

  watch(source, (now, before) => {
    if (before && !now) void nextTick(() => rendered.value?.focus())
  })

  return { source, toggle }
}
