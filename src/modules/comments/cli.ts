// Comments from the command line, for agents that have no browser:
//
//   yarn comments [prototype folder | address] [--resolved] [--json]
//                                                  the open comments, as text
//   yarn comments show <id>                        one thread, every message
//   yarn comments reply <id> "<text>"              reply as your agent
//   yarn comments resolve <id> [--reply "<text>"]  resolve, with a last reply
//   yarn comments reopen <id>                      open a resolved one again
//
// With no folder or address it lists the prototypes you own. The text is the
// agent text Copy for agent gives (`agentText.ts`), except that the command
// can't render a page, so it never knows a target is gone: it prints the
// stored anchor. Writes go through the same service as the page's, as the
// agent of the contributor your Git identity resolves to; an open page shows
// them at once. Imports only Node, `tooling/` and this module.
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

const USAGE = [
  'yarn comments [prototype folder | address] [--resolved] [--json]',
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

const nameIn = (people: Contributors) => (contributor: string) =>
  Object.values(people).find(({ studioId }) => studioId === contributor)?.name

/** A file of a prototype, with its named states. */
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

interface ListOptions {
  status: CommentThread['status']
  json: boolean
}

async function list(
  given: string | undefined,
  people: Contributors,
  options: ListOptions,
) {
  let prototypes = prototypeFolders(CONTEXT)
  let artifact: string | null = null
  if (given) {
    const scope = scopeOf(given)
    prototypes = [scope.prototype]
    artifact = scope.artifact
  } else {
    const me = actor(people).key
    const id = me ? people[me]?.studioId : undefined
    if (id) prototypes = prototypes.filter(({ owner }) => owner === id)
  }
  const files: AgentTextFile[] = []
  for (const prototype of prototypes) {
    const { threads, problems } = prototypeThreads(prototype)
    for (const problem of problems) console.error(`Warning: ${problem}`)
    let groups = groupsOf(prototype, await filesOf(prototype), threads)
    if (artifact) {
      const named = groups.filter(
        ({ id, text }) =>
          id === artifact || Object.hasOwn(text.states, artifact!),
      )
      if (!named.length)
        fail(
          `“${prototype.title}” has no file ${artifact}, and no comments on one.`,
        )
      groups = named
    }
    for (const { text } of groups)
      files.push({
        ...text,
        threads: text.threads.filter(({ status }) => status === options.status),
      })
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
  return `No ${options.status} comments on ${where}.`
}

async function show(id: string, people: Contributors) {
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

async function main(argv: string[]) {
  const positional: string[] = []
  let reply: string | undefined
  const options: ListOptions = { status: 'open', json: false }
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]!
    if (arg === '--reply')
      reply = argv[++index] ?? fail('--reply needs the text of the reply.')
    else if (arg.startsWith('--reply=')) reply = arg.slice('--reply='.length)
    else if (arg === '--resolved') options.status = 'resolved'
    else if (arg === '--json') options.json = true
    else if (arg === '--help' || arg === 'help') return USAGE
    else if (arg.startsWith('--')) fail(`Unknown option ${arg}.\n${USAGE}`)
    else positional.push(arg)
  }
  const people = contributors()
  const [command, id, text] = positional
  if (command === 'show') {
    if (!id) fail(`Name the comment to show.\n${USAGE}`)
    return show(id!, people)
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
  return list(command, people, options)
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
