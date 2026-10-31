import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { tempStudio, BEN } from './setup/temp-studio'
import { peopleSnapshot, savePerson } from '../../tooling/contributors/service'

const studios: ReturnType<typeof tempStudio>[] = []
beforeEach(() => vi.stubEnv('STUDIO_GITHUB', ''))
afterEach(() => {
  studios.splice(0).forEach((studio) => studio.remove())
  vi.unstubAllEnvs()
})
function fixture() {
  const studio = tempStudio()
  studios.push(studio)
  return studio
}
test('[SH-123] [SH-126] the directory identifies you without exposing other profiles', () => {
  const studio = fixture()
  const snapshot = peopleSnapshot(studio.root, {}, null)
  expect(snapshot.people.map((person) => person.key)).toEqual(['ada', 'ben'])
  expect(snapshot.people.find((person) => person.key === 'ada')?.you).toBe(
    false,
  )
  expect(JSON.stringify(snapshot)).not.toContain(BEN.email)
})
test('[SH-127] profile saves preserve identity and preferences and reject stale writes', () => {
  const studio = fixture()
  const snapshot = peopleSnapshot(studio.root, {}, 'ben')
  const person = snapshot.people.find((person) => person.key === 'ben')!
  savePerson(
    studio.root,
    {},
    'ben',
    'ben',
    { name: 'Benjamin' },
    person.revision!,
  )
  expect(studio.json('contributors/ben.json')).toMatchObject({
    name: 'Benjamin',
    studioId: BEN.id,
    preferences: {},
  })
  expect(() =>
    savePerson(
      studio.root,
      {},
      'ben',
      'ben',
      { name: 'Stale' },
      person.revision!,
    ),
  ).toThrow(/changed/)
})
test('[SH-124] profile operations cannot grant roles; only self or Admin can edit', () => {
  const studio = fixture()
  const revision = peopleSnapshot(studio.root, {}, 'ada').people.find(
    (person) => person.key === 'ben',
  )!.revision!
  expect(() =>
    savePerson(studio.root, {}, null, 'ben', { name: 'No' }, revision),
  ).toThrow(/permission/)
  expect(() =>
    savePerson(studio.root, {}, 'ben', 'ada', { name: 'No' }, revision),
  ).toThrow(/permission/)
  expect(() =>
    savePerson(studio.root, {}, 'ada', 'ben', { admin: true }, revision),
  ).toThrow(/field/)
  savePerson(studio.root, {}, 'ada', 'ben', { name: 'Admin edit' }, revision)
  expect(studio.json('contributors/ben.json').name).toBe('Admin edit')
})
