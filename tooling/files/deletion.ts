// Deleting a prototype for good, as agents do (`yarn studio
// delete-prototype`): first a preview of what would break or be lost (links
// from other prototypes, canvas and document references, files Git doesn't
// have), then the removal, which leaves the folder where it was if another
// program holds it. The studio's own Delete moves the folder to the
// computer's trash instead (`organize.ts`). Only Node built-ins, so the
// command line can run it.
import { execFileSync } from 'node:child_process'
import {
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
} from 'node:fs'
import path from 'node:path'
import type { ModulePrototypeFolder } from '../modules/contract.ts'
import { MAX_SOURCE_BYTES } from './source.ts'

/** A file in another prototype that names the one being deleted. */
export interface IncomingFile {
  /** Repository-relative, with forward slashes. */
  path: string
  /** Canvases and documents show their broken references; code just breaks. */
  kind: 'canvas' | 'document' | 'link'
  /** The addresses and relative paths it names, sorted. */
  references: string[]
}

export interface DeletionPlan {
  folder: string
  /** The contributor folder it is in. */
  owner: string
  title: string
  prototypeId: string | null
  /** Code and other files linking to it. */
  incoming: IncomingFile[]
  /** Canvases and documents referencing it. */
  breaking: IncomingFile[]
  /** Whether the studio is a Git repository; without one, nothing is known. */
  git: boolean
  untracked: string[]
  modified: string[]
  /** What modules keep in its hidden folders, such as comments; none empty. */
  held: HeldFiles[]
}

/** The files in one module's hidden prototype folder. */
export interface HeldFiles extends ModulePrototypeFolder {
  count: number
}

const slash = (value: string) => value.split(path.sep).join('/')
const kindOf = (file: string): IncomingFile['kind'] =>
  file.endsWith('.excalidraw')
    ? 'canvas'
    : /\.mdx?$/.test(file)
      ? 'document'
      : 'link'
// A relative path written in a file: `./x` or `../x`, quoted, in Markdown
// parentheses or after a space.
const RELATIVE = /(?<=["'`(\s]|^)(\.\.?\/[^\s"'`()<>?#]*)/gm
const SKIPPED = new Set(['.git', 'node_modules', '.trash'])

function* textFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIPPED.has(entry.name) || entry.name.startsWith('.')) continue
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* textFiles(file)
    else if (entry.isFile() && lstatSync(file).size <= MAX_SOURCE_BYTES)
      yield file
  }
}

const folders = (dir: string) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
        .map((entry) => path.join(dir, entry.name))
    : []

/**
 * Files in other prototypes that name this one: its permanent address (and
 * its artifacts'), or a relative path into its folder.
 */
export function incomingReferences(
  root: string,
  prototypesDir: string,
  dir: string,
  prototypeId: string | null,
): IncomingFile[] {
  const address = prototypeId
    ? new RegExp(
        `/prototypes/${prototypeId}(?:/artifacts/[0-9a-z]{16})?(?![0-9a-z])`,
        'g',
      )
    : null
  const others = folders(prototypesDir)
    .flatMap(folders)
    .filter((other) => other !== dir)
    .sort()
  return others.flatMap((other) =>
    [...textFiles(other)].sort().flatMap((file) => {
      const text = readFileSync(file, 'utf8')
      const references = new Set([
        ...((address && text.match(address)) ?? []),
        ...[...text.matchAll(RELATIVE)]
          .map((match) => match[1]!)
          .filter((value) => {
            const resolved = path.resolve(path.dirname(file), value)
            return resolved === dir || resolved.startsWith(dir + path.sep)
          }),
      ])
      const relative = slash(path.relative(root, file))
      return references.size
        ? [
            {
              path: relative,
              kind: kindOf(relative),
              references: [...references].sort(),
            },
          ]
        : []
    }),
  )
}

function countFiles(dir: string): number {
  return readdirSync(dir, { withFileTypes: true }).reduce(
    (total, entry) =>
      total +
      (entry.isDirectory()
        ? countFiles(path.join(dir, entry.name))
        : entry.isFile()
          ? 1
          : 0),
    0,
  )
}

/**
 * How many files each module keeps in the prototype in `dir`, leaving out
 * folders that are missing or empty (deleting the last comment leaves one).
 */
export function heldFiles(
  dir: string,
  folders: ModulePrototypeFolder[],
): HeldFiles[] {
  return folders.flatMap((folder) => {
    const inside = path.join(dir, folder.name)
    const count =
      existsSync(inside) && lstatSync(inside).isDirectory()
        ? countFiles(inside)
        : 0
    return count ? [{ ...folder, count }] : []
  })
}

/** "2 comments and 1 note", in each module's words. */
export const heldPhrase = (held: HeldFiles[]) =>
  new Intl.ListFormat('en', { type: 'conjunction' }).format(
    held.map(
      ({ count, one, other }) => `${count} ${count === 1 ? one : other}`,
    ),
  )

/** Untracked and modified files under `folder`, from Git, if it is there. */
export function gitChanges(root: string, folder: string) {
  const files = (...args: string[]) =>
    [
      ...new Set(
        execFileSync('git', ['ls-files', '-z', ...args, '--', folder], {
          cwd: root,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        })
          .split('\0')
          .filter(Boolean),
      ),
    ].sort()
  try {
    return {
      git: true,
      untracked: files('--others', '--exclude-standard'),
      modified: files('--modified'),
    }
  } catch {
    return { git: false, untracked: [] as string[], modified: [] as string[] }
  }
}

/** What deleting the prototype in `dir` would break or lose. */
export function planDeletion(
  root: string,
  prototypesDir: string,
  dir: string,
  folders: ModulePrototypeFolder[] = [],
): DeletionPlan {
  const folder = slash(path.relative(root, dir))
  let meta: Record<string, unknown> = {}
  try {
    meta = JSON.parse(readFileSync(path.join(dir, 'meta.json'), 'utf8'))
  } catch {
    // Unreadable metadata: the folder is still deleted by its name.
  }
  const prototypeId = typeof meta.studioId === 'string' ? meta.studioId : null
  const incoming = incomingReferences(root, prototypesDir, dir, prototypeId)
  return {
    folder,
    owner: path.basename(path.dirname(dir)),
    title: typeof meta.title === 'string' ? meta.title : path.basename(dir),
    prototypeId,
    incoming: incoming.filter(({ kind }) => kind === 'link'),
    breaking: incoming.filter(({ kind }) => kind !== 'link'),
    ...gitChanges(root, folder),
    held: heldFiles(dir, folders),
  }
}

/** The preview, as lines for a terminal. */
export function deletionPreview(plan: DeletionPlan) {
  const list = <T>(heading: string, items: T[], line: (item: T) => string) =>
    items.length ? [heading, ...items.map((item) => `  ${line(item)}`)] : []
  const references = (file: IncomingFile) =>
    `${file.path}: ${file.references.join(', ')}`
  return [
    `Delete prototype ${plan.folder} (“${plan.title}”). This permanently removes the folder.`,
    ...(plan.held.length
      ? [`It holds ${heldPhrase(plan.held)}, which would be deleted with it.`]
      : []),
    ...list(
      'Incoming links from other prototypes that would break:',
      plan.incoming,
      references,
    ),
    ...list(
      'Canvas and document references that would break:',
      plan.breaking,
      references,
    ),
    ...(plan.git
      ? [
          ...list(
            'Untracked files that would be lost (not in Git):',
            plan.untracked,
            (file) => file,
          ),
          ...list(
            'Uncommitted changes that would be lost:',
            plan.modified,
            (file) => file,
          ),
        ]
      : [
          'This studio is not a Git repository, so every file in the folder would be lost.',
        ]),
    ...(plan.incoming.length || plan.breaking.length
      ? []
      : ['No other prototype links to it.']),
  ]
}

/** A folder another program is using; nothing was deleted. */
export class HeldFolder extends Error {}

/**
 * Removes the prototype's folder for good. It is first moved aside, so a
 * folder another program holds stays where it was, whole.
 */
export function deleteFolder(root: string, dir: string) {
  const aside = path.join(
    path.dirname(dir),
    `.deleting-${path.basename(dir)}-${process.pid}`,
  )
  const held = () =>
    new HeldFolder(
      `Another program is using ${slash(path.relative(root, dir))}. Close it, then run the command again. Nothing was deleted.`,
    )
  try {
    renameSync(dir, aside)
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code ?? ''
    if (['EPERM', 'EBUSY', 'EACCES'].includes(code)) throw held()
    throw error
  }
  try {
    rmSync(aside, { recursive: true, maxRetries: 3 })
  } catch {
    // Put back whatever is left, so nothing is half gone where it was.
    if (existsSync(aside)) renameSync(aside, dir)
    throw held()
  }
}
