// What the Context & Skills browser lists: the Platform's guidance and each
// given module's, each owner with its README, context documents, skills and
// other contract files, under the addresses the browser opens them at.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, expect, test } from 'vitest'
import {
  guidanceCatalog,
  guidanceDocuments,
} from '../../tooling/guidance/catalog'

let root: string
function write(file: string, text = `# ${path.basename(file)}\n`) {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
  fs.writeFileSync(path.join(root, file), text)
}
const catalog = () =>
  guidanceCatalog(root, {
    platform: 'src/platform',
    modules: [
      {
        id: 'prototypes',
        label: 'Prototypes',
        folder: 'src/modules/prototypes',
      },
      { id: 'canvas', label: 'Canvas', folder: 'src/modules/canvas' },
    ],
  })

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'guidance-'))
  write(
    'src/platform/README.md',
    '# Platform guidance\n\nRead [Working in the studio](context/working-in-studio.md).\n',
  )
  write(
    'src/platform/context/working-in-studio.md',
    '---\ntitle: Working in the studio\n---\n\nSee [modules](modules/contract.md#fields).\n',
  )
  write('src/platform/context/modules/contract.md', '# Module contract\n')
  write(
    'src/platform/skills/manage-modules/SKILL.md',
    '---\nname: manage-modules\ndescription: Turn modules on and off.\n---\n\n# Manage modules\n',
  )
  write('src/platform/skills/manage-modules/references/flags.md')
  write('src/platform/skills/manage-modules/.hidden.md')
  write('src/modules/prototypes/README.md', '# Prototypes\n')
  write('src/modules/prototypes/module.ts', 'export default {}\n')
  write('src/modules/prototypes/CONTRACT.md', '# View contract\n')
  write('src/modules/prototypes/components/Notes.md', '# Not guidance\n')
  write('src/modules/canvas/skills/use-canvas/SKILL.md', '# Use canvas\n')
})
afterEach(() => fs.rmSync(root, { recursive: true, force: true }))

test('[PR-157] the Platform and each module list their README, context, skills and contract files', () => {
  const { owners } = catalog()
  expect(owners.map(({ id, kind, label }) => [id, kind, label])).toEqual([
    ['platform', 'platform', 'Platform'],
    ['canvas', 'module', 'Canvas'],
    ['prototypes', 'module', 'Prototypes'],
  ])
  const platform = owners[0]!
  expect(platform.folder).toBe('src/platform')
  expect(
    platform.documents.map(({ kind, address, title, file }) => [
      kind,
      address,
      title,
      file,
    ]),
  ).toEqual([
    ['readme', '', 'README', 'src/platform/README.md'],
    [
      'context',
      'context/modules/contract',
      'Module contract',
      'src/platform/context/modules/contract.md',
    ],
    [
      'context',
      'context/working-in-studio',
      'Working in the studio',
      'src/platform/context/working-in-studio.md',
    ],
    [
      'skill',
      'skills/manage-modules',
      'Manage modules',
      'src/platform/skills/manage-modules/SKILL.md',
    ],
  ])
  // A skill's supporting files open from its source, not the navigation.
  expect(platform.documents.at(-1)!.files).toEqual([
    'SKILL.md',
    'references/flags.md',
  ])
  const prototypes = owners[2]!
  expect(
    prototypes.documents.map(({ kind, address, title }) => [
      kind,
      address,
      title,
    ]),
  ).toEqual([
    ['readme', '', 'README'],
    ['reference', 'reference/CONTRACT', 'View contract'],
  ])
  // No README: the owner's page lists its context and skills instead.
  expect(owners[1]!.documents.map(({ kind }) => kind)).toEqual(['skill'])
})

test('[PR-161] each document names the documents that link to it, for "About this context"', () => {
  const platform = catalog().owners[0]!
  const related = (address: string) =>
    platform.documents.find((document) => document.address === address)!.related
  expect(related('context/working-in-studio')).toEqual([
    { title: 'README', owner: 'platform', address: '' },
  ])
  expect(related('context/modules/contract')).toEqual([
    {
      title: 'Working in the studio',
      owner: 'platform',
      address: 'context/working-in-studio',
    },
  ])
  expect(related('')).toEqual([])
})

test('[PR-161] the documents’ text, by file, for the reader', () => {
  const texts = guidanceDocuments(root, catalog())
  expect(texts['src/modules/prototypes/CONTRACT.md']).toBe('# View contract\n')
  expect(Object.keys(texts)).toHaveLength(7)
})

test('[PR-111] a link to a guidance file opens it in the browser', async () => {
  const { guidanceAddress } = await import('../../tooling/guidance/catalog')
  const { owners } = catalog()
  const from = 'src/platform/context/working-in-studio.md'
  expect(guidanceAddress(owners, from, 'modules/contract.md#fields')).toBe(
    '/documentation/context/platform/context/modules/contract#fields',
  )
  expect(guidanceAddress(owners, from, '../README.md')).toBe(
    '/documentation/context/platform',
  )
  expect(
    guidanceAddress(
      owners,
      from,
      '../../modules/canvas/skills/use-canvas/SKILL.md',
    ),
  ).toBe('/documentation/context/canvas/skills/use-canvas')
  expect(
    guidanceAddress(owners, from, '../../modules/prototypes/module.ts'),
  ).toBe(undefined)
  expect(guidanceAddress(owners, from, 'https://example.com/a.md')).toBe(
    undefined,
  )
})
