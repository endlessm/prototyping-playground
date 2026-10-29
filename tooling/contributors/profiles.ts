// The contributor registry: one `contributors/<key>.json` profile per person.
// A profile names the person and the emails and GitHub account they answer
// to; it never holds permissions, which live in studio.config.json.
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { isResourceId } from '../identity/resource-id.ts'

export const CONTRIBUTORS_FOLDER = 'contributors'
export const KEY = /^[a-z0-9][a-z0-9-]*$/
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const GITHUB = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i

export interface Profile {
  formatVersion: number
  studioId: string
  name: string
  /** The primary email; an empty string means none. */
  email: string
  /** More emails the person answers to, such as a second Git identity. */
  emails?: string[]
  /** An empty string means explicitly none. */
  github: string
  /** An image inside public/, such as images/sam.jpg. */
  avatar?: string
  /** One object per module, such as `{ onboarding: { welcomeDismissed: true } }`. */
  preferences: Record<string, Record<string, unknown>>
}

export type Contributors = Record<string, Profile>

export const profileFile = (root: string, key: string) =>
  path.join(root, CONTRIBUTORS_FOLDER, `${key}.json`)

export const serializeProfile = (profile: Profile) =>
  `${JSON.stringify(profile, null, 2)}\n`

const normalized = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : ''

/** Every email a profile answers to, lowercased: the primary one first. */
export function profileEmails(profile: Partial<Profile> | undefined) {
  const emails = [profile?.email, ...(profile?.emails ?? [])].map(normalized)
  return [...new Set(emails.filter(Boolean))]
}

/** Keys whose profile lists this email. */
export function keysForEmail(contributors: Contributors, email: string) {
  const wanted = normalized(email)
  if (!wanted) return []
  return Object.keys(contributors).filter((key) =>
    profileEmails(contributors[key]).includes(wanted),
  )
}

export function keyForGithub(contributors: Contributors, login: string) {
  const wanted = normalized(login)
  if (!wanted) return null
  const matches = Object.keys(contributors).filter(
    (key) => normalized(contributors[key]!.github) === wanted,
  )
  return matches.length === 1 ? matches[0]! : null
}

export interface Candidate {
  key: string
  matchedBy: ('name' | 'github')[]
}

/**
 * Profiles that may be yours when your email matched none: the same name or
 * GitHub account. A candidate identifies; it authorises nothing until your
 * email is linked to it.
 */
export function candidatesFor(
  contributors: Contributors,
  { name = '', github = '' }: { name?: string; github?: string },
) {
  const candidates: Candidate[] = []
  for (const [key, profile] of Object.entries(contributors)) {
    const matchedBy: Candidate['matchedBy'] = []
    if (normalized(name) && normalized(profile.name) === normalized(name))
      matchedBy.push('name')
    if (normalized(github) && normalized(profile.github) === normalized(github))
      matchedBy.push('github')
    if (matchedBy.length) candidates.push({ key, matchedBy })
  }
  return {
    candidate: candidates.length === 1 ? candidates[0]!.key : null,
    candidates,
  }
}

/** The profile with `email` added to its extra emails, its fields in order. */
export function withLinkedEmail(profile: Profile, email: string): Profile {
  if (profileEmails(profile).includes(normalized(email))) return profile
  const next: Record<string, unknown> = {}
  for (const [field, value] of Object.entries(profile)) {
    if (field === 'emails') continue
    next[field] = value
    if (field === 'email') next.emails = [...(profile.emails ?? []), email.trim()]
  }
  next.emails ??= [...(profile.emails ?? []), email.trim()]
  return next as unknown as Profile
}

/** What is wrong with one profile, each a sentence naming the file. */
export function profileProblems(entry: unknown, file: string): string[] {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry))
    return [`${file} must be an object with a name, an email and a GitHub account.`]
  const profile = entry as Record<string, unknown>
  const problems: string[] = []
  if (profile.formatVersion !== 1)
    problems.push(`${file}: formatVersion must be 1.`)
  if (!isResourceId(profile.studioId))
    problems.push(
      `${file}: studioId must be 16 lowercase letters and digits (Crockford base32).`,
    )
  if (typeof profile.name !== 'string' || !profile.name.trim())
    problems.push(`${file}: add a name.`)
  for (const field of ['email', 'github'])
    if (typeof profile[field] !== 'string')
      problems.push(
        `${file}: ${field} must be text; use an empty string when there is none.`,
      )
  if (
    profile.emails !== undefined &&
    (!Array.isArray(profile.emails) ||
      profile.emails.some((email) => typeof email !== 'string' || !email.trim()))
  )
    problems.push(`${file}: emails must be a list of more email addresses.`)
  if (
    profile.avatar !== undefined &&
    (typeof profile.avatar !== 'string' ||
      !/^(?:[\w-]+\/)*[\w-]+\.(?:svg|png|jpe?g|webp)$/i.test(profile.avatar))
  )
    problems.push(
      `${file}: avatar must be an image path inside public/, such as images/sam.jpg.`,
    )
  const preferences = profile.preferences
  if (
    !preferences ||
    typeof preferences !== 'object' ||
    Array.isArray(preferences) ||
    Object.values(preferences).some(
      (value) => !value || typeof value !== 'object' || Array.isArray(value),
    )
  )
    problems.push(`${file}: preferences must hold one object per module.`)
  for (const field of ['sample', 'permissions', 'role', 'admin'])
    if (field in profile)
      problems.push(
        `${file}: profiles don't declare "${field}"; roles live in studio.config.json.`,
      )
  return problems
}

/** Reads every profile, with what is wrong with them. */
export function readContributors(root: string, relative = CONTRIBUTORS_FOLDER) {
  const folder = path.resolve(root, relative)
  const contributors: Contributors = Object.create(null)
  const problems: string[] = []
  const files = existsSync(folder)
    ? readdirSync(folder)
        .filter((name) => name.endsWith('.json'))
        .sort()
    : []
  for (const name of files) {
    const key = name.slice(0, -'.json'.length)
    const where = `${relative}/${name}`
    if (!KEY.test(key)) {
      problems.push(
        `${where}: a contributor's key is lowercase letters, numbers and dashes.`,
      )
      continue
    }
    const file = path.join(folder, name)
    if (!lstatSync(file).isFile()) {
      problems.push(`${where} must be an ordinary file.`)
      continue
    }
    let entry: unknown
    try {
      entry = JSON.parse(readFileSync(file, 'utf8'))
    } catch (error) {
      problems.push(`${where} isn't valid JSON (${(error as Error).message}).`)
      continue
    }
    const found = profileProblems(entry, where)
    problems.push(...found)
    if (entry && typeof entry === 'object' && !Array.isArray(entry))
      contributors[key] = entry as Profile
    const avatar = (entry as Partial<Profile>)?.avatar
    if (
      typeof avatar === 'string' &&
      !found.length &&
      !existsSync(path.join(root, 'public', avatar))
    )
      problems.push(`${where}: the avatar public/${avatar} is missing.`)
  }
  for (const field of ['email', 'github', 'studioId'] as const) {
    const owners = new Map<string, string>()
    for (const [key, profile] of Object.entries(contributors)) {
      const values =
        field === 'email' ? profileEmails(profile) : [normalized(profile[field])]
      for (const value of values) {
        if (!value) continue
        const owner = owners.get(value)
        if (owner)
          problems.push(
            `Contributor "${key}": ${field} ${value} is also registered to ${owner}.`,
          )
        else owners.set(value, key)
      }
    }
  }
  return { contributors, problems }
}
