// Who may apply a command: shared changes (the configuration and modules)
// need an Admin. Previews change nothing, so anyone may run them.
import { identityHint } from '../contributors/identity.ts'
import { readConfig } from '../modules/registry.ts'
import { refusalMessage, roleOf, teamOf } from '../contributors/roles.ts'
import { actorOf, contributorsOf } from './contributors.ts'
import { Refusal, type Flags } from './output.ts'
import path from 'node:path'

export const CONFIG_FILE = 'studio.config.json'

/** The acting contributor, their role and the team's roles. */
export function session(root: string, flags: Flags) {
  const contributors = contributorsOf(root)
  const { key, identity } = actorOf(root, contributors, flags)
  const team = teamOf(readConfig(path.join(root, CONFIG_FILE)), contributors)
  return {
    contributors,
    key,
    identity,
    team,
    role: roleOf(team, contributors, key),
  }
}

export function requireAdmin(root: string, flags: Flags) {
  const { role, identity } = session(root, flags)
  if (!role)
    throw new Refusal(
      refusalMessage('identity', {
        email: identity.email,
        hint: identity.email ? identityHint(identity) : undefined,
      }),
    )
  if (role !== 'admin')
    throw new Refusal(
      'Only an Admin can apply shared changes. You are recognised as a contributor, not an Admin. Propose the change in a pull request instead.',
    )
}
