// The file service's access to a system's own source: its declaration,
// stylesheet, components, Context and Skills, saved over the version read,
// by an Admin or one of the system's maintainers while it is active. A temp
// studio with Ada (the Admin) and Ben, who maintains Harbor.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { FileServiceError, versionOf } from '../../tooling/files/source'
import { createSystemSourceService } from '../../tooling/files/system-source'

const HARBOR = 'hrbr000000000001'
const LANTERN = '1ntrn00000000002'
const ATTIC = 'attc000000000003'

let root: string
let actor: string | null

const at = (file: string) => path.join(root, file)
function write(file: string, text: string) {
  fs.mkdirSync(path.dirname(at(file)), { recursive: true })
  fs.writeFileSync(at(file), text)
}
const declaration = (label: string, studioId: string, status = 'active') =>
  `export default ${JSON.stringify({
    label,
    status,
    role: 'prototype',
    styling: 'custom',
    colorModes: ['light'],
    docs: 'warn',
    libraries: [],
    origin: null,
    studioId,
    app: {
      factory: { from: 'app.ts', name: 'createApp' },
      stylesheet: 'styles/theme.css',
    },
  })}\n`

beforeEach(() => {
  root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'systems-')))
  fs.cpSync('tests/fixtures/contributors', at('contributors'), {
    recursive: true,
  })
  write(
    'studio.config.json',
    JSON.stringify({
      name: 'Test',
      systems: ['attic', 'harbor', 'lantern'],
      admins: ['ada0000000000001'],
      systemMaintainers: { [HARBOR]: ['ben0000000000002'] },
    }),
  )
  write('src/systems/harbor/system.ts', declaration('Harbor', HARBOR))
  write('src/systems/harbor/app.ts', 'export const createApp = () => {}\n')
  write('src/systems/harbor/styles/theme.css', '.harbor { --x: 1px; }\n')
  write('src/systems/harbor/context/voice.md', '# Voice\n')
  write('src/systems/harbor/context/notes.txt', 'not a document')
  write('src/systems/harbor/skills/build/SKILL.md', '---\nname: build\n---\n')
  write('src/systems/harbor/components/button/button.md', '# Button\n')
  write('src/systems/lantern/system.ts', declaration('Lantern', LANTERN))
  write('src/systems/attic/system.ts', declaration('Attic', ATTIC, 'archived'))
  write('src/systems/attic/context/old.md', '# Old\n')
  actor = 'ben'
})
afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

const service = () =>
  createSystemSourceService({
    root,
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

describe('a system’s source', () => {
  test('[SY-119] [SY-115] its declaration, stylesheet, components, Context and Skills open, with a version', async () => {
    for (const file of [
      'system.ts',
      'styles/theme.css',
      'components/button/button.md',
      'context/voice.md',
      'skills/build/SKILL.md',
    ]) {
      const source = await service().read({ system: HARBOR, path: file })
      expect(source.path).toBe(`src/systems/harbor/${file}`)
      expect(source.editable).toBe(true)
      expect(source.version).toBe(versionOf(source.content))
    }
  })

  test('[SY-119] nothing else in or outside the folder is reachable', async () => {
    for (const file of [
      'app.ts',
      'context/notes.txt',
      '../lantern/system.ts',
      'context/../system.ts',
      '/etc/passwd',
      'context/missing.md',
    ]) {
      const error = await refusal(
        service().read({ system: HARBOR, path: file }),
      )
      expect(error.status, file).toBe(404)
    }
    const error = await refusal(
      service().read({ system: 'zzzz000000000000', path: 'system.ts' }),
    )
    expect(error.status).toBe(404)
  })

  test('[SY-119] a maintainer saves over the version read; a change since is a conflict', async () => {
    const source = await service().read({
      system: HARBOR,
      path: 'context/voice.md',
    })
    write('src/systems/harbor/context/voice.md', '# Changed elsewhere\n')
    const conflict = await refusal(
      service().save({
        system: HARBOR,
        path: 'context/voice.md',
        content: '# Mine\n',
        base: source.version,
      }),
    )
    expect(conflict.code).toBe('changed')

    const fresh = await service().read({
      system: HARBOR,
      path: 'context/voice.md',
    })
    const saved = await service().save({
      system: HARBOR,
      path: 'context/voice.md',
      content: '# Mine\n',
      base: fresh.version,
    })
    expect(saved.version).toBe(versionOf('# Mine\n'))
    expect(
      fs.readFileSync(at('src/systems/harbor/context/voice.md'), 'utf8'),
    ).toBe('# Mine\n')
  })

  test('[SY-119] others read, and are told why they can’t save', async () => {
    const lantern = await service().read({ system: LANTERN, path: 'system.ts' })
    expect(lantern.editable).toBe(false)
    expect(lantern.reason).toBe(
      'Only an Admin or a maintainer of the Lantern system can do this. You are recognised, but not one of its maintainers.',
    )
    const denied = await refusal(
      service().save({
        system: LANTERN,
        path: 'system.ts',
        content: 'x',
        base: lantern.version,
      }),
    )
    expect(denied.status).toBe(403)

    const attic = await service().read({
      system: ATTIC,
      path: 'context/old.md',
    })
    expect(attic.reason).toBe(
      "The Attic system isn't available for this: it is archived.",
    )

    actor = 'ada'
    expect(
      (await service().read({ system: LANTERN, path: 'system.ts' })).editable,
    ).toBe(true)
    actor = null
    const nobody = await service().read({ system: HARBOR, path: 'system.ts' })
    expect(nobody.editable).toBe(false)
    expect(nobody.reason).toContain("doesn't match a contributor profile")
  })
})
