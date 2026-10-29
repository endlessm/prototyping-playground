// The message channel between the studio and a preview document. Versioned
// and validated as transport, not as a security boundary: both sides are
// same-origin repository code. The studio configures which artifact the
// document shows; the document says it is ready, how rendering went
// (status) and whether what it shows matches the saved source (lifecycle).
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

export type HostMessage = Envelope & { kind: 'configure' }

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

export function isHostMessage(value: unknown): value is HostMessage {
  return isEnvelope(value) && value.kind === 'configure'
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
