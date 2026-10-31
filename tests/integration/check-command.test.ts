import { afterEach, expect, test } from 'vitest'
import { symlinkSync } from 'node:fs'
import path from 'node:path'
import { tempStudio, type TempStudio } from './setup/temp-studio'

let copy: TempStudio
afterEach(() => copy?.remove())

test('[CL-127] studio check reports malformed configuration with a remedy and exit 1', () => {
  copy = tempStudio()
  symlinkSync(
    path.resolve('node_modules'),
    path.join(copy.root, 'node_modules'),
    'junction',
  )
  copy.setConfig({ modules: { missing: 'no' }, admins: [] })
  const result = copy.studio('check')
  expect(result.status).toBe(1)
  expect(result.output).toContain('studio.config.json')
  expect(result.output).toContain('Admin')
})

test('[CL-127] enabled module checks run, disabled module checks do not', () => {
  copy = tempStudio()
  symlinkSync(
    path.resolve('node_modules'),
    path.join(copy.root, 'node_modules'),
    'junction',
  )
  copy.addModule('sample')
  copy.write(
    'src/modules/sample/check.ts',
    "export const check = () => ['sample: repair the fixture']",
  )
  copy.setConfig({ modules: { sample: true } })
  expect(copy.studio('check').output).toContain('repair the fixture')
  copy.setConfig({ modules: { sample: false } })
  expect(copy.studio('check').output).not.toContain('repair the fixture')
})

test('[CL-127] invalid maintainer grants name the configuration and registered identity remedy', () => {
  copy = tempStudio()
  copy.setConfig({ systemMaintainers: { missing: ['unknown'] } })
  const result = copy.studio('check')
  expect(result.status).toBe(1)
  expect(result.output).toContain('systemMaintainers.missing')
  expect(result.output).toContain('registered')
})

test('[CL-117] checks include unimported prototype helpers in underscore folders', () => {
  copy = tempStudio()
  symlinkSync(
    path.resolve('node_modules'),
    path.join(copy.root, 'node_modules'),
    'junction',
  )
  copy.withModule('prototypes')
  copy.setConfig({ modules: { prototypes: true } })
  copy.write(
    'src/prototypes/ada/demo/meta.json',
    JSON.stringify({
      title: 'Demo',
      studioId: 'abc0000000000001',
      systemId: null,
    }),
  )
  copy.write(
    'src/prototypes/ada/demo/_parts/data.ts',
    'export { secret } from "nuxt/app"',
  )
  const result = copy.studio('check')
  expect(result.status).toBe(1)
  expect(result.output).toContain('_parts/data.ts: Forbidden import')
})
