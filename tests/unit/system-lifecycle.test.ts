// The system lifecycle's plans and their rollback, with the file system's
// folder moves refused the way Windows refuses a folder another program
// holds (EPERM), on any computer.
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import {
  applyPlan,
  editDeclaration,
  heldFolders,
  nameProblem,
  planLifecycle,
  systemKey,
  type LifecycleOptions,
} from '../../tooling/systems/lifecycle'

const HARBOR = 'hrbr000000000001'
const ES = 'es00000000000001'
let root: string
let options: LifecycleOptions

const declaration = (label: string, id: string) =>
  [
    'export default {',
    `  label: '${label}',`,
    "  status: 'active',",
    "  role: 'prototype',",
    "  styling: 'custom',",
    "  colorModes: ['light', 'dark'],",
    "  docs: 'warn',",
    "  libraries: [{ kind: 'package', id: 'vue', label: 'Vue', package: 'vue' }],",
    '  origin: null,',
    `  studioId: '${id}',`,
    "  app: { factory: { from: 'app.ts', name: 'createApp' } },",
    '}',
    '',
  ].join('\n')

const refused =
  (code = 'EPERM') =>
  () => {
    throw Object.assign(new Error(`${code}: operation not permitted`), { code })
  }

beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), 'studio-lifecycle-'))
  for (const [key, label, id] of [
    ['harbor', 'Harbor', HARBOR],
    ['endless', 'Endless', ES],
  ]) {
    mkdirSync(path.join(root, 'src/systems', key!, 'context'), {
      recursive: true,
    })
    writeFileSync(
      path.join(root, 'src/systems', key!, 'system.ts'),
      declaration(label!, id!),
    )
    writeFileSync(path.join(root, 'src/systems', key!, 'context/a.md'), '# A\n')
  }
  writeFileSync(
    path.join(root, 'studio.config.json'),
    `${JSON.stringify({ systems: ['endless', 'harbor'], defaultSystem: ES, systemMaintainers: { [HARBOR]: [] } }, null, 2)}\n`,
  )
  options = { root }
})
afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('a held folder', () => {
  test('[CL-09] is found before confirmation on Windows', () => {
    const plan = planLifecycle(options, 'delete', 'harbor')
    const held = heldFolders(
      { ...options, platform: 'win32', ops: { rename: refused() } },
      plan,
    )
    expect(held).toEqual([
      'src/systems/harbor is in use by another program, often a running dev server, an editor or a terminal opened in that folder. Stop it, then try again.',
    ])
    expect(heldFolders({ ...options, platform: 'win32' }, plan)).toEqual([])
  })

  test('[CL-08] [CL-09] refuses the change with a plain warning and leaves everything as it was', async () => {
    const config = readFileSync(path.join(root, 'studio.config.json'), 'utf8')
    const plan = planLifecycle(
      { ...options, ops: { rename: refused(), copy: refused() } },
      'rename',
      'harbor',
      { label: 'Dock' },
    )
    await expect(
      applyPlan(
        { ...options, ops: { rename: refused(), copy: refused() } },
        plan,
      ),
    ).rejects.toMatchObject({
      status: 409,
      message:
        'src/systems/harbor is in use by another program, often a running dev server, an editor or a terminal opened in that folder. Stop it, then try again.',
    })
    expect(existsSync(path.join(root, 'src/systems/harbor/system.ts'))).toBe(
      true,
    )
    expect(existsSync(path.join(root, 'src/systems/dock'))).toBe(false)
    expect(
      readFileSync(path.join(root, 'src/systems/harbor/system.ts'), 'utf8'),
    ).toContain("label: 'Harbor'")
    expect(readFileSync(path.join(root, 'studio.config.json'), 'utf8')).toBe(
      config,
    )
    expect(existsSync(path.join(root, '.studio-system-operation'))).toBe(false)
  })

  test('[CL-09] a refused rename falls back to copying', async () => {
    const plan = planLifecycle(options, 'rename', 'harbor', { label: 'Dock' })
    const result = await applyPlan(
      { ...options, ops: { rename: refused('EBUSY') } },
      plan,
    )
    expect(result).toMatchObject({ key: 'dock', studioId: HARBOR })
    expect(existsSync(path.join(root, 'src/systems/harbor'))).toBe(false)
    expect(
      readFileSync(path.join(root, 'src/systems/dock/context/a.md'), 'utf8'),
    ).toBe('# A\n')
  })
})

describe('names and declarations', () => {
  test('[SY-22] a name becomes the folder key: accents stripped, lowercased, hyphens', () => {
    expect(systemKey('Café Ops!')).toBe('cafe-ops')
    expect(systemKey('  Harbor  2 ')).toBe('harbor-2')
    expect(nameProblem('2 Harbors')).toBe('Start the name with a letter.')
    expect(nameProblem('')).toBe(
      'Use a plain name between 1 and 120 characters.',
    )
    expect(nameProblem('x'.repeat(121))).toBe(
      'Use a plain name between 1 and 120 characters.',
    )
    expect(nameProblem('<b>Bold</b>')).toBe(
      'Use a plain name between 1 and 120 characters.',
    )
    expect(nameProblem('Harbor')).toBeNull()
  })

  test('[SY-46] [SY-47] edits only the top-level label and status, and notes references to review', () => {
    const source = declaration('Harbor', HARBOR)
    const next = editDeclaration(source, {
      label: "Captain's Dock",
      status: 'archived',
      renameReview: ['src/a.ts'],
    })
    expect(next).toContain("  label: 'Captain\\'s Dock',")
    expect(next).toContain(
      "  status: 'archived',\n  renameReview: ['src/a.ts'],",
    )
    expect(next).toContain("label: 'Vue'")
    expect(editDeclaration(next, { renameReview: [] })).not.toContain(
      'renameReview',
    )
  })
})
