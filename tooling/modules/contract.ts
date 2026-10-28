// What a studio module declares in its `module.ts`. The declaration is plain
// data apart from build data loaders, so the `studio` command and the Nuxt
// module both read it with Node.

export type RailPosition = 'top' | 'bottom' | 'none'

export interface ModulePage {
  /** The address, under `/<module id>`. */
  path: string
  /** The Vue page, relative to the module's folder. */
  file: string
}

export interface ModuleRail {
  position: RailPosition
  /** An Iconify name, such as `i-lucide-book-open`. */
  icon?: string
  /** Lower numbers sit higher on the rail. */
  order?: number
  /** Where the button goes; the first page by default. */
  to?: string
}

/** A command palette entry, as data. */
export interface ModulePaletteEntry {
  label: string
  to: string
  icon?: string
  group?: string
}

/** An agent skill the generated part of `AGENTS.md` routes to. */
export interface ModuleSkill {
  /** The skill's folder, relative to the module's folder. */
  path: string
  /** Completes "When the person …". */
  when: string
}

/** Reads a file's permanent identity; throws on a malformed declaration. */
export interface IdentityReader {
  read: (source: string) => string | null
}

/** A kind of artifact file in prototypes, such as views. */
export interface ModuleFileType {
  /** Lowercase letters, numbers and dashes. */
  id: string
  /** Plain text. */
  label: string
  /** Lowercase file extensions with the dot, such as `.vue`. */
  extensions: string[]
  /**
   * A file whose `identity` export is the type's IdentityReader, relative
   * to the module's folder. It runs on Node.
   */
  identity: string
  /** The Vue component an artifact page renders, relative to the folder. */
  page: string
}

export interface BuildDataContext {
  /** The studio's root folder. */
  root: string
  /** This module's folder. */
  dir: string
  /** The ids of the enabled modules. */
  enabled: string[]
}

/**
 * Named data a module computes on Node, on demand: in development on the
 * first request, cached until a watched file changes; in the build, once.
 * Values must be JSON.
 */
export interface ModuleBuildData {
  /** Repository-relative files or globs whose changes make the data stale. */
  watch: string[]
  load: (context: BuildDataContext) => unknown
}

export interface StudioModule {
  /** Lowercase letters, numbers and dashes; also the module's folder name. */
  id: string
  /** Plain text, shown on the rail and in `studio list`. */
  label: string
  description?: string
  /** A required module can't be turned off or removed. */
  required?: boolean
  rail?: ModuleRail
  pages?: ModulePage[]
  palette?: ModulePaletteEntry[]
  skills?: ModuleSkill[]
  /** A repository-relative folder of content `studio remove` keeps. */
  content?: string
  fileTypes?: ModuleFileType[]
  data?: Record<string, ModuleBuildData>
}
