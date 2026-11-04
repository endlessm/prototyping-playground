// The agent text: comments as an agent reads them, naming each target the
// way it can be found in code. Copy for agent and `yarn comments` both print
// it from here, so the clipboard and the command never differ. Plain
// TypeScript with only the format's types, for the browser and Node alike.
// It is a format for agents, not interface copy, so it is English here
// rather than in the locale; the Comments prototype's "What the agent gets"
// shows its shape.
import type { Anchor, Author, CommentThread } from './threads.ts'

/** One file's threads, and what the agent needs to find them. */
export interface AgentTextFile {
  /** The artifact's file type (`view`, `document`…), or null when unknown. */
  type: string | null
  title: string
  /** Repository-relative, or null for a file removed since. */
  file: string | null
  /** The file's permanent address, `/prototypes/<id>/artifacts/<id>`. */
  address: string
  /** The threads to list, in any order. */
  threads: CommentThread[]
  /** Each thread's number, from `threadNumbers` over all the file's threads. */
  numbers: Map<string, number>
  /** A view's named states, title by permanent ID: a thread on one names it. */
  states?: Record<string, string>
  /** Threads whose target the page couldn't find. The command can't tell. */
  missing?: ReadonlySet<string>
  /** Heads the file when it begins another prototype's (the command's list). */
  prototype?: { title: string; folder: string }
}

export interface AgentTextOptions {
  /** A contributor's name, by permanent ID. */
  name: (contributor: string) => string | undefined
  /** Which threads are listed, for the heading; open by default. */
  status?: CommentThread['status']
  /** One thread on its own, as `yarn comments show` prints it. */
  one?: boolean
}

const KINDS: Record<string, string> = {
  view: 'View',
  document: 'Document',
  diagram: 'Diagram',
  canvas: 'Canvas',
}

/**
 * The lines that locate a target, by anchor field, in this order. Each
 * file type's anchor adds the fields it is found by; a field it lacks is
 * left out.
 */
const LOCATORS: [field: string, name: string, quoted?: true][] = [
  // A view element's.
  ['path', 'Path'],
  // A document block's (or a quote's) nearest heading, and an embed's file.
  ['heading', 'Heading'],
  ['embed', 'Embed'],
  // A diagram step's, arrow's or group's ID in the Mermaid source.
  ['mermaid', 'Mermaid ID'],
  ['quote', 'Quote', true],
]

function authorName(author: Author, options: AgentTextOptions) {
  const name = options.name(author.contributor) ?? 'Someone'
  return author.agent ? `${name.split(/\s+/)[0]}'s agent` : name
}

function label(anchor: Anchor, type: string | null) {
  if (anchor.kind === 'artifact')
    return `The whole ${(KINDS[type ?? ''] ?? 'file').toLowerCase()}`
  return anchor.label || anchor.kind
}

function threadText(
  thread: CommentThread,
  file: AgentTextFile,
  options: AgentTextOptions,
) {
  const number = file.numbers.get(thread.id) ?? '?'
  const lines = [
    `### ${number}. ${label(thread.anchor, file.type)} · ${thread.id}`,
  ]
  const state = file.states?.[thread.artifact]
  if (state) lines.push(`State: ${state}`)
  // A target the page can't find has moved on: its stored place would mislead.
  const missing = file.missing?.has(thread.id)
  if (missing) lines.push('Target not found: it was removed or changed since.')
  for (const [field, name, quoted] of LOCATORS) {
    const value = thread.anchor[field]
    if (typeof value !== 'string' || !value) continue
    if (missing && !quoted) continue
    lines.push(`${name}: ${quoted ? `"${value}"` : value}`)
  }
  for (const message of thread.messages)
    lines.push(
      `- ${authorName(message.author, options)}: ${message.body.replace(/\n/g, '\n  ')}`,
    )
  if (thread.status === 'resolved' && thread.resolvedBy)
    lines.push(`Resolved by ${authorName(thread.resolvedBy, options)}.`)
  return lines.join('\n')
}

function heading(
  file: AgentTextFile,
  count: number,
  options: AgentTextOptions,
) {
  const kind = KINDS[file.type ?? '']
  const what = `${kind && file.file ? `${kind} ` : ''}"${file.title}"`
  if (options.one)
    return `## Comment ${file.numbers.get(file.threads[0]!.id) ?? '?'} on ${what}`
  const status = options.status ?? 'open'
  return `## ${count} ${status} comment${count === 1 ? '' : 's'} on ${what}`
}

const CLOSING = {
  open: 'Reply or resolve with `yarn comments reply <id> "…"` and `yarn comments resolve <id>`.',
  resolved:
    'Reopen with `yarn comments reopen <id>`, or reply with `yarn comments reply <id> "…"`.',
}

/** The agent text for these files' threads, or '' when there are none. */
export function agentText(files: AgentTextFile[], options: AgentTextOptions) {
  const blocks: string[] = []
  const statuses = new Set<CommentThread['status']>()
  let prototype: string | undefined
  for (const file of files) {
    if (!file.threads.length) continue
    if (file.prototype && file.prototype.folder !== prototype) {
      prototype = file.prototype.folder
      blocks.push(
        `# Prototype "${file.prototype.title}"`,
        `Folder: ${file.prototype.folder}`,
      )
    }
    const threads = [...file.threads].sort(
      (a, b) => (file.numbers.get(a.id) ?? 0) - (file.numbers.get(b.id) ?? 0),
    )
    blocks.push(
      heading(file, threads.length, options),
      file.file
        ? `File: ${file.file}\nAddress: ${file.address}`
        : 'File removed',
      ...threads.map((thread) => threadText(thread, file, options)),
    )
    for (const { status } of threads) statuses.add(status)
  }
  if (!blocks.length) return ''
  for (const status of ['open', 'resolved'] as const)
    if (statuses.has(status)) blocks.push(CLOSING[status])
  return `${blocks.join('\n\n')}\n`
}
