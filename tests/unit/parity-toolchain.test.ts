import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { reactToolchain } from '../../tooling/parity/react-studio'

const copies: string[] = []

function copyWith(miseToml: string) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'parity-toolchain-'))
  copies.push(root)
  writeFileSync(path.join(root, 'mise.toml'), miseToml)
  return root
}

afterEach(() => {
  for (const root of copies.splice(0))
    rmSync(root, { recursive: true, force: true })
})

// The Node running this test: its folder stands in for an installed Node.
const nodeFolder = path.dirname(process.execPath)
const nodeMajor = process.versions.node.split('.')[0]!

describe('the React studio’s toolchain', () => {
  test('runs pnpm through mise with the Node and pnpm the copy’s mise.toml names', () => {
    const root = copyWith(
      '[tools]\nnode = "24"   # an LTS release\npnpm = "12"\n',
    )
    const toolchain = reactToolchain(root, {})
    expect(toolchain.command).toBe('mise')
    expect(toolchain.args(['dev', '--port', '5391'])).toEqual([
      'exec',
      'node@24',
      'pnpm@12',
      '--',
      'pnpm',
      'dev',
      '--port',
      '5391',
    ])
  })

  test('without mise, runs pnpm with the Node folder named by STUDIO_PARITY_NODE first on PATH', () => {
    const root = copyWith(`[tools]\nnode = "${nodeMajor}"\n`)
    const toolchain = reactToolchain(root, {
      STUDIO_PARITY_NODE: nodeFolder,
      Path: 'C:\\elsewhere',
    })
    expect(toolchain.args(['install'])).toEqual(['install'])
    const pathKey = Object.keys(toolchain.env).find(
      (key) => key.toUpperCase() === 'PATH',
    )!
    expect(toolchain.env[pathKey]).toBe(
      `${nodeFolder}${path.delimiter}C:\\elsewhere`,
    )
  })

  test('refuses a STUDIO_PARITY_NODE whose Node is not the major the copy names', () => {
    const other = String(Number(nodeMajor) + 1)
    const root = copyWith(`[tools]\nnode = "${other}"\npnpm = "12"\n`)
    expect(() =>
      reactToolchain(root, { STUDIO_PARITY_NODE: nodeFolder }),
    ).toThrow(
      `needs Node ${other}, but ${nodeFolder} has v${process.versions.node}`,
    )
  })
})
