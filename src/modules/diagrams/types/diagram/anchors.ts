// How a diagram's surface names what Mermaid drew and finds it again after
// a redraw, with no DOM. Mermaid gives each drawn step an ID made of the
// drawing's ID, the step's source ID and a number in drawing order (which
// changes when steps are reordered), and each arrow `L_<from>_<to>_<n>`, so
// the source IDs are read out of those. A target is found again by its
// Mermaid ID, then by its label, among elements of its kind.

export interface DiagramElement {
  kind: 'step' | 'arrow' | 'group'
  /** The ID in the source: `age`, `start --> age`, a subgraph's ID. */
  mermaid: string
  /** As the agent reads it: `Step "Under 18?"`. */
  label: string
}

/** A drawn step's source ID, from its element ID in the drawing `svgId`. */
export function mermaidNodeId(domId: string, svgId: string) {
  const own = domId.startsWith(`${svgId}-`)
    ? domId.slice(svgId.length + 1)
    : domId
  return own.replace(/^flowchart-/, '').replace(/-\d+$/, '')
}

/**
 * An arrow's ends, from its Mermaid ID (`L_<from>_<to>_<n>`), among the
 * diagram's step IDs (which may hold underscores themselves).
 */
export function mermaidEdge(edgeId: string, steps: ReadonlySet<string>) {
  const match = /^L_(.+)_(\d+)$/.exec(edgeId)
  if (!match) return null
  const ends = match[1]!
  const index = Number(match[2])
  for (
    let split = ends.indexOf('_');
    split !== -1;
    split = ends.indexOf('_', split + 1)
  ) {
    const from = ends.slice(0, split)
    const to = ends.slice(split + 1)
    if (steps.has(from) && steps.has(to)) return { from, to, index }
  }
  return null
}

/** The element `anchor` names: by its Mermaid ID, then by its label. */
export function findDiagramElement<T extends DiagramElement>(
  elements: readonly T[],
  anchor: DiagramElement,
): T | null {
  const same = elements.filter(({ kind }) => kind === anchor.kind)
  return (
    same.find(({ mermaid }) => mermaid === anchor.mermaid) ??
    same.find(({ label }) => label === anchor.label) ??
    null
  )
}
