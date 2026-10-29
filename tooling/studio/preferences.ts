// yarn studio preferences: when a module with preferences is turned on for
// profiles that predate it, an Admin initialises the missing sections in two
// steps. `--plan <file>` saves every profile's before and after for review;
// `--apply <file>` writes them, only if nothing changed in between.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { preferenceProblems } from '../modules/registry.ts'
import { profileFile, serializeProfile } from '../contributors/profiles.ts'
import { studioModules, text } from './contributors.ts'
import { Refusal, say, type Flags } from './output.ts'
import { requireAdmin, session } from './permissions.ts'

interface Plan {
  version: 1
  /** Changes when the declarations or the configuration change. */
  declarations: string
  module: string | null
  edits: { contributor: string; file: string; before: string; after: string }[]
}

async function plan(root: string, flags: Flags, requested?: string) {
  requireAdmin(root, flags)
  const { contributors } = session(root, flags)
  const studio = await studioModules(root)
  const declared = studio.modules.filter(({ spec }) => spec.preferences)
  if (requested && !declared.some(({ spec }) => spec.id === requested))
    throw new Refusal(
      `No installed module "${requested}" declares preferences. Those that do: ${declared.map(({ spec }) => spec.id).join(', ') || 'none'}.`,
    )
  const chosen = declared.filter(({ spec, state }) =>
    requested ? spec.id === requested : state === 'on',
  )
  const edits: Plan['edits'] = []
  for (const [key, profile] of Object.entries(contributors)) {
    const file = path
      .relative(root, profileFile(root, key))
      .split(path.sep)
      .join('/')
    const before = readFileSync(profileFile(root, key), 'utf8')
    const next = structuredClone(profile)
    for (const { spec } of chosen) {
      const declaration = spec.preferences!
      if (!Object.hasOwn(next.preferences, spec.id))
        next.preferences[spec.id] = structuredClone(declaration.defaults)
      const problems = preferenceProblems(
        next.preferences[spec.id],
        declaration,
      )
      if (problems.length)
        throw new Refusal(
          `${file}: preferences.${spec.id}: ${problems.join('; ')}. Correct it by hand, then plan again.`,
        )
    }
    const after = serializeProfile(next)
    if (JSON.stringify(next) !== JSON.stringify(profile))
      edits.push({ contributor: key, file, before, after })
  }
  return {
    version: 1,
    declarations: createHash('sha256')
      .update(JSON.stringify(chosen.map(({ spec }) => spec.preferences)))
      .update(JSON.stringify(studio.config.modules ?? {}))
      .digest('hex'),
    module: requested ?? null,
    edits,
  } satisfies Plan
}

export async function preferences(root: string, _args: string[], flags: Flags) {
  const planFile = text(flags.plan)
  const applyFile = text(flags.apply)
  if (Boolean(planFile) === Boolean(applyFile))
    throw new Refusal(
      'Use yarn studio preferences [--module <id>] --plan <file>, then yarn studio preferences --apply <file>.',
    )
  if (planFile) {
    const result = await plan(root, flags, text(flags.module))
    try {
      writeFileSync(
        path.resolve(planFile),
        `${JSON.stringify(result, null, 2)}\n`,
        {
          flag: 'wx',
        },
      )
    } catch {
      throw new Refusal(
        `${planFile} already exists. Choose another file for the plan.`,
      )
    }
    if (!result.edits.length)
      say('Every profile already has these preferences.')
    for (const { file, after } of result.edits) {
      say(`${file} would become:`)
      say(after.trimEnd())
    }
    say()
    say(
      `Saved the plan in ${planFile}. Review it, then apply it with yarn studio preferences --apply ${planFile}.`,
    )
    return
  }
  let saved: Plan
  try {
    saved = JSON.parse(readFileSync(path.resolve(applyFile!), 'utf8'))
  } catch (error) {
    throw new Refusal(`${applyFile} can't be read: ${(error as Error).message}`)
  }
  if (saved?.version !== 1 || !Array.isArray(saved.edits))
    throw new Refusal(`${applyFile} isn't a preferences plan.`)
  const fresh = await plan(root, flags, saved.module ?? undefined)
  if (JSON.stringify(fresh) !== JSON.stringify(saved))
    throw new Refusal(
      'The profiles or module declarations changed since the plan was saved. Preview again with --plan.',
    )
  for (const { contributor, after } of fresh.edits)
    writeFileSync(profileFile(root, contributor), after)
  say(`Initialised preferences in ${fresh.edits.length} profiles.`)
}
