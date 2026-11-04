import { execFileSync, spawnSync } from 'node:child_process'
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  assetProblems,
  changedFiles,
  git,
  scopeReport,
} from '../../tooling/checks/changes'

let root: string
const write = (file: string, source: string | Buffer) => {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
  writeFileSync(path.join(root, file), source)
}
beforeEach(() => {
  // GitHub Actions sets GITHUB_ACTOR, which makes scope match profiles by
  // GitHub login; these tests identify Ben by his Git email instead.
  vi.stubEnv('GITHUB_ACTOR', '')
  root = mkdtempSync(path.join(os.tmpdir(), 'studio-checks-'))
  git(root, 'init')
  git(root, 'config', 'user.email', 'ben@example.com')
  git(root, 'config', 'user.name', 'Ben')
  write('studio.config.json', JSON.stringify({ admins: ['ada0000000000001'] }))
  write(
    'contributors/ben.json',
    JSON.stringify({ studioId: 'ben0000000000002', email: 'ben@example.com' }),
  )
  write(
    'src/prototypes/ben/demo/Home.vue',
    '<!-- @studio-id abc0000000000001 -->',
  )
  git(root, 'add', '.')
  execFileSync('git', ['-c', 'core.hooksPath=', 'commit', '-m', 'base'], {
    cwd: root,
    stdio: 'ignore',
  })
})
afterEach(() => {
  vi.unstubAllEnvs()
  rmSync(root, { recursive: true, force: true })
})

test('[CL-130] [PR-96] size guard checks staged bytes, threshold and reasoned allowlist', () => {
  write('photo.png', Buffer.alloc(750 * 1024 + 1))
  git(root, 'add', '.')
  write('photo.png', 'small unstaged replacement')
  expect(assetProblems(root, changedFiles(root)).join()).toContain('WebP')
  write(
    '.studio/asset-allowlist.json',
    JSON.stringify({ 'photo.png': 'Source image for export' }),
  )
  git(root, 'add', '.studio/asset-allowlist.json')
  expect(assetProblems(root, changedFiles(root))).toEqual([])
})

test('[CL-131] scope reads permissions before the proposal and warns about changed IDs', () => {
  write('studio.config.json', JSON.stringify({ admins: ['ben0000000000002'] }))
  write(
    'src/prototypes/ben/demo/Home.vue',
    '<!-- @studio-id abc0000000000002 -->',
  )
  git(root, 'add', '.')
  const report = scopeReport(root, changedFiles(root))
  expect(report.outside).toContain('studio.config.json')
  expect(report.outside).not.toContain('src/prototypes/ben/demo/Home.vue')
  expect(report.identity.join()).toContain('was removed or changed')
})

test('[CL-131] [CL-147] CLI warns locally, flags PRs, and fails out-of-scope pushes', () => {
  write('package.json', '{"type":"module"}')
  for (const file of [
    'checks/run.ts',
    'checks/changes.ts',
    'modules/prototype-folder.ts',
  ])
    write(`tooling/${file}`, readFileSync(`tooling/${file}`))
  write('private.ts', 'export const changed = true')
  git(root, 'add', '.')
  execFileSync('git', ['-c', 'core.hooksPath=', 'commit', '-m', 'proposal'], {
    cwd: root,
    stdio: 'ignore',
  })
  const run = (...args: string[]) =>
    spawnSync(process.execPath, ['tooling/checks/run.ts', 'scope', ...args], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, GITHUB_ACTOR: '', STUDIO_REPOSITORY_ROLE: '' },
    })
  expect(run().status).toBe(0)
  const push = run('--ci', 'HEAD~1', 'HEAD')
  expect(push.status).toBe(1)
  expect(push.stdout).toContain('outside scope: private.ts')
  expect(run('--ci', 'HEAD~1', 'HEAD', '--review').status).toBe(0)
})

describe('a module’s prototype folder', () => {
  // Cara is registered but no Admin; the comments module is turned off,
  // and its declaration still counts.
  beforeEach(() => {
    write(
      'studio.config.json',
      JSON.stringify({
        admins: ['ada0000000000001'],
        modules: { comments: false },
      }),
    )
    write(
      'contributors/cara.json',
      JSON.stringify({
        studioId: 'cara000000000003',
        email: 'cara@example.com',
      }),
    )
    write(
      'src/modules/comments/module.ts',
      "export default {\n  id: 'comments',\n  prototypeFolder: { name: '.comments', one: 'comment', other: 'comments' },\n}\n",
    )
    write('src/prototypes/ben/demo/.comments/c0mm000000000001.json', '{}\n')
    git(root, 'add', '.')
    execFileSync('git', ['-c', 'core.hooksPath=', 'commit', '-m', 'comments'], {
      cwd: root,
      stdio: 'ignore',
    })
    git(root, 'config', 'user.email', 'cara@example.com')
  })

  test('[CM-56] committing to someone else’s comments is inside scope; their view stays outside', () => {
    write(
      'src/prototypes/ben/demo/.comments/c0mm000000000001.json',
      '{"a":1}\n',
    )
    write('src/prototypes/ben/demo/.comments/c0mm000000000002.json', '{}\n')
    write(
      'src/prototypes/ben/demo/Home.vue',
      '<!-- @studio-id abc0000000000001 -->\n<template>Changed</template>',
    )
    git(root, 'add', '.')
    const report = scopeReport(root, changedFiles(root))
    expect(report.lines).toEqual([
      'inside scope: src/prototypes/ben/demo/.comments/c0mm000000000001.json',
      'inside scope: src/prototypes/ben/demo/.comments/c0mm000000000002.json',
      'outside scope: src/prototypes/ben/demo/Home.vue',
    ])
    expect(report.outside).toEqual(['src/prototypes/ben/demo/Home.vue'])
  })

  test('[CM-56] someone unregistered stays outside, and so does a hidden folder no module declares', () => {
    write('src/prototypes/ben/demo/.drafts/x.json', '{}\n')
    git(root, 'add', '.')
    expect(scopeReport(root, changedFiles(root)).outside).toEqual([
      'src/prototypes/ben/demo/.drafts/x.json',
    ])
    git(root, 'config', 'user.email', 'nobody@example.com')
    write('src/prototypes/ben/demo/.comments/c0mm000000000002.json', '{}\n')
    git(root, 'add', '.')
    expect(scopeReport(root, changedFiles(root)).outside).toContain(
      'src/prototypes/ben/demo/.comments/c0mm000000000002.json',
    )
  })

  test('[CM-56] a folder a proposal declares only grants scope once it is in', () => {
    write(
      'src/modules/notes/module.ts',
      "export default { id: 'notes', prototypeFolder: { name: '.notes', one: 'note', other: 'notes' } }\n",
    )
    write('src/prototypes/ben/demo/.notes/x.json', '{}\n')
    git(root, 'add', '.')
    expect(scopeReport(root, changedFiles(root)).outside).toContain(
      'src/prototypes/ben/demo/.notes/x.json',
    )
  })
})

test('[CL-131] document frontmatter and canvas identities cannot change unnoticed', () => {
  write(
    'src/prototypes/ben/demo/Brief.md',
    '---\nstudioId: abc0000000000003\n---\nText',
  )
  write(
    'src/prototypes/ben/demo/Sketch.excalidraw',
    '{"studioId":"abc0000000000004"}',
  )
  git(root, 'add', '.')
  execFileSync('git', ['-c', 'core.hooksPath=', 'commit', '-m', 'artifacts'], {
    cwd: root,
    stdio: 'ignore',
  })
  write(
    'src/prototypes/ben/demo/Brief.md',
    '---\nstudioId: abc0000000000005\n---\nText',
  )
  write(
    'src/prototypes/ben/demo/Sketch.excalidraw',
    '{"studioId":"abc0000000000006"}',
  )
  git(root, 'add', '.')
  const report = scopeReport(root, changedFiles(root))
  expect(report.identity.join()).toContain(
    'Brief.md: permanent ID abc0000000000003 was removed',
  )
  expect(report.identity.join()).toContain(
    'Sketch.excalidraw: permanent ID abc0000000000004 was removed',
  )
})

test('[CL-131] documentation examples and canvas element data are not resource identities', () => {
  write(
    'src/prototypes/ben/demo/Brief.md',
    '---\nstudioId: abc0000000000003\n---\nExample: <!-- @studio-id abc0000000000001 -->',
  )
  write(
    'src/prototypes/ben/demo/Sketch.excalidraw',
    '{"studioId":"abc0000000000004","elements":[{"studioId":"abc0000000000001"}]}',
  )
  git(root, 'add', '.')
  expect(scopeReport(root, changedFiles(root)).identity).toEqual([])
})

test.each(['mermaid', 'mmd'])(
  '[CL-131] .%s protects leading identities and ignores diagram labels',
  (extension) => {
    write(
      `src/prototypes/ben/demo/Flow.${extension}`,
      '%% @studio-id abc0000000000003\nflowchart TD\nA["@studio-id abc0000000000001"]',
    )
    git(root, 'add', '.')
    const initial = scopeReport(root, changedFiles(root))
    expect(initial.identity).toEqual([])
    execFileSync('git', ['-c', 'core.hooksPath=', 'commit', '-m', extension], {
      cwd: root,
      stdio: 'ignore',
    })
    write(
      `src/prototypes/ben/demo/Flow.${extension}`,
      '%% @studio-id abc0000000000004\nflowchart TD\nA["@studio-id abc0000000000001"]',
    )
    git(root, 'add', '.')
    expect(scopeReport(root, changedFiles(root)).identity.join()).toContain(
      `Flow.${extension}: permanent ID abc0000000000003 was removed`,
    )
  },
)
