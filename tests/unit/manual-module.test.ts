// The Documentation module's declaration: its chapters in the command
// palette's Manual group, and its build data, which warns about a broken
// chapter while the studio runs and stops the build on it.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import documentation from '../../src/modules/documentation/module'
import { check } from '../../src/modules/documentation/check'

let dir: string
const write = (file: string, text: string) => {
  fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
  fs.writeFileSync(path.join(dir, file), text)
}
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'documentation-'))
  write('pages/index.md', '---\ntitle: Overview\norder: 1\n---\n\n# Overview\n')
  write('pages/broken.md', '---\ntitle: Broken\n---\n')
})
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

const load = (dev: boolean) =>
  documentation.data.manual.load({
    root: path.dirname(dir),
    dir,
    enabled: [],
    dev,
  }) as { chapters: { slug: string }[]; problems: string[]; files: string[] }

test('[PR-143] a broken chapter warns while the studio runs, and stops the build', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const data = load(true)
  expect(data.chapters.map(({ slug }) => slug)).toEqual(['index'])
  expect(data.problems).toEqual([
    'pages/broken.md: needs a numeric "order" in its frontmatter.',
  ])
  expect(data.files).toEqual(['pages/broken.md', 'pages/index.md'])
  expect(warn).toHaveBeenCalledWith(
    'Warning: The Manual skipped pages/broken.md: needs a numeric "order" in its frontmatter.',
  )
  warn.mockRestore()

  expect(() => load(false)).toThrow(
    /The Manual has chapters that can’t be read:\npages\/broken\.md: needs a numeric "order"/,
  )
  expect(check({ dir, enabled: [] })).toEqual([
    'pages/broken.md: needs a numeric "order" in its frontmatter.',
  ])
})

test('[PR-140] the palette’s Manual group lists the chapters by title, in order', () => {
  expect(
    documentation.palette.map(({ label, to, group }) => [label, to, group]),
  ).toEqual([
    ['Overview', '/documentation/manual', 'Manual'],
    ['Working environment', '/documentation/manual/environment', 'Manual'],
    ['Working with your agent', '/documentation/manual/agent', 'Manual'],
    ['Prototypes & systems', '/documentation/manual/prototypes', 'Manual'],
    ['Working as a team', '/documentation/manual/team', 'Manual'],
    ['Publishing & Home', '/documentation/manual/share', 'Manual'],
    ['Modules & settings', '/documentation/manual/customize', 'Manual'],
    ['Help', '/documentation/manual/questions', 'Manual'],
  ])
})

test('[PR-145] the Manual is optional, with its own rail button', () => {
  expect(documentation).not.toHaveProperty('required')
  expect(documentation.rail).toMatchObject({
    position: 'top',
    to: '/documentation/manual',
  })
})
