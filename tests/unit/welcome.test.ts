import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import {
  claimWelcome,
  WelcomeProblem,
} from '../../src/modules/onboarding/claim'
import { opensWelcome } from '../../src/modules/onboarding/utils/progress'

let folder: string
const profile = (preferences: Record<string, unknown>) => ({
  formatVersion: 1,
  studioId: 'ada0000000000001',
  name: 'Ada Lovelace',
  github: 'ada-l',
  email: 'ada@endless.example',
  preferences,
})
const write = (value: unknown) =>
  writeFileSync(
    path.join(folder, 'ada.json'),
    `${JSON.stringify(value, null, 2)}\n`,
  )
const read = () =>
  JSON.parse(readFileSync(path.join(folder, 'ada.json'), 'utf8'))

beforeEach(() => {
  folder = mkdtempSync(path.join(os.tmpdir(), 'welcome-'))
})
afterEach(() => rmSync(folder, { recursive: true, force: true }))

describe('claiming the welcome', () => {
  test('[SH-134] the first claim shows it and records welcomeDismissed on the profile, keeping the rest', () => {
    write(profile({ onboarding: { welcomeDismissed: false }, other: { a: 1 } }))
    expect(claimWelcome(folder, 'ada')).toEqual({ show: true })
    expect(read()).toEqual(
      profile({ onboarding: { welcomeDismissed: true }, other: { a: 1 } }),
    )
    expect(claimWelcome(folder, 'ada')).toEqual({ show: false })
  })

  test('[SH-134] setting the flag back to false shows it again', () => {
    write(profile({ onboarding: { welcomeDismissed: true } }))
    expect(claimWelcome(folder, 'ada')).toEqual({ show: false })
    write(profile({ onboarding: { welcomeDismissed: false } }))
    expect(claimWelcome(folder, 'ada')).toEqual({ show: true })
  })

  test('[SH-134] before registration the server has no answer, so the browser remembers instead', () => {
    expect(claimWelcome(folder, null)).toEqual({ show: null })
  })

  test('[SH-134] a missing or malformed flag is a problem to fix, never a first visit', () => {
    write(profile({}))
    expect(() => claimWelcome(folder, 'ada')).toThrow(WelcomeProblem)
    expect(() => claimWelcome(folder, 'ada')).toThrow(
      /preferences\.onboarding\.welcomeDismissed.*yarn studio preferences/,
    )
    write(profile({ onboarding: { welcomeDismissed: 'no' } }))
    expect(() => claimWelcome(folder, 'ada')).toThrow(WelcomeProblem)
    expect(read().preferences).toEqual({
      onboarding: { welcomeDismissed: 'no' },
    })
  })
})

describe('whether the browser opens the welcome', () => {
  const storage = () => {
    const items = new Map<string, string>()
    return {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => void items.set(key, value),
    }
  }
  const answer = (status: number, body: unknown) => async () =>
    new Response(JSON.stringify(body), { status })

  test('[SH-134] the profile decides for a registered contributor', async () => {
    const browser = storage()
    expect(
      await opensWelcome('/', 'ada', answer(200, { show: true }), browser),
    ).toBe(true)
    expect(
      await opensWelcome('/', 'ada', answer(200, { show: false }), browser),
    ).toBe(false)
  })

  test('[SH-134] before registration, or when the profile can’t be written, the browser remembers it once', async () => {
    for (const reply of [
      answer(200, { show: null }),
      answer(500, { error: 'disk full' }),
      async () => {
        throw new TypeError('Failed to fetch')
      },
    ]) {
      const browser = storage()
      expect(await opensWelcome('/', null, reply, browser)).toBe(true)
      expect(await opensWelcome('/', null, reply, browser)).toBe(false)
      // Another studio, or another person, in the same browser.
      expect(await opensWelcome('/other/', null, reply, browser)).toBe(true)
      expect(await opensWelcome('/', 'ben', reply, browser)).toBe(true)
    }
  })

  test('[SH-134] a profile with a broken flag never falls back to the browser', async () => {
    const browser = storage()
    expect(
      await opensWelcome('/', 'ada', answer(422, { error: 'fix it' }), browser),
    ).toBe(false)
    await expect(
      opensWelcome('/', 'ada', answer(200, { show: 'yes' }), browser),
    ).rejects.toThrow()
  })
})

describe('what the welcome says', () => {
  const locale = JSON.parse(readFileSync('i18n/locales/en.json', 'utf8'))
  const copy = JSON.stringify(locale.welcome)
  const modal = readFileSync(
    'src/modules/onboarding/components/WelcomeModal.vue',
    'utf8',
  )
  const skill = readFileSync(
    'src/modules/onboarding/skills/get-started/SKILL.md',
    'utf8',
  )
  const pitch =
    /publish|ChatGPT Sites|Vercel|Netlify|GitHub Pages|\bhost(s|ing)?\b|modular|your own components|bring (in )?your|extend/i

  test('[SH-132] it explains the studio, Endless Studios screens, the canvas and asking the agent, without the original product pitch', () => {
    expect(locale.welcome.welcome.title).toBe('Welcome to {name}')
    expect(locale.welcome.screens.title).toBe(
      'Built from Endless Studios screens',
    )
    expect(locale.welcome.canvas.title).toBe('Lay it out on a canvas')
    expect(locale.welcome.agent.title).toBe('Ask your agent')
    expect(copy).toMatch(/Endless team’s prototyping sandbox/)
    expect(copy).not.toMatch(pitch)
    expect(modal).not.toMatch(pitch)
  })

  test('[SH-131] its buttons and progress indicator', () => {
    expect(locale.welcome).toMatchObject({
      progress: 'Introduction progress',
      start: 'Show me around',
      next: 'Next',
      back: 'Back',
      finish: 'Explore my studio',
      skip: 'Skip introduction',
    })
  })

  test('[SH-133] the last step points to no sample prototypes', () => {
    expect(copy + modal).not.toMatch(
      /Feedback Inbox|Design Studio Marketing|sample prototype|example/i,
    )
  })

  test('[SH-135] the getting-started skill helps a newcomer make a first prototype on Endless Studios', () => {
    expect(skill).toMatch(/^---\nname: get-started\n/)
    expect(skill).toContain('yarn new')
    expect(skill).toContain('yarn studio whoami')
    expect(skill).toContain('build-prototype')
    expect(skill).toMatch(/Endless Studios/)
    expect(skill).not.toMatch(pitch)
    expect(skill).not.toMatch(/Feedback Inbox|Design Studio Marketing/)
    const agents = readFileSync('AGENTS.md', 'utf8')
    expect(agents).toContain(
      '[Welcome: get-started](src/modules/onboarding/skills/get-started/SKILL.md)',
    )
    expect(agents).not.toContain('use-onboarding')
  })
})
