// The file service's trees of a system's Context and Skills: their files
// and folders, and the changes the navigation makes to them (new documents,
// folders, files and skills, rename, move within the section, delete to the
// computer's trash), checked against the sections' shape and made only by
// an Admin or one of the system's maintainers while it is active. A temp
// studio with Ada (the Admin) and Ben, who maintains Harbor.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { FileServiceError } from '../../tooling/files/source'
import { createSystemTree } from '../../tooling/files/system-tree'

const HARBOR = 'hrbr000000000001'
const LANTERN = '1ntrn00000000002'
const ATTIC = 'attc000000000003'

let root: string
let actor: string | null
let trashed: string[]
let released: string[]

const at = (file: string) => path.join(root, file)
const harbor = (file: string) => at(`src/systems/harbor/${file}`)
const exists = (file: string) => fs.existsSync(harbor(file))
const read = (file: string) => fs.readFileSync(harbor(file), 'utf8')
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
    app: { factory: { from: 'app.ts', name: 'createApp' } },
  })}\n`

beforeEach(() => {
  root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'trees-')))
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
  write('src/systems/harbor/context/voice.md', '# Voice\n')
  write('src/systems/harbor/context/flows/sign-in.md', '# Signing in\n')
  write(
    'src/systems/harbor/skills/build/SKILL.md',
    '---\nname: build\ndescription: Builds a flow.\n---\n\nSteps.\n',
  )
  write('src/systems/harbor/skills/build/scripts/check.mjs', 'export {}\n')
  write('src/systems/harbor/skills/review/SKILL.md', '---\nname: review\n---\n')
  write('src/systems/lantern/system.ts', declaration('Lantern', LANTERN))
  write('src/systems/attic/system.ts', declaration('Attic', ATTIC, 'archived'))
  write('src/systems/attic/context/old.md', '# Old\n')
  actor = 'ben'
  trashed = []
  released = []
})
afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

const tree = () =>
  createSystemTree({
    root,
    identify: () => ({ key: actor, email: `${actor}@endless.example` }),
    trash: async (file) => {
      trashed.push(path.relative(root, file).split(path.sep).join('/'))
      fs.rmSync(file, { recursive: true })
    },
    platform: 'win32',
    release: async (folder) => {
      released.push(path.relative(root, folder).split(path.sep).join('/'))
      return async () => {}
    },
  })

async function refusal(promise: Promise<unknown>) {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught,
  )
  expect(error).toBeInstanceOf(FileServiceError)
  return error as FileServiceError
}

describe('listing', () => {
  test('[SY-124] [SH-93] Context and Skills as trees, with whether you may change them', async () => {
    const listing = await tree().list({ system: HARBOR })
    expect(listing.folder).toBe('src/systems/harbor')
    expect(listing.editable).toBe(true)
    expect(listing.context).toEqual([
      { name: 'voice.md', path: 'voice.md', dir: false },
      {
        name: 'flows',
        path: 'flows',
        dir: true,
        children: [
          { name: 'sign-in.md', path: 'flows/sign-in.md', dir: false },
        ],
      },
    ])
    expect(listing.skills.map((node) => node.path)).toEqual(['build', 'review'])
    expect(listing.skills[0]!.children!.map((node) => node.path)).toEqual([
      'build/SKILL.md',
      'build/scripts',
    ])
  })

  test('[SH-93] an empty system lists empty sections', async () => {
    const listing = await tree().list({ system: LANTERN })
    expect(listing.context).toEqual([])
    expect(listing.skills).toEqual([])
  })

  test('[SY-124] others, and archived systems, are read-only, with the reason', async () => {
    const other = await tree().list({ system: LANTERN })
    expect(other.editable).toBe(false)
    expect(other.reason).toMatch(/Lantern/)
    actor = 'ada'
    const archived = await tree().list({ system: ATTIC })
    expect(archived.editable).toBe(false)
    expect(archived.context.map((node) => node.path)).toEqual(['old.md'])
  })
})

describe('[SY-124] Context', () => {
  test('a new document gets .md, a new folder is made', async () => {
    expect(
      await tree().create({
        system: HARBOR,
        section: 'context',
        parent: 'flows',
        name: 'checkout',
        kind: 'document',
      }),
    ).toEqual({ path: 'flows/checkout.md' })
    expect(read('context/flows/checkout.md')).toMatch(/^# Checkout\n/)
    await tree().create({
      system: HARBOR,
      section: 'context',
      parent: '',
      name: 'research',
      kind: 'folder',
    })
    expect(fs.statSync(harbor('context/research')).isDirectory()).toBe(true)
  })

  test('a document must end in .md, and names must be free', async () => {
    const wrong = await refusal(
      tree().create({
        system: HARBOR,
        section: 'context',
        parent: '',
        name: 'notes.txt',
        kind: 'document',
      }),
    )
    expect(wrong.status).toBe(400)
    expect(wrong.message).toBe(
      'Context documents are Markdown files, and end in .md.',
    )
    const taken = await refusal(
      tree().create({
        system: HARBOR,
        section: 'context',
        parent: '',
        name: 'voice.md',
        kind: 'document',
      }),
    )
    expect(taken.status).toBe(409)
  })

  test('rename keeps .md, and refuses another extension', async () => {
    expect(
      await tree().rename({
        system: HARBOR,
        section: 'context',
        path: 'voice.md',
        name: 'tone',
      }),
    ).toEqual({ path: 'tone.md' })
    expect(exists('context/tone.md')).toBe(true)
    const wrong = await refusal(
      tree().rename({
        system: HARBOR,
        section: 'context',
        path: 'tone.md',
        name: 'tone.txt',
      }),
    )
    expect(wrong.message).toBe(
      'Context documents are Markdown files, and end in .md.',
    )
    expect(
      await tree().rename({
        system: HARBOR,
        section: 'context',
        path: 'flows',
        name: 'journeys',
      }),
    ).toEqual({ path: 'journeys' })
    expect(released).toEqual(['src/systems/harbor/context/flows'])
  })

  test('moves inside Context, never out of it', async () => {
    expect(
      await tree().move({
        system: HARBOR,
        section: 'context',
        path: 'voice.md',
        to: 'flows',
      }),
    ).toEqual({ path: 'flows/voice.md', moved: true })
    expect(
      await tree().move({
        system: HARBOR,
        section: 'context',
        path: 'flows/voice.md',
        to: '',
      }),
    ).toEqual({ path: 'voice.md', moved: true })
    for (const to of ['../skills/build', '..'])
      expect(
        (
          await refusal(
            tree().move({
              system: HARBOR,
              section: 'context',
              path: 'voice.md',
              to,
            }),
          )
        ).status,
      ).toBe(404)
    const inside = await refusal(
      tree().move({
        system: HARBOR,
        section: 'context',
        path: 'flows',
        to: 'flows',
      }),
    )
    expect(inside.message).toBe('A folder can’t move inside itself.')
  })

  test('deletes to the computer’s trash', async () => {
    expect(
      await tree().remove({
        system: HARBOR,
        section: 'context',
        path: 'flows',
      }),
    ).toEqual({ trashedTo: 'recycle-bin' })
    expect(trashed).toEqual(['src/systems/harbor/context/flows'])
  })

  test('only Admins and the system’s maintainers change it, while it’s active', async () => {
    const other = await refusal(
      tree().create({
        system: LANTERN,
        section: 'context',
        parent: '',
        name: 'notes',
        kind: 'document',
      }),
    )
    expect(other.status).toBe(403)
    actor = 'ada'
    await tree().create({
      system: LANTERN,
      section: 'context',
      parent: '',
      name: 'notes',
      kind: 'document',
    })
    const archived = await refusal(
      tree().remove({ system: ATTIC, section: 'context', path: 'old.md' }),
    )
    expect(archived.status).toBe(403)
  })
})

describe('[SY-125] New skill', () => {
  test('makes the folder and its SKILL.md from the name and description', async () => {
    expect(
      await tree().skill({
        system: HARBOR,
        name: 'review-design',
        description: 'Reviews a design. Use when asked for a critique.',
      }),
    ).toEqual({ path: 'review-design/SKILL.md' })
    expect(read('skills/review-design/SKILL.md')).toBe(
      '---\nname: review-design\ndescription: Reviews a design. Use when asked for a critique.\n---\n\nSay what to do, step by step, and when it applies.\n',
    )
  })

  test('checks the name and description, and that the name is free', async () => {
    const name = await refusal(
      tree().skill({ system: HARBOR, name: 'Review', description: 'x' }),
    )
    expect(name.status).toBe(400)
    expect(name.message).toMatch(/^A skill’s name can use only lowercase/)
    const description = await refusal(
      tree().skill({ system: HARBOR, name: 'critique', description: ' ' }),
    )
    expect(description.message).toBe(
      'The description is missing: say what the skill does and when to use it.',
    )
    const taken = await refusal(
      tree().skill({ system: HARBOR, name: 'build', description: 'Again.' }),
    )
    expect(taken.status).toBe(409)
  })

  test('a skill isn’t made as a loose folder or file', async () => {
    const loose = await refusal(
      tree().create({
        system: HARBOR,
        section: 'skills',
        parent: '',
        name: 'notes',
        kind: 'folder',
      }),
    )
    expect(loose.message).toBe(
      'A skill is made with New skill. It has to be a folder with a SKILL.md.',
    )
  })
})

describe('[SY-126] inside a skill folder', () => {
  test('New file and New folder', async () => {
    expect(
      await tree().create({
        system: HARBOR,
        section: 'skills',
        parent: 'build',
        name: 'notes.txt',
        kind: 'file',
      }),
    ).toEqual({ path: 'build/notes.txt' })
    expect(read('skills/build/notes.txt')).toBe('')
    await tree().create({
      system: HARBOR,
      section: 'skills',
      parent: 'build',
      name: 'references',
      kind: 'folder',
    })
    expect(exists('skills/build/references')).toBe(true)
  })

  test('renaming the skill renames the whole folder and the name in its SKILL.md', async () => {
    expect(
      await tree().rename({
        system: HARBOR,
        section: 'skills',
        path: 'build',
        name: 'build-flow',
      }),
    ).toEqual({ path: 'build-flow' })
    expect(exists('skills/build-flow/scripts/check.mjs')).toBe(true)
    expect(read('skills/build-flow/SKILL.md')).toBe(
      '---\nname: build-flow\ndescription: Builds a flow.\n---\n\nSteps.\n',
    )
    const invalid = await refusal(
      tree().rename({
        system: HARBOR,
        section: 'skills',
        path: 'build-flow',
        name: 'Build',
      }),
    )
    expect(invalid.message).toMatch(/^A skill’s name can use only lowercase/)
  })

  test('deleting the skill deletes the whole folder', async () => {
    await tree().remove({ system: HARBOR, section: 'skills', path: 'build' })
    expect(trashed).toEqual(['src/systems/harbor/skills/build'])
  })

  test('SKILL.md can’t be renamed, moved or deleted alone, and each refusal says why', async () => {
    const file = { system: HARBOR, section: 'skills' as const }
    expect(
      (
        await refusal(
          tree().rename({ ...file, path: 'build/SKILL.md', name: 'x.md' }),
        )
      ).message,
    ).toBe('SKILL.md has to keep its name: it’s how agents find the skill.')
    expect(
      (
        await refusal(
          tree().move({ ...file, path: 'build/SKILL.md', to: 'review' }),
        )
      ).message,
    ).toBe('SKILL.md has to stay in its skill’s folder.')
    expect(
      (await refusal(tree().remove({ ...file, path: 'build/SKILL.md' })))
        .message,
    ).toBe(
      'A skill needs its SKILL.md. To remove the skill, delete its folder.',
    )
    expect(exists('skills/build/SKILL.md')).toBe(true)
  })

  test('skill folders can’t move; their files move between skills, not loose', async () => {
    const file = { system: HARBOR, section: 'skills' as const }
    expect(
      (await refusal(tree().move({ ...file, path: 'build', to: 'review' })))
        .message,
    ).toBe('A skill’s folder stays in skills/. Rename it, or delete it.')
    expect(
      await tree().move({ ...file, path: 'build/scripts', to: 'review' }),
    ).toEqual({ path: 'review/scripts', moved: true })
    expect(
      (await refusal(tree().move({ ...file, path: 'review/scripts', to: '' })))
        .message,
    ).toBe('Files in skills/ live inside a skill’s folder.')
  })
})
