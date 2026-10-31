import { describe, expect, test } from 'vitest'
import documentation from '../../src/modules/documentation/module'
import { paletteGroups } from '../../app/utils/palette'

test('[SY-03] [SH-42] [SH-43] [PR-19] enabled module data orders groups, preserves search terms and disables current destinations', () => {
  const groups = paletteGroups(
    [
      {
        id: 'prototypes',
        label: 'Prototypes',
        paletteSource: 'prototypes',
        paletteOrder: 25,
        palette: [{ label: 'Prototypes', to: '/prototypes' }],
      },
      {
        id: 'manual',
        label: 'Manual',
        paletteOrder: 30,
        palette: [
          {
            label: 'Getting started',
            to: '/manual/start',
            group: 'Manual',
            keywords: ['help'],
          },
        ],
      },
      {
        id: 'systems',
        label: 'Systems',
        paletteSource: 'systems',
        paletteOrder: 20,
        palette: [],
      },
    ],
    {
      prototypes: [
        {
          id: 'one',
          title: 'Draft',
          contributor: 'ada',
          folder: 'ada/draft',
          owner: 'ada-id',
          created: '2026-10-29',
          systemId: null,
          status: 'active',
        },
      ],
      contributors: [{ id: 'ada-id', key: 'ada', name: 'Ada Lovelace' }],
      systems: [
        {
          id: 'sys',
          key: 'harbor',
          label: 'Harbor',
          status: 'active',
          colorModes: ['light'],
        },
      ],
      defaultSystem: null,
    },
    [
      {
        id: 'view',
        title: 'Sign in',
        path: 'flow/Sign in',
        file: 'x.vue',
        type: 'view',
        states: [{ id: 'state', title: 'Member' }],
      },
    ],
    { path: '/prototypes/one/artifacts/state', prototype: 'one' },
    false,
    { places: 'Places', home: 'Home', settings: 'Studio settings' },
  )
  expect(groups.map((g) => g.label)).toEqual([
    'Places',
    'Systems',
    'Prototypes',
    'Manual',
  ])
  expect(groups[0]!.items.map((i) => i.label)).toEqual(['Home', 'Prototypes'])
  expect(groups[2]!.items[0]).toMatchObject({
    label: 'Draft',
    suffix: 'Ada',
    disabled: true,
    keywords: ['Ada Lovelace', 'ada', 'ada/draft'],
  })
  expect(groups[2]!.items.at(-1)).toMatchObject({
    label: 'Member',
    disabled: true,
  })
})

test('[SY-03] a system remains disabled on its nested pages', () => {
  const groups = paletteGroups(
    [
      {
        id: 'systems',
        label: 'Systems',
        palette: [],
        paletteSource: 'systems',
      },
    ],
    {
      prototypes: [],
      contributors: [],
      defaultSystem: null,
      systems: [
        {
          id: 'sys',
          key: 'harbor',
          label: 'Harbor',
          status: 'active',
          colorModes: ['light'],
        },
      ],
    },
    [],
    { path: '/systems/sys/context' },
    false,
    { places: 'Places', home: 'Home', settings: 'Studio settings' },
  )
  expect(groups[1]!.items[0]).toMatchObject({
    label: 'Harbor system',
    to: '/systems/sys',
    disabled: true,
  })
})

test('[PR-140] [SH-43] real Manual chapters precede later module groups and disable the current chapter', () => {
  const groups = paletteGroups(
    [
      {
        id: 'later',
        label: 'Later',
        paletteOrder: 40,
        palette: [{ label: 'Later page', to: '/later', group: 'Later' }],
      },
      documentation,
    ],
    { prototypes: [], contributors: [], defaultSystem: null, systems: [] },
    [],
    { path: '/documentation/manual/agent' },
    false,
    { places: 'Places', home: 'Home', settings: 'Studio settings' },
  )
  expect(groups.map(({ label }) => label)).toEqual([
    'Places',
    'Manual',
    'Later',
  ])
  expect(
    groups[1]!.items.find(({ label }) => label === 'Working with your agent'),
  ).toMatchObject({ to: '/documentation/manual/agent', disabled: true })
})

describe('[SY-20] [SY-41] system actions in the palette', () => {
  const systemsModule = {
    id: 'systems',
    label: 'Systems',
    paletteSource: 'systems' as const,
    paletteOrder: 20,
    palette: [
      {
        label: 'New system',
        to: '/systems?new=system',
        group: 'Systems',
        keywords: ['create'],
        localOnly: true,
        adminOnly: true,
      },
    ],
  }
  const manifest = {
    prototypes: [],
    contributors: [],
    defaultSystem: 'sys',
    systems: [
      {
        id: 'sys',
        key: 'harbor',
        label: 'Harbor',
        status: 'active' as const,
        colorModes: ['light' as const],
      },
      {
        id: 'old',
        key: 'attic',
        label: 'Attic',
        status: 'archived' as const,
        colorModes: ['light' as const],
      },
    ],
  }
  const labels = {
    places: 'Places',
    home: 'Home',
    settings: 'Studio settings',
    systemAction: (id: string, name: string) => `${id} ${name}`,
  }
  const items = (
    path: string,
    local: boolean,
    me: { admin: boolean; maintains: string[] },
  ) =>
    paletteGroups([systemsModule], manifest, [], { path }, local, labels, me)
      .find(({ id }) => id === 'systems')!
      .items.map(({ label, to }) => `${label} → ${to}`)

  test('New system is for Admins, locally', () => {
    expect(items('/systems', true, { admin: true, maintains: [] })).toContain(
      'New system → /systems?new=system',
    )
    expect(
      items('/systems', true, { admin: false, maintains: [] }),
    ).not.toContain('New system → /systems?new=system')
    expect(
      items('/systems', false, { admin: true, maintains: [] }),
    ).not.toContain('New system → /systems?new=system')
  })

  test('the system you are in offers what its menu offers you', () => {
    expect(
      items('/systems/sys/context', true, { admin: true, maintains: [] }),
    ).toEqual([
      'New system → /systems?new=system',
      'rename Harbor → /systems/sys?action=rename',
      'archive Harbor → /systems/sys?action=archive',
      'delete Harbor → /systems/sys?action=delete',
      'Harbor system → /systems/sys',
      'Attic system → /systems/old',
    ])
    expect(
      items('/systems/sys', true, { admin: false, maintains: ['sys'] }),
    ).toEqual([
      'rename Harbor → /systems/sys?action=rename',
      'Harbor system → /systems/sys',
      'Attic system → /systems/old',
    ])
    expect(
      items('/systems/old', true, { admin: true, maintains: [] }).slice(1, 3),
    ).toEqual([
      'restore Attic → /systems/old?action=restore',
      'delete Attic → /systems/old?action=delete',
    ])
    // Nothing to change on the deployed site, or outside a system.
    expect(
      items('/systems/sys', false, { admin: true, maintains: [] }),
    ).toEqual(['Harbor system → /systems/sys'])
  })
})
