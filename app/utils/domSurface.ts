// Shared pieces for artifact surfaces whose content is in the studio's own
// document (a document's reader, a diagram's drawing), as opposed to a
// view's preview document. Changes are sampled each animation frame while
// someone listens, so scrolling, resizing and re-renders need no listener;
// taking the pointer adds capture listeners on the page's element and one
// style, both removed when it ends.
import type { SurfaceInput, SurfacePoint } from './artifactSurface'

/** `onChange` for a surface: sampled once a frame while anyone listens. */
export function sampledChanges() {
  const listeners = new Set<() => void>()
  let sampling = 0
  const sample = () => {
    sampling = listeners.size ? requestAnimationFrame(sample) : 0
    for (const listener of listeners) listener()
  }
  return function onChange(listener: () => void) {
    listeners.add(listener)
    if (!sampling) sampling = requestAnimationFrame(sample)
    return () => {
      listeners.delete(listener)
      if (!listeners.size && sampling) {
        cancelAnimationFrame(sampling)
        sampling = 0
      }
    }
  }
}

const INTERCEPTING = 'data-surface-intercepting'
// What a press on would act on, or take focus.
const FOCUSABLE =
  'a[href], button, input, select, textarea, summary, label, [tabindex], [contenteditable=""], [contenteditable="true"]'

const squash = (text: string) => text.replace(/\s+/g, ' ').trim()

/**
 * Takes the pointer over `element` for a tool: no press, click or link
 * reaches the page. A press on text still selects it, and finishing a
 * selection is a press for the tool (on `mouseup`; the click after it is
 * only swallowed). Embedded frames stop taking the pointer meanwhile, so a
 * press on one is a press on the page. Esc needs nothing here: the page is
 * in the studio's own document, where the tool hears it.
 */
export function interceptElement(element: HTMLElement, input: SurfaceInput) {
  const point = (event: MouseEvent): SurfacePoint => ({
    x: event.clientX,
    y: event.clientY,
  })
  const swallow = (event: Event) => {
    event.preventDefault()
    event.stopImmediatePropagation()
  }
  const selectedText = () => {
    const chosen = window.getSelection()
    if (!chosen || chosen.isCollapsed || !chosen.rangeCount) return false
    const range = chosen.getRangeAt(0)
    return (
      element.contains(range.commonAncestorContainer) &&
      Boolean(squash(chosen.toString()))
    )
  }
  let selected = false
  const down = (event: MouseEvent) => {
    event.stopImmediatePropagation()
    selected = false
    // Links and controls in the page keep their focus and their own press.
    const focusable = (event.target as Element | null)?.closest?.(FOCUSABLE)
    if (focusable && element.contains(focusable)) {
      event.preventDefault()
      window.getSelection()?.removeAllRanges()
    }
  }
  const up = (event: MouseEvent) => {
    event.stopImmediatePropagation()
    if (event.button !== 0 || !selectedText()) return
    selected = true
    input.press(point(event))
  }
  const click = (event: MouseEvent) => {
    swallow(event)
    if (event.button === 0 && !selected) input.press(point(event))
    selected = false
  }
  const stop = (event: Event) => event.stopImmediatePropagation()
  const move = (event: PointerEvent) => input.move(point(event))
  const leave = () => input.leave()
  const handlers: [string, EventListener][] = [
    ['pointerdown', stop],
    ['mousedown', down as EventListener],
    ['pointerup', stop],
    ['mouseup', up as EventListener],
    ['click', click as EventListener],
    ['dblclick', swallow],
    ['auxclick', swallow],
    ['submit', swallow],
    ['pointermove', move as EventListener],
    ['pointerleave', leave],
  ]
  for (const [type, handler] of handlers)
    element.addEventListener(type, handler, true)
  element.setAttribute(INTERCEPTING, '')
  const style = document.createElement('style')
  style.textContent = `[${INTERCEPTING}], [${INTERCEPTING}] * { cursor: crosshair !important; } [${INTERCEPTING}] iframe { pointer-events: none !important; }`
  document.head.append(style)
  return () => {
    for (const [type, handler] of handlers)
      element.removeEventListener(type, handler, true)
    element.removeAttribute(INTERCEPTING)
    style.remove()
  }
}

/** Whether `point` is inside `box`. */
export const inside = (
  point: SurfacePoint,
  box: { left: number; top: number; width: number; height: number },
) =>
  point.x >= box.left &&
  point.y >= box.top &&
  point.x <= box.left + box.width &&
  point.y <= box.top + box.height

const round = (value: number) => Math.round(value * 10_000) / 10_000
/** A fraction kept between 0 and 1, rounded to four places. */
export const fraction = (value: number) =>
  round(Math.min(1, Math.max(0, value)))

/** A plain box from a `DOMRect`. */
export const boxOf = (rect: DOMRect) => ({
  left: rect.left,
  top: rect.top,
  width: rect.width,
  height: rect.height,
})
