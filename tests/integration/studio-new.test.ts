// `yarn new "Prototype Name"`: people and agents create a prototype from the
// terminal, in their own space, with the default system unless they choose
// another or none. It prints the folder and the address to open.
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { BEN, tempStudio, type TempStudio } from './setup/temp-studio'

let studio: TempStudio
beforeEach(() => {
  studio = tempStudio()
  studio.withModule('prototypes')
  studio.identify(BEN)
})
afterEach(() => {
  studio.remove()
})

const { defaultSystem } = JSON.parse(readFileSync('studio.config.json', 'utf8'))
const newPrototype = (...args: string[]) => studio.studio('new', ...args)

describe('yarn new', () => {
  test('[PR-17] [CL-161] is the studio command’s new', () => {
    const { scripts } = JSON.parse(readFileSync('package.json', 'utf8'))
    expect(scripts.new).toBe('node tooling/studio/cli.ts new')
  })

  test('[PR-15] [PR-17] [CL-161] creates the prototype and prints its folder and address', () => {
    const result = newPrototype('Agent', 'Config')
    expect(result.status).toBe(0)
    const meta = studio.json<{ studioId: string; systemId: string }>(
      'src/prototypes/ben/agent-config/meta.json',
    )
    expect(meta).toMatchObject({
      title: 'Agent Config',
      ownerContributorId: BEN.id,
      systemId: defaultSystem,
    })
    expect(studio.exists('src/prototypes/ben/agent-config/Prototype.vue')).toBe(
      true,
    )
    expect(result.stdout).toContain('Created src/prototypes/ben/agent-config/')
    expect(result.stdout).toContain(`/prototypes/${meta.studioId}`)
  })

  test('[PR-17] --system chooses a system and --no-system none', () => {
    expect(newPrototype('Studios', '--system', 'endless-studios').status).toBe(
      0,
    )
    expect(studio.json('src/prototypes/ben/studios/meta.json').systemId).toBe(
      defaultSystem,
    )
    expect(newPrototype('Custom', '--no-system').status).toBe(0)
    expect(studio.json('src/prototypes/ben/custom/meta.json').systemId).toBe(
      null,
    )
  })

  test('[PR-16] [PR-17] refuses invalid input with plain messages and creates nothing', () => {
    const cases: [string[], string][] = [
      [[], 'Usage: yarn new "Prototype Name"'],
      [['!!!'], 'Use at least one letter or number in the title.'],
      [['X', '--system', 'nowhere'], 'There’s no system “nowhere”'],
      [['X', '--system'], '--system needs a value.'],
      [
        ['X', '--system', 'endless-studios', '--no-system'],
        'Use --system or --no-system, not both.',
      ],
    ]
    for (const [args, message] of cases) {
      const result = newPrototype(...args)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain(message)
    }
    expect(newPrototype('Twice').status).toBe(0)
    const again = newPrototype('Twice')
    expect(again.status).toBe(1)
    expect(again.stderr).toContain(
      'You already have a prototype named “Twice”.',
    )
    expect(studio.exists('src/prototypes/ben/x')).toBe(false)
  })

  test('[PR-16] someone who isn’t a contributor is asked to get added', () => {
    studio.identify({ name: 'Nobody', email: 'nobody@endless.example' })
    const result = newPrototype('Agent Config')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Ask your agent to add you.')
  })
})
