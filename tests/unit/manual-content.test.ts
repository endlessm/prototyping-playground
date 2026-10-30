// The Manual's own chapters, as the Endless team reads them: every chapter's
// metadata reads, its links between chapters land on real headings, it
// describes this studio (Vue, yarn, one team studio), and what the rewrite
// dropped (updating from upstream, bringing in a React system, old
// addresses) is gone.
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { parseDocument } from '../../app/markdown/parse'
import { manualChapters } from '../../src/modules/documentation/manual'

const DIR = 'src/modules/documentation/pages'
const ALL = ['prototypes', 'canvas', 'document', 'diagrams', 'text']
const read = (slug: string) =>
  readFileSync(path.join(DIR, `${slug}.md`), 'utf8')
const { chapters, problems } = manualChapters(DIR, 'pages', ALL)
const everything = () => chapters.map(({ slug }) => read(slug)).join('\n')

test('[PR-147] [PR-148] [PR-149] [PR-150] [PR-152] [PR-153] [PR-154] [PR-156] every chapter reads, in its order', () => {
  expect(problems).toEqual([])
  expect(chapters.map(({ slug, title }) => [slug, title])).toEqual([
    ['index', 'Overview'],
    ['environment', 'Working environment'],
    ['agent', 'Working with your agent'],
    ['prototypes', 'Prototypes & systems'],
    ['team', 'Working as a team'],
    ['share', 'Publishing & Home'],
    ['customize', 'Modules & settings'],
    ['questions', 'Help'],
  ])
  expect(readdirSync(DIR).filter((name) => name.endsWith('.md'))).toHaveLength(
    chapters.length,
  )
})

test('[PR-138] links between chapters point at chapters and headings that exist', async () => {
  const headings = new Map<string, Set<string>>()
  for (const { slug } of chapters) {
    const document = await parseDocument(read(slug))
    headings.set(slug, new Set(document.headings.map(({ id }) => id)))
  }
  for (const { slug } of chapters)
    for (const [, target, anchor] of read(slug).matchAll(
      /\]\(([a-z-]+)\.md(?:#([^)]+))?\)/g,
    )) {
      expect(headings.has(target!), `${slug} → ${target}`).toBe(true)
      if (anchor)
        expect(
          headings.get(target!)!.has(anchor),
          `${slug} → ${target}#${anchor}`,
        ).toBe(true)
    }
})

describe('what the chapters say', () => {
  test('[PR-150] Delete moves a prototype to the computer’s trash, where it can be restored', () => {
    const prototypes = read('prototypes')
    expect(prototypes).toMatch(
      /Delete\s*\|\s*Moves its folder to your computer's trash \(the Recycle Bin on Windows\), where you can restore it\./,
    )
    expect(everything()).not.toMatch(/permanently remov/i)
  })

  test('[PR-147] [PR-149] [PR-153] the chapters describe the Vue studio for the Endless team, with yarn', () => {
    const text = everything()
    expect(read('index')).toMatch(/Endless Design Studio/)
    expect(read('index')).toMatch(/Views are Vue files/)
    expect(text).toMatch(/yarn studio join/)
    expect(text).not.toMatch(
      /\bpnpm\b|React|shadcn|Tailwind CSS\b|TypeScript, and Tailwind/,
    )
    expect(text).not.toMatch(/AGENTS\.team\.md|Personal mode|Studio use/)
  })

  test('[PR-151] [PR-155] the bring-your-own-system and update sections are gone', () => {
    const text = everything()
    expect(text).not.toMatch(
      /bring in my own system|Curate from shadcn|Bring your own/i,
    )
    expect(text).not.toMatch(/update my studio|studio update|upstream|release/i)
  })

  test('[PR-164] chapters link by file, never by old Reference or Knowledge addresses', () => {
    expect(everything()).not.toMatch(
      /documentation\/(reference|knowledge)|platform\.core|\/documentation\/manual\//,
    )
  })
})
