// The module registry: every folder in the modules folder with a `module.ts`,
// and whether `studio.config.json` turns it on. The `studio` command and the
// Nuxt module both read the studio through it.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { StudioModule } from './contract.ts'

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
  'rail',
  'pages',
  'palette',
  'skills',
  'content',
  'data',
])
const RAIL = new Set(['top', 'bottom', 'none'])

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
    }
  const rail = module.rail as Record<string, unknown> | undefined
  if (rail !== undefined) {
    if (!RAIL.has(rail?.position as string))
      problems.push(`${where}: the rail position is top, bottom or none.`)
    else if (rail.position !== 'none' && !rail.to && !pages.length)
      problems.push(`${where}: a rail button needs a page or a "to" address.`)
  }
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
  return problems
}

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

export function readConfig(file: string): StudioConfig {
  return JSON.parse(readFileSync(file, 'utf8'))
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
