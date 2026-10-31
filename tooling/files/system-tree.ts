// The file service's trees of a system's Context and Skills: their files
// and folders, and the changes the Systems navigation makes to them. New
// documents (Markdown, `.md` added for you) and folders in Context; New
// skill (a folder and its SKILL.md) in Skills, and files and folders inside
// a skill; rename, move within the same section, and delete to the
// computer's trash. Each change is checked against the sections' shape
// (`../systems/content-rules.ts`) and made only by an Admin or one of the
// system's maintainers while it is active. Renaming a skill renames its
// folder and the name in its SKILL.md. Framework-neutral; the dev server's
// route (`server/system-tree.ts`) wraps it.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import trashFile from 'trash'
import { posix } from '../manifest/build.ts'
import { artifactTitle } from '../manifest/titles.ts'
import {
  contentProblem,
  SKILL_FILE,
  skillDescriptionProblem,
  skillNameProblem,
  skillTemplate,
  type ContentChange,
  type ContentSection,
} from '../systems/content-rules.ts'
import { FileServiceError } from './source.ts'
import { systemAccess, type SystemSourceOptions } from './system-source.ts'
import {
  nameProblem,
  readTree,
  type FileNode,
  type TrashPlace,
} from './tree.ts'

export interface SystemTreeOptions extends SystemSourceOptions {
  /** Moves a file or folder to the computer's trash. */
  trash?: (file: string) => Promise<void>
  platform?: NodeJS.Platform
  /**
   * Has the dev server's file watchers let go of a folder before it is
   * renamed, moved or trashed; resolves to how to watch it again.
   */
  release?: (folder: string) => Promise<() => Promise<void>>
}

export const SECTIONS: ContentSection[] = ['context', 'skills']

const refuse = (status: number, code: string, message: string) =>
  new FileServiceError(status, code, message)
const gone = () =>
  refuse(404, 'not_found', 'That file was moved or deleted. Try again.')
const folderGone = () =>
  refuse(404, 'not_found', 'That folder was moved or deleted. Try again.')
const invalid = (message: string) => refuse(400, 'invalid', message)

export function createSystemTree(options: SystemTreeOptions) {
  const { root } = options
  const { systemOf, refusalFor } = systemAccess(options)
  const platform = options.platform ?? process.platform
  const trash = options.trash ?? ((file: string) => trashFile([file]))
  const release = options.release ?? (async () => async () => {})

  async function systemFor(id: unknown) {
    const { system, config } = await systemOf(String(id ?? ''))
    if (!system)
      throw refuse(404, 'not_found', 'That system was moved or deleted.')
    return { system, config }
  }

  /** The section's folder, refusing if you may not change the system. */
  async function changeable(id: unknown, section: unknown) {
    if (!SECTIONS.includes(section as ContentSection))
      throw invalid('Say whether it’s in Context or Skills.')
    const { system, config } = await systemFor(id)
    const refusal = refusalFor(system, config)
    if (refusal) throw refuse(403, refusal.code, refusal.message)
    const dir = path.join(system.dir, section as string)
    mkdirSync(dir, { recursive: true })
    return { dir: realpathSync(dir), section: section as ContentSection }
  }

  /** A path inside the section, resolved for real, or null. */
  function inside(dir: string, relative: unknown) {
    if (typeof relative !== 'string' || relative.includes('\0')) return null
    if (relative.split('/').some((part) => part.startsWith('.'))) return null
    const target = path.resolve(dir, relative)
    if (target !== dir && !target.startsWith(dir + path.sep)) return null
    try {
      const resolved = realpathSync(target)
      return resolved === dir || resolved.startsWith(dir + path.sep)
        ? resolved
        : null
    } catch {
      return null
    }
  }

  /** An existing file or folder in the section, not the section itself. */
  function existing(dir: string, relative: unknown) {
    const file = inside(dir, relative)
    if (!file || file === dir) throw gone()
    return file
  }

  function folderIn(dir: string, relative: unknown) {
    const folder = inside(dir, relative ?? '')
    if (!folder || !statSync(folder).isDirectory()) throw folderGone()
    return folder
  }

  const relativeTo = (dir: string, file: string) =>
    posix(path.relative(dir, file))

  function check(section: ContentSection, change: ContentChange) {
    const problem = contentProblem(section, change)
    if (problem) throw invalid(problem)
  }

  /** Renames or moves, with the watchers let go of a folder first. */
  async function relocate(source: string, target: string) {
    const folder = statSync(source).isDirectory()
    const again = folder ? await release(source) : undefined
    try {
      renameSync(source, target)
    } finally {
      await again?.()
    }
  }

  return {
    /**
     * The system's Context and Skills as trees and, unless `access` is
     * false, whether you may change them (and why not).
     */
    async list(request: { system: unknown; access?: unknown }): Promise<{
      folder: string
      context: FileNode[]
      skills: FileNode[]
      editable?: boolean
      reason?: string
    }> {
      const { system, config } = await systemFor(request.system)
      const section = (name: string) => {
        const dir = path.join(system.dir, name)
        return existsSync(dir) ? readTree(dir) : []
      }
      const listing = {
        folder: posix(path.relative(root, system.dir)),
        context: section('context'),
        skills: section('skills'),
      }
      if (request.access === false) return listing
      const refusal = refusalFor(system, config)
      return {
        ...listing,
        editable: !refusal,
        ...(refusal ? { reason: refusal.message } : {}),
      }
    },

    /**
     * A Context document (`.md` added when the name has no extension), a
     * file inside a skill (empty), or a folder.
     */
    async create(request: {
      system: unknown
      section: unknown
      parent: unknown
      name: unknown
      kind: unknown
    }) {
      const { dir, section } = await changeable(request.system, request.section)
      const parent = folderIn(dir, request.parent)
      const problem = nameProblem(request.name)
      if (problem) throw invalid(problem)
      const kind = request.kind
      if (kind !== 'document' && kind !== 'file' && kind !== 'folder')
        throw invalid('That can’t be made here.')
      let name = request.name as string
      if (kind === 'document' && !path.extname(name)) name += '.md'
      check(section, {
        op: 'create',
        path: relativeTo(dir, parent),
        name,
        kind,
      })
      const target = path.join(parent, name)
      if (existsSync(target))
        throw refuse(
          409,
          'exists',
          `Something named “${name}” already exists here.`,
        )
      if (kind === 'folder') mkdirSync(target)
      else
        writeFileSync(
          target,
          kind === 'document'
            ? `# ${artifactTitle(name.replace(/\.md$/, ''))}\n`
            : '',
          { flag: 'wx' },
        )
      return { path: relativeTo(dir, target) }
    },

    /** A new skill: its folder and a SKILL.md naming and describing it. */
    async skill(request: {
      system: unknown
      name: unknown
      description: unknown
    }) {
      const { dir } = await changeable(request.system, 'skills')
      const nameIssue = skillNameProblem(request.name)
      if (nameIssue) throw invalid(`A skill’s name ${nameIssue}`)
      const descriptionIssue = skillDescriptionProblem(request.description)
      if (descriptionIssue) throw invalid(`The description ${descriptionIssue}`)
      const name = request.name as string
      const folder = path.join(dir, name)
      if (existsSync(folder))
        throw refuse(
          409,
          'exists',
          `Something named “${name}” already exists here.`,
        )
      mkdirSync(folder)
      try {
        writeFileSync(
          path.join(folder, SKILL_FILE),
          skillTemplate(name, (request.description as string).trim()),
          { flag: 'wx' },
        )
      } catch (error) {
        rmSync(folder, { recursive: true, force: true })
        throw error
      }
      return { path: `${name}/${SKILL_FILE}` }
    },

    /**
     * Renames a file or folder in place. A Context document keeps `.md`
     * when the new name has no extension; a skill's folder takes its
     * SKILL.md's name with it.
     */
    async rename(request: {
      system: unknown
      section: unknown
      path: unknown
      name: unknown
    }) {
      const { dir, section } = await changeable(request.system, request.section)
      const source = existing(dir, request.path)
      const problem = nameProblem(request.name)
      if (problem) throw invalid(problem)
      const dirNode = statSync(source).isDirectory()
      let name = request.name as string
      if (section === 'context' && !dirNode && !path.extname(name))
        name += '.md'
      const from = relativeTo(dir, source)
      check(section, { op: 'rename', path: from, name, dir: dirNode })
      const target = path.join(path.dirname(source), name)
      if (target === source) return { path: from }
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
      await relocate(source, target)
      if (section === 'skills' && dirNode && !from.includes('/'))
        renameSkill(path.join(target, SKILL_FILE), name)
      return { path: relativeTo(dir, target) }
    },

    /** Moves a file or folder into another folder of the same section. */
    async move(request: {
      system: unknown
      section: unknown
      path: unknown
      to: unknown
    }) {
      const { dir, section } = await changeable(request.system, request.section)
      const source = existing(dir, request.path)
      const folder = folderIn(dir, request.to)
      const from = relativeTo(dir, source)
      const dirNode = statSync(source).isDirectory()
      check(section, {
        op: 'move',
        path: from,
        to: relativeTo(dir, folder),
        dir: dirNode,
      })
      if (folder === source || folder.startsWith(source + path.sep))
        throw invalid('A folder can’t move inside itself.')
      const target = path.join(folder, path.basename(source))
      if (target === source) return { path: from, moved: false }
      if (existsSync(target))
        throw refuse(
          409,
          'exists',
          `Something named “${path.basename(target)}” already exists there.`,
        )
      await relocate(source, target)
      return { path: relativeTo(dir, target), moved: true }
    },

    /** Moves a file or folder to the computer's trash. */
    async remove(request: {
      system: unknown
      section: unknown
      path: unknown
    }) {
      const { dir, section } = await changeable(request.system, request.section)
      const file = existing(dir, request.path)
      const dirNode = statSync(file).isDirectory()
      check(section, {
        op: 'delete',
        path: relativeTo(dir, file),
        dir: dirNode,
      })
      const again = dirNode ? await release(file) : undefined
      try {
        await trash(file)
      } finally {
        await again?.()
      }
      const trashedTo: TrashPlace =
        platform === 'win32' ? 'recycle-bin' : 'trash'
      return { trashedTo }
    },
  }
}

export type SystemTree = ReturnType<typeof createSystemTree>

/** Puts a skill's new name in its SKILL.md's frontmatter. */
function renameSkill(file: string, name: string) {
  if (!existsSync(file)) return
  const text = readFileSync(file, 'utf8')
  const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  if (!block) return
  const lines = block[1]!.split(/\r?\n/)
  const at = lines.findIndex((line) => /^name:/.test(line))
  if (at >= 0) lines[at] = `name: ${name}`
  else lines.unshift(`name: ${name}`)
  writeFileSync(file, text.replace(block[1]!, lines.join('\n')))
}
