import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { ADA, BEN, tempStudio, type TempStudio } from './setup/temp-studio'

let studio: TempStudio
beforeEach(() => {
  studio = tempStudio()
})
afterEach(() => {
  studio.remove()
})

const CARA = {
  name: 'Cara Diaz',
  email: 'cara@endless.example',
  github: 'cdiaz',
}

describe('join', () => {
  test('[CL-39] previews a profile from Git and GitHub, then writes it and your folder with --yes', () => {
    studio.identify(CARA)
    const preview = studio.studio('join')
    expect(preview.status).toBe(0)
    expect(preview.stdout).toContain('contributors/cara.json')
    expect(preview.stdout).toContain('"name": "Cara Diaz"')
    expect(preview.stdout).toContain('"github": "cdiaz"')
    expect(preview.stdout).toContain('Nothing was changed')
    expect(studio.exists('contributors/cara.json')).toBe(false)

    const applied = studio.studio('join', '--yes')
    expect(applied.status).toBe(0)
    const profile = studio.json('contributors/cara.json')
    expect(profile).toMatchObject({
      formatVersion: 1,
      name: 'Cara Diaz',
      email: 'cara@endless.example',
      github: 'cdiaz',
      preferences: {},
    })
    expect(profile.studioId).toMatch(/^[0-9abcdefghjkmnpqrstvwxyz]{16}$/)
    expect(studio.exists('src/prototypes/cara/.gitkeep')).toBe(true)
    studio.identify(CARA)
    expect(studio.studio('whoami').stdout.trim()).toBe('cara')
  })

  test('[CL-39] flags override Git, and a taken first name gets a number', () => {
    studio.identify(CARA)
    const result = studio.studio(
      'join',
      '--name',
      'Ada Byron',
      '--email',
      'byron@endless.example',
      '--github',
      'abyron',
      '--yes',
    )
    expect(result.status).toBe(0)
    expect(studio.json('contributors/ada2.json')).toMatchObject({
      name: 'Ada Byron',
      email: 'byron@endless.example',
    })
  })

  test('[CL-40] refuses emails and GitHub accounts that are already registered', () => {
    studio.identify({ ...CARA, email: 'BEN@home.example' })
    const email = studio.studio('join', '--key', 'cara', '--yes')
    expect(email.status).toBe(1)
    expect(email.stderr).toContain('already registered to ben')

    studio.identify({ ...CARA, github: BEN.github })
    const github = studio.studio('join', '--key', 'cara', '--yes')
    expect(github.status).toBe(1)
    expect(github.stderr).toContain(
      'GitHub account benok is already registered to ben',
    )
    expect(studio.exists('contributors/cara.json')).toBe(false)
  })

  test('[CL-40] [CL-47] refuses taken keys and keys that are page addresses', () => {
    studio.addModule('sample')
    studio.identify(CARA)
    const taken = studio.studio('join', '--key', 'ben')
    expect(taken.status).toBe(1)
    expect(taken.stderr).toContain('"ben" is already taken')

    const page = studio.studio('join', '--key', 'sample')
    expect(page.status).toBe(1)
    expect(page.stderr).toContain('/sample')

    studio.write('app/pages/settings.vue', '<template><p /></template>\n')
    const app = studio.studio('join', '--key', 'settings')
    expect(app.status).toBe(1)
    expect(app.stderr).toContain('/settings')

    // A proposed key skips the reserved ones.
    studio.identify({ ...CARA, name: 'Sample Person' })
    expect(studio.studio('join').stdout).toContain('contributors/sample2.json')
  })

  test('[CL-40] warns without a GitHub account and about a personal email', () => {
    studio.identify({ ...CARA, email: 'cara@gmail.com', github: '' })
    const result = studio.studio('join')
    expect(result.status).toBe(0)
    expect(result.output).toContain('no GitHub account')
    expect(result.output).toContain('looks like a personal email')
  })

  test('[CL-41] says when you are already registered, re-creates a missing folder, and warns about a different Git name', () => {
    studio.identify({ ...ADA, name: 'A. Lovelace' })
    const result = studio.studio('join', '--yes')
    expect(result.status).toBe(0)
    expect(result.stdout).toContain(`You're already a contributor: "ada"`)
    expect(result.output).toContain('your Git name is A. Lovelace')
    expect(studio.exists('src/prototypes/ada')).toBe(true)
  })

  test('[CL-42] links a new Git email to the one profile matching your name or GitHub', () => {
    studio.identify({ name: BEN.name, email: 'ben@new.example', github: '' })
    const preview = studio.studio('join')
    expect(preview.status).toBe(0)
    expect(preview.stdout).toContain(
      'contributors/ben.json (Ben Okafor) matches your name',
    )
    expect(studio.json('contributors/ben.json').emails).toEqual([
      'ben@home.example',
    ])

    expect(studio.studio('join', '--yes').status).toBe(0)
    expect(studio.json('contributors/ben.json')).toMatchObject({
      email: BEN.email,
      emails: ['ben@home.example', 'ben@new.example'],
      studioId: BEN.id,
    })
    expect(studio.exists('contributors/ben2.json')).toBe(false)
    expect(studio.studio('whoami').stdout.trim()).toBe('ben')
  })

  test('[CL-42] several matches need --link, and never a profile that matches neither', () => {
    studio.identify({
      name: ADA.name,
      email: 'who@new.example',
      github: BEN.github,
    })
    const ambiguous = studio.studio('join', '--yes')
    expect(ambiguous.status).toBe(1)
    expect(ambiguous.stderr).toContain('ada, ben')
    expect(ambiguous.stderr).toContain('--link <key>')

    expect(studio.studio('join', '--link', 'ben', '--yes').status).toBe(0)
    expect(studio.json('contributors/ben.json').emails).toContain(
      'who@new.example',
    )

    studio.identify({ name: 'Cara Diaz', email: 'c@new.example', github: '' })
    const stranger = studio.studio('join', '--link', 'ada', '--yes')
    expect(stranger.status).toBe(1)
    expect(stranger.stderr).toContain(
      'matches neither your name nor your GitHub account',
    )
    expect(studio.json('contributors/ada.json').emails).toBeUndefined()
  })
})
