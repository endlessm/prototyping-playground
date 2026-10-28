// The inspection commands agents run before changing anything: status (the
// studio as a whole) and context (one prototype). Neither writes.
import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs'
import path from 'node:path'
import { identityHint, resolveIdentity } from '../contributors/identity.ts'
import {
  readContributors,
  type Contributors,
} from '../contributors/profiles.ts'
import {
  adminProblems,
  permissionRefusal,
  refusalMessage,
  roleOf,
  teamOf,
} from '../contributors/roles.ts'
import {
  pageAddresses,
  readConfig,
  type Registry,
  type StudioConfig,
} from '../modules/registry.ts'
import { actorOf, studioModules } from './contributors.ts'
import { Refusal, say, type Flags } from './output.ts'
import { CONFIG_FILE } from './permissions.ts'
import { registeredSystems, type SystemFacts } from './systems.ts'

const STUDIO_ID = /^[0-9abcdefghjkmnpqrstvwxyz]{16}$/

/** What is wrong with the configuration and the profiles, as sentences. */
function configProblems(
  root: string,
  config: StudioConfig,
  contributors: Contributors,
  studio: Registry,
  systems: SystemFacts[],
) {
  const problems = adminProblems(config, contributors)
  if ('usage' in config)
    problems.push(
      `${CONFIG_FILE}: the studio is always in team use; remove "usage".`,
    )
  const addresses = pageAddresses(root, studio.modules)
  for (const key of Object.keys(contributors))
    if (addresses.has(key))
      problems.push(
        `contributors/${key}.json: the key "${key}" is the address of a studio page (/${key}). Rename the profile and its prototype folder.`,
      )
  const registered = new Set(
    Object.values(contributors).map(({ studioId }) => studioId),
  )
  const grants = config.systemMaintainers
  if (grants && typeof grants === 'object')
    for (const [system, ids] of Object.entries(grants))
      for (const id of Array.isArray(ids) ? ids : [])
        if (!registered.has(id))
          problems.push(
            `${CONFIG_FILE}: maintainer ${id} of system ${system} is not a registered contributor.`,
          )
  if (!systems.some(({ studioId }) => studioId === config.defaultSystem))
    problems.push(
      `${CONFIG_FILE}: defaultSystem ${String(config.defaultSystem)} isn't one of the registered systems.`,
    )
  return problems
}

async function inspect(root: string, flags: Flags) {
  const config = readConfig(path.join(root, CONFIG_FILE))
  const { contributors, problems: profileProblems } = readContributors(root)
  const studio = await studioModules(root)
  const systems = registeredSystems(root, config.systems)
  const { key, identity } = actorOf(root, contributors, flags)
  const team = teamOf(config, contributors)
  return {
    config,
    contributors,
    studio,
    systems,
    key,
    identity,
    team,
    problems: [
      ...profileProblems,
      ...configProblems(root, config, contributors, studio, systems),
    ],
  }
}

export async function status(root: string, _args: string[], flags: Flags) {
  const facts = await inspect(root, flags)
  const role = roleOf(facts.team, facts.contributors, facts.key)
  const fallback = facts.systems.find(
    ({ studioId }) => studioId === facts.config.defaultSystem,
  )
  const report = {
    studio: {
      name: facts.config.name ?? '',
      tagline: facts.config.tagline ?? '',
    },
    contributor: { key: facts.key, role },
    defaultSystem: {
      key: fallback?.key ?? null,
      studioId: facts.config.defaultSystem ?? null,
    },
    modules: {
      enabled: facts.studio.enabled.map(({ spec }) => spec.id),
      disabled: facts.studio.modules
        .filter(({ state }) => state !== 'on')
        .map(({ spec }) => spec.id),
    },
    systems: facts.systems.map(({ key }) => key),
    problems: facts.problems,
  }
  if (flags.json) {
    say(JSON.stringify(report, null, 2))
    return
  }
  const none = (list: string[]) => list.join(', ') || 'none'
  say(String(report.studio.name))
  say(
    `Contributor: ${
      facts.key
        ? `${facts.key} (${role === 'admin' ? 'Admin' : 'contributor'})`
        : `not registered. ${identityHint(facts.identity)}`
    }`,
  )
  say(
    `Default system: ${report.defaultSystem.key ?? report.defaultSystem.studioId ?? 'none'}`,
  )
  say(`Enabled modules: ${none(report.modules.enabled)}`)
  say(`Disabled modules: ${none(report.modules.disabled)}`)
  say(`Systems: ${none(report.systems)}`)
  if (report.problems.length) {
    say()
    say('Problems:')
    for (const problem of report.problems) say(`  ${problem}`)
  }
  say()
  say(
    'This reports the files, not whether setup is complete. To verify, run yarn build and open a prototype.',
  )
}

// Inside the studio, with no symbolic link on the way.
function realFolder(root: string, folder: string) {
  const absolute = path.resolve(root, folder)
  if (!existsSync(absolute) || !lstatSync(absolute).isDirectory()) return null
  const real = realpathSync(absolute)
  return real === path.join(realpathSync(root), folder) ? real : null
}

function assignment(
  meta: Record<string, unknown>,
  systems: SystemFacts[],
  where: string,
) {
  if (!Object.hasOwn(meta, 'systemId'))
    throw new Refusal(
      `${where} doesn't declare systemId. Set it to a registered system's studio ID, or null for no system; the default system applies only when a prototype is created.`,
    )
  const facts = (id: unknown, field: string) => {
    if (id === null) return null
    if (typeof id !== 'string' || !STUDIO_ID.test(id))
      throw new Refusal(`${where}: ${field} must be a studio ID or null.`)
    return (
      systems.find(({ studioId }) => studioId === id) ?? {
        key: null,
        studioId: id,
        status: 'missing' as const,
        entry: null,
      }
    )
  }
  const system = facts(meta.systemId, 'systemId')
  let rebuild = null
  if (meta.rebuild !== undefined) {
    const request = meta.rebuild as Record<string, unknown> | null
    if (!request || typeof request !== 'object' || Array.isArray(request))
      throw new Refusal(`${where}: rebuild must be an object.`)
    if (
      typeof request.sourcePrototypeId !== 'string' ||
      !STUDIO_ID.test(request.sourcePrototypeId)
    )
      throw new Refusal(
        `${where}: rebuild.sourcePrototypeId must be a studio ID.`,
      )
    const target = facts(request.targetSystemId, 'rebuild.targetSystemId')
    rebuild = {
      sourcePrototypeId: request.sourcePrototypeId,
      targetSystemKey: target?.key ?? null,
      targetSystemId: target?.studioId ?? null,
      target: target && { status: target.status, entry: target.entry },
    }
  }
  return {
    assignment: {
      system: system?.key ?? null,
      systemId: system?.studioId ?? null,
      status: system?.status ?? null,
      entry: system?.entry ?? null,
    },
    rebuild,
  }
}

export async function context(root: string, args: string[], flags: Flags) {
  const usage =
    'Usage: yarn studio context src/prototypes/<contributor>/<prototype> [--json]'
  if (args.length !== 1) throw new Refusal(usage)
  const folder = args[0]!.replace(/[\\/]+$/, '')
  const relative = path
    .relative(root, path.resolve(root, folder))
    .split(path.sep)
    .join('/')
  const match = relative.match(
    /^src\/prototypes\/([a-z0-9][a-z0-9-]*)\/([^/]+)$/,
  )
  const absolute = match && realFolder(root, relative)
  if (!match || !absolute)
    throw new Refusal(
      `Give an existing src/prototypes/<contributor>/<prototype> folder, without symbolic links. ${usage}`,
    )
  const facts = await inspect(root, flags)
  if (facts.problems.length) throw new Refusal(facts.problems.join('\n'))

  const where = `${relative}/meta.json`
  let meta: Record<string, unknown>
  try {
    meta = JSON.parse(readFileSync(path.join(absolute, 'meta.json'), 'utf8'))
  } catch (error) {
    throw new Refusal(`${where} can't be read: ${(error as Error).message}`)
  }
  if (typeof meta.title !== 'string' || !meta.title.trim())
    throw new Refusal(`${where} needs a title.`)
  const owner = match[1]!
  const ownerContributorId = facts.contributors[owner]?.studioId
  if (
    meta.ownerContributorId !== undefined &&
    meta.ownerContributorId !== ownerContributorId
  )
    throw new Refusal(
      `${where}: ownerContributorId doesn't match its contributor folder, ${owner}.`,
    )
  const archived = meta.status === 'archived'
  const refusal = permissionRefusal(
    facts.team,
    facts.contributors,
    facts.key,
    { kind: 'prototype', owner },
    'edit',
  )
  const identity = facts.key
    ? resolveIdentity(root, facts.contributors)
    : facts.identity
  const guidance = Object.fromEntries(
    Object.entries({
      working: 'AGENTS.md',
      prototype: 'src/modules/prototypes/README.md',
    }).filter(([, file]) => existsSync(path.join(root, file))),
  )
  const report = {
    prototype: {
      path: relative,
      studioId: meta.studioId ?? null,
      title: meta.title,
      owner,
      ownerContributorId: meta.ownerContributorId ?? null,
      status: archived ? 'archived' : 'active',
    },
    contributor: {
      key: facts.key,
      role: roleOf(facts.team, facts.contributors, facts.key),
      canEdit: !archived && !refusal,
      // Why edits are refused, when that's identity or ownership.
      refusal:
        refusal &&
        refusalMessage(refusal, {
          email: identity.email,
          hint: identity.email ? identityHint(identity) : undefined,
        }),
    },
    ...assignment(meta, facts.systems, where),
    modules: { enabled: facts.studio.enabled.map(({ spec }) => spec.id) },
    guidance,
  }
  say(JSON.stringify(report, null, 2))
}
