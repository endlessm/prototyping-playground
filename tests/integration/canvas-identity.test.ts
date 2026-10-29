// A canvas's permanent identity from the command line: a hand-written
// `.excalidraw` file gets its `studioId` from `identify`.
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { ADA, tempStudio, type TempStudio } from './setup/temp-studio'

const folder = 'src/prototypes/ada/demo'
const ID = /^[0-9a-hjkmnp-tv-z]{16}$/

let studio: TempStudio
beforeEach(() => {
  studio = tempStudio()
  studio.withModule('prototypes')
  studio.withModule('canvas')
  studio.write(
    `${folder}/meta.json`,
    `${JSON.stringify({
      formatVersion: 1,
      title: 'Demo',
      studioId: 'dem0000000000001',
      ownerContributorId: ADA.id,
      systemId: null,
    })}\n`,
  )
})
afterEach(() => {
  studio.remove()
})

const handWritten = `{
  "type": "excalidraw",
  "version": 2,
  "studioVersion": 1,
  "elements": [],
  "appState": { "viewBackgroundColor": "#ffffff" },
  "files": {}
}
`

describe('a hand-written canvas', () => {
  test('[CV-06] is reported missing its identity, and identify --yes gives it one at the top level', () => {
    studio.write(`${folder}/Flow.excalidraw`, handWritten)

    const audit = studio.studio('identity-audit', '--json')
    expect(JSON.parse(audit.stdout).missing).toEqual([
      `${folder}/Flow.excalidraw`,
    ])

    const result = studio.studio('identify', folder, '--yes', '--json')
    expect(result.status).toBe(0)
    const [assigned] = JSON.parse(result.stdout).assigned
    expect(assigned.path).toBe(`${folder}/Flow.excalidraw`)
    expect(assigned.studioId).toMatch(ID)
    const file = JSON.parse(studio.read(`${folder}/Flow.excalidraw`))
    expect(file.studioId).toBe(assigned.studioId)
    expect(file.elements).toEqual([])
    expect(studio.studio('identity-audit').stdout).toContain(
      '0 missing identities.',
    )
  })
})
