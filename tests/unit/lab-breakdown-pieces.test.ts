// A Breakdown card's live piece: which box of the rendered component the
// card clips to (a piece's own elements, a theme slot's element, the first
// item of a list) and how that box sits in the card's inset, centred and
// never enlarged.
import { describe, expect, test } from 'vitest'
import {
  fitPiece,
  onePerItem,
  pieceBox,
} from '../../src/modules/lab/utils/pieces'
import type { NodeBoxes } from '../../tooling/preview/protocol'
import type { BreakdownNode } from '../../tooling/systems/breakdown'

const node = (
  id: string,
  extra: Partial<BreakdownNode> = {},
  children: BreakdownNode[] = [],
): BreakdownNode => ({
  id,
  name: id,
  kind: 'component',
  source: 'nuxt-ui',
  file: null,
  library: null,
  repeated: false,
  children,
  ...extra,
})
const at = (x: number, y: number, width: number, height: number) => ({
  x,
  y,
  width,
  height,
})

describe('the box a card clips to', () => {
  const none = new Set<string>()
  const nodes: Record<string, NodeBoxes> = {
    root: { boxes: [at(0, 0, 300, 80)], slots: {} },
    'root>UButton': {
      boxes: [at(100, 20, 90, 32)],
      slots: {
        base: [at(100, 20, 90, 32)],
        label: [at(112, 28, 40, 16)],
      },
    },
    'root>UCard': { boxes: [at(0, 0, 50, 20), at(0, 30, 70, 20)], slots: {} },
    'root>UNavigationMenu/UButton': {
      boxes: [at(10, 10, 60, 24), at(10, 40, 60, 24)],
      slots: { label: [at(20, 14, 30, 16), at(20, 44, 30, 16)] },
    },
  }

  test('a piece clips to its own element', () => {
    expect(pieceBox(nodes, node('root>UButton'), none)).toEqual(
      at(100, 20, 90, 32),
    )
  })

  test('a theme slot clips to that slot’s element inside its piece', () => {
    expect(
      pieceBox(
        nodes,
        node('root>UButton#label', { kind: 'slot', slot: 'label' }),
        none,
      ),
    ).toEqual(at(112, 28, 40, 16))
  })

  test('a piece of several elements clips around all of them', () => {
    expect(pieceBox(nodes, node('root>UCard'), none)).toEqual(at(0, 0, 70, 50))
  })

  test('a piece drawn once per item clips to the first item', () => {
    const items = new Set([
      'root>UNavigationMenu/UButton',
      'root>UNavigationMenu/UButton#label',
    ])
    expect(
      pieceBox(nodes, node('root>UNavigationMenu/UButton'), items),
    ).toEqual(at(10, 10, 60, 24))
    expect(
      pieceBox(
        nodes,
        node('root>UNavigationMenu/UButton#label', {
          kind: 'slot',
          slot: 'label',
        }),
        items,
      ),
    ).toEqual(at(20, 14, 30, 16))
  })

  test('a piece whose own element takes no room clips around its theme slots', () => {
    // Nuxt UI's sidebar: an aside of no height, its container fixed inside.
    expect(
      pieceBox(
        {
          'root>USidebar': {
            boxes: [at(24, 24, 276, 0)],
            slots: {
              root: [at(24, 24, 276, 0)],
              container: [at(24, 24, 276, 720)],
            },
          },
        },
        node('root>USidebar'),
        none,
      ),
    ).toEqual(at(24, 24, 276, 720))
  })

  test('a piece whose own element takes no room clips around the pieces inside it', () => {
    const sidebar = node('root>Shell', {}, [
      node('root>Shell>UNavigationMenu', {}, [
        node('root>Shell>UNavigationMenu#root', { kind: 'slot', slot: 'root' }),
      ]),
      node('root>Shell>UButton'),
    ])
    expect(
      pieceBox(
        {
          'root>Shell': { boxes: [at(24, 24, 276, 0)], slots: {} },
          'root>Shell>UNavigationMenu': {
            boxes: [at(40, 80, 200, 300)],
            slots: {},
          },
          'root>Shell>UButton': { boxes: [at(40, 600, 200, 40)], slots: {} },
        },
        sidebar,
        none,
      ),
    ).toEqual(at(24, 24, 276, 616))
  })

  test('a piece or slot that isn’t rendered has no box', () => {
    expect(pieceBox(nodes, node('root>UBadge'), none)).toBeNull()
    expect(
      pieceBox(
        nodes,
        node('root>UButton#leadingIcon', { kind: 'slot', slot: 'leadingIcon' }),
        none,
      ),
    ).toBeNull()
    expect(
      pieceBox(
        { 'root>UBadge': { boxes: [], slots: {} } },
        node('root>UBadge'),
        none,
      ),
    ).toBeNull()
  })
})

describe('the pieces drawn once per item', () => {
  test('are the repeated tags and everything inside them, slots included', () => {
    const tree = node('root', {}, [
      node('root>UCard', {}, [node('root>UCard#body', { kind: 'slot' })]),
      node('root>UNavigationMenu', {}, [
        node('root>UNavigationMenu/UTooltip', { repeated: true }, [
          node('root>UNavigationMenu/UTooltip/UButton', {}, [
            node('root>UNavigationMenu/UTooltip/UButton#label', {
              kind: 'slot',
            }),
          ]),
        ]),
      ]),
    ])
    expect([...onePerItem(tree)].sort()).toEqual([
      'root>UNavigationMenu/UTooltip',
      'root>UNavigationMenu/UTooltip/UButton',
      'root>UNavigationMenu/UTooltip/UButton#label',
    ])
  })
})

describe('how a piece sits in its card', () => {
  test('a small piece keeps its size, centred', () => {
    expect(fitPiece(at(100, 20, 90, 32), { width: 210, height: 90 })).toEqual({
      scale: 1,
      left: 60,
      top: 29,
      width: 90,
      height: 32,
    })
  })

  test('a piece larger than the card shrinks to fit inside its margin, centred', () => {
    const fit = fitPiece(at(0, 0, 400, 100), { width: 216, height: 96 })
    // The width is what limits it: 216 less 8 on each side.
    expect(fit.scale).toBeCloseTo(0.5)
    expect(fit.width).toBeCloseTo(200)
    expect(fit.height).toBeCloseTo(50)
    expect(fit.left).toBeCloseTo(8)
    expect(fit.top).toBeCloseTo(23)
  })

  test('a tall piece is limited by the card’s height', () => {
    const fit = fitPiece(at(0, 0, 100, 400), { width: 216, height: 96 })
    expect(fit.scale).toBeCloseTo(0.2)
    expect(fit.height).toBeCloseTo(80)
    expect(fit.top).toBeCloseTo(8)
  })
})
