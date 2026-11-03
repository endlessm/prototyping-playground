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
