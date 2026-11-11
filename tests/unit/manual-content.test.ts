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

const questions = (slug: string) =>
  [...read(slug).matchAll(/^## (.+?)\r?$/gm)].map(([, heading]) => heading)

describe('what each chapter answers', () => {
  test('[PR-147] Overview: what the studio is, how it’s organized (with a diagram), what it’s made of and where to look next', () => {
    expect(questions('index')).toEqual([
      'What is the Endless Prototyping Playground?',
      'How is the studio organized?',
      'What is it made of?',
      'What can it simulate?',
      'Where should I look next?',
    ])
    expect(read('index')).toContain('```mermaid')
  })

  test('[PR-148] Working environment: getting started, what needs to be open, returning, joining the team, only looking', () => {
    expect(questions('environment')).toEqual([
      'How do I get started?',
      'What needs to be open?',
      'How do I return later?',
      'How do I join the team?',
      'What if I only want to look?',
    ])
  })

  test('[PR-149] Working with your agent: what it handles, what to tell it, showing, doing it yourself, reviewing', () => {
    expect(questions('agent')).toEqual([
      'What does the agent handle?',
      'What should I tell it?',
      'How do I show the agent what I mean?',
      'What can I do directly in the studio?',
      'How do I review and refine work?',
    ])
  })

  test('[PR-150] Prototypes & systems: artifacts, previews, systems, creating, organizing, supporting artifacts, lo-fi and rebuild copies, archive and delete', () => {
    expect(questions('prototypes')).toEqual([
      'What belongs in a prototype?',
      'What are named states?',
      'How do previews work?',
      'What belongs in a system?',
      'How do I create a prototype?',
      'How do I organize artifacts?',
      'How do documents, diagrams and canvases connect?',
      'Can I try another look or another system?',
      'What do archive and delete do?',
    ])
    expect(read('prototypes')).toMatch(/Make lo-fi/)
    expect(read('prototypes')).toMatch(/rebuild copy/)
  })

  test('[PR-152] Working as a team: who can change what, joining, working safely, branches and pull requests, reviewers', () => {
    expect(questions('team')).toEqual([
      'How does the team share one studio?',
      'Who can change what?',
      'How does a teammate join?',
      "How do teammates work without getting in each other's way?",
      'How do changes reach the team?',
      "Should prototype work wait until it's finished?",
      'How do I involve reviewers and engineers?',
    ])
    expect(read('team')).toMatch(/pull request/)
  })

  test('[PR-153] Publishing & Home: build versus publish, publishing, what becomes visible, Home, sharing', () => {
    expect(questions('share')).toEqual([
      'What is the difference between building and publishing?',
      'How do I publish?',
      'What becomes visible?',
      'What does Home show?',
      'How do I change Home?',
      'How do I share with reviewers and engineers?',
    ])
  })

  test('[PR-154] Modules & settings: where to start, settings, modules, adding features, agent guidance', () => {
    expect(questions('customize')).toEqual([
      'Where should I start?',
      'How do I change settings?',
      'What are modules?',
      'Can my agent add a feature?',
      'How do I edit the Manual and the guidance?',
      'Where does guidance for the agent go?',
    ])
  })

  test('[PR-156] Help: the studio won’t open, where work is, missing things, changes not appearing, looks, source, editing, broken things, published work, earlier versions', () => {
    expect(questions('questions')).toEqual([
      "The studio won't open. What should I do?",
      'Where is my work?',
      'Why is a tool or artifact missing?',
      'Why are my changes not appearing?',
      'Why does my prototype look different than expected?',
      'How do I edit source?',
      "Why can't I edit something?",
      'A diagram, view or link is broken. What should I give the agent?',
      'Published work is missing or out of date. What should I check?',
      'Can I get an earlier version back?',
    ])
  })
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
    expect(read('index')).toMatch(/Endless Prototyping Playground/)
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

test('[PR-146] the write-manual skill points agents at the Vue studio’s chapters and checks', () => {
  const skill = readFileSync(
    'src/modules/documentation/skills/write-manual/SKILL.md',
    'utf8',
  )
  expect(skill).toMatch(/^name: write-manual\r?$/m)
  expect(skill).toContain('src/modules/documentation/pages/*.md')
  expect(skill).toContain('tests/unit/manual-content.test.ts')
  expect(skill).not.toMatch(/src\/platform\/modules|pnpm/)
})

test('[CV-157] the Manual says how canvases work', () => {
  const prototypes = read('prototypes')
  for (const point of [
    /Excalidraw's own tools/,
    /\*\*T\*\* for text/,
    /Library/,
    /Drag an artifact from the file tree onto the canvas, or paste its link/,
    /follow their source/,
    /documents and other canvases show as cards/,
    /only artifacts from its own prototype/,
    /Paste or drop an image/,
    /saves itself/,
    /Other people's canvases and canvases on the deployed site are read-only/,
    /Mermaid to Excalidraw.*separate shapes/,
    /picture of the whole canvas/,
  ])
    expect(prototypes).toMatch(point)
  expect(read('agent')).toMatch(/lay out a canvas.*undo/s)
})
