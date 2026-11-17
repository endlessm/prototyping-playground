// The examples splitter: each `<Example name>` block of a component's
// examples file becomes that example's own code, dedented, for the Lab's
// Variants. Checked on every real Endless Studios examples file and on odd
// input, where the whole file stands in for every example.
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { componentPages } from '../../tooling/systems/catalog'
import { exampleNames } from '../../tooling/systems/components'
import {
  exampleSnippets,
  splitExamples,
} from '../../tooling/systems/example-snippets'
import { loadSystems } from '../../tooling/systems/registry'

const COMPONENTS = 'src/systems/endless-studios/components'
const examplesFiles = readdirSync(COMPONENTS)
  .map((slug) => path.join(COMPONENTS, slug, `${slug}.examples.vue`))
  .filter((file) => {
    try {
      readFileSync(file)
      return true
    } catch {
      return false
    }
  })

const file = (template: string, script = '') =>
  `<script setup lang="ts">\nimport { Example } from '#studio/examples'\n${script}</script>\n\n<template>\n${template}</template>\n`

describe('the Endless Studios examples files', () => {
  test('there are examples files to split', () => {
    expect(examplesFiles.length).toBeGreaterThan(20)
  })

  test.each(examplesFiles)(
    '%s splits into exactly the examples the catalog lists',
    (at) => {
      const source = readFileSync(at, 'utf8')
      const split = splitExamples(source)
      expect(split).not.toBeNull()
      expect([...split!.keys()]).toEqual(exampleNames(source))
      for (const snippet of split!.values()) {
        expect(snippet).not.toContain('<Example')
        expect(snippet).not.toContain('</Example>')
        expect(snippet).not.toMatch(/^\s/)
      }
    },
  )

  test('the button’s examples are their own blocks, dedented', () => {
    const source = readFileSync(
      `${COMPONENTS}/button/button.examples.vue`,
      'utf8',
    )
    const snippets = exampleSnippets(source, exampleNames(source))
    expect(snippets.Default).toBe('<UButton>Invite Learners</UButton>')
    expect(snippets.Block).toBe(
      '<UButton block icon="i-lucide-log-in">Log In</UButton>',
    )
    expect(snippets.States).toBe(
      [
        '<UButton loading>Publishing</UButton>',
        '<UButton disabled>Publish</UButton>',
        '<UButton color="neutral" variant="outline" disabled>Cancel</UButton>',
      ].join('\n'),
    )
    expect(snippets.Contrast).toBe(
      [
        '<div class="flex gap-2 rounded-2xl bg-bg-inverted p-4 text-text-inverted">',
        '  <UButton variant="contrast" icon="i-lucide-play">Watch Trailer</UButton>',
        '  <UButton variant="contrast" icon="i-lucide-heart" square aria-label="Like" />',
        '</div>',
      ].join('\n'),
    )
  })
})

describe('odd examples files', () => {
  test('an example written on one line is its content alone', () => {
    const split = splitExamples(
      file('  <Example name="Default"><Button label="Go" /></Example>\n'),
    )
    expect(split).toEqual(new Map([['Default', '<Button label="Go" />']]))
  })

  test('content that starts on the opening tag’s line keeps the rest’s indentation', () => {
    const split = splitExamples(
      file(
        '  <Example name="Pair"><A />\n    <B>\n      text\n    </B>\n  </Example>\n',
      ),
    )
    expect(split?.get('Pair')).toBe('<A />\n<B>\n  text\n</B>')
  })

  test('slots, nested templates and comments inside a block stay in it', () => {
    const split = splitExamples(
      file(
        [
          '  <Example name="Card">',
          '    <!-- The header slot. -->',
          '    <UCard>',
          '      <template #header>Title</template>',
          '    </UCard>',
          '  </Example>',
          '',
        ].join('\n'),
      ),
    )
    expect(split?.get('Card')).toBe(
      [
        '<!-- The header slot. -->',
        '<UCard>',
        '  <template #header>Title</template>',
        '</UCard>',
      ].join('\n'),
    )
  })

  test('an Example in a comment, the script or a string is not a block', () => {
    const source = [
      '<!-- <Example name="Ghost"> is how to write one. -->',
      file(
        '  <!-- <Example name="Hidden"><X /></Example> -->\n  <Example name="Real"><Y /></Example>\n',
        'const note = \'<Example name="InScript"></Example>\'\n',
      ),
    ].join('\n')
    expect([...splitExamples(source)!.keys()]).toEqual(['Real'])
  })

  test('an attribute holding > and single quotes is read whole', () => {
    const split = splitExamples(
      file(
        `  <Example name='Arrow' data-note="a > b"><Z label="x > y" /></Example>\n`,
      ),
    )
    expect(split?.get('Arrow')).toBe('<Z label="x > y" />')
  })

  test('an Example nested in another belongs to the outer one', () => {
    const split = splitExamples(
      file(
        '  <Example name="Outer">\n    <Example name="Inner"><A /></Example>\n  </Example>\n',
      ),
    )
    expect([...split!.keys()]).toEqual(['Outer'])
    expect(split?.get('Outer')).toBe('<Example name="Inner"><A /></Example>')
  })

  test('a self-closing example is empty', () => {
    expect(
      splitExamples(file('  <Example name="Nothing" />\n'))?.get('Nothing'),
    ).toBe('')
  })

  test('Windows line endings and tabs are dedented the same way', () => {
    const split = splitExamples(
      file(
        '\t<Example name="Tabs">\r\n\t\t<A />\r\n\t\t<B />\r\n\t</Example>\r\n',
      ),
    )
    expect(split?.get('Tabs')).toBe('<A />\n<B />')
  })

  test.each([
    ['no template', '<script setup lang="ts"></script>\n'],
    ['an unclosed block', file('  <Example name="Open"><A />\n')],
    ['a stray closing tag', file('  <A /></Example>\n')],
    ['a block without a name', file('  <Example><A /></Example>\n')],
    [
      'a name used twice',
      file(
        '  <Example name="Twice"><A /></Example>\n  <Example name="Twice"><B /></Example>\n',
      ),
    ],
    ['an unclosed comment', file('  <!-- <Example name="A"><A /></Example>\n')],
    [
      'an unclosed template',
      '<template>\n  <Example name="A"><A /></Example>\n',
    ],
  ])('a file with %s can’t be split', (_, source) => {
    expect(splitExamples(source)).toBeNull()
  })

  test('a file that can’t be split gives the whole file under every example', () => {
    const source = file('  <Example name="Open"><A />\n')
    expect(exampleSnippets(source, ['Open', 'Other'])).toEqual({
      Open: source.trimEnd(),
      Other: source.trimEnd(),
    })
  })

  test('a split that doesn’t match the catalog’s examples gives the whole file', () => {
    const source = file('  <Example name="One"><A /></Example>\n')
    expect(exampleSnippets(source, ['One', 'Two'])).toEqual({
      One: source.trimEnd(),
      Two: source.trimEnd(),
    })
    expect(exampleSnippets(source, ['One'])).toEqual({ One: '<A />' })
  })

  test('the whole file given in place of a block has Unix line endings too', () => {
    const source = file('  <Example name="Open"><A />\r\n  <B />\r\n')
    const { Open } = exampleSnippets(source, ['Open'])
    expect(Open).not.toContain('\r')
    expect(Open).toBe(source.replace(/\r\n/g, '\n').trimEnd())
  })
})

describe('the component page data', () => {
  test('carries each example’s own code, or the whole file under every example when it can’t be split', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'studio-snippets-'))
    const write = (file: string, text: string) => {
      mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
      writeFileSync(path.join(dir, file), text)
    }
    try {
      write(
        'src/systems/harbor/system.ts',
        `export default ${JSON.stringify({
          label: 'Harbor',
          status: 'active',
          role: 'prototype',
          styling: 'tailwind',
          colorModes: ['light'],
          docs: 'off',
          libraries: [],
          origin: null,
          studioId: 'hrbr000000000001',
          app: { factory: { from: 'app.ts', name: 'createApp' } },
        })}\n`,
      )
      const good = file(
        '  <Example name="Default"><Button label="Go" /></Example>\n  <Example name="Pair">\n    <Button label="Yes" />\n    <Button label="No" />\n  </Example>\n',
      )
      const stray = file(
        '  <Example name="Only"><Button label="Go" /></Example>\n  </Example>\n',
      )
      write('src/systems/harbor/components/button/button.examples.vue', good)
      write('src/systems/harbor/components/card/card.examples.vue', stray)
      write('src/systems/harbor/components/badge/badge.md', '# Badge\n')
      const { systems, problems } = await loadSystems(dir, {
        systems: ['harbor'],
      })
      expect(problems).toEqual([])
      const pages = await componentPages(systems)
      expect(pages['hrbr000000000001/button']?.snippets).toEqual({
        Default: '<Button label="Go" />',
        Pair: '<Button label="Yes" />\n<Button label="No" />',
      })
      expect(pages['hrbr000000000001/button']?.examples).toBe(good)
      expect(pages['hrbr000000000001/card']?.snippets).toEqual({
        Only: stray.trimEnd(),
      })
      expect(pages['hrbr000000000001/badge']?.snippets).toEqual({})
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
