// Story playback: which steps are playing, whether they advance on their own and how fast. It only moves the map
// state's `step`; what each step shows, highlights and ghosts is derived from `step` elsewhere. `Roles Map.vue`
// provides it once; the timeline drives it, and so can anything else that wants to replay part of the story, such
// as one person's path.

import {
  computed,
  inject,
  onScopeDispose,
  provide,
  readonly,
  ref,
  watch,
  type ComputedRef,
  type InjectionKey,
  type Ref,
} from 'vue'
import type { MapState } from './state'
import { mapRoles, type Story } from './story'

/** The speeds on offer, as multiples of the normal pace. */
export const SPEEDS = [0.5, 1, 1.5, 2] as const
export type Speed = (typeof SPEEDS)[number]

/** How long a step stays on screen at normal speed before the next one, in milliseconds. */
export const STEP_DURATION = 2600

export interface Playback {
  /** Whether the steps advance on their own. */
  playing: Readonly<Ref<boolean>>
  speed: Ref<Speed>
  /** The steps being played, in order: the whole story, or the ones passed to `playSteps`. */
  sequence: ComputedRef<number[]>
  /** Whether `playSteps` narrowed the playback to part of the story. */
  partial: ComputedRef<boolean>
  /** Where the current step sits in the sequence (0-based), or -1 when it isn't part of it. */
  position: ComputedRef<number>
  /** The step the sequence plays after the current one, shown as a ghost; `null` on the last. */
  upcoming: ComputedRef<number | null>
  atStart: ComputedRef<boolean>
  atEnd: ComputedRef<boolean>
  /** Whether the viewer asked for reduced motion: steps then change at once, and playback still advances. */
  reducedMotion: Readonly<Ref<boolean>>
  /** Plays from the current step; from the start when the sequence has finished. */
  play: () => void
  pause: () => void
  toggle: () => void
  /** The sequence's previous or next step. Playing keeps playing from there. */
  previous: () => void
  next: () => void
  /** Jumps to any story step; it leaves a partial sequence when the step isn't in it. */
  goTo: (step: number) => void
  /** Plays only these steps, in this order, from the first, and stops on the last; for replaying a path. */
  playSteps: (steps: number[]) => void
  /** Back to the whole story, staying on the current step and pausing. */
  playStory: () => void
}

const key: InjectionKey<Playback> = Symbol('roles-map-playback')

/** Creates the playback for the map state and provides it to everything inside the view. */
export function providePlayback(state: MapState): Playback {
  const { story, step } = state
  const playing = ref(false)
  const speed = ref<Speed>(1)
  const only = ref<number[] | null>(null)
  const reducedMotion = ref(false)

  const whole = computed(() => story.value.steps.map((_, index) => index + 1))
  const sequence = computed(() => only.value ?? whole.value)
  const partial = computed(() => only.value !== null)
  const position = computed(() => sequence.value.indexOf(step.value))
  const upcoming = computed(() => (position.value < 0 ? null : (sequence.value[position.value + 1] ?? null)))
  const atStart = computed(() => position.value <= 0)
  const atEnd = computed(() => position.value === sequence.value.length - 1)

  let timer: ReturnType<typeof setTimeout> | undefined
  const clear = () => {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }

  /** Waits one step at the current speed, then advances, until the sequence ends. */
  const schedule = () => {
    clear()
    if (!playing.value) return
    timer = setTimeout(() => {
      timer = undefined
      const following = sequence.value[position.value + 1]
      if (following === undefined) {
        playing.value = false
        return
      }
      step.value = following
      if (position.value === sequence.value.length - 1) playing.value = false
      else schedule()
    }, STEP_DURATION / speed.value)
  }

  const play = () => {
    if (!sequence.value.length) return
    if (position.value < 0 || atEnd.value) step.value = sequence.value[0]
    playing.value = true
    schedule()
  }
  const pause = () => {
    playing.value = false
    clear()
  }

  const move = (by: number) => {
    const target = sequence.value[Math.min(Math.max(position.value + by, 0), sequence.value.length - 1)]
    if (target === undefined) return
    step.value = target
    if (atEnd.value) pause()
    else schedule()
  }

  const playback: Playback = {
    playing: readonly(playing),
    speed,
    sequence,
    partial,
    position,
    upcoming,
    atStart,
    atEnd,
    reducedMotion: readonly(reducedMotion),
    play,
    pause,
    toggle: () => (playing.value ? pause() : play()),
    previous: () => move(position.value < 0 ? 0 : -1),
    next: () => move(position.value < 0 ? 0 : 1),
    goTo: (target) => {
      if (!whole.value.includes(target)) return
      if (only.value && !only.value.includes(target)) only.value = null
      step.value = target
      if (atEnd.value) pause()
      else schedule()
    },
    playSteps: (steps) => {
      const valid = steps.filter((target) => whole.value.includes(target))
      if (!valid.length) return
      only.value = valid
      step.value = valid[0]
      playing.value = valid.length > 1
      schedule()
    },
    playStory: () => {
      only.value = null
      pause()
    },
  }

  // A new speed applies from the step on screen, not from the next one.
  watch(speed, schedule)
  // Switching to another story (Explore) ends whatever was playing.
  watch(story, () => {
    only.value = null
    pause()
  })

  if (typeof window !== 'undefined' && window.matchMedia) {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      reducedMotion.value = query.matches
    }
    update()
    query.addEventListener('change', update)
    onScopeDispose(() => query.removeEventListener('change', update))
  }
  onScopeDispose(clear)

  provide(key, playback)
  return playback
}

export function usePlayback(): Playback {
  const playback = inject(key)
  if (!playback) throw new Error('usePlayback() runs only inside Roles Map.vue, which provides the playback.')
  return playback
}

/** A step's short name on the timeline and who took it: "Team Owner", "by Marcus". */
export function stepLabel(story: Story, step: number): { title: string; by: string } {
  const event = story.steps[step - 1]
  if (!event) return { title: '', by: '' }
  const actor = story.nodes[event.actor]?.person?.name.split(' ')[0] ?? ''
  const by = actor ? `by ${actor}` : ''
  if (event.kind === 'create') return { title: `${story.places[event.place]?.kind ?? 'Place'} created`, by }
  return { title: event.role === 'learner' ? 'Learners' : mapRoles[event.role].label, by }
}
