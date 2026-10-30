import { expect, test } from 'vitest'
import { sourceProblems } from '../../tooling/checks/imports'
import type { InstalledSystem } from '../../tooling/systems/registry'

const policy = {
  root: '/studio',
  prototypesDir: '/studio/src/prototypes',
  system: null,
  modules: [],
}
const file = '/studio/src/prototypes/ada/demo/Home.vue'

test('[CL-117] system code cannot reach another system or Studio internals', () => {
  const system = {
    dir: '/studio/src/systems/harbor',
    spec: { libraries: [], app: {} },
  } as unknown as InstalledSystem
  const systemPolicy = { ...policy, system }
  const file = '/studio/src/systems/harbor/libraries/Widget.ts'
  expect(
    sourceProblems(
      'import x from "../../other/private"',
      file,
      systemPolicy,
    ).join(),
  ).toContain('Forbidden import')
  expect(
    sourceProblems(
      'import x from "../../../../tooling/private"',
      file,
      systemPolicy,
    ).join(),
  ).toContain('Forbidden import')
  expect(
    sourceProblems(
      'import { h } from "vue"; import x from "./parts"',
      file,
      systemPolicy,
    ),
  ).toEqual([])
})

test('[CL-117] only a system component examples file imports #studio/examples', () => {
  const system = {
    dir: '/studio/src/systems/harbor',
    spec: { libraries: [], app: {} },
  } as unknown as InstalledSystem
  const systemPolicy = { ...policy, system }
  const source =
    '<script setup>import { Example } from "#studio/examples"</script>'
  expect(
    sourceProblems(
      source,
      '/studio/src/systems/harbor/components/button/button.examples.vue',
      systemPolicy,
    ),
  ).toEqual([])
  expect(
    sourceProblems(
      source,
      '/studio/src/systems/harbor/components/button/button.vue',
      systemPolicy,
    ).join(),
  ).toContain('Forbidden import')
  expect(sourceProblems(source, file, systemPolicy).join()).toContain(
    'Forbidden import',
  )
})

test('[PR-95] [CL-117] both Vue scripts, reexports and dynamic imports obey boundaries', () => {
  for (const source of [
    '<script>import x from "../../../ben/demo/data"</script><script setup>import { ref } from "vue"</script>',
    '<script>export { x } from "nuxt/app"</script>',
    '<script setup>const x = import("../../../../../../tooling/files/service")</script>',
    '<script setup>const x = import(name)</script>',
  ])
    expect(sourceProblems(source, file, policy).length).toBeGreaterThan(0)
  expect(
    sourceProblems(
      '<script setup>import { ref } from "vue"; import x from "./_parts/data"</script><style scoped>.x { color: red }</style>',
      file,
      policy,
    ),
  ).toEqual([])
})

test('[CL-117] [PR-96] global CSS and public path assets are refused', () => {
  expect(
    sourceProblems('<style>body { color: red }</style>', file, policy).join(),
  ).toContain('scoped')
  expect(
    sourceProblems(
      '<template><img src="/photo.png"></template>',
      file,
      policy,
    ).join(),
  ).toContain('Import')
  expect(
    sourceProblems('import "./global.css"', file.replace('.vue', '.ts'), policy)
      .length,
  ).toBe(1)
})

test('[PR-96] scoped Vue styles cannot load assets from outside their prototype', () => {
  expect(
    sourceProblems(
      '<style scoped>.x { background: url(/private.png) }</style>',
      file,
      policy,
    ).join(),
  ).toContain('Forbidden asset')
})
