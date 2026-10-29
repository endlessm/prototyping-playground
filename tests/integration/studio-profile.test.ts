import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { ADA, BEN, tempStudio, type TempStudio } from './setup/temp-studio'

let studio: TempStudio
beforeEach(() => {
  studio = tempStudio()
  studio.identify(BEN)
})
afterEach(() => {
  studio.remove()
})

describe('profile', () => {
  test('[CL-43] shows your own profile', () => {
    const result = studio.studio('profile')
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('contributors/ben.json (ben)')
    expect(result.stdout).toContain('name: Ben Okafor')
    expect(result.stdout).toContain('emails: ben@home.example')
    expect(result.stdout).toContain('github: benok')
  })

  test('[CL-43] previews changes, then applies them with --yes, keeping the studio ID and preferences', () => {
    studio.write(
      'contributors/ben.json',
      JSON.stringify({
        ...studio.json('contributors/ben.json'),
        preferences: { onboarding: { welcomeDismissed: true } },
      }),
    )
    const args = [
      'profile',
      '--name',
      'Benedict Okafor',
      '--add-email',
      'ben@studio.example',
      '--primary-email',
      'ben@home.example',
      '--github',
      '',
    ]
    const preview = studio.studio(...args)
    expect(preview.status).toBe(0)
    expect(preview.stdout).toContain('name: Ben Okafor → Benedict Okafor')
    expect(preview.stdout).toContain(
      'email (primary): ben@endless.example → ben@home.example',
    )
    expect(preview.stdout).toContain('github: benok → ""')
    expect(preview.stdout).toContain('Nothing was changed')
    expect(studio.json('contributors/ben.json').name).toBe('Ben Okafor')

    expect(studio.studio(...args, '--yes').status).toBe(0)
    expect(studio.json('contributors/ben.json')).toEqual({
      formatVersion: 1,
      studioId: BEN.id,
      name: 'Benedict Okafor',
      github: '',
      email: 'ben@home.example',
      emails: ['ben@endless.example', 'ben@studio.example'],
      preferences: { onboarding: { welcomeDismissed: true } },
    })
  })

  test('[CL-43] validates formats and uniqueness', () => {
    const result = studio.studio(
      'profile',
      '--add-email',
      'not-an-email',
      '--add-email',
      ADA.email,
      '--github',
      ADA.github,
      '--name',
      ' ',
      '--yes',
    )
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('add-email: expected an email address')
    expect(result.stderr).toContain(`${ADA.email} is already registered to ada`)
    expect(result.stderr).toContain('"ada-l" is already registered to ada')
    expect(result.stderr).toContain('name: expected a name')
    expect(studio.json('contributors/ben.json').name).toBe('Ben Okafor')
  })

  test('[CL-43] refuses to remove the email you are recognised by', () => {
    const current = studio.studio('profile', '--remove-email', BEN.email)
    expect(current.status).toBe(1)
    expect(current.stderr).toContain('lock you out')

    const other = studio.studio(
      'profile',
      '--remove-email',
      'ben@home.example',
      '--yes',
    )
    expect(other.status).toBe(0)
    expect(studio.json('contributors/ben.json').emails).toBeUndefined()
  })

  test('[CL-04] --as updates your own profile after a Git email change', () => {
    studio.identify({ ...BEN, email: 'ben@new.example' })
    const unlinked = studio.studio('profile')
    expect(unlinked.status).toBe(1)
    expect(unlinked.stderr).toContain('--as ben')

    const result = studio.studio(
      'profile',
      '--as',
      'ben',
      '--add-email',
      'ben@new.example',
      '--yes',
    )
    expect(result.status).toBe(0)
    expect(studio.studio('whoami').stdout.trim()).toBe('ben')
  })

  test('[CL-04] --as is refused for a profile that is not yours, and says why', () => {
    const linked = studio.studio('profile', '--as', 'ada')
    expect(linked.status).toBe(1)
    expect(linked.stderr).toContain('already resolves to "ben"')

    studio.identify({ name: 'Cara Diaz', email: 'cara@new.example' })
    const stranger = studio.studio('profile', '--as', 'ada')
    expect(stranger.status).toBe(1)
    expect(stranger.stderr).toContain(
      'matches neither your Git name nor your GitHub account',
    )

    const missing = studio.studio('profile', '--as', 'zed')
    expect(missing.stderr).toContain('no contributors/zed.json')
  })
})
