// The Manual's chapters, read from the Documentation module's `pages/`
// folder: in their set order, grouped by optional sections, each at the
// address its file name gives. A chapter that belongs to a module shows only
// while that module is on. A chapter with broken metadata is left out with a
// sentence saying how to fix it, and stays in the files source mode can open.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { manualChapters } from '../../src/modules/documentation/manual'

let dir: string
const write = (file: string, text: string) =>
  fs.writeFileSync(path.join(dir, file), text)
const chapter = (fields: Record<string, string | number>, body = '') =>
  `---\n${Object.entries(fields)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')}\n---\n\n${body}`

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'manual-'))
})
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

test('[PR-138] chapters come in their set order, with sections, descriptions and their addresses', () => {
  write('team.md', chapter({ title: 'Personal & team use', order: 4 }))
  write(
    'index.md',
    chapter({
      title: 'Overview',
      order: 1,
      description: '"What the studio is: for whom, and how."',
    }),
  )
  write(
    'prototypes.md',
    chapter({ title: 'Prototypes & systems', order: 3, section: 'Working' }),
  )
  write('notes.txt', 'Not a chapter')

  const { chapters, problems } = manualChapters(dir, 'pages', [])
  expect(problems).toEqual([])
  expect(chapters).toEqual([
    {
      slug: 'index',
      title: 'Overview',
      description: 'What the studio is: for whom, and how.',
      section: null,
      file: 'pages/index.md',
    },
    {
      slug: 'prototypes',
      title: 'Prototypes & systems',
      description: '',
      section: 'Working',
      file: 'pages/prototypes.md',
    },
    {
      slug: 'team',
      title: 'Personal & team use',
      description: '',
      section: null,
      file: 'pages/team.md',
    },
  ])
})

test('[PR-144] a chapter that belongs to a module shows only while that module is on', () => {
  write('index.md', chapter({ title: 'Overview', order: 1 }))
  write(
    'canvases.md',
    chapter({ title: 'Canvases', order: 2, module: 'canvas' }),
  )
  const slugs = (enabled: string[]) =>
    manualChapters(dir, 'pages', enabled).chapters.map(({ slug }) => slug)
  expect(slugs(['canvas'])).toEqual(['index', 'canvases'])
  expect(slugs([])).toEqual(['index'])
  // Hidden, not broken: no warning, and its source still opens.
  expect(manualChapters(dir, 'pages', []).problems).toEqual([])
  expect(manualChapters(dir, 'pages', []).files).toContain('pages/canvases.md')
})

test('[PR-143] broken chapter metadata is skipped with a warning that says how to fix it, and stays repairable', () => {
  write('index.md', chapter({ title: 'Overview', order: 1 }))
  write('untitled.md', chapter({ order: 2 }))
  write('unordered.md', chapter({ title: 'Unordered' }))
  write('Bad Name.md', chapter({ title: 'Bad name', order: 3 }))
  write('module.md', chapter({ title: 'Module', order: 4, module: 'No!' }))
  write('plain.md', '# No frontmatter\n')
  write('open.md', '---\ntitle: Never closed\norder: 5\n')

  const { chapters, problems, files } = manualChapters(dir, 'pages', [])
  expect(chapters.map(({ slug }) => slug)).toEqual(['index'])
  expect(problems).toEqual([
    'pages/Bad Name.md: its file name gives the Manual address "Bad Name", which must be lowercase letters, numbers and dashes. Rename the file.',
    'pages/module.md: "module" must be a module ID, such as canvas.',
    'pages/open.md: needs frontmatter with a "title" and a numeric "order".',
    'pages/plain.md: needs frontmatter with a "title" and a numeric "order".',
    'pages/unordered.md: needs a numeric "order" in its frontmatter.',
    'pages/untitled.md: needs a "title" in its frontmatter.',
  ])
  expect(files).toEqual([
    'pages/Bad Name.md',
    'pages/index.md',
    'pages/module.md',
    'pages/open.md',
    'pages/plain.md',
    'pages/unordered.md',
    'pages/untitled.md',
  ])
})

test('[PR-143] chapters are the folder’s own files, so no two share an address', () => {
  write('index.md', chapter({ title: 'Overview', order: 1 }))
  fs.mkdirSync(path.join(dir, 'nested'))
  write('nested/index.md', chapter({ title: 'Nested', order: 2 }))
  // Folders aren't chapters; only the folder's own files are.
  expect(manualChapters(dir, 'pages', []).chapters).toHaveLength(1)
})

test('a studio without the folder has no chapters', () => {
  expect(manualChapters(path.join(dir, 'missing'), 'pages', [])).toEqual({
    chapters: [],
    problems: [],
    files: [],
  })
})
