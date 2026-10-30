// What the Systems area dropped stays gone: the built-in Studio system with
// its Platform badge, pages and protections, its React components, brand
// material and shadcn configuration, the example-system alert and the
// instruction-routing map.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import en from '../../i18n/locales/en.json'
import { systemProblems } from '../../tooling/systems/registry'

const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
const code = tracked.filter(
  (file) =>
    /\.(ts|vue|mjs|js|json)$/.test(file) &&
    !file.startsWith('tests/') &&
    file !== 'yarn.lock',
)
const containing = (text: string) =>
  code.filter((file) => readFileSync(file, 'utf8').includes(text))
const strings = JSON.stringify(en)

describe('the Systems areaâ€™s dropped parts', () => {
  test('[SY-140] [SY-141] [SY-142] [SY-143] [SY-144] [SY-146] there is no built-in Studio system, and no system may be the platformâ€™s', () => {
    expect(
      tracked.filter((file) => /^src\/platform\/.*\.(vue|ts|tsx)$/.test(file)),
    ).toEqual([])
    expect(
      tracked.filter((file) => /^src\/systems\/[^/]+\/system\.ts$/.test(file)),
    ).toEqual(['src/systems/endless-studios/system.ts'])
    expect(
      systemProblems(
        {
          label: 'Studio',
          status: 'active',
          role: 'platform',
          styling: 'tailwind',
          colorModes: ['light', 'dark'],
          docs: 'off',
          libraries: [],
          origin: null,
          studioId: 'stud10000000000a',
          app: { factory: { from: 'app.ts', name: 'createApp' } },
        },
        'src/systems/studio/system.ts',
      ),
    ).toContain('src/systems/studio/system.ts: the role is "prototype".')
    expect(strings).not.toContain('Required application system')
  })

  test('[SY-14] [SY-69] there is no Platform badge or Studio usage wording', () => {
    expect(strings).not.toContain('Powers Design Studioâ€™s interface')
    expect(strings).not.toContain('"Platform"')
    expect(strings).not.toContain('unavailable as a prototype system')
  })

  test('[SY-72] there is no example-system alert', () => {
    expect(strings).not.toContain('is an example system')
    expect(containing('starter')).toEqual([])
  }, 30_000)

  test('[SY-147] [SY-150] there are no Studio React components or shadcn configuration', () => {
    expect(containing('#studio/components')).toEqual([])
    expect(tracked.filter((file) => file.endsWith('components.json'))).toEqual(
      [],
    )
  })

  test('[SY-149] Patrickâ€™s brand material is gone', () => {
    expect(
      tracked.filter((file) => /social-card|logo-tile/.test(file)),
    ).toEqual([])
  })

  test('[SY-129] the build records no instruction routing map', () => {
    expect(containing('systemContentMaps')).toEqual([])
    expect(containing('contentMap')).toEqual([])
  })
})
