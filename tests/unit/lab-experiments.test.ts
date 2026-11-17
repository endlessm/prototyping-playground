// An experiment of a system component is a view that names that component
// in a comment at its top. It starts from the component's rendering source:
// the Default example for a component whose file wraps one Nuxt UI tag, the
// component's own source for a composite, so it first renders like the
// Playground.
import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import {
  readExperiment,
  writeExperiment,
} from '../../tooling/manifest/experiments'
import {
  startSource,
  wrapsOneNuxtUiTag,
} from '../../tooling/systems/start-source'
import {
  experimentAddress,
  experimentsOf,
  viewAddress,
} from '../../src/modules/lab/utils/experiments'

const SYSTEM = '8x5spen6xtvp96a9'
const COMPONENTS = 'src/systems/endless-studios/components'
const read = (file: string) => readFileSync(`${COMPONENTS}/${file}`, 'utf8')

describe('the experiment marker', () => {
  test('[LAB-41] names the system, the component and the day it was made', () => {
    const source = `<!-- @studio-id vw00000000000001 -->\n<!-- @lab-experiment ${SYSTEM} button 2026-11-17 -->\n<template><p /></template>\n`
    expect(readExperiment(source)).toEqual({
      systemId: SYSTEM,
      component: 'button',
      created: '2026-11-17',
    })
  })

  test('[LAB-41] reads without a day, and only from the comments at the top', () => {
    expect(
      readExperiment(`<!-- @lab-experiment ${SYSTEM} studio-sidebar -->\n`),
    ).toEqual({ systemId: SYSTEM, component: 'studio-sidebar', created: null })
    expect(
      readExperiment(
        `<template>\n  <!-- @lab-experiment ${SYSTEM} button -->\n</template>\n`,
      ),
    ).toBeNull()
    expect(readExperiment('<!-- @lab-experiment -->\n')).toBeNull()
    expect(readExperiment('<template><p /></template>')).toBeNull()
  })

  test('[LAB-41] is written after the permanent identity, or replaces the one there', () => {
    const marked = writeExperiment(
      '<!-- @studio-id vw00000000000001 -->\r\n<template><p /></template>\r\n',
      { systemId: SYSTEM, component: 'button', created: '2026-11-17' },
    )
    expect(marked).toBe(
      `<!-- @studio-id vw00000000000001 -->\r\n<!-- @lab-experiment ${SYSTEM} button 2026-11-17 -->\r\n<template><p /></template>\r\n`,
    )
    expect(
      writeExperiment(marked, {
        systemId: SYSTEM,
        component: 'button',
        created: '2026-11-18',
      }),
    ).toBe(marked.replace('2026-11-17', '2026-11-18'))
    expect(
      writeExperiment('<template><p /></template>\n', {
        systemId: SYSTEM,
        component: 'button',
        created: null,
      }),
    ).toBe(
      `<!-- @lab-experiment ${SYSTEM} button -->\n<template><p /></template>\n`,
    )
  })
})

describe('an experiment’s first source', () => {
  test('[LAB-42] the Endless Studios button wraps one Nuxt UI tag; the sidebar is a composite', () => {
    expect(wrapsOneNuxtUiTag(read('button/button.vue'))).toBe(true)
    expect(wrapsOneNuxtUiTag(read('studio-sidebar/studio-sidebar.vue'))).toBe(
      false,
    )
    expect(
      wrapsOneNuxtUiTag(
        '<template><div><UButton /><UBadge /></div></template>',
      ),
    ).toBe(false)
    expect(wrapsOneNuxtUiTag('<template><button /></template>')).toBe(false)
  })

  test('[LAB-42] a Nuxt UI wrapper starts from its Default example, on a centred stage', () => {
    const source = startSource({
      component: {
        file: `/studio/${COMPONENTS}/button/button.vue`,
        source: read('button/button.vue'),
      },
      examples: {
        file: `/studio/${COMPONENTS}/button/button.examples.vue`,
        source: read('button/button.examples.vue'),
      },
      target: '/studio/src/prototypes/ben/button-experiments/Rounder.vue',
    })
    expect(source).toBe(
      [
        '<template>',
        '  <div class="flex min-h-40 flex-wrap items-center justify-center gap-3 p-6">',
        '    <UButton>Invite Learners</UButton>',
        '  </div>',
        '</template>',
        '',
      ].join('\n'),
    )
  })

  test('[LAB-42] the example’s script comes along, without Example and with its imports still reaching their files', () => {
    const source = startSource({
      component: {
        file: '/studio/src/systems/harbor/components/button/button.vue',
        source: '<template><UButton v-bind="$attrs" /></template>',
      },
      examples: {
        file: '/studio/src/systems/harbor/components/button/button.examples.vue',
        source: `<script setup lang="ts">
import { Example } from '#studio/examples'
import { tides } from '../../data/tides'
</script>

<template>
  <Example name="Tide"><UButton :label="tides[0]" /></Example>
  <Example name="Default">
    <UButton label="Moor" />
    <UButton label="Sail" />
  </Example>
</template>
`,
      },
      target: '/studio/src/prototypes/ben/button-experiments/Calm.vue',
    })
    expect(source).toBe(
      [
        '<script setup lang="ts">',
        "import { tides } from '../../../systems/harbor/data/tides'",
        '</script>',
        '',
        '<template>',
        '  <div class="flex min-h-40 flex-wrap items-center justify-center gap-3 p-6">',
        '    <UButton label="Moor" />',
        '    <UButton label="Sail" />',
        '  </div>',
        '</template>',
        '',
      ].join('\n'),
    )
  })

  test('[LAB-42] without a Default example, the first one', () => {
    const source = startSource({
      component: {
        file: '/s/components/badge/badge.vue',
        source: '<template><UBadge /></template>',
      },
      examples: {
        file: '/s/components/badge/badge.examples.vue',
        source:
          '<template><Example name="New"><UBadge label="New" /></Example></template>',
      },
      target: '/s/prototypes/ben/badge-experiments/One.vue',
    })
    expect(source).toContain('    <UBadge label="New" />')
  })

  test('[LAB-42] a composite starts from its own source, its relative imports still reaching their files', () => {
    const file = `/studio/${COMPONENTS}/studio-sidebar/studio-sidebar.vue`
    const original = read('studio-sidebar/studio-sidebar.vue')
    const source = startSource({
      component: { file, source: original },
      examples: null,
      target:
        '/studio/src/prototypes/ben/studio-sidebar-experiments/Compact.vue',
    })
    expect(source).toContain(
      "import StudioSidebar from '~/components/App/StudioSidebar.vue';",
    )
    expect(source).toContain(
      "from '../../../systems/endless-studios/runtime/auth';",
    )
    expect(source).toContain(
      "from '../../../systems/endless-studios/runtime/nuxt-app';",
    )
    expect(source).toContain('<StudioSidebar />')
    expect(source).toContain('<style scoped>')
    // The file's own description of itself stays with the system.
    expect(source.startsWith('<script setup lang="ts">')).toBe(true)
    expect(source).not.toContain('Screens don')
  })

  test('[LAB-42] a wrapper without examples starts from its own source too', () => {
    const source = startSource({
      component: {
        file: '/s/components/badge/badge.vue',
        source:
          '<!-- A badge. -->\n<template><UBadge label="Badge" /></template>\n',
      },
      examples: null,
      target: '/s/prototypes/ben/badge-experiments/One.vue',
    })
    expect(source).toBe('<template><UBadge label="Badge" /></template>\n')
  })
})

describe('the Experiments tab’s list', () => {
  const prototype = (id: string, owner: string, status = 'active') => ({
    id,
    title: 'Button experiments',
    contributor: owner,
    folder: `src/prototypes/${owner}/button-experiments`,
    owner: `${owner}0000000000001`.slice(0, 16),
    created: '2026-11-01',
    systemId: SYSTEM,
    status: status as 'active' | 'archived',
  })
  const experiment = (
    id: string,
    prototype: string,
    title: string,
    created: string | null,
    component = 'button',
  ) => ({ id, title, prototype, systemId: SYSTEM, component, created })
  const manifest = {
    prototypes: [
      prototype('adaproto00000001', 'ada'),
      prototype('benproto00000001', 'ben'),
      prototype('oldproto00000001', 'ada', 'archived'),
    ],
    systems: [],
    defaultSystem: SYSTEM,
    contributors: [
      { id: 'ada0000000000001', key: 'ada', name: 'Ada Lovelace' },
      { id: 'ben0000000000001', key: 'ben', name: 'Ben Okafor' },
    ],
    experiments: [
      experiment(
        'vwa0000000000001',
        'adaproto00000001',
        'Rounder',
        '2026-11-10',
      ),
      experiment(
        'vwb0000000000001',
        'benproto00000001',
        'Softer',
        '2026-11-12',
      ),
      experiment(
        'vwb0000000000002',
        'benproto00000001',
        'Bolder',
        '2026-11-12',
      ),
      experiment(
        'vwo0000000000001',
        'oldproto00000001',
        'Stored',
        '2026-11-13',
      ),
      experiment(
        'vws0000000000001',
        'benproto00000001',
        'Wide',
        '2026-11-14',
        'studio-sidebar',
      ),
      experiment('vwa0000000000002', 'adaproto00000001', 'Undated', null),
    ],
  }

  test('[LAB-41] everyone’s experiments of the component, newest first, each with its author and prototype', () => {
    const list = experimentsOf(manifest, SYSTEM, 'button')
    expect(list.map(({ title, author }) => [title, author.name])).toEqual([
      ['Bolder', 'Ben Okafor'],
      ['Softer', 'Ben Okafor'],
      ['Rounder', 'Ada Lovelace'],
      ['Undated', 'Ada Lovelace'],
    ])
    expect(list[0]!.prototype.id).toBe('benproto00000001')
    expect(
      experimentsOf({ ...manifest, experiments: undefined }, SYSTEM, 'button'),
    ).toEqual([])
  })

  test('[LAB-41] each opens its Breakdown in the Lab, and as a view in its prototype', () => {
    const [first] = experimentsOf(manifest, SYSTEM, 'button')
    expect(experimentAddress(first!)).toBe(
      `/lab/${SYSTEM}/button/experiments/vwb0000000000002`,
    )
    expect(viewAddress(first!)).toBe(
      '/prototypes/benproto00000001/artifacts/vwb0000000000002',
    )
  })
})
