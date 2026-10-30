// The channel between a Theme page and the system's preview document that
// shows it. The document opens with `?theme&session=<id>`, renders the
// system's tokens with the system's own app and stylesheet, measures each
// token's value there, and reports its height so the studio can size the
// frame. The studio sends the tokens of the open page and the words to
// show; the document passes on the studio's shortcuts pressed inside it.
// Transport checks only: both sides are same-origin repository code.
// Imported by both sides, so it imports nothing of either.
import type { PreviewShortcut } from './protocol.ts'

export const THEME_CHANNEL = 'studio-theme'
export const THEME_VERSION = 1
/** The query parameter that opens a preview document as a Theme page. */
export const THEME_QUERY = 'theme'

export type SpecimenGroup =
  | 'colors'
  | 'typography'
  | 'radius'
  | 'shadows'
  | 'spacing'
  | 'motion'
  | 'effects'
  | 'other'

export interface SpecimenToken {
  name: string
  /** As declared, shown when the document holds no value of its own. */
  value: string
  group: SpecimenGroup
  /** Colours: the role section (`text`, `surfaces`…) or ramp heading. */
  heading: string | null
  /** What a known role is for. */
  role: string | null
  /** The Tailwind class that uses it. */
  utility: string | null
}

/** The words the document shows, in the studio's language. */
export interface SpecimenLabels {
  notSet: string
  pangram: string
  sample: string
  families: string
  sizes: string
  weights: string
  other: string
  spacing: string
  containers: string
  containersNote: string
  noSizes: string
  noWeights: string
  otherColors: string
  /** The headings of the colour sections, by section. */
  sections: Record<string, string>
}

interface Envelope {
  channel: typeof THEME_CHANNEL
  version: typeof THEME_VERSION
  session: string
}

export type ThemeHostMessage = Envelope & {
  kind: 'show'
  page: SpecimenGroup
  tokens: SpecimenToken[]
  labels: SpecimenLabels
}

export type ThemeDocumentMessage = Envelope &
  (
    | { kind: 'ready' }
    | { kind: 'size'; height: number }
    | { kind: 'shortcut'; action: PreviewShortcut }
  )

const record = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value))

const envelope = (value: unknown, session: string) =>
  record(value) &&
  value.channel === THEME_CHANNEL &&
  value.version === THEME_VERSION &&
  value.session === session

export function isThemeHostMessage(
  value: unknown,
  session: string,
): value is ThemeHostMessage {
  return (
    envelope(value, session) &&
    (value as Record<string, unknown>).kind === 'show' &&
    Array.isArray((value as Record<string, unknown>).tokens) &&
    record((value as Record<string, unknown>).labels)
  )
}

export function isThemeDocumentMessage(
  value: unknown,
  session: string,
): value is ThemeDocumentMessage {
  if (!envelope(value, session)) return false
  const message = value as Record<string, unknown>
  switch (message.kind) {
    case 'ready':
      return true
    case 'size':
      return Number.isFinite(message.height) && (message.height as number) >= 0
    case 'shortcut':
      return typeof message.action === 'string'
    default:
      return false
  }
}
