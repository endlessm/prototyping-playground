// The Roles Map's view state, shared by every part of the view through provide/inject. `Roles Map.vue` provides it
// once; the canvas, tiles, panel, timeline and Who's who read and change it with `useMapState()`.

import { computed, inject, provide, reactive, ref, watch, type ComputedRef, type InjectionKey, type Ref } from 'vue'
import { computeLayout, type MapLayout } from './layout'
import { brightwater, existsAt, type NodeId, type PlaceId, type Story, type StoryEvent } from './story'

export type MapMode = 'story' | 'explore'

/** The switches that show or hide kinds of things on the map. */
export interface MapLayers {
  invitations: boolean
  creations: boolean
  programs: boolean
  next: boolean
}

export interface MapState {
  mode: Ref<MapMode>
  /** The story's current step, from 1 to the number of steps. */
  step: Ref<number>
  selectedId: Ref<NodeId | null>
  layers: MapLayers
  /** The person whose path is playing, if any. */
  path: Ref<NodeId | null>
  /** What the map draws: the story in Story mode. */
  story: ComputedRef<Story>
  layout: ComputedRef<MapLayout>
  /** The event of the current step, and of the step after it, when there is one. */
  current: ComputedRef<StoryEvent | null>
  next: ComputedRef<StoryEvent | null>
  /** The tiles and areas that exist at the current step. */
  shown: ComputedRef<{ nodes: Set<NodeId>; places: Set<PlaceId> }>
  select: (id: NodeId | null) => void
}

export interface MapStateOptions {
  mode?: MapMode
  step?: number
}

const key: InjectionKey<MapState> = Symbol('roles-map')

/** Creates the view's state and provides it to everything inside; `options` follows the view's props. */
export function provideMapState(options: () => MapStateOptions = () => ({})): MapState {
  const mode = ref<MapMode>('story')
  const step = ref(brightwater.steps.length)
  const selectedId = ref<NodeId | null>(null)
  const path = ref<NodeId | null>(null)
  const layers = reactive<MapLayers>({ invitations: true, creations: true, programs: true, next: true })

  const story = computed(() => brightwater)
  const layout = computed(() => computeLayout(story.value))
  const current = computed(() => story.value.steps[step.value - 1] ?? null)
  const next = computed(() => story.value.steps[step.value] ?? null)
  const shown = computed(() => existsAt(story.value, mode.value === 'story' ? step.value : story.value.steps.length))

  watch(
    options,
    (value) => {
      mode.value = value.mode ?? 'story'
      step.value = Math.min(Math.max(value.step ?? brightwater.steps.length, 1), brightwater.steps.length)
    },
    { immediate: true },
  )

  const state: MapState = {
    mode,
    step,
    selectedId,
    layers,
    path,
    story,
    layout,
    current,
    next,
    shown,
    select: (id) => {
      selectedId.value = id
    },
  }
  provide(key, state)
  return state
}

export function useMapState(): MapState {
  const state = inject(key)
  if (!state) throw new Error('useMapState() runs only inside Roles Map.vue, which provides the state.')
  return state
}
