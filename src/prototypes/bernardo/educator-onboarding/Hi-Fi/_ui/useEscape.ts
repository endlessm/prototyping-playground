import { onBeforeUnmount, onMounted } from 'vue'

/** Calls `onClose` when Escape is pressed anywhere in the document while the component is mounted. */
export function useEscape(onClose: () => void) {
  const close = (event: KeyboardEvent) => {
    if (event.key === 'Escape') onClose()
  }
  onMounted(() => document.addEventListener('keydown', close))
  onBeforeUnmount(() => document.removeEventListener('keydown', close))
}
