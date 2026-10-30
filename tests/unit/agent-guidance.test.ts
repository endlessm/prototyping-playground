import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'

const read = (file: string) => fs.readFileSync(file, 'utf8')
const rows = [
  ['CL-80', 'agent-context', 'sync --check'],
  ['CL-81', 'assets', 'build:inspect'],
  ['CL-82', 'build-assets', 'watch'],
  ['CL-83', 'checks', 'test:full'],
  ['CL-84', 'config', 'systemMaintainers'],
  ['CL-85', 'contracts-and-instructions', 'src/modules'],
  ['CL-86', 'contributor-preferences', '--apply'],
  ['CL-87', 'contributor-scope', 'canEdit'],
  ['CL-88', 'diagrams', 'accDescr'],
  ['CL-89', 'documentation-standards', 'canonical'],
  ['CL-90', 'file-types', '.vue'],
  ['CL-91', 'formats', 'migration'],
  ['CL-93', 'modules', 'module.ts'],
  ['CL-95', 'personas', 'Endless designers'],
  ['CL-95', 'principles', 'human direct'],
  ['CL-96', 'publishing', 'STUDIO_BASE_PATH'],
  ['CL-98', 'resource-identity', '@studio-state'],
  ['CL-99', 'source', 'Show in Explorer'],
  ['CL-100', 'stack', 'Nuxt 4'],
  ['CL-101', 'system-services', 'preview document'],
  ['CL-102', 'working-in-studio', 'pending rebuild'],
  ['SY-145', 'ui-copy', 'Saving'],
]

test.each(rows)('[%s] %s has current shared guidance', (_id, name, term) => {
  const text = read(`src/platform/context/${name}.md`)
  expect(text).toContain(term)
  expect(text).toMatch(/^---\r?\ntitle:/)
  expect(text).not.toMatch(
    /shadcn|ownership tiers|upstream updates|React view|pnpm |src\/platform\/modules/,
  )
})

test.each([
  ['CL-73', 'configure-studio', 'recovery'],
  ['CL-74', 'setup-contributor', '--link'],
  ['CL-75', 'manage-modules', 'required'],
  ['CL-76', 'maintain-context', 'when trigger'],
  ['CL-77', 'maintain-documentation', 'Manual'],
  ['CL-78', 'check-design-system', 'before applying fixes'],
])('[%s] %s has actionable Vue procedures', (_id, name, term) => {
  const text = read(`src/platform/skills/${name}/SKILL.md`)
  expect(text.toLowerCase()).toContain(term.toLowerCase())
  expect(text).toContain(`name: ${name}`)
  expect(text).not.toMatch(/shadcn|ownership tiers|pnpm |upstream updates/)
})

test('[CL-70] [CL-71] [CL-72] root guidance routes to one shared source and preserves team conventions', () => {
  const text = read('AGENTS.md')
  expect(read('CLAUDE.md').trim()).toBe('@AGENTS.md')
  expect(text).toContain('working-in-studio.md')
  expect(text).toContain('maintain-context/SKILL.md')
  expect(text).toContain('docs/agents/issue-tracker.md')
  expect(text).toContain('docs/agents/triage-labels.md')
  expect(text).toContain('docs/agents/domain.md')
  expect(fs.existsSync('AGENTS.team.md')).toBe(false)
})

test.each([
  ['CL-92', 'installing'],
  ['CL-94', 'ownership'],
  ['CL-97', 'releasing'],
])('[%s] %s distribution guidance is absent', (_id, file) => {
  expect(fs.existsSync(`src/platform/context/${file}.md`)).toBe(false)
})

test('[CL-71] shared guidance links resolve to canonical local files', () => {
  for (const folder of ['src/platform/context', 'src/platform/skills']) {
    for (const entry of fs.readdirSync(folder, { recursive: true })) {
      const file = path.join(folder, String(entry))
      if (!file.endsWith('.md')) continue
      for (const match of read(file).matchAll(/\]\(([^)]+)\)/g)) {
        expect(
          fs.existsSync(path.resolve(path.dirname(file), match[1]!)),
          `${file}: ${match[1]}`,
        ).toBe(true)
      }
    }
  }
})
