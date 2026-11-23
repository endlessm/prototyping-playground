// The Lab Playground's drafts of a system's files: written by whoever may
// change the system (an Admin or its maintainer, while it is active), kept
// apart from the file until Save, removed when they match it, and
// discarded by anyone. A temp studio with Ada (the Admin) and Ben, who
// maintains Harbor. [LAB-07]
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { draftMap } from '../../tooling/files/drafts-folder'
import { FileServiceError } from '../../tooling/files/source'
import { createSystemDraftService } from '../../tooling/files/system-drafts'

const HARBOR = 'hrbr000000000001'
const LANTERN = '1ntrn00000000002'
const BUTTON = 'components/button/button.vue'
const SOURCE = '<template><button class="p-2">Go</button></template>\n'

let root: string
let actor: string | null
const at = (file: string) => path.join(root, file)
function write(file: string, text: string) {
  fs.mkdirSync(path.dirname(at(file)), { recursive: true })
  fs.writeFileSync(at(file), text)
}
const declaration = (label: string, studioId: string) =>
  `export default ${JSON.stringify({
    label,
    status: 'active',
    role: 'prototype',
    styling: 'custom',
    colorModes: ['light'],
    docs: 'warn',
    libraries: [],
    origin: null,
    studioId,
    app: { factory: { from: 'app.ts', name: 'createApp' } },
  })}\n`

beforeEach(() => {
  root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'drafts-')))
  fs.cpSync('tests/fixtures/contributors', at('contributors'), {
    recursive: true,
  })
  write(
    'studio.config.json',
    JSON.stringify({
      name: 'Test',
      systems: ['harbor', 'lantern'],
      admins: ['ada0000000000001'],
      systemMaintainers: { [HARBOR]: ['ben0000000000002'] },
    }),
  )
  write('src/systems/harbor/system.ts', declaration('Harbor', HARBOR))
  write(`src/systems/harbor/${BUTTON}`, SOURCE)
  write('src/systems/lantern/system.ts', declaration('Lantern', LANTERN))
  write(`src/systems/lantern/${BUTTON}`, SOURCE)
  actor = 'ben'
})
afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

const service = () =>
  createSystemDraftService({
    root,
    draftsFolder: at('.studio/drafts'),
    identify: () => ({ key: actor, email: `${actor}@endless.example` }),
  })
const draftFile = (system: string) => at(`.studio/drafts/${system}/${BUTTON}`)

async function refusal(promise: Promise<unknown>) {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught,
  )
  expect(error).toBeInstanceOf(FileServiceError)
  return error as FileServiceError
}

describe('[LAB-07] a component’s draft', () => {
  test('is written beside the file, which stays as it was, in a folder Git ignores', async () => {
    const edited = SOURCE.replace('p-2', 'p-4')
    expect(
      await service().write({ system: HARBOR, path: BUTTON, content: edited }),
    ).toEqual({ draft: true })
    expect(fs.readFileSync(draftFile(HARBOR), 'utf8')).toBe(edited)
    expect(fs.readFileSync(at(`src/systems/harbor/${BUTTON}`), 'utf8')).toBe(
      SOURCE,
    )
    expect(fs.readFileSync(at('.studio/drafts/.gitignore'), 'utf8')).toBe('*\n')
    expect(await service().read({ system: HARBOR, path: BUTTON })).toEqual({
      draft: edited,
    })
    expect(await service().list(HARBOR)).toEqual({ files: [BUTTON] })
  })

  test('that matches the file again is no draft', async () => {
    await service().write({ system: HARBOR, path: BUTTON, content: 'x' })
    expect(
      await service().write({ system: HARBOR, path: BUTTON, content: SOURCE }),
    ).toEqual({ draft: false })
    expect(fs.existsSync(draftFile(HARBOR))).toBe(false)
    expect(await service().read({ system: HARBOR, path: BUTTON })).toEqual({
      draft: null,
    })
  })

  test('is written only by someone who may change the system, and discarded by anyone', async () => {
    const denied = await refusal(
      service().write({ system: LANTERN, path: BUTTON, content: 'x' }),
    )
    expect(denied.status).toBe(403)
    expect(fs.existsSync(draftFile(LANTERN))).toBe(false)

    actor = 'ada'
    await service().write({ system: LANTERN, path: BUTTON, content: 'x' })
    expect(fs.existsSync(draftFile(LANTERN))).toBe(true)
    actor = 'ben'
    expect(await service().discard({ system: LANTERN, path: BUTTON })).toEqual({
      draft: false,
    })
    expect(fs.existsSync(draftFile(LANTERN))).toBe(false)
  })

  test('reaches only the files the source route reaches', async () => {
    for (const path of ['../lantern/system.ts', '.hidden.vue', 'nope.vue'])
      expect(
        (await refusal(service().write({ system: HARBOR, path, content: 'x' })))
          .status,
      ).toBe(404)
    expect((await refusal(service().list('nobody000000000'))).status).toBe(404)
  })

  test('stands in for its file, and back', () => {
    const system = at('src/systems/harbor')
    const drafts = at('.studio/drafts/hrbr')
    const { draftOf, originOf } = draftMap(system, drafts)
    expect(draftOf(path.join(system, 'components/a.vue'))).toBe(
      path.join(drafts, 'components/a.vue'),
    )
    expect(originOf(path.join(drafts, 'components/a.vue'))).toBe(
      path.join(system, 'components/a.vue'),
    )
    expect(draftOf(at('src/systems/lantern/a.vue'))).toBeNull()
    expect(originOf(system)).toBeNull()
  })
})
