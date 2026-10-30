import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { inspectBuild } from '../../tooling/inspect-build.ts'

let site = ''
function write(file: string, content: string) {
  mkdirSync(path.dirname(path.join(site, file)), { recursive: true })
  writeFileSync(path.join(site, file), content)
}

// A miniature Nuxt static build under the base path /studio/.
function build() {
  write(
    'index.html',
    [
      '<script type="importmap">{"imports":{"#entry":"/studio/_nuxt/entry.js"}}</script>',
      '<link rel="stylesheet" href="/studio/_nuxt/entry.css" crossorigin>',
      '<link rel="modulepreload" as="script" href="/studio/_nuxt/entry.js">',
      '<script type="module" src="/studio/_nuxt/entry.js"></script>',
      '<link rel="prefetch" as="script" href="/studio/_nuxt/lazy.js">',
      '<link rel="icon" href="/studio/favicon.svg">',
      '<link rel="preconnect" href="https://fonts.example.org">',
    ].join(''),
  )
  write('favicon.svg', '<svg/>')
  write(
    '_nuxt/entry.js',
    'const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./lazy.js","./lazy.css"])))=>i.map(i=>d[i]);' +
      'import{a}from"./shared.js";import"./side.js";const l=()=>import(`./lazy.js`);',
  )
  write('_nuxt/entry.css', 'body{background:url(./bg.png)}a{b:url(data:x)}')
  write('_nuxt/bg.png', 'png')
  write(
    '_nuxt/shared.js',
    'import{e}from"#entry";import{c}from"./cycle.js";export const a=1',
  )
  write('_nuxt/cycle.js', 'import{a}from"./shared.js";export const c=1')
  write('_nuxt/side.js', '12345')
  write('_nuxt/lazy.js', 'import{a}from"./shared.js";export default 1')
  write('_nuxt/lazy.css', 'p{}')
}

beforeEach(() => {
  site = mkdtempSync(path.join(tmpdir(), 'studio-build-'))
  build()
})
afterEach(() => rmSync(site, { recursive: true, force: true }))

describe('[CL-114] build inspection', () => {
  test('startup weight follows static dependencies once and leaves lazy files out', () => {
    const result = inspectBuild(site, '/studio/')
    expect(result.assets.map((asset) => asset.file).sort()).toEqual([
      '_nuxt/cycle.js',
      '_nuxt/entry.css',
      '_nuxt/entry.js',
      '_nuxt/shared.js',
      '_nuxt/side.js',
    ])
    expect(result.requests).toBe(5)
    expect(result.bytes).toBeGreaterThan(0)
    expect(result.gzipBytes).toBeGreaterThan(0)
  })

  test('every emitted reference is checked, lazy ones included', () => {
    rmSync(path.join(site, '_nuxt/lazy.css'))
    rmSync(path.join(site, '_nuxt/bg.png'))
    rmSync(path.join(site, 'favicon.svg'))
    expect(() => inspectBuild(site, '/studio/')).toThrow(
      /_nuxt\/lazy\.css \(referenced by _nuxt\/entry\.js\)[\s\S]*_nuxt\/bg\.png \(referenced by _nuxt\/entry\.css\)|_nuxt\/bg\.png[\s\S]*_nuxt\/lazy\.css/,
    )
    expect(() => inspectBuild(site, '/studio/')).toThrow(
      /favicon\.svg \(referenced by index\.html\)/,
    )
  })

  test('a reference that leaves the built site is refused', () => {
    write('_nuxt/lazy.js', 'import"../../outside.js"')
    expect(() => inspectBuild(site, '/studio/')).toThrow(/escapes the build/)
  })

  test('module names a bundled dependency keeps from its own build are not references', () => {
    // esbuild's CommonJS wrappers name each module by its source path, as
    // Excalidraw's bundled Mermaid does.
    write(
      '_nuxt/lazy.js',
      'var m=s({"../../node_modules/.pnpm/a@1/node_modules/a/lib/main.js"(){}});',
    )
    expect(() => inspectBuild(site, '/studio/')).not.toThrow()
  })

  test('module names in a bundled library’s own require map are not references', () => {
    // Browserify's module map and require calls, as Mermaid's bundled ELK
    // layout keeps them.
    write(
      '_nuxt/lazy.js',
      'var a={"./elk-api.js":1,"./elk-worker.min.js":2};n(e("./elk-api.js").default);',
    )
    expect(() => inspectBuild(site, '/studio/')).not.toThrow()
    write('_nuxt/lazy.js', 'const d=["./missing.js","./also.css"];')
    expect(() => inspectBuild(site, '/studio/')).toThrow(/missing\.js/)
  })
})
