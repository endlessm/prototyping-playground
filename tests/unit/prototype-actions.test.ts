// Which actions a prototype's menus offer, and in what groups: reaching it
// (open in editor, show in the file browser, copy its link or path),
// changing it (rename, duplicate, archive, and what other modules add), and
// deleting it, last and alone. Archived prototypes offer only Restore and
// Delete.
import { describe, expect, test } from 'vitest'
import { prototypeMenu } from '../../src/modules/prototypes/utils/actions'

const menu = (
  context: { local: boolean; editable: boolean; archived: boolean },
  contributed: string[] = [],
) => prototypeMenu(context, (id) => id, contributed)

describe('a prototype’s menu', () => {
  test('[PR-30] the owner or an Admin, locally: reach, change, then delete', () => {
    expect(menu({ local: true, editable: true, archived: false })).toEqual([
      ['open', 'reveal', 'copyLink', 'copyPath'],
      ['rename', 'duplicate', 'archive'],
      ['delete'],
    ])
  })

  test('[PR-30] someone else, locally, may only reach it; the deployed site only copies its link', () => {
    expect(menu({ local: true, editable: false, archived: false })).toEqual([
      ['open', 'reveal', 'copyLink', 'copyPath'],
    ])
    expect(menu({ local: false, editable: false, archived: false })).toEqual([
      ['copyLink'],
    ])
  })

  test('[PR-31] an archived prototype offers only Restore and Delete, and nothing to others', () => {
    expect(menu({ local: true, editable: true, archived: true })).toEqual([
      ['restore'],
      ['delete'],
    ])
    expect(menu({ local: true, editable: false, archived: true })).toEqual([])
  })

  test('[PR-47] other modules’ actions join the changes, only for who may change it', () => {
    expect(
      menu({ local: true, editable: true, archived: false }, ['publish']),
    ).toEqual([
      ['open', 'reveal', 'copyLink', 'copyPath'],
      ['rename', 'duplicate', 'archive', 'publish'],
      ['delete'],
    ])
    expect(
      menu({ local: true, editable: false, archived: false }, ['publish']),
    ).toEqual([['open', 'reveal', 'copyLink', 'copyPath']])
    expect(
      menu({ local: true, editable: true, archived: true }, ['publish']),
    ).toEqual([['restore'], ['delete']])
  })
})
