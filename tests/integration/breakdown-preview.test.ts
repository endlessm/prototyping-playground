// A component's Breakdown is one more thing its system's preview document
// shows: the source its new experiments start from (`startSource`), served
// beside its component file and instrumented so each piece's elements carry
// its node ID. The catalog names its preview
// and the component page data carries its tree; a component without a
// component file has neither.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import {
  componentPages,
  systemCatalog,
  systemPreviews,
} from '../../tooling/systems/catalog'
import { breakdownId, playgroundId } from '../../tooling/systems/preview-ids'
import { loadSystems } from '../../tooling/systems/registry'

const HARBOR = 'hrbr000000000001'
let root: string

function write(file: string, text: string) {
  const at = path.join(root, 'src/systems/harbor', file)
  mkdirSync(path.dirname(at), { recursive: true })
  writeFileSync(at, text)
}

async function harbor() {
  write(
    'system.ts',
    `export default ${JSON.stringify({
      label: 'Harbor',
      status: 'active',
      role: 'prototype',
      styling: 'tailwind',
      colorModes: ['light'],
      docs: 'warn',
      libraries: [],
      origin: null,
      studioId: HARBOR,
      app: { factory: { from: 'app.ts', name: 'createApp' } },
    })}\n`,
  )
  const { systems, problems } = await loadSystems(root, { systems: ['harbor'] })
  expect(problems).toEqual([])
  return systems[0]!
}

beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), 'studio-breakdown-'))
  write('components/button/button.md', '---\ntitle: Button\n---\n')
  write(
    'components/button/Button.vue',
    '<template><button><Wave /></button></template>',
  )
  write('components/card/card.md', '---\ntitle: Card\n---\n')
  write('components/Broken.vue', '<template><div></template>')
})
afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('a component’s breakdown preview', () => {
  test('is listed after its playground, from its start source beside its component file', async () => {
    const system = await harbor()
    const components = path.join(system.dir, 'components')
    expect(systemPreviews(system)).toContainEqual({
      id: breakdownId(HARBOR, 'button'),
      file: path.join(components, 'button/Button.lab-start.vue'),
      breakdown: true,
    })
    const ids = systemPreviews(system).map(({ id }) => id)
    expect(ids.indexOf(breakdownId(HARBOR, 'button'))).toBe(
      ids.indexOf(playgroundId(HARBOR, 'button')) + 1,
    )
  })

  test('the catalog names it per component, and none without a component file', async () => {
    const catalog = systemCatalog(await harbor(), root)
    expect(
      Object.fromEntries(
        catalog.components.map(({ slug, breakdown }) => [slug, breakdown]),
      ),
    ).toEqual({
      broken: breakdownId(HARBOR, 'broken'),
      button: breakdownId(HARBOR, 'button'),
      card: null,
    })
  })

  test('the component page data carries its tree, or why it can’t be read', async () => {
    const pages = await componentPages([await harbor()], root)
    expect(pages[`${HARBOR}/button`]!.breakdown).toMatchObject({
      tree: { id: 'root', name: 'Button', source: 'system', children: [] },
      error: null,
    })
    expect(pages[`${HARBOR}/card`]!.breakdown).toBeNull()
    expect(pages[`${HARBOR}/broken`]!.breakdown).toMatchObject({
      tree: null,
      error: expect.stringContaining('Broken.vue'),
    })
  })
})
