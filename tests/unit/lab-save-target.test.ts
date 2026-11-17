// Where a Breakdown's changes can go. A piece's knobs change its tag in the
// file the Breakdown shows; a piece whose tag lives in another file (an app
// component the file imports) has none, so no change is ever left behind
// unsaved. Save writes into your own experiment; on anyone else's, Admins
// included, it saves a copy of your own.
import { describe, expect, test } from 'vitest'
import { pieceElsewhere } from '../../src/modules/lab/utils/breakdown'
import { experimentSaveAs } from '../../src/modules/lab/utils/saving'
import type { BreakdownNode } from '../../tooling/systems/breakdown'

const node = (
  id: string,
  file: string | null,
  children: BreakdownNode[] = [],
): BreakdownNode => ({
  id,
  name: id,
  kind: 'component',
  source: 'nuxt-ui',
  file,
  library: null,
  repeated: false,
  children,
})

describe('a piece in another file', () => {
  const tree = node('root', 'src/prototypes/ben/x/One.vue', [
    node('root>USidebar', '@nuxt/ui/components/Sidebar.vue', [
      node('root>USidebar/Notifications', 'studios/Notifications/index.vue', [
        node(
          'root>USidebar/Notifications>UButton',
          '@nuxt/ui/components/Button.vue',
        ),
      ]),
    ]),
  ])

  test('[LAB-38] a tag of the file itself, or one of its slots, is here', () => {
    expect(pieceElsewhere(tree, 'root>USidebar')).toBeNull()
    expect(pieceElsewhere(tree, 'root>USidebar#header')).toBeNull()
    expect(pieceElsewhere(tree, 'root')).toBeNull()
  })

  test('[LAB-38] a tag inside an imported file names that file', () => {
    expect(pieceElsewhere(tree, 'root>USidebar/Notifications>UButton')).toBe(
      'studios/Notifications/index.vue',
    )
    expect(
      pieceElsewhere(tree, 'root>USidebar/Notifications>UButton#base'),
    ).toBe('studios/Notifications/index.vue')
  })
})

describe('where Save goes', () => {
  const ben = { key: 'ben', studioId: 'ben0000000000001', role: null }
  const admin = { key: 'ada', studioId: 'ada0000000000001', role: 'admin' }
  const bens = { owner: 'ben0000000000001', contributor: 'ben' }

  test('[LAB-42] your own experiment saves into its file', () => {
    expect(experimentSaveAs(ben, bens)).toBe('file')
    // A prototype without an owner is its folder's.
    expect(experimentSaveAs(ben, { owner: null, contributor: 'ben' })).toBe(
      'file',
    )
  })

  test('[LAB-42] anyone else’s, an Admin’s included, saves as your own', () => {
    expect(experimentSaveAs(admin, bens)).toBe('mine')
    expect(
      experimentSaveAs(ben, { owner: 'ada0000000000001', contributor: 'ada' }),
    ).toBe('mine')
    expect(experimentSaveAs({ key: null }, bens)).toBe('mine')
  })
})
