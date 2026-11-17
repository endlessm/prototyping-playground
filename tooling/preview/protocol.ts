// The message channel between the studio and a preview document. Versioned
// and validated as transport, not as a security boundary: both sides are
// same-origin repository code. The studio configures which artifact the
// document shows and, for a component's playground, the props it mounts the
// component with; the document says it is ready, how rendering went
// (status) and whether what it shows matches the saved source (lifecycle).
// It asks the studio to open another studio address (navigate), so links in a
// view go through the studio's history, and passes on the studio's keyboard
// shortcuts pressed while it has focus (shortcut). A playground's component
// that changes one of its own props says so (update). For a Breakdown, the
// document reports where each piece's elements are (nodes) and the studio
// says which piece to highlight (highlight), the unsaved changes of its
// knobs (overrides) and the area a hovered knob changes (knob).
// Imported by both sides, so it imports nothing of either.
import { isResourceId } from '../identity/resource-id.ts'

export const PREVIEW_CHANNEL = 'studio-preview'
export const PREVIEW_VERSION = 1

export type PreviewState = 'loading' | 'ready' | 'error' | 'empty'
/**
 * Whether the shown output matches the saved source: `current`, an update
 * on its way (`updating`), the latest change failed to render (`error`), or
 * the document lost its development server and can't hear of changes.
 */
export type PreviewPhase = 'current' | 'updating' | 'error' | 'disconnected'

export interface Envelope {
  channel: typeof PREVIEW_CHANNEL
  version: typeof PREVIEW_VERSION
  /** Chosen by the studio for one frame; survives the document's reloads. */
  session: string
  /** Chosen by each load of the document. */
  runtime: string
  /** The artifact the message is about. */
  artifact: string
}

/** Props for a component the document mounts by itself, as plain JSON. */
export type PreviewProps = Record<string, unknown>

/**
 * `configure` names the artifact to show; `props` sets a playground's props,
 * replacing the last ones whole: a key left out takes the component's default.
 */
export type HostMessage = Envelope &
  (
    | { kind: 'configure' }
    | { kind: 'props'; props: PreviewProps }
    | {
        /**
         * The Breakdown pieces to draw an outline around, by node ID (a
         * theme slot's ID ends in `#<slot>`), or none.
         */
        kind: 'highlight'
        hover: string | null
        selected: string | null
      }
    | {
        /**
         * A Breakdown's unsaved changes, replacing the last ones whole:
         * classes by node ID and theme slot, merged over the piece's own.
         */
        kind: 'overrides'
        overrides: PreviewOverrides
      }
    | {
        /** The area a hovered knob changes, drawn in its colour, or none. */
        kind: 'knob'
        knob: KnobHighlight | null
      }
  )

/** Node ID → theme slot (or `class`) → classes. */
export type PreviewOverrides = Record<string, Record<string, string>>

/** What a hovered knob changes on a piece. */
export interface KnobHighlight {
  /** The theme slot's node ID, `<node>#<slot>`, or a piece's own. */
  target: string
  /** Corners outlined; padding and gaps hatched; anything else outlined. */
  area: 'corners' | 'padding' | 'paddingX' | 'paddingY' | 'gap' | 'box'
  /** `#rrggbb`. */
  color: string
}

/** A host message's own fields, without the envelope. */
export type HostBody = HostMessage extends infer M
  ? M extends HostMessage
    ? Omit<M, keyof Envelope>
    : never
  : never

/** Where an element is, in the document's coordinates, in CSS pixels. */
export interface NodeBox {
  x: number
  y: number
  width: number
  height: number
}

/** Where a Breakdown piece shows: its elements and its theme slots. */
export interface NodeBoxes {
  /** Its own elements: one, several for a fragment or a `v-for`, or none. */
  boxes: NodeBox[]
  /** For a Nuxt UI piece: each `data-slot` element inside it, by slot. */
  slots: Record<string, NodeBox[]>
  /** For a Nuxt UI piece: the classes each theme slot renders with. */
  classes?: Record<string, string>
}

/**
 * The studio commands a preview passes on while it has focus: the source,
 * the grid, the palette, the section navigation, and comment mode.
 */
export type PreviewShortcut =
  'source' | 'grid' | 'palette' | 'navigation' | 'comment'
const SHORTCUTS: PreviewShortcut[] = [
  'source',
  'grid',
  'palette',
  'navigation',
  'comment',
]

export type PreviewMessage = Envelope &
  (
    | { kind: 'ready' }
    | {
        kind: 'status'
        state: PreviewState
        /** Increases with each render attempt of this runtime. */
        render: number
        detail: string
      }
    | {
        kind: 'lifecycle'
        sequence: number
        phase: PreviewPhase
        detail: string
      }
    | {
        kind: 'navigate'
        /** A path on the studio's own origin, with the base path. */
        href: string
        replace: boolean
      }
    | { kind: 'shortcut'; action: PreviewShortcut }
    | {
        /**
         * A playground's component changed one of its props itself, as a
         * modal closing on Escape emits `update:open`.
         */
        kind: 'update'
        prop: string
        value: unknown
      }
    | {
        /**
         * Where every Breakdown piece rendered now shows, by node ID; sent
         * whenever a piece mounts, updates, unmounts or changes size.
         */
        kind: 'nodes'
        nodes: Record<string, NodeBoxes>
      }
  )

const STATES: PreviewState[] = ['loading', 'ready', 'error', 'empty']
const PHASES: PreviewPhase[] = ['current', 'updating', 'error', 'disconnected']
const MAX_DETAIL = 8192

const record = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value))
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f]/
const token = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.length <= 128 &&
  !CONTROL.test(value)
const count = (value: unknown) =>
  Number.isSafeInteger(value) && (value as number) >= 0
const detail = (value: unknown) =>
  typeof value === 'string' && value.length <= MAX_DETAIL
const MAX_HREF = 2048
/** A path on this origin: `/…`, never `//host`. */
export const isStudioHref = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length <= MAX_HREF &&
  value.startsWith('/') &&
  !value.startsWith('//') &&
  !CONTROL.test(value)

function isEnvelope(
  value: unknown,
): value is Record<string, unknown> & Envelope {
  return (
    record(value) &&
    value.channel === PREVIEW_CHANNEL &&
    value.version === PREVIEW_VERSION &&
    token(value.session) &&
    token(value.runtime) &&
    isResourceId(value.artifact)
  )
}

const MAX_DEPTH = 16
const MAX_TEXT = 65_536
const MAX_NODES = 2048

/**
 * Plain JSON values only, so a message never carries functions, class
 * instances or anything the document would assign as more than data. A key
 * named `__proto__` is refused, as assigning it would change a prototype.
 */
export function isPreviewProps(value: unknown): value is PreviewProps {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    isPreviewValue(value)
  )
}

/** One plain JSON value, held to the same rules as props. */
export function isPreviewValue(value: unknown) {
  let nodes = 0
  const seen = new Set<object>()
  const json = (item: unknown, depth: number): boolean => {
    if (++nodes > MAX_NODES || depth > MAX_DEPTH) return false
    if (item === null || typeof item === 'boolean') return true
    if (typeof item === 'number') return Number.isFinite(item)
    if (typeof item === 'string') return item.length <= MAX_TEXT
    if (typeof item !== 'object' || seen.has(item)) return false
    seen.add(item)
    if (Array.isArray(item))
      return item.every((entry) => json(entry, depth + 1))
    return plainRecord(item) && fields(item, depth)
  }
  const plainRecord = (item: object): item is Record<string, unknown> => {
    const prototype = Object.getPrototypeOf(item)
    return prototype === Object.prototype || prototype === null
  }
  const fields = (item: Record<string, unknown>, depth: number) =>
    Object.getOwnPropertySymbols(item).length === 0 &&
    Object.keys(item).every(
      (key) => key !== '__proto__' && json(item[key], depth + 1),
    )
  return json(value, 0)
}

const PROP_NAME = /^[A-Za-z_$][\w$]{0,127}$/
/** A prop's name as a component declares it, never `__proto__`. */
const propName = (value: unknown): value is string =>
  typeof value === 'string' && PROP_NAME.test(value) && value !== '__proto__'

const MAX_NODE_ID = 512
/** A Breakdown node's ID: its path of tags, files (`>`) and slots (`#`). */
export const isBreakdownNodeId = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.length <= MAX_NODE_ID &&
  value !== '__proto__' &&
  !/\s/.test(value) &&
  !CONTROL.test(value)
const nodeOrNone = (value: unknown) =>
  value === null || isBreakdownNodeId(value)

const MAX_REPORTED_NODES = 4096
const MAX_BOXES = 1024
const finite = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value)
const isBox = (value: unknown) =>
  record(value) &&
  finite(value.x) &&
  finite(value.y) &&
  finite(value.width) &&
  finite(value.height)
const isBoxes = (value: unknown) =>
  Array.isArray(value) && value.length <= MAX_BOXES && value.every(isBox)
const ownKeys = (value: Record<string, unknown>) => Object.keys(value)
function isNodeBoxes(value: unknown) {
  if (!record(value) || !isBoxes(value.boxes)) return false
  const { slots } = value
  return (
    record(slots) &&
    ownKeys(slots).every((slot) => propName(slot) && isBoxes(slots[slot])) &&
    (value.classes === undefined || isSlotClasses(value.classes))
  )
}

const MAX_CLASSES = 2048
const isClasses = (value: unknown) =>
  typeof value === 'string' &&
  value.length <= MAX_CLASSES &&
  !CONTROL.test(value)
function isSlotClasses(value: unknown) {
  if (!record(value) || Object.getPrototypeOf(value) !== Object.prototype)
    return false
  return ownKeys(value).every(
    (slot) => propName(slot) && isClasses(value[slot]),
  )
}
function isOverrides(value: unknown) {
  if (!record(value) || Object.getPrototypeOf(value) !== Object.prototype)
    return false
  const ids = ownKeys(value)
  return (
    ids.length <= MAX_REPORTED_NODES &&
    ids.every((id) => isBreakdownNodeId(id) && isSlotClasses(value[id]))
  )
}
const KNOB_AREAS = ['corners', 'padding', 'paddingX', 'paddingY', 'gap', 'box']
const isKnobHighlight = (value: unknown) =>
  value === null ||
  (record(value) &&
    isBreakdownNodeId(value.target) &&
    typeof value.area === 'string' &&
    KNOB_AREAS.includes(value.area) &&
    typeof value.color === 'string' &&
    /^#[0-9a-f]{6}$/i.test(value.color))
function isReportedNodes(value: unknown) {
  if (!record(value) || Object.getPrototypeOf(value) !== Object.prototype)
    return false
  const ids = ownKeys(value)
  return (
    ids.length <= MAX_REPORTED_NODES &&
    ids.every((id) => isBreakdownNodeId(id) && isNodeBoxes(value[id]))
  )
}

export function isHostMessage(value: unknown): value is HostMessage {
  if (!isEnvelope(value)) return false
  switch (value.kind) {
    case 'configure':
      return true
    case 'props':
      return isPreviewProps(value.props)
    case 'highlight':
      return nodeOrNone(value.hover) && nodeOrNone(value.selected)
    case 'overrides':
      return isOverrides(value.overrides)
    case 'knob':
      return isKnobHighlight(value.knob)
    default:
      return false
  }
}

export function isPreviewMessage(value: unknown): value is PreviewMessage {
  if (!isEnvelope(value)) return false
  switch (value.kind) {
    case 'ready':
      return true
    case 'status':
      return (
        typeof value.state === 'string' &&
        STATES.includes(value.state as PreviewState) &&
        count(value.render) &&
        detail(value.detail)
      )
    case 'lifecycle':
      return (
        typeof value.phase === 'string' &&
        PHASES.includes(value.phase as PreviewPhase) &&
        count(value.sequence) &&
        detail(value.detail)
      )
    case 'navigate':
      return isStudioHref(value.href) && typeof value.replace === 'boolean'
    case 'shortcut':
      return SHORTCUTS.includes(value.action as PreviewShortcut)
    case 'update':
      return propName(value.prop) && isPreviewValue(value.value)
    case 'nodes':
      return isReportedNodes(value.nodes)
    default:
      return false
  }
}

type Received = Pick<MessageEvent, 'data' | 'source' | 'origin'>

const fromSender = (
  event: Received,
  source: MessageEventSource | null,
  origin: string,
) => source !== null && event.source === source && event.origin === origin

/**
 * The studio's side. A document that has just loaded announces itself with
 * `ready`, carrying a new runtime and the artifact in its address; anything
 * else must come from the current runtime about the current artifact.
 */
export function acceptsPreview(
  event: Received,
  source: MessageEventSource | null,
  origin: string,
  expected: { session: string; runtime: string | null; artifact: string },
): event is Received & { data: PreviewMessage } {
  if (!fromSender(event, source, origin) || !isPreviewMessage(event.data))
    return false
  const message = event.data
  if (message.session !== expected.session) return false
  if (message.kind === 'ready') return true
  return (
    message.runtime === expected.runtime &&
    message.artifact === expected.artifact
  )
}

/** The document's side: only its own studio, session and runtime. */
export function acceptsHost(
  event: Received,
  source: MessageEventSource | null,
  origin: string,
  expected: { session: string; runtime: string },
): event is Received & { data: HostMessage } {
  return (
    fromSender(event, source, origin) &&
    isHostMessage(event.data) &&
    event.data.session === expected.session &&
    event.data.runtime === expected.runtime
  )
}

/**
 * A preview document's address for one artifact. Without a session it is
 * the address to open directly in a tab: it renders, and talks to nobody.
 */
export function previewAddress(
  documentPath: string,
  artifact: string,
  session?: string,
) {
  const query = new URLSearchParams({ artifact })
  if (session) query.set('session', session)
  return `${documentPath}?${query}`
}

export function readAddress(search: string) {
  const query = new URLSearchParams(search)
  const artifact = query.get('artifact')
  const session = query.get('session')
  return {
    artifact: isResourceId(artifact) ? artifact : null,
    session: token(session) ? session : null,
  }
}
