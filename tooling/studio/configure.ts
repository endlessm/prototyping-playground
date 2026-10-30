import {
  settingsSnapshot,
  planSettings,
  saveSettings,
  pinnedPrototypes,
} from '../settings/service.ts'
import { requireAdmin } from './permissions.ts'
import { NOTHING_CHANGED, RESTART, Refusal, say, type Flags } from './output.ts'

export async function configure(root: string, _args: string[], flags: Flags) {
  try {
    const snapshot = await settingsSnapshot(root)
    const changes: Record<string, unknown> = {}
    for (const key of ['name', 'tagline'])
      if (typeof flags[key] === 'string') changes[key] = flags[key]
    if (typeof flags.system === 'string') {
      const system = snapshot.systems.find(
        (system) =>
          system.key === flags.system || system.studioId === flags.system,
      )
      if (!system && flags.system !== 'none')
        throw new Error('Choose an active registered system, or none.')
      changes.defaultSystem = system?.studioId ?? null
    }
    const people = (value: string) =>
      value === ''
        ? []
        : value.split(',').map((key) => {
            const person =
              snapshot.contributors[key] ??
              Object.values(snapshot.contributors).find(
                (profile) => profile.studioId === key,
              )
            if (!person)
              throw new Error(`Contributor ${key} is not registered.`)
            return person.studioId
          })
    if (typeof flags.admins === 'string') changes.admins = people(flags.admins)
    if (Array.isArray(flags.maintainers)) {
      const grants = {
        ...(snapshot.config.systemMaintainers as Record<string, string[]>),
      }
      for (const grant of flags.maintainers) {
        const [key, value] = grant.split('=')
        const system = snapshot.systems.find(
          (system) => system.key === key || system.studioId === key,
        )
        if (!system?.studioId || value === undefined)
          throw new Error(
            'Maintainers must be system=key,key (system= clears).',
          )
        grants[system.studioId] = people(value)
      }
      changes.systemMaintainers = grants
    }
    planSettings(snapshot, changes)
    say(JSON.stringify({ changes, pinned: pinnedPrototypes(root) }, null, 2))
    say('Existing prototypes stay pinned to their assigned system.')
    if (flags.recovery)
      say('Recovery: using repository access to restore configuration.')
    if (!flags.yes) return say(NOTHING_CHANGED)
    if (!flags.recovery) requireAdmin(root, flags)
    // requireAdmin honours --as; recovery is the explicit repository-access path.
    saveSettings(snapshot, changes, snapshot.revision, true)
    say('Settings saved.')
    say(RESTART)
  } catch (error) {
    throw new Refusal((error as Error).message)
  }
}
