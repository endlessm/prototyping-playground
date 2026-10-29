// The file service's tree: a prototype's real files and folders, and the
// changes the file tree makes to them (create from a file type's template,
// rename, delete to the computer's own trash, lo-fi and hi-fi), each checked
// against who is working. Showing a file in the computer's file browser and
// opening it in a code editor work in any prototype. Framework-neutral; the
// dev server's route (`server/tree.ts`) wraps it.
import { spawn } from 'node:child_process'
import {
  accessSync,
  constants,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import trashFile from 'trash'
import { newStudioId } from '../contributors/studio-ids.ts'
import { identityLock } from '../identity/assign.ts'
import { auditIdentities, identitiesInUse } from '../identity/audit.ts'
import { compare, posix, PROTOTYPES_FOLDER } from '../manifest/build.ts'
import { artifactTitle } from '../manifest/titles.ts'
import {
  fileAccess,
  FileServiceError,
  type FileServiceOptions,
} from './source.ts'

/** A file or folder in a prototype, by its path inside the prototype. */
export interface FileNode {
  name: string
  /** Inside the prototype, with forward slashes. */
  path: string
  dir: boolean
  children?: FileNode[]
}

/** Where deleted files went: the Recycle Bin on Windows, or the Trash. */
export type TrashPlace = 'recycle-bin' | 'trash'

/** A program the service may start, such as a code editor. */
export interface Editor {
  name: string
  command: string
  args: string[]
}

export interface TreeOptions extends FileServiceOptions {
  /** Moves a file or folder to the computer's trash. */
  trash?: (file: string) => Promise<void>
  /** Starts a program without waiting for it. */
  launch?: (command: string, args: string[]) => Promise<void>
  platform?: NodeJS.Platform
  /** The code editors to try, in order; the installed ones by default. */
  editors?: Editor[]
}

const FOLDER = 'folder'
const META = 'meta.json'

const refuse = (status: number, code: string, message: string) =>
  new FileServiceError(status, code, message)
const gone = () =>
  refuse(404, 'not_found', 'That file was moved or deleted. Try again.')
const folderGone = () =>
  refuse(404, 'not_found', 'That folder was moved or deleted. Try again.')

/** A name you can give a file or folder: no slashes, not hidden. */
export function nameProblem(name: unknown) {
  if (typeof name !== 'string' || !name.trim()) return 'Add a name.'
  if (/[/\\\0<>:"|?*]/.test(name) || name.startsWith('.'))
    return 'Names can’t contain slashes or start with a dot.'
  if (name.trim() !== name || /[. ]$/.test(name))
    return 'Names can’t start or end with a space, or end with a dot.'
  return null
}

/** What the person's computer calls its file browser. */
export const fileBrowser = (platform: NodeJS.Platform) =>
  platform === 'win32'
    ? 'File Explorer'
    : platform === 'darwin'
      ? 'Finder'
      : 'your file manager'

export function createFileTree(options: TreeOptions) {
  const access = fileAccess(options)
  const { root, prototypeOf, refusalFor, artifactOf, display } = access
  const platform = options.platform ?? process.platform
  const trash = options.trash ?? ((file: string) => trashFile([file]))
  const launch = options.launch ?? launchProgram

  /** A path inside the prototype, resolved for real, or null. */
  function inside(dir: string, relative: unknown) {
    if (typeof relative !== 'string' || relative.includes('\0')) return null
    if (relative.split('/').some((part) => part.startsWith('.'))) return null
    const real = realpathSync(dir)
    const target = path.resolve(dir, relative)
    if (target !== dir && !target.startsWith(dir + path.sep)) return null
    try {
      const resolved = realpathSync(target)
      return resolved === real || resolved.startsWith(real + path.sep)
        ? resolved
        : null
    } catch {
      return null
    }
  }

  /** The prototype, refusing if you may not change it. */
  function changeable(prototype: unknown) {
    const found = prototypeOf(String(prototype ?? ''))
    const refusal = refusalFor(found.contributor, found.meta)
    if (refusal) throw refuse(403, refusal.code, refusal.message)
    return found
  }

  /** A file or folder the tree may rename or delete. */
  function movable(dir: string, relative: unknown) {
    if (relative === META)
      throw refuse(
        400,
        'fixed',
        'meta.json holds the prototype’s details, so it stays where it is.',
      )
    const file = inside(dir, relative)
    if (!file || file === realpathSync(dir)) throw gone()
    return file
  }

  const relativeTo = (dir: string, file: string) =>
    posix(path.relative(realpathSync(dir), file))

  /** A new permanent ID that no file in the studio uses yet. */
  function newId() {
    const taken = identitiesInUse(
      auditIdentities(root, options.fileTypes, {
        prototypesFolder: options.prototypesFolder ?? PROTOTYPES_FOLDER,
        contributorsFolder: options.contributorsFolder ?? 'contributors',
      }),
    )
    return newStudioId(taken)
  }

  async function reveal(file: string) {
    if (platform === 'win32') return launch('explorer.exe', [`/select,${file}`])
    if (platform === 'darwin') return launch('/usr/bin/open', ['-R', file])
    const folder = statSync(file).isDirectory() ? file : path.dirname(file)
    return launch('xdg-open', [folder])
  }

  return {
    /**
     * The prototype's files and folders and, unless `access` is false,
     * whether you may change them. Finding out who you are runs Git and
     * perhaps the GitHub CLI, which hold up the dev server, so a tree that
     * only follows files coming and going leaves it out.
     */
    async list(request: { prototype: unknown; access?: unknown }): Promise<{
      folder: string
      nodes: FileNode[]
      editable?: boolean
      reason?: string
    }> {
      const { dir, contributor, meta } = prototypeOf(
        String(request.prototype ?? ''),
      )
      const listing = { folder: display(dir), nodes: readTree(dir) }
      if (request.access === false) return listing
      const refusal = refusalFor(contributor, meta)
      return {
        ...listing,
        editable: !refusal,
        ...(refusal ? { reason: refusal.message } : {}),
      }
    },

    /**
     * A new folder, or a file of a type (its ID) from the type's template
     * with a new permanent ID; the type's extension is added for you.
     */
    async create(request: {
      prototype: unknown
      parent: unknown
      name: unknown
      type: unknown
    }) {
      const { dir } = changeable(request.prototype)
      const parent = inside(dir, request.parent ?? '')
      if (!parent || !statSync(parent).isDirectory()) throw folderGone()
      const problem = nameProblem(request.name)
      if (problem) throw refuse(400, 'invalid', problem)
      let name = request.name as string
      const type =
        request.type === FOLDER
          ? undefined
          : options.fileTypes.find(({ id }) => id === request.type)
      if (request.type !== FOLDER && !type)
        throw refuse(
          400,
          'invalid',
          'This kind of file can’t be created in a prototype.',
        )
      const extension = type?.extensions[0] ?? ''
      if (!name.toLowerCase().endsWith(extension)) name += extension
      const target = path.join(parent, name)
      const clash = () =>
        refuse(409, 'exists', `Something named “${name}” already exists here.`)
      if (existsSync(target)) throw clash()
      const relative = relativeTo(dir, target)
      if (!type) {
        mkdirSync(target)
        return { path: relative }
      }
      const title = artifactTitle(name.slice(0, -extension.length))
      const source = type.template?.(title) ?? ''
      // Helpers (inside a `_` folder, or named so) have no identity.
      if (relative.split('/').some((part) => part.startsWith('_'))) {
        writeFileSync(target, source, { flag: 'wx' })
        return { path: relative }
      }
      const release = identityLock(root)
      try {
        const artifact = newId()
        try {
          writeFileSync(target, type.identity.write(source, artifact), {
            flag: 'wx',
          })
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw clash()
          throw error
        }
        return { path: relative, artifact }
      } finally {
        release()
      }
    },

    /**
     * Renames a file or folder in place. A file of a type keeps its
     * extension when the new name has none.
     */
    async rename(request: {
      prototype: unknown
      path: unknown
      name: unknown
    }) {
      const { dir } = changeable(request.prototype)
      const source = movable(dir, request.path)
      const problem = nameProblem(request.name)
      if (problem) throw refuse(400, 'invalid', problem)
      let name = request.name as string
      const extension = path.extname(source)
      if (
        lstatSync(source).isFile() &&
        access.typeOf(source) &&
        !path.extname(name)
      )
        name += extension
      const target = path.join(path.dirname(source), name)
      if (target === source) return { path: relativeTo(dir, source) }
      // Only the letter case changes: the same file on most computers.
      const sameFile =
        target.toLowerCase() === source.toLowerCase() &&
        existsSync(target) &&
        statSync(target, { bigint: true }).ino ===
          statSync(source, { bigint: true }).ino
      if (existsSync(target) && !sameFile)
        throw refuse(
          409,
          'exists',
          `Something named “${name}” already exists there.`,
        )
      renameSync(source, target)
      return { path: relativeTo(dir, target) }
    },

    /** Moves a file or folder to the computer's trash. */
    async remove(request: { prototype: unknown; path: unknown }) {
      const { dir } = changeable(request.prototype)
      const file = movable(dir, request.path)
      await trash(file)
      const trashedTo: TrashPlace =
        platform === 'win32' ? 'recycle-bin' : 'trash'
      return { trashedTo }
    },

    /** Writes or removes an artifact's lo-fi marker, as its type says. */
    async setLofi(request: {
      prototype: unknown
      artifact: unknown
      lofi: unknown
    }) {
      if (typeof request.lofi !== 'boolean')
        throw refuse(400, 'invalid', 'Say whether the artifact is lo-fi.')
      const { dir } = changeable(request.prototype)
      const { file, type } = artifactOf(dir, String(request.artifact ?? ''))
      if (!type.fidelity)
        throw refuse(400, 'invalid', 'This kind of file has no lo-fi version.')
      // Read and written at once, so no change made meanwhile is lost.
      const source = readFileSync(file, 'utf8')
      const next = type.fidelity.setLofi(source, request.lofi)
      if (next !== source) writeFileSync(file, next)
      return { lofi: request.lofi }
    },

    /** Shows a file or folder in the computer's file browser. */
    async reveal(request: { prototype: unknown; path: unknown }) {
      const { dir } = prototypeOf(String(request.prototype ?? ''))
      const file = inside(dir, request.path ?? '')
      if (!file) throw gone()
      try {
        await reveal(file)
      } catch {
        throw refuse(
          500,
          'unavailable',
          `Couldn’t open ${fileBrowser(platform)}. Copy the file’s path instead.`,
        )
      }
      return {}
    },

    /**
     * Opens a file in the person's code editor: `LAUNCH_EDITOR` first, then
     * Cursor, VS Code, VSCodium, Zed and Sublime Text. Without one, the file
     * is shown in the file browser and the reply says what else to do.
     */
    async open(request: { prototype: unknown; path: unknown }) {
      const { dir } = prototypeOf(String(request.prototype ?? ''))
      const file = inside(dir, request.path)
      if (!file || !lstatSync(file).isFile()) throw gone()
      const editors = options.editors ?? installedEditors(platform)
      for (const editor of editors) {
        try {
          await launch(editor.command, [...editor.args, file])
          return { opened: true, editor: editor.name }
        } catch {
          // Try the next one.
        }
      }
      const where = fileBrowser(platform)
      try {
        await reveal(file)
      } catch {
        throw refuse(
          500,
          'unavailable',
          'Couldn’t open a code editor. Use Edit source, or copy the file’s path.',
        )
      }
      return {
        opened: false,
        message: editors.length
          ? `Your code editor didn’t open, so the file is shown in ${where}. You can also use Edit source, or copy its path.`
          : `No supported code editor is installed, so the file is shown in ${where}. You can also use Edit source, or copy its path.`,
      }
    },
  }
}

export type FileTree = ReturnType<typeof createFileTree>

/** Files and folders under `dir`, folders first, without hidden files. */
export function readTree(dir: string, prefix = ''): FileNode[] {
  const entries = readdirSync(dir, { withFileTypes: true }).filter(
    (entry) =>
      !entry.name.startsWith('.') &&
      entry.name !== 'node_modules' &&
      (entry.isDirectory() || entry.isFile()),
  )
  const sorted = (dirs: boolean) =>
    entries
      .filter((entry) => entry.isDirectory() === dirs)
      .map((entry) => entry.name)
      .sort(compare)
  return [
    ...sorted(true).map((name) => ({
      name,
      path: `${prefix}${name}`,
      dir: true,
      children: readTree(path.join(dir, name), `${prefix}${name}/`),
    })),
    ...sorted(false).map((name) => ({
      name,
      path: `${prefix}${name}`,
      dir: false,
    })),
  ]
}

/** Starts a program and returns once it has started. */
export function launchProgram(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      detached: true,
      stdio: 'ignore',
      shell: false,
      windowsHide: false,
    })
    child.once('error', reject)
    child.once('spawn', () => {
      child.unref()
      resolve()
    })
  })
}

const EDITORS = [
  { name: 'Cursor', command: 'cursor', app: 'Cursor', exe: 'Cursor' },
  {
    name: 'Visual Studio Code',
    command: 'code',
    app: 'Microsoft VS Code',
    exe: 'Code',
    mac: 'Visual Studio Code',
  },
  { name: 'VSCodium', command: 'codium', app: 'VSCodium', exe: 'VSCodium' },
  { name: 'Zed', command: 'zed', app: 'Zed', exe: 'Zed' },
  {
    name: 'Sublime Text',
    command: 'subl',
    app: 'Sublime Text',
    exe: 'sublime_text',
  },
]

/** The supported code editors installed here, `LAUNCH_EDITOR` first. */
export function installedEditors(
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
  exists: (file: string) => boolean = existsSync,
): Editor[] {
  const preferred = EDITORS.find((editor) =>
    [editor.command, editor.name].includes(env.LAUNCH_EDITOR ?? ''),
  )
  const ordered = preferred
    ? [preferred, ...EDITORS.filter((editor) => editor !== preferred)]
    : EDITORS
  return ordered.flatMap((editor) => {
    if (platform === 'darwin') {
      const app = ['/Applications', path.join(homedir(), 'Applications')]
        .map((folder) => path.join(folder, `${editor.mac ?? editor.app}.app`))
        .find(exists)
      return app
        ? [{ name: editor.name, command: '/usr/bin/open', args: ['-a', app] }]
        : []
    }
    // Windows launcher scripts need a shell: start the application itself.
    if (platform === 'win32') {
      const app = [
        env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, 'Programs'),
        env.ProgramFiles,
      ]
        .filter((folder): folder is string => Boolean(folder))
        .map((folder) => path.join(folder, editor.app, `${editor.exe}.exe`))
        .find(exists)
      return app ? [{ name: editor.name, command: app, args: [] }] : []
    }
    const command = (env.PATH ?? '')
      .split(path.delimiter)
      .map((folder) => path.join(folder, editor.command))
      .find((candidate) => {
        try {
          accessSync(candidate, constants.X_OK)
          return statSync(candidate).isFile()
        } catch {
          return false
        }
      })
    return command ? [{ name: editor.name, command, args: [] }] : []
  })
}
