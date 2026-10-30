import type { StudioModule } from '../../../tooling/modules/contract.ts'

// Documents: a `.md` file in a prototype is a written page, read in the
// studio's own style.
export default {
  id: 'document',
  label: 'Documents',
  description: 'A .md file in a prototype opens as a written page.',
  skills: [
    {
      path: 'skills/write-document/',
      when: 'asks for a document inside a prototype',
    },
  ],
  references: 'references.ts',
  fileTypes: [
    {
      id: 'document',
      label: 'Document',
      extensions: ['.md'],
      identity: 'types/document/identity.ts',
      check: 'types/document/check.ts',
      template: 'types/document/template.ts',
      page: 'types/document/DocumentPage.vue',
      icon: 'i-lucide-file-text',
      text: true,
    },
  ],
} satisfies StudioModule
