import { onBeforeUnmount, onMounted, ref } from 'vue'

// Whether the studio is in dark mode: the preview document's root element
// has the `dark` class then. Styles can't reach it (they stay scoped), so the
// layer reads it and sets a class of its own.
export function useDark() {
  const dark = ref(false)
  let observer: MutationObserver | undefined
  onMounted(() => {
    const root = document.documentElement
    const read = () => (dark.value = root.classList.contains('dark'))
    read()
    observer = new MutationObserver(read)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
  })
  onBeforeUnmount(() => observer?.disconnect())
  return dark
}

// Endless Studios' fonts for the product screens the comments sit on.
export function useEndlessFonts() {
  onMounted(() => {
    if (document.getElementById('endless-fonts')) return
    const link = document.createElement('link')
    link.id = 'endless-fonts'
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700;800&family=Inter:wght@400;600;700&family=Nunito:wght@400;600&display=swap'
    document.head.appendChild(link)
  })
}

/** ⌥⌘M on Apple computers, Ctrl+Alt+M elsewhere. */
export const commentShortcut = () =>
  /Mac|iPhone|iPad/.test(navigator.platform) ? '⌥⌘M' : 'Ctrl+Alt+M'
