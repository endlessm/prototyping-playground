import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { readConfig } from '../modules/registry.ts'
import { planProfile } from '../studio/contributors.ts'
import { resolveIdentity } from './identity.ts'
import { readContributors, serializeProfile } from './profiles.ts'
import { roleOf, teamOf } from './roles.ts'

export interface PeopleOptions {
  contributorsFolder?: string
  configFile?: string
}
const hash = (text: string) => createHash('sha256').update(text).digest('hex')
function context(root: string, options: PeopleOptions, actor?: string | null) {
  const { contributors, problems } = readContributors(
    root,
    options.contributorsFolder,
  )
  if (problems.length) throw new Error(problems.join('\n'))
  const identity = resolveIdentity(root, contributors)
  const key = actor === undefined ? identity.key : actor
  const team = teamOf(
    readConfig(path.resolve(root, options.configFile || 'studio.config.json')),
    contributors,
  )
  return { contributors, identity, key, role: roleOf(team, contributors, key) }
}
export function peopleSnapshot(
  root: string,
  options: PeopleOptions = {},
  actor?: string | null,
) {
  const { contributors, key, role } = context(root, options, actor)
  return {
    role,
    people: Object.entries(contributors).map(([personKey, profile]) => {
      const editable = role === 'admin' || key === personKey
      const source = editable
        ? readFileSync(
            path.resolve(
              root,
              options.contributorsFolder || 'contributors',
              `${personKey}.json`,
            ),
            'utf8',
          )
        : ''
      return {
        key: personKey,
        studioId: profile.studioId,
        name: profile.name,
        github: profile.github,
        you: personKey === key,
        ...(editable
          ? {
              email: profile.email,
              emails: profile.emails ?? [],
              revision: hash(source),
            }
          : {}),
      }
    }),
  }
}
export function savePerson(
  root: string,
  options: PeopleOptions,
  actor: string | null | undefined,
  key: string,
  changes: Record<string, unknown>,
  revision: string,
) {
  const ctx = context(root, options, actor)
  if (
    !Object.hasOwn(ctx.contributors, key) ||
    !ctx.role ||
    (ctx.role !== 'admin' && ctx.key !== key)
  )
    throw new Error('You do not have permission to edit this profile.')
  for (const [field, value] of Object.entries(changes))
    if (
      ![
        'name',
        'github',
        'primary-email',
        'add-email',
        'remove-email',
      ].includes(field) ||
      (['add-email', 'remove-email'].includes(field)
        ? !Array.isArray(value) ||
          value.some((entry) => typeof entry !== 'string')
        : typeof value !== 'string')
    )
      throw new Error(`Invalid profile field: ${field}.`)
  const file = path.resolve(
    root,
    options.contributorsFolder || 'contributors',
    `${key}.json`,
  )
  if (hash(readFileSync(file, 'utf8')) !== revision)
    throw new Error(
      'The profile changed on disk. Reload permissions before saving.',
    )
  const plan = planProfile(
    ctx.contributors,
    key,
    changes as Parameters<typeof planProfile>[2],
    ctx.identity,
  )
  if (plan.problems.length) throw new Error(plan.problems.join('\n'))
  writeFileSync(file, serializeProfile(plan.next!))
  return peopleSnapshot(root, options, actor)
}
