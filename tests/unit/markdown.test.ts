// The studio's Markdown pipeline: what a reader gets from a file's text.
import { describe, expect, test } from 'vitest'
import { parseDocument, type MarkdownNode } from '../../app/markdown/parse'

type Element = Extract<MarkdownNode, { type: 'element' }>

const elements = (node: MarkdownNode): Element[] =>
  node.type === 'element' || node.type === 'root'
    ? [
        ...(node.type === 'element' ? [node] : []),
        ...(node.children ?? []).flatMap(elements),
      ]
    : []
const tags = (node: MarkdownNode) => elements(node).map(({ tag }) => tag)
const text = (node: MarkdownNode): string =>
  node.type === 'text'
    ? node.value
    : 'children' in node
      ? (node.children ?? []).map(text).join('')
      : ''
const find = (node: MarkdownNode, tag: string) =>
  elements(node).filter((element) => element.tag === tag)

describe('a document’s title and description', () => {
  test('[PR-107] [CL-119] come from the frontmatter, and an opening heading repeating the title is dropped', async () => {
    const doc = await parseDocument(
      '---\ntitle: Brief\ndescription: What we learned.\n---\n\n# Brief\n\nBody.\n',
    )
    expect(doc.title).toBe('Brief')
    expect(doc.description).toBe('What we learned.')
    expect(tags(doc.body)).toEqual(['p'])
  })

  test('[PR-107] [CL-119] without a title, the opening level-one heading becomes it and leaves the body', async () => {
    const doc = await parseDocument('# Field notes\n\nFirst paragraph.\n')
    expect(doc.title).toBe('Field notes')
    // The first paragraph stays content; it is not a description.
    expect(doc.description).toBeUndefined()
    expect(text(doc.body).trim()).toBe('First paragraph.')
  })

  test('[PR-107] a heading that differs from the frontmatter title stays', async () => {
    const doc = await parseDocument('---\ntitle: Brief\n---\n# Other\n')
    expect(doc.title).toBe('Brief')
    expect(tags(doc.body)).toEqual(['h1'])
  })

  test('[CL-119] a SKILL.md without a heading is titled from its name', async () => {
    const doc = await parseDocument(
      '---\nname: document-component\ndescription: Import one.\n---\nSteps.\n',
      { file: 'skills/document-component/SKILL.md' },
    )
    expect(doc.title).toBe('Document component')
  })

  test('[PR-108] `toc: true` asks for the list of headings', async () => {
    expect((await parseDocument('---\ntoc: true\n---\n## A\n')).toc).toBe(true)
    expect((await parseDocument('## A\n')).toc).toBe(false)
  })

  test('[PR-114] frontmatter that isn’t valid YAML is an error', async () => {
    await expect(
      parseDocument('---\ntitle: [unclosed\n---\nText\n'),
    ).rejects.toThrow()
  })
})

describe('raw HTML', () => {
  test('[PR-110] [CL-119] shows as the text that was typed, and comments are hidden', async () => {
    const doc = await parseDocument(
      'Use <placeholder> here.\n\n<script>alert(1)</script>\n\n<!-- a note for editors -->\n\n<img src=x onerror="alert(1)">\n',
    )
    expect(tags(doc.body)).toEqual(['p', 'p', 'p'])
    expect(text(doc.body)).toContain('Use <placeholder> here.')
    expect(text(doc.body)).toContain('<script>alert(1)</script>')
    expect(text(doc.body)).toContain('<img src=x onerror="alert(1)">')
    expect(text(doc.body)).not.toContain('a note for editors')
  })
})

describe('GitHub-style Markdown', () => {
  test('[PR-110] tables, task lists, strikethrough, footnotes and autolinks', async () => {
    const doc = await parseDocument(
      [
        '| Step | Owner |',
        '| ---- | ----- |',
        '| Plan | Ada   |',
        '',
        '- [x] Done',
        '- [ ] Open',
        '',
        '~~old~~ and https://example.com',
        '',
        'A claim.[^1]',
        '',
        '[^1]: The source.',
        '',
      ].join('\n'),
    )
    const found = tags(doc.body)
    for (const tag of ['table', 'th', 'td', 'input', 'del', 'a', 'sup'])
      expect(found).toContain(tag)
    expect(find(doc.body, 'input').map(({ props }) => props?.checked)).toEqual([
      true,
      false,
    ])
    expect(
      find(doc.body, 'a').some(
        ({ props }) => props?.href === 'https://example.com',
      ),
    ).toBe(true)
    expect(text(doc.body)).toContain('The source.')
    // The footnotes' heading is for screen readers, not "On this page".
    expect(doc.headings).toEqual([])
  })

  test('[PR-108] [CL-119] headings get anchors, and level 2–3 headings are listed', async () => {
    const doc = await parseDocument(
      '## How it works\n\n### The details\n\n#### Too deep\n',
    )
    expect(find(doc.body, 'h2')[0]?.props?.id).toBe('how-it-works')
    expect(doc.headings).toEqual([
      { id: 'how-it-works', text: 'How it works', level: 2 },
      { id: 'the-details', text: 'The details', level: 3 },
    ])
  })
})

describe('files and diagrams in a document', () => {
  test('[PR-112] [CL-119] a file image alone on its line becomes an embed; inline ones stay links; pictures stay images', async () => {
    const doc = await parseDocument(
      [
        '![Sign in](<./flows/Sign in.vue>)',
        '',
        'See ![the brief](./Brief.md) for more.',
        '',
        '![A photo](./photo.png)',
        '',
        '![Second](<./flows/Sign in.vue>)',
        '',
      ].join('\n'),
    )
    const embeds = find(doc.body, 'prototype-artifact')
    expect(embeds.map(({ props }) => [props?.source, props?.label])).toEqual([
      ['./flows/Sign%20in.vue', 'Sign in'],
      ['./flows/Sign%20in.vue', 'Second'],
    ])
    // Each embed keeps its own place through edits around it.
    expect(new Set(embeds.map(({ props }) => props?.key)).size).toBe(2)
    const link = find(doc.body, 'a')[0]
    expect(link?.props?.href).toBe('./Brief.md')
    expect(text(link!)).toBe('the brief')
    expect(find(doc.body, 'img')[0]?.props?.src).toBe('./photo.png')
  })

  test('[PR-112] [PR-103] a permanent address alone on its line embeds too, so a state can be shown', async () => {
    const doc = await parseDocument(
      '![Signed in](/prototypes/p000000000000001/artifacts/s000000000000001)\n',
    )
    expect(
      find(doc.body, 'prototype-artifact').map(({ props }) => props?.source),
    ).toEqual(['/prototypes/p000000000000001/artifacts/s000000000000001'])
  })

  test('[PR-113] [CL-119] a Mermaid fence becomes a diagram with its source', async () => {
    const doc = await parseDocument(
      '```mermaid\nflowchart LR\n  A --> B\n```\n\n```ts\nconst a = 1\n```\n',
    )
    const diagrams = find(doc.body, 'mermaid-diagram')
    expect(diagrams.map(({ props }) => props?.source)).toEqual([
      'flowchart LR\n  A --> B\n',
    ])
    expect(find(doc.body, 'pre')).toHaveLength(1)
  })
})
