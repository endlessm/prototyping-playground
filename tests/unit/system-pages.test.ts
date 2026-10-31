// A system's page addresses, the files their source opens, and the links
// between its Context and Skills documents.
import { describe, expect, test } from 'vitest'
import type { SystemCatalog } from '../../tooling/systems/catalog'
import {
  documentFile,
  documentLink,
  homeSystems,
  inSystemOrder,
  sourceFile,
  themePages,
} from '../../src/modules/systems/utils/pages'

const harbor: SystemCatalog = {
  id: 'hrbr000000000001',
  key: 'harbor',
  label: 'Harbor',
  status: 'active',
  folder: 'src/systems/harbor',
  colorModes: ['light'],
  summary: null,
  guidance: null,
  code: null,
  renameReview: [],
  setupRecorded: false,
  icons: null,
  stylesheet: 'src/systems/harbor/styles/theme.css',
  libraries: [],
  tokens: [
    {
      name: '--color-sea',
      value: '1',
      group: 'colors',
      section: null,
      ramp: null,
      palette: false,
      utility: null,
      dark: false,
    },
    {
      name: '--radius-card',
      value: '1',
      group: 'radius',
      section: null,
      ramp: null,
      palette: false,
      utility: null,
      dark: false,
    },
  ],
  components: [],
  overview: null,
  assets: [],
  context: [
    {
      path: 'voice.md',
      title: 'Voice',
      file: 'src/systems/harbor/context/voice.md',
    },
    {
      path: 'flows/sign-in.md',
      title: 'Signing in',
      file: 'src/systems/harbor/context/flows/sign-in.md',
    },
  ],
  contextFolders: ['flows'],
  skills: [
    {
      name: 'build-flow',
      title: 'Build flow',
      description: '',
      file: 'src/systems/harbor/skills/build-flow/SKILL.md',
      files: [
        'SKILL.md',
        'references/steps.md',
        'logo.png',
        'scripts/check.mjs',
      ],
    },
  ],
}

describe('a system’s pages', () => {
  test('[SY-37] [SY-89] the theme has a page for each token group it fills, in order, and always Typography', () => {
    expect(themePages(harbor).map(({ id }) => id)).toEqual([
      'colors',
      'typography',
      'radius',
    ])
    expect(themePages({ ...harbor, stylesheet: null, tokens: [] })).toEqual([])
  })

  test('[SY-115] the Overview and Icons open the declaration; theme pages the stylesheet; documents themselves', () => {
    expect(sourceFile(harbor, '')).toBe('system.ts')
    expect(sourceFile(harbor, 'icons')).toBe('system.ts')
    expect(sourceFile(harbor, 'colors')).toBe('styles/theme.css')
    expect(sourceFile(harbor, 'context/flows/sign-in')).toBe(
      'context/flows/sign-in.md',
    )
    expect(sourceFile(harbor, 'skills/build-flow/SKILL')).toBe(
      'skills/build-flow/SKILL.md',
    )
    expect(sourceFile(harbor, 'libraries')).toBeNull()
    expect(sourceFile(harbor, 'context/missing')).toBeNull()
    expect(sourceFile({ ...harbor, stylesheet: null }, 'colors')).toBeNull()
  })

  test('[SY-121] [SY-122] Context and Skills addresses name their documents, without the extension', () => {
    expect(documentFile(harbor, 'context', 'voice')).toBe(
      'src/systems/harbor/context/voice.md',
    )
    expect(documentFile(harbor, 'skills', 'build-flow/SKILL')).toBe(
      'src/systems/harbor/skills/build-flow/SKILL.md',
    )
    expect(documentFile(harbor, 'skills', 'build-flow/references/steps')).toBe(
      'src/systems/harbor/skills/build-flow/references/steps.md',
    )
    expect(documentFile(harbor, 'skills', 'other/SKILL')).toBeUndefined()
  })

  test('[SY-122] relative links between documents open in the studio; others stay as written', () => {
    const skill = 'src/systems/harbor/skills/build-flow/SKILL.md'
    expect(documentLink(harbor, skill, 'references/steps.md')).toBe(
      '/systems/hrbr000000000001/skills/build-flow/references/steps',
    )
    expect(documentLink(harbor, skill, '../../context/voice.md#tone')).toBe(
      '/systems/hrbr000000000001/context/voice#tone',
    )
    expect(documentLink(harbor, skill, 'missing.md')).toBeUndefined()
    expect(
      documentLink(harbor, skill, 'https://example.com/a.md'),
    ).toBeUndefined()
    expect(documentLink(harbor, skill, 'logo.png')).toBeUndefined()
  })

  test('[PR-124] a skill’s other text files open at their path, extension included; binary files don’t', () => {
    expect(documentFile(harbor, 'skills', 'build-flow/scripts/check.mjs')).toBe(
      'src/systems/harbor/skills/build-flow/scripts/check.mjs',
    )
    expect(
      documentFile(harbor, 'skills', 'build-flow/logo.png'),
    ).toBeUndefined()
    expect(sourceFile(harbor, 'skills/build-flow/scripts/check.mjs')).toBe(
      'skills/build-flow/scripts/check.mjs',
    )
    const skill = 'src/systems/harbor/skills/build-flow/SKILL.md'
    expect(documentLink(harbor, skill, './scripts/check.mjs')).toBe(
      '/systems/hrbr000000000001/skills/build-flow/scripts/check.mjs',
    )
    expect(documentLink(harbor, skill, 'scripts/missing.mjs')).toBeUndefined()
  })

  test('[SY-12] the default system comes first, then the others by name', () => {
    const systems = [
      { id: 'b', label: 'Beacon' },
      { id: 'z', label: 'Zephyr' },
      { id: 'a', label: 'Anchor' },
    ]
    expect(inSystemOrder(systems, 'z').map(({ label }) => label)).toEqual([
      'Zephyr',
      'Anchor',
      'Beacon',
    ])
    expect(inSystemOrder(systems, null).map(({ label }) => label)).toEqual([
      'Anchor',
      'Beacon',
      'Zephyr',
    ])
  })

  test('[SY-04] Home shows up to three active systems, the default first', () => {
    const systems = [
      { id: 'a', label: 'Anchor', status: 'active' as const },
      { id: 'b', label: 'Beacon', status: 'archived' as const },
      { id: 'c', label: 'Cove', status: 'active' as const },
      { id: 'd', label: 'Dock', status: 'active' as const },
      { id: 'e', label: 'Eddy', status: 'active' as const },
    ]
    expect(homeSystems(systems, 'e').map(({ label }) => label)).toEqual([
      'Eddy',
      'Anchor',
      'Cove',
    ])
  })
})
