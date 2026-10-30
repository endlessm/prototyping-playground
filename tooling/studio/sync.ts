import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { loadRegistry } from '../modules/registry.ts'
import { Refusal, type Flags } from './output.ts'

const START = '<!-- studio:modules -->'
const END = '<!-- /studio:modules -->'
const INDEX = '.agents/studio-skills.json'
const hash = (text: string) =>
  createHash('sha256').update(text.replaceAll('\r\n', '\n')).digest('hex')
const read = (file: string) =>
  fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''

/** Resolve only ordinary folders inside the owner, including every parent. */
function skillFile(root: string, owner: string, folder: string) {
  const base = path.resolve(root, owner)
  const target = path.resolve(
    base,
    folder.replace(/SKILL\.md$/, ''),
    'SKILL.md',
  )
  const relative = path.relative(base, target)
  if (relative.startsWith('..') || path.isAbsolute(relative))
    throw new Refusal(`Invalid skill path: ${owner}/${folder}.`)
  let current = root
  for (const part of path.relative(root, target).split(path.sep)) {
    current = path.join(current, part)
    if (!fs.existsSync(current) || fs.lstatSync(current).isSymbolicLink())
      throw new Refusal(`Missing or linked skill path: ${current}.`)
  }
  return path.relative(root, target).split(path.sep).join('/')
}

export async function sync(root: string, _args: string[], flags: Flags) {
  const registry = await loadRegistry(root)
  const expected: Record<string, string> = {}
  const routes: string[] = []
  const sources = new Map<string, string>()
  const add = (
    prefix: string,
    owner: string,
    folder: string,
    module?: string,
  ) => {
    const source = skillFile(root, owner, folder)
    const name = `${prefix}-${path.basename(path.dirname(source))}`
    if (!/^[a-z][a-z0-9-]{0,63}$/.test(name))
      throw new Refusal(`Invalid skill name: ${name}.`)
    if (sources.get(name) === source) return
    if (sources.has(name)) throw new Refusal(`Duplicate skill name: ${name}.`)
    sources.set(name, source)
    const canonical = read(path.join(root, source))
    const description =
      canonical
        .match(/^description:\s*(.+)$/m)?.[1]
        ?.replace(/^['"]|['"]$/g, '') ?? `Read ${source}.`
    const quotedDescription = description.includes("'")
      ? JSON.stringify(description)
      : `'${description}'`
    for (const harness of ['.agents', '.claude']) {
      const file = `${harness}/skills/${name}/SKILL.md`
      if (expected[file]) throw new Refusal(`Duplicate skill name: ${name}.`)
      expected[file] =
        `---\nname: ${name}\ndescription: ${quotedDescription}\n---\n\nRead [the canonical skill](../../../${source}).\n\n${module ? `Confirm module \`${module}\` is enabled with \`yarn studio list\` before using it.\n` : prefix === 'studio-platform' ? 'Follow the canonical platform procedure.\n' : 'Use system skills only for that system or its assigned prototypes.\n'}`
    }
  }
  const discover = (prefix: string, owner: string, module?: string) => {
    const dir = path.join(root, owner, 'skills')
    if (!fs.existsSync(dir)) return
    for (const entry of fs
      .readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name)))
      if (
        entry.isDirectory() &&
        fs.existsSync(path.join(dir, entry.name, 'SKILL.md'))
      )
        add(prefix, owner, `skills/${entry.name}`, module)
  }
  discover('studio-platform', 'src/platform')
  for (const { spec, folder } of registry.enabled) {
    discover(`studio-module-${spec.id}`, folder, spec.id)
    for (const skill of spec.skills ?? []) {
      const source = skillFile(root, folder, skill.path)
      if (typeof skill.when !== 'string' || /[\r\n<>]/.test(skill.when))
        throw new Refusal(`Invalid skill trigger in ${spec.id}.`)
      routes.push(
        `When the person ${skill.when}, read [${spec.label}: ${path.basename(path.dirname(source))}](${source}).`,
      )
      add(`studio-module-${spec.id}`, folder, skill.path, spec.id)
    }
  }
  for (const key of registry.config.systems ?? []) {
    if (!/^[a-z][a-z0-9-]*$/.test(key))
      throw new Refusal(`Invalid system key: ${key}.`)
    discover(`studio-${key}`, `src/systems/${key}`)
  }
  const agents = read(path.join(root, 'AGENTS.md'))
  const block = [START, '', ...routes, END].join('\n')
  const start = agents.indexOf(START),
    end = agents.indexOf(END)
  if (
    (start === -1) !== (end === -1) ||
    (start >= 0 &&
      (end < start ||
        agents.indexOf(START, start + START.length) >= 0 ||
        agents.indexOf(END, end + END.length) >= 0))
  )
    throw new Refusal(
      'AGENTS.md needs exactly one complete studio:modules block.',
    )
  expected['AGENTS.md'] =
    start < 0
      ? `${agents}${agents.endsWith('\n') ? '\n' : '\n\n'}${block}\n`
      : agents.slice(0, start) + block + agents.slice(end + END.length)
  expected['CLAUDE.md'] = '@AGENTS.md\n'
  const previous: Record<string, string> = JSON.parse(
    read(path.join(root, INDEX)) || '{}',
  )
  if (
    !previous ||
    typeof previous !== 'object' ||
    Array.isArray(previous) ||
    Object.entries(previous).some(
      ([file, digest]) =>
        !/^\.(agents|claude)\/skills\/studio-[a-z0-9-]+\/SKILL\.md$/.test(
          file,
        ) ||
        typeof digest !== 'string' ||
        !/^[a-f0-9]{64}$/.test(digest),
    )
  )
    throw new Refusal(
      'Invalid skill adapter manifest. Preserve work and repair .agents/studio-skills.json before syncing.',
    )
  const next = Object.fromEntries(
    Object.entries(expected)
      .filter(([file]) => file.includes('/skills/'))
      .map(([file, text]) => [file, hash(text)]),
  )
  const problems: string[] = []
  const changes: string[] = []
  // Validate all destinations before writing any of them, including stale adapters.
  for (const file of [
    INDEX,
    ...Object.keys(previous),
    ...Object.keys(expected),
  ]) {
    let current = root
    for (const part of file.split('/')) {
      current = path.join(current, part)
      if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink())
        throw new Refusal(`Refusing linked guidance destination: ${file}.`)
    }
  }
  const write = (file: string, text: string) => {
    if (
      read(path.join(root, file)).replaceAll('\r\n', '\n') ===
      text.replaceAll('\r\n', '\n')
    )
      return
    changes.push(file)
    if (!flags.check) {
      fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
      fs.writeFileSync(path.join(root, file), text)
    }
  }
  for (const file of new Set([
    ...Object.keys(previous),
    ...Object.keys(expected),
  ])) {
    const current = read(path.join(root, file))
    if (
      file.includes('/skills/') &&
      current &&
      (previous[file]
        ? hash(current) !== previous[file]
        : current !== expected[file])
    ) {
      problems.push(`Preserved edited or hand-written adapter: ${file}`)
      if (previous[file]) next[file] = previous[file]
      continue
    }
    if (expected[file] !== undefined) write(file, expected[file])
    else if (current) {
      changes.push(file)
      if (!flags.check) fs.unlinkSync(path.join(root, file))
    }
  }
  write(INDEX, `${JSON.stringify(next, null, 2)}\n`)
  if (problems.length) throw new Refusal(problems.join('\n'))
  if (flags.check && changes.length)
    throw new Refusal(
      `Guidance is stale: ${changes.join(', ')}. Run yarn studio sync.`,
    )
  if (!flags.json)
    console.log(
      flags.check
        ? 'Guidance is current.'
        : `Guidance synced (${changes.length} files).`,
    )
}

/** A new Node process sees changed module declarations without cached imports. */
export function syncInFreshProcess(root: string) {
  const result = spawnSync(
    process.execPath,
    [path.join(root, 'tooling/studio/cli.ts'), 'sync'],
    { cwd: root, encoding: 'utf8', env: process.env },
  )
  if (result.status !== 0)
    throw new Refusal(result.stderr || 'Guidance sync failed.')
}
