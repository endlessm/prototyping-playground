// The file service's tree: a prototype's real files and folders, and the
// changes the file tree makes to them (create, rename, delete to the
// computer's trash, lo-fi), only where the person working may change the
// prototype. A temp studio with Ada (the Admin) and Ben, each with a
// prototype.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { fidelity } from '../../src/modules/prototypes/types/view/fidelity'
import { identity as view } from '../../src/modules/prototypes/types/view/identity'
import { FileServiceError } from '../../tooling/files/source'
import {
  createFileTree,
  installedEditors,
  type TreeOptions,
} from '../../tooling/files/tree'

const ADA_DEMO = 'dem0000000000001'
const BEN_DEMO = 'dem0000000000002'
const ADA_VIEW = 'vw00000000000001'
const BEN_VIEW = 'vw00000000000002'
const HELPER = 'vw00000000000003'
const VIEW = (id: string, text = 'Hi') =>
  `<!-- @studio-id ${id} -->\n<template>\n  <p>${text}</p>\n</template>\n`

let root: string
let actor: string | null
let trashed: string[]
let launched: { command: string; args: string[] }[]
beforeEach(() => {
  root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'tree-')))
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
  write('src/prototypes/ben/demo/logo.png', 'png')
  write('src/prototypes/ben/demo/.hidden', 'secret')
  fs.mkdirSync(at('src/prototypes/ben/demo/empty'))
  actor = 'ben'
  trashed = []
  launched = []
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
const exists = (file: string) => fs.existsSync(at(file))
const tree = (options: Partial<TreeOptions> = {}) =>
  createFileTree({
    root,
    fileTypes: [{ id: 'view', extensions: ['.vue'], identity: view, fidelity }],
    identify: () => ({ key: actor, email: `${actor}@endless.example` }),
    trash: async (file) => {
      trashed.push(path.relative(root, file).split(path.sep).join('/'))
      fs.rmSync(file, { recursive: true })
    },
    launch: async (command, args) => {
      launched.push({ command, args })
    },
    platform: 'win32',
    editors: [],
    ...options,
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
  test('[SH-68] [CL-123] [PR-59] the tree lists every file and folder, files first, without dot files', async () => {
    const listed = await tree().list({ prototype: BEN_DEMO })
    expect(listed.nodes).toEqual([
      { name: 'logo.png', path: 'logo.png', dir: false },
      { name: 'meta.json', path: 'meta.json', dir: false },
      {
        name: '_parts',
        path: '_parts',
        dir: true,
        children: [
          { name: 'Helper.vue', path: '_parts/Helper.vue', dir: false },
        ],
      },
      { name: 'empty', path: 'empty', dir: true, children: [] },
      {
        name: 'flows',
        path: 'flows',
        dir: true,
        children: [{ name: 'Start.vue', path: 'flows/Start.vue', dir: false }],
      },
    ])
    expect(listed.folder).toBe('src/prototypes/ben/demo')
  })

  test('[SH-70] [CL-123] listing only the files doesn’t resolve who you are (Git and the GitHub CLI block the dev server)', async () => {
    let asked = 0
    const listed = await tree({
      identify: () => {
        asked++
        return { key: actor, email: '' }
      },
    }).list({ prototype: BEN_DEMO, access: false })
    expect(asked).toBe(0)
    expect(listed.nodes.length).toBeGreaterThan(0)
    expect(listed).not.toHaveProperty('editable')
  })

  test('[SH-92] the listing says whether you may change the prototype, and why not', async () => {
    expect(await tree().list({ prototype: BEN_DEMO })).toMatchObject({
      editable: true,
    })
    const other = await tree().list({ prototype: ADA_DEMO })
    expect(other.editable).toBe(false)
    expect(other.reason).toMatch(/belongs to someone else/)
  })
})

describe('creating', () => {
  test('[PR-55] [SH-79] a new view gets its type’s extension, its template and a new permanent ID', async () => {
    const created = await tree().create({
      prototype: BEN_DEMO,
      parent: 'flows',
      name: 'untitled',
      type: 'view',
    })
    expect(created.path).toBe('flows/untitled.vue')
    expect(created.artifact).toMatch(/^[0-9a-hjkmnp-tv-z]{16}$/)
    expect(view.read(read('src/prototypes/ben/demo/flows/untitled.vue'))).toBe(
      created.artifact,
    )
  })

  test('[PR-55] a type’s template gets the readable title of the name', async () => {
    const titled = await tree({
      fileTypes: [
        {
          id: 'note',
          extensions: ['.note'],
          identity: view,
          template: (title) => `# ${title}\n`,
        },
      ],
    }).create({
      prototype: BEN_DEMO,
      parent: '',
      name: 'user-settings',
      type: 'note',
    })
    expect(read(`src/prototypes/ben/demo/${titled.path}`)).toContain(
      '# User Settings',
    )
  })

  test('[PR-55] [SH-79] a new folder is made as named', async () => {
    const created = await tree().create({
      prototype: BEN_DEMO,
      parent: '',
      name: 'new-folder',
      type: 'folder',
    })
    expect(created).toEqual({ path: 'new-folder' })
    expect(
      fs.statSync(at('src/prototypes/ben/demo/new-folder')).isDirectory(),
    ).toBe(true)
  })

  test('[PR-55] [PR-62] names with slashes, leading dots or that already exist are refused, saying why', async () => {
    const make = (name: string, parent = '') =>
      refusal(
        tree().create({ prototype: BEN_DEMO, parent, name, type: 'view' }),
      )
    expect((await make('a/b')).message).toBe(
      'Names can’t contain slashes or start with a dot.',
    )
    expect((await make('.secret')).message).toBe(
      'Names can’t contain slashes or start with a dot.',
    )
    const clash = await make('Start', 'flows')
    expect(clash.status).toBe(409)
    expect(clash.message).toBe(
      'Something named “Start.vue” already exists here.',
    )
    expect((await make('x', 'gone')).status).toBe(404)
  })

  test('[SH-92] only people who may change the prototype create in it', async () => {
    const error = await refusal(
      tree().create({
        prototype: ADA_DEMO,
        parent: '',
        name: 'x',
        type: 'view',
      }),
    )
    expect(error.status).toBe(403)
    expect(exists('src/prototypes/ada/demo/x.vue')).toBe(false)
  })
})

describe('renaming', () => {
  test('[PR-56] [SH-80] a file is renamed in place and keeps its extension and identity', async () => {
    const renamed = await tree().rename({
      prototype: BEN_DEMO,
      path: 'flows/Start.vue',
      name: 'Begin',
    })
    expect(renamed).toEqual({ path: 'flows/Begin.vue', relinked: 0 })
    expect(view.read(read('src/prototypes/ben/demo/flows/Begin.vue'))).toBe(
      BEN_VIEW,
    )
  })

  test('[PR-56] a folder is renamed, and a change of letter case alone works', async () => {
    expect(
      await tree().rename({
        prototype: BEN_DEMO,
        path: 'flows',
        name: 'Flows',
      }),
    ).toEqual({ path: 'Flows', relinked: 0 })
    expect(fs.readdirSync(at('src/prototypes/ben/demo'))).toContain('Flows')
  })

  test('[PR-62] [SH-89] a clash names the file it clashes with; meta.json stays put', async () => {
    const clash = await refusal(
      tree().rename({ prototype: BEN_DEMO, path: 'flows', name: '_parts' }),
    )
    expect(clash.message).toBe('Something named “_parts” already exists there.')
    const meta = await refusal(
      tree().rename({
        prototype: BEN_DEMO,
        path: 'meta.json',
        name: 'x.json',
      }),
    )
    expect(meta.message).toMatch(/meta.json/)
    const outside = await refusal(
      tree().rename({ prototype: BEN_DEMO, path: '../../ada', name: 'x' }),
    )
    expect(outside.status).toBe(404)
  })
})

describe('deleting', () => {
  test('[SH-81] [SH-82] [PR-44] [PR-60] a file or folder goes to the computer’s own trash, which the reply names', async () => {
    expect(await tree().remove({ prototype: BEN_DEMO, path: 'flows' })).toEqual(
      { trashedTo: 'recycle-bin' },
    )
    expect(trashed).toEqual(['src/prototypes/ben/demo/flows'])
    expect(
      await tree({ platform: 'darwin' }).remove({
        prototype: BEN_DEMO,
        path: 'logo.png',
      }),
    ).toEqual({ trashedTo: 'trash' })
    expect(exists('.trash')).toBe(false)
  })

  test('[SH-92] meta.json, the prototype itself and other people’s files are never deleted', async () => {
    const status = async (prototype: string, file: string) =>
      (await refusal(tree().remove({ prototype, path: file }))).status
    expect(await status(BEN_DEMO, 'meta.json')).toBe(400)
    expect(await status(BEN_DEMO, '')).toBe(404)
    expect(await status(ADA_DEMO, 'flows')).toBe(403)
    expect(trashed).toEqual([])
  })
})

describe('lo-fi', () => {
  const START = 'src/prototypes/ben/demo/flows/Start.vue'
  test('[SH-90] the file service writes and removes the lo-fi marker', async () => {
    await tree().setLofi({
      prototype: BEN_DEMO,
      artifact: BEN_VIEW,
      lofi: true,
    })
    expect(fidelity.isLofi(read(START))).toBe(true)
    await tree().setLofi({
      prototype: BEN_DEMO,
      artifact: BEN_VIEW,
      lofi: false,
    })
    expect(read(START)).toBe(VIEW(BEN_VIEW))
  })

  test('[SH-90] an archived prototype refuses, like any change', async () => {
    const metaFile = 'src/prototypes/ben/demo/meta.json'
    write(
      metaFile,
      JSON.stringify({ ...JSON.parse(read(metaFile)), status: 'archived' }),
    )
    const error = await refusal(
      tree().setLofi({ prototype: BEN_DEMO, artifact: BEN_VIEW, lofi: true }),
    )
    expect(error.code).toBe('archived')
    expect(fidelity.isLofi(read(START))).toBe(false)
  })
})

describe('reaching files', () => {
  test('[SH-64] showing a file opens the computer’s file browser on it, in any prototype', async () => {
    await tree().reveal({ prototype: ADA_DEMO, path: 'flows/Start.vue' })
    expect(launched).toEqual([
      {
        command: 'explorer.exe',
        args: [`/select,${at('src/prototypes/ada/demo/flows/Start.vue')}`],
      },
    ])
  })

  test('[SH-63] a file opens in the first code editor that starts', async () => {
    const editors = [
      { name: 'Broken', command: 'broken', args: [] },
      { name: 'Zed', command: 'zed', args: ['--new'] },
    ]
    const opened = await tree({
      editors,
      launch: async (command, args) => {
        if (command === 'broken') throw new Error('ENOENT')
        launched.push({ command, args })
      },
    }).open({ prototype: BEN_DEMO, path: 'meta.json' })
    expect(opened).toEqual({ opened: true, editor: 'Zed' })
    expect(launched).toEqual([
      {
        command: 'zed',
        args: ['--new', at('src/prototypes/ben/demo/meta.json')],
      },
    ])
  })

  test('[SH-63] without a code editor, the file is shown in the file browser and the reply says what to do', async () => {
    const opened = await tree({ platform: 'darwin' }).open({
      prototype: BEN_DEMO,
      path: 'flows/Start.vue',
    })
    expect(opened).toEqual({
      opened: false,
      message:
        'No supported code editor is installed, so the file is shown in Finder. You can also use Edit source, or copy its path.',
    })
    expect(launched[0]!.command).toBe('/usr/bin/open')
  })

  test('[PR-33] a prototype’s folder opens in a code editor, or is shown with what else to do', async () => {
    const editors = [{ name: 'Zed', command: 'zed', args: [] }]
    expect(
      await tree({
        editors,
        launch: async (command, args) => {
          launched.push({ command, args })
        },
      }).open({ prototype: BEN_DEMO, path: '' }),
    ).toEqual({ opened: true, editor: 'Zed' })
    expect(launched).toEqual([
      { command: 'zed', args: [at('src/prototypes/ben/demo')] },
    ])
    launched.length = 0
    expect(
      await tree({ platform: 'win32' }).open({ prototype: BEN_DEMO, path: '' }),
    ).toEqual({
      opened: false,
      message:
        'No supported code editor is installed, so the folder is shown in File Explorer. Edit source is available in the studio, or copy its path.',
    })
    expect(launched).toEqual([
      {
        command: 'explorer.exe',
        args: [`/select,${at('src/prototypes/ben/demo')}`],
      },
    ])
  })

  test('[SH-63] LAUNCH_EDITOR goes first among the installed editors', () => {
    const editors = installedEditors(
      'win32',
      { LOCALAPPDATA: 'C:\\L', ProgramFiles: 'C:\\P', LAUNCH_EDITOR: 'zed' },
      () => true,
    )
    expect(editors.map(({ name }) => name)).toEqual([
      'Zed',
      'Cursor',
      'Visual Studio Code',
      'VSCodium',
      'Sublime Text',
    ])
    expect(editors[2]!.command).toBe(
      path.join('C:\\L', 'Programs', 'Microsoft VS Code', 'Code.exe'),
    )
  })
})
