import { expect, test } from 'vitest'
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
