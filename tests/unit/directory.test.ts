import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { publicDirectory } from '../../tooling/contributors/directory'

let root: string
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-directory-'))
  fs.cpSync('tests/fixtures/contributors', path.join(root, 'people'), {
    recursive: true,
  })
  fs.mkdirSync(path.join(root, 'src/systems/kit'), { recursive: true })
  fs.writeFileSync(
    path.join(root, 'src/systems/kit/system.ts'),
    "export default { label: 'Kit', studioId: 'kit0000000000001' }\n",
  )
})
afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

describe('the public directory', () => {
  test('[CL-125] holds only the selectors and permanent IDs of contributors and systems', () => {
    const directory = publicDirectory(root, {
      contributorsFolder: 'people',
      systems: ['kit'],
    })
    expect(directory).toEqual({
      contributors: [
        { key: 'ada', studioId: 'ada0000000000001' },
        { key: 'ben', studioId: 'ben0000000000002' },
      ],
      systems: [{ key: 'kit', studioId: 'kit0000000000001' }],
    })
    expect(JSON.stringify(directory)).not.toMatch(
      /@|Lovelace|preferences|github/,
    )
  })
})
