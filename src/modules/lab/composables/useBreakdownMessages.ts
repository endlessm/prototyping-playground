import type { HostBody } from '../../../../tooling/preview/protocol'

/**
 * The host messages a Breakdown's frames hear, routed from one place so a
 * new message reaches them all: `shared` goes to every frame of the stage,
 * the component alone included; `pieces` adds the highlight, for the root
 * card's frame and every piece card's frame.
 */
export function useBreakdownMessages(
  highlight: () => { hover: string | null; selected: string | null },
) {
  const shared = computed<HostBody[]>(() => [])
  const pieces = computed<HostBody[]>(() => [
    ...shared.value,
    { kind: 'highlight', ...highlight() },
  ])
  return { shared, pieces }
}
