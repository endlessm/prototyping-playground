// The Systems navigation's Context and Skills trees, from the catalog: the
// files and folders (what the deployed site shows), the rows that open a
// page, and where the open page goes when its file is renamed or moved.
import { describe, expect, test } from 'vitest'
import type { SystemCatalog } from '../../tooling/systems/catalog'
import {
  catalogNodes,
  followed,
  treeEntries,
  withoutSkillFiles,
} from '../../src/modules/systems/utils/trees'

const system = {
  id: 'hrbr000000000001',
  folder: 'src/systems/harbor',
  context: [
    {
      path: 'flows/sign-in.md',
      title: 'Signing in',
      file: 'src/systems/harbor/context/flows/sign-in.md',
    },
    {
      path: 'voice.md',
      title: 'Voice and tone',
      file: 'src/systems/harbor/context/voice.md',
    },
  ],
  contextFolders: ['empty', 'flows'],
  skills: [
    {
      name: 'build-flow',
      title: 'Build flow',
      description: 'Builds a flow.',
      file: 'src/systems/harbor/skills/build-flow/SKILL.md',
      files: [
        'SKILL.md',
        'references/steps.md',
        'scripts/check.mjs',
        'logo.png',
      ],
    },
  ],
} as unknown as SystemCatalog

describe('[SH-93] [SY-124] the Context tree', () => {
  test('has the documents and folders, empty ones too, files first', () => {
    expect(catalogNodes(system, 'context')).toEqual([
      { name: 'voice.md', path: 'voice.md', dir: false },
      { name: 'empty', path: 'empty', dir: true, children: [] },
      {
        name: 'flows',
        path: 'flows',
        dir: true,
        children: [
          { name: 'sign-in.md', path: 'flows/sign-in.md', dir: false },
        ],
      },
    ])
  })

  test('its documents open their pages, by title', () => {
    expect(treeEntries(system, 'context').get('flows/sign-in.md')).toEqual({
      id: '/systems/hrbr000000000001/context/flows/sign-in',
      title: 'Signing in',
      to: '/systems/hrbr000000000001/context/flows/sign-in',
      icon: 'i-lucide-file-text',
    })
  })
})

describe('[SY-126] the Skills tree', () => {
  test('each skill is its folder, standing for its SKILL.md', () => {
    const [skill] = catalogNodes(system, 'skills')
    expect(skill!.path).toBe('build-flow')
    expect(skill!.children!.map((node) => node.path)).toEqual([
      'build-flow/logo.png',
      'build-flow/references',
      'build-flow/scripts',
    ])
    expect(treeEntries(system, 'skills').get('build-flow')?.to).toBe(
      '/systems/hrbr000000000001/skills/build-flow/SKILL',
    )
  })

  test('a skill’s documents and text files open; binary files don’t', () => {
    const entries = treeEntries(system, 'skills')
    expect(entries.get('build-flow/references/steps.md')?.to).toBe(
      '/systems/hrbr000000000001/skills/build-flow/references/steps',
    )
    expect(entries.get('build-flow/scripts/check.mjs')?.to).toBe(
      '/systems/hrbr000000000001/skills/build-flow/scripts/check.mjs',
    )
    expect(entries.has('build-flow/logo.png')).toBe(false)
  })

  test('a live listing drops each skill’s own SKILL.md, not deeper ones', () => {
    expect(
      withoutSkillFiles([
        {
          name: 'review',
          path: 'review',
          dir: true,
          children: [
            { name: 'SKILL.md', path: 'review/SKILL.md', dir: false },
            {
              name: 'notes',
              path: 'review/notes',
              dir: true,
              children: [
                { name: 'SKILL.md', path: 'review/notes/SKILL.md', dir: false },
              ],
            },
          ],
        },
      ])[0]!.children!.map((node) => node.path),
    ).toEqual(['review/notes'])
  })
})

describe('[SY-124] the open page follows a rename or move', () => {
  const page = '/systems/hrbr000000000001/context/flows/sign-in'
  test('of its document', () => {
    expect(
      followed(page, system, 'context', {
        from: 'flows/sign-in.md',
        to: 'sign-in.md',
        dir: false,
      }),
    ).toBe('/systems/hrbr000000000001/context/sign-in')
    expect(
      followed(page, system, 'context', {
        from: 'voice.md',
        to: 'tone.md',
        dir: false,
      }),
    ).toBeNull()
  })

  test('of a folder it is in, a skill’s too', () => {
    expect(
      followed(page, system, 'context', {
        from: 'flows',
        to: 'journeys',
        dir: true,
      }),
    ).toBe('/systems/hrbr000000000001/context/journeys/sign-in')
    expect(
      followed(
        '/systems/hrbr000000000001/skills/build-flow/SKILL',
        system,
        'skills',
        { from: 'build-flow', to: 'build', dir: true },
      ),
    ).toBe('/systems/hrbr000000000001/skills/build/SKILL')
  })
})
