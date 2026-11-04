import { describe, expect, test } from 'vitest'
import { orderHomeBlocks } from '../../app/utils/home'
import {
  loadRegistry,
  moduleProblems,
  modulesForApp,
  type InstalledModule,
} from '../../tooling/modules/registry'
import { declaredPrototypeFolder } from '../../tooling/modules/prototype-folder'

const base = { id: 'notes', label: 'Notes' }

describe('a module’s pages', () => {
  test('[SY-08] a page may hold child pages, which keep it on screen while they change', () => {
    expect(
      moduleProblems(
        {
          ...base,
          pages: [
            {
              path: '/notes/:id',
              file: 'pages/note.vue',
              children: [
                { path: '', file: 'pages/overview.vue' },
                { path: 'history', file: 'pages/history.vue' },
              ],
            },
          ],
        },
        'notes',
      ),
    ).toEqual([])
    expect(
      moduleProblems(
        {
          ...base,
          pages: [
            {
              path: '/notes/:id',
              file: 'pages/note.vue',
              children: [{ path: '/elsewhere', file: 'pages/x.tsx' }],
            },
          ],
        },
        'notes',
      ),
    ).toEqual([
      'notes/module.ts: a child page’s address continues its parent’s, without a leading slash, and names its .vue file.',
    ])
  })
})

describe('a module’s Home block', () => {
  test('[SH-97] a module declares its Home block as a Vue component, with an optional order here and on the deployed site', () => {
    expect(
      moduleProblems(
        {
          ...base,
          home: { component: 'components/NotesHome.vue' },
        },
        'notes',
      ),
    ).toEqual([])
    expect(
      moduleProblems(
        {
          ...base,
          home: {
            component: 'components/NotesHome.vue',
            order: { local: 10, deployed: 30 },
          },
        },
        'notes',
      ),
    ).toEqual([])
    expect(
      moduleProblems({ ...base, home: { component: 'Home.tsx' } }, 'notes'),
    ).toEqual([
      'notes/module.ts: the Home block names its .vue component and optional numeric local and deployed orders.',
    ])
    expect(
      moduleProblems(
        {
          ...base,
          home: { component: 'Home.vue', order: { local: 'first' } },
        },
        'notes',
      ),
    ).toHaveLength(1)
  })

  test('[SH-97] blocks are ordered for where the studio runs: your work first locally, what colleagues come for first on the deployed site', () => {
    const blocks = [
      { id: 'systems', order: { local: 30, deployed: 10 } },
      { id: 'prototypes', order: { local: 10, deployed: 20 } },
      { id: 'manual', order: {} },
    ]
    expect(orderHomeBlocks(blocks, true).map(({ id }) => id)).toEqual([
      'prototypes',
      'systems',
      'manual',
    ])
    expect(orderHomeBlocks(blocks, false).map(({ id }) => id)).toEqual([
      'systems',
      'prototypes',
      'manual',
    ])
  })
})

describe('local-only modules', () => {
  const installed = (spec: Record<string, unknown>) =>
    ({ spec: { ...base, ...spec }, dir: '' }) as unknown as InstalledModule

  test('[SH-23] a module marked local only contributes nothing to the deployed site', () => {
    expect(moduleProblems({ ...base, localOnly: true }, 'notes')).toEqual([])
    expect(moduleProblems({ ...base, localOnly: 'yes' }, 'notes')).toEqual([
      'notes/module.ts: localOnly is true or false.',
    ])
    const modules = [
      installed({ id: 'welcome', localOnly: true }),
      installed({ id: 'systems' }),
    ]
    expect(
      modulesForApp(modules, { dev: true }).map(({ spec }) => spec.id),
    ).toEqual(['welcome', 'systems'])
    expect(
      modulesForApp(modules, { dev: false }).map(({ spec }) => spec.id),
    ).toEqual(['systems'])
  })
})

describe('a module’s reference adapters', () => {
  test('[PR-67] a module may name the file of its reference adapters, which repair references when files move', () => {
    expect(
      moduleProblems({ ...base, references: 'references.ts' }, 'notes'),
    ).toEqual([])
    expect(moduleProblems({ ...base, references: 42 }, 'notes')).toEqual([
      'notes/module.ts: "references" names the .ts file whose “references” export lists its reference adapters.',
    ])
  })
})

describe('a file type’s previews', () => {
  const type = {
    id: 'sketch',
    label: 'Sketch',
    extensions: ['.sketch'],
    identity: 'identity.ts',
    page: 'SketchPage.vue',
    embed: 'SketchEmbed.vue',
  }
  test('[CV-08] [CV-67] a file type names the surfaces its preview shows on', () => {
    expect(
      moduleProblems(
        {
          ...base,
          fileTypes: [
            type,
            { ...type, id: 'board', embedIn: ['document'] },
            { ...type, id: 'screen', embedIn: ['document', 'canvas'] },
          ],
        },
        'notes',
      ),
    ).toEqual([])
    for (const wrong of [
      { embedIn: ['wall'] },
      { embedIn: [] },
      { embedIn: 'canvas' },
    ])
      expect(
        moduleProblems(
          { ...base, fileTypes: [{ ...type, ...wrong }] },
          'notes',
        ),
      ).toEqual([
        'notes/module.ts: file type "sketch" names the surfaces its preview shows on: “document”, “canvas” or both.',
      ])
  })

  test('[CV-111] a file type may name a small surface shown while its preview loads, beside its embed', () => {
    expect(
      moduleProblems(
        {
          ...base,
          fileTypes: [{ ...type, embedPending: 'SketchPending.vue' }],
        },
        'notes',
      ),
    ).toEqual([])
    for (const wrong of [
      { embedPending: 'SketchPending.ts' },
      { embedPending: true },
      { embed: undefined, embedPending: 'SketchPending.vue' },
    ])
      expect(
        moduleProblems(
          { ...base, fileTypes: [{ ...type, ...wrong }] },
          'notes',
        ),
      ).toEqual([
        'notes/module.ts: file type "sketch" names its embed and the embed’s pending surface as .vue files, the pending surface only with an embed.',
      ])
  })
})

describe('a module’s prototype actions', () => {
  test('[PR-47] a module may add items to the prototype menu from a file of its own', () => {
    expect(
      moduleProblems({ ...base, prototypeActions: 'actions.ts' }, 'notes'),
    ).toEqual([])
    expect(
      moduleProblems({ ...base, prototypeActions: true }, 'notes'),
    ).toEqual([
      'notes/module.ts: "prototypeActions" names the .ts file whose default export lists its items for the prototype menu.',
    ])
  })
})

describe('a module’s artifact tool', () => {
  test('[CM-1] a module may draw a tool over artifact pages, from a .vue component of its own', () => {
    expect(
      moduleProblems(
        { ...base, artifactTool: 'components/CommentTool.vue' },
        'notes',
      ),
    ).toEqual([])
    for (const artifactTool of ['components/tool.ts', true, ''])
      expect(moduleProblems({ ...base, artifactTool }, 'notes')).toEqual([
        'notes/module.ts: "artifactTool" names the .vue component drawn over artifact pages while the studio runs locally.',
      ])
  })
})

describe('a module’s prototype folder', () => {
  test('[CM-58] a module may keep a hidden folder in each prototype, naming what one file in it is', () => {
    const prototypeFolder = { name: '.notes', one: 'note', other: 'notes' }
    expect(moduleProblems({ ...base, prototypeFolder }, 'notes')).toEqual([])
    for (const wrong of [
      '.notes',
      { ...prototypeFolder, name: 'notes' },
      { ...prototypeFolder, name: '.Notes' },
      { ...prototypeFolder, name: '.notes/inner' },
      { ...prototypeFolder, name: '.git' },
      { ...prototypeFolder, one: '' },
      { name: '.notes', one: 'note' },
    ])
      expect(
        moduleProblems({ ...base, prototypeFolder: wrong }, 'notes'),
      ).toEqual([
        `notes/module.ts: "prototypeFolder" names a hidden folder (a dot, then lowercase letters, numbers and dashes) and, as plain text, what one file in it is and what several are: { name: '.notes', one: 'note', other: 'notes' }.`,
      ])
  })

  test('[CM-58] the comments module keeps its threads in its declared folder', async () => {
    const { default: comments } =
      await import('../../src/modules/comments/module')
    const { COMMENTS_FOLDER } =
      await import('../../src/modules/comments/threads')
    expect(comments.prototypeFolder).toEqual({
      name: COMMENTS_FOLDER,
      one: 'comment',
      other: 'comments',
    })
  })

  test('[CM-56] the folder’s name reads the same from the declaration’s text, as the scope check reads it from Git', () => {
    expect(
      declaredPrototypeFolder(
        "export default {\n  id: 'notes',\n  prototypeFolder: { one: 'note', name: '.notes', other: 'notes' },\n}\n",
      ),
    ).toBe('.notes')
    expect(
      declaredPrototypeFolder(
        "const NAME = '.notes'\nexport default { prototypeFolder: { name: NAME } }",
      ),
    ).toBeNull()
    expect(declaredPrototypeFolder("export default { id: 'notes' }")).toBeNull()
  })

  test('[CM-56] a declaration whose folder isn’t written out is refused, since Git can’t read it', async () => {
    const { mkdtempSync, mkdirSync, writeFileSync, rmSync } =
      await import('node:fs')
    const os = await import('node:os')
    const path = await import('node:path')
    const root = mkdtempSync(path.join(os.tmpdir(), 'prototype-folder-'))
    try {
      writeFileSync(path.join(root, 'studio.config.json'), '{}')
      mkdirSync(path.join(root, 'src/modules/notes'), { recursive: true })
      writeFileSync(
        path.join(root, 'src/modules/notes/module.ts'),
        "const name = '.notes'\nexport default { id: 'notes', label: 'Notes', prototypeFolder: { name, one: 'note', other: 'notes' } }\n",
      )
      await expect(loadRegistry(root)).rejects.toThrow(
        'notes/module.ts: write "prototypeFolder" out as { name: \'.notes\', … } in the declaration itself, so the scope check can read it from Git.',
      )
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})

describe('a module’s local server handlers', () => {
  test('[SH-134] a module may answer requests on the local dev server, from .ts files of its own', () => {
    expect(
      moduleProblems(
        { ...base, server: { claim: 'server/claim.ts' } },
        'notes',
      ),
    ).toEqual([])
    for (const server of [
      { Claim: 'server/claim.ts' },
      { claim: 'server/claim.vue' },
      'server/claim.ts',
    ])
      expect(moduleProblems({ ...base, server }, 'notes')).toEqual([
        'notes/module.ts: "server" maps lowercase names to the .ts files that answer them on the local dev server.',
      ])
  })
})

describe('the studio’s own rail', () => {
  test('[SH-26] the modules’ buttons sit at the top in module order: Prototypes, Systems, then the Manual', async () => {
    const { modules } = await loadRegistry(process.cwd())
    const top = modules
      .flatMap(({ spec }) =>
        spec.rail?.position === 'top'
          ? [{ spec, order: spec.rail.order ?? 0 }]
          : [],
      )
      .sort((a, b) => a.order - b.order)
    expect(top.map(({ spec }) => spec.label)).toEqual([
      'Prototypes',
      'Systems',
      'Manual',
    ])
    expect(top.every(({ spec }) => spec.rail?.icon)).toBe(true)
  })
})
