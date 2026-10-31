import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { ADA, BEN, tempStudio, type TempStudio } from './setup/temp-studio'

const SYSTEM = '8x5spen6xtvp96a9'
const TOUR = 'tour000000000001'

let studio: TempStudio
beforeEach(() => {
  studio = tempStudio()
  studio.addModule('sample')
  studio.addModule('extra')
  studio.setConfig({ modules: { sample: true, extra: false } })
})
afterEach(() => {
  studio.remove()
})

function prototype(meta: Record<string, unknown> = {}) {
  studio.write(
    'src/prototypes/ben/tour/meta.json',
    JSON.stringify({
      formatVersion: 1,
      title: 'Tour',
      studioId: TOUR,
      ownerContributorId: BEN.id,
      systemId: SYSTEM,
      ...meta,
    }),
  )
}

describe('status', () => {
  test('[CL-10] shows the studio, you, the default system, modules and systems', () => {
    const result = studio.studio('status')
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Endless Design Studio')
    expect(result.stdout).toContain('Contributor: ada (Admin)')
    expect(result.stdout).toContain('Default system: endless-studios')
    expect(result.stdout).toContain('Enabled modules: sample')
    expect(result.stdout).toContain('Disabled modules: extra')
    expect(result.stdout).toContain('Systems: endless-studios')
    expect(result.stdout).toContain(
      'reports the files, not whether setup is complete',
    )
  })

  test('[CL-10] --json reports the same, with configuration problems', () => {
    studio.setConfig({ admins: [] })
    studio.identify({ name: 'Nobody', email: 'nobody@endless.example' })
    const report = JSON.parse(studio.studio('status', '--json').stdout)
    expect(report).toMatchObject({
      studio: { name: 'Endless Design Studio' },
      contributor: { key: null, role: null },
      defaultSystem: { key: 'endless-studios', studioId: SYSTEM },
      modules: { enabled: ['sample'], disabled: ['extra'] },
      systems: ['endless-studios'],
    })
    expect(report.problems).toContain(
      'studio.config.json: the studio needs at least one Admin in admins.',
    )
  })

  test('[CL-47] [CL-62] flags a contributor key that is a page address, and personal use', () => {
    studio.write(
      'contributors/sample.json',
      JSON.stringify({
        formatVersion: 1,
        studioId: 'sam0000000000003',
        name: 'Sam',
        email: 'sam@endless.example',
        github: '',
        preferences: {},
      }),
    )
    studio.setConfig({ usage: 'personal' })
    const result = studio.studio('status')
    expect(result.stdout).toContain(
      'contributors/sample.json: the key "sample" is the address of a studio page (/sample)',
    )
    expect(result.stdout).toContain('always in team use')
    expect(result.stdout).not.toContain('(personal)')
  })

  test('[CL-11] [CL-13] [CL-15] status and list say nothing of starter examples, releases or outside sources', () => {
    studio.write(
      'src/systems/endless-studios/context/principles.md',
      '**Placeholder.** Example principles.\n',
    )
    const output = studio.studio('status').output + studio.studio('list').output
    expect(output).not.toMatch(
      /starter|placeholder|upstream|release|came with|added from/i,
    )
    expect(studio.studio('check').output).not.toMatch(
      /changed from the original|pack lock|ownership map/i,
    )
  })
})

describe('context', () => {
  test('[CL-14] [PR-46] reports owner, scope, system, role and canEdit without writing', () => {
    prototype()
    studio.identify(BEN)
    const result = studio.studio('context', 'src/prototypes/ben/tour', '--json')
    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    expect(report).toMatchObject({
      prototype: {
        path: 'src/prototypes/ben/tour',
        studioId: TOUR,
        title: 'Tour',
        owner: 'ben',
        ownerContributorId: BEN.id,
        status: 'active',
      },
      contributor: {
        key: 'ben',
        role: 'contributor',
        canEdit: true,
        refusal: null,
      },
      assignment: {
        system: 'endless-studios',
        systemId: SYSTEM,
        status: 'active',
        entry: 'src/systems/endless-studios/AGENTS.md',
      },
      rebuild: null,
      modules: { enabled: ['sample'] },
    })
    expect(report.guidance.working).toBe('AGENTS.md')
  })

  test('[CL-14] an Admin can edit anyone’s prototype; another contributor can’t, and an unknown identity gets a hint', () => {
    prototype()
    studio.identify(ADA)
    const ada = JSON.parse(
      studio.studio('context', 'src/prototypes/ben/tour').stdout,
    )
    expect(ada.contributor).toMatchObject({
      key: 'ada',
      role: 'admin',
      canEdit: true,
    })

    studio.write(
      'contributors/cara.json',
      JSON.stringify({
        formatVersion: 1,
        studioId: 'cara000000000003',
        name: 'Cara',
        email: 'cara@endless.example',
        github: '',
        preferences: {},
      }),
    )
    studio.identify({ name: 'Cara', email: 'cara@endless.example' })
    const cara = JSON.parse(
      studio.studio('context', 'src/prototypes/ben/tour').stdout,
    )
    expect(cara.contributor).toMatchObject({ canEdit: false })
    expect(cara.contributor.refusal).toContain('belongs to someone else')

    studio.identify({ name: 'Ben Okafor', email: 'ben@new.example' })
    const stranger = JSON.parse(
      studio.studio('context', 'src/prototypes/ben/tour').stdout,
    )
    expect(stranger.contributor).toMatchObject({
      key: null,
      role: null,
      canEdit: false,
    })
    expect(stranger.contributor.refusal).toContain('ben@new.example')
    expect(stranger.contributor.refusal).toContain('--as ben')
  })

  test('[PR-46] reports a pending rebuild and no system', () => {
    prototype({
      systemId: null,
      rebuild: {
        sourcePrototypeId: 'prv0000000000009',
        targetSystemId: SYSTEM,
      },
    })
    const report = JSON.parse(
      studio.studio('context', 'src/prototypes/ben/tour').stdout,
    )
    expect(report.assignment).toMatchObject({ system: null, systemId: null })
    expect(report.rebuild).toMatchObject({
      sourcePrototypeId: 'prv0000000000009',
      targetSystemKey: 'endless-studios',
      targetSystemId: SYSTEM,
      target: { entry: 'src/systems/endless-studios/AGENTS.md' },
    })
  })

  test('[CL-14] refuses a missing assignment, folders outside prototypes and configuration problems', () => {
    prototype({ systemId: undefined })
    const missing = studio.studio('context', 'src/prototypes/ben/tour')
    expect(missing.status).toBe(1)
    expect(missing.stderr).toContain('systemId')

    expect(studio.studio('context', 'src/modules/sample').stderr).toContain(
      'src/prototypes/<contributor>/<prototype>',
    )

    prototype()
    studio.setConfig({ admins: [] })
    const problems = studio.studio('context', 'src/prototypes/ben/tour')
    expect(problems.status).toBe(1)
    expect(problems.stderr).toContain('at least one Admin')
  })
})
