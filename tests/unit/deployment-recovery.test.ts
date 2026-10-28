import { describe, expect, test } from 'vitest'
import {
  deploymentRecoveryScript,
  installDeploymentRecovery,
} from '../../tooling/deployment-recovery.ts'

const MESSAGE = 'This viewing site could not load.'

type Handler = (event: unknown) => void

function fixture(
  href = 'https://example.test/studio/prototypes/sam/flow?view=main#details',
  unavailable = false,
) {
  const handlers = new Map<string, Handler>()
  const values = new Map<string, string>()
  const replacements: string[] = []
  const root = { hasChildNodes: () => false, textContent: '' }
  const win = {
    navigator: { onLine: true },
    document: { getElementById: () => root },
    location: {
      href,
      origin: new URL(href).origin,
      replace: (url: string) => replacements.push(url),
    },
    sessionStorage: {
      getItem: (key: string) => {
        if (unavailable) throw Error('blocked')
        return values.get(key) ?? null
      },
      setItem: (key: string, value: string) => {
        if (unavailable) throw Error('blocked')
        values.set(key, value)
      },
    },
    addEventListener: (name: string, handler: Handler) =>
      handlers.set(name, handler),
  }
  return { win, handlers, replacements, values, root }
}

function install(f: ReturnType<typeof fixture>) {
  installDeploymentRecovery(f.win as never, '/studio/', MESSAGE)
  return f
}

const script = (src: string) => ({
  target: { tagName: 'SCRIPT', type: 'module', src },
})

describe('[CL-112] a page that references removed files reloads itself once', () => {
  test('chunk failures refresh once, preserving the route, search and hash', () => {
    const f = install(fixture())
    let prevented = 0
    const event = { preventDefault: () => prevented++ }
    f.handlers.get('vite:preloadError')!(event)
    f.handlers.get('vite:preloadError')!(event)
    expect(f.replacements).toHaveLength(1)
    expect(prevented).toBe(1)
    const url = new URL(f.replacements[0]!)
    expect(url.pathname).toBe('/studio/prototypes/sam/flow')
    expect(url.searchParams.get('view')).toBe('main')
    expect(url.hash).toBe('#details')
    expect(Number(url.searchParams.get('_studio_reload'))).toBeGreaterThan(0)
    // Even blocked storage cannot cause a reload loop: the URL bounds it.
    const next = install(fixture(f.replacements[0], true))
    next.handlers.get('vite:preloadError')!(event)
    expect(next.replacements).toHaveLength(0)
  })

  test('entry failures recover before the app loads; unrelated errors and offline failures do not reload', () => {
    const f = install(fixture())
    const error = f.handlers.get('error')!
    error({
      target: {
        tagName: 'IMG',
        src: 'https://example.test/studio/_nuxt/a.png',
      },
    })
    error(script('https://other.test/studio/_nuxt/app.js'))
    error(script('https://example.test/other/_nuxt/app.js'))
    expect(f.replacements).toHaveLength(0)
    const entry = script('https://example.test/studio/_nuxt/app.js')
    f.win.navigator.onLine = false
    error(entry)
    expect(f.replacements).toHaveLength(0)
    expect(f.root.textContent).toBe(MESSAGE)
    f.win.navigator.onLine = true
    error(entry)
    expect(f.replacements).toHaveLength(1)
  })

  test('at most once a minute: session storage bounds retries when the recovery query was removed', () => {
    const f = install(fixture())
    f.values.set('studio:deployment-recovery:/studio/', String(Date.now()))
    let prevented = false
    f.handlers.get('vite:preloadError')!({
      preventDefault: () => (prevented = true),
    })
    expect(f.replacements).toHaveLength(0)
    expect(prevented).toBe(false)
  })

  test('the bootstrap script is self-contained', () => {
    const f = fixture()
    new Function('window', deploymentRecoveryScript('/studio/', MESSAGE))(f.win)
    f.handlers.get('vite:preloadError')!({ preventDefault() {} })
    expect(f.replacements).toHaveLength(1)
  })
})
