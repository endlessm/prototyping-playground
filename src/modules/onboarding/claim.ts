import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

// The welcome's one profile change. The first time a registered contributor
// opens Home, the dev server claims the welcome for them: it records
// `preferences.onboarding.welcomeDismissed: true` on their own profile and
// answers that the welcome should open. It opens once per contributor per
// studio, in any browser; setting the flag back to `false` shows it again.

/** A profile whose flag can't be read: fix it, never treat it as new. */
export class WelcomeProblem extends Error {
  status = 422
}

/**
 * Claims the welcome for the contributor `key` in the profiles `folder`.
 * `show: null` means the studio doesn't know who you are yet, so the browser
 * remembers instead.
 */
export function claimWelcome(
  folder: string,
  key: string | null,
): { show: boolean | null } {
  if (!key) return { show: null }
  const file = path.join(folder, `${key}.json`)
  const source = readFileSync(file, 'utf8')
  const profile = JSON.parse(source)
  const section = profile.preferences?.onboarding
  if (typeof section?.welcomeDismissed !== 'boolean')
    throw new WelcomeProblem(
      `contributors/${key}.json: preferences.onboarding.welcomeDismissed must be true or false. An Admin adds it with yarn studio preferences --module onboarding --plan <file>.`,
    )
  if (section.welcomeDismissed) return { show: false }
  section.welcomeDismissed = true
  writeFileSync(file, `${JSON.stringify(profile, null, 2)}\n`)
  return { show: true }
}
