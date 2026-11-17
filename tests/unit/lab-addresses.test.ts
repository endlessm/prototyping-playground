import { describe, expect, test } from 'vitest'
import type { SystemCatalog } from '../../tooling/systems/catalog'
import {
  LAB_TABS,
  labAddress,
  labLanding,
  labSystems,
  matchingComponents,
  tabAt,
} from '../../src/modules/lab/utils/lab'

const component = (slug: string, title: string) =>
  ({ slug, title, name: title }) as SystemCatalog['components'][number]
const system = (
  id: string,
  label: string,
  status: 'active' | 'archived',
  slugs: string[],
) =>
  ({
    id,
    label,
    status,
    components: slugs.map((slug) =>
      component(slug, slug[0]!.toUpperCase() + slug.slice(1)),
    ),
  }) as SystemCatalog

const harbor = system('hrbr', 'Harbor', 'active', ['button', 'card'])
const lantern = system('ltrn', 'Lantern', 'active', ['lamp'])
const empty = system('mpty', 'Empty', 'active', [])
const attic = system('attc', 'Attic', 'archived', ['chest'])

describe('the systems the Lab offers', () => {
  test('are the active ones with components, the default first, then by name', () => {
    expect(
      labSystems([lantern, empty, attic, harbor], 'ltrn').map(({ id }) => id),
    ).toEqual(['ltrn', 'hrbr'])
    expect(
      labSystems([lantern, empty, attic, harbor], null).map(({ id }) => id),
    ).toEqual(['hrbr', 'ltrn'])
  })

  test('/lab lands on the default system’s first component', () => {
    expect(labLanding([lantern, harbor], 'hrbr')).toBe('/lab/hrbr/button')
  })

  test('/lab lands on the first offered system when the default has no components', () => {
    expect(labLanding([lantern, empty], 'mpty')).toBe('/lab/ltrn/lamp')
  })

  test('/lab has nowhere to land without components', () => {
    expect(labLanding([empty, attic], 'mpty')).toBeNull()
  })
})

describe('Lab addresses and tabs', () => {
  test('a tab-less component address is Overview', () => {
    expect(labAddress('hrbr', 'button')).toBe('/lab/hrbr/button')
    expect(tabAt('/lab/hrbr/button', 'hrbr', 'button')?.id).toBe('overview')
    expect(tabAt('/lab/hrbr/button/', 'hrbr', 'button')?.id).toBe('overview')
  })

  test('each tab has its own address', () => {
    for (const tab of LAB_TABS) {
      const address = labAddress('hrbr', 'button', tab.path)
      expect(tabAt(address, 'hrbr', 'button')).toBe(tab)
    }
    expect(labAddress('hrbr', 'button', 'variants')).toBe(
      '/lab/hrbr/button/variants',
    )
  })

  test('an address under the component naming no tab has none', () => {
    expect(tabAt('/lab/hrbr/button/nope', 'hrbr', 'button')).toBeUndefined()
  })

  test('the tabs read Overview, Variants, Playground', () => {
    expect(LAB_TABS.map(({ id }) => id)).toEqual([
      'overview',
      'variants',
      'playground',
    ])
  })
})

describe('the component search', () => {
  test('matches titles and addresses, ignoring case and spaces around', () => {
    const list = [
      component('button', 'Button'),
      component('icon-button', 'IconButton'),
    ]
    expect(matchingComponents(list, '  ICON ').map(({ slug }) => slug)).toEqual(
      ['icon-button'],
    )
    expect(matchingComponents(list, 'icon-b').map(({ slug }) => slug)).toEqual([
      'icon-button',
    ])
    expect(matchingComponents(list, '')).toEqual(list)
    expect(matchingComponents(list, 'zzz')).toEqual([])
  })

  test('matches descriptions too, listing title and address matches first', () => {
    const list = [
      { ...component('banner', 'Banner'), description: 'A dialog-like strip.' },
      {
        ...component('modal', 'Modal'),
        description: 'A dialog over the page.',
      },
      { ...component('dialog', 'Dialog'), description: null },
      { ...component('card', 'Card'), description: 'Holds one thing.' },
    ]
    expect(matchingComponents(list, 'dialog').map(({ slug }) => slug)).toEqual([
      'dialog',
      'banner',
      'modal',
    ])
  })
})
