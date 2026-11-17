// Experiments through the Lab's service, on Node, as the dev server's
// handler runs it: New experiment makes the person's "<Component>
// experiments" prototype the first time, with the component's system, and a
// view in it that starts from the component's rendering source; Duplicate
// copies anyone's experiment into your own. The manifest lists every
// experiment with its component, which is how the Lab finds them. A temp
// studio with Ada and Ben and the real Endless Studios button and sidebar.
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { identity as view } from '../../src/modules/prototypes/types/view/identity'
import {
  createExperiment,
  duplicateExperiment,
  type ExperimentsContext,
} from '../../src/modules/lab/experiments/service'
import { FileServiceError } from '../../tooling/files/source'
import { buildManifest, forDeploy } from '../../tooling/manifest/build'
import { loadSystems } from '../../tooling/systems/registry'

const ENDLESS = '8x5spen6xtvp96a9'
const ADA_EXPERIMENTS = 'adaexp0000000001'
const ADA_ROUNDER = 'adarnd0000000001'
const types = [{ id: 'view', extensions: ['.vue'], identity: view }]

let root: string
let actor: string | null
beforeEach(() => {
  fs.mkdirSync('.e2e', { recursive: true })
  root = fs.realpathSync(fs.mkdtempSync(path.resolve('.e2e/lab-experiments-')))
  fs.cpSync('tests/fixtures/contributors', at('contributors'), {
    recursive: true,
  })
  // The real system's declaration and the two components the tests use.
  for (const file of [
    'system.ts',
    'components/button',
    'components/studio-sidebar',
  ])
    fs.cpSync(
      path.join('src/systems/endless-studios', file),
      at(`src/systems/endless-studios/${file}`),
      { recursive: true },
    )
  write(
    'studio.config.json',
    JSON.stringify({
      name: 'Test',
      admins: ['ada0000000000001'],
      systems: ['endless-studios'],
      defaultSystem: ENDLESS,
    }),
  )
  write(
    'src/prototypes/ada/button-experiments/meta.json',
    JSON.stringify({
      formatVersion: 1,
      title: 'Button experiments',
      created: '2026-11-10',
      studioId: ADA_EXPERIMENTS,
      ownerContributorId: 'ada0000000000001',
      systemId: ENDLESS,
    }),
  )
  write(
    'src/prototypes/ada/button-experiments/Rounder.vue',
    `<!-- @studio-id ${ADA_ROUNDER} -->\n<!-- @lab-experiment ${ENDLESS} button 2026-11-10 -->\n<template>\n  <UButton class="rounded-full">Invite Learners</UButton>\n</template>\n`,
  )
  actor = 'ben'
})
afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

const at = (file: string) => path.join(root, file)
function write(file: string, text: string) {
  fs.mkdirSync(path.dirname(at(file)), { recursive: true })
  fs.writeFileSync(at(file), text)
}
const read = (file: string) => fs.readFileSync(at(file), 'utf8')
const json = (file: string) => JSON.parse(read(file))
const context = (): ExperimentsContext => ({
  root,
  fileTypes: types,
  identify: () => ({
    key: actor,
    email: `${actor ?? 'nobody'}@endless.example`,
  }),
})
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
async function manifest() {
  const { systems } = await loadSystems(root, { systems: ['endless-studios'] })
  return buildManifest({ root, systems, fileTypes: types })
}
async function refusal(run: () => Promise<unknown>) {
  let error: unknown
  try {
    await run()
  } catch (caught) {
    error = caught
  }
  expect(error).toBeInstanceOf(FileServiceError)
  return error as FileServiceError
}

describe('New experiment', () => {
  test('[LAB-42] the first one makes your “Button experiments” prototype, with the component’s system and only that view', async () => {
    const created = await createExperiment(context(), {
      system: ENDLESS,
      component: 'button',
      name: 'Softer corners',
    })
    const folder = 'src/prototypes/ben/button-experiments'
    expect(json(`${folder}/meta.json`)).toMatchObject({
      title: 'Button experiments',
      studioId: created.prototype,
      ownerContributorId: 'ben0000000000002',
      systemId: ENDLESS,
      created: today(),
    })
    expect(fs.readdirSync(at(folder)).sort()).toEqual([
      'Softer corners.vue',
      'meta.json',
    ])
    expect(read(`${folder}/Softer corners.vue`)).toBe(
      [
        `<!-- @studio-id ${created.artifact} -->`,
        `<!-- @lab-experiment ${ENDLESS} button ${today()} -->`,
        '<template>',
        '  <div class="flex min-h-40 flex-wrap items-center justify-center gap-3 p-6">',
        '    <UButton>Invite Learners</UButton>',
        '  </div>',
        '</template>',
        '',
      ].join('\n'),
    )
  })

  test('[LAB-42] the next ones go into the same prototype, even after it is renamed', async () => {
    const first = await createExperiment(context(), {
      system: ENDLESS,
      component: 'button',
      name: 'One',
    })
    const meta = 'src/prototypes/ben/button-experiments/meta.json'
    write(meta, JSON.stringify({ ...json(meta), title: 'Buttons I tried' }))
    const second = await createExperiment(context(), {
      system: ENDLESS,
      component: 'button',
      name: 'Two',
    })
    expect(second.prototype).toBe(first.prototype)
    expect(second.artifact).not.toBe(first.artifact)
    expect(
      fs.readdirSync(at('src/prototypes/ben/button-experiments')).sort(),
    ).toEqual(['One.vue', 'Two.vue', 'meta.json'])
    expect(fs.readdirSync(at('src/prototypes/ben'))).toEqual([
      'button-experiments',
    ])
  })

  test('[LAB-42] a composite starts from its own source, and gets a prototype of its own', async () => {
    const created = await createExperiment(context(), {
      system: ENDLESS,
      component: 'studio-sidebar',
      name: 'Compact',
    })
    const folder = 'src/prototypes/ben/studio-sidebar-experiments'
    expect(json(`${folder}/meta.json`).title).toBe('Studio sidebar experiments')
    const source = read(`${folder}/Compact.vue`)
    expect(source).toContain(`<!-- @studio-id ${created.artifact} -->`)
    expect(source).toContain('<StudioSidebar />')
    expect(source).toContain(
      "from '../../../systems/endless-studios/runtime/auth';",
    )
  })

  test('[LAB-47] refuses someone who hasn’t joined, a taken name and an unknown component, leaving nothing behind', async () => {
    actor = null
    expect(
      (
        await refusal(() =>
          createExperiment(context(), {
            system: ENDLESS,
            component: 'button',
            name: 'Mine',
          }),
        )
      ).message,
    ).toMatch(/doesn't match a contributor profile.*yarn studio join/)
    actor = 'ben'
    await createExperiment(context(), {
      system: ENDLESS,
      component: 'button',
      name: 'Mine',
    })
    const taken = await refusal(() =>
      createExperiment(context(), {
        system: ENDLESS,
        component: 'button',
        name: 'Mine',
      }),
    )
    expect(taken.status).toBe(409)
    expect(taken.message).toBe(
      'You already have an experiment named “Mine”. Choose a different name.',
    )
    const unknown = await refusal(() =>
      createExperiment(context(), {
        system: ENDLESS,
        component: 'nope',
        name: 'Other',
      }),
    )
    expect(unknown.status).toBe(404)
    const nameless = await refusal(() =>
      createExperiment(context(), {
        system: ENDLESS,
        component: 'button',
        name: '  ',
      }),
    )
    expect(nameless.message).toBe('Add a name.')
    expect(
      fs.readdirSync(at('src/prototypes/ben/button-experiments')).sort(),
    ).toEqual(['Mine.vue', 'meta.json'])
  })
})

describe('Duplicate', () => {
  test('[LAB-41] copies Ada’s experiment into Ben’s own, with a new permanent ID and today’s date', async () => {
    const before = read('src/prototypes/ada/button-experiments/Rounder.vue')
    const copy = await duplicateExperiment(context(), {
      experiment: ADA_ROUNDER,
      name: 'Rounder',
    })
    expect(copy.artifact).not.toBe(ADA_ROUNDER)
    expect(read('src/prototypes/ben/button-experiments/Rounder.vue')).toBe(
      before.replace(ADA_ROUNDER, copy.artifact).replace('2026-11-10', today()),
    )
    expect(read('src/prototypes/ada/button-experiments/Rounder.vue')).toBe(
      before,
    )
    expect(
      json('src/prototypes/ben/button-experiments/meta.json').studioId,
    ).toBe(copy.prototype)
    const unknown = await refusal(() =>
      duplicateExperiment(context(), {
        experiment: 'zzzz000000000000',
        name: 'Nothing',
      }),
    )
    expect(unknown.status).toBe(404)
  })
})

describe('the manifest', () => {
  test('[LAB-41] lists every experiment view with its component, prototype and day', async () => {
    const created = await createExperiment(context(), {
      system: ENDLESS,
      component: 'button',
      name: 'Softer corners',
    })
    const { manifest: built, problems } = await manifest()
    expect(problems).toEqual([])
    expect(built.experiments).toEqual([
      {
        id: ADA_ROUNDER,
        title: 'Rounder',
        prototype: ADA_EXPERIMENTS,
        systemId: ENDLESS,
        component: 'button',
        created: '2026-11-10',
      },
      {
        id: created.artifact,
        title: 'Softer corners',
        prototype: created.prototype,
        systemId: ENDLESS,
        component: 'button',
        created: today(),
      },
    ])
  })

  test('[LAB-45] leaves out a marker naming another system, and the deployed site an archived prototype’s experiments', async () => {
    write(
      'src/prototypes/ada/button-experiments/Elsewhere.vue',
      `<!-- @studio-id adaels0000000001 -->\n<!-- @lab-experiment hrbr000000000001 button -->\n<template><p /></template>\n`,
    )
    expect(
      (await manifest()).manifest.experiments?.map(({ id }) => id),
    ).toEqual([ADA_ROUNDER])
    const meta = 'src/prototypes/ada/button-experiments/meta.json'
    write(meta, JSON.stringify({ ...json(meta), status: 'archived' }))
    expect(
      forDeploy(await manifest(), root).built.manifest.experiments,
    ).toEqual([])
  })
})
