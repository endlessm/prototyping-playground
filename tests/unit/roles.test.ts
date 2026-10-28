import { describe, expect, test } from 'vitest'
import {
  adminProblems,
  permissionRefusal,
  refusalMessage,
  roleOf,
  teamOf,
  withoutAdmin,
} from '../../tooling/contributors/roles'
import type { Contributors } from '../../tooling/contributors/profiles'

const profile = (studioId: string, name: string) => ({
  formatVersion: 1,
  studioId,
  name,
  email: `${name.toLowerCase()}@endless.example`,
  github: '',
  preferences: {},
})
const contributors: Contributors = {
  ada: profile('ada0000000000001', 'Ada'),
  ben: profile('ben0000000000002', 'Ben'),
  cara: profile('cara000000000003', 'Cara'),
}
const SYSTEM = 'sys0000000000001'
const config = {
  admins: ['ada0000000000001'],
  systemMaintainers: { [SYSTEM]: ['ben0000000000002'] },
}
const team = teamOf(config, contributors)
const active = { kind: 'system', id: SYSTEM, status: 'active' } as const

describe('roles', () => {
  test('[CL-64] the configuration names Admins and maintainers by permanent ID', () => {
    expect(team).toEqual({
      admins: ['ada'],
      maintainers: { [SYSTEM]: ['ben'] },
    })
    expect(roleOf(team, contributors, 'ada')).toBe('admin')
    expect(roleOf(team, contributors, 'ben')).toBe('contributor')
    expect(roleOf(team, contributors, null)).toBeNull()
    expect(roleOf(team, contributors, 'zed')).toBeNull()
  })

  test('[CL-64] a contributor changes only their own prototypes', () => {
    const own = { kind: 'prototype', owner: 'cara' } as const
    expect(
      permissionRefusal(team, contributors, 'cara', own, 'edit'),
    ).toBeNull()
    expect(permissionRefusal(team, contributors, 'ben', own, 'edit')).toBe(
      'owner',
    )
    expect(permissionRefusal(team, contributors, 'ben', own, 'read')).toBeNull()
    expect(
      permissionRefusal(team, contributors, 'cara', { kind: 'studio' }, 'edit'),
    ).toBe('admin')
  })

  test('[CL-64] a maintainer edits and renames their active system, but only an Admin manages it', () => {
    expect(
      permissionRefusal(team, contributors, 'ben', active, 'edit'),
    ).toBeNull()
    expect(
      permissionRefusal(team, contributors, 'ben', active, 'rename'),
    ).toBeNull()
    expect(permissionRefusal(team, contributors, 'ben', active, 'manage')).toBe(
      'admin',
    )
    expect(permissionRefusal(team, contributors, 'cara', active, 'edit')).toBe(
      'maintainer',
    )
    const archived = { ...active, status: 'archived' } as const
    expect(permissionRefusal(team, contributors, 'ben', archived, 'edit')).toBe(
      'unavailable',
    )
  })

  test('[CL-64] an Admin can do everything', () => {
    for (const resource of [
      { kind: 'prototype', owner: 'cara' },
      { kind: 'studio' },
      { kind: 'module' },
      active,
    ] as const)
      for (const action of ['edit', 'rename', 'manage'] as const)
        expect(
          permissionRefusal(team, contributors, 'ada', resource, action),
        ).toBeNull()
  })

  test('[CL-66] an unregistered person is told how to register or link', () => {
    expect(
      permissionRefusal(team, contributors, null, { kind: 'studio' }, 'edit'),
    ).toBe('identity')
    const message = refusalMessage('identity', { email: 'new@endless.example' })
    expect(message).toContain('new@endless.example')
    expect(message).toContain('yarn studio join')
  })

  test('[CL-63] the studio needs at least one registered Admin, and the last one can’t be removed', () => {
    expect(adminProblems(config, contributors)).toEqual([])
    expect(adminProblems({ ...config, admins: [] }, contributors)).toEqual([
      'studio.config.json: the studio needs at least one Admin in admins.',
    ])
    expect(
      adminProblems({ ...config, admins: ['zzz0000000000009'] }, contributors),
    ).toEqual([
      'studio.config.json: Admin zzz0000000000009 is not a registered contributor.',
    ])
    expect(() => withoutAdmin(config, contributors, 'ada')).toThrow(
      'the last Admin',
    )
    const two = { ...config, admins: [...config.admins, 'ben0000000000002'] }
    expect(withoutAdmin(two, contributors, 'ada').admins).toEqual([
      'ben0000000000002',
    ])
  })
})
