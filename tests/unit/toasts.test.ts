import { expect, test } from 'vitest'
import { studioToast } from '../../app/utils/toasts'

test('[SH-57] confirmations close after 4 s and errors after 7 s', () => {
  expect(studioToast('success', 'Link copied')).toMatchObject({
    title: 'Link copied',
    color: 'success',
    duration: 4000,
  })
  expect(
    studioToast('error', 'Couldn’t save', 'The file is read-only.'),
  ).toMatchObject({
    title: 'Couldn’t save',
    description: 'The file is read-only.',
    color: 'error',
    duration: 7000,
  })
})
