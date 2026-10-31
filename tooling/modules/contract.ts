// What a studio module declares in its `module.ts`. The declaration is plain
// data apart from build data loaders, so the `studio` command and the Nuxt
// module both read it with Node.

export type RailPosition = 'top' | 'bottom' | 'none'

export interface ModulePage {
  /** The address, under `/<module id>`. */
  path: string
  /** The Vue page, relative to the module's folder. */
  file: string
  /**
   * Pages shown inside this one (its `<NuxtPage />`), which stays on screen
   * while they change. Their addresses continue this one's, with no leading
   * slash; `''` is the page at this address.
   */
  children?: ModulePage[]
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
  /** Hidden search synonyms. */
  keywords?: string[]
}

/** An agent skill the generated part of `AGENTS.md` routes to. */
export interface ModuleSkill {
  /** The skill's folder, relative to the module's folder. */
  path: string
  /** Completes "When the person …". */
  when: string
}

/**
 * A file type's permanent identity in its files. It lives in a comment or
 * metadata, never in executable code (ADR 0001).
 */
export interface IdentityAdapter {
  /**
   * Where a file of this type declares it, completing "it belongs in …":
   * "a top-level \"studioId\"". A leading `<!-- @studio-id … -->` comment
   * by default.
   */
  where?: string
  /** The declared identity, or null; throws on a malformed declaration. */
  read: (source: string) => string | null
  /** The source with `id` declared; throws if it already declares one. */
  write: (source: string, id: string) => string
  /**
   * Child artifacts declared inside the file, such as a view's named
   * states, each keyed by a name unique in the file and with an identity of
   * its own, also kept in comments.
   */
  children?: {
    /** In declaration order; throws on a malformed declaration. */
    read: (source: string) => { key: string; studioId: string | null }[]
    /** The source with the child `key` given `id`. */
    write: (source: string, key: string, id: string) => string
  }
}

/** A file type whose artifacts can be drawn lo-fi. */
export interface FidelityAdapter {
  isLofi: (source: string) => boolean
  /** The source switched to lo-fi (`on`) or back to hi-fi. */
  setLofi: (source: string, on: boolean) => string
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
   * A file whose `identity` export is the type's IdentityAdapter, relative
   * to the module's folder. It runs on Node.
   */
  identity: string
  /**
   * A file whose `check` export (`FileCheck`) lists the problems of one
   * file's source as sentences, relative to the module's folder. It runs on
   * Node, and the build fails on any problem.
   */
  check?: string
  /**
   * A file whose `fidelity` export is the type's FidelityAdapter, relative
   * to the module's folder. Its artifacts get "Make lo-fi" and "Make hi-fi".
   */
  fidelity?: string
  /**
   * A file whose `template` export gives a new file's source from its title,
   * relative to the module's folder. The studio adds the identity.
   */
  template?: string
  /** The Vue component an artifact page renders, relative to the folder. */
  page: string
  /**
   * The Vue component that previews an artifact embedded in a document,
   * relative to the folder. A type without one shows as a card there.
   */
  embed?: string
  /**
   * Where `embed` previews the artifact: in documents, on canvases, or (by
   * default) both. Elsewhere it shows as a card.
   */
  embedIn?: ('document' | 'canvas')[]
  /**
   * A small Vue component, relative to the folder, shown while `embed`
   * loads, so the loading looks like the preview's own opening. It is in
   * the studio's main bundle: it must not import the preview. It and the
   * preview get `startedAt`, when loading began. Without one, a generic
   * "Loading preview…" shows.
   */
  embedPending?: string
  /** An Iconify name for navigation, file lists and cards. */
  icon?: string
  /**
   * Whether the page reads the file's text, which the deployed site then
   * ships as a file of its own (documents do; views compile instead).
   */
  text?: boolean
}

/**
 * Problems with one file's source, each completing "<file>: …" and saying
 * how to fix it. `prototypeId` is the permanent ID of the prototype the file
 * is in, when it is known.
 */
export type FileCheck = (
  source: string,
  context?: { prototypeId?: string },
) => string[]

export interface BuildDataContext {
  /** The studio's root folder. */
  root: string
  /** This module's folder. */
  dir: string
  /** The ids of the enabled modules. */
  enabled: string[]
  /** Whether the data is for the dev server, rather than the build. */
  dev: boolean
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

/** What a module shows on Home: a block under the search field. */
export interface ModuleHome {
  /** The Vue component, relative to the module's folder. */
  component: string
  /**
   * Where the block sits, low first: locally, where your own work comes
   * first, and on the deployed site, where what colleagues come for does.
   * 50 by default.
   */
  order?: { local?: number; deployed?: number }
}

/** A setting a module keeps for each contributor: text, a number, yes or no. */
export type PreferenceValue = string | number | boolean | null

/**
 * The module's section of each contributor's `preferences`. Every value has
 * the type of its default, and only declared names are allowed.
 */
export interface ModulePreferences {
  defaults: Record<string, PreferenceValue>
}

/** A request to a module's handler on the local dev server. */
export interface ModuleServerRequest {
  /** The studio's root folder. */
  root: string
  /** The contributor profiles' folder, absolute. */
  contributorsFolder: string
  /** The contributor your Git identity resolves to, or null. */
  me: string | null
  method: string
  /** The parsed JSON body, or undefined. */
  body: unknown
}

/**
 * A module's handler on the local dev server, the default export of its
 * file. It answers with JSON; a thrown error with a `status` answers with
 * that status and the error's message.
 */
export type ModuleServerHandler = (
  request: ModuleServerRequest,
) => unknown | Promise<unknown>

export interface StudioModule {
  /** Lowercase letters, numbers and dashes; also the module's folder name. */
  id: string
  /** Plain text, shown on the rail and in `studio list`. */
  label: string
  description?: string
  /** A required module can't be turned off or removed. */
  required?: boolean
  /**
   * Only for the studio running locally: the deployed site gets none of the
   * module's pages, rail button, palette entries or Home block.
   */
  localOnly?: boolean
  rail?: ModuleRail
  home?: ModuleHome
  pages?: ModulePage[]
  palette?: ModulePaletteEntry[]
  /** Manifest content to list; static entries can also declare a group. */
  paletteSource?: 'prototypes' | 'systems'
  paletteOrder?: number
  skills?: ModuleSkill[]
  /** A repository-relative folder of content `studio remove` keeps. */
  content?: string
  fileTypes?: ModuleFileType[]
  /**
   * A file whose "references" export lists reference adapters
   * (ReferenceAdapter in tooling/files/references.ts): where a kind of
   * source names other files, so renames and moves can repair them. They
   * keep working while the module is turned off.
   */
  references?: string
  /**
   * A browser file, relative to the module's folder, whose default export
   * (`PrototypeActions` in src/modules/prototypes/utils/actions.ts) gives
   * the module's items for a prototype's menu, such as a publish action.
   * They show only to whoever may change the prototype.
   */
  prototypeActions?: string
  data?: Record<string, ModuleBuildData>
  preferences?: ModulePreferences
  /**
   * Handlers on the local dev server only, by name: each answers same-origin
   * requests at `<base>_studio/modules/<id>/<name>` from a `.ts` file,
   * relative to the module's folder, whose default export is a
   * ModuleServerHandler. The deployed site has none.
   */
  server?: Record<string, string>
}
