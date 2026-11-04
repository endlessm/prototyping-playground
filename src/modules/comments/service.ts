// Every rule and every write for comments, on Node: the dev server's handler
// (writes from the page) and `yarn comments` (an agent's writes) both come
// here, as the Settings page and `yarn studio configure` share theirs. Each
// write re-reads its thread file just before writing, applies itself to what
// is there now and replaces the file atomically, so a reply from the page and
// a resolve from an agent can't overwrite each other. Imports only Node and
// `tooling/`.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import {
  readContributors,
  type Contributors,
} from '../../../tooling/contributors/profiles.ts'
import { roleOf, teamOf } from '../../../tooling/contributors/roles.ts'
import { newStudioId } from '../../../tooling/contributors/studio-ids.ts'
import { isResourceId } from '../../../tooling/identity/resource-id.ts'
import { PROTOTYPES_FOLDER } from '../../../tooling/manifest/build.ts'
import { readConfig } from '../../../tooling/modules/registry.ts'
import {
  COMMENTS_FOLDER,
  FORMAT_VERSION,
  mayChangeMessage,
  mayDeleteThread,
  type Anchor,
  type Author,
  type CommentAccess,
  type CommentMessage,
  type CommentThread,
  type CommentsData,
} from './threads.ts'

export interface CommentsContext {
  /** The studio's root folder. */
  root: string
  /** Prototypes, relative to the root; `src/prototypes` by default. */
  prototypesFolder?: string
  /** Contributor profiles, relative to the root or absolute. */
  contributorsFolder?: string
  /** The studio's configuration, for its Admins; `studio.config.json` by default. */
  configFile?: string
}

/** Who writes: the contributor Git resolves to, or nobody; and whether as their agent. */
export interface CommentsActor {
  key: string | null
  /** Git's email, to name it when it matches nobody. */
  email?: string
  agent?: boolean
}

/** A refused request, with the sentence saying what to do and an HTTP status. */
export class CommentRefusal extends Error {
  readonly status: number
  constructor(message: string, status = 403) {
    super(message)
    this.name = 'CommentRefusal'
    this.status = status
  }
}

export interface PrototypeFolder {
  id: string
  title: string
  status: 'active' | 'archived'
  /** The owner's permanent contributor ID. */
  owner: string | null
  /** Absolute. */
  dir: string
  /** Repository-relative, with forward slashes. */
  folder: string
}

const MAX_BODY = 10_000
const MAX_ANCHOR = 8_192
const MAX_TITLE = 200

const prototypesRoot = (context: CommentsContext) =>
  path.resolve(
    context.root,
    context.prototypesFolder ??
      process.env.STUDIO_PROTOTYPES ??
      PROTOTYPES_FOLDER,
  )

const childFolders = (dir: string) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
        .map((entry) => path.join(dir, entry.name))
    : []

/** Every prototype folder with a readable meta.json. */
export function prototypeFolders(context: CommentsContext): PrototypeFolder[] {
  const found: PrototypeFolder[] = []
  for (const contributor of childFolders(prototypesRoot(context)))
    for (const dir of childFolders(contributor)) {
      const file = path.join(dir, 'meta.json')
      if (!existsSync(file)) continue
      try {
        const meta = JSON.parse(readFileSync(file, 'utf8')) as Record<
          string,
          unknown
        >
        if (!isResourceId(meta.studioId)) continue
        found.push({
          id: meta.studioId,
          title: typeof meta.title === 'string' ? meta.title : '',
          status: meta.status === 'archived' ? 'archived' : 'active',
          owner:
            typeof meta.ownerContributorId === 'string'
              ? meta.ownerContributorId
              : null,
          dir,
          folder: path.relative(context.root, dir).split(path.sep).join('/'),
        })
      } catch {
        // The manifest reports a broken meta.json.
      }
    }
  return found
}

/** What is wrong with a thread file's content, as phrases. */
function threadProblems(value: unknown, id: string): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return ['it is not a thread object']
  const thread = value as Record<string, unknown>
  const problems: string[] = []
  if (thread.formatVersion !== FORMAT_VERSION)
    problems.push(`formatVersion must be ${FORMAT_VERSION}`)
  if (thread.id !== id) problems.push('its id must be its file name')
  if (!isResourceId(thread.artifact))
    problems.push('artifact must be a permanent ID')
  if (thread.status !== 'open' && thread.status !== 'resolved')
    problems.push('status must be "open" or "resolved"')
  if (
    !thread.anchor ||
    typeof thread.anchor !== 'object' ||
    typeof (thread.anchor as Anchor).kind !== 'string'
  )
    problems.push('anchor needs a kind')
  if (
    !Array.isArray(thread.messages) ||
    !thread.messages.length ||
    thread.messages.some(
      (message) =>
        !message ||
        typeof message.body !== 'string' ||
        typeof message.createdAt !== 'string' ||
        typeof message.author?.contributor !== 'string',
    )
  )
    problems.push('messages need an author, a body and a time')
  return problems
}

function readThread(file: string, where: string) {
  const id = path.basename(file, '.json')
  let value: unknown
  try {
    value = JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    return { problem: `${where}: ${(error as Error).message}` }
  }
  const problems = threadProblems(value, id)
  if (problems.length) return { problem: `${where}: ${problems.join('; ')}.` }
  return { thread: value as CommentThread }
}

/** One prototype's threads, and the files that can't be read. */
export function prototypeThreads(prototype: PrototypeFolder) {
  const folder = path.join(prototype.dir, COMMENTS_FOLDER)
  const threads: CommentThread[] = []
  const problems: string[] = []
  if (!existsSync(folder)) return { threads, problems }
  for (const name of readdirSync(folder).sort()) {
    if (!name.endsWith('.json')) continue
    const { thread, problem } = readThread(
      path.join(folder, name),
      `${prototype.folder}/${COMMENTS_FOLDER}/${name}`,
    )
    if (thread) threads.push(thread)
    else problems.push(problem!)
  }
  return { threads, problems }
}

/** Every prototype's threads: the module's build data in development. */
export function allThreads(context: CommentsContext): CommentsData {
  const data: CommentsData = { prototypes: {}, problems: [] }
  for (const prototype of prototypeFolders(context)) {
    const { threads, problems } = prototypeThreads(prototype)
    if (threads.length) data.prototypes[prototype.id] = threads
    data.problems.push(...problems)
  }
  return data
}

/** The thread with this ID and the prototype it is in. */
export function findThread(context: CommentsContext, id: string) {
  if (!isResourceId(id))
    throw new CommentRefusal(
      `${id} isn't a comment ID. Comment IDs are 16 lowercase letters and digits; \`yarn comments\` lists them.`,
      400,
    )
  for (const prototype of prototypeFolders(context)) {
    const file = path.join(prototype.dir, COMMENTS_FOLDER, `${id}.json`)
    if (existsSync(file)) return { prototype, file }
  }
  throw new CommentRefusal(
    `There is no comment ${id}. \`yarn comments\` lists the open ones.`,
    404,
  )
}

/**
 * Exactly what Prettier writes for JSON, so formatting never rewrites it,
 * with the fields always in the format's order.
 */
export function serializeThread(thread: CommentThread) {
  const ordered: CommentThread = {
    formatVersion: thread.formatVersion,
    id: thread.id,
    artifact: thread.artifact,
    artifactTitle: thread.artifactTitle,
    anchor: thread.anchor,
    status: thread.status,
    ...(thread.resolvedBy && { resolvedBy: thread.resolvedBy }),
    ...(thread.resolvedAt && { resolvedAt: thread.resolvedAt }),
    messages: thread.messages,
  }
  return `${JSON.stringify(ordered, null, 2)}\n`
}

// The file is replaced whole, never half written. Windows refuses a rename
// over a file another program is reading for a moment, so try again.
function writeAtomically(file: string, text: string) {
  mkdirSync(path.dirname(file), { recursive: true })
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`
  writeFileSync(temporary, text)
  for (let attempt = 0; ; attempt++)
    try {
      renameSync(temporary, file)
      return
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (attempt >= 20 || (code !== 'EPERM' && code !== 'EBUSY')) {
        rmSync(temporary, { force: true })
        throw error
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 25)
    }
}

function contributorsOf(context: CommentsContext): Contributors {
  const { contributors, problems } = readContributors(
    context.root,
    context.contributorsFolder ??
      process.env.STUDIO_CONTRIBUTORS ??
      'contributors',
  )
  if (problems.length) throw new CommentRefusal(problems.join('\n'), 500)
  return contributors
}

function configOf(context: CommentsContext) {
  return readConfig(
    path.resolve(
      context.root,
      context.configFile ?? (process.env.STUDIO_CONFIG || 'studio.config.json'),
    ),
  )
}

/**
 * The author a write is made as: a registered contributor, while the module
 * is on, or a refusal. Reading never asks, so the files stay readable with
 * the module off.
 */
function authorOf(context: CommentsContext, actor: CommentsActor): Author {
  if (configOf(context).modules?.comments !== true)
    throw new CommentRefusal(
      'The Comments module is off, so comments are read-only. An Admin can turn it on with `yarn studio enable comments`.',
      409,
    )
  const contributors = contributorsOf(context)
  const profile = actor.key ? contributors[actor.key] : undefined
  if (!profile)
    throw new CommentRefusal(
      `Only contributors can comment, and your Git identity (${actor.email || 'no Git email set'}) doesn't match a contributor profile. Join the studio with \`yarn studio join\`, then try again.`,
    )
  return actor.agent
    ? { contributor: profile.studioId, agent: true }
    : { contributor: profile.studioId }
}

function bodyOf(value: unknown) {
  const body = typeof value === 'string' ? value.trim() : ''
  if (!body) throw new CommentRefusal('Write something to post.', 400)
  if (body.length > MAX_BODY)
    throw new CommentRefusal(
      `A message can be at most ${MAX_BODY} characters long.`,
      400,
    )
  return body
}

function anchorOf(value: unknown): Anchor {
  const anchor = value as Anchor | null
  const valid =
    anchor &&
    typeof anchor === 'object' &&
    !Array.isArray(anchor) &&
    typeof anchor.kind === 'string' &&
    anchor.kind.length > 0 &&
    anchor.kind.length <= 40 &&
    (anchor.label === undefined || typeof anchor.label === 'string') &&
    (anchor.at === undefined ||
      (typeof anchor.at === 'object' &&
        [anchor.at.x, anchor.at.y].every(
          (part) => typeof part === 'number' && part >= 0 && part <= 1,
        ))) &&
    JSON.stringify(anchor).length <= MAX_ANCHOR
  if (!valid)
    throw new CommentRefusal(
      'A comment needs an anchor: what it is pinned to, with a kind, a label and where on it.',
      400,
    )
  return anchor
}

const message = (author: Author, body: string, ids: Set<string>) => {
  const id = newStudioId(ids)
  ids.add(id)
  return {
    id,
    author,
    body,
    createdAt: new Date().toISOString(),
  } satisfies CommentMessage
}

function writable(prototype: PrototypeFolder) {
  if (prototype.status === 'archived')
    throw new CommentRefusal(
      `“${prototype.title}” is archived, so its comments are read-only. Restore it to comment.`,
    )
}

export interface NewThread {
  /** The prototype's permanent ID. */
  prototype: string
  artifact: string
  artifactTitle: string
  anchor: unknown
  body: unknown
}

const LARGEST_SOURCE = 2 * 1024 * 1024

/**
 * Whether a file of the prototype carries the permanent ID, as each file
 * type writes its own and its states' IDs into the file. Reading the text
 * keeps the service free of the file types; a permanent ID is long and
 * random enough that finding it means it is there. Hidden folders (the
 * comments themselves) and `meta.json` (the prototype's own ID) don't count.
 */
function holds(dir: string, id: string, top = true): boolean {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (holds(file, id, false)) return true
    } else if (
      entry.isFile() &&
      !(top && entry.name === 'meta.json') &&
      statSync(file).size <= LARGEST_SOURCE &&
      readFileSync(file, 'utf8').includes(id)
    )
      return true
  }
  return false
}

export function createThread(
  context: CommentsContext,
  actor: CommentsActor,
  request: NewThread,
): CommentThread {
  const author = authorOf(context, actor)
  const prototype = prototypeFolders(context).find(
    ({ id }) => id === request.prototype,
  )
  if (!prototype)
    throw new CommentRefusal(
      `There is no prototype ${String(request.prototype)} to comment on.`,
      404,
    )
  writable(prototype)
  if (!isResourceId(request.artifact))
    throw new CommentRefusal(
      'A comment needs the permanent ID of what it is about.',
      400,
    )
  if (!holds(prototype.dir, request.artifact))
    throw new CommentRefusal(
      `“${prototype.title}” has no file or state ${request.artifact} to comment on.`,
      404,
    )
  const body = bodyOf(request.body)
  const anchor = anchorOf(request.anchor)
  const folder = path.join(prototype.dir, COMMENTS_FOLDER)
  const taken = new Set(
    existsSync(folder)
      ? readdirSync(folder).map((name) => path.basename(name, '.json'))
      : [],
  )
  const id = newStudioId(taken)
  taken.add(id)
  const thread: CommentThread = {
    formatVersion: FORMAT_VERSION,
    id,
    artifact: request.artifact,
    artifactTitle:
      typeof request.artifactTitle === 'string'
        ? request.artifactTitle.slice(0, MAX_TITLE)
        : '',
    anchor,
    status: 'open',
    messages: [message(author, body, taken)],
  }
  writeAtomically(path.join(folder, `${id}.json`), serializeThread(thread))
  return thread
}

/** Re-reads the thread, applies `change` to what is there now, writes it. */
function update(
  context: CommentsContext,
  id: string,
  change: (thread: CommentThread) => void,
): CommentThread {
  const { prototype, file } = findThread(context, id)
  writable(prototype)
  const { thread, problem } = readThread(
    file,
    `${prototype.folder}/${COMMENTS_FOLDER}/${id}.json`,
  )
  if (!thread)
    throw new CommentRefusal(`${problem} Fix the file, then try again.`, 422)
  change(thread)
  writeAtomically(file, serializeThread(thread))
  return thread
}

const messageIds = (thread: CommentThread) =>
  new Set([thread.id, ...thread.messages.map(({ id }) => id)])

export function replyToThread(
  context: CommentsContext,
  actor: CommentsActor,
  request: { thread: string; body: unknown },
) {
  const author = authorOf(context, actor)
  const body = bodyOf(request.body)
  return update(context, request.thread, (thread) => {
    thread.messages.push(message(author, body, messageIds(thread)))
  })
}

/** Resolves a thread, with an optional last reply; resolving twice is fine. */
export function resolveThread(
  context: CommentsContext,
  actor: CommentsActor,
  request: { thread: string; reply?: unknown },
) {
  const author = authorOf(context, actor)
  const reply = request.reply === undefined ? undefined : bodyOf(request.reply)
  return update(context, request.thread, (thread) => {
    if (reply) thread.messages.push(message(author, reply, messageIds(thread)))
    if (thread.status === 'resolved') return
    thread.status = 'resolved'
    thread.resolvedBy = author
    thread.resolvedAt = new Date().toISOString()
  })
}

/** The message `id` of a thread, or a refusal naming it. */
function messageIn(thread: CommentThread, id: unknown) {
  const found = thread.messages.find((message) => message.id === id)
  if (!found)
    throw new CommentRefusal(
      `Comment ${thread.id} has no message ${String(id)}. It may have been deleted; reload to see the thread as it is now.`,
      404,
    )
  return found
}

export function editMessage(
  context: CommentsContext,
  actor: CommentsActor,
  request: { thread: string; message: string; body: unknown },
) {
  const author = authorOf(context, actor)
  const body = bodyOf(request.body)
  return update(context, request.thread, (thread) => {
    const found = messageIn(thread, request.message)
    if (!mayChangeMessage(author, found))
      throw new CommentRefusal(
        'Only its author can edit a message. Reply to add to it instead.',
      )
    if (found.body === body) return
    found.body = body
    found.editedAt = new Date().toISOString()
  })
}

export function deleteMessage(
  context: CommentsContext,
  actor: CommentsActor,
  request: { thread: string; message: string },
) {
  const author = authorOf(context, actor)
  return update(context, request.thread, (thread) => {
    const found = messageIn(thread, request.message)
    if (!mayChangeMessage(author, found))
      throw new CommentRefusal('Only its author can delete a message.')
    if (found === thread.messages[0])
      throw new CommentRefusal(
        'The first message is the comment itself. Edit it, or delete the whole comment instead.',
      )
    thread.messages.splice(thread.messages.indexOf(found), 1)
  })
}

/** Whether the actor is an Admin, by `studio.config.json`. */
function isAdmin(context: CommentsContext, actor: CommentsActor) {
  const contributors = contributorsOf(context)
  const config = configOf(context)
  return (
    roleOf(teamOf(config, contributors), contributors, actor.key) === 'admin'
  )
}

/** Deletes a whole thread, every reply with it. */
export function deleteThread(
  context: CommentsContext,
  actor: CommentsActor,
  request: { thread: string },
) {
  const author = authorOf(context, actor)
  const { prototype, file } = findThread(context, request.thread)
  writable(prototype)
  const { thread, problem } = readThread(
    file,
    `${prototype.folder}/${COMMENTS_FOLDER}/${request.thread}.json`,
  )
  if (!thread)
    throw new CommentRefusal(`${problem} Fix the file, then try again.`, 422)
  if (!mayDeleteThread({ author, admin: isAdmin(context, actor) }, thread))
    throw new CommentRefusal(
      'Only the comment’s author or an Admin can delete it. Resolve it instead when it’s done.',
    )
  rmSync(file)
  return { id: thread.id, deleted: true as const }
}

/**
 * What the asker may do on a prototype, for the page to offer only that:
 * the sentence that refuses every write there (someone unregistered, an
 * archived prototype), or null; who they write as; and whether they are an
 * Admin. The writes check again, whatever the page offered.
 */
export function access(
  context: CommentsContext,
  actor: CommentsActor,
  request: { prototype: string },
): CommentAccess {
  let author: Author
  try {
    author = authorOf(context, actor)
  } catch (error) {
    if (!(error instanceof CommentRefusal) || error.status !== 403) throw error
    return { refusal: error.message, join: true, author: null, admin: false }
  }
  const prototype = prototypeFolders(context).find(
    ({ id }) => id === request.prototype,
  )
  let refusal: string | null = null
  try {
    if (prototype) writable(prototype)
  } catch (error) {
    refusal = (error as Error).message
  }
  return { refusal, join: false, author, admin: isAdmin(context, actor) }
}

/** Opens a resolved thread again; reopening an open one is fine. */
export function reopenThread(
  context: CommentsContext,
  actor: CommentsActor,
  request: { thread: string },
) {
  authorOf(context, actor)
  return update(context, request.thread, (thread) => {
    thread.status = 'open'
    delete thread.resolvedBy
    delete thread.resolvedAt
  })
}
