// The Breakdown canvas's arithmetic: the tree laid out top-down with each
// parent centred over its children and no two cards overlapping, and the
// zoom steps of the toolbar's − and +.
import { describe, expect, test } from 'vitest'
import {
  layoutTree,
  zoomStep,
  type LaidOutCard,
} from '../../src/modules/lab/utils/breakdown'
import type { BreakdownNode } from '../../tooling/systems/breakdown'

const node = (id: string, children: BreakdownNode[] = []): BreakdownNode => ({
  id,
  name: id,
  kind: 'component',
  source: 'nuxt-ui',
  file: null,
  library: null,
  repeated: false,
  children,
})
const size = () => ({ width: 100, height: 50 })
const overlaps = (a: LaidOutCard, b: LaidOutCard) =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height

describe('the tree’s layout', () => {
  const tree = node('root', [
    node('a', [node('a1'), node('a2'), node('a3')]),
    node('b'),
    node('c', [node('c1')]),
  ])
  const layout = layoutTree(tree, size)
  const at = (id: string) => layout.cards.find((card) => card.node.id === id)!

  test('reads top-down: each level sits below its parent', () => {
    expect(at('a').y).toBeGreaterThan(at('root').y + 50)
    expect(at('a1').y).toBeGreaterThan(at('a').y + 50)
    expect(at('a').y).toBe(at('b').y)
  })

  test('a parent is centred over its children, siblings keep their order', () => {
    const centre = (id: string) => at(id).x + at(id).width / 2
    expect(centre('a')).toBeCloseTo((centre('a1') + centre('a3')) / 2)
    expect(centre('c')).toBeCloseTo(centre('c1'))
    expect(at('a').x).toBeLessThan(at('b').x)
    expect(at('b').x).toBeLessThan(at('c').x)
  })

  test('no two cards overlap, and the canvas holds them all', () => {
    for (const first of layout.cards)
      for (const second of layout.cards)
        if (first !== second) expect(overlaps(first, second)).toBe(false)
    for (const card of layout.cards) {
      expect(card.x).toBeGreaterThanOrEqual(0)
      expect(card.x + card.width).toBeLessThanOrEqual(layout.width)
      expect(card.y + card.height).toBeLessThanOrEqual(layout.height)
    }
  })

  test('each child has one edge from its parent', () => {
    expect(layout.edges.map(({ from, id }) => `${from.node.id}→${id}`)).toEqual(
      ['root→a', 'a→a1', 'a→a2', 'a→a3', 'root→b', 'root→c', 'c→c1'],
    )
  })

  test('a taller card pushes down only what is under it', () => {
    const tall = layoutTree(tree, (piece) =>
      piece.id === 'a' ? { width: 100, height: 300 } : size(),
    )
    const card = (id: string) => tall.cards.find((c) => c.node.id === id)!
    expect(card('a1').y).toBeGreaterThan(card('a').y + 300)
    expect(card('c1').y).toBeLessThan(card('a').y + 300)
    expect(card('b').y).toBe(card('a').y)
  })
})

describe('theme slots', () => {
  const slot = (id: string): BreakdownNode => ({
    ...node(id),
    kind: 'slot',
    slot: id,
  })
  const tree = node('root', [
    node('UButton', [
      slot('base'),
      slot('label'),
      slot('leadingIcon'),
      slot('trailingIcon'),
    ]),
  ])
  const layout = layoutTree(tree, size)
  const at = (id: string) => layout.cards.find((card) => card.node.id === id)!

  test('sit in a grid of up to three columns under their piece, behind one edge', () => {
    expect(at('base').y).toBe(at('label').y)
    expect(at('leadingIcon').y).toBe(at('base').y)
    expect(at('trailingIcon').y).toBeGreaterThan(at('base').y + 50)
    expect(at('trailingIcon').x).toBe(at('base').x)
    expect(layout.edges.map(({ from, id }) => `${from.node.id}→${id}`)).toEqual(
      ['root→UButton', 'UButton→UButton#slots'],
    )
    const [group] = layout.groups
    expect(group!.parent.node.id).toBe('UButton')
    for (const id of ['base', 'label', 'leadingIcon', 'trailingIcon']) {
      const card = at(id)
      expect(card.x).toBeGreaterThanOrEqual(group!.x)
      expect(card.x + card.width).toBeLessThanOrEqual(group!.x + group!.width)
      expect(card.y + card.height).toBeLessThanOrEqual(group!.y + group!.height)
    }
    for (const first of layout.cards)
      for (const second of layout.cards)
        if (first !== second) expect(overlaps(first, second)).toBe(false)
  })
})

describe('zoom steps', () => {
  test('in and out move along fixed steps, from any zoom', () => {
    expect(zoomStep(1, 1)).toBe(1.25)
    expect(zoomStep(1, -1)).toBe(0.75)
    expect(zoomStep(0.8, 1)).toBe(1)
    expect(zoomStep(0.8, -1)).toBe(0.75)
    expect(zoomStep(4, 1)).toBe(4)
    expect(zoomStep(0.1, -1)).toBe(0.1)
  })
})
