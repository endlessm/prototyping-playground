// A view's artifact surface. The preview document is same-origin, so the
// studio reads its DOM from outside: what is under a point, where an element
// is now, and how to find it again after a hot update. Tools draw in the
// studio's own overlay, never in the document. Only while a tool takes the
// pointer (`intercept`, comment mode) does the document get anything: capture
// listeners on its window and one style for the cursor, all removed after.
// Positions are sampled each animation frame while someone listens, so the
// document needs no listener for its scrolling (see the comments module's
// README, "Hard parts").
import type {
  ArtifactSurface,
  SurfaceAnchor,
  SurfaceBox,
  SurfaceInput,
  SurfaceLocation,
  SurfacePoint,
  SurfaceTarget,
} from '../../../../../app/utils/artifactSurface'

/** What a view element's anchor records, beside every anchor's fields. */
export interface ViewAnchor extends SurfaceAnchor {
  kind: string
  /** A CSS selector: an identifying attribute, an id, or a short path. */
  selector: string
  /** The element's tag, for finding it again by kind and text. */
  tag: string
  /** A readable path, such as `main > .card > button`. */
  path: string
  /** The element's own text, trimmed. */
  text: string
  /** Its box in the document when it was commented, and the viewport width. */
  box: SurfaceBox & { viewport: number }
}

const IDENTIFYING = [
  'data-testid',
  'data-test',
  'data-qa',
  'data-cy',
  'data-component',
]
// What a press on something inside is really about.
const INTERACTIVE =
  'button, a[href], input, select, textarea, summary, label, [role="button"], [role="link"], [role="checkbox"], [role="tab"], [role="menuitem"], [role="switch"]'
const FOCUSABLE = `${INTERACTIVE}, [tabindex], [contenteditable=""], [contenteditable="true"]`
const MAX_TEXT = 120
const MAX_LABEL_TEXT = 40
const CURSOR_STYLE = 'data-studio-tool-cursor'

const KINDS: Record<string, string> = {
  a: 'Link',
  button: 'Button',
  h1: 'Heading',
  h2: 'Heading',
  h3: 'Heading',
  h4: 'Heading',
  h5: 'Heading',
  h6: 'Heading',
  p: 'Paragraph',
  li: 'List item',
  ul: 'List',
  ol: 'List',
  img: 'Image',
  svg: 'Image',
  textarea: 'Text field',
  select: 'Select',
  label: 'Label',
  table: 'Table',
  tr: 'Table row',
  td: 'Table cell',
  th: 'Table cell',
  nav: 'Navigation',
  header: 'Header',
  footer: 'Footer',
  main: 'Main',
  section: 'Section',
  form: 'Form',
  dialog: 'Dialog',
}
const ROLES: Record<string, string> = {
  button: 'Button',
  link: 'Link',
  checkbox: 'Checkbox',
  tab: 'Tab',
  menuitem: 'Menu item',
  switch: 'Switch',
  dialog: 'Dialog',
  heading: 'Heading',
}

const squash = (text: string | null | undefined) =>
  (text ?? '').replace(/\s+/g, ' ').trim()
const clip = (text: string, length: number) =>
  text.length > length ? `${text.slice(0, length - 1)}…` : text

function kindOf(element: Element) {
  const role = element.getAttribute('role')
  if (role && ROLES[role]) return ROLES[role]
  const tag = element.tagName.toLowerCase()
  if (tag === 'input') {
    const type = (element.getAttribute('type') ?? 'text').toLowerCase()
    if (type === 'checkbox') return 'Checkbox'
    if (type === 'radio') return 'Radio button'
    if (['button', 'submit', 'reset'].includes(type)) return 'Button'
    return 'Text field'
  }
  return KINDS[tag] ?? 'Element'
}

/** The element's own words: its text, or what names it. */
function textOf(element: Element) {
  const own = squash(element.textContent)
  if (own) return clip(own, MAX_TEXT)
  for (const name of ['aria-label', 'alt', 'placeholder', 'title', 'value'])
    if (element.getAttribute(name))
      return clip(squash(element.getAttribute(name)), MAX_TEXT)
  return ''
}

function labelOf(element: Element) {
  const kind = kindOf(element)
  const name =
    squash(element.getAttribute('aria-label')) ||
    squash(element.textContent) ||
    squash(element.getAttribute('alt')) ||
    squash(element.getAttribute('placeholder')) ||
    squash(element.getAttribute('title'))
  if (name) return `${kind} "${clip(name, MAX_LABEL_TEXT)}"`
  if (kind !== 'Element') return kind
  const tag = element.tagName.toLowerCase()
  const first = element.classList[0]
  return `Element <${tag}${first ? `.${first}` : ''}>`
}

function segment(element: Element, nth: boolean) {
  const tag = element.tagName.toLowerCase()
  const classes = [...element.classList]
    // Skip generated and utility classes that carry punctuation.
    .filter((name) => /^[a-zA-Z][\w-]*$/.test(name))
    .slice(0, 2)
    .map((name) => `.${CSS.escape(name)}`)
    .join('')
  let index = ''
  if (nth && element.parentElement) {
    const same = [...element.parentElement.children].filter(
      (child) => child.tagName === element.tagName,
    )
    if (same.length > 1) index = `:nth-of-type(${same.indexOf(element) + 1})`
  }
  return `${CSS.escape(tag)}${classes}${index}`
}

function ownSelector(element: Element, document: Document) {
  for (const name of IDENTIFYING) {
    const value = element.getAttribute(name)
    if (!value) continue
    const selector = `[${name}="${CSS.escape(value)}"]`
    if (document.querySelectorAll(selector).length === 1) return selector
  }
  if (element.id) {
    const selector = `#${CSS.escape(element.id)}`
    if (document.querySelectorAll(selector).length === 1) return selector
  }
  return null
}

/** Identifying attributes first, then an id, then a short tag-and-class path. */
export function selectorOf(element: Element, document: Document) {
  const own = ownSelector(element, document)
  if (own) return own
  const parts: string[] = []
  for (
    let current: Element | null = element;
    current &&
    current !== document.body &&
    current !== document.documentElement;
    current = current.parentElement
  ) {
    const own = current === element ? null : ownSelector(current, document)
    parts.unshift(own ?? segment(current, true))
    const selector = parts.join(' > ')
    if (document.querySelector(selector) === element) return selector
    if (own) break
  }
  return parts.join(' > ')
}

/** A readable path of up to five steps, such as `main > .card > button`. */
function pathOf(element: Element, document: Document) {
  const steps: string[] = []
  for (
    let current: Element | null = element;
    current &&
    current !== document.body &&
    current !== document.documentElement &&
    steps.length < 5;
    current = current.parentElement
  ) {
    const tag = current.tagName.toLowerCase()
    steps.unshift(
      current.id
        ? `${tag}#${current.id}`
        : current.classList[0]
          ? `.${current.classList[0]}`
          : tag,
    )
  }
  return steps.join(' > ')
}

/** The element a point is about: an interactive ancestor, or a drawing whole. */
function subjectOf(element: Element | null, document: Document) {
  if (!element || element === document.documentElement) return null
  if (element === document.body) return null
  const drawing = element.closest('svg')
  let outer = drawing
  while (outer?.parentElement?.closest('svg'))
    outer = outer.parentElement.closest('svg')
  return element.closest(INTERACTIVE) ?? outer ?? element
}

const inside = (point: SurfacePoint, box: SurfaceBox) =>
  point.x >= box.left &&
  point.y >= box.top &&
  point.x <= box.left + box.width &&
  point.y <= box.top + box.height

const round = (value: number) => Math.round(value * 10_000) / 10_000
const fraction = (value: number) => round(Math.min(1, Math.max(0, value)))

export function createViewSurface(
  element: HTMLElement,
  frame: HTMLIFrameElement,
): ArtifactSurface {
  const view = () => {
    try {
      const document = frame.contentDocument
      const window = frame.contentWindow
      return document?.body && window ? { document, window } : null
    } catch {
      return null
    }
  }
  // Where the document's own coordinates start in the studio's window.
  const origin = () => {
    const box = frame.getBoundingClientRect()
    return {
      left: box.left + frame.clientLeft,
      top: box.top + frame.clientTop,
      width: frame.clientWidth,
      height: frame.clientHeight,
    }
  }
  const outward = (box: DOMRect | SurfaceBox): SurfaceBox => {
    const start = origin()
    return {
      left: box.left + start.left,
      top: box.top + start.top,
      width: box.width,
      height: box.height,
    }
  }

  // Each anchor's element, until it leaves the document.
  const found = new Map<string, Element>()
  function find(anchor: ViewAnchor): Element | null {
    const current = view()
    if (!current) return null
    const key = `${anchor.selector}\n${anchor.tag}\n${anchor.text}`
    const known = found.get(key)
    if (known?.isConnected && known.ownerDocument === current.document)
      return known
    found.delete(key)
    let match: Element | null = null
    try {
      match = current.document.querySelector(anchor.selector)
    } catch {
      // A selector this document can't parse.
    }
    // A path is only a position: an element now there with other words is
    // something else, such as the next button after this one was removed.
    // An identifying attribute or an id is trusted whatever the text.
    if (
      match &&
      !/^[[#][^>]*$/.test(anchor.selector) &&
      anchor.text &&
      textOf(match) !== anchor.text
    )
      match = null
    // Without words there is nothing to tell one such element from another.
    if (!match && anchor.tag && anchor.text)
      match =
        [...current.document.getElementsByTagName(anchor.tag)].find(
          (candidate) => textOf(candidate) === anchor.text,
        ) ?? null
    if (match) found.set(key, match)
    return match
  }

  function targetAt(point: SurfacePoint): SurfaceTarget | null {
    const current = view()
    const start = origin()
    if (!current || !inside(point, start)) return null
    const subject = subjectOf(
      current.document.elementFromPoint(
        point.x - start.left,
        point.y - start.top,
      ),
      current.document,
    )
    if (!subject) return null
    const rect = subject.getBoundingClientRect()
    const box = outward(rect)
    const label = labelOf(subject)
    const anchor: ViewAnchor = {
      kind: kindOf(subject).toLowerCase(),
      label,
      at: {
        x: fraction((point.x - box.left) / (box.width || 1)),
        y: fraction((point.y - box.top) / (box.height || 1)),
      },
      selector: selectorOf(subject, current.document),
      tag: subject.tagName.toLowerCase(),
      path: pathOf(subject, current.document),
      text: textOf(subject),
      box: {
        left: Math.round(rect.left + current.window.scrollX),
        top: Math.round(rect.top + current.window.scrollY),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        viewport: current.window.innerWidth,
      },
    }
    return { anchor, label, box }
  }

  function locate(anchor: SurfaceAnchor): SurfaceLocation {
    const target = find(anchor as ViewAnchor)
    if (!target || !target.getClientRects().length) return { state: 'missing' }
    const box = outward(target.getBoundingClientRect())
    const point = {
      x: box.left + box.width * anchor.at.x,
      y: box.top + box.height * anchor.at.y,
    }
    return inside(point, origin())
      ? { state: 'shown', box, point }
      : { state: 'offscreen', box, point }
  }

  function reveal(anchor: SurfaceAnchor) {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    find(anchor as ViewAnchor)?.scrollIntoView({
      block: 'center',
      inline: 'center',
      behavior: reduced ? 'auto' : 'smooth',
    })
  }

  // Sampled, not listened for: the document's scrolling, its re-renders and
  // the frame's size all show in the next frame's measurements.
  const listeners = new Set<() => void>()
  let sampling = 0
  const sample = () => {
    sampling = listeners.size ? requestAnimationFrame(sample) : 0
    for (const listener of listeners) listener()
  }
  function onChange(listener: () => void) {
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

  function intercept(input: SurfaceInput) {
    let detach = () => {}
    const attach = () => {
      detach()
      const current = view()
      if (!current) return
      const { document, window } = current
      const point = (event: MouseEvent) => {
        const start = origin()
        return { x: event.clientX + start.left, y: event.clientY + start.top }
      }
      // Nothing the person presses reaches the view: no button action, no
      // navigation, no menu opening on pointerdown. A press keeps focus where
      // it is; on plain text, with nothing focused, the press goes on so
      // text can still be selected.
      const swallow = (event: Event) => {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
      const down = (event: MouseEvent) => {
        event.stopImmediatePropagation()
        const target = event.target as Element | null
        const focused =
          document.activeElement && document.activeElement !== document.body
        if (focused || target?.closest?.(FOCUSABLE)) event.preventDefault()
      }
      const pointerdown = (event: PointerEvent) =>
        event.stopImmediatePropagation()
      const click = (event: MouseEvent) => {
        swallow(event)
        if (event.button === 0) input.press(point(event))
      }
      const move = (event: PointerEvent) => input.move(point(event))
      const out = (event: MouseEvent) => {
        if (!event.relatedTarget) input.leave()
      }
      const key = (event: KeyboardEvent) => {
        if (event.key !== 'Escape') return
        swallow(event)
        input.key(event)
      }
      const handlers: [string, EventListener][] = [
        ['pointerdown', pointerdown as EventListener],
        ['mousedown', down as EventListener],
        [
          'pointerup',
          ((event: Event) => event.stopImmediatePropagation()) as EventListener,
        ],
        ['mouseup', swallow],
        ['click', click as EventListener],
        ['dblclick', swallow],
        ['auxclick', swallow],
        ['submit', swallow],
        ['pointermove', move as EventListener],
        ['mouseout', out as EventListener],
        ['keydown', key as EventListener],
      ]
      for (const [type, handler] of handlers)
        window.addEventListener(type, handler, true)
      const style = document.createElement('style')
      style.setAttribute(CURSOR_STYLE, '')
      style.textContent =
        '*, *::before, *::after { cursor: crosshair !important; }'
      document.head.append(style)
      detach = () => {
        for (const [type, handler] of handlers)
          window.removeEventListener(type, handler, true)
        style.remove()
        detach = () => {}
      }
    }
    attach()
    // A reloaded document is a new one: take it over too.
    frame.addEventListener('load', attach)
    return () => {
      frame.removeEventListener('load', attach)
      detach()
    }
  }

  return { element, targetAt, locate, reveal, onChange, intercept }
}
