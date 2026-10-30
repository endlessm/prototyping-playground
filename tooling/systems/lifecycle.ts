// A design system's lifecycle: creating one from the Vue template, renaming
// it (name, folder, registration and references together), archiving it
// with its prototypes, restoring it, and deleting it while its prototypes
// keep their files and wait for a rebuild. The studio command and the dev
// server's file service share these plans: each is previewed first (what
// changes, which prototypes, which folders another program holds), then
// applied under one marker, so two never run at once, and undone entirely
// when a step fails. Node built-ins only, as the studio command loads it.
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { newStudioId, studioIdsInUse } from '../contributors/studio-ids.ts'
import {
  describeDevServer,
  isAlive,
  readDevServer,
} from '../dev-server/registry.ts'
import {
  heldSentence,
  HeldError,
  moveFolder,
  probeFolder,
  type DescribeHolder,
  type FolderOps,
} from '../files/folder-locks.ts'
import { ID, PLAIN_TEXT } from '../modules/registry.ts'
import { editConfig } from '../settings/config-file.ts'
import { loadSystems, SYSTEMS_FOLDER } from './registry.ts'

export const OPERATION_MARKER = '.studio-system-operation'
const TEMPLATE = fileURLToPath(
  new URL('../studio/templates/system/', import.meta.url),
)
/** A marker older than this belongs to an operation that died. */
const STALE_MARKER = 10 * 60_000

export type LifecycleAction =
  'create' | 'rename' | 'archive' | 'restore' | 'delete'

/** A refusal, with the HTTP status the file service answers with. */
export class LifecycleError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

export interface LifecycleOptions {
  root: string
  /** Relative to the root; `src/systems` unless the scenarios move it. */
  systemsFolder?: string
  configFile?: string
  prototypesFolder?: string
  /** Runs yarn in the root, to refresh the lockfile. */
  yarn?: (args: string[]) => void
  /** File system steps of folder moves, for tests. */
  ops?: FolderOps
  /** Names what holds a folder; the recorded dev server by default. */
  describeHolder?: DescribeHolder
  platform?: NodeJS.Platform
}

/** A file the plan writes: `null` before means new, after means removed. */
export interface Edit {
  file: string
  before: string | null
  after: string | null
}

/** A prototype that uses the system or waits to be rebuilt with it. */
export interface Dependent {
  id: string
  title: string
  /** Repository-relative, with forward slashes. */
  folder: string
  archived: boolean
  /** Its rebuild targets this system. */
  pending: boolean
}

export interface LifecyclePlan {
  action: LifecycleAction
  /** The folder key before, and after (they differ on a rename). */
  key: string
  nextKey: string
  label: string
  studioId: string
  edits: Edit[]
  move: { from: string; to: string } | null
  remove: string | null
  dependents: Dependent[]
  /** Other files whose references to the system's folder were repaired. */
  references: number
  /** Files still naming the old folder, which an agent should review. */
  review: string[]
  /** Whether the lockfile is refreshed: the folder is a yarn workspace. */
  install: boolean
}

export interface LifecycleResult {
  action: LifecycleAction
  key: string
  studioId: string
  prototypes: number
  references: number
}

const posix = (file: string) => file.split(path.sep).join('/')
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`
const read = (file: string) => readFileSync(file, 'utf8')

function settings(options: LifecycleOptions) {
  const root = options.root
  const folder = options.systemsFolder ?? SYSTEMS_FOLDER
  return {
    root,
    folder,
    systemsDir: path.resolve(root, folder),
    configFile: path.resolve(root, options.configFile ?? 'studio.config.json'),
    prototypesDir: path.resolve(
      root,
      options.prototypesFolder ?? 'src/prototypes',
    ),
  }
}

/** "Harbor Ops" → "harbor-ops"; accents go. */
export const systemKey = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** The problem with a system's name, or null. */
export function nameProblem(name: unknown) {
  const trimmed = typeof name === 'string' ? name.trim() : ''
  if (!trimmed || trimmed.length > 120 || !PLAIN_TEXT.test(trimmed))
    return 'Use a plain name between 1 and 120 characters.'
  if (!/^[a-z]/.test(systemKey(trimmed))) return 'Start the name with a letter.'
  return null
}

const titleOf = (key: string) =>
  key
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

// ---------------------------------------------------------------------------
// Reading what is there

type Config = Record<string, unknown> & {
  systems?: string[]
  defaultSystem?: string | null
  modules?: Record<string, boolean>
  systemMaintainers?: Record<string, string[]>
}

function readConfig(configFile: string): { source: string; config: Config } {
  const source = read(configFile)
  return { source, config: JSON.parse(source) as Config }
}

/** A top-level field of a declaration, read as text: the least indented. */
function field(source: string, name: string) {
  const matches = [
    ...source.matchAll(
      new RegExp(`^([ \\t]*)${name}:\\s*(['"])((?:\\\\.|(?!\\2).)*)\\2`, 'gm'),
    ),
  ]
  return matches.sort((a, b) => a[1]!.length - b[1]!.length)[0]
}

/** Changes top-level fields of a `system.ts`, keeping everything else. */
export function editDeclaration(
  source: string,
  changes: {
    label?: string
    status?: 'active' | 'archived'
    renameReview?: string[]
  },
) {
  let next = source
  for (const name of ['label', 'status'] as const) {
    const value = changes[name]
    const match = value === undefined ? undefined : field(next, name)
    if (value === undefined || !match) continue
    const quote = match[2]!
    const text = value.replaceAll(quote, `\\${quote}`)
    const at = match.index! + match[0].length - match[3]!.length - 1
    next = next.slice(0, at) + text + next.slice(at + match[3]!.length)
  }
  if (changes.renameReview) {
    next = next.replace(/^[ \t]*renameReview:\s*\[[\s\S]*?\],?[ \t]*\r?\n/m, '')
    if (changes.renameReview.length) {
      const status = field(next, 'status')
      if (status) {
        const newline = next.includes('\r\n') ? '\r\n' : '\n'
        const end = next.indexOf('\n', status.index!) + 1
        const list = changes.renameReview
          .map((file) => `'${file.replaceAll("'", "\\'")}'`)
          .join(', ')
        next = `${next.slice(0, end)}${status[1]}renameReview: [${list}],${newline}${next.slice(end)}`
      }
    }
  }
  return next
}

interface SystemFacts {
  key: string
  dir: string
  label: string
  status: 'active' | 'archived'
  studioId: string
  declaration: string
}

function systemFacts(
  options: LifecycleOptions,
  config: Config,
  key: unknown,
): SystemFacts {
  const { systemsDir } = settings(options)
  if (
    typeof key !== 'string' ||
    !ID.test(key) ||
    !(config.systems ?? []).includes(key)
  )
    throw new LifecycleError('Choose a registered system.', 404)
  const dir = path.join(systemsDir, key)
  const file = path.join(dir, 'system.ts')
  if (!existsSync(file))
    throw new LifecycleError('Choose a registered system.', 404)
  const declaration = read(file)
  const studioId = field(declaration, 'studioId')?.[3]
  if (!studioId) throw new LifecycleError(`${key}/system.ts has no studioId.`)
  return {
    key,
    dir,
    label: field(declaration, 'label')?.[3]?.replace(/\\(.)/g, '$1') ?? key,
    status:
      field(declaration, 'status')?.[3] === 'archived' ? 'archived' : 'active',
    studioId,
    declaration,
  }
}

/** Finds a registered system by its folder key or permanent ID. */
export function findSystem(options: LifecycleOptions, keyOrId: unknown) {
  const { configFile } = settings(options)
  const { config } = readConfig(configFile)
  for (const key of config.systems ?? []) {
    try {
      const facts = systemFacts(options, config, key)
      if (keyOrId === key || keyOrId === facts.studioId) return facts
    } catch {
      // A broken registration is the registry's to report.
    }
  }
  throw new LifecycleError('Choose a registered system.', 404)
}

const directories = (dir: string) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    : []

/** Every prototype's metadata, archived ones too. */
function prototypes(options: LifecycleOptions) {
  const { root, prototypesDir } = settings(options)
  return directories(prototypesDir).flatMap((contributor) =>
    directories(path.join(prototypesDir, contributor)).flatMap((name) => {
      const file = path.join(prototypesDir, contributor, name, 'meta.json')
      if (!existsSync(file)) return []
      try {
        const meta = JSON.parse(read(file)) as Record<string, unknown>
        if (typeof meta.title !== 'string') return []
        return [
          {
            file,
            meta,
            folder: posix(path.relative(root, path.dirname(file))),
          },
        ]
      } catch {
        return []
      }
    }),
  )
}

const rebuildTarget = (meta: Record<string, unknown>) =>
  (meta.rebuild as { targetSystemId?: unknown } | undefined)?.targetSystemId

/** The prototypes that use a system or wait to be rebuilt with it. */
export function systemDependents(options: LifecycleOptions, studioId: string) {
  return prototypes(options)
    .filter(
      ({ meta }) =>
        meta.systemId === studioId || rebuildTarget(meta) === studioId,
    )
    .map(({ meta, folder }): Dependent => ({
      id: String(meta.studioId),
      title: String(meta.title),
      folder,
      archived: meta.status === 'archived',
      pending: rebuildTarget(meta) === studioId,
    }))
}

/** Whether `package.json` makes each system folder a yarn workspace. */
function isWorkspace(root: string, folder: string) {
  try {
    const { workspaces } = JSON.parse(read(path.join(root, 'package.json')))
    return (Array.isArray(workspaces) ? workspaces : []).includes(
      `${posix(folder).replace(/\/+$/, '')}/*`,
    )
  } catch {
    return false
  }
}

function keyTaken(options: LifecycleOptions, config: Config, key: string) {
  const { root, systemsDir } = settings(options)
  if (
    directories(systemsDir).some((name) => name.toLowerCase() === key) ||
    (config.systems ?? []).includes(key)
  )
    return `There’s already a system called “${key}”.`
  if (
    Object.hasOwn(config.modules ?? {}, key) ||
    existsSync(path.join(root, 'src/modules', key))
  )
    return `“${key}” is already the name of a module. Choose another name.`
  return null
}

// ---------------------------------------------------------------------------
// Plans

function templateFiles(dir: string, prefix = ''): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? templateFiles(path.join(dir, entry.name), `${prefix}${entry.name}/`)
      : [`${prefix}${entry.name}`],
  )
}

/** A new, empty Vue system in `<systems>/<key>/`, registered. */
export function planCreate(
  options: LifecycleOptions,
  request: { key: unknown; label?: unknown },
): LifecyclePlan {
  const { root, folder, systemsDir, configFile } = settings(options)
  const key = request.key
  if (typeof key !== 'string' || !ID.test(key))
    throw new LifecycleError(
      'The system’s key is lowercase letters, numbers and dashes, starting with a letter.',
    )
  const label =
    typeof request.label === 'string' ? request.label.trim() : titleOf(key)
  const problem = nameProblem(label)
  if (problem) throw new LifecycleError(problem)
  const { source, config } = readConfig(configFile)
  const taken = keyTaken(options, config, key)
  if (taken) throw new LifecycleError(taken, 409)
  const used = studioIdsInUse(root)
  for (const name of directories(systemsDir)) {
    const id = existsSync(path.join(systemsDir, name, 'system.ts'))
      ? field(read(path.join(systemsDir, name, 'system.ts')), 'studioId')?.[3]
      : undefined
    if (id) used.add(id)
  }
  const studioId = newStudioId(used)
  let vue = '^3.5.0'
  try {
    vue =
      JSON.parse(read(path.join(root, 'package.json'))).dependencies?.vue ?? vue
  } catch {
    // The template's own range.
  }
  const fill = (text: string) =>
    text
      .replaceAll('__LABEL_TS__', label.replaceAll("'", "\\'"))
      .replaceAll('__LABEL__', label)
      .replaceAll('__STUDIO_ID__', studioId)
      .replaceAll('__VUE__', vue)
      .replaceAll('__ID__', key)
  const dir = path.join(systemsDir, key)
  const edits: Edit[] = templateFiles(TEMPLATE).map((file) => ({
    file: path.join(dir, file.replace(/\.tpl$/, '')),
    before: null,
    after: fill(read(path.join(TEMPLATE, file))),
  }))
  edits.push({
    file: configFile,
    before: source,
    after: editConfig(
      source,
      {
        systems: [...(config.systems ?? []), key],
        systemMaintainers: { ...config.systemMaintainers, [studioId]: [] },
      },
      configFile,
    ),
  })
  return {
    action: 'create',
    key,
    nextKey: key,
    label,
    studioId,
    edits,
    move: null,
    remove: null,
    dependents: [],
    references: 0,
    review: [],
    install: isWorkspace(root, folder),
  }
}

const TEXT =
  /\.(?:[cm]?[jt]sx?|vue|md|css|json|excalidraw|mmd|mermaid|ya?ml|html)$/i
const SKIPPED = new Set([
  'node_modules',
  '.git',
  '.yarn',
  '.e2e',
  '.scratch',
  '.studio',
  'dist',
  'coverage',
  '.data',
  '.cache',
])
const LOCKFILES = new Set(['yarn.lock', 'package-lock.json', 'pnpm-lock.yaml'])

function* textFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (
      SKIPPED.has(entry.name) ||
      entry.name.startsWith('.nuxt') ||
      entry.name.startsWith('.output')
    )
      continue
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* textFiles(file)
    else if (
      entry.isFile() &&
      TEXT.test(entry.name) &&
      !LOCKFILES.has(entry.name) &&
      statSync(file).size <= 1024 * 1024
    )
      yield file
  }
}

/**
 * Where a rename looks for references to the system's folder: the whole
 * studio, or only the scenario's own content when the systems folder is
 * elsewhere.
 */
function referenceRoots(options: LifecycleOptions) {
  const { root, folder, systemsDir, prototypesDir } = settings(options)
  if (posix(folder) === SYSTEMS_FOLDER) return [root]
  const content = path.dirname(systemsDir)
  return prototypesDir.startsWith(content + path.sep)
    ? [content]
    : [content, prototypesDir]
}

/** Plans renaming, archiving, restoring or deleting a registered system. */
export function planLifecycle(
  options: LifecycleOptions,
  action: Exclude<LifecycleAction, 'create'>,
  key: unknown,
  request: { label?: unknown; restorePrototypes?: boolean } = {},
): LifecyclePlan {
  const { root, folder, systemsDir, configFile } = settings(options)
  const { source, config } = readConfig(configFile)
  const system = systemFacts(options, config, key)
  const declarationFile = path.join(system.dir, 'system.ts')
  const dependents = systemDependents(options, system.studioId)
  const edits: Edit[] = []
  const edit = (file: string, after: string) => {
    const existing = edits.find((change) => change.file === file)
    if (existing) existing.after = after
    else edits.push({ file, before: read(file), after })
  }
  const metas = prototypes(options)
  let nextKey = system.key
  let label = system.label
  let move: LifecyclePlan['move'] = null
  let remove: string | null = null
  let references = 0
  const review: string[] = []

  if (action === 'rename') {
    const problem = nameProblem(request.label)
    if (problem) throw new LifecycleError(problem)
    if (system.status !== 'active')
      throw new LifecycleError('Restore this system before renaming it.', 409)
    label = String(request.label).trim()
    nextKey = systemKey(label)
    edit(declarationFile, editDeclaration(system.declaration, { label }))
    if (nextKey !== system.key) {
      const taken = keyTaken(
        options,
        {
          ...config,
          systems: (config.systems ?? []).filter((k) => k !== system.key),
        },
        nextKey,
      )
      if (taken && !(nextKey.toLowerCase() === system.key.toLowerCase()))
        throw new LifecycleError(taken, 409)
      move = { from: system.dir, to: path.join(systemsDir, nextKey) }
      edit(
        configFile,
        editConfig(
          source,
          {
            systems: (config.systems ?? []).map((value) =>
              value === system.key ? nextKey : value,
            ),
          },
          configFile,
        ),
      )
      // References into the folder, anywhere in the studio, follow it.
      const pattern = new RegExp(
        `(?<=(?:^|[^A-Za-z0-9_-])systems/)${system.key}(?![A-Za-z0-9_-])`,
        'gm',
      )
      const leftover = new RegExp(`systems\\\\${system.key}(?![A-Za-z0-9_-])`)
      const inside = system.dir + path.sep
      for (const base of referenceRoots(options))
        for (const file of textFiles(base)) {
          if (file === configFile) continue
          const current =
            edits.find((change) => change.file === file)?.after ?? read(file)
          const next = current.replace(pattern, nextKey)
          const shown = posix(
            path.relative(
              root,
              file.startsWith(inside)
                ? path.join(move.to, path.relative(system.dir, file))
                : file,
            ),
          )
          if (leftover.test(next)) review.push(shown)
          if (next === current) continue
          edit(file, next)
          if (file !== declarationFile) references++
        }
    }
    const declaration = edits.find((change) => change.file === declarationFile)!
    declaration.after = editDeclaration(declaration.after!, {
      renameReview: review,
    })
  } else if (action === 'archive') {
    if (system.studioId === config.defaultSystem)
      throw new LifecycleError(
        `${system.label} is the default system. Set another system as the default before archiving ${system.label}.`,
        409,
      )
    if (system.status !== 'active')
      throw new LifecycleError('This system is already archived.', 409)
    edit(
      declarationFile,
      editDeclaration(system.declaration, { status: 'archived' }),
    )
    for (const { file, meta } of metas) {
      if (meta.systemId !== system.studioId || meta.status === 'archived')
        continue
      edit(
        file,
        json({
          ...meta,
          status: 'archived',
          archivedBySystemId: system.studioId,
        }),
      )
    }
  } else if (action === 'restore') {
    if (system.status !== 'archived')
      throw new LifecycleError('This system is already active.', 409)
    edit(
      declarationFile,
      editDeclaration(system.declaration, { status: 'active' }),
    )
    for (const { file, meta } of metas) {
      if (meta.archivedBySystemId !== system.studioId) continue
      const next = { ...meta }
      delete next.archivedBySystemId
      if (request.restorePrototypes && !next.systemMissing) delete next.status
      edit(file, json(next))
    }
  } else if (action === 'delete') {
    if (system.studioId === config.defaultSystem)
      throw new LifecycleError(
        `${system.label} is the default system. Set another system as the default before deleting ${system.label}.`,
        409,
      )
    remove = system.dir
    const maintainers = Object.fromEntries(
      Object.entries(config.systemMaintainers ?? {}).filter(
        ([id]) => id !== system.studioId,
      ),
    )
    edit(
      configFile,
      editConfig(
        source,
        {
          systems: (config.systems ?? []).filter(
            (value) => value !== system.key,
          ),
          systemMaintainers: maintainers,
        },
        configFile,
      ),
    )
    for (const { file, meta } of metas) {
      const next = { ...meta }
      // The assignment and the code stay; the prototype waits for a rebuild.
      if (next.systemId === system.studioId)
        next.systemMissing = { systemId: system.studioId, label: system.label }
      if (rebuildTarget(next) === system.studioId) delete next.rebuild
      if (next.archivedBySystemId === system.studioId)
        delete next.archivedBySystemId
      if (JSON.stringify(next) !== JSON.stringify(meta)) edit(file, json(next))
    }
  } else throw new LifecycleError('Unknown system action.')

  return {
    action,
    key: system.key,
    nextKey,
    label,
    studioId: system.studioId,
    edits,
    move,
    remove,
    dependents,
    references,
    review,
    install: (move !== null || remove !== null) && isWorkspace(root, folder),
  }
}

// ---------------------------------------------------------------------------
// Applying

/** Names the recorded dev server when it holds a folder in this studio. */
export function devServerHolder(root: string): DescribeHolder {
  return () => {
    const status = readDevServer(root)
    return status.state === 'running' ? describeDevServer(status.record) : null
  }
}

/** The folders a plan moves that another program holds, as sentences. */
export function heldFolders(options: LifecycleOptions, plan: LifecyclePlan) {
  const describeHolder = options.describeHolder ?? devServerHolder(options.root)
  return [plan.move?.from, plan.remove]
    .flatMap((folder) =>
      folder
        ? [
            probeFolder(folder, {
              describeHolder,
              platform: options.platform,
              ops: options.ops,
            }),
          ]
        : [],
    )
    .filter((held) => held !== null)
    .map((held) => heldSentence(held, options.root))
}

/** Takes the one-at-a-time marker; returns how to give it back. */
export function holdOperation(root: string) {
  const marker = path.join(root, OPERATION_MARKER)
  const take = () =>
    writeFileSync(
      marker,
      JSON.stringify({ pid: process.pid, started: Date.now() }),
      { flag: 'wx' },
    )
  try {
    take()
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
    let held: { pid?: number; started?: number } = {}
    try {
      held = JSON.parse(read(marker))
    } catch {
      // Unreadable: treat as abandoned below.
    }
    const abandoned =
      !held.pid ||
      !isAlive(held.pid) ||
      Date.now() - (held.started ?? 0) > STALE_MARKER
    if (!abandoned)
      throw new LifecycleError(
        'Another system change is in progress. Try again when it finishes.',
        409,
      )
    rmSync(marker, { force: true })
    take()
  }
  return () => rmSync(marker, { force: true })
}

function write(file: string, text: string | null, stop: string) {
  if (text === null) {
    rmSync(file, { force: true })
    // Folders the plan made go with their last file.
    for (
      let dir = path.dirname(file);
      dir.startsWith(stop + path.sep) &&
      existsSync(dir) &&
      !readdirSync(dir).length;
      dir = path.dirname(dir)
    )
      rmdirSync(dir)
    return
  }
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, text)
}

/**
 * Applies a plan: its files, its folder move or removal, the lockfile, then
 * a check that the systems still load. Any failure puts every file, folder
 * and the lockfile back as they were.
 */
export async function applyPlan(
  options: LifecycleOptions,
  plan: LifecyclePlan,
): Promise<LifecycleResult> {
  const { root, folder, systemsDir, configFile } = settings(options)
  const release = holdOperation(root)
  const lockfile = path.join(root, 'yarn.lock')
  const lockBefore = existsSync(lockfile) ? read(lockfile) : null
  const describeHolder = options.describeHolder ?? devServerHolder(root)
  const before = new Set(
    (await loadSystems(root, readConfig(configFile).config, folder)).problems,
  )
  let temporary: string | undefined
  const removed = () => path.join(temporary!, 'system')
  const written: Edit[] = []
  try {
    for (const change of plan.edits) {
      write(change.file, change.after, systemsDir)
      written.push(change)
    }
    if (plan.move)
      moveFolder(plan.move.from, plan.move.to, {
        ops: options.ops,
        describeHolder,
      })
    if (plan.remove) {
      temporary = mkdtempSync(path.join(os.tmpdir(), 'studio-system-delete-'))
      moveFolder(plan.remove, removed(), { ops: options.ops, describeHolder })
    }
    // Only the lockfile: relinking node_modules under a running dev server
    // could trip over files it holds.
    if (plan.install) options.yarn?.(['install', '--mode=update-lockfile'])
    const after = await loadSystems(root, readConfig(configFile).config, folder)
    const problems = after.problems.filter((problem) => !before.has(problem))
    if (problems.length) throw new LifecycleError(problems.join(' '))
  } catch (error) {
    if (plan.move && existsSync(plan.move.to) && !existsSync(plan.move.from))
      moveFolder(plan.move.to, plan.move.from)
    if (temporary && existsSync(removed()) && !existsSync(plan.remove!))
      moveFolder(removed(), plan.remove!)
    for (const change of written.reverse())
      write(change.file, change.before, systemsDir)
    if (lockBefore === null) rmSync(lockfile, { force: true })
    else if (existsSync(lockfile) && read(lockfile) !== lockBefore)
      writeFileSync(lockfile, lockBefore)
    else if (!existsSync(lockfile)) writeFileSync(lockfile, lockBefore)
    if (error instanceof HeldError)
      throw new LifecycleError(heldSentence(error.held, root), 409)
    throw error
  } finally {
    if (temporary) rmSync(temporary, { recursive: true, force: true })
    release()
  }
  return {
    action: plan.action,
    key: plan.nextKey,
    studioId: plan.studioId,
    prototypes: plan.dependents.length,
    references: plan.references,
  }
}
