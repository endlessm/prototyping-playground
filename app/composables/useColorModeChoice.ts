import { nextTick } from 'vue'

export type ColorModeChoice = 'system' | 'light' | 'dark'

// The studio's color mode: System (follow the computer), Light or Dark,
// remembered in this browser. Switching cross-fades the whole window, unless
// the person prefers reduced motion.
export function useColorModeChoice() {
  const colorMode = useColorMode()
  const choice = computed(() => colorMode.preference as ColorModeChoice)

  async function choose(mode: ColorModeChoice) {
    const apply = async () => {
      colorMode.preference = mode
      await nextTick()
      await nextTick()
    }
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (document.startViewTransition && !still)
      await document.startViewTransition(apply).finished
    else await apply()
  }

  return { choice, resolved: computed(() => colorMode.value), choose }
}
