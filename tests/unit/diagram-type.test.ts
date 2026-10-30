import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import diagrams from '../../src/modules/diagrams/module'
import { identity } from '../../src/modules/diagrams/types/diagram/identity'
import { template } from '../../src/modules/diagrams/types/diagram/template'

describe('the Diagrams module', () => {
  test('[PR-117] a .mermaid or .mmd file in a prototype is a diagram, with a page, a preview in documents, and its text shipped to the deployed site', () => {
    expect(diagrams.id).toBe('diagrams')
    expect(diagrams.required).toBeFalsy()
    expect(diagrams.fileTypes).toEqual([
      expect.objectContaining({
        id: 'diagram',
        label: 'Diagram',
        extensions: ['.mermaid', '.mmd'],
        page: expect.any(String),
        embed: expect.any(String),
        text: true,
      }),
    ])
  })
})

describe('a diagram’s identity in a leading Mermaid comment', () => {
  test('[PR-122] [CL-51] is read from a leading `%% @studio-id` comment, after other comments', () => {
    expect(
      identity.read(
        '%% @studio-id abcd000000000001\nflowchart LR\n  A --> B\n',
      ),
    ).toBe('abcd000000000001')
    expect(
      identity.read(
        '\uFEFF%% A note\r\n%% @studio-id abcd000000000001\r\nflowchart LR\r\n',
      ),
    ).toBe('abcd000000000001')
  })

  test('[PR-122] [CL-51] is missing when no leading comment declares it', () => {
    expect(identity.read('flowchart LR\n  A --> B\n')).toBeNull()
    // Only the comments before the diagram count.
    expect(
      identity.read('flowchart LR\n%% @studio-id abcd000000000001\n'),
    ).toBeNull()
  })

  test('[PR-122] [CL-51] a malformed or repeated identity is refused', () => {
    expect(() => identity.read('%% @studio-id nope\nflowchart LR\n')).toThrow(
      /16 lowercase/,
    )
    expect(() =>
      identity.read(
        '%% @studio-id abcd000000000001\n%% @studio-id abcd000000000002\nflowchart LR\n',
      ),
    ).toThrow(/only once/)
  })

  test('[PR-122] [CL-51] is written as the first line, keeping a byte order mark and line endings, and never replaced', () => {
    expect(
      identity.write('\uFEFF%% A note\r\nflowchart LR\r\n', 'abcd000000000001'),
    ).toBe(
      '\uFEFF%% @studio-id abcd000000000001\r\n%% A note\r\nflowchart LR\r\n',
    )
    expect(() =>
      identity.write(
        '%% @studio-id abcd000000000001\nflowchart LR\n',
        'abcd000000000002',
      ),
    ).toThrow(/already declares/)
  })
})

describe('a new diagram', () => {
  test('[PR-122] is a small flowchart with an accessible title and description, and takes its permanent ID in a leading comment', () => {
    const source = template('Sign in flow')
    expect(source).toBe(
      'flowchart LR\n  accTitle: Sign in flow\n  accDescr: A starting point connects an idea to its next step.\n  idea[Idea] --> next[Next step]\n',
    )
    const identified = identity.write(source, 'abcd000000000001')
    expect(identified.split('\n')[0]).toBe('%% @studio-id abcd000000000001')
    expect(identity.read(identified)).toBe('abcd000000000001')
  })

  test('[PR-122] a title stays on its line', () => {
    expect(template('Two\nlines')).toContain('  accTitle: Two lines\n')
    expect(template('  ')).toContain('  accTitle: Untitled\n')
  })
})

describe('the create-diagram skill', () => {
  test('[PR-123] the Diagrams module carries it, covering standalone files, accessibility fields, fences versus files, and one-way Excalidraw import', () => {
    expect(diagrams.skills).toEqual([
      expect.objectContaining({ path: 'skills/create-diagram/' }),
    ])
    const skill = readFileSync(
      'src/modules/diagrams/skills/create-diagram/SKILL.md',
      'utf8',
    )
    expect(skill).toMatch(/^---\r?\nname: create-diagram\r?\ndescription: /)
    for (const topic of [
      '.mermaid',
      '.mmd',
      'accTitle',
      'accDescr',
      'fence',
      '![',
      'Excalidraw',
      '@studio-id',
      'yarn studio context',
    ])
      expect(skill).toContain(topic)
  })
})
