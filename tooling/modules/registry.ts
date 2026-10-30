// The module registry: every folder in the modules folder with a `module.ts`,
// and whether `studio.config.json` turns it on. The `studio` command and the
// Nuxt module both read the studio through it.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ModulePreferences, StudioModule } from './contract.ts'
import { parseConfig } from '../settings/config-file.ts'

export const MODULES_FOLDER = 'src/modules'
export const CONFIG_FILE = 'studio.config.json'

export const ID = /^[a-z][a-z0-9-]*$/
// Labels appear in Markdown, on the rail and in generated files.
export const PLAIN_TEXT = /^[^\n\r<>`$\\]+$/

/** `unregistered`: the folder is there, but the configuration doesn't list it. */
export type ModuleState = 'on' | 'off' | 'unregistered'

export interface InstalledModule {
  spec: StudioModule
  /** Absolute path of the module's folder. */
  dir: string
  /** The folder, relative to the studio's root, with forward slashes. */
  folder: string
  state: ModuleState
}

export interface StudioConfig {
  modules?: Record<string, boolean>
  systems?: string[]
  defaultSystem?: string
  [key: string]: unknown
}

export interface Registry {
  root: string
  configFile: string
  config: StudioConfig
  modules: InstalledModule[]
  enabled: InstalledModule[]
}

export interface RegistryOptions {
  /** The modules folder; `src/modules` in the studio's root by default. */
  modulesFolder?: string
  /** The configuration file; `studio.config.json` in the root by default. */
  configFile?: string
}

const KEYS = new Set([
  'id',
  'label',
  'description',
  'required',
  'localOnly',
  'rail',
  'home',
  'pages',
  'palette',
  'skills',
  'content',
  'fileTypes',
  'references',
  'data',
  'preferences',
])
const RAIL = new Set(['top', 'bottom', 'none'])

/** Whether a page's children are malformed, at any depth. */
function childPagesProblem(children: unknown): boolean {
  if (children === undefined) return false
  if (!Array.isArray(children)) return true
  return children.some((child) => {
    const {
      path: address,
      file,
      children: nested,
    } = (child ?? {}) as Record<string, unknown>
    return (
      typeof address !== 'string' ||
      address.startsWith('/') ||
      typeof file !== 'string' ||
      !file.endsWith('.vue') ||
      childPagesProblem(nested)
    )
  })
}

/** Problems with one declaration, each a sentence naming the module. */
export function moduleProblems(spec: unknown, folderName: string): string[] {
  const where = `${folderName}/module.ts`
  if (!spec || typeof spec !== 'object' || Array.isArray(spec))
    return [`${where} must export a module declaration as its default.`]
  const module = spec as Record<string, unknown>
  const problems: string[] = []
  for (const key of Object.keys(module))
    if (!KEYS.has(key))
      problems.push(`${where}: modules don't declare "${key}".`)
  if (typeof module.id !== 'string' || !ID.test(module.id))
    problems.push(
      `${where}: the id must be lowercase letters, numbers and dashes.`,
    )
  else if (module.id !== folderName)
    problems.push(`${where}: the id "${module.id}" must match its folder.`)
  if (typeof module.label !== 'string' || !PLAIN_TEXT.test(module.label))
    problems.push(`${where}: the label must be plain text.`)
  const pages = (module.pages ?? []) as unknown[]
  if (!Array.isArray(pages)) problems.push(`${where}: pages must be a list.`)
  else
    for (const page of pages) {
      const { path: address, file } = (page ?? {}) as Record<string, unknown>
      if (
        typeof address !== 'string' ||
        (address !== `/${module.id}` && !address.startsWith(`/${module.id}/`))
      )
        problems.push(
          `${where}: each page's address must start with /${String(module.id)}.`,
        )
      if (typeof file !== 'string' || !file.endsWith('.vue'))
        problems.push(`${where}: each page names its .vue file.`)
      if (childPagesProblem((page as Record<string, unknown>)?.children))
        problems.push(
          `${where}: a child page’s address continues its parent’s, without a leading slash, and names its .vue file.`,
        )
    }
  const rail = module.rail as Record<string, unknown> | undefined
  if (rail !== undefined) {
    if (!RAIL.has(rail?.position as string))
      problems.push(`${where}: the rail position is top, bottom or none.`)
    else if (rail.position !== 'none' && !rail.to && !pages.length)
      problems.push(`${where}: a rail button needs a page or a "to" address.`)
  }
  if (module.localOnly !== undefined && typeof module.localOnly !== 'boolean')
    problems.push(`${where}: localOnly is true or false.`)
  if (module.home !== undefined) {
    const { component, order } = (module.home ?? {}) as Record<string, unknown>
    const places = (order ?? {}) as Record<string, unknown>
    if (
      typeof component !== 'string' ||
      !component.endsWith('.vue') ||
      typeof places !== 'object' ||
      Object.entries(places).some(
        ([where, value]) =>
          !['local', 'deployed'].includes(where) || typeof value !== 'number',
      )
    )
      problems.push(
        `${where}: the Home block names its .vue component and optional numeric local and deployed orders.`,
      )
  }
  const fileTypes = module.fileTypes
  if (fileTypes !== undefined) {
    if (!Array.isArray(fileTypes))
      problems.push(`${where}: file types must be a list.`)
    else
      for (const type of fileTypes) {
        const { id, label, extensions, identity, page } = (type ??
          {}) as Record<string, unknown>
        if (
          typeof id !== 'string' ||
          !ID.test(id) ||
          typeof label !== 'string' ||
          !PLAIN_TEXT.test(label) ||
          !Array.isArray(extensions) ||
          !extensions.length ||
          extensions.some(
            (extension) =>
              typeof extension !== 'string' || !/^\.[a-z0-9]+$/.test(extension),
          ) ||
          typeof identity !== 'string' ||
          typeof page !== 'string' ||
          !page.endsWith('.vue')
        )
          problems.push(
            `${where}: file type "${String(id)}" needs a lowercase id, a plain-text label, lowercase extensions such as ".vue", an identity reader file and a .vue page.`,
          )
        const { check, template, icon } = (type ?? {}) as Record<
          string,
          unknown
        >
        if (
          [check, template, icon].some(
            (value) => value !== undefined && typeof value !== 'string',
          )
        )
          problems.push(
            `${where}: file type "${String(id)}" names its check and template files and its icon as text.`,
          )
        const { embedIn } = (type ?? {}) as Record<string, unknown>
        if (
          embedIn !== undefined &&
          (!Array.isArray(embedIn) ||
            !embedIn.length ||
            embedIn.some(
              (surface) => surface !== 'document' && surface !== 'canvas',
            ))
        )
          problems.push(
            `${where}: file type "${String(id)}" names the surfaces its preview shows on: “document”, “canvas” or both.`,
          )
      }
  }
  if (
    module.references !== undefined &&
    (typeof module.references !== 'string' ||
      !module.references.endsWith('.ts'))
  )
    problems.push(
      `${where}: "references" names the .ts file whose “references” export lists its reference adapters.`,
    )
  const data = module.data
  if (data !== undefined) {
    if (!data || typeof data !== 'object' || Array.isArray(data))
      problems.push(`${where}: data must be named loaders.`)
    else
      for (const [name, entry] of Object.entries(data)) {
        const { load, watch } = (entry ?? {}) as Record<string, unknown>
        if (
          !ID.test(name) ||
          typeof load !== 'function' ||
          !Array.isArray(watch) ||
          !watch.length ||
          watch.some((pattern) => !validWatch(pattern))
        )
          problems.push(
            `${where}: data "${name}" needs a lowercase name, a load function and repository-relative watch patterns.`,
          )
      }
  }
  if (module.preferences !== undefined) {
    const defaults = (module.preferences as Record<string, unknown> | null)
      ?.defaults
    if (
      !defaults ||
      typeof defaults !== 'object' ||
      Array.isArray(defaults) ||
      Object.values(defaults).some(
        (value) =>
          value !== null &&
          !['string', 'number', 'boolean'].includes(typeof value),
      )
    )
      problems.push(
        `${where}: preferences need defaults: names with text, number, yes/no or null values.`,
      )
  }
  return problems
}

/** The enabled modules the app gets: local-only ones stay off the deployed site. */
export function modulesForApp(
  enabled: InstalledModule[],
  { dev }: { dev: boolean },
) {
  return enabled.filter(({ spec }) => dev || !spec.localOnly)
}

/**
 * What is wrong with a contributor's section for a module, each a short
 * phrase. A missing section is a problem; `preferences` initialises it.
 */
export function preferenceProblems(
  value: unknown,
  declaration: ModulePreferences,
): string[] {
  if (value === undefined) return ['missing']
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return ['must be an object']
  const problems: string[] = []
  for (const [name, setting] of Object.entries(value)) {
    if (!Object.hasOwn(declaration.defaults, name))
      problems.push(`"${name}" isn't a preference`)
    else {
      const fallback = declaration.defaults[name]
      if (
        fallback !== null &&
        setting !== null &&
        typeof setting !== typeof fallback
      )
        problems.push(`"${name}" must be a ${typeof fallback}`)
    }
  }
  return problems
}

/** Each enabled module's default preferences, as a new profile gets them. */
export const preferenceDefaults = (modules: InstalledModule[]) =>
  Object.fromEntries(
    modules
      .filter(({ spec }) => spec.preferences)
      .map(({ spec }) => [
        spec.id,
        structuredClone(spec.preferences!.defaults),
      ]),
  )

/** Repository-relative paths or globs, never outside the studio. */
export function validWatch(pattern: unknown) {
  return (
    typeof pattern === 'string' &&
    pattern.length > 0 &&
    !pattern.startsWith('/') &&
    !pattern.includes('\\') &&
    !pattern.split('/').some((part) => part === '..' || part === '.') &&
    /^[a-zA-Z0-9_./*?{},@-]+$/.test(pattern)
  )
}

/**
 * The first part of every page address: each module's pages and rail
 * button, and the app's own pages. Contributor keys and module ids can't
 * reuse them.
 */
export function pageAddresses(root: string, modules: InstalledModule[]) {
  const addresses = new Set<string>()
  for (const { spec } of modules)
    for (const address of [
      ...(spec.pages ?? []).map((page) => page.path),
      ...(spec.rail?.to ? [spec.rail.to] : []),
    ]) {
      const first = address.split('/')[1]
      if (first) addresses.add(first)
    }
  const pages = path.join(root, 'app/pages')
  if (existsSync(pages))
    for (const entry of readdirSync(pages, { withFileTypes: true })) {
      const name = entry.isDirectory()
        ? entry.name
        : entry.name.replace(/\.vue$/, '')
      if (!name.startsWith('[')) addresses.add(name)
    }
  return addresses
}

export function readConfig(file: string): StudioConfig {
  return parseConfig(readFileSync(file, 'utf8'), file).config
}

/** Reads the configuration and every module's declaration. */
export async function loadRegistry(
  root: string,
  options: RegistryOptions = {},
): Promise<Registry> {
  const configFile = path.resolve(root, options.configFile ?? CONFIG_FILE)
  const config = readConfig(configFile)
  const modulesDir = path.resolve(root, options.modulesFolder ?? MODULES_FOLDER)
  const folders = existsSync(modulesDir)
    ? readdirSync(modulesDir, { withFileTypes: true })
        .filter(
          (entry) =>
            entry.isDirectory() &&
            existsSync(path.join(modulesDir, entry.name, 'module.ts')),
        )
        .map((entry) => entry.name)
        .sort()
    : []
  const problems: string[] = []
  const modules: InstalledModule[] = []
  for (const name of folders) {
    const dir = path.join(modulesDir, name)
    // A query busts Node's module cache when the dev server restarts in-process.
    const url = pathToFileURL(path.join(dir, 'module.ts'))
    url.search = `?t=${Date.now()}`
    const spec = (await import(url.href)).default
    const found = moduleProblems(spec, name)
    problems.push(...found)
    if (found.length) continue
    const switched = config.modules?.[name]
    modules.push({
      spec,
      dir,
      folder: path.relative(root, dir).split(path.sep).join('/'),
      // A required module is on whatever the configuration says.
      state:
        switched === true || spec.required
          ? 'on'
          : switched === false
            ? 'off'
            : 'unregistered',
    })
  }
  if (problems.length) throw new Error(problems.join('\n'))
  return {
    root,
    configFile,
    config,
    modules,
    enabled: modules.filter((module) => module.state === 'on'),
  }
}
