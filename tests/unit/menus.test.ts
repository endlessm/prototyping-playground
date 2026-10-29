import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { afterMenuCloses, menuGroups } from '../../app/utils/menus'

describe('menu groups', () => {
  test('[SH-59] groups keep their order, drop actions that don’t apply, and leave no empty group', () => {
    const create = { label: 'New view' }
    const copy = { label: 'Copy link' }
    const rename = { label: 'Rename' }
    const remove = { label: 'Delete' }
    expect(
      menuGroups([
        [create],
        [false, copy, null],
        [undefined],
        [rename],
        [remove],
      ]),
    ).toEqual([[create], [copy], [rename], [remove]])
    expect(menuGroups([[null], [false]])).toEqual([])
  })
})

describe('menu actions', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  test('[SH-60] an action runs only after the menu has closed', async () => {
    const action = vi.fn()
    afterMenuCloses(action, vi.fn())()
    expect(action).not.toHaveBeenCalled()
    await vi.runAllTimersAsync()
    expect(action).toHaveBeenCalledOnce()
  })

  test('[SH-60] a failing action reports its error', async () => {
    const failed = vi.fn()
    afterMenuCloses(async () => {
      throw new Error('The file is gone.')
    }, failed)()
    await vi.runAllTimersAsync()
    expect(failed).toHaveBeenCalledWith('The file is gone.')
  })
})
