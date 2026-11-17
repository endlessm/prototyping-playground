// Saving the dial panel's props: each changed prop is written on its tag in
// the experiment's file as a static attribute (text in quotes, `true` bare,
// numbers and `false` as literal bindings), replacing the attribute or
// literal binding already there in the same spelling, or added after the
// tag's last attribute, on a line of its own when the tag spans lines. A
// prop set back to its default loses its attribute. A prop bound to an
// expression, or on a tag the file doesn't hold, is left unsaved. Each
// instance's attributes are read the same way for the panel's starts.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, test } from 'vitest'
import {
  writePropChanges,
  type PropChange,
} from '../../src/modules/lab/experiments/writer'
import { componentInstances } from '../../src/modules/lab/experiments/instances'
import { fileTags, nuxtUiCatalog } from '../../tooling/systems/breakdown'
import {
  loadSystems,
  type InstalledSystem,
} from '../../tooling/systems/registry'

const ROOT = path.resolve(import.meta.dirname, '../..')
const FILE = path.join(ROOT, 'src/prototypes/ben/alert-experiments/View.vue')
let endless: InstalledSystem

beforeAll(async () => {
  const config = JSON.parse(
    readFileSync(path.join(ROOT, 'studio.config.json'), 'utf8'),
  )
  const { systems } = await loadSystems(ROOT, config)
  endless = systems.find(({ key }) => key === 'endless-studios')!
})

function tagsOf(source: string) {
  const found = fileTags(source, FILE, {
    system: endless,
    nuxtUi: nuxtUiCatalog(endless, ROOT),
    follow: () => false,
  })
  if (!found.tags) throw new Error(found.problem)
  return found.tags
}
function write(template: string, changes: PropChange[]) {
  const source = `<template>\n${template}\n</template>\n`
  const result = writePropChanges(source, changes, { tags: tagsOf(source) })
  return {
    ...result,
    template: result.source
      .slice('<template>\n'.length)
      .replace(/\n<\/template>\n$/, ''),
  }
}
const set = (
  prop: string,
  value: PropChange['value'],
  node = 'root>UAlert',
): PropChange => ({ node, prop, value })

describe('writing a prop', () => {
  test('text replaces the static attribute, in quotes, escaped', () => {
    expect(
      write('  <UAlert title="Old" color="info" />', [
        set('title', 'Say "hi" & go'),
      ]).template,
    ).toBe('  <UAlert title="Say &quot;hi&quot; &amp; go" color="info" />')
  })

  test('a new prop goes after the last attribute, kebab-cased', () => {
    expect(
      write('  <UAlert title="Hi">x</UAlert>', [
        set('variant', 'soft'),
        set('close', true),
      ]).template,
    ).toBe('  <UAlert title="Hi" variant="soft" close>x</UAlert>')
    expect(
      write('  <UAlert />', [set('orientation', 'horizontal')]).template,
    ).toBe('  <UAlert orientation="horizontal" />')
  })

  test('on a tag spanning lines, a new prop takes a line of its own', () => {
    expect(
      write('  <UAlert\n    title="Hi"\n    color="info"\n  />', [
        set('variant', 'soft'),
      ]).template,
    ).toBe(
      '  <UAlert\n    title="Hi"\n    color="info"\n    variant="soft"\n  />',
    )
  })

  test('numbers and false are literal bindings; a literal binding is replaced', () => {
    expect(
      write('  <UAlert :close="true" />', [set('close', false)]).template,
    ).toBe('  <UAlert :close="false" />')
    expect(write('  <UAlert close />', [set('close', true)]).template).toBe(
      '  <UAlert close />',
    )
  })

  test('back to its default, the attribute goes', () => {
    expect(
      write('  <UAlert\n    title="Hi"\n    color="info"\n  />', [
        set('color', null),
      ]).template,
    ).toBe('  <UAlert\n    title="Hi"\n  />')
  })

  test('a bound expression, or a tag the file doesn’t hold, is left unsaved', () => {
    const result = write('  <UAlert :title="heading" />', [
      set('title', 'Hi'),
      set('title', 'Hi', 'root>UButton'),
      set('color', 'info'),
    ])
    expect(result.template).toBe('  <UAlert :title="heading" color="info" />')
    expect(result.skipped).toEqual([
      set('title', 'Hi'),
      set('title', 'Hi', 'root>UButton'),
    ])
    expect(result.written).toEqual([set('color', 'info')])
  })
})

describe('an experiment’s instances of its component', () => {
  test('each tag that is the component, with its attributes as written', () => {
    const source = `<template>
  <div>
    <UAlert title="Hi" close :description="text" variant='soft' :icon="'i-lucide-info'" />
    <UButton label="Not an alert" />
    <UAlert v-model:open="open" />
  </div>
</template>
`
    expect(componentInstances(tagsOf(source), 'alert')).toEqual([
      {
        node: 'root>UAlert',
        name: 'UAlert',
        attributes: {
          title: { value: 'Hi' },
          close: { value: true },
          description: { code: 'text' },
          variant: { value: 'soft' },
          icon: { value: 'i-lucide-info' },
        },
      },
      {
        node: 'root>UAlert~2',
        name: 'UAlert',
        attributes: { open: { code: 'open' } },
      },
    ])
  })
})
