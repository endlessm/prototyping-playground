import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { check } from '../../src/modules/document/types/document/check'
import { identity } from '../../src/modules/document/types/document/identity'
import { template } from '../../src/modules/document/types/document/template'
import documents from '../../src/modules/document/module'

describe('a document’s identity in its frontmatter', () => {
  test('[CL-51] is read from `studioId` in the frontmatter', () => {
    expect(
      identity.read(
        '---\ntitle: Brief\nstudioId: abcd000000000001\n---\n# Hi\n',
      ),
    ).toBe('abcd000000000001')
    expect(identity.read('---\nstudioId: "abcd000000000001"\n---\n')).toBe(
      'abcd000000000001',
    )
  })

  test('[CL-51] is missing without frontmatter or without `studioId`', () => {
    expect(identity.read('# Brief\n\nstudioId: abcd000000000001\n')).toBeNull()
    expect(identity.read('---\ntitle: Brief\n---\n')).toBeNull()
  })

  test('[CL-51] a malformed or repeated identity is refused', () => {
    expect(() => identity.read('---\nstudioId: nope\n---\n')).toThrow(
      /16 lowercase/,
    )
    expect(() =>
      identity.read(
        '---\nstudioId: abcd000000000001\nstudioId: abcd000000000002\n---\n',
      ),
    ).toThrow(/only once/)
  })

  test('[CL-51] is written into the frontmatter, keeping its fields, a byte order mark and line endings', () => {
    expect(
      identity.write('---\ntitle: Brief\n---\n\nText\n', 'abcd000000000001'),
    ).toBe('---\nstudioId: abcd000000000001\ntitle: Brief\n---\n\nText\n')
    expect(identity.write('\uFEFF# Brief\r\n', 'abcd000000000001')).toBe(
      '\uFEFF---\r\nstudioId: abcd000000000001\r\n---\r\n# Brief\r\n',
    )
  })

  test('[CL-51] never replaces an identity, and needs closed frontmatter', () => {
    expect(() =>
      identity.write(
        '---\nstudioId: abcd000000000001\n---\n',
        'abcd000000000002',
      ),
    ).toThrow(/already declares/)
    expect(() =>
      identity.write('---\ntitle: Brief\n\nText\n', 'abcd000000000001'),
    ).toThrow(/Close the frontmatter/)
    expect(() =>
      identity.read('---\nstudioId: abcd000000000001\n\nText\n'),
    ).toThrow(/Close the frontmatter/)
  })
})

describe('a new document', () => {
  test('[PR-115] starts with a title and an empty-document line, and takes a permanent ID in its frontmatter', () => {
    const source = template('Research brief')
    expect(source).toBe(
      '---\ntitle: Research brief\n---\n\nThis document is empty. Ask your agent to write it: describe what it’s for and who will read it.\n',
    )
    const identified = identity.write(source, 'abcd000000000001')
    expect(
      identified.startsWith(
        '---\nstudioId: abcd000000000001\ntitle: Research brief\n---\n',
      ),
    ).toBe(true)
    expect(identity.read(identified)).toBe('abcd000000000001')
  })

  test('[PR-115] a title that needs quotes stays valid frontmatter', () => {
    expect(template('Q3: plans')).toContain('title: "Q3: plans"\n')
    expect(template('')).toContain('title: Untitled\n')
  })
})

describe('a document’s checks', () => {
  test('[PR-114] frontmatter that is never closed, or a `toc` that isn’t yes or no, is a problem', () => {
    expect(check('---\ntitle: Brief\n\nText\n')).toEqual([
      'its frontmatter (the block at the top between --- lines) is never closed. End it with a second --- line.',
    ])
    expect(check('---\ntoc: sometimes\n---\n')).toEqual([
      '"toc" in the frontmatter must be true or false.',
    ])
    expect(check('---\ntitle: Brief\ntoc: true\n---\n# Hi\n')).toEqual([])
    expect(check('# No frontmatter\n')).toEqual([])
  })
})

describe('the write-document skill', () => {
  test('[PR-116] the Documents module carries it, covering plain Markdown, Mermaid with accTitle and accDescr, relative links with extensions, embeds and shared context', () => {
    expect(documents.skills).toEqual([
      expect.objectContaining({ path: 'skills/write-document/' }),
    ])
    const skill = readFileSync(
      'src/modules/document/skills/write-document/SKILL.md',
      'utf8',
    )
    expect(skill).toMatch(/^---\r?\nname: write-document\r?\n/)
    for (const rule of [
      'Write plain Markdown',
      'accTitle',
      'accDescr',
      'with their extension',
      'image syntax on its own line',
      "the system's own context",
    ])
      expect(skill).toContain(rule)
  })
})
