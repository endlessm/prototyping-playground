// What a comment is in this prototype: a thread pinned to a target on the
// page (an element, a block of text, a node, a canvas element), or to the
// whole artifact, with its messages and whether it is open or resolved.

export type Person = 'bernardo' | 'ada' | 'agent'

export const PEOPLE: Record<
  Person,
  { name: string; initials: string; tint: string }
> = {
  bernardo: { name: 'Bernardo Campos', initials: 'BC', tint: '#dbeafe' },
  ada: { name: 'Ada Lovelace', initials: 'AL', tint: '#fce7f3' },
  agent: { name: 'Bernardo’s agent', initials: '', tint: '#f5f5f5' },
}

/** Who is working: comments you write are yours. */
export const ME: Person = 'bernardo'

export interface Message {
  author: Person
  body: string
  time: string
}

export interface Thread {
  id: string
  /** The `data-target` it is pinned to; `artifact` for the whole file. */
  target: string
  /** What the agent reads about the target, such as `Button "Invite"`. */
  label: string
  /** Where on the target the pin sits, as fractions of its box. */
  at: { x: number; y: number }
  /** Text selected when commenting, quoted in the thread. */
  quote?: string
  status: 'open' | 'resolved'
  resolvedBy?: Person
  /** Its target is gone from the page: listed, but not pinned. */
  detached?: boolean
  messages: Message[]
}

export type Start =
  | 'browse'
  | 'select'
  | 'comment'
  | 'draft'
  | 'thread'
  | 'list'

export interface Artifact {
  kind: 'view' | 'document' | 'diagram' | 'canvas'
  /** As in the file tree. */
  title: string
  file: string
  address: string
}

const KIND_LABEL = {
  view: 'View',
  document: 'Document',
  diagram: 'Diagram',
  canvas: 'Canvas',
} as const

/** What "Copy for agent" puts on the clipboard; `yarn comments` prints the same. */
export function forAgent(artifact: Artifact, threads: Thread[]) {
  const open = threads.filter((thread) => thread.status === 'open')
  const lines = [
    `## ${open.length} open comment${open.length === 1 ? '' : 's'} on ${KIND_LABEL[artifact.kind]} "${artifact.title}"`,
    '',
    `File: ${artifact.file}`,
    `Address: ${artifact.address}`,
  ]
  open.forEach((thread) => {
    lines.push('', `### ${threads.indexOf(thread) + 1}. ${thread.label} · ${thread.id}`)
    if (thread.detached)
      lines.push('Target not found: it was removed or changed since.')
    if (thread.quote) lines.push(`Quote: "${thread.quote}"`)
    thread.messages.forEach((message) =>
      lines.push(`- ${PEOPLE[message.author].name}: ${message.body}`),
    )
  })
  lines.push(
    '',
    'Reply or resolve with `yarn comments reply <id> "…"` and `yarn comments resolve <id>`.',
  )
  return lines.join('\n')
}
