// Organizing a prototype, as its menus and the file service do: renaming
// (the folder follows the title, the permanent link stays), duplicating
// (fresh identities for the copy and everything in it), archiving and
// restoring, and deleting to the computer's trash. A temp studio with Ada
// (the Admin) and Ben, an active and an archived system.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { identity as view } from '../../src/modules/prototypes/types/view/identity'
import { references as viewReferences } from '../../src/modules/prototypes/references'
import { references as documentReferences } from '../../src/modules/document/references'
import { identity as documentIdentity } from '../../src/modules/document/types/document/identity'
import { references as canvasReferences } from '../../src/modules/canvas/references'
import { identity as canvasIdentity } from '../../src/modules/canvas/types/canvas/identity'
import { createOrganizer } from '../../tooling/files/organize'
import { FileServiceError } from '../../tooling/files/source'
import { isResourceId } from '../../tooling/identity/resource-id'

const ACTIVE = 'syst3m0000000001'
const OLD = 'syst3m0000000002'
const DEMO = 'dem0000000000001'
const HOME = 'vw00000000000001'
const DETAILS = 'vw00000000000002'
const NOTES = 'dc00000000000001'
const WELCOME = 'st00000000000001'
const SHARED = 'dem0000000000002'
const BOARD = 'vw00000000000003'
const BEN = 'ben0000000000002'
const ADA = 'ada0000000000001'

let root: string
let actor: string | null
let trashed: string[]
beforeEach(() => {
  root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'organize-')))
  fs.cpSync('tests/fixtures/contributors', path.join(root, 'contributors'), {
    recursive: true,
  })
  write(
    'studio.config.json',
    JSON.stringify({
      name: 'Test',
      admins: [ADA],
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
  write('src/prototypes/ben/demo/meta.json', meta('Demo', DEMO, BEN))
  write(
    'src/prototypes/ben/demo/Home.vue',
    [
      `<!-- @studio-id ${HOME} -->`,
      `<!-- @studio-state ${WELCOME} Welcome -->`,
      '<script setup lang="ts">',
      "import Card from './_parts/Card.vue'",
      '</script>',
      '<script lang="ts">',
      "export const states = [{ title: 'Welcome', props: {} }]",
      '</script>',
      '<template><Card /><PrototypeLink to="flows/Details">Details</PrototypeLink></template>',
      '',
    ].join('\n'),
  )
  write(
    'src/prototypes/ben/demo/flows/Details.vue',
    `<!-- @studio-id ${DETAILS} -->\n<template><h1>Details</h1></template>\n`,
  )
  write(
    'src/prototypes/ben/demo/_parts/Card.vue',
    '<template>Card</template>\n',
  )
  write(
    'src/prototypes/ben/demo/Notes.md',
    [
      '---',
      `studioId: ${NOTES}`,
      '---',
      '',
      `See [home](/prototypes/${DEMO}/artifacts/${HOME}) and [welcome](/prototypes/${DEMO}/artifacts/${WELCOME}).`,
      '',
      'Also [details](./flows/Details.vue).',
      '',
    ].join('\n'),
  )
  write('src/prototypes/ada/shared/meta.json', meta('Shared', SHARED, ADA))
  write(
    'src/prototypes/ada/shared/Board.vue',
    `<!-- @studio-id ${BOARD} -->\n<template>Board</template>\n`,
  )
  actor = 'ben'
  trashed = []
})
afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

function meta(title: string, id: string, owner: string, more = {}) {
  return `${JSON.stringify(
    {
      formatVersion: 1,
      title,
      created: '2026-01-02',
      studioId: id,
      ownerContributorId: owner,
      systemId: null,
      ...more,
    },
    null,
    2,
  )}\n`
}
const at = (file: string) => path.join(root, file)
function write(file: string, text: string) {
  fs.mkdirSync(path.dirname(at(file)), { recursive: true })
  fs.writeFileSync(at(file), text)
}
const read = (file: string) => fs.readFileSync(at(file), 'utf8')
const json = (file: string) => JSON.parse(read(file))
const exists = (file: string) => fs.existsSync(at(file))
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const organizer = () =>
  createOrganizer({
    root,
    fileTypes: [
      { id: 'view', extensions: ['.vue'], identity: view },
      { id: 'document', extensions: ['.md'], identity: documentIdentity },
      { id: 'canvas', extensions: ['.excalidraw'], identity: canvasIdentity },
    ],
    references: [...viewReferences, ...documentReferences, ...canvasReferences],
    identify: () => ({ key: actor, email: `${actor}@endless.example` }),
    trash: async (file) => {
      trashed.push(file)
      fs.rmSync(file, { recursive: true })
    },
    platform: 'win32',
  })

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

describe('renaming a prototype', () => {
  test('[PR-36] changes the title and renames the folder; its permanent link and IDs stay', async () => {
    const renamed = await organizer().rename({
      prototype: DEMO,
      title: 'Sign-up Flow',
    })
    expect(renamed).toMatchObject({
      id: DEMO,
      folder: 'src/prototypes/ben/sign-up-flow',
    })
    expect(exists('src/prototypes/ben/demo')).toBe(false)
    expect(json('src/prototypes/ben/sign-up-flow/meta.json')).toMatchObject({
      title: 'Sign-up Flow',
      studioId: DEMO,
      created: '2026-01-02',
    })
    expect(read('src/prototypes/ben/sign-up-flow/Home.vue')).toContain(
      `@studio-id ${HOME}`,
    )
    // References inside it still work: they are relative.
    expect(read('src/prototypes/ben/sign-up-flow/Notes.md')).toContain(
      '[details](./flows/Details.vue)',
    )
  })

  test('[PR-36] repairs other files’ references into the renamed folder', async () => {
    write(
      'src/prototypes/ada/shared/Guide.md',
      `---\nstudioId: dc00000000000002\n---\n\n[Demo’s details](../../ben/demo/flows/Details.vue)\n`,
    )
    actor = 'ada'
    const renamed = await organizer().rename({
      prototype: DEMO,
      title: 'Renamed',
    })
    expect(renamed.relinked).toBe(1)
    expect(read('src/prototypes/ada/shared/Guide.md')).toContain(
      '[Demo’s details](../../ben/renamed/flows/Details.vue)',
    )
  })

  test('[PR-36] a new title with the same folder name only changes the title', async () => {
    const renamed = await organizer().rename({ prototype: DEMO, title: 'DEMO' })
    expect(renamed.folder).toBe('src/prototypes/ben/demo')
    expect(json('src/prototypes/ben/demo/meta.json').title).toBe('DEMO')
  })

  test('[PR-36] refuses a folder name that is taken, an empty title, and someone else’s prototype', async () => {
    write(
      'src/prototypes/ben/taken/meta.json',
      meta('Taken', 'dem0000000000003', BEN),
    )
    expect(
      (
        await refusal(() =>
          organizer().rename({ prototype: DEMO, title: 'Taken' }),
        )
      ).message,
    ).toBe(
      'You already have a prototype named “Taken”. Choose a different title.',
    )
    expect(
      (await refusal(() => organizer().rename({ prototype: DEMO, title: ' ' })))
        .message,
    ).toBe('Add a title.')
    const other = await refusal(() =>
      organizer().rename({ prototype: SHARED, title: 'Mine now' }),
    )
    expect(other.status).toBe(403)
    expect(json('src/prototypes/ben/demo/meta.json').title).toBe('Demo')
    expect(exists('src/prototypes/ada/shared')).toBe(true)
  })

  test('[PR-36] [PR-31] an Admin renames anyone’s; an archived prototype is restored first', async () => {
    actor = 'ada'
    await organizer().rename({ prototype: DEMO, title: 'By Ada' })
    expect(exists('src/prototypes/ben/by-ada/meta.json')).toBe(true)
    write(
      'src/prototypes/ben/by-ada/meta.json',
      meta('By Ada', DEMO, BEN, { status: 'archived' }),
    )
    expect(
      (await refusal(() => organizer().rename({ prototype: DEMO, title: 'X' })))
        .message,
    ).toBe('This prototype is archived. Restore it to change it.')
  })
})

describe('duplicating a prototype', () => {
  const ids = (text: string) => text.match(/\b[0-9a-hjkmnp-tv-z]{16}\b/g) ?? []

  test('[PR-38] gives the copy, its artifacts and named states fresh IDs, and points its own links at the copy', async () => {
    const before = read('src/prototypes/ben/demo/Home.vue')
    const copy = await organizer().duplicate({
      prototype: DEMO,
      title: 'Demo copy',
    })
    expect(copy.folder).toBe('src/prototypes/ben/demo-copy')
    expect(copy.rebuild).toBe(false)
    const dir = 'src/prototypes/ben/demo-copy'
    const copied = json(`${dir}/meta.json`)
    expect(copied).toEqual({
      formatVersion: 1,
      title: 'Demo copy',
      created: today(),
      studioId: copy.id,
      ownerContributorId: BEN,
      systemId: null,
    })
    const home = read(`${dir}/Home.vue`)
    const homeId = view.read(home)!
    const [state] = view.children!.read(home)
    const details = view.read(read(`${dir}/flows/Details.vue`))!
    const notes = documentIdentity.read(read(`${dir}/Notes.md`))!
    const fresh = [copy.id, homeId, state!.studioId!, details, notes]
    for (const id of fresh) expect(isResourceId(id)).toBe(true)
    expect(new Set(fresh).size).toBe(5)
    for (const id of fresh)
      expect([DEMO, HOME, WELCOME, DETAILS, NOTES]).not.toContain(id)
    expect(read(`${dir}/Notes.md`)).toContain(
      `See [home](/prototypes/${copy.id}/artifacts/${homeId}) and [welcome](/prototypes/${copy.id}/artifacts/${state!.studioId}).`,
    )
    // Everything else is copied as it was, helpers too.
    expect(home.replace(homeId, HOME).replace(state!.studioId!, WELCOME)).toBe(
      before,
    )
    expect(read(`${dir}/_parts/Card.vue`)).toBe('<template>Card</template>\n')
    // The original is untouched.
    expect(read('src/prototypes/ben/demo/Home.vue')).toBe(before)
    expect(json('src/prototypes/ben/demo/meta.json').studioId).toBe(DEMO)
    // No ID in the copy is used anywhere else.
    const elsewhere = new Set([
      ...ids(read('src/prototypes/ben/demo/Notes.md')),
      ...ids(read('src/prototypes/ben/demo/Home.vue')),
    ])
    for (const id of fresh) expect(elsewhere.has(id)).toBe(false)
  })

  test('[CV-108] a copied canvas links to the copied artifacts, as new versions of its elements, keeping the scene', async () => {
    const CANVAS = 'cv00000000000001'
    const scene = {
      type: 'excalidraw',
      version: 2,
      studioVersion: 1,
      studioId: CANVAS,
      elements: [
        {
          id: 'home',
          type: 'embeddable',
          link: `/prototypes/${DEMO}/artifacts/${HOME}`,
          version: 3,
          versionNonce: 7,
          x: 0,
          y: 0,
        },
        {
          id: 'welcome',
          type: 'embeddable',
          link: `/prototypes/${DEMO}/artifacts/${WELCOME}`,
          version: 1,
          versionNonce: 1,
          x: 600,
          y: 0,
        },
        {
          id: 'note',
          type: 'text',
          text: 'Hello',
          version: 2,
          versionNonce: 5,
        },
      ],
      appState: { viewBackgroundColor: '#ffffff', gridSize: 20 },
      files: {},
    }
    write(
      'src/prototypes/ben/demo/Board.excalidraw',
      `${JSON.stringify(scene, null, 2)}
`,
    )
    const copy = await organizer().duplicate({
      prototype: DEMO,
      title: 'Board copy',
    })
    const dir = 'src/prototypes/ben/board-copy'
    const home = view.read(read(`${dir}/Home.vue`))!
    const [state] = view.children!.read(read(`${dir}/Home.vue`))
    const copied = json(`${dir}/Board.excalidraw`)
    expect(
      copied.elements.map((element: { link?: string }) => element.link),
    ).toEqual([
      `/prototypes/${copy.id}/artifacts/${home}`,
      `/prototypes/${copy.id}/artifacts/${state!.studioId}`,
      undefined,
    ])
    expect(copied.elements[0]).toMatchObject({ id: 'home', version: 4 })
    expect(copied.elements[0].versionNonce).not.toBe(7)
    expect(copied.elements[1]).toMatchObject({ id: 'welcome', version: 2 })
    expect(copied.elements[2]).toEqual(scene.elements[2])
    // The scene is the same; the copy is a canvas of its own.
    expect(copied.appState).toEqual(scene.appState)
    expect(canvasIdentity.read(read(`${dir}/Board.excalidraw`))).not.toBe(
      CANVAS,
    )
    expect(json('src/prototypes/ben/demo/Board.excalidraw')).toEqual(scene)
  })

  test('[PR-38] an archived prototype’s copy is active; Git data and node_modules stay behind', async () => {
    write(
      'src/prototypes/ben/demo/meta.json',
      meta('Demo', DEMO, BEN, { status: 'archived' }),
    )
    write('src/prototypes/ben/demo/node_modules/x/index.js', 'x\n')
    write('src/prototypes/ben/demo/.git/HEAD', 'ref\n')
    const copy = await organizer().duplicate({ prototype: DEMO, title: 'Back' })
    expect(json(`${copy.folder}/meta.json`).status).toBeUndefined()
    expect(exists(`${copy.folder}/node_modules`)).toBe(false)
    expect(exists(`${copy.folder}/.git`)).toBe(false)
  })

  test('[PR-38] refuses symbolic links, a taken title, and leaves nothing behind', async () => {
    write(
      'src/prototypes/ben/taken/meta.json',
      meta('Taken', 'dem0000000000003', BEN),
    )
    expect(
      (
        await refusal(() =>
          organizer().duplicate({ prototype: DEMO, title: 'Taken' }),
        )
      ).message,
    ).toBe(
      'You already have a prototype named “Taken”. Choose a different title.',
    )
    let linked = true
    try {
      fs.symlinkSync(
        at('src/prototypes/ada'),
        at('src/prototypes/ben/demo/link'),
        'junction',
      )
    } catch {
      linked = false
    }
    if (linked)
      expect(
        (
          await refusal(() =>
            organizer().duplicate({ prototype: DEMO, title: 'Linked' }),
          )
        ).message,
      ).toBe('Remove symbolic links from the prototype before duplicating it.')
    expect(fs.readdirSync(at('src/prototypes/ben')).sort()).toEqual([
      'demo',
      'taken',
    ])
  })

  test('[PR-37] an Admin duplicates someone else’s prototype into their own space; others may not', async () => {
    const refused = await refusal(() =>
      organizer().duplicate({ prototype: SHARED, title: 'Mine' }),
    )
    expect(refused.status).toBe(403)
    actor = 'ada'
    const copy = await organizer().duplicate({
      prototype: DEMO,
      title: 'From Ben',
    })
    expect(copy.folder).toBe('src/prototypes/ada/from-ben')
    expect(json(`${copy.folder}/meta.json`).ownerContributorId).toBe(ADA)
  })

  test('[PR-39] a copy for another system keeps its system and asks for a rebuild', async () => {
    const copy = await organizer().duplicate({
      prototype: DEMO,
      title: 'Rebuilt',
      system: 'active',
    })
    expect(copy.rebuild).toBe(true)
    expect(json(`${copy.folder}/meta.json`)).toMatchObject({
      systemId: null,
      rebuild: { targetSystemId: ACTIVE, sourcePrototypeId: DEMO },
    })
    const same = await organizer().duplicate({
      prototype: DEMO,
      title: 'Same',
      system: null,
    })
    expect(same.rebuild).toBe(false)
    expect(json(`${same.folder}/meta.json`).rebuild).toBeUndefined()
    expect(
      (
        await refusal(() =>
          organizer().duplicate({
            prototype: DEMO,
            title: 'Old',
            system: 'old',
          }),
        )
      ).message,
    ).toBe('The old system is archived. Choose an active system, or no system.')
  })
})

describe('archiving, restoring and deleting a prototype', () => {
  test('[PR-41] archiving marks the whole prototype; restoring makes it active again', async () => {
    expect(await organizer().archive({ prototype: DEMO })).toEqual({
      status: 'archived',
    })
    expect(json('src/prototypes/ben/demo/meta.json').status).toBe('archived')
    expect(await organizer().restore({ prototype: DEMO })).toEqual({
      status: 'active',
    })
    const restored = json('src/prototypes/ben/demo/meta.json')
    expect(restored.status).toBeUndefined()
    expect(restored.title).toBe('Demo')
    expect(
      (await refusal(() => organizer().archive({ prototype: SHARED }))).status,
    ).toBe(403)
  })

  test('[PR-42] restoring is refused while its system is deleted or archived', async () => {
    write(
      'src/prototypes/ben/demo/meta.json',
      meta('Demo', DEMO, BEN, {
        status: 'archived',
        systemId: OLD,
        archivedBySystemId: OLD,
      }),
    )
    expect(
      (await refusal(() => organizer().restore({ prototype: DEMO }))).message,
    ).toBe('Restore this prototype’s system before restoring the prototype.')
    for (const gone of [
      { systemId: 'syst3m0000000009' },
      { systemId: ACTIVE, systemMissing: { label: 'Gone' } },
    ]) {
      write(
        'src/prototypes/ben/demo/meta.json',
        meta('Demo', DEMO, BEN, { status: 'archived', ...gone }),
      )
      expect(
        (await refusal(() => organizer().restore({ prototype: DEMO }))).message,
      ).toBe(
        'Rebuild this prototype with an available system before restoring it.',
      )
    }
    expect(json('src/prototypes/ben/demo/meta.json').status).toBe('archived')
  })

  test('[PR-43] deleting moves the whole folder to the computer’s trash, archived or not', async () => {
    write(
      'src/prototypes/ben/demo/meta.json',
      meta('Demo', DEMO, BEN, { status: 'archived' }),
    )
    expect(await organizer().remove({ prototype: DEMO })).toEqual({
      trashedTo: 'recycle-bin',
      title: 'Demo',
    })
    expect(trashed).toEqual([at('src/prototypes/ben/demo')])
    expect(exists('src/prototypes/ben/demo')).toBe(false)
    const other = await refusal(() => organizer().remove({ prototype: SHARED }))
    expect(other.status).toBe(403)
    expect(exists('src/prototypes/ada/shared')).toBe(true)
  })
})
