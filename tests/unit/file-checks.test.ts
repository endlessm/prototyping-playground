import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { auditIdentities } from '../../tooling/identity/audit'
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
  test('[CV-09] name each canvas that is not a valid canvas, with its own prototype’s links allowed', async () => {
    write(
      'ada/demo/meta.json',
      JSON.stringify({
        title: 'Demo',
        studioId: PROTOTYPE,
        ownerContributorId: 'ada0000000000001',
        systemId: null,
      }),
    )
    write(
      'ada/demo/Good.excalidraw',
      canvas(
        'canvg00d00000001',
        `{"type":"embeddable","id":"e","link":"/prototypes/${PROTOTYPE}/artifacts/vew0000000000001"}`,
      ),
    )
    write(
      'ada/demo/flows/Pasted.excalidraw',
      canvas('canvbad000000001', '{"type":"image","id":"i"}'),
    )
    const { enabled } = await loadRegistry(process.cwd())
    const canvasModule = enabled.filter(({ spec }) => spec.id === 'canvas')
    const types = await identityFileTypes(canvasModule)
    const pasted = expect.stringMatching(
      /^src\/prototypes\/ada\/demo\/flows\/Pasted\.excalidraw: it has images whose picture isn’t listed in "files"/,
    )
    // What stops the build, and what development reports.
    expect(auditIdentities(root, types).checks).toEqual([pasted])
    expect(
      buildManifest({ root, systems: [], fileTypes: types }).problems,
    ).toEqual([pasted])
  })
})
