import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { buildManifest } from '../../tooling/manifest/build'
import { identity as viewIdentity } from '../../src/modules/prototypes/types/view/identity'
import { fidelity as viewFidelity } from '../../src/modules/prototypes/types/view/fidelity'
import { check as viewCheck } from '../../src/modules/prototypes/types/view/states'
import type { InstalledSystem } from '../../tooling/systems/registry'

let root: string

const SYSTEM = 'hrbr000000000001'
const systems = [
  {
    key: 'harbor',
    id: SYSTEM,
    dir: '',
    folder: 'src/systems/harbor',
    spec: { label: 'Harbor', status: 'active', colorModes: ['light'] },
  },
] as unknown as InstalledSystem[]
const fileTypes = [
  {
    id: 'view',
    extensions: ['.vue'],
    identity: viewIdentity,
    check: viewCheck,
    fidelity: viewFidelity,
  },
]

function write(file: string, content: string) {
  const full = path.join(root, 'src/prototypes', file)
  mkdirSync(path.dirname(full), { recursive: true })
  writeFileSync(full, content)
}

function prototype(folder: string, meta: Record<string, unknown>) {
  write(
    `${folder}/meta.json`,
    JSON.stringify({
      formatVersion: 1,
      title: 'Tracer',
      created: '2026-10-28',
      ownerContributorId: 'ma1xykkc2j3d2x24',
      systemId: SYSTEM,
      ...meta,
    }),
  )
}

const view = (id: string, body = '<template><p /></template>') =>
  `<!-- @studio-id ${id} -->\n${body}\n`

const build = () =>
  buildManifest({
    root,
    prototypesFolder: 'src/prototypes',
    systems,
    fileTypes,
    defaultSystem: SYSTEM,
  })

beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), 'studio-manifest-'))
})
afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('the manifest', () => {
  test('[CL-103] [CL-116] lists prototypes and their artifacts in file-tree order, from every folder', () => {
    prototype('bernardo/tracer', { studioId: 'tracer0000000001' })
    write('bernardo/tracer/Zebra.vue', view('vzbr000000000001'))
    write('bernardo/tracer/Alpha.vue', view('va1p000000000001'))
    write('bernardo/tracer/flows/Sign in.vue', view('vsgn000000000001'))
    write('bernardo/tracer/flows/deep/Step.vue', view('vstp000000000001'))
    // Helpers, hidden files and files no enabled type claims are not artifacts.
    write('bernardo/tracer/_parts/Card.vue', '<template><p /></template>')
    write('bernardo/tracer/.draft.vue', view('vdrf000000000001'))
    write('bernardo/tracer/notes.txt', 'Not a view')
    const { manifest, artifacts, problems } = build()
    expect(problems).toEqual([])
    expect(manifest.prototypes).toEqual([
      {
        id: 'tracer0000000001',
        title: 'Tracer',
        contributor: 'bernardo',
        folder: 'src/prototypes/bernardo/tracer',
        owner: 'ma1xykkc2j3d2x24',
        created: '2026-10-28',
        systemId: SYSTEM,
        status: 'active',
      },
    ])
    expect(manifest.systems).toEqual([
      {
        id: SYSTEM,
        key: 'harbor',
        label: 'Harbor',
        status: 'active',
        colorModes: ['light'],
      },
    ])
    expect(manifest.defaultSystem).toBe(SYSTEM)
    expect(
      artifacts['tracer0000000001']!.map(({ id, title, path, type }) => [
        id,
        title,
        path,
        type,
      ]),
    ).toEqual([
      ['vstp000000000001', 'Step', 'flows/deep/Step', 'view'],
      ['vsgn000000000001', 'Sign in', 'flows/Sign in', 'view'],
      ['va1p000000000001', 'Alpha', 'Alpha', 'view'],
      ['vzbr000000000001', 'Zebra', 'Zebra', 'view'],
    ])
    expect(artifacts['tracer0000000001']![2]!.file).toBe(
      'src/prototypes/bernardo/tracer/Alpha.vue',
    )
  })

  test('[PR-28] files of a turned-off module’s type stay listed, marked unavailable with the type and module', () => {
    prototype('bernardo/tracer', { studioId: 'tracer0000000001' })
    write('bernardo/tracer/Home.vue', view('vhme000000000001'))
    write('bernardo/tracer/plan.note', view('vn0t000000000001'))
    const { artifacts, problems } = buildManifest({
      root,
      prototypesFolder: 'src/prototypes',
      systems,
      fileTypes: [
        ...fileTypes,
        {
          id: 'note',
          extensions: ['.note'],
          identity: viewIdentity,
          off: { type: 'Note', module: 'Notes' },
        },
      ],
    })
    expect(problems).toEqual([])
    expect(
      artifacts['tracer0000000001']!.map(({ id, type, unavailable }) => [
        id,
        type,
        unavailable,
      ]),
    ).toEqual([
      ['vhme000000000001', 'view', undefined],
      ['vn0t000000000001', 'note', { type: 'Note', module: 'Notes' }],
    ])
  })

  test('[CL-103] reads identities only from leading comments, and reports missing and repeated ones', () => {
    prototype('bernardo/tracer', { studioId: 'tracer0000000001' })
    write(
      'bernardo/tracer/Late.vue',
      '<template><p /></template>\n<!-- @studio-id vate000000000001 -->\n',
    )
    write('bernardo/tracer/One.vue', view('vdpp000000000001'))
    write('bernardo/tracer/Two.vue', view('vdpp000000000001'))
    write(
      'bernardo/tracer/Twice.vue',
      '<!-- @studio-id vtw1000000000001 -->\n<!-- @studio-id vtw2000000000001 -->\n',
    )
    const { artifacts, problems } = build()
    expect(artifacts['tracer0000000001']!.map(({ title }) => title)).toEqual([
      'One',
    ])
    expect(problems).toEqual([
      'src/prototypes/bernardo/tracer/Late.vue: the permanent identity is missing; it belongs in a leading <!-- @studio-id … --> comment.',
      'src/prototypes/bernardo/tracer/Twice.vue: an artifact must declare its permanent identity only once.',
      'src/prototypes/bernardo/tracer/Two.vue: the permanent identity vdpp000000000001 is already used by src/prototypes/bernardo/tracer/One.vue.',
    ])
  })

  test('[SY-133] a prototype names its system or explicitly none; a missing or unknown assignment is invalid', () => {
    prototype('bernardo/plain', {
      studioId: 'p1a1n00000000001',
      systemId: null,
    })
    prototype('bernardo/unset', {
      studioId: 'vnst000000000001',
      systemId: undefined,
    })
    prototype('bernardo/gone', {
      studioId: 'g0ne000000000001',
      systemId: 'zzzz000000000001',
    })
    const { manifest, problems } = build()
    expect(
      manifest.prototypes.map(({ id, systemId }) => [id, systemId]),
    ).toEqual([['p1a1n00000000001', null]])
    expect(problems).toEqual([
      'src/prototypes/bernardo/gone/meta.json: the system zzzz000000000001 is not installed; choose an installed system or null for no system.',
      'src/prototypes/bernardo/unset/meta.json: "systemId" is missing; name the prototype’s system, or null for no system.',
    ])
  })

  test('[PR-08] [PR-04] marks archived prototypes, and names each contributor for bylines', () => {
    prototype('ada/old', { studioId: 'a1d0000000000001', status: 'archived' })
    prototype('ada/new', { studioId: 'a1d0000000000002' })
    const contributors = {
      ada: {
        studioId: 'ada0000000000001',
        name: 'Ada Lovelace',
        github: 'ada-l',
        avatar: 'images/ada.png',
        email: 'ada@endless.example',
        preferences: {},
      },
      ben: { studioId: 'ben0000000000002', name: 'Ben Okafor', github: '' },
    }
    const { manifest } = buildManifest({
      root,
      systems,
      fileTypes,
      contributors,
    })
    expect(manifest.prototypes.map(({ status }) => status)).toEqual([
      'active',
      'archived',
    ])
    // Only what a byline shows: never emails or preferences.
    expect(manifest.contributors).toEqual([
      {
        id: 'ada0000000000001',
        key: 'ada',
        name: 'Ada Lovelace',
        github: 'ada-l',
        avatar: 'images/ada.png',
      },
      { id: 'ben0000000000002', key: 'ben', name: 'Ben Okafor' },
    ])
  })

  test('[CL-103] an unreadable or incomplete meta.json is reported and leaves the prototype out', () => {
    write('bernardo/broken/meta.json', '{ "title": ')
    prototype('bernardo/untitled', { studioId: 'vnt1000000000001', title: '' })
    prototype('bernardo/no-id', { studioId: 'short' })
    const { manifest, problems } = build()
    expect(manifest.prototypes).toEqual([])
    expect(problems).toEqual([
      'src/prototypes/bernardo/broken/meta.json is not valid JSON.',
      'src/prototypes/bernardo/no-id/meta.json: "studioId" must be 16 lowercase letters and digits (Crockford base32).',
      'src/prototypes/bernardo/untitled/meta.json: "title" must be plain text.',
    ])
  })
})

describe('named states and lo-fi views', () => {
  const STATES = `<script lang="ts">
export const states = [
  { title: 'Member', props: { name: 'Ana' } },
  { title: 'New user', props: { name: '' } },
]
</script>
<template><p>{{ name }}</p></template>`

  test('[PR-89] [SH-72] a view carries its states, each with its own permanent identity, in declaration order', () => {
    prototype('bernardo/tracer', { studioId: 'tracer0000000001' })
    write(
      'bernardo/tracer/Home.vue',
      `<!-- @studio-id vhme000000000001 -->
<!-- @studio-state stmb000000000001 Member -->
<!-- @studio-state stnw000000000001 New user -->
${STATES}`,
    )
    write('bernardo/tracer/Plain.vue', view('vp1n000000000001'))
    const { artifacts, problems } = build()
    expect(problems).toEqual([])
    const [home, plain] = artifacts.tracer0000000001!
    expect(home!.states).toEqual([
      { id: 'stmb000000000001', title: 'Member' },
      { id: 'stnw000000000001', title: 'New user' },
    ])
    expect(plain).not.toHaveProperty('states')
  })

  test('[PR-90] a state without its identity, a shared identity and a comment naming no state are reported with the file and title', () => {
    prototype('bernardo/tracer', { studioId: 'tracer0000000001' })
    write(
      'bernardo/tracer/Home.vue',
      `<!-- @studio-id vhme000000000001 -->
<!-- @studio-state stmb000000000001 Member -->
<!-- @studio-state stgn000000000001 Gone -->
${STATES}`,
    )
    write(
      'bernardo/tracer/Other.vue',
      `<!-- @studio-id vthr000000000001 -->
<!-- @studio-state stmb000000000001 Member -->
${STATES.replace("{ title: 'New user', props: { name: '' } },", '')}`,
    )
    const { artifacts, problems } = build()
    expect(problems).toEqual([
      'src/prototypes/bernardo/tracer/Home.vue: @studio-state stgn000000000001 names no state titled "Gone". When renaming a state, change its title in the comment too, which keeps its permanent link; remove the comment only when removing the state.',
      'src/prototypes/bernardo/tracer/Home.vue: state "New user" has no permanent identity yet.',
      'src/prototypes/bernardo/tracer/Other.vue: state "Member": the permanent identity stmb000000000001 is already used by src/prototypes/bernardo/tracer/Home.vue (state "Member").',
    ])
    // The views stay; only their broken states are left out.
    expect(artifacts.tracer0000000001!.map(({ states }) => states)).toEqual([
      [{ id: 'stmb000000000001', title: 'Member' }],
      [],
    ])
  })

  test('[PR-91] a lo-fi view says so', () => {
    prototype('bernardo/tracer', { studioId: 'tracer0000000001' })
    write(
      'bernardo/tracer/Sketch.vue',
      `<!-- @lofi -->
${view('vskt000000000001')}`,
    )
    write('bernardo/tracer/Final.vue', view('vfn1000000000001'))
    const [final, sketch] = build().artifacts.tracer0000000001!
    expect(sketch!.lofi).toBe(true)
    expect(final).not.toHaveProperty('lofi')
  })
})

describe('the view identity', () => {
  test('[CL-103] is an HTML comment at the top of the file, after any blank lines and other comments', () => {
    expect(
      viewIdentity.read('\uFEFF\n<!-- @studio-id vhme000000000001 -->'),
    ).toBe('vhme000000000001')
    expect(
      viewIdentity.read(
        '<!-- A note -->\n<!--\n  @studio-id vhme000000000001\n-->\n<template />',
      ),
    ).toBe('vhme000000000001')
    expect(
      viewIdentity.read('<script setup>\n// @studio-id vhme000000000001\n'),
    ).toBeNull()
    expect(() => viewIdentity.read('<!-- @studio-id Not-An-Id -->')).toThrow(
      'A permanent identity must be 16 lowercase letters and digits (Crockford base32).',
    )
  })
})
