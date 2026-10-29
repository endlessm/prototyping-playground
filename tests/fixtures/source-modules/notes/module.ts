import type { StudioModule } from '../../../../tooling/modules/contract.ts'

// A module with a file type of its own, for the scenarios that turn it off.
// Its files are plain text with a leading identity comment.
export default {
  id: 'notes',
  label: 'Notes',
  description: 'Plain notes, for the tests.',
  fileTypes: [
    {
      id: 'note',
      label: 'Note',
      extensions: ['.note'],
      identity: 'identity.ts',
      page: 'NotePage.vue',
    },
  ],
} satisfies StudioModule
