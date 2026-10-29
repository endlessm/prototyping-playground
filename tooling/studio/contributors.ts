// The contributor commands: whoami, join, profile and preferences.
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  gitConfig,
  githubLogin,
  matched,
  resolveActor,
  resolveIdentity,
  type Identity,
} from '../contributors/identity.ts'
import {
  candidatesFor,
  EMAIL,
  GITHUB,
  KEY,
  keysForEmail,
  profileEmails,
  profileFile,
  readContributors,
  serializeProfile,
  withLinkedEmail,
  type Contributors,
  type Profile,
} from '../contributors/profiles.ts'
import { newStudioId, studioIdsInUse } from '../contributors/studio-ids.ts'
import {
  loadRegistry,
  pageAddresses,
  preferenceDefaults,
} from '../modules/registry.ts'
import { NOTHING_CHANGED, Refusal, say, type Flags } from './output.ts'

/** Every profile, or a refusal listing what is wrong with them. */
export function contributorsOf(root: string) {
  const { contributors, problems } = readContributors(root)
  if (problems.length) throw new Refusal(problems.join('\n'))
  return contributors
}

export async function studioModules(root: string) {
  try {
    return await loadRegistry(root)
  } catch (error) {
    throw new Refusal((error as Error).message)
  }
}

export const text = (value: Flags[string]) =>
  typeof value === 'string' ? value.trim() : undefined

export function whoami(root: string, _args: string[], flags: Flags) {
  const identity = resolveIdentity(root, contributorsOf(root))
  if (!identity.key) process.exitCode = 1
  if (flags.json) {
    say(JSON.stringify(identity, null, 2))
    return
  }
  if (identity.key) {
    say(identity.key)
    return
  }
  const link = `Run yarn studio join to preview linking ${identity.email || 'your Git email'} to it.`
  if (identity.candidate)
    console.error(
      `Your Git email isn't linked to a contributor profile, but "${identity.candidate}" matches your ${matched(identity)}. ${link}`,
    )
  else if (identity.candidates.length > 1)
    console.error(
      `Your Git email isn't linked to a contributor profile, and several profiles match your name or GitHub account (${identity.candidates.map(({ key }) => key).join(', ')}). Link one with yarn studio join --link <key>.`,
    )
  else
    console.error(
      'Not a contributor yet. Run yarn studio join to add yourself.',
    )
}

const PERSONAL_EMAIL =
  /@(?:gmail|googlemail|yahoo|hotmail|outlook|live|icloud|me|mac|aol|proton|protonmail|hey)\./i

export function writeProfile(
  root: string,
  key: string,
  profile: Profile,
  create = false,
) {
  const file = profileFile(root, key)
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, serializeProfile(profile), create ? { flag: 'wx' } : {})
}

function ensureFolder(root: string, key: string) {
  const folder = path.join(root, 'src/prototypes', key)
  mkdirSync(folder, { recursive: true })
  if (!readdirSync(folder).length)
    writeFileSync(path.join(folder, '.gitkeep'), '')
}

function alreadyRegistered(
  root: string,
  key: string,
  profile: Profile,
  gitName: string,
  flags: Flags,
) {
  if (flags.yes) ensureFolder(root, key)
  say(
    `You're already a contributor: "${key}". Your folder is src/prototypes/${key}/.`,
  )
  if (gitName && gitName !== profile.name)
    console.warn(
      `Warning: that profile is for ${profile.name}, but your Git name is ${gitName}. If that isn't you, set git config user.name and user.email to your own.`,
    )
}

// Adds your Git email to an existing profile; creates no profile or folder.
function link(
  root: string,
  contributors: Contributors,
  key: string,
  matchedBy: string[],
  email: string,
  flags: Flags,
) {
  if (!email)
    throw new Refusal(
      'No email to link. Pass --email, or set git config user.email.',
    )
  const owner = keysForEmail(contributors, email)[0]
  if (owner && owner !== key)
    throw new Refusal(`${email} is already registered to ${owner}.`)
  const profile = contributors[key]!
  const next = withLinkedEmail(profile, email)
  const by = matchedBy
    .map((field) => (field === 'github' ? 'GitHub account' : field))
    .join(' and ')
  say(
    `${email} isn't registered, but contributors/${key}.json (${profile.name}) matches your ${by}. ${flags.yes ? 'Linking' : 'This would add'} it to that profile's emails:`,
  )
  say(JSON.stringify({ email: next.email, emails: next.emails }, null, 2))
  if (!flags.yes) {
    say()
    say(
      `If this is your profile, run it again with --yes. If it's someone else's, pass --key <new-key> to register a separate profile.`,
    )
    say(NOTHING_CHANGED)
    return
  }
  writeProfile(root, key, next)
  say(`Linked ${email} to "${key}". Your folder is src/prototypes/${key}/.`)
}

export async function join(root: string, _args: string[], flags: Flags) {
  const contributors = contributorsOf(root)
  const gitName = gitConfig(root, 'user.name')
  const explicit = ['key', 'name', 'email', 'github', 'link'].some(
    (name) => flags[name] !== undefined,
  )
  if (!explicit) {
    const { key } = resolveIdentity(root, contributors)
    if (key)
      return alreadyRegistered(root, key, contributors[key]!, gitName, flags)
  }
  const name = text(flags.name) ?? gitName
  const email = text(flags.email) ?? gitConfig(root, 'user.email')
  const github = text(flags.github) ?? githubLogin(root)
  const linkTo = text(flags.link)
  let key = text(flags.key)

  if (key && linkTo)
    throw new Refusal(
      'Pass either --link to use an existing profile or --key to add a new one, not both.',
    )
  if (!key) {
    const { candidate, candidates } = candidatesFor(contributors, {
      name,
      github,
    })
    if (linkTo) {
      if (!Object.hasOwn(contributors, linkTo))
        throw new Refusal(`There's no contributor "${linkTo}" to link to.`)
      const match = candidates.find(({ key }) => key === linkTo)
      if (!match)
        throw new Refusal(
          `Profile "${linkTo}" matches neither your name nor your GitHub account, so join won't link to it. Correct --name or --github, or ask that person to add your email.`,
        )
      return link(root, contributors, linkTo, match.matchedBy, email, flags)
    }
    if (!keysForEmail(contributors, email).length) {
      if (candidate)
        return link(
          root,
          contributors,
          candidate,
          candidates[0]!.matchedBy,
          email,
          flags,
        )
      if (candidates.length > 1)
        throw new Refusal(
          `Your email isn't registered, and several profiles match your name or GitHub account: ${candidates.map(({ key }) => key).join(', ')}. Nothing is linked automatically. Link one with --link <key>, or register a separate profile with --key <new-key>.`,
        )
    }
  }

  const studio = await studioModules(root)
  const reserved = pageAddresses(root, studio.modules)
  if (!key) {
    // Your first name, lowercased, with a number when it's taken.
    const base = (name.split(/\s+/)[0] ?? '')
      .normalize('NFKD')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
    key = base
    for (let n = 2; key && (contributors[key] || reserved.has(key)); n++)
      key = `${base}${n}`
  }

  const problems: string[] = []
  if (!key)
    problems.push(
      'No key. Pass --key, or set your Git name (git config user.name).',
    )
  else if (!KEY.test(key))
    problems.push(
      `The key "${key}" should be lowercase letters, numbers and dashes.`,
    )
  else if (reserved.has(key))
    problems.push(
      `The key "${key}" is reserved: /${key} is the address of a studio page. Pass a different --key.`,
    )
  else if (contributors[key]) {
    const prior = contributors[key]!
    if (
      prior.name === name &&
      keysForEmail({ [key]: prior }, email).length &&
      prior.github.toLowerCase() === github.toLowerCase()
    )
      return alreadyRegistered(root, key, prior, gitName, flags)
    problems.push(`The key "${key}" is already taken. Pass a different --key.`)
  }
  if (!name) problems.push('No name. Pass --name, or set git config user.name.')
  if (!email)
    problems.push('No email. Pass --email, or set git config user.email.')
  else if (!EMAIL.test(email))
    problems.push(`"${email}" isn't an email address. Pass --email.`)
  else {
    const owner = keysForEmail(contributors, email)[0]
    if (owner)
      problems.push(
        `${email} is already registered to ${owner}. Use that profile or correct the email.`,
      )
  }
  if (github) {
    if (!GITHUB.test(github))
      problems.push(`"${github}" isn't a GitHub username. Pass --github.`)
    const owner = Object.keys(contributors).find(
      (other) =>
        contributors[other]!.github.toLowerCase() === github.toLowerCase(),
    )
    if (owner)
      problems.push(
        `The GitHub account ${github} is already registered to ${owner}. Use that profile or correct the username.`,
      )
  }
  if (problems.length) throw new Refusal(problems.join('\n'))

  const profile: Profile = {
    formatVersion: 1,
    studioId: newStudioId(studioIdsInUse(root)),
    name,
    github,
    email,
    preferences: preferenceDefaults(studio.enabled),
  }
  say(`${flags.yes ? 'Adding' : 'This would add'} contributors/${key}.json:`)
  say(serializeProfile(profile).trimEnd())
  say(`and your prototype folder, src/prototypes/${key}/.`)
  if (!flags.yes)
    say(
      'Name and email come from your Git config and the GitHub account from the GitHub CLI, unless passed as flags.',
    )
  if (!github)
    console.warn(
      'Warning: no GitHub account (is the GitHub CLI installed and signed in?). Pass --github, or CI will not recognise your pushes.',
    )
  if (PERSONAL_EMAIL.test(email))
    console.warn(
      `Warning: ${email} looks like a personal email. Use your work email, the one in your Git config.`,
    )
  if (!flags.yes) {
    say()
    say(NOTHING_CHANGED)
    return
  }
  writeProfile(root, key!, profile, true)
  ensureFolder(root, key!)
  say(`Added contributors/${key}.json and created src/prototypes/${key}/.`)
}

/** The contributor a command acts as: you, or `--as <key>` when allowed. */
export function actorOf(
  root: string,
  contributors: Contributors,
  flags: Flags,
) {
  try {
    return resolveActor(root, contributors, text(flags.as))
  } catch (error) {
    throw new Refusal((error as Error).message)
  }
}

const lower = (value: string) => value.toLowerCase()
const list = (value: Flags[string]) =>
  (Array.isArray(value) ? value : []).map((item) => item.trim())

// The profile after the requested changes, or what is wrong with them.
function planProfile(
  contributors: Contributors,
  key: string,
  flags: Flags,
  identity: Identity,
) {
  const profile = contributors[key]!
  const name = text(flags.name)
  const github = text(flags.github)
  const primaryEmail = text(flags['primary-email'])
  const added = list(flags['add-email'])
  const removed = new Set(list(flags['remove-email']).map(lower))
  const problems: string[] = []
  const ownerOf = (email: string) =>
    keysForEmail(contributors, email).find((other) => other !== key)

  if (name !== undefined && !name)
    problems.push('name: expected a name, such as "Sam Lee".')
  if (github) {
    if (!GITHUB.test(github))
      problems.push(
        `github: expected a GitHub username (letters, numbers and single hyphens, at most 39 characters), or "" to clear it; not "${github}".`,
      )
    const owner = Object.keys(contributors).find(
      (other) =>
        other !== key && lower(contributors[other]!.github) === lower(github),
    )
    if (owner)
      problems.push(`github: "${github}" is already registered to ${owner}.`)
  }
  const checks: [string, string[]][] = [
    ['add-email', added],
    ['remove-email', [...removed]],
    ['primary-email', primaryEmail === undefined ? [] : [primaryEmail]],
  ]
  for (const [field, values] of checks)
    for (const value of values) {
      if (!EMAIL.test(value))
        problems.push(
          `${field}: expected an email address such as sam@example.com, not "${value}".`,
        )
      else if (field !== 'remove-email' && ownerOf(value))
        problems.push(
          `${field}: ${value} is already registered to ${ownerOf(value)}.`,
        )
    }

  const current = profileEmails(profile)
  for (const email of removed)
    if (EMAIL.test(email) && !current.includes(email))
      problems.push(
        `remove-email: ${email} isn't on this profile. Its emails are ${current.join(', ') || 'none'}.`,
      )
  if (
    identity.key === key &&
    identity.matchedBy === 'email' &&
    removed.has(identity.email)
  )
    problems.push(
      `remove-email: ${identity.email} is your current Git email, the one the studio recognises you by, so removing it would lock you out of your own work. Set git config user.email to another email on this profile first.`,
    )
  const primary = primaryEmail ?? profile.email
  if (primaryEmail && removed.has(lower(primaryEmail)))
    problems.push(
      'primary-email: the new primary email is also in --remove-email.',
    )
  if (primaryEmail === undefined && removed.has(lower(primary))) {
    const remaining = [...(profile.emails ?? []), ...added].filter(
      (email) => !removed.has(lower(email)),
    )
    problems.push(
      `primary-email: removing the primary email ${primary} needs a new one, such as --primary-email ${remaining[0] ?? '<email>'}.`,
    )
  }
  if (problems.length) return { problems }

  // Extra emails keep their order; the old primary joins them.
  const others: string[] = []
  for (const email of [profile.email, ...(profile.emails ?? []), ...added]) {
    if (!email || removed.has(lower(email)) || lower(email) === lower(primary))
      continue
    if (!others.some((other) => lower(other) === lower(email)))
      others.push(email)
  }
  const next: Record<string, unknown> = {}
  for (const [field, value] of Object.entries(profile)) {
    if (field === 'emails') continue
    if (field === 'name') next.name = name ?? value
    else if (field === 'github') next.github = github ?? value
    else if (field === 'email') {
      next.email = primary
      if (others.length) next.emails = others
    } else next[field] = value
  }
  const changes: string[] = []
  const show = (value: unknown) =>
    Array.isArray(value)
      ? value.join(', ') || 'none'
      : value === ''
        ? '""'
        : String(value)
  for (const field of ['name', 'email', 'emails', 'github'] as const) {
    const fallback = field === 'emails' ? [] : ''
    const before = profile[field] ?? fallback
    const after = next[field] ?? fallback
    if (JSON.stringify(before) !== JSON.stringify(after))
      changes.push(
        `${field === 'email' ? 'email (primary)' : field}: ${show(before)} → ${show(after)}`,
      )
  }
  return { problems, next: next as unknown as Profile, changes }
}

export function profile(root: string, _args: string[], flags: Flags) {
  const contributors = contributorsOf(root)
  const { key, identity } = actorOf(root, contributors, flags)
  if (!key)
    throw new Refusal(
      `Your Git identity (${identity.email || 'no Git email set'}) doesn't match a contributor profile. Run yarn studio join to register or link it${identity.candidate ? `, or add --as ${identity.candidate} to update the profile that matches your ${matched(identity)}` : ''}.`,
    )
  const file = `contributors/${key}.json`
  const plan = planProfile(contributors, key, flags, identity)
  if (plan.problems.length)
    throw new Refusal(`Nothing was changed.\n${plan.problems.join('\n')}`)
  if (!plan.changes!.length) {
    const entry = contributors[key]!
    say(`${file} (${key})`)
    say(`name: ${entry.name}`)
    say(`email (primary): ${entry.email || '""'}`)
    say(`emails: ${(entry.emails ?? []).join(', ') || 'none'}`)
    say(`github: ${entry.github || '""'}`)
    const requested = [
      'name',
      'github',
      'primary-email',
      'add-email',
      'remove-email',
    ].some((field) => flags[field] !== undefined)
    if (requested) say('No changes.')
    return
  }
  say(`${flags.yes ? 'Updating' : 'This would change'} ${file}:`)
  for (const change of plan.changes!) say(`  ${change}`)
  if (!flags.yes) {
    say()
    say('The studio ID and preferences stay as they are.')
    say(NOTHING_CHANGED)
    return
  }
  writeProfile(root, key, plan.next!)
  say(`Updated ${file}. The studio ID and preferences are unchanged.`)
}
