import { inject, onMounted, provide, ref, type InjectionKey, type Ref } from 'vue'
import type { StepId } from './content'

interface Walkthrough {
  step: Ref<StepId>
  go: (step: StepId) => void
}

const KEY: InjectionKey<Walkthrough> = Symbol('walkthrough')

// The step on screen, shared with the mock studio's navigation and with
// each step's links to the others.
export function provideWalkthrough(start: StepId): Walkthrough {
  const step = ref<StepId>(start)
  const walkthrough = { step, go: (next: StepId) => (step.value = next) }
  provide(KEY, walkthrough)
  return walkthrough
}

export function useWalkthrough(): Walkthrough {
  const walkthrough = inject(KEY)
  if (!walkthrough) throw new Error('A step renders only inside the walkthrough.')
  return walkthrough
}

// The mockup was drawn in Inter; a prototype with no system has only the
// browser's fonts.
export function useInterFont() {
  onMounted(() => {
    if (document.getElementById('studio-v2-font')) return
    const link = document.createElement('link')
    link.id = 'studio-v2-font'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'
    document.head.appendChild(link)
  })
}
