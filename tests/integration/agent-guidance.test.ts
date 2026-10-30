import fs from 'node:fs'
import path from 'node:path'
import { afterEach, expect, test } from 'vitest'
import { tempStudio, type TempStudio } from './setup/temp-studio'

let studio: TempStudio
afterEach(() => studio?.remove())

test('[CL-68] adapter destinations must be ordinary folders', () => {
  studio = tempStudio()
  studio.addModule('sample')
  studio.write('saved/keep.md', 'Keep this work\n')
  fs.mkdirSync(path.join(studio.root, '.agents'), { recursive: true })
  fs.symlinkSync(
    path.join(studio.root, 'saved'),
    path.join(studio.root, '.agents/skills'),
    'junction',
  )
  const result = studio.studio('enable', 'sample')
  expect(result.status).toBe(1)
  expect(result.output).toContain('linked')
  expect(studio.exists('saved/studio-module-sample-use-sample/SKILL.md')).toBe(
    false,
  )
})

test('[CL-68] [CL-79] platform and registered system skills appear dynamically', () => {
  studio = tempStudio()
  const skill = (name: string) =>
    `---\nname: ${name}\ndescription: Use ${name}.\n---\n\nDo the task.\n`
  studio.write('src/platform/skills/guide/SKILL.md', skill('guide'))
  studio.write('src/systems/future/skills/explore/SKILL.md', skill('explore'))
  studio.setConfig({ systems: ['future'] })
  expect(studio.studio('sync').status).toBe(0)
  expect(
    studio.read('.agents/skills/studio-platform-guide/SKILL.md'),
  ).toContain('src/platform/skills/guide/SKILL.md')
  expect(
    studio.read('.claude/skills/studio-future-explore/SKILL.md'),
  ).toContain('assigned prototypes')
  studio.setConfig({ systems: [] })
  expect(studio.studio('sync').status).toBe(0)
  expect(studio.exists('.claude/skills/studio-future-explore/SKILL.md')).toBe(
    false,
  )
})

test('[CL-68] [CL-79] enabled modules expose supporting skills without a root task route', () => {
  studio = tempStudio()
  studio.addModule('sample')
  studio.write(
    'src/modules/sample/skills/support/SKILL.md',
    '---\nname: support\ndescription: Supporting guidance.\n---\n\nRead this for support.\n',
  )
  expect(studio.studio('enable', 'sample').status).toBe(0)
  expect(
    studio.exists('.agents/skills/studio-module-sample-support/SKILL.md'),
  ).toBe(true)
  expect(studio.read('AGENTS.md')).not.toContain('skills/support')
})

test('[CL-67] sync preserves exact hand-edited bytes around its block', () => {
  studio = tempStudio()
  const before = '# Custom\r\n\r\nKeep spacing.\r\n'
  const after = '\r\n\r\nMy ending.\r\n'
  studio.write(
    'AGENTS.md',
    `${before}<!-- studio:modules -->\nold route\n<!-- /studio:modules -->${after}`,
  )
  expect(studio.studio('sync').status).toBe(0)
  expect(studio.read('AGENTS.md').startsWith(before)).toBe(true)
  expect(studio.read('AGENTS.md').endsWith(after)).toBe(true)
})

test('[CL-68] malformed adapter manifests cannot delete files outside generated folders', () => {
  studio = tempStudio()
  studio.write('keep.md', 'Keep this work\n')
  studio.write(
    '.agents/studio-skills.json',
    JSON.stringify({ 'keep.md': 'wrong' }),
  )
  const result = studio.studio('sync')
  expect(result.status).toBe(1)
  expect(result.output).toContain('manifest')
  expect(studio.read('keep.md')).toBe('Keep this work\n')
})

test('[CL-37] [CL-67] [CL-69] sync preserves hand guidance and changing commands refresh routes', () => {
  studio = tempStudio()
  studio.write('AGENTS.md', '# My studio\n\nKeep my instructions.\n')
  studio.addModule('sample')
  expect(studio.studio('sync', '--check').status).toBe(1)
  expect(studio.read('AGENTS.md')).toBe(
    '# My studio\n\nKeep my instructions.\n',
  )
  expect(studio.studio('enable', 'sample').status).toBe(0)
  expect(studio.read('AGENTS.md')).toContain('Keep my instructions.')
  expect(studio.read('AGENTS.md')).toContain('src/modules/sample/skills/')
  expect(studio.studio('sync', '--check').status).toBe(0)
  expect(studio.studio('disable', 'sample').status).toBe(0)
  expect(studio.read('AGENTS.md')).not.toContain('src/modules/sample/skills/')
})

test('[CL-68] [CL-79] adapters preserve manual entries and warn on edited generated files', () => {
  studio = tempStudio()
  studio.addModule('sample')
  studio.write('.agents/skills/personal/SKILL.md', 'Personal skill\n')
  expect(studio.studio('enable', 'sample').status).toBe(0)
  const file = '.agents/skills/studio-module-sample-use-sample/SKILL.md'
  expect(studio.read(file)).toContain(
    'src/modules/sample/skills/use-sample/SKILL.md',
  )
  expect(
    studio.exists('.claude/skills/studio-module-sample-use-sample/SKILL.md'),
  ).toBe(true)
  studio.write(file, 'My edits\n')
  const result = studio.studio('sync')
  expect(result.status).toBe(1)
  expect(result.output).toContain('edited')
  expect(studio.read(file)).toBe('My edits\n')
  expect(studio.read('.agents/skills/personal/SKILL.md')).toBe(
    'Personal skill\n',
  )
})

test('[CL-68] skill paths cannot escape their owner', () => {
  studio = tempStudio()
  studio.addModule('sample')
  studio.write(
    'src/modules/sample/module.ts',
    "export default { id: 'sample', label: 'Sample', skills: [{ path: '../../../outside', when: 'asks for outside' }] }",
  )
  const result = studio.studio('enable', 'sample')
  expect(result.status).toBe(1)
  expect(result.output).toContain('skill')
  expect(studio.exists('.agents/skills/studio-module-sample-outside')).toBe(
    false,
  )
})
