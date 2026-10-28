// Who is working: the contributor the local Git identity resolves to. Git
// email first (including a profile's extra emails), then an exact Git name for
// a profile with no email, then the GitHub account from the GitHub CLI.
// `STUDIO_GITHUB` names the GitHub account instead of asking the GitHub CLI
// (an empty value means none).
import { execFileSync } from 'node:child_process'
import {
  candidatesFor,
  keyForGithub,
  keysForEmail,
  type Candidate,
  type Contributors,
} from './profiles.ts'

function run(root: string, command: string, args: string[]) {
  try {
    return execFileSync(command, args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
    }).trim()
  } catch {
    return ''
  }
}

export const gitConfig = (root: string, key: string) =>
  run(root, 'git', ['config', key])

export function githubLogin(root: string) {
  const named = process.env.STUDIO_GITHUB
  if (named !== undefined) return named.trim()
  return run(root, 'gh', ['api', 'user', '--jq', '.login'])
}

export interface Identity {
  /** The linked contributor: the only identity that may change anything. */
  key: string | null
  matchedBy: 'email' | 'name' | 'github' | null
  /** Git's email, lowercased. */
  email: string
  /** When nothing is linked, the one profile matching your name or GitHub account. */
  candidate: string | null
  candidates: Candidate[]
}

/** Overrides Git's name and email or the GitHub account, as `join` flags do. */
export interface IdentityOverrides {
  name?: string
  email?: string
  github?: string
}

export function resolveIdentity(
  root: string,
  contributors: Contributors,
  overrides: IdentityOverrides = {},
): Identity {
  const email = (overrides.email ?? gitConfig(root, 'user.email')).toLowerCase()
  const name = overrides.name ?? gitConfig(root, 'user.name')
  let github = overrides.github
  const login = () => (github ??= githubLogin(root))
  const result = (
    key: string | null,
    matchedBy: Identity['matchedBy'],
  ): Identity => ({
    key,
    matchedBy,
    email,
    ...(key
      ? { candidate: null, candidates: [] }
      : candidatesFor(contributors, { name, github: login() })),
  })
  const byEmail = keysForEmail(contributors, email)
  if (byEmail.length === 1) return result(byEmail[0]!, 'email')
  if (byEmail.length > 1) return result(null, null)
  const byName = Object.keys(contributors).filter(
    (key) =>
      name && contributors[key]!.name.toLowerCase() === name.toLowerCase(),
  )
  // A profile with no email can be found by an exact Git name.
  if (byName.length === 1 && !contributors[byName[0]!]!.email)
    return result(byName[0]!, 'name')
  // A Git email that matches nobody never borrows a GitHub account's profile.
  if (email) return result(null, null)
  const byGithub = keyForGithub(contributors, login())
  if (byGithub) return result(byGithub, 'github')
  return result(null, null)
}

const yarn = (command: string) => `yarn studio ${command}`

/** The next step for an identity that resolves to nobody. */
export function identityHint(identity: Identity) {
  const email = identity.email || '<email>'
  if (identity.candidate)
    return `Profile "${identity.candidate}" matches your ${matched(identity)}. Link this email with \`${yarn(`join --link ${identity.candidate} --yes`)}\`, or run this one command with \`--as ${identity.candidate}\`.`
  if (identity.candidates.length > 1)
    return `Several profiles match your name or GitHub account (${identity.candidates.map(({ key }) => key).join(', ')}). Link yours with \`${yarn('join --link <key>')}\`.`
  return `Run \`${yarn('join')}\` to register, or to link this email to your profile (\`${yarn('join --link <key>')}\`, or \`${yarn(`profile --as <key> --add-email ${email}`)}\`).`
}

export const matched = (identity: Identity) =>
  identity.candidates[0]!.matchedBy
    .map((field) => (field === 'github' ? 'GitHub account' : field))
    .join(' and ')

/**
 * The contributor one command acts as: the linked one, or with `--as <key>`
 * that profile, only when it matches your Git name or GitHub account and your
 * email isn't linked to someone else. It never grants a role.
 */
export function resolveActor(
  root: string,
  contributors: Contributors,
  as: string | undefined,
): { key: string | null; identity: Identity } {
  const identity = resolveIdentity(root, contributors)
  if (as === undefined) return { key: identity.key, identity }
  if (!Object.hasOwn(contributors, as))
    throw new Error(`--as ${as}: there is no contributors/${as}.json profile.`)
  if (identity.key === as) return { key: as, identity }
  if (identity.key)
    throw new Error(
      `--as ${as} refused: your Git identity (${identity.email}) already resolves to "${identity.key}", and --as never acts as another contributor.`,
    )
  if (!identity.candidates.some(({ key }) => key === as))
    throw new Error(
      `--as ${as} refused: that profile matches neither your Git name nor your GitHub account. --as only recovers your own profile; ask its owner or an Admin.`,
    )
  return { key: as, identity }
}
