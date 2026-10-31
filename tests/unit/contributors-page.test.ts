import fs from 'node:fs'
import { expect, test } from 'vitest'
import contributors from '../../src/modules/contributors/module'
test('[SH-128] Contributors routes, rail and palette are local only in the always-team studio', () => {
  expect(contributors.localOnly).toBe(true)
  expect(contributors.required).toBe(true)
  expect(contributors.pages[0]!.path).toBe('/contributors')
  expect(contributors.palette[0]).toMatchObject({
    label: 'Contributors',
    to: '/contributors',
    keywords: ['permissions', 'team', 'access'],
  })
})
test('[SH-129] role guidance uses configure preview, keeps grants and the last Admin', () => {
  const skill = fs.readFileSync(
    'src/modules/contributors/skills/use-contributors/SKILL.md',
    'utf8',
  )
  for (const text of [
    'yarn studio configure',
    '--admins',
    '--maintainers',
    '--yes',
    'other grants',
    'at least one Admin',
  ])
    expect(skill).toContain(text)
})
