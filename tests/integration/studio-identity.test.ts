import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { ADA, BEN, tempStudio, type TempStudio } from './setup/temp-studio'

let studio: TempStudio
beforeEach(() => {
  studio = tempStudio()
})
afterEach(() => {
  studio.remove()
})

describe('whoami', () => {
  test('[CL-16] recognises a contributor by Git email, including extra emails', () => {
    studio.identify({ name: 'Someone', email: 'ADA@endless.example' })
    const ada = studio.studio('whoami')
    expect(ada.status).toBe(0)
    expect(ada.stdout.trim()).toBe('ada')

    studio.identify({ name: 'Ben', email: 'ben@home.example' })
    expect(studio.studio('whoami').stdout.trim()).toBe('ben')
  })

  test('[CL-16] falls back to the GitHub account when Git has no email', () => {
    studio.identify({ name: '', email: '', github: BEN.github })
    expect(studio.studio('whoami').stdout.trim()).toBe('ben')
  })

  test('[CL-16] a profile with no email is found by your exact Git name', () => {
    studio.write(
      'contributors/cara.json',
      JSON.stringify({
        formatVersion: 1,
        studioId: 'cara000000000003',
        name: 'Cara Diaz',
        email: '',
        github: '',
        preferences: {},
      }),
    )
    studio.identify({ name: 'Cara Diaz', email: 'cara@endless.example' })
    expect(JSON.parse(studio.studio('whoami', '--json').stdout)).toMatchObject({
      key: 'cara',
      matchedBy: 'name',
    })
    studio.identify({ name: 'Cara', email: 'cara@endless.example' })
    expect(studio.studio('whoami').status).toBe(1)
  })

  test('[CL-16] a profile matching only your name is not you until linked, and says how to link', () => {
    studio.identify({ name: ADA.name, email: 'ada@new.example', github: '' })
    const result = studio.studio('whoami')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('"ada" matches your name')
    expect(result.stderr).toContain('yarn studio join')
  })

  test('[CL-16] an unregistered person is told how to register', () => {
    studio.identify({ name: 'Nobody', email: 'nobody@endless.example' })
    const result = studio.studio('whoami')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Run yarn studio join')
  })

  test('[CL-16] --json prints the full resolution with the candidate profiles', () => {
    studio.identify({
      name: BEN.name,
      email: 'b@new.example',
      github: BEN.github,
    })
    const result = studio.studio('whoami', '--json')
    const resolution = JSON.parse(result.stdout)
    expect(resolution).toMatchObject({
      key: null,
      email: 'b@new.example',
      candidate: 'ben',
      candidates: [{ key: 'ben', matchedBy: ['name', 'github'] }],
    })

    studio.identify(ADA)
    expect(JSON.parse(studio.studio('whoami', '--json').stdout)).toMatchObject({
      key: 'ada',
      matchedBy: 'email',
    })
  })
})
