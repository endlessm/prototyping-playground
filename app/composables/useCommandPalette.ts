// Whether the command palette is open. The rail's search button, Home's
// search field and ⌘K open it.
const open = ref(false)

export function useCommandPalette() {
  return { open, show: () => (open.value = true) }
}
