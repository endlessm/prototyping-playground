import { describe, expect, test } from 'vitest'
import { packageStep } from '../../tooling/studio/package-manager'
import { Refusal } from '../../tooling/studio/output'

describe('package-manager steps', () => {
  test('[CL-06] a failing step stops with one sentence saying what to do next', () => {
    let error: unknown
    try {
      packageStep('.', 'yarn install', process.execPath, [
        '-e',
        'console.error(new Error("boom").stack); process.exit(3)',
      ])
    } catch (caught) {
      error = caught
    }
    expect(error).toBeInstanceOf(Refusal)
    const message = (error as Error).message
    expect(message.split('\n')).toHaveLength(1)
    expect(message).toContain('yarn install failed')
    expect(message).toContain('Run yarn install yourself')
    expect(message).not.toContain('boom')
  })

  test('[CL-06] a step that works says nothing', () => {
    expect(() =>
      packageStep('.', 'yarn install', process.execPath, ['-e', '']),
    ).not.toThrow()
  })
})
