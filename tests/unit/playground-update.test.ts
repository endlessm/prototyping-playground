// Playground: a component in the stage that changes one of its own props
// (a modal closing on Escape emits `update:open`) tells the studio, which
// sets that prop's control. Only a prop name and a plain JSON value travel.
import { describe, expect, test } from 'vitest'
import {
  acceptsPreview,
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
const update = (prop: unknown, value: unknown) => ({
  ...envelope,
  kind: 'update',
  prop,
  value,
})

describe('the update message', () => {
  test('carries a prop name and a plain JSON value', () => {
    for (const [prop, value] of [
      ['open', false],
      ['modelValue', 'calm'],
      ['page', 3],
      ['items', ['a', { label: 'b' }]],
      ['selected', null],
    ] as const)
      expect(isPreviewMessage(update(prop, value))).toBe(true)
  })

  test('refuses values that are not plain JSON', () => {
    for (const value of [
      undefined,
      Number.NaN,
      () => undefined,
      new Date(0),
      new Map(),
      { nested: new Date(0) },
      JSON.parse('{"__proto__": {"polluted": true}}'),
      'x'.repeat(70_000),
    ])
      expect(isPreviewMessage(update('open', value))).toBe(false)
  })

  test('refuses anything but a prop’s name', () => {
    for (const prop of [
      '',
      'update:open',
      'on-click',
      '__proto__',
      '1st',
      'x'.repeat(200),
      7,
      null,
    ])
      expect(isPreviewMessage(update(prop, true))).toBe(false)
  })

  test('is heard only from the current document about the shown artifact', () => {
    const source = {} as Window
    const origin = 'http://127.0.0.1:3000'
    const expected = {
      session: envelope.session,
      runtime: envelope.runtime,
      artifact: envelope.artifact,
    }
    const accept = (data: unknown) =>
      acceptsPreview({ data, source, origin }, source, origin, expected)
    expect(accept(update('open', false))).toBe(true)
    expect(accept({ ...update('open', false), runtime: 'old' })).toBe(false)
    expect(
      accept({ ...update('open', false), artifact: 'vhme000000000002' }),
    ).toBe(false)
  })
})
