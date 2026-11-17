// A Breakdown's node IDs, read the same way by the studio, the preview
// document and the tooling: a piece, its theme slot, and the piece whose
// file holds its tag.
import { describe, expect, test } from 'vitest'
import {
  fileOwnerOf,
  pieceOf,
  ROOT_NODE,
  slotId,
  slotOf,
} from '../../tooling/preview/protocol'

describe('node IDs', () => {
  test('[LAB-BD-32] a theme slot is its piece’s ID, then `#` and the slot', () => {
    const label = slotId('root>UButton', 'label')
    expect(label).toBe('root>UButton#label')
    expect(pieceOf(label)).toBe('root>UButton')
    expect(slotOf(label)).toBe('label')
    expect(pieceOf('root>UButton')).toBe('root>UButton')
    expect(slotOf('root>UButton')).toBeUndefined()
  })

  test('[LAB-BD-32] a piece’s tag lives in the file of the piece before its last `>`', () => {
    expect(fileOwnerOf(ROOT_NODE)).toBeNull()
    expect(fileOwnerOf('root>USidebar/UPopover')).toBe('root')
    expect(
      fileOwnerOf('root>USidebar/UPopover/Notifications>UButton~2#base'),
    ).toBe('root>USidebar/UPopover/Notifications')
  })
})
