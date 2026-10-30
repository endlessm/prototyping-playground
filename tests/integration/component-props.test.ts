// Props tables come from the component's own code: Vue's component metadata
// tooling reads `defineProps`, its defaults and its doc comments.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { componentProps } from '../../tooling/systems/props'

let dir: string

function write(file: string, text: string) {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
  writeFileSync(path.join(dir, file), text)
}

beforeAll(() => {
  mkdirSync(path.resolve('.e2e'), { recursive: true })
  dir = mkdtempSync(path.resolve('.e2e/props-'))
  write(
    'Badge.vue',
    `<script setup lang="ts">
withDefaults(
  defineProps<{
    /** The badge's text. */
    label: string
    /** How loud it is. */
    tone?: 'quiet' | 'loud'
    count?: number
  }>(),
  { tone: 'quiet' },
)
</script>
<template><span>{{ label }}</span></template>
`,
  )
  write(
    'Plain.vue',
    `<script setup lang="ts">
defineOptions({ inheritAttrs: false })
</script>
<template><span /></template>
`,
  )
  write('Broken.vue', `<script setup lang="ts">\ndefineProps<{ a: </script>\n`)
})
afterAll(() => rmSync(dir, { recursive: true, force: true }))

test('[SY-110] reads each prop with its type, default, whether it is required and its description', async () => {
  const found = await componentProps([
    path.join(dir, 'Badge.vue'),
    path.join(dir, 'Plain.vue'),
  ])
  expect(found[path.join(dir, 'Badge.vue')]).toEqual({
    name: 'Badge',
    native: true,
    props: [
      {
        name: 'label',
        type: 'string',
        required: true,
        default: null,
        description: "The badge's text.",
      },
      {
        name: 'tone',
        type: '"quiet" | "loud"',
        required: false,
        default: '"quiet"',
        description: 'How loud it is.',
      },
      {
        name: 'count',
        type: 'number',
        required: false,
        default: null,
        description: '',
      },
    ],
  })
  // Without fallthrough attributes there are no native ones to accept.
  expect(found[path.join(dir, 'Plain.vue')]).toEqual({
    name: 'Plain',
    native: false,
    props: [],
  })
}, 60_000)

test('[SY-111] a component whose props can’t be read reports why, and the others still load', async () => {
  const found = await componentProps([
    path.join(dir, 'Broken.vue'),
    path.join(dir, 'Badge.vue'),
  ])
  expect(found[path.join(dir, 'Badge.vue')]).toMatchObject({ name: 'Badge' })
  const broken = found[path.join(dir, 'Broken.vue')]
  expect(broken).toMatchObject({ error: expect.stringContaining('Broken.vue') })
}, 60_000)
