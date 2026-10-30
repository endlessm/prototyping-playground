import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { loadSystems } from '../../tooling/systems/registry'

let root: string

const valid = (studioId: string, label: string) => ({
  label,
  status: 'active',
  role: 'prototype',
  styling: 'tailwind',
  colorModes: ['light'],
  docs: 'warn',
  libraries: [],
  origin: null,
  studioId,
  app: { factory: { from: 'app.ts', name: 'createApp' } },
})

function system(folder: string, spec: unknown) {
  const dir = path.join(root, 'src/systems', folder)
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    path.join(dir, 'system.ts'),
    `export default ${JSON.stringify(spec)}\n`,
  )
}

beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), 'studio-systems-'))
})
afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('the system registry', () => {
  test('[SY-131] [SY-175] finds every registered system folder from its declaration, with no names built in', async () => {
    system('harbor', valid('hrbr000000000001', 'Harbor'))
    system('meadow', valid('mdw0000000000001', 'Meadow'))
    const { systems, problems } = await loadSystems(root, {
      systems: ['harbor', 'meadow'],
    })
    expect(problems).toEqual([])
    expect(systems.map(({ key, id, spec }) => [key, id, spec.label])).toEqual([
      ['harbor', 'hrbr000000000001', 'Harbor'],
      ['meadow', 'mdw0000000000001', 'Meadow'],
    ])
  })

  test('[SY-132] a system folder the configuration does not register fails validation', async () => {
    system('harbor', valid('hrbr000000000001', 'Harbor'))
    system('stray', valid('stry000000000001', 'Stray'))
    const { systems, problems } = await loadSystems(root, {
      systems: ['harbor'],
    })
    expect(systems.map(({ key }) => key)).toEqual(['harbor'])
    expect(problems).toEqual([
      'src/systems/stray is not registered: add "stray" to "systems" in studio.config.json, or remove the folder.',
    ])
  })

  test('[SY-132] a registered system without a folder is reported', async () => {
    const { problems } = await loadSystems(root, { systems: ['missing'] })
    expect(problems).toEqual([
      'studio.config.json registers the system "missing", but src/systems/missing/system.ts does not exist.',
    ])
  })

  test('[SY-131] a bad declaration fails with plain-language messages and leaves the system out', async () => {
    system('broken', {
      ...valid('not-an-id', ''),
      status: 'retired',
      colorModes: ['sepia'],
      origin: 'shadcn',
      app: {},
    })
    const { systems, problems } = await loadSystems(root, {
      systems: ['broken'],
    })
    expect(systems).toEqual([])
    expect(problems).toEqual([
      'src/systems/broken/system.ts: the label must be plain text.',
      'src/systems/broken/system.ts: the status is "active" or "archived".',
      'src/systems/broken/system.ts: colour modes are "light" and "dark".',
      'src/systems/broken/system.ts: the studioId must be 16 lowercase letters and digits (Crockford base32).',
      'src/systems/broken/system.ts: the origin is a plain-text source or null; shadcn systems are not supported.',
      'src/systems/broken/system.ts: app.factory names the file and export that create the system’s Vue app.',
    ])
  })

  test('[SY-63] [SY-82] the Overview’s texts are plain text, and libraries name only asset pages', async () => {
    system('harbor', {
      ...valid('hrbr000000000001', 'Harbor'),
      overview: { summary: '<b>Bold</b>', guidance: 3 },
      libraries: [
        {
          kind: 'package',
          id: 'icons',
          label: 'Icons',
          package: 'icons',
          assets: ['icons', 'sounds'],
        },
      ],
    })
    const { systems, problems } = await loadSystems(root, {
      systems: ['harbor'],
    })
    expect(systems).toEqual([])
    expect(problems).toEqual([
      'src/systems/harbor/system.ts: a library’s assets are "fonts", "icons" and "images".',
      'src/systems/harbor/system.ts: overview.summary, overview.guidance and overview.code are plain text.',
    ])
  })

  test('[SY-131] two systems may not share a permanent ID', async () => {
    system('harbor', valid('hrbr000000000001', 'Harbor'))
    system('copy', valid('hrbr000000000001', 'Copy'))
    const { systems, problems } = await loadSystems(root, {
      systems: ['harbor', 'copy'],
    })
    expect(systems.map(({ key }) => key)).toEqual(['copy'])
    expect(problems).toEqual([
      'src/systems/harbor/system.ts: the studioId hrbr000000000001 is already used by src/systems/copy.',
    ])
  })
})
