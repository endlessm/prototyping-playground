// What the deployed site keeps of the manifest: archived prototypes, and
// archived systems with the prototypes that use them, are left out
// entirely, and the build says how many, and which active files link to
// something left out.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { identity as viewIdentity } from '../../src/modules/prototypes/types/view/identity'
import { buildManifest, forDeploy } from '../../tooling/manifest/build'
import type { InstalledSystem } from '../../tooling/systems/registry'

const HARBOR = 'hrbr000000000001'
const ATTIC = 'att1c00000000001'
const LIVE = 'pr00000000000001'
const OLD = 'pr00000000000002'
const STORED = 'pr00000000000003'
const system = (key: string, id: string, status: string) => ({
  key,
  id,
  dir: '',
  folder: `src/systems/${key}`,
  spec: { label: key, status, colorModes: ['light'] },
})
const systems = [
  system('harbor', HARBOR, 'active'),
  system('attic', ATTIC, 'archived'),
] as unknown as InstalledSystem[]

let root: string
beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), 'studio-deploy-'))
  prototype('ada/live', LIVE, 'Live', { systemId: HARBOR })
  prototype('ada/old', OLD, 'Old Ideas', { systemId: null, status: 'archived' })
  prototype('ben/stored', STORED, 'Stored', { systemId: ATTIC })
  write('ada/live/Home.vue', view('vw00000000000001'))
  write(
    'ada/live/Notes.md',
    `See [the old ideas](/prototypes/${OLD}/artifacts/vw00000000000002).\n`,
  )
  write(
    'ada/live/Board.excalidraw',
    `{"elements":[{"link":"/prototypes/${STORED}"}]}`,
  )
  write('ada/old/Sketch.vue', view('vw00000000000002'))
  write('ada/old/More.md', `[Live](/prototypes/${LIVE})\n`)
  write('ben/stored/Box.vue', view('vw00000000000003'))
})
afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

function write(file: string, content: string) {
  const full = path.join(root, 'src/prototypes', file)
  mkdirSync(path.dirname(full), { recursive: true })
  writeFileSync(full, content)
}
function prototype(
  folder: string,
  id: string,
  title: string,
  meta: Record<string, unknown>,
) {
  write(
    `${folder}/meta.json`,
    JSON.stringify({ formatVersion: 1, title, studioId: id, ...meta }),
  )
}
const view = (id: string) =>
  `<!-- @studio-id ${id} -->\n<template><p /></template>\n`
const deployed = () =>
  forDeploy(
    buildManifest({
      root,
      systems,
      fileTypes: [{ id: 'view', extensions: ['.vue'], identity: viewIdentity }],
    }),
    root,
  )

describe('the deployed manifest', () => {
  test('[PR-73] [CL-105] leaves archived prototypes, archived systems and their prototypes out entirely', () => {
    const { built, left } = deployed()
    expect(built.manifest.prototypes.map(({ id }) => id)).toEqual([LIVE])
    expect(Object.keys(built.artifacts)).toEqual([LIVE])
    expect(built.manifest.systems.map(({ id }) => id)).toEqual([HARBOR])
    expect(left.prototypes.map(({ id }) => id).sort()).toEqual([OLD, STORED])
    expect(left.systems.map(({ id }) => id)).toEqual([ATTIC])
  })

  test('[PR-74] [CL-105] warns about active files that link to what was left out, and says how many', () => {
    const { warnings, summary } = deployed()
    expect(warnings).toEqual([
      'src/prototypes/ada/live/Board.excalidraw links to the archived prototype “Stored”; the deployed site leaves it out and shows a placeholder there.',
      'src/prototypes/ada/live/Notes.md links to the archived prototype “Old Ideas”; the deployed site leaves it out and shows a placeholder there.',
    ])
    expect(summary).toBe(
      'Left out of the deployed site: 2 archived prototypes, 1 archived system.',
    )
  })

  test('[CL-105] says nothing when nothing is archived', () => {
    rmSync(path.join(root, 'src/prototypes/ada/old'), { recursive: true })
    rmSync(path.join(root, 'src/prototypes/ben'), { recursive: true })
    const { warnings, summary, left } = forDeploy(
      buildManifest({
        root,
        systems: systems.slice(0, 1),
        fileTypes: [
          { id: 'view', extensions: ['.vue'], identity: viewIdentity },
        ],
      }),
      root,
    )
    expect(left.prototypes).toEqual([])
    expect(warnings).toEqual([])
    expect(summary).toBeNull()
  })
})

describe('the deployed canvases', () => {
  test('[PR-73] leave archived prototypes’ canvases out', async () => {
    const { canvasFiles } =
      await import('../../src/modules/canvas/types/canvas/bundle')
    write(
      'ada/live/Board.excalidraw',
      '{"studioId":"cv00000000000001","elements":[]}',
    )
    write(
      'ada/old/Plan.excalidraw',
      '{"studioId":"cv00000000000002","elements":[]}',
    )
    expect(Object.keys(canvasFiles(root, 'src/prototypes'))).toEqual([
      'cv00000000000001',
    ])
  })
})
