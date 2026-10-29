import { useLocalStorage } from '@vueuse/core'

// The section navigation's state, shared by every section: shown or hidden
// (remembered in this browser), and whether the current page has one, so the
// rail offers its toggle only there. Its width is the dashboard sidebar's.
const present = ref(0)

export const SECTION_NAV = {
  /** The dashboard's storage key; the sidebar adds `-sidebar-section`. */
  storageKey: 'design-studio:panels',
  id: 'section',
  width: { default: 220, min: 180, max: 420 },
}

export function useSectionNav() {
  const open = useLocalStorage('design-studio:section-nav', true)
  return {
    open,
    /** Whether the current page has a section navigation, shown or not. */
    present: computed(() => present.value > 0),
    toggle: () => {
      open.value = !open.value
    },
    /** Called by each section navigation while it is on the page. */
    register: () => {
      present.value++
      return () => {
        present.value--
      }
    },
  }
}
