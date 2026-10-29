// The dev server's file service: reading an artifact's source and saving it
// with a version check, only where the person working may change it. A temp
// studio with Ada (the Admin) and Ben, each with a prototype.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { identity as view } from '../../src/modules/prototypes/types/view/identity'
import { createFileService, FileServiceError } from '../../tooling/files/source'

const ADA_DEMO = 'dem0000000000001'
const BEN_DEMO = 'dem0000000000002'
const ADA_VIEW = 'vw00000000000001'
const BEN_VIEW = 'vw00000000000002'
const HELPER = 'vw00000000000003'
const VIEW = (id: string, text = 'Hi') =>
  `<!-- @studio-id ${id} -->\n<template>\n  <p>${text}</p>\n</template>\n`

let root: string
let actor: string | null
beforeEach(() => {
  root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'files-')))
  fs.cpSync('tests/fixtures/contributors', path.join(root, 'contributors'), {
    recursive: true,
  })
  fs.writeFileSync(
    path.join(root, 'studio.config.json'),
    JSON.stringify({ name: 'Test', admins: ['ada0000000000001'] }),
  )
  for (const [owner, id, ownerId, viewId] of [
    ['ada', ADA_DEMO, 'ada0000000000001', ADA_VIEW],
    ['ben', BEN_DEMO, 'ben0000000000002', BEN_VIEW],
  ] as const) {
    write(
      `src/prototypes/${owner}/demo/meta.json`,
      JSON.stringify({
        title: 'Demo',
        studioId: id,
        ownerContributorId: ownerId,
        systemId: null,
      }),
    )
    write(`src/prototypes/${owner}/demo/flows/Start.vue`, VIEW(viewId))
  }
  write('src/prototypes/ben/demo/_parts/Helper.vue', VIEW(HELPER))
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
const service = () =>
  createFileService({
    root,
    fileTypes: [{ id: 'view', extensions: ['.vue'], identity: view }],
    identify: () => ({ key: actor, email: `${actor}@endless.example` }),
  })

async function refusal(promise: Promise<unknown>) {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught,
  )
  expect(error).toBeInstanceOf(FileServiceError)
  return error as FileServiceError
}

describe('reading', () => {
  test('[CL-123] an artifact is read by its prototype’s and its own permanent IDs, with a version', async () => {
    const source = await service().read({
      prototype: BEN_DEMO,
      artifact: BEN_VIEW,
    })
    expect(source).toMatchObject({
      path: 'src/prototypes/ben/demo/flows/Start.vue',
      content: VIEW(BEN_VIEW),
      editable: true,
    })
    expect(source.version).toMatch(/^[0-9a-f]{16}$/)
  })

  test('[CL-123] helpers, unknown IDs and other prototypes’ artifacts are not found', async () => {
    for (const ids of [
      { prototype: BEN_DEMO, artifact: HELPER },
      { prototype: BEN_DEMO, artifact: ADA_VIEW },
      { prototype: 'zzz0000000000009', artifact: BEN_VIEW },
      { prototype: '../ben', artifact: BEN_VIEW },
    ]) {
      const error = await refusal(service().read(ids))
      expect(error.status).toBe(404)
      expect(error.message).toBe('This file no longer exists.')
    }
  })

  test('[PR-136] someone else’s prototype reads as read-only, with the reason', async () => {
    const source = await service().read({
      prototype: ADA_DEMO,
      artifact: ADA_VIEW,
    })
    expect(source.editable).toBe(false)
    expect(source.reason).toBe(
      'This prototype belongs to someone else. You can change only your own.',
    )
  })

  test('[PR-136] an Admin may change every prototype', async () => {
    actor = 'ada'
    const source = await service().read({
      prototype: BEN_DEMO,
      artifact: BEN_VIEW,
    })
    expect(source.editable).toBe(true)
  })

  test('[PR-136] an archived prototype reads as read-only, even for its owner', async () => {
    const meta = at('src/prototypes/ben/demo/meta.json')
    fs.writeFileSync(
      meta,
      JSON.stringify({
        ...JSON.parse(fs.readFileSync(meta, 'utf8')),
        status: 'archived',
      }),
    )
    const source = await service().read({
      prototype: BEN_DEMO,
      artifact: BEN_VIEW,
    })
    expect(source.editable).toBe(false)
    expect(source.reason).toBe(
      'This prototype is archived. Restore it to change it.',
    )
  })

  test('[PR-136] someone the studio doesn’t recognise reads everything read-only, told how to register', async () => {
    actor = null
    const source = await service().read({
      prototype: BEN_DEMO,
      artifact: BEN_VIEW,
    })
    expect(source.editable).toBe(false)
    expect(source.reason).toContain('yarn studio join')
  })
})

describe('saving', () => {
  const save = async (content: string, base?: string) => {
    const files = service()
    const read = await files.read({ prototype: BEN_DEMO, artifact: BEN_VIEW })
    return files.save({
      prototype: BEN_DEMO,
      artifact: BEN_VIEW,
      content,
      base: base ?? read.version,
    })
  }

  test('[CL-123] [PR-132] saving the version you read writes the file and returns its new version', async () => {
    const before = await service().read({
      prototype: BEN_DEMO,
      artifact: BEN_VIEW,
    })
    const saved = await save(VIEW(BEN_VIEW, 'Saved'))
    expect(
      fs.readFileSync(at('src/prototypes/ben/demo/flows/Start.vue'), 'utf8'),
    ).toBe(VIEW(BEN_VIEW, 'Saved'))
    expect(saved.version).not.toBe(before.version)
    expect(saved.warnings).toEqual([])
    const after = await service().read({
      prototype: BEN_DEMO,
      artifact: BEN_VIEW,
    })
    expect(after.version).toBe(saved.version)
  })

  test('[PR-132] a file that changed on disk since it was read is not overwritten', async () => {
    const files = service()
    const read = await files.read({ prototype: BEN_DEMO, artifact: BEN_VIEW })
    write('src/prototypes/ben/demo/flows/Start.vue', VIEW(BEN_VIEW, 'Agent'))
    const error = await refusal(
      files.save({
        prototype: BEN_DEMO,
        artifact: BEN_VIEW,
        content: VIEW(BEN_VIEW, 'Mine'),
        base: read.version,
      }),
    )
    expect(error).toMatchObject({ status: 409, code: 'changed' })
    expect(error.message).toBe('This file changed on disk since you opened it.')
    expect(
      fs.readFileSync(at('src/prototypes/ben/demo/flows/Start.vue'), 'utf8'),
    ).toBe(VIEW(BEN_VIEW, 'Agent'))
  })

  test('[PR-136] [CL-123] the server refuses a save outside your scope, and says why', async () => {
    const files = service()
    const read = await files.read({ prototype: ADA_DEMO, artifact: ADA_VIEW })
    const error = await refusal(
      files.save({
        prototype: ADA_DEMO,
        artifact: ADA_VIEW,
        content: VIEW(ADA_VIEW, 'Ben was here'),
        base: read.version,
      }),
    )
    expect(error).toMatchObject({ status: 403, code: 'owner' })
    expect(error.message).toBe(
      'This prototype belongs to someone else. You can change only your own.',
    )
    expect(
      fs.readFileSync(at('src/prototypes/ada/demo/flows/Start.vue'), 'utf8'),
    ).toBe(VIEW(ADA_VIEW))
  })

  test('[PR-136] permissions are checked again on every save', async () => {
    const files = service()
    const read = await files.read({ prototype: BEN_DEMO, artifact: BEN_VIEW })
    actor = null
    const error = await refusal(
      files.save({
        prototype: BEN_DEMO,
        artifact: BEN_VIEW,
        content: VIEW(BEN_VIEW, 'Later'),
        base: read.version,
      }),
    )
    expect(error).toMatchObject({ status: 403, code: 'identity' })
  })

  test('[CL-123] a save must keep the artifact’s permanent ID', async () => {
    const error = await refusal(save(VIEW('vw00000000000009')))
    expect(error).toMatchObject({ status: 409, code: 'identity' })
    expect(error.message).toBe(
      'Keep the artifact’s permanent studio ID when editing its source.',
    )
  })

  test('[CL-123] files larger than any committed file are refused', async () => {
    const error = await refusal(save(VIEW(BEN_VIEW, 'x'.repeat(800 * 1024))))
    expect(error.status).toBe(413)
  })

  test('[CL-123] a link that leads outside the prototype is never followed', async () => {
    const outside = at('outside.vue')
    fs.writeFileSync(outside, VIEW('vw00000000000004'))
    const link = at('src/prototypes/ben/demo/Linked.vue')
    try {
      fs.symlinkSync(outside, link, 'file')
    } catch {
      return // Windows without the right to create links.
    }
    const error = await refusal(
      service().read({ prototype: BEN_DEMO, artifact: 'vw00000000000004' }),
    )
    expect(error.status).toBe(404)
  })
})
