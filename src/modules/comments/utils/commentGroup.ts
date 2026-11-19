import type { CommentThread } from '../threads'

/** One file's comments in the list: a view's with all its named states'. */
export interface CommentGroup {
  /** The file's permanent ID, or `removed:<ID>` for a file removed since. */
  id: string
  title: string
  /** The folders it sits in inside the prototype, or empty. */
  folder: string
  /** Its kind in words. */
  kind: string
  /** The file open on the page. */
  current: boolean
  /** Removed since: its comments are listed under the title they recorded. */
  removed: boolean
  threads: CommentThread[]
}
