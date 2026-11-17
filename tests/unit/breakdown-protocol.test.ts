// The Breakdown's messages on the preview channel: the document reports
// where each piece's elements and theme slots are (`nodes`), and the studio
// says which piece to highlight (`highlight`). Validated as transport, like
// the rest of the channel.
import { describe, expect, test } from 'vitest'
import {
  isBreakdownNodeId,
  isHostMessage,
  isPreviewMessage,
  PREVIEW_CHANNEL,
  PREVIEW_VERSION,
} from '../../tooling/preview/protocol'

const envelope = {
  channel: PREVIEW_CHANNEL,
  version: PREVIEW_VERSION,
  session: 'session-a',
  runtime: 'runtime-a',
  artifact: 'vhme000000000001',
}
const box = { x: 4, y: 8, width: 120, height: 36 }

describe('the nodes message', () => {
  test('carries each piece’s boxes and its theme slots’ boxes', () => {
    expect(
      isPreviewMessage({
        ...envelope,
        kind: 'nodes',
        nodes: {
          root: { boxes: [box], slots: {} },
          'root>UButton': {
            boxes: [box],
            slots: { base: [box], label: [{ ...box, x: 12 }] },
          },
          'root>UList/UButton~2': { boxes: [box, box], slots: {} },
        },
      }),
    ).toBe(true)
    expect(isPreviewMessage({ ...envelope, kind: 'nodes', nodes: {} })).toBe(
      true,
    )
  })

  test('refuses boxes that are not plain finite numbers, and odd node IDs', () => {
    const nodes = (value: unknown) =>
      isPreviewMessage({ ...envelope, kind: 'nodes', nodes: value })
    expect(nodes([])).toBe(false)
    expect(
      nodes({ root: { boxes: [{ ...box, x: Infinity }], slots: {} } }),
    ).toBe(false)
    expect(
      nodes({ root: { boxes: [{ ...box, width: '1' }], slots: {} } }),
    ).toBe(false)
    expect(nodes({ root: { boxes: [box] } })).toBe(false)
    expect(nodes({ root: { boxes: [box], slots: { base: box } } })).toBe(false)
    expect(nodes({ 'root\nX': { boxes: [], slots: {} } })).toBe(false)
    expect(nodes({ ['r'.repeat(600)]: { boxes: [], slots: {} } })).toBe(false)
    expect(
      nodes(JSON.parse('{"__proto__": { "boxes": [], "slots": {} }}')),
    ).toBe(false)
  })
})

describe('the highlight message', () => {
  test('names the hovered and the selected piece, or none', () => {
    const highlight = (hover: unknown, selected: unknown) =>
      isHostMessage({ ...envelope, kind: 'highlight', hover, selected })
    expect(highlight('root>UButton', null)).toBe(true)
    expect(highlight(null, 'root>UButton#label')).toBe(true)
    expect(highlight(null, null)).toBe(true)
    expect(highlight(undefined, null)).toBe(false)
    expect(highlight(3, null)).toBe(false)
    expect(highlight('a\u0000b', null)).toBe(false)
  })

  test('node IDs are paths of tags, files and slots', () => {
    for (const id of [
      'root',
      'root>UButton',
      'root>StudioSidebar>USidebar/UButton~2',
      'root>UButton#leadingIcon',
    ])
      expect(isBreakdownNodeId(id)).toBe(true)
    for (const id of ['', ' root', 'root\t', 'x'.repeat(513), 7])
      expect(isBreakdownNodeId(id)).toBe(false)
  })
})
