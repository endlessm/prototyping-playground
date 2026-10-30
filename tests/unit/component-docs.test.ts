// A system's component documentation, worked out from its file names and
// text: which files make each component, its examples in file order, and what
// its page is missing.
import { describe, expect, test } from 'vitest'
import {
  componentProblems,
  discoverComponents,
  docsWarning,
  exampleNames,
  exampleTitle,
} from '../../tooling/systems/components'
import { isResourceId } from '../../tooling/identity/resource-id'
import { exampleId } from '../../tooling/systems/preview-ids'

describe('component discovery', () => {
  test('[SY-102] finds folder-per-component and flat components, and skips helpers', () => {
    expect(
      discoverComponents([
        'button/button.vue',
        'button/button.md',
        'button/button.examples.vue',
        'button/index.ts',
        'IconButton.vue',
        'IconButton.md',
        'card/card.md',
        'README.md',
        '_private.vue',
        'button/button.test.ts',
      ]),
    ).toEqual([
      {
        name: 'button',
        slug: 'button',
        files: {
          source: 'button/button.vue',
          examples: 'button/button.examples.vue',
          doc: 'button/button.md',
        },
      },
      {
        name: 'card',
        slug: 'card',
        files: { source: null, examples: null, doc: 'card/card.md' },
      },
      {
        name: 'IconButton',
        slug: 'icon-button',
        files: {
          source: 'IconButton.vue',
          examples: null,
          doc: 'IconButton.md',
        },
      },
    ])
  })
})

describe('examples', () => {
  test('[SY-105] each <Example name> is one example, in the order the file has them', () => {
    const source = `<script setup lang="ts">
import { Example } from '#studio/examples'
</script>

<template>
  <!-- <Example name="Commented">x</Example> -->
  <Example name="Default"><UButton>Invite</UButton></Example>
  <Example
    class="x"
    name='WithIcon'
  >
    <UButton icon="i-lucide-plus" />
  </Example>
</template>
`
    expect(exampleNames(source)).toEqual(['Default', 'WithIcon'])
  })

  test('[SY-105] examples are titled in sentence case', () => {
    expect(exampleTitle('WithIcon')).toBe('With icon')
    expect(exampleTitle('CommonPairs')).toBe('Common pairs')
    expect(exampleTitle('Default')).toBe('Default')
    expect(exampleTitle('HTMLInput')).toBe('HTMLInput')
  })

  test('an example has a permanent-looking ID of its own, the same every time', () => {
    const id = exampleId('8x5spen6xtvp96a9', 'button', 'Default')
    expect(isResourceId(id)).toBe(true)
    expect(exampleId('8x5spen6xtvp96a9', 'button', 'Default')).toBe(id)
    expect(exampleId('8x5spen6xtvp96a9', 'button', 'Sizes')).not.toBe(id)
  })
})

describe('documentation gaps', () => {
  const button = discoverComponents(['button/button.vue'])[0]!
  const complete = discoverComponents([
    'button/button.vue',
    'button/button.md',
    'button/button.examples.vue',
  ])[0]!

  test('[SY-113] a component with neither page nor examples gets one sentence', () => {
    expect(componentProblems(button, { doc: null, examples: null })).toEqual([
      'has no examples or page yet. Add button.examples.vue and button.md',
    ])
  })

  test('[SY-104] the page needs a title, a description and a "When to use" section', () => {
    expect(
      componentProblems(complete, {
        doc: '---\ntitle: Button\n---\n\n## Usage\n\n```md\n## When to use\n```\n',
        examples: '<template><Example name="Default">x</Example></template>',
      }),
    ).toEqual([
      'button.md needs a "description" in its frontmatter',
      'button.md needs a "When to use" section (a ## heading)',
    ])
    expect(
      componentProblems(complete, {
        doc: '---\ntitle: Button\ndescription: Starts an action.\n---\n\n## When to use\n',
        examples: '<template></template>',
      }),
    ).toEqual([
      'button.examples.vue has no examples: wrap each one in <Example name="…">',
    ])
  })

  test('[CL-106] gaps are one warning per system, listing the first five', () => {
    const problems = Array.from({ length: 7 }, (_, index) => ({
      file: `src/systems/harbor/components/c${index}/c${index}.vue`,
      message: `has no examples or page yet`,
    }))
    const warning = docsWarning('Harbor', problems)
    expect(warning).toContain('Harbor has 7 component documentation gaps')
    expect(warning).toContain('c4/c4.vue has no examples or page yet')
    expect(warning).not.toContain('c5/c5.vue')
    expect(warning).toContain('and 2 more')
    expect(docsWarning('Harbor', [])).toBeNull()
  })
})
