import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import {
  PARITY_FIXTURES,
  describeFixtureStudio,
  writeReactPrototypes,
} from '../../tooling/parity/fixtures'

let root: string

function write(file: string, content: string) {
  const full = path.join(root, file)
  mkdirSync(path.dirname(full), { recursive: true })
  writeFileSync(full, content)
}

beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), 'parity-fixtures-'))
})
afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('parity fixture studios', () => {
  test('both studios hold the same prototypes, folders, names and identities', () => {
    expect(describeFixtureStudio(PARITY_FIXTURES.react, 'react')).toEqual(
      describeFixtureStudio(PARITY_FIXTURES.vue, 'vue'),
    )
  })

  test('the fixtures have a prototype in Endless Studios with two views, one with no system and one with an empty view', () => {
    expect(describeFixtureStudio(PARITY_FIXTURES.vue, 'vue')).toEqual([
      {
        folder: 'bernardo/drafts',
        meta: expect.objectContaining({ title: 'Drafts', systemId: null }),
        artifacts: [{ path: 'Blank', id: 'b1ank00000000002' }],
      },
      {
        folder: 'bernardo/plain',
        meta: expect.objectContaining({ title: 'Plain', systemId: null }),
        artifacts: [{ path: 'Plain', id: 'vp1an00000000001' }],
      },
      {
        folder: 'bernardo/tracer',
        meta: expect.objectContaining({
          title: 'Tracer',
          systemId: '8x5spen6xtvp96a9',
        }),
        artifacts: [
          { path: 'Home', id: 'vhme000000000001' },
          { path: 'Notes', id: 'vnts000000000001' },
        ],
      },
    ])
  })

  test('a view reads its identity from each side’s leading comment and skips `_` folders', () => {
    const meta = JSON.stringify({ title: 'One', studioId: 'one0000000000001' })
    write('vue/ada/one/meta.json', meta)
    write(
      'vue/ada/one/Flow/Start.vue',
      '<!-- @studio-id strt000000000001 -->\n',
    )
    write('vue/ada/one/_parts/Bit.vue', '<template />\n')
    write('react/ada/one/meta.json', meta)
    write(
      'react/ada/one/Flow/Start.tsx',
      '/** @studio-id strt000000000001 */\n',
    )
    write('react/ada/one/_vue/Start.vue', '<template />\n')
    write('react/ada/one/_vue/Other.tsx', '/** @studio-id x */\n')

    const expected = [
      {
        folder: 'ada/one',
        meta: { title: 'One', studioId: 'one0000000000001' },
        artifacts: [{ path: 'Flow/Start', id: 'strt000000000001' }],
      },
    ]
    expect(describeFixtureStudio(path.join(root, 'vue'), 'vue')).toEqual(
      expected,
    )
    expect(describeFixtureStudio(path.join(root, 'react'), 'react')).toEqual(
      expected,
    )
  })

  test('the React studio gets its fixtures, with the new side’s .vue views in _vue/', () => {
    const prototypes = path.join(root, 'studio/src/prototypes')
    write('studio/src/prototypes/parker/old/meta.json', '{}')
    writeReactPrototypes(prototypes)

    expect(describeFixtureStudio(prototypes, 'react')).toEqual(
      describeFixtureStudio(PARITY_FIXTURES.react, 'react'),
    )
    expect(existsSync(path.join(prototypes, 'parker'))).toBe(false)
    const home = readFileSync(
      path.join(prototypes, 'bernardo/tracer/_vue/Home.vue'),
      'utf8',
    )
    expect(home).toBe(
      readFileSync(
        path.join(PARITY_FIXTURES.vue, 'bernardo/tracer/Home.vue'),
        'utf8',
      )
        .split('\n')
        .slice(1)
        .join('\n'),
    )
    expect(home).not.toContain('@studio-id')
  })
})
