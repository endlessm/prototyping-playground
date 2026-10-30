import { afterEach, expect, test } from 'vitest'
import { tempStudio, BEN } from './setup/temp-studio'
import {
  settingsSnapshot,
  saveSettings,
  validateSettings,
} from '../../tooling/settings/service'

const studios: ReturnType<typeof tempStudio>[] = []
afterEach(() => studios.splice(0).forEach((studio) => studio.remove()))
const fixture = () => {
  const studio = tempStudio()
  studios.push(studio)
  studio.withModule('contributors')
  studio.withModule('prototypes')
  studio.setConfig({ systemMaintainers: { '8x5spen6xtvp96a9': [] } })
  return studio
}

test('[CL-17] [CL-20] [SH-145] configure previews, applies and preserves pinned prototypes', () => {
  const studio = fixture()
  const before = studio.read('studio.config.json')
  expect(studio.studio('configure', '--name', 'Changed').status).toBe(0)
  expect(studio.read('studio.config.json')).toBe(before)
  const applied = studio.studio('configure', '--name', 'Changed', '--yes')
  expect(applied.output).toContain('pinned')
  expect(applied.status).toBe(0)
  expect(studio.config().name).toBe('Changed')
  expect(studio.read('studio.config.json')).toBe(
    before.replace('Endless Design Studio', 'Changed'),
  )
  const meta = '{"systemId":"8x5spen6xtvp96a9","title":"Pinned"}'
  studio.write('src/prototypes/ada/pinned/meta.json', meta)
  const switched = studio.studio('configure', '--system', 'none', '--yes')
  expect(switched.status).toBe(0)
  expect(switched.output).toContain('8x5spen6xtvp96a9')
  expect(studio.config().defaultSystem).toBe(null)
  expect(studio.read('src/prototypes/ada/pinned/meta.json')).toBe(meta)
})

test('[CL-19] [CL-60] recovery restores Admin access, with shared validation', () => {
  const studio = fixture()
  studio.identify(BEN)
  expect(studio.studio('configure', '--name', 'No', '--yes').status).toBe(1)
  const recovered = studio.studio(
    'configure',
    '--admins',
    'ben',
    '--recovery',
    '--yes',
  )
  expect(recovered.status).toBe(0)
  expect(recovered.output).toContain('repository access')
  expect(studio.config().admins).toEqual([BEN.id])
  expect(studio.studio('configure', '--admins', '', '--yes').status).toBe(1)
  expect(
    studio.studio('configure', '--tagline', 'x'.repeat(141), '--yes').status,
  ).toBe(1)
})

test('[CL-18] [SH-110] [SH-114] removed options are refused', () => {
  const studio = fixture()
  expect(studio.studio('configure', '--usage', 'personal').status).toBe(1)
})

test('[CL-61] duplicate keys and comments name the file and leave it intact', () => {
  const studio = fixture()
  for (const source of [
    '{"name":"a","name":"b"}',
    '{/* comment */"name":"a"}',
  ]) {
    studio.write('studio.config.json', source)
    const result = studio.studio('configure', '--name', 'Other', '--yes')
    expect(result.status).toBe(1)
    expect(result.output).toContain('studio.config.json')
    expect(studio.read('studio.config.json')).toBe(source)
  }
})

test('[CL-17] maintainer flags patch one system and validate registered contributors', () => {
  const studio = fixture()
  const system = '8x5spen6xtvp96a9'
  expect(
    studio.studio('configure', '--maintainers', 'endless-studios=ben', '--yes')
      .status,
  ).toBe(0)
  expect(studio.config().systemMaintainers).toEqual({ [system]: [BEN.id] })
  expect(
    studio.studio(
      'configure',
      '--maintainers',
      'endless-studios=nobody',
      '--yes',
    ).status,
  ).toBe(1)
  expect(
    studio.studio('configure', '--maintainers', 'endless-studios=', '--yes')
      .status,
  ).toBe(0)
  expect(studio.config().systemMaintainers).toEqual({ [system]: [] })
})

test('[SH-106] [SH-116] [SH-117] service refuses non-admins, stale revisions, unknown fields and a missing Admin', async () => {
  const studio = fixture()
  const snapshot = await settingsSnapshot(studio.root)
  snapshot.role = 'contributor'
  expect(() =>
    saveSettings(snapshot, { name: 'Other' }, snapshot.revision),
  ).toThrow('Only an Admin')
  snapshot.role = 'admin'
  expect(() =>
    validateSettings({ ...snapshot.config, admins: [] }, snapshot),
  ).toThrow('at least one Admin')
  expect(() =>
    validateSettings({ ...snapshot.config, usage: 'personal' }, snapshot),
  ).toThrow('Unknown setting')
  expect(() =>
    validateSettings(
      {
        ...snapshot.config,
        modules: { ...snapshot.config.modules, contributors: false },
      },
      snapshot,
    ),
  ).toThrow('required')
  studio.setConfig({ tagline: 'External edit' })
  expect(() =>
    saveSettings(snapshot, { name: 'Other' }, snapshot.revision),
  ).toThrow('changed elsewhere')
})

test('[CL-60] every registered system declares maintainers explicitly and systems are unique', async () => {
  const studio = fixture()
  const snapshot = await settingsSnapshot(studio.root)
  expect(() =>
    validateSettings({ ...snapshot.config, systemMaintainers: {} }, snapshot),
  ).toThrow('explicit')
  expect(() =>
    validateSettings(
      { ...snapshot.config, systems: ['endless-studios', 'endless-studios'] },
      snapshot,
    ),
  ).toThrow('unique')
})
