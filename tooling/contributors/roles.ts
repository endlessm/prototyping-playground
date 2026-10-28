// Roles. The studio is always in team use. A contributor changes their own
// prototypes and profile; a system maintainer also edits that active system
// and can rename it; an Admin can do everything. studio.config.json names
// Admins (`admins`) and maintainers (`systemMaintainers`, by system) by
// contributors' permanent studio IDs, so renaming a key keeps the role.
// These are local workflow rules, not repository access.
import type { Contributors } from './profiles.ts'

export interface TeamConfig {
  admins?: unknown
  systemMaintainers?: unknown
}

/** The roles with contributor keys instead of studio IDs. */
export interface Team {
  admins: string[]
  /** System ID → maintainers' keys. */
  maintainers: Record<string, string[]>
}

export type Role = 'admin' | 'contributor'

const ids = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((id): id is string => typeof id === 'string')
    : []

export function teamOf(config: TeamConfig, contributors: Contributors): Team {
  const keyOf = new Map(
    Object.entries(contributors).map(([key, profile]) => [profile.studioId, key]),
  )
  const keys = (value: unknown) =>
    ids(value).flatMap((id) => (keyOf.has(id) ? [keyOf.get(id)!] : []))
  const grants =
    config.systemMaintainers && typeof config.systemMaintainers === 'object'
      ? (config.systemMaintainers as Record<string, unknown>)
      : {}
  return {
    admins: keys(config.admins),
    maintainers: Object.fromEntries(
      Object.entries(grants).map(([system, value]) => [system, keys(value)]),
    ),
  }
}

export function roleOf(
  team: Team,
  contributors: Contributors,
  key: string | null,
): Role | null {
  if (!key || !Object.hasOwn(contributors, key)) return null
  return team.admins.includes(key) ? 'admin' : 'contributor'
}

export type Resource =
  | { kind: 'prototype'; owner: string }
  | { kind: 'system'; id: string; status: 'active' | 'archived' }
  /** The studio's own code, configuration and modules. */
  | { kind: 'studio' | 'module' }

/** `manage`: create, archive, restore, delete, or make the default. */
export type Action = 'read' | 'edit' | 'rename' | 'manage'

/**
 * Why an action is refused: your Git identity matches no profile
 * (`identity`), you lack the role (`admin`, `maintainer`, `owner`), or nobody
 * may do it (`unavailable`).
 */
export type Refusal = 'identity' | 'admin' | 'maintainer' | 'owner' | 'unavailable'

export function permissionRefusal(
  team: Team,
  contributors: Contributors,
  actor: string | null,
  resource: Resource,
  action: Action,
): Refusal | null {
  if (action === 'read') return null
  const role = roleOf(team, contributors, actor)
  if (!role) return 'identity'
  if (resource.kind === 'system' && resource.status !== 'active' && action !== 'manage')
    return 'unavailable'
  if (role === 'admin') return null
  if (resource.kind === 'prototype')
    return resource.owner === actor ? null : 'owner'
  if (resource.kind !== 'system' || action === 'manage') return 'admin'
  return team.maintainers[resource.id]?.includes(actor!) ? null : 'maintainer'
}

/** The sentence for a refusal. `email` is the Git email that matched nobody. */
export function refusalMessage(
  refusal: Refusal,
  {
    email,
    system,
    hint,
  }: { email?: string; system?: string; hint?: string } = {},
) {
  if (refusal === 'identity')
    return [
      `Your Git identity (${email || 'no Git email set'}) doesn't match a contributor profile, so the studio can't check your permissions.`,
      hint ||
        `Run \`yarn studio join\` to register, or to link this email to your profile (\`yarn studio join --link <key>\`, or \`yarn studio profile --as <key> --add-email ${email || '<email>'}\`).`,
    ].join(' ')
  if (refusal === 'admin')
    return 'Only an Admin can do this. You are recognised as a contributor, not an Admin.'
  if (refusal === 'maintainer')
    return `Only an Admin or a maintainer of ${system ? `the ${system} system` : 'this system'} can do this. You are recognised, but not one of its maintainers.`
  if (refusal === 'owner')
    return 'This prototype belongs to someone else. You can change only your own.'
  return `${system ? `The ${system} system` : 'This system'} isn't available for this: it is archived.`
}

const WHERE = 'studio.config.json'

/** What is wrong with the Admins: the studio needs at least one, all registered. */
export function adminProblems(config: TeamConfig, contributors: Contributors) {
  const admins = config.admins
  if (
    !Array.isArray(admins) ||
    admins.some((id) => typeof id !== 'string') ||
    new Set(admins).size !== admins.length
  )
    return [`${WHERE}: admins must list contributors' studio IDs, each once.`]
  if (!admins.length)
    return [`${WHERE}: the studio needs at least one Admin in admins.`]
  const registered = new Set(
    Object.values(contributors).map(({ studioId }) => studioId),
  )
  return admins
    .filter((id) => !registered.has(id))
    .map((id) => `${WHERE}: Admin ${id} is not a registered contributor.`)
}

/** The configuration without `key` as an Admin; the last Admin stays. */
export function withoutAdmin<T extends TeamConfig>(
  config: T,
  contributors: Contributors,
  key: string,
): T & { admins: string[] } {
  const id = contributors[key]?.studioId
  const admins = ids(config.admins)
  const next = admins.filter((admin) => admin !== id)
  if (admins.length && !next.length)
    throw new Error(
      `${contributors[key]?.name ?? key} is the last Admin, and the studio always needs one. Make someone else an Admin first.`,
    )
  return { ...config, admins: next }
}
