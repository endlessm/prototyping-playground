// Which actions a system's "…" menu offers, shared by its card, row and
// navigation header, in the prototype menu's groups: reach it, change it,
// delete it last and alone. Archived systems offer only Restore and Delete,
// to Admins; the deployed site only copies a link.
import { describe, expect, test } from 'vitest'
import { systemMenu } from '../../src/modules/systems/utils/actions'

const ACTIVE = { archived: false, isDefault: false }
const menu = (context: Parameters<typeof systemMenu>[0]) =>
  systemMenu(context, (id) => id)

describe('a system’s menu', () => {
  test('[SY-41] [SY-43] [SY-44] [SY-61] an Admin, locally: reach it, change it, then delete it', () => {
    expect(
      menu({ ...ACTIVE, local: true, admin: true, maintainer: true }),
    ).toEqual([
      ['open', 'reveal', 'copyLink', 'copyPath'],
      ['rename', 'setDefault', 'archive'],
      ['delete'],
    ])
  })

  test('[SY-48] the default system’s item reads Default system', () => {
    expect(
      menu({
        archived: false,
        isDefault: true,
        local: true,
        admin: true,
        maintainer: true,
      })[1],
    ).toEqual(['rename', 'isDefault', 'archive'])
  })

  test('[SY-61] a maintainer renames; other contributors only reach it', () => {
    expect(
      menu({ ...ACTIVE, local: true, admin: false, maintainer: true }),
    ).toEqual([['open', 'reveal', 'copyLink', 'copyPath'], ['rename']])
    expect(
      menu({ ...ACTIVE, local: true, admin: false, maintainer: false }),
    ).toEqual([['open', 'reveal', 'copyLink', 'copyPath']])
  })

  test('[SY-42] [SY-62] the deployed site only copies the link', () => {
    expect(
      menu({ ...ACTIVE, local: false, admin: false, maintainer: false }),
    ).toEqual([['copyLink']])
  })

  test('[SY-53] an archived system offers Restore and Delete to Admins, and nothing to others', () => {
    expect(
      menu({
        archived: true,
        isDefault: false,
        local: true,
        admin: true,
        maintainer: true,
      }),
    ).toEqual([['restore'], ['delete']])
    expect(
      menu({
        archived: true,
        isDefault: false,
        local: true,
        admin: false,
        maintainer: true,
      }),
    ).toEqual([])
  })
})
