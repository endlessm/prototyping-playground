// Creating a prototype, as the New prototype dialog and `yarn new` do: a
// folder named after the title in your own space, its metadata, and one
// empty starting view, each with a new permanent identity. A temp studio
// with Ada (the Admin) and Ben, an active and an archived system.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { identity as view } from '../../src/modules/prototypes/types/view/identity'
import { createPrototype } from '../../tooling/files/prototypes'
import { FileServiceError } from '../../tooling/files/source'
import { isResourceId } from '../../tooling/identity/resource-id'

const ACTIVE = 'syst3m0000000001'
const OLD = 'syst3m0000000002'
const EXISTING = 'dem0000000000002'
const EXISTING_VIEW = 'vw00000000000002'

let root: string
let actor: string | null
beforeEach(() => {
  root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'create-')))
  fs.cpSync('tests/fixtures/contributors', path.join(root, 'contributors'), {
    recursive: true,
  })
  write(
    'studio.config.json',
    JSON.stringify({
      name: 'Test',
      admins: ['ada0000000000001'],
      systems: ['active', 'old'],
      defaultSystem: ACTIVE,
    }),
  )
  write(
    'src/systems/active/system.ts',
    `export default { studioId: '${ACTIVE}', status: 'active' }\n`,
  )
  write(
    'src/systems/old/system.ts',
    `export default { studioId: '${OLD}', status: 'archived' }\n`,
  )
  write(
    'src/prototypes/ben/demo/meta.json',
    JSON.stringify({
      title: 'Demo',
      studioId: EXISTING,
      ownerContributorId: 'ben0000000000002',
      systemId: null,
    }),
  )
  write(
    'src/prototypes/ben/demo/Start.vue',
    `<!-- @studio-id ${EXISTING_VIEW} -->\n`,
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
const types = [{ id: 'view', extensions: ['.vue'], identity: view }]
const create = (title: unknown, system?: unknown) =>
  createPrototype(
    {
      root,
      fileTypes: types,
      identify: () => ({ key: actor, email: `${actor}@endless.example` }),
    },
    system === undefined ? { title } : { title, system },
  )
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function refusal(run: () => unknown) {
  let error: unknown
  try {
    run()
  } catch (caught) {
    error = caught
  }
  expect(error).toBeInstanceOf(FileServiceError)
  return error as FileServiceError
}

describe('creating a prototype', () => {
  test('[PR-15] [CL-161] makes the folder from the title, with its metadata and one empty starting view', () => {
    const created = create('  Agent Config ')
    expect(created.folder).toBe('src/prototypes/ben/agent-config')
    const meta = json('src/prototypes/ben/agent-config/meta.json')
    expect(meta).toEqual({
      formatVersion: 1,
      title: 'Agent Config',
      created: today(),
      studioId: created.id,
      ownerContributorId: 'ben0000000000002',
      systemId: ACTIVE,
    })
    expect(isResourceId(created.id)).toBe(true)
    expect(
      fs.readdirSync(at('src/prototypes/ben/agent-config')).sort(),
    ).toEqual(['Prototype.vue', 'meta.json'])
    const source = read('src/prototypes/ben/agent-config/Prototype.vue')
    expect(source).toBe(`<!-- @studio-id ${created.artifact} -->\n`)
    expect(isResourceId(created.artifact)).toBe(true)
    expect(new Set([created.id, created.artifact, EXISTING]).size).toBe(3)
  })

  test('[PR-15] [PR-17] takes a system by its folder name or permanent ID, or none', () => {
    expect(
      json(`${create('By key', 'active').folder}/meta.json`).systemId,
    ).toBe(ACTIVE)
    expect(json(`${create('By id', ACTIVE).folder}/meta.json`).systemId).toBe(
      ACTIVE,
    )
    expect(json(`${create('None', null).folder}/meta.json`).systemId).toBe(null)
  })

  test('[PR-16] refuses with a plain message and leaves nothing behind', () => {
    const before = fs.readdirSync(at('src/prototypes/ben'))
    const cases: [unknown, unknown, RegExp][] = [
      ['   ', undefined, /^Add a title\.$/],
      ['!!!', undefined, /^Use at least one letter or number in the title\.$/],
      ['A <b>', undefined, /^Use plain text in the title/],
      ['Demo', undefined, /^You already have a prototype named “Demo”\./],
      ['Mystery', 'nowhere', /^There’s no system “nowhere”/],
      ['Retired', 'old', /archived/],
    ]
    for (const [title, system, message] of cases)
      expect(refusal(() => create(title, system)).message).toMatch(message)
    expect(fs.readdirSync(at('src/prototypes/ben'))).toEqual(before)
  })

  test('[PR-16] someone who isn’t a registered contributor is asked to get added', () => {
    actor = null
    const error = refusal(() => create('Agent Config'))
    expect(error.status).toBe(403)
    expect(error.message).toMatch(/Ask your agent to add you\./)
    expect(fs.existsSync(at('src/prototypes/null'))).toBe(false)
  })
})
