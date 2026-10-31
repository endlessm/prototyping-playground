// What a system's Context and Skills allow: Context holds Markdown documents
// in folders; Skills holds skill folders, each with its SKILL.md, made with
// New skill. Each refusal is a sentence saying what to do instead.
import { describe, expect, test } from 'vitest'
import {
  contentProblem,
  creatableIn,
  skillDescriptionProblem,
  skillNameProblem,
  skillTemplate,
} from '../../tooling/systems/content-rules'

describe('[SY-124] Context', () => {
  test('makes documents and folders anywhere in it', () => {
    expect(creatableIn('context', '')).toEqual(['document', 'folder'])
    expect(creatableIn('context', 'flows')).toEqual(['document', 'folder'])
  })

  test('documents end in .md; other files are refused', () => {
    expect(
      contentProblem('context', {
        op: 'create',
        path: '',
        name: 'notes.txt',
        kind: 'document',
      }),
    ).toBe('Context documents are Markdown files, and end in .md.')
    expect(
      contentProblem('context', {
        op: 'create',
        path: '',
        name: 'notes.md',
        kind: 'document',
      }),
    ).toBeNull()
    expect(
      contentProblem('context', {
        op: 'create',
        path: '',
        name: 'a.js',
        kind: 'file',
      }),
    ).toBe('That can’t be made here.')
    expect(
      contentProblem('context', {
        op: 'rename',
        path: 'voice.md',
        name: 'voice.txt',
        dir: false,
      }),
    ).toBe('Context documents are Markdown files, and end in .md.')
    expect(
      contentProblem('context', {
        op: 'rename',
        path: 'flows',
        name: 'journeys',
        dir: true,
      }),
    ).toBeNull()
  })

  test('documents and folders move anywhere inside Context', () => {
    for (const to of ['', 'flows'])
      expect(
        contentProblem('context', {
          op: 'move',
          path: 'voice.md',
          to,
          dir: false,
        }),
      ).toBeNull()
  })
})

describe('[SY-125] skill names and descriptions', () => {
  test('a name is lowercase words joined by single hyphens, at most 64 characters', () => {
    expect(skillNameProblem('review-design')).toBeNull()
    expect(skillNameProblem('')).toBe('is missing.')
    expect(skillNameProblem('Review')).toMatch(/lowercase letters/)
    expect(skillNameProblem('-review')).toMatch(/can’t start or end/)
    expect(skillNameProblem('review--design')).toMatch(/single hyphens/)
    expect(skillNameProblem('a'.repeat(65))).toBe(
      'is too long: names are at most 64 characters.',
    )
  })

  test('a description says what it does and when, at most 1024 characters', () => {
    expect(skillDescriptionProblem('Reviews a design. Use when asked.')).toBe(
      null,
    )
    expect(skillDescriptionProblem('   ')).toBe(
      'is missing: say what the skill does and when to use it.',
    )
    expect(skillDescriptionProblem('x'.repeat(1025))).toBe(
      'is too long: descriptions are at most 1024 characters.',
    )
  })

  test('a new SKILL.md starts with its name and description', () => {
    expect(skillTemplate('review', 'Reviews a design. Use when asked.')).toBe(
      '---\nname: review\ndescription: Reviews a design. Use when asked.\n---\n\nSay what to do, step by step, and when it applies.\n',
    )
    // Anything YAML could misread goes in a folded block.
    expect(skillTemplate('review', 'Checks: colour and type')).toBe(
      '---\nname: review\ndescription: >\n  Checks: colour and type\n---\n\nSay what to do, step by step, and when it applies.\n',
    )
  })

  test('skills are made with New skill, not as loose files or folders', () => {
    expect(creatableIn('skills', '')).toEqual(['skill'])
    expect(
      contentProblem('skills', {
        op: 'create',
        path: '',
        name: 'notes',
        kind: 'folder',
      }),
    ).toBe(
      'A skill is made with New skill. It has to be a folder with a SKILL.md.',
    )
  })
})

describe('[SY-126] inside a skill folder', () => {
  test('New file and New folder', () => {
    expect(creatableIn('skills', 'review')).toEqual(['file', 'folder'])
    expect(creatableIn('skills', 'review/scripts')).toEqual(['file', 'folder'])
    expect(
      contentProblem('skills', {
        op: 'create',
        path: 'review',
        name: 'check.mjs',
        kind: 'file',
      }),
    ).toBeNull()
  })

  test('SKILL.md can’t be renamed, moved or deleted alone, and says why', () => {
    const skillFile = { path: 'review/SKILL.md', dir: false }
    expect(
      contentProblem('skills', { op: 'rename', ...skillFile, name: 'x.md' }),
    ).toBe('SKILL.md has to keep its name: it’s how agents find the skill.')
    expect(
      contentProblem('skills', { op: 'move', ...skillFile, to: 'other' }),
    ).toBe('SKILL.md has to stay in its skill’s folder.')
    expect(contentProblem('skills', { op: 'delete', ...skillFile })).toBe(
      'A skill needs its SKILL.md. To remove the skill, delete its folder.',
    )
    // A SKILL.md deeper in a skill is an ordinary file.
    expect(
      contentProblem('skills', {
        op: 'delete',
        path: 'review/references/SKILL.md',
        dir: false,
      }),
    ).toBeNull()
  })

  test('a skill’s folder renames to a valid name, and never moves', () => {
    const folder = { path: 'review', dir: true }
    expect(
      contentProblem('skills', { op: 'rename', ...folder, name: 'critique' }),
    ).toBeNull()
    expect(
      contentProblem('skills', { op: 'rename', ...folder, name: 'Critique' }),
    ).toMatch(/^A skill’s name can use only lowercase letters/)
    expect(
      contentProblem('skills', { op: 'move', ...folder, to: 'other' }),
    ).toBe('A skill’s folder stays in skills/. Rename it, or delete it.')
    expect(contentProblem('skills', { op: 'delete', ...folder })).toBeNull()
  })

  test('files move between skills, but not loose into skills/', () => {
    const file = { path: 'review/check.mjs', dir: false }
    expect(
      contentProblem('skills', { op: 'move', ...file, to: 'other' }),
    ).toBeNull()
    expect(contentProblem('skills', { op: 'move', ...file, to: '' })).toBe(
      'Files in skills/ live inside a skill’s folder.',
    )
  })
})
