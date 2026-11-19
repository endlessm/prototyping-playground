// The agents' side of comments, shared by `yarn comments` (cli.ts) and the
// local MCP server (mcp.ts), so both print the same agent text and write
// through the same service: listing, one thread, reply, resolve and reopen,
// and which threads await the agent. Writes are made as the agent of the
// contributor your Git identity resolves to; an open page shows them at
// once. Imports only Node, `tooling/` and this module.
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveIdentity } from '../../../tooling/contributors/identity.ts'
import {
  readContributors,
  type Contributors,
} from '../../../tooling/contributors/profiles.ts'
import {
  identityFileTypes,
  type IdentityFileType,
} from '../../../tooling/identity/file-types.ts'
import { isResourceId } from '../../../tooling/identity/resource-id.ts'
import { arrangedFiles } from '../../../tooling/manifest/build.ts'
import { artifactTitle } from '../../../tooling/manifest/titles.ts'
import { loadRegistry } from '../../../tooling/modules/registry.ts'
import { agentText, type AgentTextFile } from './agentText.ts'
import {
  CommentRefusal,
  findThread,
  prototypeFolders,
  prototypeThreads,
  reopenThread,
  replyToThread,
  resolveThread,
  type CommentsActor,
  type CommentsContext,
  type PrototypeFolder,
} from './service.ts'
import { byCreation, threadNumbers, type CommentThread } from './threads.ts'

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
)
const CONTEXT: CommentsContext = { root: ROOT }

/** A mistake in what was asked, as a sentence saying what to do instead. */
export class CommandStop extends Error {}
const fail = (message: string): never => {
  throw new CommandStop(message)
}

/** Both kinds of refusal carry a sentence meant for the person or agent. */
export const isRefusal = (error: unknown): error is Error =>
  error instanceof CommandStop || error instanceof CommentRefusal

export function contributors(): Contributors {
  const { contributors, problems } = readContributors(
    ROOT,
    process.env.STUDIO_CONTRIBUTORS || 'contributors',
  )
  if (problems.length) fail(problems.join('\n'))
  return contributors
}

/** The contributor your Git identity resolves to, writing as their agent. */
function actor(people: Contributors): CommentsActor {
  const identity = resolveIdentity(ROOT, people)
  return { key: identity.key, email: identity.email, agent: true }
}

const nameIn = (people: Contributors) => (contributor: string) =>
  Object.values(people).find(({ studioId }) => studioId === contributor)?.name

/**
 * Whether a thread waits on the agent: sent to it, open, with a person's
 * message last. Sending it, or a person's reply after the agent's, makes it
 * so; the agent's reply, resolving it or no longer sending it ends it.
 */
export const awaitsAgent = (thread: CommentThread) =>
  Boolean(thread.sentToAgent) &&
  thread.status === 'open' &&
  !thread.messages.at(-1)?.author.agent

/** A prototype's file, with its named states. */
interface FileRecord {
  id: string
  title: string
  file: string
  type: string
  states: { id: string; title: string }[]
}

let fileTypes: Promise<IdentityFileType[]> | undefined
async function enabledFileTypes() {
  fileTypes ??= loadRegistry(ROOT, {
    modulesFolder: process.env.STUDIO_MODULES || undefined,
    configFile: process.env.STUDIO_CONFIG || undefined,
  })
    .then((registry) => identityFileTypes(registry.enabled))
    // Without the registry no file is known: every comment is listed by its
    // stored title.
    .catch(() => [])
  return fileTypes
}

/** A prototype's files, in its tree's order, as the manifest reads them. */
async function filesOf(prototype: PrototypeFolder): Promise<FileRecord[]> {
  const types = await enabledFileTypes()
  const files: FileRecord[] = []
  for (const name of arrangedFiles(prototype.dir)) {
    const extension = path.extname(name).toLowerCase()
    const type = types.find(({ extensions }) => extensions.includes(extension))
    if (!type) continue
    try {
      const source = readFileSync(path.join(prototype.dir, name), 'utf8')
      const id = type.identity.read(source)
      if (!id) continue
      files.push({
        id,
        title: artifactTitle(
          path.posix.basename(name.slice(0, -extension.length)),
        ),
        file: `${prototype.folder}/${name}`,
        type: type.id,
        states: (type.identity.children?.read(source) ?? []).flatMap(
          ({ key, studioId }) =>
            studioId ? [{ id: studioId, title: key }] : [],
        ),
      })
    } catch {
      // A malformed file: its comments are listed as on a removed one.
    }
  }
  return files
}

/**
 * A prototype's threads by file: a view's with all its named states', each
 * group numbered together as the page numbers them. Threads on a file that
 * no longer exists form a group of their own, under their stored title.
 */
function groupsOf(
  prototype: PrototypeFolder,
  files: FileRecord[],
  threads: CommentThread[],
) {
  const fileOf = new Map(
    files.flatMap((record) => [
      [record.id, record] as const,
      ...record.states.map(({ id }) => [id, record] as const),
    ]),
  )
  const groups = new Map<
    string,
    { record: FileRecord | null; threads: CommentThread[] }
  >()
  for (const record of files) groups.set(record.id, { record, threads: [] })
  for (const thread of byCreation(threads)) {
    const key = fileOf.get(thread.artifact)?.id ?? thread.artifact
    if (!groups.has(key)) groups.set(key, { record: null, threads: [] })
    groups.get(key)!.threads.push(thread)
  }
  return [...groups].map(([id, { record, threads }]) => ({
    id,
    threads,
    text: {
      type: record?.type ?? null,
      title: (record?.title ?? threads[0]?.artifactTitle) || id,
      file: record?.file ?? null,
      address: `/prototypes/${prototype.id}/artifacts/${id}`,
      threads,
      numbers: threadNumbers(threads),
      states: Object.fromEntries(
        (record?.states ?? []).map(({ id, title }) => [id, title]),
      ),
      prototype: { title: prototype.title, folder: prototype.folder },
    } satisfies AgentTextFile,
  }))
}

/** The prototype a folder argument names. */
function prototypeAt(given: string) {
  const dir = path.resolve(process.cwd(), given)
  const real = existsSync(dir) ? realpathSync(dir) : dir
  const prototype = prototypeFolders(CONTEXT).find(
    (candidate) =>
      (existsSync(candidate.dir)
        ? realpathSync(candidate.dir)
        : candidate.dir) === real,
  )
  return (
    prototype ??
    fail(
      `${given} isn't a prototype folder or address. Name a folder such as src/prototypes/<contributor>/<prototype>, or an address such as /prototypes/<id>/artifacts/<id>.`,
    )
  )
}

// Found anywhere in the argument, so a whole URL works, and so does an
// address a shell has turned into a file path.
const ADDRESS = /\/prototypes\/([0-9a-z]{16})(?:\/artifacts\/([0-9a-z]{16}))?/

/** What the argument names: a prototype, and maybe one file in it. */
function scopeOf(given: string) {
  const address = ADDRESS.exec(given)
  if (!address || !isResourceId(address[1]))
    return { prototype: prototypeAt(given), artifact: null }
  const prototype =
    prototypeFolders(CONTEXT).find(({ id }) => id === address[1]) ??
    fail(`There is no prototype ${address[1]}.`)
  return { prototype, artifact: address[2] ?? null }
}

/** The prototypes, and maybe the one file, a scope names; yours by default. */
function scopedPrototypes(given: string | undefined, people: Contributors) {
  if (given) {
    const scope = scopeOf(given)
    return { prototypes: [scope.prototype], artifact: scope.artifact }
  }
  const me = actor(people)
  const id = me.key ? people[me.key]?.studioId : undefined
  if (!id)
    throw new CommentRefusal(
      `Your Git identity (${me.email || 'no Git email set'}) doesn't match a contributor profile, so you have no prototypes of your own to list. Name a prototype folder or an address instead.`,
    )
  return {
    prototypes: prototypeFolders(CONTEXT).filter(({ owner }) => owner === id),
    artifact: null,
  }
}

export interface ListOptions {
  status: CommentThread['status']
  json?: boolean
  /** Only the threads waiting on the agent (`awaitsAgent`). */
  awaiting?: boolean
  /** Only these threads. */
  only?: ReadonlySet<string>
  /** Problems reading thread files, which a command prints as warnings. */
  warn?: (problem: string) => void
}

/** The comments a scope holds, as agent text or JSON. */
export async function list(
  given: string | undefined,
  people: Contributors,
  options: ListOptions,
) {
  const { prototypes, artifact } = scopedPrototypes(given, people)
  const wanted = (thread: CommentThread) =>
    thread.status === options.status &&
    (!options.awaiting || awaitsAgent(thread)) &&
    (!options.only || options.only.has(thread.id))
  const files: AgentTextFile[] = []
  for (const prototype of prototypes) {
    const { threads, problems } = prototypeThreads(prototype)
    for (const problem of problems) options.warn?.(problem)
    let groups = groupsOf(prototype, await filesOf(prototype), threads)
    if (artifact) {
      const named = groups.filter(
        ({ id, text }) =>
          id === artifact || Object.hasOwn(text.states, artifact),
      )
      if (!named.length)
        fail(
          `“${prototype.title}” has no file ${artifact}, and no comments on one.`,
        )
      groups = named
    }
    for (const { text } of groups)
      files.push({ ...text, threads: text.threads.filter(wanted) })
  }
  if (options.json)
    return JSON.stringify(
      files.flatMap((file) =>
        file.threads.map((thread) => ({
          ...thread,
          number: file.numbers.get(thread.id),
          file: file.file,
          // The thread's own: a named state's opens on that state.
          address: file.address.replace(/[^/]+$/, thread.artifact),
        })),
      ),
      null,
      2,
    )
  const text = agentText(files, {
    name: nameIn(people),
    status: options.status,
  })
  if (text) return text.trimEnd()
  const where = !given
    ? 'your prototypes'
    : `“${(artifact && files[0]?.title) || prototypes[0]!.title}”`
  const which = options.awaiting ? 'open comments waiting on you' : null
  return `No ${which ?? `${options.status} comments`} on ${where}.`
}

/**
 * The threads in a scope waiting on the agent, each with its last message's
 * ID: a new comment, or a new message on one, changes the pair.
 */
export function awaiting(given: string | undefined, people: Contributors) {
  const { prototypes, artifact } = scopedPrototypes(given, people)
  const waiting = new Map<string, string>()
  for (const prototype of prototypes)
    for (const thread of prototypeThreads(prototype).threads)
      if (awaitsAgent(thread) && (!artifact || thread.artifact === artifact))
        waiting.set(thread.id, thread.messages.at(-1)?.id ?? '')
  return waiting
}

/** One thread, resolved or not, with every message. */
export async function show(id: string, people: Contributors) {
  const { prototype } = findThread(CONTEXT, id)
  const { threads } = prototypeThreads(prototype)
  const group = groupsOf(prototype, await filesOf(prototype), threads).find(
    (candidate) => candidate.threads.some((thread) => thread.id === id),
  )
  const thread = group?.threads.find((candidate) => candidate.id === id)
  if (!group || !thread) return fail(`The file of comment ${id} can't be read.`)
  return agentText(
    [{ ...group.text, prototype: undefined, threads: [thread] }],
    {
      name: nameIn(people),
      one: true,
    },
  ).trimEnd()
}

export function reply(id: string, body: string, people: Contributors) {
  replyToThread(CONTEXT, actor(people), { thread: id, body })
  return `Replied to comment ${id}.`
}

export function resolve(
  id: string,
  last: string | undefined,
  people: Contributors,
) {
  resolveThread(CONTEXT, actor(people), {
    thread: id,
    ...(last !== undefined && { reply: last }),
  })
  return `Resolved comment ${id}.`
}

export function reopen(id: string, people: Contributors) {
  reopenThread(CONTEXT, actor(people), { thread: id })
  return `Reopened comment ${id}.`
}
