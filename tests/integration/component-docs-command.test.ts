// yarn component-docs: previews, then adds the examples file and page each
// component is missing, from templates, without touching existing files.
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { tempStudio, type TempStudio } from './setup/temp-studio'

let studio: TempStudio

const HARBOR = {
  label: 'Harbor',
  status: 'active',
  role: 'prototype',
  styling: 'tailwind',
  colorModes: ['light'],
  docs: 'warn',
  libraries: [],
  origin: null,
  studioId: 'hrbr000000000001',
  app: { factory: { from: 'app.ts', name: 'createApp' } },
}

const BADGE = `<script setup lang="ts">
defineProps<{
  /** The badge's text. */
  label: string
  items: string[]
  tone?: 'quiet' | 'loud'
}>()
</script>
<template><span>{{ label }}</span></template>
`

beforeEach(() => {
  studio = tempStudio({ inside: true })
  studio.write(
    'src/systems/harbor/system.ts',
    `export default ${JSON.stringify(HARBOR)}\n`,
  )
  studio.setConfig({ systems: ['harbor'] })
  studio.write('src/systems/harbor/components/Badge.vue', BADGE)
  studio.write(
    'src/systems/harbor/components/card/card.vue',
    '<template><div /></template>\n',
  )
  studio.write('src/systems/harbor/components/card/card.md', 'Our own page.\n')
})
afterEach(() => studio.remove())

const at = (file: string) => `src/systems/harbor/components/${file}`

describe('yarn component-docs', { timeout: 60_000 }, () => {
  test('[CL-162] [SY-151] previews what it would add and changes nothing', () => {
    const result = studio.studio('component-docs', 'harbor')
    expect(result.status).toBe(0)
    expect(result.stdout).toContain(
      `Move ${at('Badge.vue')} to ${at('Badge/Badge.vue')}`,
    )
    expect(result.stdout).toContain(`Create ${at('Badge/index.ts')}`)
    expect(result.stdout).toContain(`Create ${at('Badge/Badge.examples.vue')}`)
    expect(result.stdout).toContain(`Create ${at('Badge/Badge.md')}`)
    expect(result.stdout).toContain(`Create ${at('card/card.examples.vue')}`)
    expect(result.stdout).not.toContain('card/card.md')
    expect(result.stdout).toContain('run the same command with --yes')
    expect(studio.exists(at('Badge.vue'))).toBe(true)
    expect(studio.exists(at('card/card.examples.vue'))).toBe(false)
  })

  test('[CL-162] [SY-151] with --yes, writes the templates, fills required props and keeps existing files', () => {
    const result = studio.studio('component-docs', 'harbor', '--yes')
    expect(result.status).toBe(0)
    expect(result.stdout).toContain(`Created ${at('Badge/Badge.md')}`)
    expect(studio.read(at('Badge/Badge.vue'))).toBe(BADGE)
    expect(studio.read(at('Badge/index.ts'))).toContain(
      "export { default } from './Badge.vue'",
    )
    const examples = studio.read(at('Badge/Badge.examples.vue'))
    expect(examples).toContain("import Badge from './Badge.vue'")
    expect(examples).toContain('<Example name="Default">')
    expect(examples).toContain('<Badge label="Label" :items="undefined" />')
    expect(examples).toContain('Replace each undefined with a real value.')
    const page = studio.read(at('Badge/Badge.md'))
    expect(page).toContain('title: Badge')
    expect(page).toContain('## When to use')
    expect(studio.read(at('card/card.md'))).toBe('Our own page.\n')
    expect(studio.exists(at('card/card.examples.vue'))).toBe(true)

    const again = studio.studio('component-docs', 'harbor', '--yes')
    expect(again.stdout).toContain('Nothing to add')
  })

  test('[CL-162] one component by name; an unknown one or system is refused', () => {
    const one = studio.studio('component-docs', 'harbor', 'card', '--yes')
    expect(one.status).toBe(0)
    expect(one.stdout).toContain(`Created ${at('card/card.examples.vue')}`)
    expect(studio.exists(at('Badge.vue'))).toBe(true)

    const missing = studio.studio('component-docs', 'harbor', 'dialog')
    expect(missing.status).toBe(1)
    expect(missing.stderr).toContain('No component named "dialog"')

    const unknown = studio.studio('component-docs', 'lighthouse')
    expect(unknown.status).toBe(1)
    expect(unknown.stderr).toContain(`"lighthouse" isn't a system`)

    const usage = studio.studio('component-docs')
    expect(usage.status).toBe(1)
    expect(usage.stderr).toContain('Usage: yarn component-docs')
  })
})
