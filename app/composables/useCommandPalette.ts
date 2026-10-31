// Whether the command palette is open. The rail's search button, Home's
// search field and ⌘K open it.
const open = ref(false)
let origin: HTMLElement | null = null

export function useCommandPalette() {
  return {
    open,
    show: () => {
      origin = document.activeElement as HTMLElement | null
      open.value = true
    },
    restoreFocus: (event: Event) => {
      event.preventDefault()
      const target = origin
      queueMicrotask(() => {
        const active = document.activeElement
        if (
          target?.isConnected &&
          (active === document.body || active?.closest('[role="dialog"]'))
        )
          target.focus({ preventScroll: true })
      })
    },
    forgetFocus: () => {
      origin = null
    },
  }
}
