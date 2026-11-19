// Playground: the studio sends a component's props to the system's preview
// document as a message, which the document applies to the mounted component
// in place. Only plain JSON values travel; anything else is refused whole.
import { describe, expect, test } from 'vitest'
import {
  acceptsHost,
  isHostMessage,
  isPreviewProps,
  PREVIEW_CHANNEL,
  PREVIEW_VERSION,
} from '../../tooling/preview/protocol'
import {
  exampleId,
  overviewId,
  playgroundId,
} from '../../tooling/systems/preview-ids'

const envelope = {
  channel: PREVIEW_CHANNEL,
  version: PREVIEW_VERSION,
  session: 'session-a',
  runtime: 'runtime-a',
  artifact: 'vhme000000000001',
}
const props = (value: unknown) => ({ ...envelope, kind: 'props', props: value })

describe('the props message', () => {
  test('carries plain JSON values: text, numbers, yes/no, null, lists and records', () => {
    for (const value of [
      {},
      { label: 'Moor the boat', size: 3, loading: true, icon: null },
      { items: ['a', 1, false, null], meta: { nested: { deep: [1, 2] } } },
      { negative: -1.5, empty: '' },
    ])
      expect(isHostMessage(props(value))).toBe(true)
  })

  test('refuses props that are not a record of plain JSON values', () => {
    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic
    const deep: Record<string, unknown> = {}
    let at = deep
    for (let level = 0; level < 40; level++) {
      const next = {}
      at.next = next
      at = next
    }
    for (const value of [
      undefined,
      null,
      'label',
      ['label'],
      { label: undefined },
      { size: Number.NaN },
      { size: Infinity },
      { onClick: () => undefined },
      { when: new Date(0) },
      { pattern: /x/ },
      { big: 1n },
      { symbol: Symbol('x') },
      { list: [undefined] },
      { map: new Map() },
      JSON.parse('{"__proto__": {"polluted": true}}'),
      { nested: JSON.parse('{"__proto__": {"polluted": true}}') },
      cyclic,
      deep,
      { long: 'x'.repeat(70_000) },
    ]) {
      expect(isPreviewProps(value)).toBe(false)
      expect(isHostMessage(props(value))).toBe(false)
    }
  })

  test('needs the envelope like any host message, and reaches only its own document', () => {
    expect(isHostMessage({ kind: 'props', props: {} })).toBe(false)
    expect(isHostMessage({ ...props({}), version: PREVIEW_VERSION + 1 })).toBe(
      false,
    )
    expect(isHostMessage({ ...envelope, kind: 'other', props: {} })).toBe(false)
    const source = {} as Window
    const origin = 'http://127.0.0.1:3000'
    const accept = (data: unknown, from = origin) =>
      acceptsHost({ data, source, origin: from }, source, origin, {
        session: envelope.session,
        runtime: envelope.runtime,
      })
    expect(accept(props({ label: 'Hi' }))).toBe(true)
    expect(accept({ ...props({}), runtime: 'previous-document' })).toBe(false)
    expect(accept(props({}), 'https://elsewhere.example')).toBe(false)
    expect(accept({ ...envelope, kind: 'configure' })).toBe(true)
  })
})

describe('the playground’s preview ID', () => {
  test('is fixed per system and component, and apart from examples and Overview', () => {
    const id = playgroundId('hrbr000000000001', 'button')
    expect(id).toMatch(/^[0-9a-hjkmnp-tv-z]{16}$/)
    expect(playgroundId('hrbr000000000001', 'button')).toBe(id)
    expect(playgroundId('hrbr000000000001', 'card')).not.toBe(id)
    expect(playgroundId('lntn000000000001', 'button')).not.toBe(id)
    expect(exampleId('hrbr000000000001', 'button', 'Default')).not.toBe(id)
    expect(overviewId('hrbr000000000001')).not.toBe(id)
  })
})
