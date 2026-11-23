// A system's copy of its app's own source (`app.source` in `system.ts`, the
// folder `~/` points at) and the app components that present its files. The
// copy's record is the README.md at the copy's root: its frontmatter names
// the app's repository, the revision the files were copied at and the folder
// of that repository the copy mirrors. A system component becomes an app
// component when its page's frontmatter names one copied `.vue` file in
// `app`, inside the copy.
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'
import { posix } from '../manifest/build.ts'
import type { InstalledSystem } from './registry.ts'

/** The copy's record, beside the files: its README's frontmatter. */
export const COPY_RECORD = 'README.md'

export interface AppCopy {
  /** The copy's folder inside the system (`studios`). */
  folder: string
  /** The app's repository, such as `Endless-Game-Making-Studio/studio`. */
  repository: string | null
  /** The app's revision the files were copied at. */
  revision: string | null
  /** The app repository's folder the copy mirrors, such as `frontend/app`. */
  root: string | null
}

export interface AppFile {
  /** Inside the copy: `components/App/StudioSidebar.vue`. */
  path: string
  /** Repository-relative. */
  file: string
  /** How the system's code imports it: `~/components/App/StudioSidebar.vue`. */
  specifier: string
  /**
   * The same file in the app's own repository
   * (`frontend/app/components/App/StudioSidebar.vue`), or null when the
   * copy's record names no root.
   */
  appPath: string | null
}

/** The app file with its text at the copy's revision, for the Lab. */
export interface AppOriginal extends AppFile {
  revision: string | null
  source: string
}

const text = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null

function recordOf(file: string): Record<string, unknown> {
  if (!existsSync(file)) return {}
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(
    readFileSync(file, 'utf8'),
  )
  try {
    const data: unknown = match ? parse(match[1]!) : null
    return data && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

/** The system's app copy and what its record says, or null without one. */
export function appCopy(system: InstalledSystem): AppCopy | null {
  const folder = system.spec.app.source
  if (!folder) return null
  const data = recordOf(path.join(system.dir, folder, COPY_RECORD))
  // YAML reads an all-digit revision as a number.
  const revision =
    typeof data.revision === 'number' ? String(data.revision) : data.revision
  return {
    folder: posix(folder).replace(/\/+$/, ''),
    repository: text(data.repository),
    revision: text(revision),
    root: text(data.root)?.replace(/\/+$/, '') ?? null,
  }
}

/**
 * The copied file a component's `app` field names, or why it can't be one:
 * it has to be a `.vue` file inside the copy that exists.
 */
export function appFile(
  system: InstalledSystem,
  copy: AppCopy | null,
  declared: unknown,
): { file: AppFile } | { problem: string } | null {
  const named = text(declared)
  if (named === null) return null
  if (!copy)
    return {
      problem: `names the app file ${named}, but ${system.folder}/system.ts has no app.source to find it in`,
    }
  const base = path.join(system.dir, copy.folder)
  const absolute = path.resolve(base, named)
  const inside = posix(path.relative(base, absolute))
  if (
    inside.startsWith('../') ||
    path.isAbsolute(inside) ||
    !inside.endsWith('.vue') ||
    !existsSync(absolute)
  )
    return {
      problem: `names the app file ${named}, which isn’t a .vue file in ${system.folder}/${copy.folder}`,
    }
  return {
    file: {
      path: inside,
      file: `${system.folder}/${copy.folder}/${inside}`,
      specifier: `~/${inside}`,
      appPath: copy.root ? `${copy.root}/${inside}` : null,
    },
  }
}

/** The app file's text, with the copy's revision. */
export function appOriginal(
  system: InstalledSystem,
  copy: AppCopy,
  file: AppFile,
): AppOriginal {
  return {
    ...file,
    revision: copy.revision,
    source: readFileSync(
      path.join(system.dir, copy.folder, file.path),
      'utf8',
    ).replace(/\r\n?/g, '\n'),
  }
}
