// A system's page addresses, the files their source opens, and the links
// between its Context and Skills documents.
import { describe, expect, test } from 'vitest'
import type { SystemCatalog } from '../../tooling/systems/catalog'
import {
  documentFile,
  documentLink,
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
  stylesheet: 'src/systems/harbor/styles/theme.css',
  libraries: [],
  tokens: [
    { name: '--color-sea', group: 'colors' },
    { name: '--radius-card', group: 'radius' },
  ],
  components: [],
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
  test('[SY-37] the theme has a page for each token group it fills, in order', () => {
    expect(themePages(harbor).map(({ id }) => id)).toEqual(['colors', 'radius'])
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
})
