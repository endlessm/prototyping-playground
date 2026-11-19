// A component's playground is one more thing its system's preview document
// shows: its component file, mounted alone, listed beside the component's
// examples in development and in the build. A component without a component
// file has no playground.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { systemCatalog, systemPreviews } from '../../tooling/systems/catalog'
import {
  exampleId,
  overviewId,
  playgroundId,
} from '../../tooling/systems/preview-ids'
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
  root = mkdtempSync(path.join(os.tmpdir(), 'studio-playground-'))
  write('components/button/button.md', '---\ntitle: Button\n---\n')
  write('components/button/Button.vue', '<template><button /></template>')
  write(
    'components/button/Button.examples.vue',
    '<template><Example name="Default">x</Example><Example name="Loud">y</Example></template>',
  )
  write('components/card/card.md', '---\ntitle: Card\n---\n')
  write(
    'components/card/card.examples.vue',
    '<template><Example name="Plain">z</Example></template>',
  )
  write('components/IconButton.vue', '<template><button /></template>')
  write('overview.vue', '<template><p>Ours</p></template>')
})
afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('a component’s playground preview', () => {
  test('is listed beside its examples, from its component file', async () => {
    const system = await harbor()
    const components = path.join(system.dir, 'components')
    expect(systemPreviews(system)).toEqual([
      {
        id: exampleId(HARBOR, 'button', 'Default'),
        file: path.join(components, 'button/Button.examples.vue'),
        example: 'Default',
      },
      {
        id: exampleId(HARBOR, 'button', 'Loud'),
        file: path.join(components, 'button/Button.examples.vue'),
        example: 'Loud',
      },
      {
        id: playgroundId(HARBOR, 'button'),
        file: path.join(components, 'button/Button.vue'),
        playground: true,
      },
      {
        id: exampleId(HARBOR, 'card', 'Plain'),
        file: path.join(components, 'card/card.examples.vue'),
        example: 'Plain',
      },
      {
        id: playgroundId(HARBOR, 'icon-button'),
        file: path.join(components, 'IconButton.vue'),
        playground: true,
      },
      { id: overviewId(HARBOR), file: path.join(system.dir, 'overview.vue') },
    ])
  })

  test('the catalog names it per component, and none without a component file', async () => {
    const catalog = systemCatalog(await harbor(), root)
    const playground = Object.fromEntries(
      catalog.components.map(({ slug, playground }) => [slug, playground]),
    )
    expect(playground).toEqual({
      button: playgroundId(HARBOR, 'button'),
      card: null,
      'icon-button': playgroundId(HARBOR, 'icon-button'),
    })
    const ids = systemPreviews(await harbor()).map(({ id }) => id)
    for (const id of Object.values(playground))
      if (id) expect(ids).toContain(id)
  })
})
