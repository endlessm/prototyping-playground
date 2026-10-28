// The module commands: list, enable, disable, remove and create-module.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ID,
  loadRegistry,
  MODULES_FOLDER,
  pageAddresses,
  PLAIN_TEXT,
  type InstalledModule,
  type Registry,
  type StudioConfig,
} from '../modules/registry.ts'
import { NOTHING_CHANGED, Refusal, RESTART, say, type Flags } from './output.ts'

const TEMPLATE = fileURLToPath(new URL('./templates/module/', import.meta.url))

async function registry(root: string) {
  try {
    return await loadRegistry(root)
  } catch (error) {
    throw new Refusal((error as Error).message)
  }
}

function find(studio: Registry, id: string | undefined, usage: string) {
  if (!id) throw new Refusal(`Usage: yarn studio ${usage}`)
  const module = studio.modules.find(({ spec }) => spec.id === id)
  if (!module)
    throw new Refusal(
      `No module has the id "${id}". Installed: ${
        studio.modules.map(({ spec }) => spec.id).join(', ') || 'none'
      }.`,
    )
  return module
}

function writeConfig(studio: Registry, config: StudioConfig) {
  writeFileSync(studio.configFile, `${JSON.stringify(config, null, 2)}\n`)
}

function withModule(config: StudioConfig, id: string, on: boolean | null) {
  // Switching keeps the module's place in the file; removing drops it.
  const modules =
    on === null
      ? Object.fromEntries(
          Object.entries(config.modules ?? {}).filter(([key]) => key !== id),
        )
      : { ...config.modules, [id]: on }
  return { ...config, modules }
}

// The default system is stored as its permanent id, which only its
// declaration knows.
function systemId(root: string, key: string) {
  const file = path.join(root, 'src/systems', key, 'system.ts')
  if (!existsSync(file)) return undefined
  return readFileSync(file, 'utf8').match(
    /studioId:\s*["']([a-z0-9]+)["']/,
  )?.[1]
}

export async function listModules(root: string) {
  const studio = await registry(root)
  const width = Math.max(
    12,
    ...studio.modules.map(({ spec }) => spec.id.length),
  )
  say('Modules')
  if (!studio.modules.length) say(`  None in ${MODULES_FOLDER}/.`)
  for (const { spec, state } of studio.modules) {
    say(
      `  ${spec.id.padEnd(width)}  ${state.padEnd(12)}  ${
        spec.required ? 'required' : 'can be turned off'
      }`,
    )
    if (spec.description) say(`  ${''.padEnd(width)}  ${spec.description}`)
  }
  say()
  say('Systems')
  for (const key of studio.config.systems ?? [])
    say(
      `  ${key.padEnd(width)}  ${
        systemId(root, key) === studio.config.defaultSystem ? 'default' : ''
      }`.trimEnd(),
    )
}

async function setEnabled(root: string, id: string | undefined, on: boolean) {
  const studio = await registry(root)
  const module = find(studio, id, `${on ? 'enable' : 'disable'} <module>`)
  const { spec } = module
  if (!on && spec.required)
    throw new Refusal(
      `${spec.label} is required, so it can't be turned off; other parts of the studio use it.`,
    )
  if (studio.config.modules?.[spec.id] === on) {
    say(`${spec.label} is already ${on ? 'on' : 'off'}.`)
    return
  }
  writeConfig(studio, withModule(studio.config, spec.id, on))
  say(
    on
      ? `${spec.label} is on.`
      : `${spec.label} is off. Its files are still there; turn it on again any time.`,
  )
  say(RESTART)
}

export const enableModule = (root: string, [id]: string[]) =>
  setEnabled(root, id, true)
export const disableModule = (root: string, [id]: string[]) =>
  setEnabled(root, id, false)

const CODE = /\.(?:[cm]?[jt]s|vue)$/
const SKIPPED = new Set(['node_modules', '.git', '.output', '.nuxt', '.data'])

function codeFiles(dir: string, skip: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name)
    if (file === skip || SKIPPED.has(entry.name) || entry.name.startsWith('.'))
      return []
    if (entry.isDirectory()) return codeFiles(file, skip)
    return CODE.test(entry.name) ? [file] : []
  })
}

// Files outside the module that import from its folder.
function consumers(root: string, module: InstalledModule) {
  const reference = new RegExp(
    `["'\`][^"'\`\\n]*\\bmodules/${module.spec.id}(?:/[^"'\`\\n]*)?["'\`]`,
  )
  return ['app', 'src', 'tooling']
    .flatMap((folder) => codeFiles(path.join(root, folder), module.dir))
    .filter((file) => reference.test(readFileSync(file, 'utf8')))
    .map((file) => path.relative(root, file).split(path.sep).join('/'))
}

export async function removeModule(root: string, [id]: string[], flags: Flags) {
  const studio = await registry(root)
  const module = find(
    studio,
    id,
    'remove <module> [--content] [--force] [--yes]',
  )
  const { spec } = module
  if (spec.id === 'contributors')
    throw new Refusal(
      'The studio is always in team use, which needs Contributors & Permissions, so it stays.',
    )
  if (spec.required)
    throw new Refusal(
      `${spec.label} is required, so it can't be removed; other parts of the studio use it.`,
    )
  const users = consumers(root, module)
  if (users.length && !flags.force)
    throw new Refusal(
      `${users.length} file(s) import ${spec.id}, like ${users[0]}, and would stop working. Change them first, or add --force.`,
    )
  const deleted = [module.folder]
  const notes: string[] = []
  const content = spec.content?.replace(/\/+$/, '')
  if (
    content &&
    !`${content}/`.startsWith(`${module.folder}/`) &&
    existsSync(path.join(root, content))
  ) {
    if (flags.content) deleted.push(content)
    else
      notes.push(
        `Its content in ${content}/ stays. Add --content to delete that too.`,
      )
  }
  notes.push(
    'npm packages it used stay installed; remove them with yarn remove if nothing else needs them.',
  )
  say('This would delete:')
  for (const folder of deleted) say(`  ${folder}/`)
  say(`and take ${spec.id} out of studio.config.json.`)
  for (const note of notes) say(note)
  if (!flags.yes) {
    say()
    say(NOTHING_CHANGED)
    return
  }
  for (const folder of deleted)
    rmSync(path.join(root, folder), { recursive: true, force: true })
  writeConfig(studio, withModule(studio.config, spec.id, null))
  say(`Removed ${spec.label}.`)
  say(RESTART)
}

const titleOf = (id: string) =>
  id
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

function templateFiles(dir: string, prefix = ''): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? templateFiles(path.join(dir, entry.name), `${prefix}${entry.name}/`)
      : [`${prefix}${entry.name}`],
  )
}

// What else already answers to the id: a module, a page address, a
// contributor, a prototype folder, or one of the app's own pages.
function taken(root: string, studio: Registry, id: string) {
  if (existsSync(path.join(root, MODULES_FOLDER, id)))
    return `There's already a module called "${id}".`
  if (pageAddresses(root, studio.modules).has(id))
    return `/${id} is already the address of another page. Choose another id.`
  if (existsSync(path.join(root, 'contributors', `${id}.json`)))
    return `"${id}" is a contributor's key. Choose another id.`
  if (existsSync(path.join(root, 'src/prototypes', id)))
    return `"${id}" is a prototype folder. Choose another id.`
  return undefined
}

export async function createModule(root: string, [id]: string[], flags: Flags) {
  if (!id || !ID.test(id))
    throw new Refusal(
      'Usage: yarn studio create-module <id> [--label <name>] [--yes]. The id is lowercase letters, numbers and dashes.',
    )
  const label = typeof flags.label === 'string' ? flags.label : titleOf(id)
  if (!PLAIN_TEXT.test(label) || /[{}]/.test(label))
    throw new Refusal('The label should be plain text.')
  const studio = await registry(root)
  const problem = taken(root, studio, id)
  if (problem) throw new Refusal(problem)
  const folder = `${MODULES_FOLDER}/${id}`
  const fill = (text: string, file: string) =>
    text
      .replaceAll('__ID__', id)
      .replaceAll(
        '__LABEL__',
        file.endsWith('.ts') ? label.replaceAll("'", "\\'") : label,
      )
  const files = templateFiles(TEMPLATE).map((source) => ({
    source,
    target: `${folder}/${fill(source.replace(/\.tpl$/, ''), '')}`,
  }))
  for (const { target } of files) say(`Create ${target}`)
  say(`Turn ${id} on in studio.config.json.`)
  if (!flags.yes) {
    say()
    say(NOTHING_CHANGED)
    return
  }
  for (const { source, target } of files) {
    const file = path.join(root, target)
    mkdirSync(path.dirname(file), { recursive: true })
    writeFileSync(
      file,
      fill(readFileSync(path.join(TEMPLATE, source), 'utf8'), target),
    )
  }
  writeConfig(studio, withModule(studio.config, id, true))
  say(`Made the module "${label}" in ${folder}/, with a page at /${id}.`)
  say(RESTART)
}
