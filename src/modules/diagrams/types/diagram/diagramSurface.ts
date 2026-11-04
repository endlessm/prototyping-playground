// A diagram's artifact surface, over the SVG Mermaid drew in the studio's
// own DOM. A target is a step, an arrow or a group, named by its Mermaid ID
// and label (`Step "Under 18?"`), or an empty spot, a point as fractions of
// the drawing. Saving the file draws a new SVG, so each element is found
// again by its Mermaid ID, then its label (`anchors.ts`); a spot is always
// there while there is a drawing.
import {
  boxOf,
  fraction,
  inside,
  interceptElement,
  sampledChanges,
} from '../../../../../app/utils/domSurface'
import type {
  ArtifactSurface,
  SurfaceAnchor,
  SurfaceBox,
  SurfaceLocation,
  SurfacePoint,
  SurfaceTarget,
} from '../../../../../app/utils/artifactSurface'
import {
  findDiagramElement,
  mermaidEdge,
  mermaidNodeId,
  type DiagramElement,
} from './anchors'

/** What a diagram anchor records: an element's, or a spot (`kind: 'spot'`). */
export type DiagramAnchor = SurfaceAnchor & Partial<DiagramElement>

interface Drawn extends DiagramElement {
  element: Element
}

const MAX_LABEL_TEXT = 40
// How far from an arrow's line a point still counts as on it.
const NEAR = 4
const SPOT = 'spot'
const SPOT_LABEL = 'Empty spot'

const squash = (text: string | null | undefined) =>
  (text ?? '').replace(/\s+/g, ' ').trim()
const clip = (text: string, length: number) =>
  text.length > length ? `${text.slice(0, length - 1)}…` : text
const named = (kind: string, text: string, fallback: string) =>
  `${kind} "${clip(text || fallback, MAX_LABEL_TEXT)}"`

/** Every step, group and arrow of the drawing, with its Mermaid ID. */
function elementsOf(svg: SVGSVGElement): Drawn[] {
  const drawn: Drawn[] = []
  const steps = new Map<string, string>()
  for (const element of svg.querySelectorAll('g.node[id]')) {
    const mermaid = mermaidNodeId(element.id, svg.id)
    const text = squash(element.textContent)
    steps.set(mermaid, text || mermaid)
    drawn.push({
      kind: 'step',
      mermaid,
      label: named('Step', text, mermaid),
      element,
    })
  }
  for (const element of svg.querySelectorAll('g.cluster[id]')) {
    const mermaid = mermaidNodeId(element.id, svg.id)
    drawn.push({
      kind: 'group',
      mermaid,
      label: named(
        'Group',
        squash(element.querySelector('.cluster-label')?.textContent),
        mermaid,
      ),
      element,
    })
  }
  const ids = new Set(steps.keys())
  for (const element of svg.querySelectorAll('path[data-id^="L_"]')) {
    const ends = mermaidEdge(element.getAttribute('data-id')!, ids)
    if (!ends) continue
    drawn.push({
      kind: 'arrow',
      mermaid: `${ends.from} --> ${ends.to}${ends.index ? ` (${ends.index + 1})` : ''}`,
      label: `Arrow "${clip(steps.get(ends.from)!, MAX_LABEL_TEXT)}" → "${clip(steps.get(ends.to)!, MAX_LABEL_TEXT)}"`,
      element,
    })
  }
  return drawn
}

export function createDiagramSurface(element: HTMLElement): ArtifactSurface {
  const drawing = () =>
    element.querySelector<SVGSVGElement>('[data-diagram-state] svg[id]')
  const visible = () => boxOf(element.getBoundingClientRect())

  // The drawing's own area (its view box) in the window, where spots are.
  function area(svg: SVGSVGElement): SurfaceBox | null {
    const matrix = svg.getScreenCTM()
    const view = svg.viewBox.baseVal
    if (!matrix || !view?.width || !view.height) return null
    const start = new DOMPoint(view.x, view.y).matrixTransform(matrix)
    const end = new DOMPoint(
      view.x + view.width,
      view.y + view.height,
    ).matrixTransform(matrix)
    return {
      left: start.x,
      top: start.y,
      width: end.x - start.x,
      height: end.y - start.y,
    }
  }

  /** The drawn element under a point, an arrow's within a few pixels. */
  function hit(svg: SVGSVGElement, point: SurfacePoint) {
    const elements = elementsOf(svg)
    const owner = (under: Element | null) => {
      if (!under || !svg.contains(under)) return null
      const edge =
        under.closest('path[data-id^="L_"]') ??
        under.closest('.edgeLabel')?.querySelector('[data-id^="L_"]')
      const id = edge?.getAttribute('data-id')
      const subject =
        (id && svg.querySelector(`path[data-id="${CSS.escape(id)}"]`)) ||
        under.closest('g.node') ||
        under.closest('g.cluster')
      return elements.find(({ element }) => element === subject) ?? null
    }
    const direct = owner(document.elementFromPoint(point.x, point.y))
    if (direct) return direct
    for (let dx = -NEAR; dx <= NEAR; dx += 2)
      for (let dy = -NEAR; dy <= NEAR; dy += 2) {
        const near = owner(
          document.elementFromPoint(point.x + dx, point.y + dy),
        )
        if (near?.kind === 'arrow') return near
      }
    return null
  }

  function targetAt(point: SurfacePoint): SurfaceTarget | null {
    const svg = drawing()
    if (!svg || !inside(point, visible())) return null
    const drawn = hit(svg, point)
    const box = drawn ? boxOf(drawn.element.getBoundingClientRect()) : area(svg)
    if (!box || !inside(point, box)) return null
    const at = {
      x: fraction((point.x - box.left) / (box.width || 1)),
      y: fraction((point.y - box.top) / (box.height || 1)),
    }
    if (!drawn)
      return {
        anchor: { kind: SPOT, label: SPOT_LABEL, at },
        label: SPOT_LABEL,
        box,
      }
    const anchor: DiagramAnchor = {
      kind: drawn.kind,
      label: drawn.label,
      at,
      mermaid: drawn.mermaid,
    }
    return { anchor, label: drawn.label, box }
  }

  // Each anchor's element, while it is in the drawing on screen.
  const found = new Map<string, Element>()
  function find(anchor: DiagramAnchor, svg: SVGSVGElement) {
    const key = `${anchor.kind}\n${anchor.mermaid}\n${anchor.label}`
    const known = found.get(key)
    if (known?.isConnected && svg.contains(known)) return known
    found.delete(key)
    const match =
      findDiagramElement(elementsOf(svg), anchor as DiagramElement)?.element ??
      null
    if (match) found.set(key, match)
    return match
  }

  function boxFor(anchor: SurfaceAnchor) {
    const svg = drawing()
    if (!svg) return null
    if (anchor.kind === SPOT) return area(svg)
    const element = find(anchor as DiagramAnchor, svg)
    const box = element && boxOf(element.getBoundingClientRect())
    return box && (box.width || box.height) ? box : null
  }

  function locate(anchor: SurfaceAnchor): SurfaceLocation {
    const box = boxFor(anchor)
    if (!box) return { state: 'missing' }
    const point = {
      x: box.left + box.width * anchor.at.x,
      y: box.top + box.height * anchor.at.y,
    }
    return inside(point, visible())
      ? { state: 'shown', box, point }
      : { state: 'offscreen', box, point }
  }

  return {
    element,
    targetAt,
    locate,
    // The drawing fits its page, so everything in it is already in view.
    reveal: () => {},
    onChange: sampledChanges(),
    intercept: (input) => interceptElement(element, input),
  }
}
