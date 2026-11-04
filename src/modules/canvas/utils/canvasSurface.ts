// A canvas's artifact surface, over the Excalidraw scene through the same
// handle the agent tools use. A target is an element (an item, a sticky
// note, a shape, an arrow, a line, a text, a section…) named by its kind and
// text (`Sticky note "Ask eng…"`) and found again by its Excalidraw ID, or an
// empty spot, a point in scene coordinates that is always there. Positions
// come from the scene and the camera, so pins follow panning, zooming and
// moved elements in the same update that draws them; nothing is sampled.
// Taking the pointer stops every press before Excalidraw hears it, while the
// wheel (pan, and zoom with ⌘/Ctrl or a trackpad pinch) passes through.
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import type {
  ArtifactSurface,
  SurfaceAnchor,
  SurfaceBox,
  SurfaceInput,
  SurfaceLocation,
  SurfacePoint,
  SurfaceTarget,
} from '../../../../app/utils/artifactSurface'
import { NOTE_COLORS } from '../tools/elements'

/* eslint-disable @typescript-eslint/no-explicit-any */
type El = Record<string, any> & { id: string; type: string }

export interface CanvasSurfaceOptions {
  /** The canvas's element in the studio, around Excalidraw. */
  element: HTMLElement
  api: ExcalidrawImperativeAPI
  /** An item's studio address from its link, or null for another link. */
  address: (link: string) => string | null
  /** The title of the artifact an item shows, when it is found. */
  title: (link: string) => string | undefined
  /**
   * Room the canvas's own controls take at its bottom edge (the save
   * status, Excalidraw's footer), which tools keep clear of.
   */
  bottomInset: number
}

const SPOT = 'spot'
const SPOT_LABEL = 'Empty spot'
const MAX_LABEL_TEXT = 40
// How near a line or a shape's edge, in window pixels, still counts as on it.
const NEAR = 6
const INTERCEPTING = 'data-canvas-intercepting'

const squash = (text: unknown) =>
  typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : ''
const clip = (text: string) =>
  text.length > MAX_LABEL_TEXT ? `${text.slice(0, MAX_LABEL_TEXT - 1)}…` : text
const named = (name: string, text: string) =>
  text ? `${name} "${clip(text)}"` : name
const round = (value: number) => Math.round(value * 100) / 100
const fraction = (value: number) =>
  Math.round(Math.min(1, Math.max(0, value)) * 10_000) / 10_000
const inside = (point: SurfacePoint, box: SurfaceBox) =>
  point.x >= box.left &&
  point.y >= box.top &&
  point.x <= box.left + box.width &&
  point.y <= box.top + box.height
const boxOf = (rect: DOMRect): SurfaceBox => ({
  left: rect.left,
  top: rect.top,
  width: rect.width,
  height: rect.height,
})

const isNote = (el: El) =>
  el.type === 'rectangle' &&
  Object.values(NOTE_COLORS).some(
    ({ fill, edge }) => fill === el.backgroundColor && edge === el.strokeColor,
  )
const isLinear = (el: El) =>
  Array.isArray(el.points) &&
  (el.type === 'arrow' || el.type === 'line' || el.type === 'freedraw')
const isSection = (el: El) => el.type === 'frame' || el.type === 'magicframe'

/** An element's own box in the scene, before its rotation. */
function localBox(el: El) {
  if (isLinear(el) && el.points.length) {
    const xs = (el.points as number[][]).map(([x]) => el.x + x!)
    const ys = (el.points as number[][]).map(([, y]) => el.y + y!)
    const x = Math.min(...xs)
    const y = Math.min(...ys)
    return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y }
  }
  return { x: el.x, y: el.y, width: el.width, height: el.height }
}

/** Turns a scene point around a centre by an angle in radians. */
function turn(point: SurfacePoint, centre: SurfacePoint, angle: number) {
  if (!angle) return point
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dx = point.x - centre.x
  const dy = point.y - centre.y
  return {
    x: centre.x + dx * cos - dy * sin,
    y: centre.y + dx * sin + dy * cos,
  }
}

function distanceToSegment(p: SurfacePoint, a: SurfacePoint, b: SurfacePoint) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const length = dx * dx + dy * dy
  const t = length
    ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length))
    : 0
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

export function createCanvasSurface(
  options: CanvasSurfaceOptions,
): ArtifactSurface {
  const { element, api } = options

  const visible = () => boxOf(element.getBoundingClientRect())
  // Excalidraw's own area, which its camera is relative to.
  const frame = () =>
    (element.querySelector('.excalidraw') ?? element).getBoundingClientRect()
  function camera() {
    const state = api.getAppState()
    const rect = frame()
    return {
      zoom: state.zoom.value || 1,
      scrollX: state.scrollX,
      scrollY: state.scrollY,
      left: rect.left,
      top: rect.top,
    }
  }
  type Camera = ReturnType<typeof camera>
  const toWindow = (point: SurfacePoint, at: Camera) => ({
    x: at.left + (point.x + at.scrollX) * at.zoom,
    y: at.top + (point.y + at.scrollY) * at.zoom,
  })
  const toScene = (point: SurfacePoint, at: Camera) => ({
    x: (point.x - at.left) / at.zoom - at.scrollX,
    y: (point.y - at.top) / at.zoom - at.scrollY,
  })

  const live = () => api.getSceneElements() as unknown as El[]
  const textOf = (el: El, scene: El[]) => {
    if (el.type === 'text') return squash(el.originalText ?? el.text)
    if (isSection(el)) return squash(el.name)
    const bound = scene.find(
      (other) => other.type === 'text' && other.containerId === el.id,
    )
    return bound ? squash(bound.originalText ?? bound.text) : ''
  }

  /** What the comment calls an element, and what it records about it. */
  function describe(el: El, scene: El[]) {
    const text = textOf(el, scene)
    if (el.type === 'embeddable') {
      const link = typeof el.link === 'string' ? el.link : ''
      const item = link ? options.address(link) : null
      if (item) {
        const title = options.title(link) ?? ''
        return {
          kind: 'item',
          label: named('Item', title || item),
          text: title,
          item,
        }
      }
      return { kind: 'embed', label: 'Embed', text: link }
    }
    if (isNote(el))
      return { kind: 'note', label: named('Sticky note', text), text }
    const shapes: Record<string, string> = {
      rectangle: 'Rectangle',
      ellipse: 'Ellipse',
      diamond: 'Diamond',
    }
    if (shapes[el.type])
      return { kind: 'shape', label: named(shapes[el.type]!, text), text }
    if (el.type === 'arrow')
      return { kind: 'arrow', label: named('Arrow', text), text }
    if (el.type === 'line')
      return { kind: 'line', label: named('Line', text), text }
    if (el.type === 'text')
      return { kind: 'text', label: named('Text', text), text }
    if (isSection(el))
      return { kind: 'section', label: named('Section', text), text }
    if (el.type === 'freedraw')
      return { kind: 'drawing', label: 'Drawing', text }
    if (el.type === 'image') return { kind: 'image', label: 'Image', text }
    return { kind: el.type, label: named('Element', text), text }
  }

  /** Whether a scene point is on an element, within `near` scene units. */
  function hits(el: El, point: SurfacePoint, near: number) {
    const box = localBox(el)
    const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    const local = turn(point, centre, -(el.angle ?? 0))
    if (isLinear(el)) {
      const points = (el.points as number[][]).map(([x, y]) => ({
        x: el.x + x!,
        y: el.y + y!,
      }))
      const reach = near + (el.strokeWidth ?? 1) / 2
      if (points.length === 1)
        return (
          Math.hypot(local.x - points[0]!.x, local.y - points[0]!.y) <= reach
        )
      return points
        .slice(1)
        .some(
          (end, index) =>
            distanceToSegment(local, points[index]!, end) <= reach,
        )
    }
    return (
      local.x >= box.x - near &&
      local.y >= box.y - near &&
      local.x <= box.x + box.width + near &&
      local.y <= box.y + box.height + near
    )
  }

  /** The topmost element at a scene point; a section only when nothing else is. */
  function elementAt(point: SurfacePoint, near: number) {
    const scene = live()
    const byId = new Map(scene.map((el) => [el.id, el]))
    // Text written on a shape or an arrow is part of it.
    const owner = (el: El) => (el.containerId && byId.get(el.containerId)) || el
    for (const sections of [false, true])
      for (let index = scene.length - 1; index >= 0; index--) {
        const el = scene[index]!
        if (isSection(el) !== sections) continue
        if (hits(el, point, near)) return { el: owner(el), scene }
      }
    return null
  }

  /** Where `at` on an element is in the scene, and its box in the window. */
  function place(el: El, at: SurfacePoint, view: Camera) {
    const box = localBox(el)
    const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    const angle = el.angle ?? 0
    const corners = [
      { x: box.x, y: box.y },
      { x: box.x + box.width, y: box.y },
      { x: box.x, y: box.y + box.height },
      { x: box.x + box.width, y: box.y + box.height },
    ].map((corner) => toWindow(turn(corner, centre, angle), view))
    const xs = corners.map(({ x }) => x)
    const ys = corners.map(({ y }) => y)
    const left = Math.min(...xs)
    const top = Math.min(...ys)
    return {
      box: {
        left,
        top,
        width: Math.max(...xs) - left,
        height: Math.max(...ys) - top,
      },
      point: toWindow(
        turn(
          { x: box.x + box.width * at.x, y: box.y + box.height * at.y },
          centre,
          angle,
        ),
        view,
      ),
    }
  }

  function targetAt(point: SurfacePoint): SurfaceTarget | null {
    if (!inside(point, visible())) return null
    const view = camera()
    const scenePoint = toScene(point, view)
    const found = elementAt(scenePoint, NEAR / view.zoom)
    if (!found) {
      const anchor: SurfaceAnchor = {
        kind: SPOT,
        label: SPOT_LABEL,
        at: { x: 0, y: 0 },
        point: { x: round(scenePoint.x), y: round(scenePoint.y) },
      }
      return {
        anchor,
        label: SPOT_LABEL,
        box: { left: point.x, top: point.y, width: 0, height: 0 },
      }
    }
    const { el, scene } = found
    const box = localBox(el)
    const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    const local = turn(scenePoint, centre, -(el.angle ?? 0))
    const at = {
      x: fraction((local.x - box.x) / (box.width || 1)),
      y: fraction((local.y - box.y) / (box.height || 1)),
    }
    const described = describe(el, scene)
    const anchor: SurfaceAnchor = {
      kind: described.kind,
      label: described.label,
      at,
      element: el.id,
      ...(described.text ? { text: described.text } : {}),
      ...('item' in described ? { item: described.item } : {}),
    }
    return { anchor, label: described.label, box: place(el, at, view).box }
  }

  function locate(anchor: SurfaceAnchor): SurfaceLocation {
    const view = camera()
    let found: { box: SurfaceBox; point: SurfacePoint }
    if (anchor.kind === SPOT) {
      const at = anchor.point as SurfacePoint | undefined
      if (!at || !Number.isFinite(at.x) || !Number.isFinite(at.y))
        return { state: 'missing' }
      const point = toWindow(at, view)
      found = {
        point,
        box: { left: point.x, top: point.y, width: 0, height: 0 },
      }
    } else {
      const el = live().find(({ id }) => id === anchor.element)
      if (!el) return { state: 'missing' }
      found = place(el, anchor.at, view)
    }
    return inside(found.point, visible())
      ? { state: 'shown', ...found }
      : { state: 'offscreen', ...found }
  }

  function reveal(anchor: SurfaceAnchor) {
    if (anchor.kind === SPOT) {
      const at = anchor.point as SurfacePoint | undefined
      if (!at) return
      const state = api.getAppState()
      const zoom = state.zoom.value || 1
      api.updateScene({
        appState: {
          scrollX: state.width / (2 * zoom) - at.x,
          scrollY: state.height / (2 * zoom) - at.y,
        },
      })
      return
    }
    const el = api.getSceneElements().find(({ id }) => id === anchor.element)
    if (el) api.scrollToContent(el, { animate: true })
  }

  // Excalidraw says when its scene or its camera changed, in the update
  // that draws it; listeners hear it once, after that update.
  const listeners = new Set<() => void>()
  let stopScene: (() => void) | undefined
  let queued = false
  const notify = () => {
    if (queued) return
    queued = true
    queueMicrotask(() => {
      queued = false
      for (const listener of [...listeners]) listener()
    })
  }
  function onChange(listener: () => void) {
    listeners.add(listener)
    if (!stopScene) {
      const stops = [api.onChange(notify), api.onScrollChange(notify)]
      window.addEventListener('resize', notify)
      stopScene = () => {
        for (const stop of stops) stop()
        window.removeEventListener('resize', notify)
      }
    }
    return () => {
      listeners.delete(listener)
      if (!listeners.size) {
        stopScene?.()
        stopScene = undefined
      }
    }
  }

  function intercept(input: SurfaceInput) {
    const point = (event: MouseEvent): SurfacePoint => ({
      x: event.clientX,
      y: event.clientY,
    })
    // Excalidraw is rendered inside the canvas element, so a capture
    // listener there hears every press first and keeps it from Excalidraw
    // and the items drawn on it. The wheel is left alone: it pans and zooms.
    const stop = (event: Event) => {
      event.preventDefault()
      event.stopImmediatePropagation()
    }
    const click = (event: MouseEvent) => {
      stop(event)
      if (event.button === 0) input.press(point(event))
    }
    const move = (event: PointerEvent) => {
      event.stopImmediatePropagation()
      input.move(point(event))
    }
    const leave = () => input.leave()
    // Esc while Excalidraw has focus is the tool's, before Excalidraw's own.
    const key = (event: KeyboardEvent) => {
      if (
        event.key !== 'Escape' ||
        !(event.target instanceof Node) ||
        !element.contains(event.target)
      )
        return
      event.stopImmediatePropagation()
      event.preventDefault()
      input.key(event)
    }
    const handlers: [string, EventListener][] = [
      ['pointerdown', stop],
      ['mousedown', stop],
      ['touchstart', stop],
      ['pointerup', stop],
      ['mouseup', stop],
      ['touchend', stop],
      ['click', click as EventListener],
      ['dblclick', stop],
      ['auxclick', stop],
      ['contextmenu', stop],
      ['dragstart', stop],
      ['pointermove', move as EventListener],
      ['pointerleave', leave],
    ]
    for (const [type, handler] of handlers)
      element.addEventListener(type, handler, true)
    window.addEventListener('keydown', key, true)
    element.setAttribute(INTERCEPTING, '')
    const style = document.createElement('style')
    style.textContent = `[${INTERCEPTING}], [${INTERCEPTING}] * { cursor: crosshair !important; } [${INTERCEPTING}] iframe { pointer-events: none !important; }`
    document.head.append(style)
    return () => {
      for (const [type, handler] of handlers)
        element.removeEventListener(type, handler, true)
      window.removeEventListener('keydown', key, true)
      element.removeAttribute(INTERCEPTING)
      style.remove()
    }
  }

  return {
    element,
    targetAt,
    locate,
    reveal,
    onChange,
    intercept,
    bottomInset: options.bottomInset,
  }
}
