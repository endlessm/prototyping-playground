// Repairing references when files move inside a prototype. A module's
// reference adapters (`references` in `module.ts`) know where a kind of
// source names other files: imports, view navigation paths, Markdown links,
// canvas links, CSS URLs. This file decides what each named file was and
// where it went, and writes the changes together, or none of them. Only
// references whose old target is known change; references leave the
// prototype alone. Framework-neutral, so the file service, its watcher and
// the tests share it.
import { lstatSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { MAX_SOURCE_BYTES } from './source.ts'

/** What an adapter is given to resolve the references it finds. */
export interface MoveReferenceContext {
  /**
   * A link relative to the file, as in Markdown or HTML: URL-encoded, its
   * extension optional, with any `?query` or `#anchor`.
   */
  link: (value: string) => string
  /** A path relative to the file; with `imported`, a module specifier. */
  relativeTarget: (value: string, imported?: boolean) => string
  /**
   * A view navigation path inside the prototype (`flows/Sign in`). With
   * `named`, a single-segment path counts too: the value is known to name
   * something to open, such as a `to` attribute or `navigate(…)`.
   */
  navigation: (value: string, named?: boolean) => string
}

/** A kind of source and where it names other files. */
export interface ReferenceAdapter {
  /** The extensions it reads, such as `.vue`. */
  extensions: string[]
  /** The source with its references resolved through the context. */
  move: (source: string, file: string, context: MoveReferenceContext) => string
}

/** Every file a reference can name or hold, with its identity on disk. */
export function snapshotFiles(dir: string) {
  const files = new Map<string, string>()
  const walk = (folder: string, prefix: string) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
      const relative = prefix + entry.name
      const file = path.join(folder, entry.name)
      if (entry.isDirectory()) walk(file, `${relative}/`)
      else if (entry.isFile()) {
        const stat = lstatSync(file, { bigint: true })
        files.set(relative, `${stat.dev}:${stat.ino}:${stat.birthtimeNs}`)
      }
    }
  }
  walk(dir, '')
  return files
}

/**
 * The moves between two snapshots: a file whose identity left one path for
 * another. Copies, and files that are both old and new, are not moves.
 */
export function fileMoves(
  before: Map<string, string>,
  after: Map<string, string>,
) {
  const byIdentity = (files: Map<string, string>) => {
    const paths = new Map<string, string[]>()
    for (const [relative, id] of files)
      paths.set(id, [...(paths.get(id) ?? []), relative])
    return paths
  }
  const old = byIdentity(before)
  const next = byIdentity(after)
  const moves = new Map<string, string>()
  for (const [id, from] of old) {
    const to = next.get(id)
    if (
      from.length === 1 &&
      to?.length === 1 &&
      from[0] !== to[0] &&
      !after.has(from[0]!) &&
      !before.has(to[0]!)
    )
      moves.set(from[0]!, to[0]!)
  }
  return moves
}

/** The moves when `from` (a file or folder) became `to`. */
export function movesOf(before: Iterable<string>, from: string, to: string) {
  const moves = new Map<string, string>()
  for (const file of before)
    if (file === from || file.startsWith(`${from}/`))
      moves.set(file, to + file.slice(from.length))
  return moves
}

// What an extensionless reference may be: the file's own name, a type's
// extension, or a folder's index.
const EXTENSIONS = [
  '',
  '.vue',
  '.ts',
  '.js',
  '.mts',
  '.mjs',
  '.tsx',
  '.jsx',
  '.md',
  '.css',
  '.json',
  '/index.ts',
  '/index.js',
  '/index.vue',
]
const slug = (value: string) => value.replace(/\.[^./]+$/, '')
const encode = (value: string) =>
  value.split('/').map(encodeURIComponent).join('/')
const splitSuffix = (value: string) => {
  const at = value.search(/[?#]/)
  return at < 0 ? [value, ''] : [value.slice(0, at), value.slice(at)]
}

export const adapterFor = (adapters: ReferenceAdapter[], file: string) =>
  adapters.find((adapter) =>
    adapter.extensions.some((extension) =>
      file.toLowerCase().endsWith(extension),
    ),
  )

/**
 * One file's source with its references repaired: the file was `oldFile`
 * and is now `newFile`, among the files `before` the moves.
 */
export function repairText(
  text: string,
  oldFile: string,
  newFile: string,
  before: ReadonlySet<string>,
  moves: ReadonlyMap<string, string>,
  adapter: ReferenceAdapter,
) {
  const slugMoves = new Map(
    [...moves].map(([from, to]) => [slug(from), slug(to)]),
  )
  const relativeTarget = (value: string, imported = false) => {
    const [raw, suffix] = splitSuffix(value) as [string, string]
    if (!raw || /^(?:[a-z][\w+.-]*:|\/\/|\/)/i.test(raw)) return value
    if (imported && !raw.startsWith('.')) return value
    let decoded: string
    try {
      decoded = imported ? raw : decodeURIComponent(raw)
    } catch {
      return value
    }
    const wanted = path.posix.normalize(
      path.posix.join(path.posix.dirname(oldFile), decoded),
    )
    if (wanted === '..' || wanted.startsWith('../')) return value
    let target = EXTENSIONS.map((extension) => wanted + extension).find(
      (candidate) => before.has(candidate),
    )
    let extensionless = Boolean(target && !imported && slug(target) === wanted)
    if (!target && !imported) {
      target = [...before].find((file) => slug(file) === wanted)
      extensionless = Boolean(target)
    }
    if (!target) return value
    const mapped = moves.get(target) ?? target
    if (mapped === target && oldFile === newFile) return value
    let destination = extensionless ? slug(mapped) : mapped
    // Extensionless imports stay so; a folder's index stays the folder.
    if (imported && wanted !== target)
      destination = /\/index\.[^./]+$/.test(target)
        ? path.posix.dirname(mapped)
        : slug(mapped)
    let next = path.posix.relative(path.posix.dirname(newFile), destination)
    if ((imported || raw.startsWith('./')) && !next.startsWith('.'))
      next = `./${next}`
    return (imported ? next : encode(next)) + suffix
  }
  const navigation = (value: string, named = false) => {
    const [target, suffix] = splitSuffix(value) as [string, string]
    const mapped = moves.get(target) ?? slugMoves.get(target)
    return mapped && (target.includes('/') || named) ? mapped + suffix : value
  }
  const next = adapter.move(text, newFile, {
    link: (value) => relativeTarget(value),
    relativeTarget,
    navigation,
  })
  if (typeof next !== 'string' || Buffer.byteLength(next) > MAX_SOURCE_BYTES)
    throw new Error(`${newFile}: its references came back unreadable.`)
  return next
}

/**
 * Repairs the references in a prototype's files after `moves` (old path →
 * new path, inside the prototype), given the files there were `before`.
 * Every change is prepared first; then each file is checked unchanged since
 * it was read, and all are written, or none. Returns the changed files.
 */
export function repairReferences(
  dir: string,
  before: ReadonlySet<string>,
  moves: ReadonlyMap<string, string>,
  adapters: ReferenceAdapter[],
) {
  if (!moves.size || !adapters.length) return []
  const origin = new Map([...moves].map(([from, to]) => [to, from]))
  const changes: { file: string; content: string; next: string }[] = []
  for (const relative of snapshotFiles(dir).keys()) {
    const adapter = adapterFor(adapters, relative)
    if (!adapter) continue
    const file = path.join(dir, relative)
    const stat = lstatSync(file)
    if (!stat.isFile() || stat.size > MAX_SOURCE_BYTES) continue
    const content = readFileSync(file, 'utf8')
    const next = repairText(
      content,
      origin.get(relative) ?? relative,
      relative,
      before,
      moves,
      adapter,
    )
    if (next !== content) changes.push({ file, content, next })
  }
  for (const { file, content } of changes)
    if (readFileSync(file, 'utf8') !== content)
      throw new Error('A file changed while its references were updated.')
  const written: typeof changes = []
  try {
    for (const change of changes) {
      writeFileSync(change.file, change.next)
      written.push(change)
    }
  } catch (error) {
    for (const change of written) writeFileSync(change.file, change.content)
    throw error
  }
  return changes.map(({ file }) =>
    path.relative(dir, file).split(path.sep).join('/'),
  )
}
