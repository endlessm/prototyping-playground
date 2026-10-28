import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

// A built site in miniature: Home, the 404 copy of the app and one asset.
const site = mkdtempSync(path.join(tmpdir(), 'studio-site-'))
mkdirSync(path.join(site, '_nuxt'))
writeFileSync(path.join(site, 'index.html'), '<p>home</p>')
writeFileSync(path.join(site, '404.html'), '<p>app copy</p>')
writeFileSync(path.join(site, '_nuxt', 'entry.js'), 'export {}')
writeFileSync(path.join(path.dirname(site), 'secret.txt'), 'secret')

describe('[CL-108] yarn preview serves the built site locally', () => {
  let url = ''
  let stop = () => {}
  beforeAll(async () => {
    const child = spawn(
      process.execPath,
      ['tooling/serve-static.ts', '--dir', site, '--port', '0'],
      {
        env: { ...process.env, STUDIO_BASE_PATH: '/studio/' },
        stdio: ['ignore', 'pipe', 'inherit'],
      },
    )
    stop = () => child.kill()
    url = await new Promise<string>((resolve) => {
      child.stdout.on('data', (chunk: Buffer) => {
        const match = String(chunk).match(/http:\/\/\S+/)
        if (match) resolve(match[0])
      })
    })
  })
  afterAll(() => {
    stop()
    rmSync(site, { recursive: true, force: true })
  })

  test('it prints the address under the base path and serves Home there', async () => {
    expect(url).toMatch(/^http:\/\/(127\.0\.0\.1|localhost):\d+\/studio\/$/)
    const response = await fetch(url)
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('<p>home</p>')
    const asset = await fetch(new URL('_nuxt/entry.js', url))
    expect(asset.headers.get('content-type')).toMatch(/javascript/)
  })

  test('[CL-111] a deep link gets the 404 copy of the app, as a static host answers', async () => {
    const response = await fetch(new URL('prototypes/some/view', url))
    expect(response.status).toBe(404)
    expect(await response.text()).toBe('<p>app copy</p>')
  })

  test('the base path without its slash redirects, and nothing outside it is served', async () => {
    const origin = new URL(url).origin
    const bare = await fetch(`${origin}/studio`, { redirect: 'manual' })
    expect(bare.status).toBe(301)
    expect(bare.headers.get('location')).toBe('/studio/')
    expect((await fetch(`${origin}/index.html`)).status).toBe(404)
    const escape = await fetch(`${url}..%2f..%2fsecret.txt`)
    expect(await escape.text()).not.toContain('secret')
  })
})
