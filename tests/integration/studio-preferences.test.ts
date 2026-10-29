import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { BEN, tempStudio, type TempStudio } from './setup/temp-studio'

let studio: TempStudio
beforeEach(() => {
  studio = tempStudio()
  for (const id of ['sample', 'extra']) {
    studio.addModule(id)
    const declaration = `src/modules/${id}/module.ts`
    studio.write(
      declaration,
      studio
        .read(declaration)
        .replace(
          "label: 'Sample',",
          "label: 'Sample',\n  preferences: { defaults: { welcomeDismissed: false } },",
        ),
    )
  }
  studio.setConfig({ modules: { sample: true, extra: false } })
})
afterEach(() => {
  studio.remove()
})

describe('preferences', () => {
  test('[CL-44] saves a reviewable plan for missing sections, then applies it', () => {
    const plan = studio.studio('preferences', '--plan', 'plan.json')
    expect(plan.status).toBe(0)
    expect(plan.stdout).toContain('contributors/ada.json')
    expect(plan.stdout).toContain('contributors/ben.json')
    expect(studio.json('contributors/ben.json').preferences).toEqual({})
    const saved = studio.json<{ edits: { before: string; after: string }[] }>(
      'plan.json',
    )
    expect(saved.edits).toHaveLength(2)
    expect(JSON.parse(saved.edits[1]!.after).preferences).toEqual({
      sample: { welcomeDismissed: false },
    })

    const applied = studio.studio('preferences', '--apply', 'plan.json')
    expect(applied.status).toBe(0)
    expect(applied.stdout).toContain('Initialised preferences in 2 profiles')
    expect(studio.json('contributors/ben.json')).toMatchObject({
      studioId: BEN.id,
      preferences: { sample: { welcomeDismissed: false } },
    })
  })

  test('[CL-44] --module plans one module, even one that is off', () => {
    studio.studio('preferences', '--module', 'extra', '--plan', 'plan.json')
    const saved = studio.json<{ edits: { after: string }[] }>('plan.json')
    expect(JSON.parse(saved.edits[0]!.after).preferences).toEqual({
      extra: { welcomeDismissed: false },
    })
    const unknown = studio.studio(
      'preferences',
      '--module',
      'nope',
      '--plan',
      'other.json',
    )
    expect(unknown.status).toBe(1)
    expect(studio.exists('other.json')).toBe(false)
  })

  test('[CL-44] a plan that no longer matches the profiles is refused', () => {
    studio.studio('preferences', '--plan', 'plan.json')
    studio.write(
      'contributors/ben.json',
      JSON.stringify({
        ...studio.json('contributors/ben.json'),
        name: 'Benny',
      }),
    )
    const applied = studio.studio('preferences', '--apply', 'plan.json')
    expect(applied.status).toBe(1)
    expect(applied.stderr).toContain('Preview again')
    expect(studio.json('contributors/ada.json').preferences).toEqual({})
  })

  test('[CL-44] only an Admin initialises preferences, and a plan file is never overwritten', () => {
    studio.identify(BEN)
    const ben = studio.studio('preferences', '--plan', 'plan.json')
    expect(ben.status).toBe(1)
    expect(ben.stderr).toContain('Only an Admin')

    studio.identify({ name: 'Ada Lovelace', email: 'ada@endless.example' })
    studio.write('plan.json', 'mine\n')
    const exists = studio.studio('preferences', '--plan', 'plan.json')
    expect(exists.status).toBe(1)
    expect(studio.read('plan.json')).toBe('mine\n')
  })

  test('[CL-39] join gives a new profile the enabled modules’ default preferences', () => {
    studio.identify({
      name: 'Cara Diaz',
      email: 'cara@endless.example',
      github: '',
    })
    studio.studio('join', '--yes')
    expect(studio.json('contributors/cara.json').preferences).toEqual({
      sample: { welcomeDismissed: false },
    })
  })
})
