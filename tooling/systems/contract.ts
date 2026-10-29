// What a design system declares in its `system.ts`. The declaration is plain
// data, so the `studio` command, the manifest and the preview build all read
// it with Node.

export type SystemStatus = 'active' | 'archived'
export type ColorMode = 'light' | 'dark'

export interface SystemLibrary {
  kind: 'package'
  id: string
  label: string
  /** The npm package, a dependency in the system's own `package.json`. */
  package: string
  description?: string
  docs?: string
  /** Documented components, by folder name under `components/`. */
  components?: string[]
}

/** A named export of a file in the system's folder. */
export interface SystemExport {
  from: string
  name: string
}

/**
 * The system's Vue app, which the preview document holds. Paths are relative
 * to the system's folder.
 */
export interface SystemApp {
  /**
   * Creates every Vue app of the system: `(options) => App`, where options
   * carry the view's `component`, its `props` and `system`: the view's
   * `export const system` with its state's `system` over it, which only the
   * system gives a meaning.
   */
  factory: SystemExport
  /** The app's stylesheet, compiled with Tailwind for the preview only. */
  stylesheet?: string
  /** Nuxt UI, configured as in the app's `app.config.ts`. */
  nuxtUi?: {
    /** A file whose default export is the `ui` key of the app config. */
    config: string
    /** The theme colour names the app config uses. */
    colors: string[]
  }
  /**
   * Names auto-imported into views and system code, as Nuxt auto-imports
   * them in the app, answered by the system's stand-ins.
   */
  standIns?: { from: string; imports: string[] }
  /** The copied app source, which `~/` points at. */
  source?: string
  /** Bare specifiers answered by stand-ins, matched whole. */
  aliases?: Record<string, string>
}

export interface SystemSpec {
  label: string
  status: SystemStatus
  role: 'prototype'
  /** Added to the preview document's root element. */
  themeClass?: string
  styling: 'tailwind' | 'custom'
  /** The modes the system's content supports; light first. */
  colorModes: ColorMode[]
  docs: 'warn' | 'strict' | 'off'
  libraries: SystemLibrary[]
  /** Where the system came from, if imported. */
  origin: string | null
  /** The permanent ID prototypes store as `systemId`. */
  studioId: string
  app: SystemApp
}
