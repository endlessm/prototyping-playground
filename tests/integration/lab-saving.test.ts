// Saving a Breakdown's changes on Node, as the dev server's handlers run it:
// Save writes each change into the experiment's own file and answers its
// new version; it refuses someone who may not change the prototype (with
// the studio's own sentences), a file changed on disk since it was read,
// and a value the theme doesn't offer. Save as experiment and Save as my
// experiment make the experiment with the changes already written. The
// Lab's build data carries each experiment's tree, its Breakdown preview
// and its version, which the deployed site has too, without archived
// prototypes. A temp studio with Ada and Ben and the real Endless Studios
// button.
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { identity as view } from '../../src/modules/prototypes/types/view/identity'
import {
  createExperiment,
  duplicateExperiment,
  type ExperimentsContext,
} from '../../src/modules/lab/experiments/service'
import {
  saveExperiment,
  type RequestedChange,
} from '../../src/modules/lab/experiments/save'
import { experimentBreakdowns } from '../../src/modules/lab/experiments/trees'
import saveHandler from '../../src/modules/lab/server/save'
import { FileServiceError, versionOf } from '../../tooling/files/source'
import { experimentBreakdownId } from '../../tooling/systems/preview-ids'

const ENDLESS = '8x5spen6xtvp96a9'
const ADA_EXPERIMENTS = 'adaexp0000000001'
const ADA_ROUNDER = 'adarnd0000000001'
const ROUNDER = 'src/prototypes/ada/button-experiments/Rounder.vue'
const ROUNDER_SOURCE = `<!-- @studio-id ${ADA_ROUNDER} -->\n<!-- @lab-experiment ${ENDLESS} button 2026-11-10 -->\n<template>\n  <UButton class="rounded-full">Invite Learners</UButton>\n</template>\n`
const types = [{ id: 'view', extensions: ['.vue'], identity: view }]

let root: string
let actor: string | null
beforeEach(() => {
  fs.mkdirSync('.e2e', { recursive: true })
  root = fs.realpathSync(fs.mkdtempSync(path.resolve('.e2e/lab-saving-')))
  fs.cpSync('tests/fixtures/contributors', at('contributors'), {
    recursive: true,
  })
  for (const file of ['system.ts', 'components/button'])
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
  write(ROUNDER, ROUNDER_SOURCE)
  actor = 'ada'
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
const context = (): ExperimentsContext => ({
  root,
  fileTypes: types,
  identify: () => ({
    key: actor,
    email: `${actor ?? 'nobody'}@endless.example`,
  }),
})
const rounder = (
  changes: RequestedChange[],
  base = versionOf(ROUNDER_SOURCE),
) =>
  saveExperiment(context(), {
    prototype: ADA_EXPERIMENTS,
    artifact: ADA_ROUNDER,
    base,
    changes,
  })
const corners: RequestedChange = {
  node: 'root>UButton',
  slot: 'base',
  family: 'corners',
  value: 'xl',
}
const bold: RequestedChange = {
  node: 'root>UButton',
  slot: 'label',
  family: 'weight',
  value: 'bold',
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

describe('Save', () => {
  test('[LAB-SV-01] writes each change into the experiment’s file and answers its new version', async () => {
    const saved = await rounder([corners, bold])
    const expected = ROUNDER_SOURCE.replace(
      '<UButton class="rounded-full">',
      `<UButton :ui="{ label: 'font-bold' }" class="rounded-xl">`,
    )
    expect(read(ROUNDER)).toBe(expected)
    expect(saved).toEqual({
      version: versionOf(expected),
      saved: 2,
      skipped: [],
    })
  })

  test('[LAB-DK-04] the dial panel’s props go on the button’s tag as static attributes; one bound to code is left unsaved', async () => {
    const source = ROUNDER_SOURCE.replace(
      '<UButton class="rounded-full">',
      '<UButton class="rounded-full" :loading="busy" size="md">',
    )
    write(ROUNDER, source)
    const saved = await saveExperiment(context(), {
      prototype: ADA_EXPERIMENTS,
      artifact: ADA_ROUNDER,
      base: versionOf(source),
      changes: [corners],
      props: [
        { node: 'root>UButton', prop: 'size', value: 'xl' },
        { node: 'root>UButton', prop: 'variant', value: 'outline' },
        { node: 'root>UButton', prop: 'loading', value: true },
      ],
    })
    const expected = source.replace(
      '<UButton class="rounded-full" :loading="busy" size="md">',
      '<UButton class="rounded-xl" :loading="busy" size="xl" variant="outline">',
    )
    expect(read(ROUNDER)).toBe(expected)
    expect(saved).toEqual({
      version: versionOf(expected),
      saved: 3,
      skipped: [],
      skippedProps: [{ node: 'root>UButton', prop: 'loading' }],
    })
    // Over a version changed on disk since, nothing is written.
    const error = await refusal(() =>
      saveExperiment(context(), {
        prototype: ADA_EXPERIMENTS,
        artifact: ADA_ROUNDER,
        base: versionOf(source),
        changes: [],
        props: [{ node: 'root>UButton', prop: 'size', value: 'xs' }],
      }),
    )
    expect(error.status).toBe(409)
    expect(read(ROUNDER)).toBe(expected)
  })

  test('[LAB-SV-01] a piece inside another file is left unsaved and named', async () => {
    const inside = { ...corners, node: 'root>StudioSidebar>USidebar' }
    const saved = await rounder([corners, inside])
    expect(saved.saved).toBe(1)
    expect(saved.skipped).toEqual([
      { node: inside.node, slot: 'base', family: 'corners' },
    ])
  })

  test('[LAB-SV-03] refuses someone else’s experiment and someone who hasn’t joined, leaving the file', async () => {
    actor = 'ben'
    const owner = await refusal(() => rounder([corners]))
    expect(owner).toMatchObject({ status: 403, code: 'owner' })
    expect(owner.message).toBe(
      'This prototype belongs to someone else. You can change only your own.',
    )
    actor = null
    const stranger = await refusal(() => rounder([corners]))
    expect(stranger).toMatchObject({ status: 403, code: 'identity' })
    expect(stranger.message).toContain('yarn studio join')
    expect(read(ROUNDER)).toBe(ROUNDER_SOURCE)
  })

  test('[LAB-SV-03] refuses a file changed on disk since it was read', async () => {
    const edited = ROUNDER_SOURCE.replace('Invite Learners', 'Invite the team')
    write(ROUNDER, edited)
    const stale = await refusal(() => rounder([corners]))
    expect(stale).toMatchObject({ status: 409, code: 'changed' })
    expect(stale.message).toBe('This file changed on disk since you opened it.')
    expect(read(ROUNDER)).toBe(edited)
  })

  test('refuses a value the theme doesn’t offer, an unknown experiment and a view that is no experiment', async () => {
    expect(
      await refusal(() => rounder([{ ...corners, value: 'xl\' onclick="x' }])),
    ).toMatchObject({ status: 400, code: 'invalid' })
    expect(
      await refusal(() =>
        rounder([{ ...corners, slot: "base: 'x', evil" } as RequestedChange]),
      ),
    ).toMatchObject({ status: 400, code: 'invalid' })
    expect(
      await refusal(() =>
        saveExperiment(context(), {
          prototype: ADA_EXPERIMENTS,
          artifact: 'zzzzzzzzzzzzzzzz',
          base: 'x',
          changes: [corners],
        }),
      ),
    ).toMatchObject({ status: 404 })
    write(ROUNDER, ROUNDER_SOURCE.replace(/<!-- @lab-experiment[^\n]*\n/, ''))
    expect(
      await refusal(() => rounder([corners], versionOf(read(ROUNDER)))),
    ).toMatchObject({ status: 404 })
    expect(read(ROUNDER)).not.toContain('rounded-xl')
  })

  test('the handler takes only a POST with a body', async () => {
    const request = {
      root,
      contributorsFolder: 'contributors',
      me: 'ada',
      method: 'GET',
      body: null,
    }
    await expect(saveHandler(request)).rejects.toMatchObject({ status: 400 })
  })
})

describe('Save as experiment and Save as my experiment', () => {
  test('[LAB-SV-02] Save as experiment makes the experiment with the changes written', async () => {
    actor = 'ben'
    const made = await createExperiment(
      context(),
      { system: ENDLESS, component: 'button', name: 'Softer' },
      [corners],
    )
    expect(made).toMatchObject({ saved: 1, skipped: [] })
    expect(read('src/prototypes/ben/button-experiments/Softer.vue')).toContain(
      `    <UButton :ui="{ base: 'rounded-xl' }">Invite Learners</UButton>`,
    )
  })

  test('[LAB-SV-02] Save as my experiment copies Ada’s into Ben’s own with the changes, hers untouched', async () => {
    actor = 'ben'
    const made = await duplicateExperiment(
      context(),
      { experiment: ADA_ROUNDER, name: 'Rounder still' },
      [bold],
    )
    expect(made.saved).toBe(1)
    expect(
      read('src/prototypes/ben/button-experiments/Rounder still.vue'),
    ).toContain(
      `<UButton :ui="{ label: 'font-bold' }" class="rounded-full">Invite Learners</UButton>`,
    )
    expect(read(ROUNDER)).toBe(ROUNDER_SOURCE)
  })

  test('[LAB-SV-02] a change Save as experiment can’t place makes nothing, saying why', async () => {
    actor = 'ben'
    const inside = { ...corners, node: 'root>StudioSidebar>USidebar' }
    const refused = await refusal(() =>
      createExperiment(
        context(),
        { system: ENDLESS, component: 'button', name: 'Softer' },
        [corners, inside],
      ),
    )
    expect(refused.status).toBe(422)
    expect(refused.message).toBe(
      '1 change is to a piece inside other files, which an experiment can’t change, so nothing was saved. Your changes are still there.',
    )
    expect(fs.existsSync(at('src/prototypes/ben/button-experiments'))).toBe(
      false,
    )
    await refusal(() =>
      duplicateExperiment(
        context(),
        { experiment: ADA_ROUNDER, name: 'Rounder still' },
        [inside],
      ),
    )
    expect(fs.existsSync(at('src/prototypes/ben/button-experiments'))).toBe(
      false,
    )
  })

  test('a value the theme doesn’t offer makes nothing', async () => {
    actor = 'ben'
    await refusal(() =>
      createExperiment(
        context(),
        { system: ENDLESS, component: 'button', name: 'Softer' },
        [{ ...corners, value: 'enormous' }],
      ),
    )
    expect(fs.existsSync(at('src/prototypes/ben/button-experiments'))).toBe(
      false,
    )
  })
})

describe('the experiments’ Breakdowns', () => {
  test('[LAB-SV-05] each experiment’s tree from its own file, its Breakdown preview and its version', async () => {
    const found = await experimentBreakdowns({
      root,
      dev: true,
      fileTypes: types,
    })
    expect(Object.keys(found)).toEqual([ADA_ROUNDER])
    const rounderTree = found[ADA_ROUNDER]!
    expect(rounderTree.preview).toBe(experimentBreakdownId(ADA_ROUNDER))
    expect(rounderTree.version).toBe(versionOf(ROUNDER_SOURCE))
    expect(rounderTree.tree.tree).toMatchObject({
      id: 'root',
      name: 'Rounder',
      source: 'experiment',
      file: ROUNDER,
      children: [{ id: 'root>UButton', name: 'UButton', source: 'nuxt-ui' }],
    })
  })

  test('the deployed site leaves out archived prototypes’ experiments', async () => {
    const meta = 'src/prototypes/ada/button-experiments/meta.json'
    write(
      meta,
      JSON.stringify({ ...JSON.parse(read(meta)), status: 'archived' }),
    )
    expect(
      Object.keys(
        await experimentBreakdowns({ root, dev: false, fileTypes: types }),
      ),
    ).toEqual([])
    expect(
      Object.keys(
        await experimentBreakdowns({ root, dev: true, fileTypes: types }),
      ),
    ).toEqual([ADA_ROUNDER])
  })
})
