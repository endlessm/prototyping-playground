import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { ADA, tempStudio, type TempStudio } from './setup/temp-studio'

let studio: TempStudio
beforeEach(() => {
  studio = tempStudio()
})
afterEach(() => {
  studio.remove()
})

describe('the identity check at commit time', () => {
  test('[CL-132] warns when Git name or email do not match your profile, and says how to fix it', () => {
    studio.identify({ ...ADA, name: 'Ada L.' })
    const name = studio.node('tooling/check-identity.ts')
    expect(name.status).toBe(0)
    expect(name.stdout).toContain('user.name is "Ada L."')
    expect(name.stdout).toContain('"Ada Lovelace"')
    expect(name.stdout).toContain('git commit --amend --reset-author')

    studio.identify({ name: 'Ada Lovelace', email: '', github: ADA.github })
    const email = studio.node('tooling/check-identity.ts')
    expect(email.status).toBe(0)
    expect(email.stdout).toContain('user.email is ""')
  })

  test('[CL-132] stays quiet when they match, and never blocks the commit', () => {
    studio.identify(ADA)
    expect(studio.node('tooling/check-identity.ts').output).toBe('')
    studio.identify({ name: 'Nobody', email: 'nobody@endless.example' })
    expect(studio.node('tooling/check-identity.ts').status).toBe(0)
  })
})

describe('the Node version', () => {
  test('[CL-05] every studio command warns when Node is not the declared version', () => {
    const pkg = studio.json('package.json')
    studio.write(
      'package.json',
      JSON.stringify({ ...pkg, engines: { node: '>=99.0.0' } }),
    )
    const result = studio.studio('whoami')
    expect(result.stderr).toContain('this studio expects Node >=99.0.0')
    expect(result.stderr).toContain('mise.toml')
  })
})
