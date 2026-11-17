// Runs inside a Breakdown's preview document: the highlight of a hovered
// knob, drawn over the theme slot it changes in the knob's colour. Corners
// get an outline that follows the slot's radius; padding and the space
// between items are hatched where they are; anything else (sizes, weights,
// colours) gets a tinted outline. Found from the page itself
// (`data-lab-node`, `data-slot`), and drawn again whenever the pieces move,
// so a knob scrubbed while hovered keeps its highlight on the new shape.
import { pieceOf, slotOf, type KnobHighlight } from '../protocol.ts'
import { ownsSlot } from './pieces.ts'

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

// The elements a target names: a piece's own, or one theme slot of it.
function targetElements(target: string): Element[] {
  const node = pieceOf(target)
  const slot = slotOf(target)
  const own = [
    ...document.querySelectorAll(`[data-lab-node~="${CSS.escape(node)}"]`),
  ]
  if (slot === undefined) return own
  return own.flatMap((element) =>
    [element, ...element.querySelectorAll(`[data-slot="${CSS.escape(slot)}"]`)]
      .filter((part) => part.getAttribute('data-slot') === slot)
      // A slot of a piece inside this one belongs to that piece.
      .filter((part) => ownsSlot(part, node)),
  )
}

const page = (rect: DOMRect): Rect => ({
  x: rect.x + window.scrollX,
  y: rect.y + window.scrollY,
  width: rect.width,
  height: rect.height,
})

// What sits inside an element, text included, in document order.
function contents(element: Element): Rect[] {
  const found: Rect[] = []
  for (const child of element.childNodes) {
    let rect: DOMRect | null = null
    if (child instanceof Element) rect = child.getBoundingClientRect()
    else if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
      const range = document.createRange()
      range.selectNodeContents(child)
      rect = range.getBoundingClientRect()
    }
    if (rect && (rect.width > 0 || rect.height > 0)) found.push(page(rect))
  }
  return found
}

function areas(element: Element, area: KnobHighlight['area']): Rect[] {
  const box = page(element.getBoundingClientRect())
  const style = getComputedStyle(element)
  const px = (value: string) => Number.parseFloat(value) || 0
  const border = {
    top: px(style.borderTopWidth),
    right: px(style.borderRightWidth),
    bottom: px(style.borderBottomWidth),
    left: px(style.borderLeftWidth),
  }
  const inner = {
    x: box.x + border.left,
    y: box.y + border.top,
    width: box.width - border.left - border.right,
    height: box.height - border.top - border.bottom,
  }
  const pad = {
    top: px(style.paddingTop),
    right: px(style.paddingRight),
    bottom: px(style.paddingBottom),
    left: px(style.paddingLeft),
  }
  if (area === 'padding' || area === 'paddingX' || area === 'paddingY') {
    const sides: Rect[] = []
    if (area !== 'paddingX') {
      sides.push({ ...inner, height: pad.top })
      sides.push({
        ...inner,
        y: inner.y + inner.height - pad.bottom,
        height: pad.bottom,
      })
    }
    if (area !== 'paddingY') {
      sides.push({ ...inner, width: pad.left })
      sides.push({
        ...inner,
        x: inner.x + inner.width - pad.right,
        width: pad.right,
      })
    }
    return sides.filter(({ width, height }) => width > 0 && height > 0)
  }
  if (area === 'gap') {
    const inside = contents(element)
    const gaps: Rect[] = []
    for (let index = 1; index < inside.length; index++) {
      const before = inside[index - 1]!
      const after = inside[index]!
      const top = Math.min(before.y, after.y)
      const bottom = Math.max(before.y + before.height, after.y + after.height)
      if (after.x >= before.x + before.width - 0.5)
        gaps.push({
          x: before.x + before.width,
          y: top,
          width: after.x - before.x - before.width,
          height: bottom - top,
        })
      else if (after.y >= before.y + before.height - 0.5) {
        const left = Math.min(before.x, after.x)
        const right = Math.max(before.x + before.width, after.x + after.width)
        gaps.push({
          x: left,
          y: before.y + before.height,
          width: right - left,
          height: after.y - before.y - before.height,
        })
      }
    }
    return gaps.filter(({ width, height }) => width > 0.5 && height > 0.5)
  }
  return [box]
}

const place = ({ x, y, width, height }: Rect) =>
  `left: ${x}px; top: ${y}px; width: ${width}px; height: ${height}px;`

/** The knob highlight's layer, over everything in the document. */
export function createKnobLayer() {
  const layer = document.createElement('div')
  layer.dataset.labKnobOverlay = ''
  layer.setAttribute('aria-hidden', 'true')
  layer.style.cssText =
    'position: absolute; inset: 0 auto auto 0; width: 0; height: 0; pointer-events: none; z-index: 2147483647;'
  document.documentElement.append(layer)
  let shown: KnobHighlight | null = null

  function redraw() {
    if (!shown) return void layer.replaceChildren()
    const { target, area, color } = shown
    const drawn: HTMLElement[] = []
    for (const element of targetElements(target)) {
      const radius = getComputedStyle(element).borderRadius
      for (const rect of areas(element, area)) {
        const mark = document.createElement('div')
        mark.dataset.labKnobArea = area
        const look =
          area === 'corners'
            ? `outline: 2px solid ${color}; outline-offset: 2px; border-radius: ${radius};`
            : area === 'box'
              ? `outline: 2px solid ${color}; outline-offset: 1px; background: ${color}1f;`
              : `background: repeating-linear-gradient(-45deg, ${color} 0 1.5px, ${color}26 1.5px 5px);`
        mark.style.cssText = `position: absolute; box-sizing: border-box; ${place(rect)} ${look}`
        drawn.push(mark)
      }
    }
    layer.replaceChildren(...drawn)
  }

  return {
    show(next: KnobHighlight | null) {
      shown = next
      redraw()
    },
    redraw,
    dispose: () => layer.remove(),
  }
}
