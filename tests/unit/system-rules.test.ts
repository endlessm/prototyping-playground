// Rules of the Systems area that no page shows: the area can't be switched
// off, each system owns its packages, and the Studio interface's copy rules
// live in the platform's guidance now that the Studio system is gone.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import systemsModule from '../../src/modules/systems/module'
import { sourceProblems } from '../../tooling/checks/imports'
import type { InstalledSystem } from '../../tooling/systems/registry'

const read = (file: string) => readFileSync(file, 'utf8')

describe('the Systems area’s rules', () => {
  test('[SY-02] the Systems area is required, so it can’t be switched off', () => {
    expect(systemsModule.id).toBe('systems')
    expect(systemsModule.required).toBe(true)
  })

  test('[SY-138] each system owns its packages; a prototype reaches only the libraries its system declares', () => {
    // Every system is a workspace of its own, with its own dependencies.
    expect(JSON.parse(read('package.json')).workspaces).toEqual([
      'src/systems/*',
    ])
    const endless = path.resolve('src/systems/endless-studios')
    const { dependencies } = JSON.parse(
      read(path.join(endless, 'package.json')),
    )
    expect(Object.keys(dependencies)).toContain('@nuxt/ui')
    expect(Object.keys(dependencies)).toContain('@iconify/vue')

    const root = path.resolve('.')
    const prototypesDir = path.join(root, 'src/prototypes')
    const system = (dir: string, packages: string[]) =>
      ({
        dir,
        spec: {
          libraries: packages.map((name) => ({
            kind: 'package',
            package: name,
          })),
          app: {},
        },
      }) as unknown as InstalledSystem
    const vue = (specifier: string) =>
      `<script setup>import x from "${specifier}"</script>`
    const view = path.join(prototypesDir, 'ada/demo/Home.vue')
    const prototype = {
      root,
      prototypesDir,
      system: system(endless, ['vue', '@nuxt/ui']),
      modules: [],
    }

    // A prototype reaches a declared library, and not a package its system
    // merely depends on.
    expect(sourceProblems(vue('@nuxt/ui'), view, prototype)).toEqual([])
    expect(sourceProblems(vue('@iconify/vue'), view, prototype).join()).toMatch(
      /Forbidden import/,
    )
    // The system's own code may use its packages.
    const own = path.join(endless, 'libraries/extra.ts')
    expect(
      sourceProblems('import x from "@iconify/vue"', own, {
        ...prototype,
        system: system(endless, []),
      }),
    ).toEqual([])
    // Another system can't reach them, nor the first system's files.
    const harbor = path.join(root, 'src/systems/harbor')
    const other = {
      ...prototype,
      system: system(harbor, []),
    }
    const harborFile = path.join(harbor, 'libraries/extra.ts')
    expect(
      sourceProblems('import x from "@iconify/vue"', harborFile, other).join(),
    ).toMatch(/Forbidden import/)
    expect(
      sourceProblems(
        'import x from "../../endless-studios/libraries/vue-app"',
        harborFile,
        other,
      ).join(),
    ).toMatch(/Forbidden import/)
  })

  test('[SY-145] the Studio UI copy rules live in the platform guidance for the interface', () => {
    const copy = read('src/platform/context/ui-copy.md')
    expect(copy).toMatch(/^---\r?\ntitle: Studio UI copy/)
    expect(copy).toContain('instead of semicolons joining sentences')
    expect(copy).toContain('Action labels have no trailing ellipsis')
    expect(copy).toContain('lo-fi and hi-fi')
    expect(copy).toContain(
      'Pending labels describe the current action plainly: Saving',
    )
    // Agents are routed to it.
    expect(read('AGENTS.md')).toContain('src/platform/context/ui-copy.md')
    expect(read('src/platform/README.md')).toContain('context/ui-copy.md')
  })
})
