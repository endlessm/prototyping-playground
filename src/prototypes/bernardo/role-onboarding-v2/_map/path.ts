// One person's path: the chain of awards from Endless Access down to them, replayed on its own while everything off it
// fades. The panel starts and stops it; the tiles, arrows, areas and shelf read `usePathView()` to know what to dim.
// The path lives in the map state's `path` and in a partial playback sequence; losing either ends it.

import { computed, onScopeDispose, watch, type ComputedRef } from 'vue'
import { arrival, chainTo } from './panel'
import { STEP_DURATION, usePlayback } from './playback'
import { useMapState } from './state'
import type { NodeId, PlaceId, Story } from './story'

export interface StoryPath {
  /** The tiles on the path, from the top of the story down to the person. */
  nodes: NodeId[]
  /** The steps that brought each of them in, in story order. Empty for the Endless Admin, there from the start. */
  steps: number[]
}

/** The path to a tile: its chain of awards, without the creations along the way. */
export function pathTo(story: Story, id: NodeId): StoryPath {
  const nodes = chainTo(story, id).map((node) => node.id)
  const steps = nodes
    .map((node) => arrival(story, node)?.step)
    .filter((step): step is number => step !== undefined && step > 0)
  return { nodes, steps: [...new Set(steps)].sort((a, b) => a - b) }
}

/** The steps a path replays: its awards, or the first step when it has none, so the map still has a moment to show. */
export function replaySteps(path: StoryPath): number[] {
  return path.steps.length ? path.steps : [1]
}

/** The places a path runs through: where each of its tiles lives, and every place around those. */
export function pathPlaces(story: Story, nodes: NodeId[]): Set<PlaceId> {
  const places = new Set<PlaceId>()
  for (const id of nodes) {
    let place: PlaceId | null | undefined = story.nodes[id]?.place
    while (place && !places.has(place)) {
      places.add(place)
      place = story.places[place]?.parent
    }
  }
  return places
}

export interface PathView {
  /** Whether a path is playing, so whatever is off it should dim. */
  active: ComputedRef<boolean>
  nodes: ComputedRef<Set<NodeId>>
  steps: ComputedRef<Set<number>>
  places: ComputedRef<Set<PlaceId>>
}

/** What is on the playing path, for the parts of the map that dim when they aren't. */
export function usePathView(): PathView {
  const { story, path, mode } = useMapState()
  const current = computed(() =>
    mode.value === 'story' && path.value && story.value.nodes[path.value] ? pathTo(story.value, path.value) : null,
  )
  return {
    active: computed(() => current.value !== null),
    nodes: computed(() => new Set(current.value?.nodes ?? [])),
    steps: computed(() => new Set(current.value?.steps ?? [])),
    places: computed(() => pathPlaces(story.value, current.value?.nodes ?? [])),
  }
}

export interface PathPlayer {
  /** Whether this person's path is the one on the map. */
  on: ComputedRef<boolean>
  start: () => void
  stop: () => void
  toggle: () => void
}

/**
 * Plays one person's path from the component that calls it (the panel). The path ends when it is stopped, a moment
 * after its last step, when the playback leaves it (the timeline jumps outside it, another story) and when the caller
 * goes away: closing the panel or selecting someone else.
 */
export function usePathPlayer(id: () => NodeId): PathPlayer {
  const { story, path, mode } = useMapState()
  const playback = usePlayback()
  const on = computed(() => path.value === id())

  let hold: ReturnType<typeof setTimeout> | undefined
  const clearHold = () => {
    if (hold !== undefined) clearTimeout(hold)
    hold = undefined
  }

  const stop = () => {
    clearHold()
    if (!on.value) return
    path.value = null
    playback.playStory()
  }

  /** Leaves the finished path on screen for one more step, then gives the whole map back. */
  const holdThenStop = () => {
    clearHold()
    hold = setTimeout(() => {
      hold = undefined
      if (on.value && playback.atEnd.value && !playback.playing.value) stop()
    }, STEP_DURATION / playback.speed.value)
  }

  const start = () => {
    if (mode.value !== 'story') return
    clearHold()
    playback.playSteps(replaySteps(pathTo(story.value, id())))
    path.value = id()
    if (!playback.playing.value) holdThenStop()
  }

  watch(playback.playing, (playing, was) => {
    if (!on.value) return
    if (playing) clearHold()
    else if (was && playback.atEnd.value) holdThenStop()
  })
  watch(playback.partial, (partial) => {
    if (!partial && on.value) stop()
  })
  watch(mode, () => stop())

  onScopeDispose(stop)

  return { on, start, stop, toggle: () => (on.value ? stop() : start()) }
}
