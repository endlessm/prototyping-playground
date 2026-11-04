// What a comment thread is, in its file and in the browser. Plain
// TypeScript with no imports, so the page, the dev server's handler and
// `yarn comments` share it. The module's README is the format's contract.

export const FORMAT_VERSION = 1
/** The hidden folder at the root of each prototype that holds its threads. */
export const COMMENTS_FOLDER = '.comments'

/** Who wrote: a contributor's permanent studio ID, or that person's agent. */
export interface Author {
  contributor: string
  agent?: true
}

/**
 * What a thread is pinned to, recorded when it was made. `kind`, `label`
 * and `at` (fractions of the target's box) always; `quote` when text was
 * selected; each file type adds the fields it finds the target again by.
 * `{ kind: 'artifact' }` is the whole file.
 */
export interface Anchor {
  kind: string
  label?: string
  at?: { x: number; y: number }
  quote?: string
  [field: string]: unknown
}

export interface CommentMessage {
  id: string
  author: Author
  /** Plain text. */
  body: string
  /** ISO time. */
  createdAt: string
  editedAt?: string
}

export interface CommentThread {
  formatVersion: typeof FORMAT_VERSION
  /** Its permanent ID, also its file's name. */
  id: string
  /** The artifact's permanent ID, or the named state's. */
  artifact: string
  /** The artifact's title when it was commented, for a file removed since. */
  artifactTitle: string
  anchor: Anchor
  status: 'open' | 'resolved'
  resolvedBy?: Author
  resolvedAt?: string
  messages: CommentMessage[]
}

/** The build data: every prototype's threads, by prototype ID. */
export interface CommentsData {
  prototypes: Record<string, CommentThread[]>
  /** Thread files that can't be read, as sentences naming them. */
  problems: string[]
}

/** What `access` in service.ts tells the page about the person asking. */
export interface CommentAccess {
  /** Why they can't write on this prototype, as the service says it, or null. */
  refusal: string | null
  /** The refusal is that they aren't registered: show them how to join. */
  join: boolean
  /** Who their writes are made as, when registered. */
  author: Author | null
  admin: boolean
}

// The service's rules for changing what is already written. They are here,
// with no imports, so the page offers Edit and Delete only to whoever the
// service will let through; the service checks them on every write.

/**
 * Only a message's author changes it: the same contributor, writing as
 * themselves or as their agent just as the message was written. A person
 * doesn't change their agent's messages, nor an agent theirs.
 */
export const mayChangeMessage = (author: Author, message: CommentMessage) =>
  message.author.contributor === author.contributor &&
  Boolean(author.agent) === Boolean(message.author.agent)

/** A thread is deleted by the author of its first message, or an Admin. */
export const mayDeleteThread = (
  asker: { author: Author | null; admin: boolean },
  thread: CommentThread,
) =>
  Boolean(asker.author) &&
  (asker.admin ||
    (Boolean(thread.messages[0]) &&
      mayChangeMessage(asker.author!, thread.messages[0]!)))

const createdAt = (thread: CommentThread) => thread.messages[0]?.createdAt ?? ''

/** Threads in creation order: the first message's time, then the ID. */
export function byCreation(threads: CommentThread[]) {
  return [...threads].sort(
    (a, b) =>
      createdAt(a).localeCompare(createdAt(b)) || a.id.localeCompare(b.id),
  )
}

/**
 * Each thread's number: its place among `threads` in creation order,
 * resolved ones included. Computed on display, never stored. For a view,
 * pass the threads of the view and all its named states together.
 */
export function threadNumbers(threads: CommentThread[]) {
  return new Map(
    byCreation(threads).map((thread, index) => [thread.id, index + 1]),
  )
}
