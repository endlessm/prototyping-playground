// The prompt a new system's setup panel builds for the agent: the system by
// name and key, one of the two Vue paths (bring a Vue app in, or start from
// Nuxt UI), and whatever optional details were given. No shadcn or React.
import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { setupPrompt } from '../../src/modules/systems/utils/setup'

const system = { key: 'harbor', label: 'Harbor' }

describe('the setup prompt', () => {
  test('[SY-78] [SY-73] bringing a Vue app in names the system, the source and the skill', () => {
    expect(
      setupPrompt({
        ...system,
        path: 'vue',
        source: ' https://github.com/acme/harbor-app ',
        build: 'A dock schedule',
      }),
    ).toBe(
      [
        'Bring my existing Vue app into “Harbor” (system “harbor”) and suggest what to bring into Studio first.',
        '',
        'Source:',
        'https://github.com/acme/harbor-app',
        '',
        'I want to build:',
        'A dock schedule',
        '',
        'Use the setup-design-system skill for system “harbor”. Show me the plan before importing.',
      ].join('\n'),
    )
  })

  test('[SY-78] [SY-76] starting from Nuxt UI carries the optional DESIGN.md, goal and components', () => {
    expect(setupPrompt({ ...system, path: 'nuxt-ui' })).toBe(
      'Help me set up “Harbor” (system “harbor”) starting from Nuxt UI.\n\nUse the setup-design-system skill for system “harbor”. Start with the theme and assets, and show them in Studio for my review.',
    )
    expect(
      setupPrompt({
        ...system,
        path: 'nuxt-ui',
        designMd: 'docs/DESIGN.md',
        build: 'Support dashboards',
        components: 'Buttons, a data table',
      }),
    ).toBe(
      [
        'Help me set up “Harbor” (system “harbor”) starting from Nuxt UI.',
        '',
        'Use this DESIGN.md as my design direction: docs/DESIGN.md',
        '',
        'I want to build:',
        'Support dashboards',
        '',
        'Please include: Buttons, a data table',
        '',
        'Use the setup-design-system skill for system “harbor”. Start with the theme and assets, and show them in Studio for my review.',
      ].join('\n'),
    )
  })

  test('[SY-153] [SY-156] agents are routed to the setup-design-system skill, which covers the two Vue paths only', () => {
    expect(readFileSync('AGENTS.md', 'utf8')).toContain(
      '(src/modules/systems/skills/setup-design-system/SKILL.md)',
    )
    const skill = [
      'SKILL.md',
      'references/bring-in-vue-app.md',
      'references/start-from-nuxt-ui.md',
    ]
      .map((file) =>
        readFileSync(
          `src/modules/systems/skills/setup-design-system/${file}`,
          'utf8',
        ),
      )
      .join(' ')
    expect(skill).toContain('Bring in a Vue app')
    expect(skill).toContain('Start from Nuxt UI')
    expect(skill).toContain('yarn studio create-system')
    expect(skill).toContain('setup: {')
    expect(skill).not.toMatch(/\bpnpm\b|\.tsx\b/)
    // Only to say there is no such path.
    expect(skill.match(/shadcn/gi)).toEqual(['shadcn'])
  })

  test('[SY-154] [SY-155] the other design-system skills are written for Vue and Nuxt UI', () => {
    const document = readFileSync(
      'src/modules/systems/skills/document-component/SKILL.md',
      'utf8',
    )
    expect(document).toContain('yarn component-docs')
    const check = readFileSync(
      'src/platform/skills/check-design-system/SKILL.md',
      'utf8',
    )
    expect(check).toContain('Nuxt UI')
    for (const skill of [document, check])
      expect(skill).not.toMatch(/shadcn|React|\.tsx\b|\bpnpm\b/)
  })

  test('[SY-74] [SY-75] [SY-77] neither path mentions shadcn or React', () => {
    for (const path of ['vue', 'nuxt-ui'] as const)
      expect(
        setupPrompt({ ...system, path, source: 'x', build: 'y' }),
      ).not.toMatch(/shadcn|react|preset/i)
  })
})
