import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import prototypes from '../../src/modules/prototypes/module'

const skill = (name: string) =>
  readFileSync(`src/modules/prototypes/skills/${name}/SKILL.md`, 'utf8')

describe('the Prototypes module’s agent skills', () => {
  test('[PR-165] build-prototype covers inspecting, creating, views, named states, empty views, systems, dependencies and checking', () => {
    expect(prototypes.skills).toContainEqual(
      expect.objectContaining({ path: 'skills/build-prototype/' }),
    )
    const text = skill('build-prototype')
    expect(text).toMatch(/^---\r?\nname: build-prototype\r?\ndescription: /)
    for (const topic of [
      'yarn studio context src/prototypes/',
      'yarn new "Prototype Name"',
      '--no-system',
      '.vue',
      'export const states',
      '@studio-state',
      'This view is empty',
      "system's `AGENTS.md`",
      '#studio/prototype',
      'yarn studio check',
      'data-preview-state',
      'yarn studio identity-audit',
    ])
      expect(text).toContain(topic)
    // React's advice goes with React.
    expect(text).not.toMatch(/asChild|Base UI|\.tsx|pnpm/)
  })

  test('[PR-166] organize-prototype covers rename, move, duplicate, archive, restore, the previewed delete command, and checking links', () => {
    expect(prototypes.skills).toContainEqual(
      expect.objectContaining({ path: 'skills/organize-prototype/' }),
    )
    const text = skill('organize-prototype')
    expect(text).toMatch(/^---\r?\nname: organize-prototype\r?\ndescription: /)
    for (const topic of [
      '## Rename or move',
      '## Duplicate',
      'rebuild copy',
      '## Archive or restore',
      'Restoring removes `status`',
      'yarn studio delete-prototype src/prototypes/',
      '`--json`',
      'Apply with `--yes` only after they confirm',
      '## Verify',
      'yarn studio identity-audit',
    ])
      expect(text).toContain(topic)
    expect(text).not.toMatch(/pnpm/)
  })
})
