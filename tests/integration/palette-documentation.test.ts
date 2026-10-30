import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { expect, test } from 'vitest'
import { loadRegistry } from '../../tooling/modules/registry'
import { paletteGroups } from '../../app/utils/palette'

test('[PR-140] [SH-43] real Documentation contributes Manual chapters only while enabled', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'studio-palette-manual-'))
  try {
    for (const enabled of [true, false]) {
      writeFileSync(
        path.join(root, 'studio.config.json'),
        JSON.stringify({ modules: { documentation: enabled } }),
      )
      const registry = await loadRegistry(root, {
        modulesFolder: path.resolve('src/modules'),
      })
      const groups = paletteGroups(
        registry.enabled.map(({ spec }) => ({
          ...spec,
          palette: spec.palette ?? [],
        })),
        { prototypes: [], contributors: [], systems: [], defaultSystem: null },
        [],
        { path: '/' },
        false,
        { places: 'Places', home: 'Home', settings: 'Studio settings' },
      )
      const manual = groups.find(({ label }) => label === 'Manual')
      if (enabled) {
        expect(manual?.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              label: 'Working with your agent',
              to: '/documentation/manual/agent',
            }),
          ]),
        )
      } else expect(manual).toBeUndefined()
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
