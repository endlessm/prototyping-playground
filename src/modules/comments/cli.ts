// Comments from the command line, for agents that have no browser:
//
//   yarn comments [prototype folder]               the open comments, as text
//   yarn comments show <id>                        one thread, every message
//   yarn comments reply <id> "<text>"              reply as your agent
//   yarn comments resolve <id> [--reply "<text>"]  resolve, with a last reply
//   yarn comments reopen <id>                      open a resolved one again
//
// With no folder it lists the prototypes you own. Writes go through the same
// service as the page's, as the agent of the contributor your Git identity
// resolves to; an open page shows them at once. Imports only Node,
// `tooling/` and this module.
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveIdentity } from '../../../tooling/contributors/identity.ts'
import {
  readContributors,
  type Contributors,
} from '../../../tooling/contributors/profiles.ts'
import { identityFileTypes } from '../../../tooling/identity/file-types.ts'
import { listed } from '../../../tooling/manifest/build.ts'
import { loadRegistry } from '../../../tooling/modules/registry.ts'
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
import { threadNumbers, type Author, type CommentThread } from './threads.ts'

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
)
const CONTEXT: CommentsContext = { root: ROOT }

const USAGE = [
  'yarn comments [prototype folder]',
  'yarn comments show <id>',
  'yarn comments reply <id> "<text>"',
  'yarn comments resolve <id> [--reply "<text>"]',
  'yarn comments reopen <id>',
].join('\n')

class Stop extends Error {}
const fail = (message: string): never => {
  throw new Stop(message)
}

function contributors(): Contributors {
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

function authorName(author: Author, people: Contributors) {
  const profile = Object.values(people).find(
    ({ studioId }) => studioId === author.contributor,
  )
  const name = profile?.name ?? author.contributor
  return author.agent ? `${name.split(/\s+/)[0]}'s agent (Agent)` : name
}

/**
 * Which artifact each permanent ID belongs to for numbering: a named state
 * counts with its view, so a view's threads are numbered together.
 */
async function viewsOf(prototype: PrototypeFolder) {
  const views = new Map<string, string>()
  try {
    const registry = await loadRegistry(ROOT, {
      modulesFolder: process.env.STUDIO_MODULES || undefined,
      configFile: process.env.STUDIO_CONFIG || undefined,
    })
    const types = (await identityFileTypes(registry.enabled)).filter(
      (type) => type.identity.children,
    )
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (!listed(entry.name)) continue
        const file = path.join(dir, entry.name)
        if (entry.isDirectory()) walk(file)
        const type = types.find((candidate) =>
          candidate.extensions.includes(path.extname(file).toLowerCase()),
        )
        if (!type || !entry.isFile()) continue
        try {
          const source = readFileSync(file, 'utf8')
          const id = type.identity.read(source)
          if (!id) continue
          for (const child of type.identity.children!.read(source))
            if (child.studioId) views.set(child.studioId, id)
        } catch {
          // A malformed file: its threads are numbered on their own.
        }
      }
    }
    walk(prototype.dir)
  } catch {
    // Without the registry, every artifact is numbered on its own.
  }
  return views
}

async function numbered(prototype: PrototypeFolder, threads: CommentThread[]) {
  const views = await viewsOf(prototype)
  const groups = new Map<string, CommentThread[]>()
  for (const thread of threads) {
    const group = views.get(thread.artifact) ?? thread.artifact
    groups.set(group, [...(groups.get(group) ?? []), thread])
  }
  const numbers = new Map<string, number>()
  for (const group of groups.values())
    for (const [id, number] of threadNumbers(group)) numbers.set(id, number)
  return numbers
}

const quoted = (text: unknown) =>
  typeof text === 'string' && text ? `"${text}"` : ''

function threadText(
  thread: CommentThread,
  number: number | undefined,
  people: Contributors,
) {
  const anchor = thread.anchor
  const lines = [
    `#${number ?? '?'} ${anchor.label ?? anchor.kind} on ${thread.artifactTitle || thread.artifact}${thread.status === 'resolved' ? ' (resolved)' : ''}`,
    `   ID: ${thread.id}  Artifact: ${thread.artifact}`,
  ]
  const where = [
    typeof anchor.path === 'string' && anchor.path
      ? `Path: ${anchor.path}`
      : '',
    anchor.text ? `Text: ${quoted(anchor.text)}` : '',
    anchor.quote ? `Quote: ${quoted(anchor.quote)}` : '',
  ].filter(Boolean)
  if (where.length) lines.push(`   ${where.join('  ')}`)
  for (const message of thread.messages)
    lines.push(`   ${authorName(message.author, people)}: ${message.body}`)
  if (thread.status === 'resolved' && thread.resolvedBy)
    lines.push(`   Resolved by ${authorName(thread.resolvedBy, people)}`)
  return lines.join('\n')
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
      `${given} isn't a prototype folder. A prototype is at src/prototypes/<contributor>/<prototype>, with a meta.json.`,
    )
  )
}

async function list(given: string | undefined, people: Contributors) {
  let prototypes = prototypeFolders(CONTEXT)
  if (given) prototypes = [prototypeAt(given)]
  else {
    const me = actor(people).key
    const id = me ? people[me]?.studioId : undefined
    if (id) prototypes = prototypes.filter(({ owner }) => owner === id)
  }
  const sections: string[] = []
  let total = 0
  for (const prototype of prototypes) {
    const { threads, problems } = prototypeThreads(prototype)
    for (const problem of problems) console.error(`Warning: ${problem}`)
    const open = threads.filter(({ status }) => status === 'open')
    if (!open.length && !given) continue
    total += open.length
    const numbers = await numbered(prototype, threads)
    sections.push(
      [
        `${prototype.title} — ${prototype.folder}`,
        `${open.length} open comment${open.length === 1 ? '' : 's'}`,
        ...open.map((thread) =>
          threadText(thread, numbers.get(thread.id), people),
        ),
      ].join('\n\n'),
    )
  }
  if (!sections.length)
    return given ? '' : 'No open comments on your prototypes.'
  return [
    ...sections,
    total
      ? 'Reply with `yarn comments reply <id> "<text>"`. Resolve only when the person asks, with `yarn comments resolve <id> [--reply "<text>"]`.'
      : '',
  ]
    .filter(Boolean)
    .join('\n\n')
}

async function main(argv: string[]) {
  const positional: string[] = []
  let reply: string | undefined
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]!
    if (arg === '--reply')
      reply = argv[++index] ?? fail('--reply needs the text of the reply.')
    else if (arg.startsWith('--reply=')) reply = arg.slice('--reply='.length)
    else if (arg === '--help' || arg === 'help') return USAGE
    else if (arg.startsWith('--')) fail(`Unknown option ${arg}.\n${USAGE}`)
    else positional.push(arg)
  }
  const people = contributors()
  const [command, id, text] = positional
  if (command === 'show') {
    if (!id) fail(`Name the comment to show.\n${USAGE}`)
    const { prototype } = findThread(CONTEXT, id!)
    const thread = prototypeThreads(prototype).threads.find(
      (candidate) => candidate.id === id,
    )
    if (!thread) fail(`The file of comment ${id} can't be read.`)
    const numbers = await numbered(
      prototype,
      prototypeThreads(prototype).threads,
    )
    return threadText(thread!, numbers.get(id!), people)
  }
  if (command === 'reply') {
    if (!id || text === undefined)
      fail(`Name the comment and the reply.\n${USAGE}`)
    replyToThread(CONTEXT, actor(people), { thread: id!, body: text })
    return `Replied to comment ${id}.`
  }
  if (command === 'resolve') {
    if (!id) fail(`Name the comment to resolve.\n${USAGE}`)
    resolveThread(CONTEXT, actor(people), {
      thread: id!,
      ...(reply !== undefined && { reply }),
    })
    return `Resolved comment ${id}.`
  }
  if (command === 'reopen') {
    if (!id) fail(`Name the comment to reopen.\n${USAGE}`)
    reopenThread(CONTEXT, actor(people), { thread: id! })
    return `Reopened comment ${id}.`
  }
  if (positional.length > 1) fail(USAGE)
  return list(command, people)
}

try {
  const output = await main(process.argv.slice(2))
  if (output) console.log(output)
} catch (error) {
  if (!(error instanceof Stop) && !(error instanceof CommentRefusal))
    throw error
  console.error(error.message)
  process.exitCode = 1
}
