// The file service's access to shared guidance: the Platform's and enabled
// modules' README, context, skills and contract files, and every Manual
// chapter file while the Manual is on. Anyone can read them; only an Admin
// saves them, over the version read. They can be shown in the file browser
// or opened in a code editor. A temp studio with Ada (the Admin) and Ben.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { createGuidanceSourceService } from '../../tooling/files/guidance-source'
import { FileServiceError, versionOf } from '../../tooling/files/source'

let root: string
let actor: string | null
let launched: { command: string; args: string[] }[]

const at = (file: string) => path.join(root, file)
function write(file: string, text = `# ${path.basename(file)}\n`) {
  fs.mkdirSync(path.dirname(at(file)), { recursive: true })
  fs.writeFileSync(at(file), text)
}
const module = (id: string) =>
  write(
    `src/modules/${id}/module.ts`,
    `export default { id: '${id}', label: '${id}' }\n`,
  )

beforeEach(() => {
  root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'guidance-')))
  fs.cpSync('tests/fixtures/contributors', at('contributors'), {
    recursive: true,
  })
  write(
    'studio.config.json',
    JSON.stringify({
      name: 'Test',
      modules: { documentation: true, canvas: true, diagrams: false },
      admins: ['ada0000000000001'],
    }),
  )
  module('documentation')
  module('canvas')
  module('diagrams')
  write('src/platform/README.md')
  write('src/platform/context/stack.md')
  write('src/platform/skills/manage-modules/SKILL.md')
  write('src/platform/skills/manage-modules/scripts/check.sh', 'echo ok\n')
  write('src/platform/notes.txt', 'not guidance')
  write('src/modules/documentation/README.md')
  write(
    'src/modules/documentation/pages/index.md',
    '---\ntitle: Overview\norder: 1\n---\n',
  )
  write('src/modules/documentation/pages/broken.md', '# No metadata\n')
  write('src/modules/canvas/CONTRACT.md')
  write('src/modules/diagrams/README.md')
  actor = 'ben'
  launched = []
})
afterEach(() => fs.rmSync(root, { recursive: true, force: true }))

const service = () =>
  createGuidanceSourceService({
    root,
    identify: () => ({ key: actor, email: `${actor}@endless.example` }),
    launch: async (command, args) => void launched.push({ command, args }),
    editors: [],
    platform: 'linux',
  })

async function refusal(promise: Promise<unknown>) {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught,
  )
  expect(error).toBeInstanceOf(FileServiceError)
  return error as FileServiceError
}

test('[PR-142] [PR-162] guidance and every Manual chapter file open; Ben reads them but can’t save', async () => {
  for (const file of [
    'src/platform/README.md',
    'src/platform/context/stack.md',
    'src/platform/skills/manage-modules/SKILL.md',
    'src/platform/skills/manage-modules/scripts/check.sh',
    'src/modules/canvas/CONTRACT.md',
    'src/modules/documentation/pages/index.md',
    // Broken metadata leaves it out of the Manual, not out of reach.
    'src/modules/documentation/pages/broken.md',
  ]) {
    const source = await service().read({ path: file })
    expect(source.path).toBe(file)
    expect(source.version).toBe(versionOf(source.content))
    expect(source.editable, file).toBe(false)
    expect(source.reason).toContain('Only an Admin')
  }
})

test('[PR-162] nothing else is reachable, nor a turned-off module’s guidance', async () => {
  for (const file of [
    'src/platform/notes.txt',
    'src/modules/canvas/module.ts',
    'src/modules/diagrams/README.md',
    'studio.config.json',
    'src/platform/../studio.config.json',
    'src/platform/context/missing.md',
  ]) {
    const error = await refusal(service().read({ path: file }))
    expect(error.status, file).toBe(404)
  }
})

test('[PR-142] an Admin saves over the version read; a change since is a conflict', async () => {
  actor = 'ada'
  const file = 'src/modules/documentation/pages/index.md'
  const source = await service().read({ path: file })
  expect(source.editable).toBe(true)
  write(file, '---\ntitle: Changed elsewhere\norder: 1\n---\n')
  const conflict = await refusal(
    service().save({ path: file, content: 'mine', base: source.version }),
  )
  expect(conflict.code).toBe('changed')
  const fresh = await service().read({ path: file })
  await service().save({ path: file, content: 'mine', base: fresh.version })
  expect(fs.readFileSync(at(file), 'utf8')).toBe('mine')

  actor = 'ben'
  const refused = await refusal(
    service().save({ path: file, content: 'his', base: versionOf('mine') }),
  )
  expect(refused.status).toBe(403)
})

test('[PR-141] [PR-162] a guidance file shows in the file browser, or opens in a code editor when there is one', async () => {
  await service().reveal({ path: 'src/platform/context/stack.md' })
  expect(launched).toEqual([
    { command: 'xdg-open', args: [at('src/platform/context')] },
  ])
  const reply = await service().open({ path: 'src/platform/context/stack.md' })
  expect(reply).toMatchObject({ opened: false })
  const error = await refusal(service().reveal({ path: 'studio.config.json' }))
  expect(error.status).toBe(404)
})

test('[PR-145] with the Manual off, its chapters are out of reach and the rest stays', async () => {
  write(
    'studio.config.json',
    JSON.stringify({
      modules: { documentation: false, canvas: true },
      admins: ['ada0000000000001'],
    }),
  )
  const error = await refusal(
    service().read({ path: 'src/modules/documentation/pages/index.md' }),
  )
  expect(error.status).toBe(404)
  await expect(
    service().read({ path: 'src/platform/README.md' }),
  ).resolves.toMatchObject({ path: 'src/platform/README.md' })
})
