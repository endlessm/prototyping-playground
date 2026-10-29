// Permanent identities from the command line: the audit and `identify`.
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { ADA, BEN, tempStudio, type TempStudio } from './setup/temp-studio'

const SYSTEM = '8x5spen6xtvp96a9'
const DEMO = 'dem0000000000001'
const HOME = 'hme0000000000001'
const ID = /^[0-9a-hjkmnp-tv-z]{16}$/

let studio: TempStudio
beforeEach(() => {
  studio = tempStudio()
  studio.withModule('prototypes')
})
afterEach(() => {
  studio.remove()
})

function prototype(
  owner = 'ada',
  folder = 'demo',
  meta: Record<string, unknown> = {},
) {
  studio.write(
    `src/prototypes/${owner}/${folder}/meta.json`,
    `${JSON.stringify(
      {
        formatVersion: 1,
        title: 'Demo',
        studioId: DEMO,
        ownerContributorId: owner === 'ada' ? ADA.id : BEN.id,
        systemId: SYSTEM,
        ...meta,
      },
      null,
      2,
    )}\n`,
  )
}

const view = (id?: string) =>
  `${id ? `<!-- @studio-id ${id} -->\n` : ''}<template>\n  <p>Hi</p>\n</template>\n`

interface Audit {
  resources: { kind: string; path: string; studioId: string | null }[]
  missing: string[]
  problems: string[]
}

describe('identity-audit', () => {
  test('[CL-48] counts every resource and passes when each has its own ID', () => {
    prototype()
    studio.write('src/prototypes/ada/demo/Home.vue', view(HOME))
    studio.write('src/prototypes/ada/demo/_parts/Card.vue', view())

    const result = studio.studio('identity-audit')
    expect(result.status).toBe(0)
    // Ada and Ben, Endless Studios, the prototype and its view; helpers
    // aren't artifacts.
    expect(result.stdout).toContain('5 resources; 0 missing identities.')

    const audit = JSON.parse(studio.studio('identity-audit', '--json').stdout)
    expect(
      audit.resources.map(({ kind, path }: Audit['resources'][0]) => [
        kind,
        path,
      ]),
    ).toEqual([
      ['contributor', 'contributors/ada.json'],
      ['contributor', 'contributors/ben.json'],
      ['system', 'src/systems/endless-studios/system.ts'],
      ['prototype', 'src/prototypes/ada/demo/meta.json'],
      ['artifact', 'src/prototypes/ada/demo/Home.vue'],
    ])
  })

  test('[CL-48] reports a missing ID, exits non-zero and writes nothing', () => {
    prototype()
    studio.write('src/prototypes/ada/demo/Home.vue', view())

    const result = studio.studio('identity-audit', '--json')
    expect(result.status).toBe(1)
    const audit: Audit = JSON.parse(result.stdout)
    expect(audit.missing).toEqual(['src/prototypes/ada/demo/Home.vue'])
    expect(audit.problems).toEqual([])
    expect(studio.read('src/prototypes/ada/demo/Home.vue')).toBe(view())
  })

  test('[CL-48] reports duplicate and malformed IDs, naming the files', () => {
    prototype()
    studio.write('src/prototypes/ada/demo/Home.vue', view(HOME))
    studio.write('src/prototypes/ada/demo/flows/Copy.vue', view(HOME))
    studio.write(
      'src/prototypes/ada/demo/Bad.vue',
      '<!-- @studio-id NOT-AN-ID -->\n<template />\n',
    )

    const result = studio.studio('identity-audit')
    expect(result.status).toBe(1)
    expect(result.stdout).toContain(
      `src/prototypes/ada/demo/Home.vue: the permanent identity ${HOME} is already used by src/prototypes/ada/demo/flows/Copy.vue.`,
    )
    expect(result.stdout).toContain(
      'src/prototypes/ada/demo/Bad.vue: a permanent identity must be 16 lowercase letters and digits',
    )
  })

  test('[CL-48] a prototype that reuses a contributor’s ID is a duplicate', () => {
    prototype('ada', 'demo', { studioId: BEN.id })
    const audit: Audit = JSON.parse(
      studio.studio('identity-audit', '--json').stdout,
    )
    expect(audit.problems).toEqual([
      `src/prototypes/ada/demo/meta.json: the permanent identity ${BEN.id} is already used by contributors/ben.json.`,
    ])
  })
})

interface Plan {
  folder: string
  missing: string[]
  assigned?: { path: string; studioId: string }[]
}

describe('identify', () => {
  const folder = 'src/prototypes/ada/demo'

  test('[CL-49] previews the files missing an ID as JSON and changes nothing', () => {
    prototype()
    studio.write(`${folder}/Home.vue`, view(HOME))
    studio.write(`${folder}/Start.vue`, view())
    studio.write(`${folder}/flows/Sign in.vue`, view())

    const result = studio.studio('identify', folder, '--json')
    expect(result.status).toBe(0)
    const plan: Plan = JSON.parse(result.stdout)
    expect(plan.folder).toBe(folder)
    expect(plan.missing).toEqual([
      `${folder}/flows/Sign in.vue`,
      `${folder}/Start.vue`,
    ])
    expect(plan.assigned).toBeUndefined()
    expect(studio.read(`${folder}/Start.vue`)).toBe(view())

    const text = studio.studio('identify', folder)
    expect(text.stdout).toContain(
      '2 files need an identity in src/prototypes/ada/demo.',
    )
    expect(text.stdout).toContain('Nothing was changed.')
  })

  test('[CL-49] --yes writes the missing IDs, keeps existing ones and lists each', () => {
    prototype()
    studio.write(`${folder}/Home.vue`, view(HOME))
    studio.write(`${folder}/Start.vue`, view())
    studio.write(`${folder}/flows/Sign in.vue`, view())

    const result = studio.studio('identify', folder, '--yes', '--json')
    expect(result.status).toBe(0)
    const plan: Plan = JSON.parse(result.stdout)
    expect(plan.assigned!.map(({ path }) => path)).toEqual([
      `${folder}/flows/Sign in.vue`,
      `${folder}/Start.vue`,
    ])
    for (const { path, studioId } of plan.assigned!) {
      expect(studioId).toMatch(ID)
      expect(studio.read(path)).toBe(view(studioId))
    }
    expect(new Set(plan.assigned!.map(({ studioId }) => studioId)).size).toBe(2)
    expect(studio.read(`${folder}/Home.vue`)).toBe(view(HOME))
    expect(studio.studio('identity-audit').status).toBe(0)

    const again = studio.studio('identify', folder, '--yes')
    expect(again.stdout).toContain(
      'Nothing in src/prototypes/ada/demo needed an identity.',
    )
  })

  test('[CL-49] says each assigned ID in plain text', () => {
    prototype()
    studio.write(`${folder}/Start.vue`, view())
    const result = studio.studio('identify', folder, '--yes')
    const id = /<!-- @studio-id (\S+) -->/.exec(
      studio.read(`${folder}/Start.vue`),
    )![1]
    expect(result.stdout).toContain(
      'Assigned 1 identity in src/prototypes/ada/demo; existing identities were kept:',
    )
    expect(result.stdout).toContain(`  ${folder}/Start.vue → ${id}`)
  })

  test('[CL-49] gives the prototype its own missing ID and owner', () => {
    prototype('ada', 'demo', {
      studioId: undefined,
      ownerContributorId: undefined,
    })
    const result = studio.studio('identify', folder, '--yes', '--json')
    expect(result.status).toBe(0)
    const meta = studio.json(`${folder}/meta.json`)
    expect(meta.studioId).toMatch(ID)
    expect(meta.ownerContributorId).toBe(ADA.id)
    expect(meta.title).toBe('Demo')
  })

  test('[CL-49] only works in your own prototypes', () => {
    prototype()
    studio.write(`${folder}/Start.vue`, view())
    studio.identify(BEN)
    for (const args of [[], ['--yes']]) {
      const result = studio.studio('identify', folder, ...args)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('belongs to someone else')
    }
    expect(studio.read(`${folder}/Start.vue`)).toBe(view())
  })

  test('[CL-49] refuses a folder that is not a prototype', () => {
    for (const target of [
      'src/prototypes/ada',
      'src/modules',
      '../elsewhere',
    ]) {
      const result = studio.studio('identify', target)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain(
        'src/prototypes/<contributor>/<prototype>',
      )
    }
  })

  test('[CL-49] refuses while the studio has identity problems, and names them', () => {
    prototype()
    studio.write(`${folder}/Home.vue`, view(HOME))
    studio.write(`${folder}/Copy.vue`, view(HOME))
    studio.write(`${folder}/Start.vue`, view())
    const result = studio.studio('identify', folder, '--yes')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain(`is already used by ${folder}/Copy.vue`)
    expect(studio.read(`${folder}/Start.vue`)).toBe(view())
  })

  test('[CL-49] refuses a prototype that does not name its system', () => {
    prototype('ada', 'demo', { systemId: undefined })
    studio.write(`${folder}/Start.vue`, view())
    const result = studio.studio('identify', folder, '--yes')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('systemId')
    expect(studio.read(`${folder}/Start.vue`)).toBe(view())
  })
})
