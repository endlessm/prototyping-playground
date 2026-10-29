// Before each commit (never blocking): warns when Git's name or email don't
// match the contributor profile you resolve to, so every commit traces back
// to the right person.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gitConfig, resolveIdentity } from './contributors/identity.ts'
import { profileEmails, readContributors } from './contributors/profiles.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const { contributors } = readContributors(root)
const { key } = resolveIdentity(root, contributors)
const profile = key ? contributors[key] : undefined
if (key && profile) {
  const name = gitConfig(root, 'user.name')
  const email = gitConfig(root, 'user.email')
  const problems: string[] = []
  if (name !== profile.name)
    problems.push(
      `user.name is "${name}", but your contributor profile says "${profile.name}".`,
    )
  const known = profileEmails(profile)
  if (known.length && !known.includes(email.toLowerCase()))
    problems.push(
      `user.email is "${email}", but your contributor profile lists ${known.map((value) => `"${value}"`).join(', ')}.`,
    )
  if (problems.length) {
    console.log(
      `Identity check (${key}): your Git identity doesn't match your contributor profile.`,
    )
    for (const problem of problems) console.log(`  ${problem}`)
    console.log(
      '  Set it with git config user.name and user.email, then amend this commit: git commit --amend --reset-author.',
    )
  }
}
