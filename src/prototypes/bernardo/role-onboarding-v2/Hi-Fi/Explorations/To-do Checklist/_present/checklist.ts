import { computed, ref } from 'vue'

// What every presentation gets from the Org page's welcome slot, the same props the welcome card takes.
export interface Welcome {
  name: string
  lead: string
  steps: string[]
  done?: number
  to?: string
  flow?: number
  note?: number
  optional?: string[]
  actions?: Record<string, () => void>
}

// The rules the celebrated checklist already follows, so the presentations differ only in how they look and move:
// steps done on arrival come ticked, optional steps don't hold completion back, and the link stays on the step that
// was open on arrival.
export function useChecklist(welcome: Welcome) {
  const checked = ref(welcome.steps.map((_, i) => i < (welcome.done ?? 0)))
  const isOptional = (i: number) => !!welcome.optional?.includes(welcome.steps[i]!)
  const allDone = computed(() => checked.value.every((c, i) => c || isOptional(i)))
  const everyDone = computed(() => checked.value.every(Boolean))
  const isLink = (i: number) => !checked.value[i] && i === (welcome.done ?? 0) && !!welcome.to
  const flash = ref<number | null>(null)

  function toggle(i: number) {
    const was = allDone.value
    const next = !checked.value[i]
    checked.value[i] = next
    if (next) {
      flash.value = i
      setTimeout(() => flash.value === i && (flash.value = null), 700)
    } else if (flash.value === i) flash.value = null
    return { next, completed: !was && allDone.value, reopened: was && !allDone.value }
  }

  return { checked, isOptional, allDone, everyDone, isLink, flash, toggle }
}
