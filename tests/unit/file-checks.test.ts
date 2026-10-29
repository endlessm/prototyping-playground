import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { fileProblems, fileTypeChecks } from '../../tooling/checks/file-types'
import { identityFileTypes } from '../../tooling/identity/file-types'
import { buildManifest } from '../../tooling/manifest/build'
import { loadRegistry } from '../../tooling/modules/registry'

let root: string
beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), 'file-checks-'))
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

function write(file: string, content: string) {
  const full = path.join(root, 'src/prototypes', file)
  mkdirSync(path.dirname(full), { recursive: true })
  writeFileSync(full, content)
}

const PROTOTYPE = 'canvpr0t00000001'
const canvas = (id: string, more = '') =>
  `{"type":"excalidraw","version":2,"studioVersion":1,"studioId":"${id}","elements":[${more}],"appState":{},"files":{}}`

describe('the build’s file checks', () => {
  test('[CV-09] name each canvas that is not a valid canvas, and pass the good ones', async () => {
    write(
      'ada/demo/meta.json',
      JSON.stringify({
        title: 'Demo',
        studioId: PROTOTYPE,
        ownerContributorId: 'ada0000000000001',
        systemId: null,
      }),
    )
    write('ada/demo/Good.excalidraw', canvas('canvg00d00000001'))
    write(
      'ada/demo/flows/Pasted.excalidraw',
      canvas('canvbad000000001', '{"type":"image","id":"i"}'),
    )
    const { enabled } = await loadRegistry(process.cwd())
    const canvasModule = enabled.filter(({ spec }) => spec.id === 'canvas')
    const built = buildManifest({
      root,
      systems: [],
      fileTypes: await identityFileTypes(canvasModule),
    })
    expect(built.problems).toEqual([])
    expect(
      fileProblems(root, built, await fileTypeChecks(canvasModule)),
    ).toEqual([
      expect.stringMatching(
        /^src\/prototypes\/ada\/demo\/flows\/Pasted\.excalidraw: a canvas can’t hold images/,
      ),
    ])
  })
})
