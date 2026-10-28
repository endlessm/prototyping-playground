import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { nodeVersionWarning } from '../../tooling/check-node.ts'

const engines = JSON.parse(readFileSync('package.json', 'utf8')).engines.node

describe('[CL-143] pinned Node version', () => {
  test('mise pins a Node 22 release that engines accepts', () => {
    const mise = readFileSync('mise.toml', 'utf8')
    const pinned = mise.match(/^node = "([\d.]+)"/m)?.[1]
    expect(pinned).toMatch(/^22\./)
    expect(nodeVersionWarning(`v${pinned}.0`, engines)).toBeUndefined()
  })

  test('another Node gets a warning that names both versions', () => {
    expect(nodeVersionWarning('v22.17.1', engines)).toMatch(
      /v22\.17\.1.*>=22\.18\.0 <23/,
    )
    expect(nodeVersionWarning('v24.1.0', engines)).toMatch(/v24\.1\.0/)
    expect(nodeVersionWarning('v20.19.0', engines)).toMatch(/v20\.19\.0/)
  })

  test('Node 22.18 and later 22 releases run without a warning', () => {
    expect(nodeVersionWarning('v22.18.0', engines)).toBeUndefined()
    expect(nodeVersionWarning('v22.22.3', engines)).toBeUndefined()
  })
})
