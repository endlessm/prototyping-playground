// Whether a component file compiles decides whether the static build gives
// it a playground: a file Vue can't compile names its problem, a sound one
// (TypeScript in its template included) has none.
import { mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, test } from 'vitest'
import { fileCompileProblem } from '../../tooling/systems/compile.ts'

const dir = mkdtempSync(path.join(tmpdir(), 'component-compile-'))
afterAll(() => rmSync(dir, { recursive: true, force: true }))
function file(name: string, source: string) {
  const at = path.join(dir, name)
  writeFileSync(at, source)
  return at
}

describe('a component file’s compile problem', () => {
  test('a sound component has none', () => {
    const at = file(
      'Chip.vue',
      `<script setup lang="ts">
const props = defineProps<{ tone: 'calm' | 'loud' }>()
</script>
<template><span>{{ (props.tone as string).toUpperCase() }}</span></template>
`,
    )
    expect(fileCompileProblem(at)).toBeNull()
  })

  test('a template missing an end tag names it', () => {
    const at = file('Open.vue', '<template><div></template>\n')
    expect(fileCompileProblem(at)).toBe('Element is missing end tag.')
  })

  test('a broken template expression names it', () => {
    const at = file('Sum.vue', '<template><div>{{ a + }}</div></template>\n')
    expect(fileCompileProblem(at)).toMatch(/Error parsing JavaScript/)
  })

  test('a script that doesn’t compile names it', () => {
    const at = file(
      'Script.vue',
      '<script setup lang="ts">\ndefineProps<{ a: string }>()\ndefineProps<{ b: string }>()\n</script>\n',
    )
    expect(fileCompileProblem(at)).toMatch(/defineProps/)
  })

  test('a missing file names why it can’t be read', () => {
    expect(fileCompileProblem(path.join(dir, 'Gone.vue'))).toMatch(/ENOENT/)
  })

  test('a file fixed or broken since it was last asked about gets a new answer', () => {
    const at = file('Fixed.vue', '<template><div></template>\n')
    expect(fileCompileProblem(at)).toBe('Element is missing end tag.')
    writeFileSync(at, '<template><div></div></template>\n')
    // A later time, as an editor's save gives it.
    utimesSync(at, new Date(), new Date(Date.now() + 5_000))
    expect(fileCompileProblem(at)).toBeNull()
    writeFileSync(at, '<template><span></template>\n')
    utimesSync(at, new Date(), new Date(Date.now() + 10_000))
    expect(fileCompileProblem(at)).toBe('Element is missing end tag.')
  })
})
