import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { ADA, BEN, tempStudio, type TempStudio } from './setup/temp-studio'

let studio: TempStudio
beforeEach(() => {
  studio = tempStudio()
  studio.addModule('sample')
  studio.setConfig({ modules: { sample: true } })
})
afterEach(() => {
  studio.remove()
})

describe('shared changes', () => {
  test('[CL-03] only an Admin applies them; a contributor is told to propose a pull request', () => {
    studio.identify(BEN)
    for (const args of [
      ['disable', 'sample'],
      ['enable', 'sample'],
      ['remove', 'sample', '--yes'],
      ['create-module', 'extra', '--yes'],
    ]) {
      const result = studio.studio(...args)
      expect(result.status, args.join(' ')).toBe(1)
      expect(result.stderr).toContain('Only an Admin can apply shared changes')
      expect(result.stderr).toContain('pull request')
    }
    expect(studio.config().modules.sample).toBe(true)
    expect(studio.exists('src/modules/sample')).toBe(true)
    expect(studio.exists('src/modules/extra')).toBe(false)

    // Previews change nothing, so anyone may run them.
    expect(studio.studio('remove', 'sample').status).toBe(0)

    studio.identify(ADA)
    expect(studio.studio('disable', 'sample').status).toBe(0)
  })

  test('[CL-03] [CL-66] an unrecognised Git identity is told its email and how to link it', () => {
    studio.identify({ name: 'Nobody', email: 'nobody@endless.example' })
    const result = studio.studio('disable', 'sample')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('nobody@endless.example')
    expect(result.stderr).toContain('yarn studio join')
    expect(studio.config().modules.sample).toBe(true)
  })

  test('[CL-04] --as recovers an Admin after a Git email change, and never grants a role', () => {
    studio.identify({ ...ADA, email: 'ada@new.example' })
    const without = studio.studio('disable', 'sample')
    expect(without.status).toBe(1)
    expect(without.stderr).toContain('--as ada')

    expect(studio.studio('disable', 'sample', '--as', 'ada').status).toBe(0)
    expect(studio.config().modules.sample).toBe(false)

    studio.identify({ ...BEN, email: 'ben@new.example' })
    const ben = studio.studio('enable', 'sample', '--as', 'ben')
    expect(ben.status).toBe(1)
    expect(ben.stderr).toContain('not an Admin')

    const other = studio.studio('enable', 'sample', '--as', 'ada')
    expect(other.status).toBe(1)
    expect(other.stderr).toContain('--as ada refused')
  })
})
