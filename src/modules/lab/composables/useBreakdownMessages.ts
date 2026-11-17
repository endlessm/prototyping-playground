import type {
  HostBody,
  KnobHighlight,
  PreviewNodeProps,
  PreviewOverrides,
} from '../../../../tooling/preview/protocol'

/**
 * The host messages a Breakdown's frames hear, routed from one place so a
 * new message reaches them all: `shared` goes to every frame of the stage,
 * the component alone included (the knobs' unsaved changes and the dial
 * panel's props); `pieces` adds the highlight and the hovered knob's area,
 * for the root card's frame and every piece card's frame.
 */
export function useBreakdownMessages(
  highlight: () => { hover: string | null; selected: string | null },
  overrides: () => PreviewOverrides = () => ({}),
  knob: () => KnobHighlight | null = () => null,
  nodeProps: () => PreviewNodeProps = () => ({}),
) {
  const shared = computed<HostBody[]>(() => [
    { kind: 'overrides', overrides: overrides() },
    { kind: 'nodeProps', props: nodeProps() },
  ])
  const pieces = computed<HostBody[]>(() => [
    ...shared.value,
    { kind: 'highlight', ...highlight() },
    { kind: 'knob', knob: knob() },
  ])
  return { shared, pieces }
}
