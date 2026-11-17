// The Playground's seeds: the literal attributes of the component's own tag
// in its Default example (or its first), read on Node beside the examples
// splitter. Checked on the real Endless Studios examples files and on odd
// input, where nothing is seeded rather than something wrong.
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import {
  exampleSeeds,
  isComponentTag,
  literalAttributes,
} from '../../tooling/systems/example-seeds'

const COMPONENTS = 'src/systems/endless-studios/components'
const seedsOf = (slug: string) =>
  exampleSeeds(
    readFileSync(path.join(COMPONENTS, slug, `${slug}.examples.vue`), 'utf8'),
    slug,
  )

const file = (template: string) =>
  `<script setup lang="ts">\nimport { Example } from '#studio/examples'\n</script>\n\n<template>\n${template}</template>\n`

describe('the Endless Studios examples files', () => {
  test('the alert opens with its Default example’s copy and look', () => {
    expect(seedsOf('alert')).toEqual({
      color: 'info',
      variant: 'subtle',
      icon: 'i-lucide-info',
      title: 'Enrollment closes Friday',
      description:
        "Learners who join after that can still play, but won't count toward this cohort's results.",
    })
  })

  test('a wrapper around the component is skipped for the component’s own tag', () => {
    // The input sits in a UFormField; the modal in a sized div.
    expect(seedsOf('input')).toEqual({ placeholder: 'Cohort name' })
    expect(seedsOf('modal')).toEqual({
      title: 'Add your enrollment code',
      description: 'Use the code your mentor gave you to join their program.',
    })
  })

  test('bound literals are read, kebab-case names become props', () => {
    expect(seedsOf('pagination')).toMatchObject({ itemsPerPage: 10, total: 48 })
    expect(seedsOf('editor')).toMatchObject({ image: false, mention: false })
  })

  test('slot content is not an attribute, so a slot-only Default seeds nothing', () => {
    expect(seedsOf('button')).toEqual({})
    expect(seedsOf('badge')).toEqual({})
  })

  test('every examples file gives plain values without class or style', () => {
    for (const slug of readdirSync(COMPONENTS)) {
      let seeds
      try {
        seeds = seedsOf(slug)
      } catch {
        continue
      }
      for (const [name, value] of Object.entries(seeds)) {
        expect(['class', 'style', 'key']).not.toContain(name)
        expect(name).not.toMatch(/[-:@#.]/)
        expect(['string', 'number', 'boolean']).toContain(typeof value)
      }
    }
  })
})

describe('the component’s tag', () => {
  test.each([
    ['UButton', 'button'],
    ['u-button', 'button'],
    ['HarborButton', 'button'],
    ['Button', 'button'],
    ['UDropdownMenu', 'dropdown-menu'],
    ['UFormField', 'form-field'],
  ])('%s is the %s', (tag, slug) => {
    expect(isComponentTag(tag, slug)).toBe(true)
  })

  test.each([
    ['UFormField', 'input'],
    ['UDropdownMenu', 'menu'],
    ['UInput', 'input-menu'],
    ['UInputMenu', 'input'],
    ['div', 'button'],
  ])('%s is not the %s', (tag, slug) => {
    expect(isComponentTag(tag, slug)).toBe(false)
  })
})

describe('attributes', () => {
  test('text, bare booleans and bound literals are kept', () => {
    expect(
      literalAttributes(
        ` label="Save" loading :size="2" :block="true" :tone="'calm'" trailing-icon='i-lucide-x' `,
      ),
    ).toEqual({
      label: 'Save',
      loading: true,
      size: 2,
      block: true,
      tone: 'calm',
      trailingIcon: 'i-lucide-x',
    })
  })

  test('computed bindings, events, directives, class and style are left out', () => {
    expect(
      literalAttributes(
        ` :actions="[{ label: 'Go' }]" :title="name" v-model="value" @click="go" #body class="w-full" style="color: red" :class="x" key="a" v-bind:max="3" :value.prop="1" :[dynamic]="2" `,
      ),
    ).toEqual({ max: 3 })
  })

  test('character references are decoded, and the first of a repeated name wins', () => {
    expect(
      literalAttributes(
        ` title="Tom &amp; Jerry&#39;s &quot;cut&quot;" title="Again" />`,
      ),
    ).toEqual({ title: 'Tom & Jerry\'s "cut"' })
  })
})

describe('which example seeds', () => {
  test('Default wins wherever it is, else the first example', () => {
    expect(
      exampleSeeds(
        file(
          '  <Example name="Loud"><UChip tone="loud" /></Example>\n  <Example name="Default"><UChip tone="calm" /></Example>\n',
        ),
        'chip',
      ),
    ).toEqual({ tone: 'calm' })
    expect(
      exampleSeeds(
        file(
          '  <Example name="Loud"><UChip tone="loud" /></Example>\n  <Example name="Quiet"><UChip tone="calm" /></Example>\n',
        ),
        'chip',
      ),
    ).toEqual({ tone: 'loud' })
  })

  test('odd input seeds nothing rather than something wrong', () => {
    expect(exampleSeeds('', 'chip')).toEqual({})
    expect(exampleSeeds('<template><UChip tone="loud" />', 'chip')).toEqual({})
    expect(exampleSeeds(file(''), 'chip')).toEqual({})
    expect(
      exampleSeeds(
        file('  <Example name="Default"><div title="Wrapper" /></Example>\n'),
        'chip',
      ),
    ).toEqual({})
    // A tag only mentioned in a comment is not the component.
    expect(
      exampleSeeds(
        file(
          '  <Example name="Default">\n    <!-- <UChip tone="loud" /> -->\n    <UChip tone="calm" />\n  </Example>\n',
        ),
        'chip',
      ),
    ).toEqual({ tone: 'calm' })
  })

  test('a `>` inside a quoted value doesn’t end the tag', () => {
    expect(
      exampleSeeds(
        file(
          '  <Example name="Default"><UChip title="a > b" tone="loud" /></Example>\n',
        ),
        'chip',
      ),
    ).toEqual({ title: 'a > b', tone: 'loud' })
  })
})
