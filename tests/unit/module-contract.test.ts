import { describe, expect, test } from 'vitest'
import { orderHomeBlocks } from '../../app/utils/home'
import {
  moduleProblems,
  modulesForApp,
  type InstalledModule,
} from '../../tooling/modules/registry'

const base = { id: 'notes', label: 'Notes' }

describe('a module’s Home block', () => {
  test('[SH-97] a module declares its Home block as a Vue component, with an optional order here and on the deployed site', () => {
    expect(
      moduleProblems(
        {
          ...base,
          home: { component: 'components/NotesHome.vue' },
        },
        'notes',
      ),
    ).toEqual([])
    expect(
      moduleProblems(
        {
          ...base,
          home: {
            component: 'components/NotesHome.vue',
            order: { local: 10, deployed: 30 },
          },
        },
        'notes',
      ),
    ).toEqual([])
    expect(
      moduleProblems({ ...base, home: { component: 'Home.tsx' } }, 'notes'),
    ).toEqual([
      'notes/module.ts: the Home block names its .vue component and optional numeric local and deployed orders.',
    ])
    expect(
      moduleProblems(
        {
          ...base,
          home: { component: 'Home.vue', order: { local: 'first' } },
        },
        'notes',
      ),
    ).toHaveLength(1)
  })

  test('[SH-97] blocks are ordered for where the studio runs: your work first locally, what colleagues come for first on the deployed site', () => {
    const blocks = [
      { id: 'systems', order: { local: 30, deployed: 10 } },
      { id: 'prototypes', order: { local: 10, deployed: 20 } },
      { id: 'manual', order: {} },
    ]
    expect(orderHomeBlocks(blocks, true).map(({ id }) => id)).toEqual([
      'prototypes',
      'systems',
      'manual',
    ])
    expect(orderHomeBlocks(blocks, false).map(({ id }) => id)).toEqual([
      'systems',
      'prototypes',
      'manual',
    ])
  })
})

describe('local-only modules', () => {
  const installed = (spec: Record<string, unknown>) =>
    ({ spec: { ...base, ...spec }, dir: '' }) as unknown as InstalledModule

  test('[SH-23] a module marked local only contributes nothing to the deployed site', () => {
    expect(moduleProblems({ ...base, localOnly: true }, 'notes')).toEqual([])
    expect(moduleProblems({ ...base, localOnly: 'yes' }, 'notes')).toEqual([
      'notes/module.ts: localOnly is true or false.',
    ])
    const modules = [
      installed({ id: 'welcome', localOnly: true }),
      installed({ id: 'systems' }),
    ]
    expect(
      modulesForApp(modules, { dev: true }).map(({ spec }) => spec.id),
    ).toEqual(['welcome', 'systems'])
    expect(
      modulesForApp(modules, { dev: false }).map(({ spec }) => spec.id),
    ).toEqual(['systems'])
  })
})
