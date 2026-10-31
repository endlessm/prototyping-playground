// The system commands: create-system, rename-system, archive-system,
// restore-system and delete-system, and `remove <system>`. Each prints what
// it would change, which prototypes it touches and which folders another
// program holds, and changes nothing until --yes. Applied, it prints a JSON
// result as its last line. The plans and their rollback live in
// `../systems/lifecycle.ts`, shared with the dev server's file service.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { permissionRefusal, refusalMessage } from '../contributors/roles.ts'
import {
  applyPlan,
  findSystem,
  heldFolders,
  LifecycleError,
  planCreate,
  planLifecycle,
  systemDependents,
  type LifecycleAction,
  type LifecycleOptions,
  type LifecyclePlan,
} from '../systems/lifecycle.ts'
import { NOTHING_CHANGED, Refusal, RESTART, say, type Flags } from './output.ts'
import { yarn } from './package-manager.ts'
import { session } from './permissions.ts'

const options = (root: string): LifecycleOptions => ({
  root,
  yarn: (args) => yarn(root, args),
})

const relative = (root: string, file: string) =>
  path.relative(root, file).split(path.sep).join('/')

function refused(error: unknown): never {
  if (error instanceof LifecycleError) throw new Refusal(error.message)
  throw error
}

async function apply(root: string, plan: LifecyclePlan, nothing: string) {
  try {
    const result = await applyPlan(options(root), plan)
    return result
  } catch (error) {
    throw new Refusal(`${nothing} ${(error as Error).message}`)
  }
}

export async function createSystem(
  root: string,
  [key]: string[],
  flags: Flags,
) {
  if (!key)
    throw new Refusal(
      'Usage: yarn studio create-system <id> [--label <name>] [--yes]. The id is lowercase letters, numbers and dashes.',
    )
  let plan: LifecyclePlan
  try {
    plan = planCreate(options(root), { key, label: flags.label })
  } catch (error) {
    refused(error)
  }
  for (const change of plan.edits)
    if (change.before === null) say(`Create ${relative(root, change.file)}`)
  say(
    `Register ${plan.key} in studio.config.json, with a new permanent ID and no maintainers yet${plan.install ? ', and refresh the lockfile' : ''}.`,
  )
  if (!flags.yes) {
    say()
    say(NOTHING_CHANGED)
    return
  }
  const result = await apply(root, plan, 'Nothing was made.')
  say(
    `Made the system “${plan.label}” in ${relative(root, path.dirname(plan.edits[0]!.file))}/.`,
  )
  say(RESTART)
  say(JSON.stringify(result))
}

const SUMMARY: Record<Exclude<LifecycleAction, 'create'>, string> = {
  rename:
    'Renames the system, its folder and its registration; the permanent ID, default choice, prototype assignments and maintainers stay.',
  archive:
    'Keeps its files; archives its active prototypes, and leaves it out of the deployed site and of new prototypes.',
  restore:
    'Makes it available for new prototypes again. It does not become the default.',
  delete:
    'Permanently deletes the system’s files. Its prototypes keep their files but need a rebuild with another system before they render or deploy.',
}

async function lifecycle(
  root: string,
  action: Exclude<LifecycleAction, 'create'>,
  [keyOrId]: string[],
  flags: Flags,
) {
  if (!keyOrId)
    throw new Refusal(
      `Usage: yarn studio ${action}-system <id>${action === 'rename' ? ' --label <name>' : ''}${action === 'restore' ? ' [--restore-prototypes]' : ''} [--yes]`,
    )
  let plan: LifecyclePlan
  let current: string
  try {
    const system = findSystem(options(root), keyOrId)
    current = system.label
    if (flags.yes && action === 'rename') {
      const { team, contributors, key, identity } = session(root, flags)
      const refusal = permissionRefusal(
        team,
        contributors,
        key,
        { kind: 'system', id: system.studioId, status: system.status },
        'rename',
      )
      if (refusal)
        throw new Refusal(
          refusalMessage(refusal, {
            email: identity.email,
            system: system.label,
          }),
        )
    }
    plan = planLifecycle(options(root), action, system.key, {
      label: flags.label,
      restorePrototypes: Boolean(flags['restore-prototypes']),
    })
  } catch (error) {
    refused(error)
  }
  const name =
    plan.nextKey !== plan.key ? `${plan.key} → ${plan.nextKey}` : plan.key
  say(
    `${action[0]!.toUpperCase()}${action.slice(1)} ${current}${plan.label !== current ? ` to ${plan.label}` : ''} (${name}). ${plan.dependents.length} associated prototype(s); ${plan.edits.length} file update(s).`,
  )
  say(SUMMARY[action])
  for (const prototype of plan.dependents)
    say(
      `  ${prototype.folder}${prototype.archived ? ' (archived)' : ''}${prototype.pending ? ' (pending rebuild)' : ''}`,
    )
  if (plan.references)
    say(`Repairs references in ${plan.references} other file(s).`)
  for (const file of plan.review)
    say(`Review after renaming: ${file} still names the old folder.`)
  // Before confirmation: anything holding a folder this moves.
  for (const sentence of heldFolders(options(root), plan)) say(sentence)
  if (!flags.yes) {
    say()
    say(NOTHING_CHANGED)
    return
  }
  const result = await apply(root, plan, 'Nothing was changed.')
  say(RESTART)
  say(JSON.stringify(result))
}

export const renameSystem = (root: string, args: string[], flags: Flags) =>
  lifecycle(root, 'rename', args, flags)
export const archiveSystem = (root: string, args: string[], flags: Flags) =>
  lifecycle(root, 'archive', args, flags)
export const restoreSystem = (root: string, args: string[], flags: Flags) =>
  lifecycle(root, 'restore', args, flags)
export const deleteSystem = (root: string, args: string[], flags: Flags) =>
  lifecycle(root, 'delete', args, flags)

/** Markdown files outside the system that link into its folder. */
function linkingDocuments(root: string, dir: string) {
  const found: string[] = []
  const scan = (folder: string) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name)
      if (
        entry.name.startsWith('.') ||
        entry.name === 'node_modules' ||
        file === dir
      )
        continue
      if (entry.isDirectory()) scan(file)
      else if (entry.isFile() && entry.name.endsWith('.md')) {
        const text = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '')
        const links = [...text.matchAll(/\]\(([^)\s]+)\)/g)].map(
          (match) => match[1]!.split('#')[0]!,
        )
        if (
          links.some((href) => {
            if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return false
            const target = href.startsWith('/')
              ? path.join(root, 'src', href)
              : path.resolve(path.dirname(file), href)
            return target === dir || target.startsWith(dir + path.sep)
          })
        )
          found.push(relative(root, file))
      }
    }
  }
  if (existsSync(path.join(root, 'src'))) scan(path.join(root, 'src'))
  if (
    readFileSync(path.join(root, 'AGENTS.md'), 'utf8').includes(
      `${relative(root, dir)}/`,
    )
  )
    found.push('AGENTS.md')
  return found
}

/**
 * `remove <system>`: deletes a system the studio no longer needs. Stricter
 * than delete-system: never the only or the default system, and not while
 * prototypes use it or documents link to it, unless --force.
 */
export async function removeSystem(
  root: string,
  keyOrId: string,
  flags: Flags,
) {
  let plan: LifecyclePlan
  try {
    const system = findSystem(options(root), keyOrId)
    const config = JSON.parse(
      readFileSync(path.join(root, 'studio.config.json'), 'utf8'),
    )
    if ((config.systems ?? []).length === 1)
      throw new Refusal(
        `${system.key} is the only design system, and prototypes need one. Add another first.`,
      )
    if (config.defaultSystem === system.studioId)
      throw new Refusal(
        `${system.key} is the default design system. Make another one the default first (yarn studio configure --system <id> --yes).`,
      )
    const users = systemDependents(options(root), system.studioId)
    const links = linkingDocuments(root, system.dir)
    if (links.length && !flags.force)
      throw new Refusal(
        `${links.length} file(s) link to ${system.key}, like ${links[0]}. Update their links before removing this system, or add --force.`,
      )
    if (users.length && !flags.force)
      throw new Refusal(
        `${users.length} prototype(s) use ${system.key}, like ${users[0]!.folder}. Change their system first, or add --force.`,
      )
    plan = planLifecycle(options(root), 'delete', system.key)
  } catch (error) {
    refused(error)
  }
  say('This would delete:')
  say(`  ${relative(root, plan.remove!)}/`)
  say(`and take ${plan.key} out of studio.config.json.`)
  if (plan.dependents.length)
    say(
      `${plan.dependents.length} prototype(s) keep their files and wait for a rebuild with another system.`,
    )
  for (const sentence of heldFolders(options(root), plan)) say(sentence)
  if (!flags.yes) {
    say()
    say(NOTHING_CHANGED)
    return
  }
  await apply(root, plan, 'Nothing was changed.')
  say(`Removed ${plan.key}.`)
  say(RESTART)
}
