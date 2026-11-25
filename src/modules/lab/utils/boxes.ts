import type { DialArea, Side } from './classDials'

// What the stage's overlay draws, measured in the stage's own document, in
// its viewport's coordinates: an element's box model when it is selected,
// the space a dial changes when it is hovered (margin outside the element,
// padding inside its edge, gap between its children), or an outline.

export type BoxKind =
  'outline' | 'margin' | 'padding' | 'gap' | 'hover' | 'selected'

export interface Box {
  top: number
  left: number
  width: number
  height: number
  kind: BoxKind
}

const SIDES: Side[] = ['top', 'right', 'bottom', 'left']

function sizes(element: Element, property: (side: Side) => string) {
  const style = element.ownerDocument.defaultView!.getComputedStyle(element)
  const read = (side: Side) =>
    Number.parseFloat(style.getPropertyValue(property(side))) || 0
  return Object.fromEntries(SIDES.map((side) => [side, read(side)])) as Record<
    Side,
    number
  >
}

export function rectBox(rect: DOMRect, kind: BoxKind): Box {
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    kind,
  }
}

// The strips of one side's margin or padding.
function strip(
  rect: DOMRect,
  kind: 'margin' | 'padding',
  side: Side,
  margin: Record<Side, number>,
  padding: Record<Side, number>,
  border: Record<Side, number>,
): Box {
  if (kind === 'margin') {
    const m = margin
    switch (side) {
      case 'top':
        return {
          kind,
          top: rect.top - m.top,
          left: rect.left - m.left,
          width: rect.width + m.left + m.right,
          height: m.top,
        }
      case 'bottom':
        return {
          kind,
          top: rect.bottom,
          left: rect.left - m.left,
          width: rect.width + m.left + m.right,
          height: m.bottom,
        }
      case 'left':
        return {
          kind,
          top: rect.top,
          left: rect.left - m.left,
          width: m.left,
          height: rect.height,
        }
      default:
        return {
          kind,
          top: rect.top,
          left: rect.right,
          width: m.right,
          height: rect.height,
        }
    }
  }
  const p = padding
  const b = border
  const inner = rect.height - b.top - b.bottom - p.top - p.bottom
  switch (side) {
    case 'top':
      return {
        kind,
        top: rect.top + b.top,
        left: rect.left + b.left,
        width: rect.width - b.left - b.right,
        height: p.top,
      }
    case 'bottom':
      return {
        kind,
        top: rect.bottom - b.bottom - p.bottom,
        left: rect.left + b.left,
        width: rect.width - b.left - b.right,
        height: p.bottom,
      }
    case 'left':
      return {
        kind,
        top: rect.top + b.top + p.top,
        left: rect.left + b.left,
        width: p.left,
        height: inner,
      }
    default:
      return {
        kind,
        top: rect.top + b.top + p.top,
        left: rect.right - b.right - p.right,
        width: p.right,
        height: inner,
      }
  }
}

function measures(element: Element) {
  return {
    margin: sizes(element, (side) => `margin-${side}`),
    padding: sizes(element, (side) => `padding-${side}`),
    border: sizes(element, (side) => `border-${side}-width`),
  }
}

/** A selected element: its margin, padding and its own box. */
export function boxModel(element: Element): Box[] {
  const rect = element.getBoundingClientRect()
  const { margin, padding, border } = measures(element)
  const strips = (['margin', 'padding'] as const).flatMap((kind) =>
    SIDES.map((side) => strip(rect, kind, side, margin, padding, border)),
  )
  return [
    ...strips.filter((box) => box.width > 0 && box.height > 0),
    rectBox(rect, 'selected'),
  ]
}

/** The gaps between neighbouring children, on a row or down a column. */
function gaps(element: Element): Box[] {
  const rect = element.getBoundingClientRect()
  const children = [...element.children]
    .map((child) => child.getBoundingClientRect())
    .filter((child) => child.width > 0 || child.height > 0)
  const found: Box[] = []
  for (let index = 1; index < children.length; index++) {
    const a = children[index - 1]!
    const b = children[index]!
    if (b.left >= a.right - 0.5)
      found.push({
        kind: 'gap',
        top: Math.min(a.top, b.top),
        left: a.right,
        width: b.left - a.right,
        height: Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top),
      })
    else if (b.top >= a.bottom - 0.5)
      found.push({
        kind: 'gap',
        top: a.bottom,
        left: rect.left,
        width: rect.width,
        height: b.top - a.bottom,
      })
  }
  return found
}

/**
 * The space a dial changes on an element, then its outline. A space of 0
 * still shows as a thin line, so it is clear where it is.
 */
export function areaBoxes(element: Element, area: DialArea): Box[] {
  const rect = element.getBoundingClientRect()
  const outline = rectBox(rect, 'outline')
  if (area.kind === 'outline') return [outline]
  let strips: Box[]
  if (area.kind === 'gap') strips = gaps(element)
  else {
    const { margin, padding, border } = measures(element)
    strips = area.sides.map((side) =>
      strip(rect, area.kind as 'margin', side, margin, padding, border),
    )
  }
  for (const box of strips) {
    box.width = Math.max(box.width, 2)
    box.height = Math.max(box.height, 2)
  }
  return [...strips, outline]
}

/**
 * How big a hovered space is, in whole pixels: its first strip's depth, the
 * height of a top or bottom one, the width of a side one; a gap's narrow way.
 */
export function spaceSize(boxes: Box[], area: DialArea) {
  const first = boxes.find((box) => box.kind !== 'outline')
  if (!first) return null
  if (area.kind === 'margin' || area.kind === 'padding') {
    const across = area.sides[0] === 'top' || area.sides[0] === 'bottom'
    return Math.round(across ? first.height : first.width)
  }
  return Math.round(Math.min(first.width, first.height))
}

/** `<tag> first classes · W×H`, for a selected element's label. */
export function describeElement(element: Element) {
  const rect = element.getBoundingClientRect()
  const classes = [...element.classList].slice(0, 5).join(' ')
  return `<${element.tagName.toLowerCase()}>${classes ? ` ${classes}` : ''} · ${Math.round(rect.width)}×${Math.round(rect.height)}`
}

/** Child indexes from `root`, so a selection survives a re-render. */
export function pathTo(element: Element, root: Element) {
  const path: number[] = []
  let node = element
  while (node !== root && node.parentElement) {
    path.unshift([...node.parentElement.children].indexOf(node))
    node = node.parentElement
  }
  return node === root ? path : null
}

export function fromPath(root: Element, path: number[]) {
  let node: Element | undefined = root
  for (const index of path) node = node?.children[index]
  return node ?? null
}
