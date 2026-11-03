import { describe, expect, test } from 'vitest'
import {
  acceptsHost,
  acceptsPreview,
  isHostMessage,
  isPreviewMessage,
  PREVIEW_CHANNEL,
  PREVIEW_VERSION,
  previewAddress,
  readAddress,
} from '../../tooling/preview/protocol'

// The studio and a preview document talk over a versioned channel. Messages
// are validated as transport, not as a security boundary: both sides are
// same-origin repository code.
const envelope = {
  channel: PREVIEW_CHANNEL,
  version: PREVIEW_VERSION,
  session: 'session-a',
  runtime: 'runtime-a',
  artifact: 'vhme000000000001',
}
const source = {} as Window
const origin = 'http://127.0.0.1:3000'
const event = (data: unknown, sender: unknown = source, from = origin) => ({
  data,
  source: sender as MessageEventSource | null,
  origin: from,
})
const ready = {
  ...envelope,
  kind: 'status',
  state: 'ready',
  render: 1,
  detail: '',
}

describe('the preview channel', () => {
  test('[PR-97] the studio accepts only its own preview’s messages for the open artifact', () => {
    const accept = (value: ReturnType<typeof event>) =>
      acceptsPreview(value, source, origin, {
        session: envelope.session,
        runtime: envelope.runtime,
        artifact: envelope.artifact,
      })
    expect(accept(event(ready))).toBe(true)
    expect(accept(event(ready, {}))).toBe(false)
    expect(accept(event(ready, null))).toBe(false)
    expect(accept(event(ready, source, 'https://elsewhere.example'))).toBe(
      false,
    )
    for (const change of [
      { runtime: 'previous-document' },
      { version: PREVIEW_VERSION + 1 },
      { session: 'session-b' },
      { artifact: 'vnts000000000001' },
      { channel: 'other-channel' },
    ])
      expect(accept(event({ ...ready, ...change }))).toBe(false)
    // A reloaded document announces itself with a new runtime and the
    // artifact in its address; the studio answers with its current one.
    expect(
      accept(
        event({
          ...envelope,
          runtime: 'runtime-b',
          artifact: 'vnts000000000001',
          kind: 'ready',
        }),
      ),
    ).toBe(true)
  })

  test('[PR-97] only declared messages with bounded payloads pass', () => {
    for (const kind of ['write', 'save', 'execute', 'unknown'])
      expect(isPreviewMessage({ ...envelope, kind })).toBe(false)
    for (const render of [-1, 0.5, Infinity, Number.MAX_SAFE_INTEGER + 1])
      expect(isPreviewMessage({ ...ready, render })).toBe(false)
    expect(isPreviewMessage({ ...ready, detail: 'x'.repeat(8193) })).toBe(false)
    expect(isPreviewMessage({ ...ready, state: 'invented' })).toBe(false)
    expect(isPreviewMessage({ ...ready, state: 'empty' })).toBe(true)
    expect(isPreviewMessage({ ...ready, artifact: 'not an id' })).toBe(false)
    expect(isPreviewMessage({ ...ready, session: '' })).toBe(false)
    expect(isPreviewMessage({ ...ready, session: 'a\nb' })).toBe(false)
    expect(
      isPreviewMessage({
        ...envelope,
        kind: 'lifecycle',
        sequence: 3,
        phase: 'updating',
        detail: '',
      }),
    ).toBe(true)
    for (const phase of ['current', 'updating', 'error', 'disconnected'])
      expect(
        isPreviewMessage({
          ...envelope,
          kind: 'lifecycle',
          sequence: 0,
          phase,
          detail: '',
        }),
      ).toBe(true)
    expect(
      isPreviewMessage({
        ...envelope,
        kind: 'lifecycle',
        sequence: -1,
        phase: 'current',
        detail: '',
      }),
    ).toBe(false)
    expect(
      isPreviewMessage({
        ...envelope,
        kind: 'lifecycle',
        sequence: 1,
        phase: 'stale',
        detail: '',
      }),
    ).toBe(false)
  })

  test('[PR-82] [CM-2] a preview asks the studio to navigate to one of its own addresses, or to run a shortcut, comment mode’s included', () => {
    const navigate = { ...envelope, kind: 'navigate', replace: false }
    expect(
      isPreviewMessage({
        ...navigate,
        href: '/studio/prototypes/f1ws000000000001/artifacts/det0000000000a01?x=1#y',
      }),
    ).toBe(true)
    for (const href of [
      'https://elsewhere.example/',
      '//elsewhere.example/',
      'javascript:alert(1)',
      'prototypes/relative',
      `/${'a'.repeat(4096)}`,
      '/line\nbreak',
      42,
    ])
      expect(isPreviewMessage({ ...navigate, href })).toBe(false)
    expect(isPreviewMessage({ ...navigate, href: '/', replace: 'yes' })).toBe(
      false,
    )
    for (const action of ['palette', 'navigation', 'source', 'grid', 'comment'])
      expect(isPreviewMessage({ ...envelope, kind: 'shortcut', action })).toBe(
        true,
      )
    expect(
      isPreviewMessage({ ...envelope, kind: 'shortcut', action: 'quit' }),
    ).toBe(false)
  })

  test('[PR-97] a preview accepts configure only from its own studio and session', () => {
    const configure = { ...envelope, kind: 'configure' }
    expect(isHostMessage(configure)).toBe(true)
    expect(isHostMessage({ ...configure, kind: 'status' })).toBe(false)
    const accept = (value: ReturnType<typeof event>) =>
      acceptsHost(value, source, origin, {
        session: envelope.session,
        runtime: envelope.runtime,
      })
    expect(accept(event(configure))).toBe(true)
    expect(accept(event(configure, {}))).toBe(false)
    expect(accept(event({ ...configure, runtime: 'runtime-b' }))).toBe(false)
    expect(accept(event({ ...configure, session: 'session-b' }))).toBe(false)
    expect(accept(event({ ...configure, version: 0 }))).toBe(false)
  })

  test('[PR-97] the address names the artifact and, when hosted, the session', () => {
    expect(previewAddress('/studio/_preview/none/', 'vp1an00000000001')).toBe(
      '/studio/_preview/none/?artifact=vp1an00000000001',
    )
    const hosted = previewAddress(
      '/_preview/none/',
      'vp1an00000000001',
      'session-a',
    )
    expect(hosted).toBe(
      '/_preview/none/?artifact=vp1an00000000001&session=session-a',
    )
    expect(readAddress(new URL(hosted, origin).search)).toEqual({
      artifact: 'vp1an00000000001',
      session: 'session-a',
    })
    // Opened directly in its own tab: no session, nobody to talk to.
    expect(readAddress('?artifact=vp1an00000000001')).toEqual({
      artifact: 'vp1an00000000001',
      session: null,
    })
    expect(readAddress('?artifact=../../etc')).toEqual({
      artifact: null,
      session: null,
    })
  })
})
