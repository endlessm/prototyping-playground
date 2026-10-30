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
import { afterEach, beforeEach, expect, test } from 'vitest'
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
afterEach(() => rmSync(root, { recursive: true, force: true }))

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
  for (const file of ['run.ts', 'changes.ts'])
    write(`tooling/checks/${file}`, readFileSync(`tooling/checks/${file}`))
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
